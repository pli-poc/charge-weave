import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { canvasViewportKey, readCanvasViewport, writeCanvasViewport } from './canvas-viewport.js';

function memoryStorage() {
  const values = new Map();
  return { getItem: key => values.has(key) ? values.get(key) : null, setItem: (key, value) => values.set(key, value) };
}

test('viewport preferences are isolated by workspace, view and root', () => {
  const storage = memoryStorage(), value = { x: -120, y: 80, zoom: 0.75 };
  writeCanvasViewport(storage, 'workspace-one', 'view / one', 'Device', value);
  assert.deepEqual(readCanvasViewport(storage, 'workspace-one', 'view / one', 'Device'), value);
  assert.equal(readCanvasViewport(storage, 'workspace-one', 'view / one', 'Record'), null);
  assert.equal(readCanvasViewport(storage, 'workspace-one', 'other', 'Device'), null);
  assert.equal(readCanvasViewport(storage, 'workspace-two', 'view / one', 'Device'), null);
  const overview = { x: 0, y: 0, zoom: 0.01 };
  writeCanvasViewport(storage, 'workspace-one', 'view / one', 'Device', overview);
  assert.deepEqual(readCanvasViewport(storage, 'workspace-one', 'view / one', 'Device'), overview);
});

test('invalid viewport preferences fall back without throwing or being rewritten', () => {
  const storage = memoryStorage(), key = canvasViewportKey('workspace', 'default', 'Device');
  for (const raw of ['{broken', '{}', '{"x":0,"y":0,"zoom":0}', '{"x":1000000,"y":0,"zoom":1}', '{"x":0,"y":0,"zoom":3}']) {
    storage.setItem(key, raw);
    assert.equal(readCanvasViewport(storage, 'workspace', 'default', 'Device'), null);
    assert.equal(storage.getItem(key), raw);
  }
  assert.throws(() => writeCanvasViewport(storage, 'workspace', 'default', 'Device', { x: 0, y: 0, zoom: 3 }));
  assert.equal(readCanvasViewport({ getItem() { throw new Error('denied'); } }, 'workspace', 'default', 'Device'), null);
});
