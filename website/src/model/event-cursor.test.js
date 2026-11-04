import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { classifyEvent } from './event-cursor.js';

test('cursor classification handles duplicates, cross-workspace gaps and missing events', () => {
  assert.equal(classifyEvent({ sequence: 12, previousSequence: 4 }, 4), 'next');
  assert.equal(classifyEvent({ sequence: 12, previousSequence: 4 }, 12), 'duplicate');
  assert.equal(classifyEvent({ sequence: 15, previousSequence: 12 }, 4), 'recover');
  assert.equal(classifyEvent({ sequence: 1, previousSequence: 1 }, 0), 'recover');
});
