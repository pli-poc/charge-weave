import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { canvasGroupFrames } from './canvas-groups.js';

test('group frames enclose visible members using their measured sizes', () => {
  const groups = [{ name: 'Core', members: ['Device', 'Record', 'Hidden'] }];
  const nodes = [{ id: 'Device', position: { x: 300, y: 100 }, measured: { width: 220, height: 128 } }, { id: 'Record', position: { x: 0, y: 0 }, measured: { width: 250, height: 140 } }];
  assert.deepEqual(canvasGroupFrames(groups, nodes), [{ index: 0, name: 'Core', left: -24, top: -38, width: 568, height: 290, visibleCount: 2, totalCount: 3 }]);
});

test('group frames ignore unavailable and duplicate members without inventing nodes', () => {
  const groups = [{ name: 'Empty', members: ['Missing'] }, { name: 'One', members: ['Device', 'Device'] }];
  const frames = canvasGroupFrames(groups, [{ id: 'Device', position: { x: 10, y: 20 } }]);
  assert.deepEqual(frames, [{ index: 1, name: 'One', left: -14, top: -18, width: 268, height: 190, visibleCount: 1, totalCount: 1 }]);
});
