import test from 'node:test';
import assert from 'node:assert/strict';
import { contextCheckSummary } from './context-checks.js';

test('handoff identifies stale failed steps without copying output', () => {
  const lines = contextCheckSummary({ profile: 'reference', status: 'failed', revision: 2, digest: 'old', output: 'secret output', steps: [{ checkName: 'fixture\ncheck', status: 'failed', output: 'private output' }] }, { revision: 3, sourceDigest: 'new' });
  assert.match(lines.join('\n'), /out of date/);
  assert.match(lines.join('\n'), /fixture check/);
  assert.doesNotMatch(lines.join('\n'), /secret|private/);
});

test('handoff bounds repeated step names and distinguishes a job failure', () => {
  const snapshot = { revision: 1, sourceDigest: 'digest' };
  const steps = Array.from({ length: 12 }, (_, i) => ({ status: 'failed', checkName: `check ${i}` }));
  assert.match(contextCheckSummary({ profile: 'audit', status: 'failed', revision: 1, digest: 'digest', steps }, snapshot).join('\n'), /2 additional failed steps omitted/);
  assert.match(contextCheckSummary({ profile: 'audit', status: 'failed', revision: 1, digest: 'digest', steps: [] }, snapshot).join('\n'), /without a recorded failed step/);
});
