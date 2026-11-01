import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { WorkspaceStore } from '../src/workspace.js';

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
  store.close();
});
