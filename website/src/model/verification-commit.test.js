import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { verifiedCommit } from '../../scripts/verification-commit.mjs';

test('verification binds to the checked-out commit rather than a PR merge SHA', () => {
  const head = 'a'.repeat(40);
  const env = { CI: 'true', GITHUB_REPOSITORY: 'example/repository', GITHUB_SHA: 'b'.repeat(40), EXACT_COMMIT_SHA: head };
  assert.equal(verifiedCommit(env, head), head);
  assert.throws(() => verifiedCommit(env, 'c'.repeat(40)), /exact checked-out/);
  assert.throws(() => verifiedCommit({ ...env, EXACT_COMMIT_SHA: '' }, head), /exact checked-out/);
  assert.throws(() => verifiedCommit({ ...env, CI: 'false' }, head), /exact checked-out/);
});
