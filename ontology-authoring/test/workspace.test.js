import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { WorkspaceStore } from '../src/workspace.js';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createHash, randomUUID } from 'node:crypto';

const schema = '# source\nMODULE|foundation\nRecord|root|A record.|\n';
test('candidate identity binds the pinned baseline', () => {
  const store = new WorkspaceStore(':memory:');
  const first = store.create({ title: 'One', baselineCommit: 'a'.repeat(40), schema });
  const second = store.create({ title: 'Two', baselineCommit: 'b'.repeat(40), schema });
  assert.equal(first.digestVersion, 2);
  assert.notEqual(first.sourceDigest, second.sourceDigest);
  store.close();
});

test('legacy workspace digests and undo remain usable without rewriting receipts', () => {
  const directory = mkdtempSync(join(tmpdir(), 'chargeweave-legacy-'));
  try {
    const path = join(directory, 'store.sqlite'), id = randomUUID();
    const hash = value => createHash('sha256').update(value).digest('hex');
    const digest = hash(JSON.stringify({ adapter: 'domain-schema-v1', sources: { 'model/domain.schema': hash(schema) } }));
    const db = new DatabaseSync(path);
    db.exec('CREATE TABLE workspaces (id TEXT PRIMARY KEY, title TEXT NOT NULL, baseline_commit TEXT NOT NULL, baseline_schema TEXT NOT NULL, schema TEXT NOT NULL, revision INTEGER NOT NULL, digest TEXT NOT NULL)');
    db.prepare('INSERT INTO workspaces VALUES (?, ?, ?, ?, ?, 0, ?)').run(id, 'Legacy', 'a'.repeat(40), schema, schema, digest);
    db.close();
    const store = new WorkspaceStore(path);
    assert.equal(store.get(id).digestVersion, 1);
    assert.equal(store.get(id).sourceDigest, digest);
    assert.ok(store.reviewReadiness(id).missing.includes('legacy digest does not bind the baseline commit'));
    store.apply({ workspaceId: id, actor: 'test', operationId: 'edit', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Record', definition: 'Changed.' }] });
    store.undo({ workspaceId: id, actor: 'test', operationId: 'undo', expectedRevision: 1, targetRevision: 1 });
    assert.equal(store.get(id).sourceDigest, digest);
    store.close();
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
test('atomic edits, durable receipts and stale revisions', () => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Test', baselineCommit: 'a'.repeat(40), schema });
  const request = { workspaceId: workspace.id, actor: 'architect', operationId: 'one', expectedRevision: 0, commands: [{ type: 'class.add', module: 'foundation', name: 'Example', parent: 'Record', definition: 'An example.' }] };
  const result = store.apply(request);
  assert.deepEqual(store.apply(request), result);
  assert.equal(store.search(workspace.id, 'example').results[0].name, 'Example');
  assert.throws(() => store.view(workspace.id, 'Example', 0), /Revision conflict/);
  assert.throws(() => store.search(workspace.id, 'example', 25, 0), /Revision conflict/);
  assert.throws(() => store.apply({ ...request, commands: [] }), /reused/);
  assert.throws(() => store.apply({ ...request, operationId: 'two' }), /Stale/);
  assert.throws(() => store.apply({ ...request, operationId: 'three', expectedRevision: 1, commands: [{ type: 'class.describe', name: 'Example', definition: 'Changed.' }, { type: 'class.add', name: 'Example' }] }), /Invalid/);
  assert.equal(store.get(workspace.id).revision, 1);
  assert.equal(store.search(workspace.id, 'example').results[0].definition, 'An example.');
  assert.equal(store.events(workspace.id).length, 1);
  assert.equal(store.snapshot(workspace.id).eventSequence, result.eventSequence);
  assert.equal(store.reviewReadiness(workspace.id).canAccept, false);
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

test('event predecessors are workspace-specific despite interleaved global sequences', () => {
  const store = new WorkspaceStore(':memory:');
  const first = store.create({ title: 'First', baselineCommit: 'a'.repeat(40), schema });
  const second = store.create({ title: 'Second', baselineCommit: 'a'.repeat(40), schema });
  const edit = (workspaceId, expectedRevision, operationId) => store.apply({ workspaceId, actor: 'test', operationId, expectedRevision, commands: [{ type: 'class.describe', name: 'Record', definition: operationId }] });
  const a = edit(first.id, 0, 'one');
  const b = edit(second.id, 0, 'other');
  const c = edit(first.id, 1, 'two');
  assert.equal(store.events(first.id, a.eventSequence)[0].previousSequence, a.eventSequence);
  assert.equal(store.hasCursor(first.id, b.eventSequence), false);
  assert.equal(store.hasCursor(first.id, c.eventSequence), true);
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
