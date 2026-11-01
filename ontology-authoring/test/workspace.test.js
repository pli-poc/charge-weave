import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { WorkspaceStore } from '../src/workspace.js';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const schema = '# source\nMODULE|foundation\nRecord|root|A record.|\n';
test('atomic edits, durable receipts and stale revisions', () => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Test', baselineCommit: 'a'.repeat(40), schema });
  const request = { workspaceId: workspace.id, actor: 'architect', operationId: 'one', expectedRevision: 0, commands: [{ type: 'class.add', module: 'foundation', name: 'Example', parent: 'Record', definition: 'An example.' }] };
  const result = store.apply(request);
  assert.deepEqual(store.apply(request), result);
  assert.equal(store.search(workspace.id, 'example').results[0].name, 'Example');
  assert.throws(() => store.apply({ ...request, commands: [] }), /reused/);
  assert.throws(() => store.apply({ ...request, operationId: 'two' }), /Stale/);
  assert.throws(() => store.apply({ ...request, operationId: 'three', expectedRevision: 1, commands: [{ type: 'class.describe', name: 'Example', definition: 'Changed.' }, { type: 'class.add', name: 'Example' }] }), /Invalid/);
  assert.equal(store.get(workspace.id).revision, 1);
  assert.equal(store.search(workspace.id, 'example').results[0].definition, 'An example.');
  assert.equal(store.events(workspace.id).length, 1);
  assert.equal(store.snapshot(workspace.id).eventSequence, result.eventSequence);
  store.close();
});

test('typed fields reject unknown targets and reused global properties atomically', () => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Fields', baselineCommit: 'a'.repeat(40), schema });
  const base = { workspaceId: workspace.id, actor: 'architect', expectedRevision: 0 };
  assert.throws(() => store.apply({ ...base, operationId: 'bad', commands: [{ type: 'relationship.add', owner: 'Record', name: 'target', range: 'Missing', cardinality: '!' }] }), /Invalid/);
  store.apply({ ...base, operationId: 'good', commands: [{ type: 'property.add', owner: 'Record', name: 'title', range: 'string', cardinality: '!' }, { type: 'relationship.add', owner: 'Record', name: 'related', range: 'Record', cardinality: '*' }] });
  assert.match(store.get(workspace.id).schema, /title:string! related:Record\*/);
  assert.deepEqual(store.view(workspace.id, 'Record').edges.map(edge => edge.predicate), ['related']);
  assert.equal(store.diff(workspace.id).changes[0].kind, 'changed');
  assert.equal(store.diff(workspace.id).source.before, schema);
  assert.throws(() => store.apply({ ...base, expectedRevision: 1, operationId: 'duplicate', commands: [{ type: 'property.add', owner: 'Record', name: 'title', range: 'string', cardinality: '?' }] }), /Invalid/);
  assert.throws(() => store.apply({ ...base, expectedRevision: 1, operationId: 'bad-enum', commands: [{ type: 'property.add', owner: 'Record', name: 'state', range: '{Draft,Draft}', cardinality: '!' }] }), /Invalid/);
  store.apply({ ...base, expectedRevision: 1, operationId: 'enum', commands: [{ type: 'property.add', owner: 'Record', name: 'state', range: '{Draft,Confirmed,Cancelled}', cardinality: '!' }] });
  assert.match(store.get(workspace.id).schema, /state:\{Draft,Confirmed,Cancelled\}!/);
  store.close();
});

test('undo restores the latest group as an idempotent new revision', () => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Undo', baselineCommit: 'a'.repeat(40), schema });
  store.apply({ workspaceId: workspace.id, actor: 'test', operationId: 'edit', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Record', definition: 'Changed.' }] });
  const request = { workspaceId: workspace.id, actor: 'test', operationId: 'undo', expectedRevision: 1, targetRevision: 1 };
  const result = store.undo(request);
  assert.equal(result.revision, 2);
  assert.equal(store.get(workspace.id).schema, schema);
  assert.deepEqual(store.undo(request), result);
  assert.throws(() => store.undo({ ...request, operationId: 'again', expectedRevision: 2 }), /latest revision/);
  assert.equal(store.events(workspace.id)[1].payload.type, 'undo');
  store.close();
});

test('real repository schema is searchable and receipts survive restart', () => {
  const directory = mkdtempSync(join(tmpdir(), 'chargeweave-workspace-'));
  try {
    const path = join(directory, 'workspace.sqlite');
    let store = new WorkspaceStore(path);
    const workspace = store.create({ title: 'Real model', baselineCommit: 'a'.repeat(40), schema: readFileSync(new URL('../../model/domain.schema', import.meta.url), 'utf8') });
    assert.equal(store.search(workspace.id, 'ChargingStation').results.some(item => item.name === 'ChargingStation'), true);
    const request = { workspaceId: workspace.id, actor: 'architect', operationId: 'persisted', expectedRevision: 0, commands: [{ type: 'class.add', module: 'foundation', name: 'ExampleDraft', parent: 'Record', definition: 'A draft example.' }] };
    const result = store.apply(request);
    store.close();
    store = new WorkspaceStore(path);
    assert.deepEqual(store.apply(request), result);
    assert.equal(store.get(workspace.id).revision, 1);
    assert.equal(store.events(workspace.id)[0].sequence, result.eventSequence);
    store.close();
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
