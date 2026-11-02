import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { WorkspaceStore } from '../src/workspace.js';

test('explorer pages every class in stable order and rejects stale revisions', () => {
  const store = new WorkspaceStore(':memory:');
  try {
    const classes = Array.from({ length: 135 }, (_, i) => `Thing${String(i).padStart(3, '0')}|Record|A concept.|`).join('\n');
    const workspace = store.create({ title: 'Explorer', baselineCommit: 'a'.repeat(40), schema: `MODULE|foundation\nRecord|root|A record.|\n${classes}\n` });
    const names = [];
    let cursor;
    do {
      const page = store.explore(workspace.id, { expectedRevision: 0, cursor, limit: 40 });
      assert.equal(page.total, 136);
      names.push(...page.results.map(item => item.name));
      cursor = page.nextCursor ?? undefined;
    } while (cursor);
    assert.equal(names.length, 136);
    assert.deepEqual(names, [...new Set(names)].sort());
    assert.throws(() => store.explore(workspace.id, { expectedRevision: 1 }), /Revision conflict/);
    assert.throws(() => store.explore(workspace.id, { expectedRevision: 0, limit: 101 }), /Invalid explorer/);
    assert.equal(store.explore(workspace.id, { expectedRevision: 0, module: 'missing' }).total, 0);
    const foundation = store.explore(workspace.id, { expectedRevision: 0, module: 'foundation', limit: 10 });
    assert.equal(foundation.total, 136);
    assert.deepEqual(foundation.modules, [{ name: 'foundation', count: 136 }]);
    assert.equal(foundation.module, 'foundation');
  } finally { store.close(); }
});
