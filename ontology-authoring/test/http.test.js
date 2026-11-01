import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { once } from 'node:events';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { WorkspaceStore } from '../src/workspace.js';
import { createHttpService } from '../src/http.js';
import { editableSourcePaths } from '../src/source-manifest.js';

test('reviewer creates a scoped workspace idempotently from a committed baseline', { timeout: 120000 }, async () => {
  const repo = mkdtempSync(join(tmpdir(), 'chargeweave-create-'));
  const git = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const put = (path, content) => { mkdirSync(dirname(join(repo, path)), { recursive: true }); writeFileSync(join(repo, path), content); };
  git('init'); git('config', 'user.email', 'test@example.invalid'); git('config', 'user.name', 'Test');
  git('remote', 'add', 'origin', 'https://github.com/pli-poc/charge-weave.git');
  put('model/domain.schema', 'MODULE|foundation\nRecord|root|A record.|\n');
  for (const path of editableSourcePaths) put(path, '{}\n');
  for (const path of ['tools/authoring_adapter.py', 'tools/domain_schema.py']) {
    mkdirSync(dirname(join(repo, path)), { recursive: true });
    copyFileSync(fileURLToPath(new URL(`../../${path}`, import.meta.url)), join(repo, path));
  }
  git('add', '.'); git('commit', '-m', 'Baseline'); const baselineCommit = git('rev-parse', 'HEAD');
  const store = new WorkspaceStore(':memory:');
  const original = store.create({ title: 'Original', baselineCommit, schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const hidden = store.create({ title: 'Hidden', baselineCommit, schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const token = 'a'.repeat(32), reviewerToken = 'b'.repeat(32);
  let service = createHttpService({ store, token, reviewerToken, workspaceId: original.id, repository: repo, allowWorkspaceCreate: true });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  const url = new URL(`http://127.0.0.1:${service.address().port}/mcp`);
  const clients = [];
  try {
    for (const secret of [token, reviewerToken]) {
      const client = new Client({ name: 'test', version: '1' });
      await client.connect(new StreamableHTTPClientTransport(url, { requestInit: { headers: { authorization: `Bearer ${secret}` } } }));
      clients.push(client);
    }
    const [draft, reviewer] = clients;
    assert.equal((await draft.listTools()).tools.some(tool => tool.name === 'ontology_workspace_create'), false);
    assert.equal((await reviewer.listTools()).tools.some(tool => tool.name === 'ontology_workspace_create'), true);
    const args = { title: 'New workspace', baselineCommit, operationId: 'create-one' };
    const invoke = arguments_ => reviewer.callTool({ name: 'ontology_workspace_create', arguments: arguments_ });
    assert.equal((await invoke({ ...args, baselineCommit: 'f'.repeat(40) })).structuredContent.error.code, 'BASELINE_UNAVAILABLE');
    const created = (await invoke(args)).structuredContent;
    assert.ok(created.workspaceId);
    assert.deepEqual((await invoke(args)).structuredContent, created);
    assert.equal((await invoke({ ...args, title: 'Different' })).isError, true);
    assert.deepEqual((await draft.callTool({ name: 'ontology_workspace_list', arguments: {} })).structuredContent.workspaces.map(item => item.workspaceId), [original.id, created.workspaceId]);
    assert.equal((await draft.callTool({ name: 'ontology_workspace_get', arguments: { workspaceId: created.workspaceId } })).isError, undefined);
    assert.equal((await draft.callTool({ name: 'ontology_workspace_get', arguments: { workspaceId: hidden.id } })).isError, true);
    for (const client of clients.splice(0)) await client.close();
    await service.shutdown();
    service = createHttpService({ store, token, reviewerToken, workspaceId: original.id, repository: repo, allowWorkspaceCreate: true });
    service.listen(0, '127.0.0.1'); await once(service, 'listening');
    const restarted = new Client({ name: 'reviewer-after-restart', version: '1' });
    await restarted.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${service.address().port}/mcp`), { requestInit: { headers: { authorization: `Bearer ${reviewerToken}` } } })); clients.push(restarted);
    assert.equal((await restarted.callTool({ name: 'ontology_workspace_get', arguments: { workspaceId: created.workspaceId } })).isError, true);
    assert.deepEqual((await restarted.callTool({ name: 'ontology_workspace_create', arguments: args })).structuredContent, created);
    assert.equal((await restarted.callTool({ name: 'ontology_workspace_get', arguments: { workspaceId: created.workspaceId } })).isError, undefined);
  } finally { for (const client of clients) await client.close(); await service.shutdown(); store.close(); rmSync(repo, { recursive: true, force: true }); }
});

test('loopback MCP transport authenticates and shares state', async () => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Network', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const other = store.create({ title: 'Other', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const token = 'a'.repeat(32);
  const reviewerToken = 'b'.repeat(32);
  const service = createHttpService({ store, token, reviewerToken, workspaceId: workspace.id, allowedOrigin: 'http://127.0.0.1:5173' });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  const url = new URL(`http://127.0.0.1:${service.address().port}/mcp`);
  try {
    const health = await fetch(new URL('/health', url));
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { status: 'ok', service: 'chargeweave-ontology-authoring', version: '0.1.0' });
    assert.equal((await fetch(new URL('/health', url), { headers: { origin: 'https://untrusted.example' } })).status, 403);
    assert.equal((await fetch(url, { method: 'POST' })).status, 401);
    assert.equal((await fetch(url, { method: 'POST', headers: { origin: 'https://untrusted.example', authorization: `Bearer ${token}` } })).status, 403);
    assert.equal((await fetch(url, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: JSON.stringify({ value: 'x'.repeat(600000) }) })).status, 413);
    const clients = [];
    for (const name of ['codex', 'browser']) {
      const client = new Client({ name, version: '1' });
      await client.connect(new StreamableHTTPClientTransport(url, { requestInit: { headers: { authorization: `Bearer ${token}` } } }));
      clients.push(client);
    }
    const [first, second] = clients;
    const templates = (await first.listResourceTemplates()).resourceTemplates;
    assert.ok(templates.some(item => item.uriTemplate === 'ontology://workspace/{workspaceId}/v1/summary'));
    const readJson = async uri => JSON.parse((await first.readResource({ uri })).contents[0].text);
    const summary = await readJson(`ontology://workspace/${workspace.id}/v1/summary`);
    assert.equal(summary.workspaceId, workspace.id);
    assert.equal(summary.contractVersion, 'chargeweave-resource-v1');
    assert.equal(Object.hasOwn(summary, 'schema'), false);
    const entity = await readJson(`ontology://workspace/${workspace.id}/v1/entity/${encodeURIComponent('https://example.org/charge-domain#Record')}`);
    assert.equal(entity.entity.name, 'Record');
    await assert.rejects(first.readResource({ uri: `ontology://workspace/${other.id}/v1/summary` }), /authorized/);
    const listed = (await first.callTool({ name: 'ontology_workspace_list', arguments: {} })).structuredContent.workspaces;
    assert.deepEqual(listed.map(item => item.workspaceId), [workspace.id]);
    assert.equal(listed[0].baselineCommit, workspace.baselineCommit);
    const denied = await first.callTool({ name: 'ontology_workspace_get', arguments: { workspaceId: other.id } });
    assert.equal(denied.isError, true);
    assert.equal(denied.structuredContent.error.code, 'SCOPE_DENIED');
    assert.equal((await first.callTool({ name: 'ontology_changeset_apply', arguments: { workspaceId: other.id, operationId: 'denied', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Record', definition: 'Forbidden.' }] } })).isError, true);
    const deniedSet = await first.callTool({ name: 'ontology_changeset_open', arguments: { workspaceId: other.id, operationId: 'denied-set', expectedRevision: 0, intent: 'Forbidden change.' } });
    assert.equal(deniedSet.structuredContent.error.code, 'SCOPE_DENIED');
    assert.equal((await fetch(new URL(`/events?workspaceId=${other.id}`, url), { headers: { authorization: `Bearer ${token}` } })).status, 403);
    assert.equal((await fetch(new URL(`/events?workspaceId=${workspace.id}&after=999`, url), { headers: { authorization: `Bearer ${token}` } })).status, 409);
    assert.equal(store.get(other.id).revision, 0);
    assert.equal((await first.listTools()).tools.some(tool => tool.name === 'ontology_review_readiness'), false);
    const reviewer = new Client({ name: 'reviewer', version: '1' });
    await reviewer.connect(new StreamableHTTPClientTransport(url, { requestInit: { headers: { authorization: `Bearer ${reviewerToken}` } } }));
    assert.equal((await reviewer.listTools()).tools.some(tool => tool.name === 'ontology_review_readiness'), true);
    const readiness = (await reviewer.callTool({ name: 'ontology_review_readiness', arguments: { workspaceId: workspace.id } })).structuredContent;
    assert.equal(readiness.canAccept, false);
    assert.ok(readiness.missing.includes('audit'));
    const args = { workspaceId: workspace.id, operationId: 'network-edit', expectedRevision: 0, commands: [{ type: 'class.add', name: 'NetworkExample', module: 'foundation', parent: 'Record', definition: 'An example.' }] };
    assert.equal((await first.callTool({ name: 'ontology_changeset_apply', arguments: args })).structuredContent.revision, 1);
    const changes = await readJson(`ontology://workspace/${workspace.id}/v1/changes`);
    assert.equal(changes.changes[0].name, 'NetworkExample');
    assert.equal(changes.revision, 1);
    assert.equal((await second.callTool({ name: 'ontology_context_search', arguments: { workspaceId: workspace.id, query: 'NetworkExample' } })).structuredContent.results.length, 1);
    const viewArgs = { workspaceId: workspace.id, viewId: 'default', operationId: 'network-view', expectedViewRevision: 0, definition: { root: 'NetworkExample', positions: { NetworkExample: { x: 12, y: 34 } } } };
    assert.equal((await first.callTool({ name: 'ontology_view_save', arguments: { ...viewArgs, workspaceId: other.id } })).isError, true);
    assert.equal((await first.callTool({ name: 'ontology_view_save', arguments: viewArgs })).structuredContent.viewRevision, 1);
    assert.deepEqual((await second.callTool({ name: 'ontology_view_saved_get', arguments: { workspaceId: workspace.id, viewId: 'default' } })).structuredContent.definition, viewArgs.definition);
    const named = { ...viewArgs, viewId: 'review', operationId: 'review-view', definition: { ...viewArgs.definition, mappingVersion: 'chargeweave-authoring-v1', viewpoint: 'information', groups: [{ name: 'Core', members: ['NetworkExample'] }], annotations: [{ target: 'NetworkExample', text: 'Review this concept.' }] } };
    assert.equal((await first.callTool({ name: 'ontology_view_save', arguments: named })).structuredContent.viewRevision, 1);
    assert.deepEqual((await second.callTool({ name: 'ontology_view_saved_get', arguments: { workspaceId: workspace.id, viewId: 'review' } })).structuredContent.definition, named.definition);
    assert.deepEqual((await second.callTool({ name: 'ontology_view_saved_list', arguments: { workspaceId: workspace.id } })).structuredContent.views.map(item => item.viewId), ['default', 'review']);
    assert.equal(store.get(workspace.id).revision, 1);
    const controller = new AbortController();
    const feed = await fetch(new URL(`/events?workspaceId=${workspace.id}&after=0`, url), { headers: { authorization: `Bearer ${token}` }, signal: controller.signal });
    assert.equal(feed.status, 200);
    const reader = feed.body.getReader();
    const chunk = new TextDecoder().decode((await reader.read()).value);
    assert.match(chunk, /event: workspace-change/);
    assert.match(chunk, /"previousSequence":0/);
    assert.match(chunk, /NetworkExample/);
    controller.abort();
    await reviewer.close();
    for (const client of clients) await client.close();
  } finally { await service.shutdown(); store.close(); }
});

test('shutdown closes connected event streams', async () => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Shutdown', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const token = 'a'.repeat(32), service = createHttpService({ store, token, workspaceId: workspace.id });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  const response = await fetch(`http://127.0.0.1:${service.address().port}/events?workspaceId=${workspace.id}`, { headers: { authorization: `Bearer ${token}` } });
  assert.equal(response.status, 200);
  await service.shutdown();
  store.close();
});

test('shutdown waits for active validation before the store is closed', async () => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Drain', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  const token = 'a'.repeat(32);
  const service = createHttpService({ store, token, workspaceId: workspace.id, repository: '.', validationRunner: async (target, input, job) => { await pending; target.updateJob(job.id, 'passed'); } });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  const client = new Client({ name: 'test', version: '1' });
  await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${service.address().port}/mcp`), { requestInit: { headers: { authorization: `Bearer ${token}` } } }));
  const result = await client.callTool({ name: 'ontology_validation_start', arguments: { workspaceId: workspace.id, operationId: 'drain', expectedRevision: 0, sourceDigest: workspace.sourceDigest } });
  const shutdown = service.shutdown();
  let finished = false; void shutdown.then(() => { finished = true; });
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(finished, false);
  release(); await shutdown;
  assert.equal(store.job(workspace.id, result.structuredContent.id).status, 'passed');
  await client.close(); store.close();
});

test('cancellation is scoped, idempotent and waits for the active step', async () => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Cancel', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  const token = 'a'.repeat(32);
  const service = createHttpService({ store, token, workspaceId: workspace.id, repository: '.', validationRunner: async (target, input, job, repository, python, signal) => { target.updateJob(job.id, 'running'); await pending; target.updateJob(job.id, signal.aborted ? 'cancelled' : 'passed'); } });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  const client = new Client({ name: 'test', version: '1' });
  await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${service.address().port}/mcp`), { requestInit: { headers: { authorization: `Bearer ${token}` } } }));
  try {
    const started = await client.callTool({ name: 'ontology_validation_start', arguments: { workspaceId: workspace.id, operationId: 'start', expectedRevision: 0, sourceDigest: workspace.sourceDigest } });
    const request = { workspaceId: workspace.id, jobId: started.structuredContent.id, operationId: 'cancel' };
    const cancelled = await client.callTool({ name: 'ontology_job_cancel', arguments: request });
    assert.equal(cancelled.structuredContent.status, 'cancelling');
    assert.equal((await client.callTool({ name: 'ontology_job_cancel', arguments: request })).structuredContent.status, 'cancelling');
    assert.throws(() => store.createJob(workspace.id, 0, workspace.sourceDigest, 'test', 'another'), /already active/);
    release();
    await new Promise(resolve => setTimeout(resolve, 10));
    assert.equal(store.job(workspace.id, request.jobId).status, 'cancelled');
    const evidence = JSON.parse((await client.readResource({ uri: `ontology://workspace/${workspace.id}/v1/evidence/${request.jobId}` })).contents[0].text);
    assert.equal(evidence.status, 'cancelled');
    assert.equal(evidence.completeAcceptanceEvidence, false);
    assert.equal(Object.hasOwn(evidence, 'output'), false);
  } finally { release(); await client.close(); await service.shutdown(); store.close(); }
});
