import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { WorkspaceStore } from '../src/workspace.js';

test('outgoing neighbourhood limits preserve omitted counts and the existing default', () => {
  const store = new WorkspaceStore(':memory:');
  try {
    const fields = Array.from({ length: 16 }, (_, i) => `link${i}:Record?`).join(' ');
    const workspace = store.create({ title: 'View limit', baselineCommit: 'a'.repeat(40), schema: `MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|${fields}\n` });
    const initial = store.view(workspace.id, 'Device', 0, 5);
    assert.equal(initial.edges.length, 5);
    assert.equal(initial.omitted, 12);
    const expanded = store.view(workspace.id, 'Device', 0, 20);
    assert.equal(expanded.edges.length, 17);
    assert.equal(expanded.omitted, 0);
    assert.deepEqual(expanded.edges.slice(0, 5), initial.edges);
    assert.equal(store.view(workspace.id, 'Device', 0).edges.length, 17);
    assert.throws(() => store.view(workspace.id, 'Device', 0, 0), /Invalid view limit/);
    assert.throws(() => store.view(workspace.id, 'Device', 1, 5), /Revision conflict/);
  } finally { store.close(); }
});
