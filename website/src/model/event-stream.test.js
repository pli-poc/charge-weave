import { test } from 'node:test';
import assert from 'node:assert/strict';
import { takeEventFrames } from './event-stream.js';

test('event frames survive split CRLF boundaries and multiple reads', () => {
  const first = takeEventFrames('event: workspace-change\r\ndata: {"sequence":1}\r');
  assert.deepEqual(first.frames, []);
  const second = takeEventFrames(first.remainder + '\n\r\nevent: validation-evidence\ndata: {}\n\n: heartbeat\n\n');
  assert.deepEqual(second.frames, [
    { type: 'workspace-change', data: '{"sequence":1}' },
    { type: 'validation-evidence', data: '{}' },
  ]);
  assert.equal(second.remainder, '');
});

test('event type comes from its field, not the data contents', () => {
  const parsed = takeEventFrames('event: other\ndata: event: workspace-change\ndata: next line\n\n');
  assert.deepEqual(parsed.frames, [{ type: 'other', data: 'event: workspace-change\nnext line' }]);
});
