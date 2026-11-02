import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { canvasPositionKey, readCanvasPositions, writeCanvasPositions } from './canvas-positions.js';

test('positions are isolated by workspace and view with a default-only legacy fallback', () => {
  const values = new Map([['chargeweave.canvas.v1.w', JSON.stringify({ Device: { x: 12, y: 34 } })]]);
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  assert.deepEqual({ ...readCanvasPositions(storage, 'w', 'default') }, { Device: { x: 12, y: 34 } });
  assert.deepEqual({ ...readCanvasPositions(storage, 'w', 'other') }, {});
  writeCanvasPositions(storage, 'w', 'other', { Device: { x: 99, y: 50 } });
  assert.equal(readCanvasPositions(storage, 'w', 'other').Device.x, 99);
  assert.notEqual(canvasPositionKey('w', 'other'), canvasPositionKey('other', 'w'));
  assert.deepEqual({ ...readCanvasPositions(storage, 'other', 'other') }, {});
});

test('saving fails closed when stored positions are unreadable or invalid', () => {
  for (const raw of ['{', '[]', '{"Device":{"x":"bad","y":2}}']) {
    const storage = { getItem: () => raw };
    assert.throws(() => readCanvasPositions(storage, 'w', 'default', { strict: true }), /could not be read/);
  }
  assert.throws(() => readCanvasPositions({ getItem() { throw new Error('storage denied'); } }, 'w', 'default', { strict: true }), /could not be read/);
  assert.deepEqual({ ...readCanvasPositions({ getItem: () => null }, 'w', 'default', { strict: true }) }, {});
});
