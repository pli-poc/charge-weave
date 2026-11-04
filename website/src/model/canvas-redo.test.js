import test from 'node:test';
import assert from 'node:assert/strict';
import { positionChange, redoPositionChange, undoPositionChange } from './canvas-history.js';

test('redo restores a recorded movement and leaves unrelated positions intact', () => {
  const before = { a: { x: 1, y: 2 }, b: { x: 8, y: 9 } };
  const after = { ...before, a: { x: 3, y: 4 } };
  const entry = positionChange(before, after, ['a'], 'alignment');
  assert.deepEqual(redoPositionChange(undoPositionChange(after, entry), entry), after);
  assert.throws(() => redoPositionChange(after, entry), /changed since undo/);
  assert.deepEqual(before.a, { x: 1, y: 2 });
});
