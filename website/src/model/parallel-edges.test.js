import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parallelEdgeOffsets } from './parallel-edges.js';

test('parallel and reverse relationships receive stable separated offsets', () => {
  const edges = [{ id: 'b', source: 'A', target: 'B' }, { id: 'a', source: 'A', target: 'B' }, { id: 'c', source: 'B', target: 'A' }, { id: 'd', source: 'A', target: 'C' }];
  const offsets = parallelEdgeOffsets(edges);
  assert.deepEqual([offsets.get('a'), offsets.get('b'), offsets.get('c'), offsets.get('d')], [-32, 0, 32, 0]);
  assert.deepEqual([...parallelEdgeOffsets([...edges].reverse())].sort(), [...offsets].sort());
});
