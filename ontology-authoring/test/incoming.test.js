import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { WorkspaceStore } from '../src/workspace.js';

test('incoming references are bounded, direct and revision-pinned', () => {
  const store = new WorkspaceStore(':memory:');
  try {
    const schema = 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|owner:Record?\nStation|Device|A station.|device:Device!\n';
    const workspace = store.create({ title: 'Incoming', baselineCommit: 'a'.repeat(40), schema });
    const first = store.incoming(workspace.id, 'Record', 0, 0, 1);
    assert.equal(first.total, 2);
    assert.equal(first.nextOffset, 1);
    assert.equal(first.nodes[0].name, 'Device');
    assert.equal(first.nodes[0].module, 'foundation');
    assert.deepEqual([first.results[0].source, first.results[0].predicate], ['Device', 'owner']);
    const second = store.incoming(workspace.id, 'Record', 0, first.nextOffset, 1);
    assert.deepEqual([second.results[0].source, second.results[0].predicate], ['Device', 'subClassOf']);
    assert.equal(second.nextOffset, null);
    assert.equal(store.incoming(workspace.id, 'Device', 0).total, 2);
    assert.throws(() => store.incoming(workspace.id, 'Record', 1), /Revision conflict/);
    assert.throws(() => store.incoming(workspace.id, 'Missing', 0), /Class not found/);
  } finally { store.close(); }
});
