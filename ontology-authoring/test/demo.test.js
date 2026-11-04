import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { WorkspaceStore } from '../src/workspace.js';
import { createHttpService } from '../src/http.js';
import { maintenanceCommands, runMaintenanceDemo } from '../src/maintenance-demo.js';
import { importSourceManifest } from '../src/source-manifest.js';
import { runGenerator } from '../src/validation.js';

test('scripted maintenance scenario shares edits and recovers after restart', async () => {
  const repository = fileURLToPath(new URL('../..', import.meta.url));
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim();
  const schema = execFileSync('git', ['show', `${commit}:model/domain.schema`], { cwd: repository, encoding: 'utf8' });
  const directory = mkdtempSync(join(tmpdir(), 'chargeweave-demo-'));
  const path = join(directory, 'workspace.sqlite');
  const token = 'synthetic-demo-token-'.repeat(2);
  let store, service, workspaceId;
  const clients = [];
  async function open() {
    service = createHttpService({ store, token, workspaceId });
    service.listen(0, '127.0.0.1'); await once(service, 'listening');
    const url = new URL(`http://127.0.0.1:${service.address().port}/mcp`);
    for (const name of ['scripted-codex', 'scripted-browser']) {
      const client = new Client({ name, version: '1' });
      await client.connect(new StreamableHTTPClientTransport(url, { requestInit: { headers: { authorization: `Bearer ${token}` } } }));
      clients.push(client);
    }
  }
  async function close() {
    for (const client of clients.splice(0)) await client.close();
    if (service) await new Promise(resolve => service.close(resolve));
    service = null; store.close(); store = null;
  }
  const invoke = async (client, name, args) => {
    const response = await client.callTool({ name, arguments: args });
    assert.notEqual(response.isError, true, JSON.stringify(response));
    return response.structuredContent;
  };
  try {
    store = new WorkspaceStore(path);
    const workspace = store.create({ title: 'Synthetic maintenance', baselineCommit: commit, schema });
    workspaceId = workspace.id;
    await open();
    for (const name of ['ChargingStation', 'TimeWindow', 'WorkOrder', 'LegalEntity']) {
      const found = await invoke(clients[0], 'ontology_context_search', { workspaceId: workspace.id, query: name });
      assert.ok(found.results.some(item => item.name === name));
    }
    const commands = [
      { type: 'class.add', name: 'PlannedMaintenanceWindow', module: 'foundation', parent: 'Record', definition: 'A planned interval of charging station unavailability.' },
      ...[['maintenanceStation', 'ChargingStation', '!'], ['maintenanceInterval', 'TimeWindow', '!'], ['maintenanceWorkOrder', 'WorkOrder', '?'], ['maintenanceAccountableParty', 'LegalEntity', '!']].map(([name, range, cardinality]) => ({ type: 'relationship.add', owner: 'PlannedMaintenanceWindow', name, range, cardinality })),
      { type: 'property.add', owner: 'PlannedMaintenanceWindow', name: 'maintenanceReason', range: 'string', cardinality: '!' },
      { type: 'property.add', owner: 'PlannedMaintenanceWindow', name: 'maintenancePlanningState', range: '{Draft,Confirmed,Cancelled}', cardinality: '!' },
    ];
    const request = { workspaceId: workspace.id, operationId: 'demo-proposal', expectedRevision: 0, commands };
    const proposal = await invoke(clients[0], 'ontology_changeset_apply', request);
    const graph = await invoke(clients[1], 'ontology_view_get', { workspaceId: workspace.id, root: 'PlannedMaintenanceWindow' });
    assert.equal(graph.revision, proposal.revision);
    assert.ok(graph.edges.some(edge => edge.predicate === 'maintenanceStation' && edge.target === 'ChargingStation'));
    await invoke(clients[1], 'ontology_changeset_apply', { workspaceId: workspace.id, operationId: 'manual-refinement', expectedRevision: 1, commands: [{ type: 'class.describe', name: 'PlannedMaintenanceWindow', definition: 'A scheduled interval of charging station unavailability.' }] });
    await invoke(clients[1], 'ontology_changeset_undo', { workspaceId: workspace.id, operationId: 'undo-refinement', expectedRevision: 2, targetRevision: 2 });
    const cursor = store.snapshot(workspace.id).eventSequence;
    await close();
    store = new WorkspaceStore(path); await open();
    const retry = await invoke(clients[0], 'ontology_changeset_apply', request);
    assert.deepEqual(retry, proposal);
    const recovered = await invoke(clients[1], 'ontology_workspace_get', { workspaceId: workspace.id });
    assert.equal(recovered.revision, 3);
    assert.equal(recovered.eventSequence, cursor);
    assert.equal(store.events(workspace.id).length, 3);
  } finally { if (store) await close(); rmSync(directory, { recursive: true, force: true }); }
});

test('runnable scripted demonstration preserves a concurrent manual edit and rejects stale writes', async () => {
  const repository = fileURLToPath(new URL('../..', import.meta.url));
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim();
  const schema = execFileSync('git', ['show', `${commit}:model/domain.schema`], { cwd: repository, encoding: 'utf8' });
  const store = new WorkspaceStore(':memory:');
  const policy = execFileSync('git', ['show', `${commit}:model/temporal-policy.json`], { cwd: repository, encoding: 'utf8' });
  const mapping = execFileSync('git', ['show', `${commit}:model/responsibility-bindings.json`], { cwd: repository, encoding: 'utf8' });
  const workspace = store.create({ title: 'Scripted demonstration', baselineCommit: commit, schema, sourceManifest: importSourceManifest(repository, commit), sourceBlobs: { 'model/temporal-policy.json': policy, 'model/responsibility-bindings.json': mapping } });
  const token = 'synthetic-demo-token-'.repeat(2);
  const service = createHttpService({ store, token, workspaceId: workspace.id, repository });
  const clients = [];
  try {
    service.listen(0, '127.0.0.1'); await once(service, 'listening');
    const url = new URL(`http://127.0.0.1:${service.address().port}/mcp`);
    for (const name of ['scripted-demonstration', 'manual-client']) {
      const client = new Client({ name, version: '1' });
      await client.connect(new StreamableHTTPClientTransport(url, { requestInit: { headers: { authorization: `Bearer ${token}` } } }));
      clients.push(client);
    }
    const messages = [];
    const result = await runMaintenanceDemo(clients[0], workspace.id, { validate: false, log: message => messages.push(message), waitForEdit: async ({ changeSetId }) => {
      const response = await clients[1].callTool({ name: 'ontology_changeset_apply', arguments: { workspaceId: workspace.id, changeSetId, operationId: 'manual-edit', expectedRevision: 1, commands: [{ type: 'class.describe', name: 'PlannedMaintenanceWindow', definition: 'A reviewer-refined maintenance window.' }] } });
      assert.equal(response.isError, undefined);
    } });
    assert.equal(result.revision, 2);
    assert.equal(store.snapshot(workspace.id).changeSet.id, result.changeSetId);
    assert.equal(store.snapshot(workspace.id).changeSet.status, 'draft');
    assert.equal(result.job, null);
    assert.ok(result.graph.edges.some(edge => edge.predicate === 'maintenanceStation' && edge.target === 'ChargingStation'));
    assert.equal(result.temporal.policy, 'snapshot-versioned');
    assert.ok(result.temporal.fields.some(field => field.property === 'maintenanceInterval'));
    assert.ok(result.responsibility.bindings.some(binding => binding.property === 'maintenanceAccountableParty'));
    assert.equal(store.entity(workspace.id, 'PlannedMaintenanceWindow').entity.definition, 'A reviewer-refined maintenance window.');
    assert.ok(messages.some(message => message.includes('stale edit was rejected')));
    assert.equal(store.events(workspace.id).filter(event => event.payload.commands?.length).length, 2);
  } finally { for (const client of clients) await client.close(); await service.shutdown(); store.close(); }
});

test('real maintenance fixture profile checks positive and adverse cases', { skip: !process.env.CHARGEWEAVE_TEST_MAINTENANCE, timeout: 600000 }, async () => {
  const repository = process.env.CHARGEWEAVE_TEST_REPOSITORY || fileURLToPath(new URL('../..', import.meta.url));
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim();
  const schema = execFileSync('git', ['show', `${commit}:model/domain.schema`], { cwd: repository, encoding: 'utf8' });
  const store = new WorkspaceStore(':memory:');
  try {
    const policy = execFileSync('git', ['show', `${commit}:model/temporal-policy.json`], { cwd: repository, encoding: 'utf8' });
    const mapping = execFileSync('git', ['show', `${commit}:model/responsibility-bindings.json`], { cwd: repository, encoding: 'utf8' });
    const workspace = store.create({ title: 'Maintenance fixtures', baselineCommit: commit, schema, sourceManifest: importSourceManifest(repository, commit), sourceBlobs: { 'model/temporal-policy.json': policy, 'model/responsibility-bindings.json': mapping } });
    store.apply({ workspaceId: workspace.id, actor: 'test', operationId: 'proposal', expectedRevision: 0, commands: maintenanceCommands() });
    const candidate = store.get(workspace.id);
    const job = store.createJob(workspace.id, 1, candidate.sourceDigest, 'test', 'fixtures', 'maintenance-demo').job;
    await runGenerator(store, candidate, job, repository, process.env.CHARGEWEAVE_TEST_PYTHON);
    const result = store.job(workspace.id, job.id);
    assert.equal(result.status, 'passed', result.output);
    const output = result.steps.find(step => step.checkName === 'tools/test_authoring_maintenance_demo.py').output;
    const evidence = JSON.parse(output.split(/\r?\n/).find(line => line.trim().startsWith('{')));
    assert.equal(evidence.passed, 8);
    assert.equal(evidence.total, 8);
    assert.deepEqual(evidence.cases.filter(item => !item.expectedConformance).map(item => item.case), ['missing-station', 'invalid-planning-state', 'reversed-shared-interval']);
  } finally { store.close(); }
});
