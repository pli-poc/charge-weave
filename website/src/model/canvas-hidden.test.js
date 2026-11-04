import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { canvasHiddenKey, readCanvasHidden, writeCanvasHidden } from './canvas-hidden.js';

function memoryStorage() {
  const values = new Map();
  return { getItem: key => values.has(key) ? values.get(key) : null, setItem: (key, value) => values.set(key, value) };
}

test('hidden concepts are local to the workspace and view', () => {
  const storage = memoryStorage();
  writeCanvasHidden(storage, 'workspace-one', 'view / one', new Set(['Record', 'Device']));
  assert.deepEqual([...readCanvasHidden(storage, 'workspace-one', 'view / one')], ['Device', 'Record']);
  assert.deepEqual([...readCanvasHidden(storage, 'workspace-one', 'other')], []);
  assert.deepEqual([...readCanvasHidden(storage, 'workspace-two', 'view / one')], []);
});

test('invalid hidden settings are not silently overwritten', () => {
  const storage = memoryStorage(), key = canvasHiddenKey('workspace', 'default');
  for (const raw of ['{broken', '{"Device":true}', '["bad/name"]', '["Device","Device"]']) {
    storage.setItem(key, raw);
    assert.throws(() => readCanvasHidden(storage, 'workspace', 'default'));
    assert.equal(storage.getItem(key), raw);
  }
  assert.throws(() => writeCanvasHidden(storage, 'workspace', 'default', new Set(['bad/name'])));
});
