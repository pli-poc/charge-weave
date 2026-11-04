import test from 'node:test';
import assert from 'node:assert/strict';
import { distributePositions } from './canvas-distribute.js';

test('spaces selected cards between fixed outer positions without changing the other axis', () => {
  const positions = { a: { x: 0, y: 5 }, b: { x: 10, y: 8 }, c: { x: 90, y: 7 }, other: { x: 2, y: 3 } };
  const next = distributePositions(positions, ['c', 'a', 'b'], 'x');
  assert.deepEqual(next.b, { x: 45, y: 8 });
  assert.deepEqual(next.a, positions.a);
  assert.deepEqual(next.c, positions.c);
  assert.deepEqual(next.other, positions.other);
  assert.equal(positions.b.x, 10);
});

test('handles vertical ties deterministically and ignores duplicate or missing names', () => {
  const positions = { a: { x: 1, y: 0 }, b: { x: 2, y: 0 }, c: { x: 3, y: 12 } };
  const next = distributePositions(positions, ['c', 'b', 'a', 'b', 'missing'], 'y');
  assert.deepEqual(next.b, { x: 2, y: 6 });
  assert.deepEqual(distributePositions(positions, ['a', 'c'], 'y'), positions);
});
