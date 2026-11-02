import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { positionChange, samePositionMaps, undoPositionChange } from './canvas-history.js';

test('layout undo restores only moved concepts and retains other positions', () => {
  const before = { Device: { x: 1, y: 2 }, Record: { x: 3, y: 4 }, Hidden: { x: 5, y: 6 } };
  const after = { Device: { x: 8, y: 9 }, Record: { x: 3, y: 4 }, Hidden: { x: 5, y: 6 } };
  const entry = positionChange(before, after, ['Device', 'Record', 'Device'], 'move');
  assert.deepEqual(entry.changes.map(change => change.name), ['Device']);
  const current = { ...after, Hidden: { x: 7, y: 7 } };
  assert.deepEqual(undoPositionChange(current, entry), { Device: { x: 1, y: 2 }, Record: { x: 3, y: 4 }, Hidden: { x: 7, y: 7 } });
  assert.equal(positionChange(before, before, ['Device'], 'move'), null);
});

test('layout undo rejects changed targets and compares stored maps without relying on key order', () => {
  const before = { Device: { x: 1, y: 2 }, Record: { x: 3, y: 4 } };
  const after = { Device: { x: 8, y: 9 }, Record: { x: 3, y: 4 } };
  const entry = positionChange(before, after, ['Device'], 'move');
  assert.throws(() => undoPositionChange({ ...after, Device: { x: 10, y: 9 } }, entry), /changed/);
  assert.equal(samePositionMaps(after, { Record: { x: 3, y: 4 }, Device: { x: 8, y: 9 } }), true);
  assert.equal(samePositionMaps(after, { Device: { x: 8, y: 9 } }), false);
});
