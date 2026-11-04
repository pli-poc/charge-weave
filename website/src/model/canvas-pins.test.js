import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { canvasPinsKey, readCanvasPins, writeCanvasPins } from './canvas-pins.js';

function memoryStorage() {
  const values = new Map();
  return { getItem: key => values.has(key) ? values.get(key) : null, setItem: (key, value) => values.set(key, value) };
}

test('canvas pins are isolated by workspace and view', () => {
  const storage = memoryStorage();
  writeCanvasPins(storage, 'workspace-one', 'view / one', new Set(['Record', 'Device']));
  assert.deepEqual([...readCanvasPins(storage, 'workspace-one', 'view / one')], ['Device', 'Record']);
  assert.deepEqual([...readCanvasPins(storage, 'workspace-one', 'other')], []);
  assert.deepEqual([...readCanvasPins(storage, 'workspace-two', 'view / one')], []);
});

test('unreadable pin preferences are rejected without rewriting them', () => {
  const storage = memoryStorage();
  const key = canvasPinsKey('workspace', 'default');
  for (const raw of ['{broken', '{"Device":true}', '["bad/name"]', '["Device","Device"]']) {
    storage.setItem(key, raw);
    assert.throws(() => readCanvasPins(storage, 'workspace', 'default'));
    assert.equal(storage.getItem(key), raw);
  }
  assert.throws(() => writeCanvasPins(storage, 'workspace', 'default', new Set(['bad/name'])));
});
