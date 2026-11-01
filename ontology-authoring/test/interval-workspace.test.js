import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { applyPatch } from 'diff';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { editableSourcePaths, importSourceManifest } from '../src/source-manifest.js';
import { WorkspaceStore } from '../src/workspace.js';
import { createServer } from '../src/mcp.js';
import { runGenerator } from '../src/validation.js';

function intervalFixture() {
  const repository = fileURLToPath(new URL('../..', import.meta.url));
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim();
  const show = path => execFileSync('git', ['show', `${commit}:${path}`], { cwd: repository, encoding: 'utf8' });
  const sourceBlobs = Object.fromEntries([...editableSourcePaths].map(path => [path, show(path)]));
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Interval', baselineCommit: commit, schema: show('model/domain.schema'), sourceManifest: importSourceManifest(repository, commit), sourceBlobs });
  const requirement = store.requirementsSearch(workspace.id, 'BR-012').results.find(item => item.id === 'BR-012');
  const commands = [
    { type: 'class.add', name: 'PlannedServiceWindow', module: 'foundation', parent: 'Record', definition: 'A planned service window.' },
    { type: 'property.add', owner: 'PlannedServiceWindow', name: 'maintenanceStartsAt', range: 'dateTime', cardinality: '!' },
    { type: 'property.add', owner: 'PlannedServiceWindow', name: 'maintenanceEndsAt', range: 'dateTime', cardinality: '!' },
    { type: 'requirement.link', requirementId: requirement.id, className: 'PlannedServiceWindow', expectedClasses: requirement.classes },
    { type: 'temporal.policy_set', className: 'PlannedServiceWindow', expectedPolicy: null, policy: 'snapshot-versioned' },
    { type: 'constraint.add', template: 'valid-interval', owner: 'PlannedServiceWindow', startProperty: 'maintenanceStartsAt', endProperty: 'maintenanceEndsAt', expectedStartCardinality: '!', expectedEndCardinality: '!', requirementId: requirement.id, expectedRules: requirement.rules, ruleId: 'B900' },
  ];
  return { repository, sourceBlobs, store, workspace, commands };
}

test('interval template creates and undoes the complete multi-source draft', async () => {
  const { sourceBlobs, store, workspace, commands } = intervalFixture();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createServer(store, 'codex');
  const client = new Client({ name: 'test', version: '1' });
  try {
    await server.connect(serverTransport); await client.connect(clientTransport);
    const templates = await client.callTool({ name: 'ontology_constraint_templates', arguments: { workspaceId: workspace.id } });
    assert.ok(templates.structuredContent.templates.some(item => item.id === 'valid-interval'));
    assert.throws(() => store.apply({ workspaceId: workspace.id, actor: 'test', operationId: 'reuse', expectedRevision: 0, commands: [{ ...commands.at(-1), owner: 'TimeWindow', startProperty: 'startsAt', endProperty: 'endsAt' }] }), /review existing rules for reuse/);
    const result = await client.callTool({ name: 'ontology_changeset_apply', arguments: { workspaceId: workspace.id, operationId: 'interval', expectedRevision: 0, commands } });
    assert.equal(result.structuredContent.revision, 1, JSON.stringify(result));
    const candidate = store.get(workspace.id), diff = store.diff(workspace.id);
    assert.equal(diff.additionalSources.length, 6);
    for (const item of diff.additionalSources) assert.equal(applyPatch(sourceBlobs[item.path], item.patch), candidate.sourceOverlays[item.path]);
    assert.equal(JSON.parse(candidate.sourceOverlays['model/audit-rules.json']).at(-1).id, 'B900');
    assert.ok(JSON.parse(candidate.sourceOverlays['tests/negative-cases.json']).B900);
    assert.deepEqual(JSON.parse(candidate.sourceOverlays['tests/business-acceptance.json']).filter(item => item.rule === 'B900').map(item => item.expectedConformance), [true, false, false]);
    assert.equal(JSON.parse(candidate.sourceOverlays['model/authoring-example-overrides.json']).PlannedServiceWindow.maintenanceEndsAt, '2026-09-25T11:00:00Z');
    assert.throws(() => store.apply({ workspaceId: workspace.id, actor: 'test', operationId: 'duplicate', expectedRevision: 1, commands: [{ ...commands.at(-1), expectedRules: [...commands.at(-1).expectedRules, 'B900'] }] }), /already in use/);
    store.undo({ workspaceId: workspace.id, actor: 'test', operationId: 'undo', expectedRevision: 1, targetRevision: 1 });
    assert.equal(store.get(workspace.id).sourceDigest, workspace.sourceDigest);
    assert.deepEqual(store.get(workspace.id).sourceOverlays, {});
  } finally { await client.close(); store.close(); }
});

test('real interval candidate passes reference and focused business decisions', { skip: !process.env.CHARGEWEAVE_TEST_RULE_TEMPLATE, timeout: 900000 }, async () => {
  const { repository, sourceBlobs, store, workspace, commands } = intervalFixture();
  try {
    store.apply({ workspaceId: workspace.id, actor: 'test', operationId: 'interval', expectedRevision: 0, commands });
    const candidate = store.get(workspace.id), job = store.createJob(workspace.id, 1, candidate.sourceDigest, 'test', 'reference', 'reference').job;
    await runGenerator(store, candidate, job, repository, process.env.CHARGEWEAVE_TEST_PYTHON);
    const result = store.job(workspace.id, job.id);
    assert.equal(result.status, 'passed', result.output);
    const negatives = result.steps.find(step => step.checkName === 'tools/test_business.py');
    const decisions = result.steps.find(step => step.checkName === 'tools/test_business_acceptance.py');
    const negativeCount = Object.keys(JSON.parse(sourceBlobs['tests/negative-cases.json'])).length + 1;
    const decisionCount = JSON.parse(sourceBlobs['tests/business-acceptance.json']).length + 3;
    assert.match(negatives.output, new RegExp(`'passed': ${negativeCount}, 'total': ${negativeCount}`));
    assert.match(decisions.output, new RegExp(`'passed': ${decisionCount}, 'total': ${decisionCount}`));
    assert.equal(result.steps.find(step => step.checkName === 'tools/validate.py --meta').status, 'passed');
    const audit = store.createJob(workspace.id, 1, candidate.sourceDigest, 'test', 'audit', 'audit').job;
    await runGenerator(store, candidate, audit, repository, process.env.CHARGEWEAVE_TEST_PYTHON);
    const auditResult = store.job(workspace.id, audit.id);
    assert.equal(auditResult.status, 'failed', auditResult.output);
    assert.match(auditResult.output, /B900:independent-positive-and-negative/);
  } finally { store.close(); }
});
