import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { WorkspaceStore } from '../src/workspace.js';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createHash, randomUUID } from 'node:crypto';
import { applyPatch } from 'diff';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const schema = '# source\nMODULE|foundation\nRecord|root|A record.|\n';
test('temporal view binds policy to the baseline and exposes only explicit time fields', () => {
  const repository = fileURLToPath(new URL('../..', import.meta.url));
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim();
  const show = path => execFileSync('git', ['show', `${commit}:${path}`], { cwd: repository });
  const hash = bytes => createHash('sha256').update(bytes).digest('hex');
  const baselineSchema = show('model/domain.schema').toString('utf8');
  const paths = ['model/domain.schema', 'model/temporal-policy.json', 'tools/authoring_adapter.py', 'tools/domain_schema.py'];
  const manifest = paths.map(path => ({ path, sha256: hash(show(path)) }));
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Temporal', baselineCommit: commit, schema: baselineSchema, sourceManifest: manifest });
  const view = store.temporalView(workspace.id, 'TimeWindow', 0, repository);
  assert.equal(view.policy, 'snapshot-versioned');
  assert.equal(view.policySource.sha256, manifest[1].sha256);
  assert.equal(view.baselineCommit, commit);
  assert.ok(view.fields.some(field => field.range === 'dateTime'));
  assert.ok(view.fields.every(field => field.source.path === 'model/domain.schema'));
  assert.throws(() => store.temporalView(workspace.id, 'TimeWindow', 1, repository), /Revision conflict/);
  store.apply({ workspaceId: workspace.id, actor: 'test', operationId: 'new', expectedRevision: 0, commands: [{ type: 'class.add', name: 'NewTemporalConcept', module: 'foundation', parent: 'Record', definition: 'A new concept.' }] });
  assert.equal(store.temporalView(workspace.id, 'NewTemporalConcept', 1, repository).policy, null);
  const legacy = store.create({ title: 'Legacy', baselineCommit: commit, schema: baselineSchema });
  assert.throws(() => store.temporalView(legacy.id, 'TimeWindow', 0, repository), /pinned source manifest/);
  store.close();
});
test('information view traces draft relationships to source and baseline', () => {
  const store = new WorkspaceStore(':memory:');
  const initial = '# source\nMODULE|foundation\nRecord|root|A record.|\nDevice|-|A device.|owns:Record!\n';
  const workspace = store.create({ title: 'View', baselineCommit: 'a'.repeat(40), schema: initial });
  const first = store.view(workspace.id, 'Device', 0);
  assert.equal(first.viewpoint, 'information');
  assert.equal(first.nodes[0].iri, 'https://example.org/charge-domain#Device');
  assert.deepEqual(first.nodes[0].sourceRef, { path: 'model/domain.schema', line: 4 });
  assert.equal(first.nodes[0].changeStatus, 'unchanged');
  assert.equal(first.edges.find(edge => edge.predicate === 'owns').cardinality, '!');
  assert.equal(first.edges.find(edge => edge.predicate === 'owns').changeStatus, 'unchanged');
  store.apply({ workspaceId: workspace.id, actor: 'test', operationId: 'edit', expectedRevision: 0, commands: [{ type: 'relationship.add', owner: 'Device', name: 'references', range: 'Record', cardinality: '*' }] });
  const next = store.view(workspace.id, 'Device', 1);
  assert.equal(next.nodes[0].changeStatus, 'changed');
  const edge = next.edges.find(item => item.predicate === 'references');
  assert.equal(edge.changeStatus, 'added');
  assert.equal(edge.predicateIri, 'https://example.org/charge-domain#references');
  assert.deepEqual(edge.sourceRef, { path: 'model/domain.schema', line: 4 });
  assert.equal(edge.cardinality, '*');
  assert.equal(edge.mappingVersion, next.mappingVersion);
  store.close();
});
test('candidate identity binds the pinned baseline', () => {
  const store = new WorkspaceStore(':memory:');
  const first = store.create({ title: 'One', baselineCommit: 'a'.repeat(40), schema });
  const second = store.create({ title: 'Two', baselineCommit: 'b'.repeat(40), schema });
  assert.equal(first.digestVersion, 2);
  assert.notEqual(first.sourceDigest, second.sourceDigest);
  const hash = value => createHash('sha256').update(value).digest('hex');
  assert.throws(() => store.create({ title: 'Unsafe', baselineCommit: 'a'.repeat(40), schema, sourceManifest: [{ path: 'model/../secret', sha256: '0'.repeat(64) }, { path: 'model/domain.schema', sha256: hash(schema) }] }), /Invalid source manifest/);
  const baseManifest = [{ path: 'model/domain.schema', sha256: hash(schema) }, { path: 'tools/build.py', sha256: '1'.repeat(64) }];
  const third = store.create({ title: 'Three', baselineCommit: 'a'.repeat(40), schema, sourceManifest: baseManifest });
  const fourth = store.create({ title: 'Four', baselineCommit: 'a'.repeat(40), schema, sourceManifest: [baseManifest[0], { ...baseManifest[1], sha256: '2'.repeat(64) }] });
  assert.equal(third.digestVersion, 3);
  assert.notEqual(third.sourceDigest, fourth.sourceDigest);
  store.close();
});

test('version-three workspaces refuse mismatched or missing parser adapters', () => {
  const store = new WorkspaceStore(':memory:');
  const hash = bytes => createHash('sha256').update(bytes).digest('hex');
  const manifest = [
    { path: 'model/domain.schema', sha256: hash(schema) },
    { path: 'tools/authoring_adapter.py', sha256: hash(readFileSync(new URL('../../tools/authoring_adapter.py', import.meta.url))) },
    { path: 'tools/domain_schema.py', sha256: hash(readFileSync(new URL('../../tools/domain_schema.py', import.meta.url))) },
  ];
  const workspace = store.create({ title: 'Pinned', baselineCommit: 'a'.repeat(40), schema, sourceManifest: manifest });
  const request = { workspaceId: workspace.id, actor: 'test', operationId: 'edit', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Record', definition: 'Updated.' }] };
  assert.equal(store.apply(request).revision, 1);
  const mismatched = store.create({ title: 'Mismatched', baselineCommit: 'a'.repeat(40), schema, sourceManifest: [manifest[0], { ...manifest[1], sha256: '0'.repeat(64) }, manifest[2]] });
  assert.throws(() => store.apply({ ...request, workspaceId: mismatched.id }), /Pinned adapter differs/);
  assert.throws(() => store.entity(mismatched.id, 'Record'), /Pinned adapter differs/);
  assert.equal(store.get(mismatched.id).revision, 0);
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
  assert.equal(store.entity(workspace.id, 'Example', 1).entity.source.path, 'model/domain.schema');
  assert.throws(() => store.entity(workspace.id, 'Example', 0), /Revision conflict/);
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
  assert.equal(applyPatch(schema, store.diff(workspace.id).source.patch), store.get(workspace.id).schema);
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
