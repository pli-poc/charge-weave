import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { applicationError } from '../src/errors.js';

test('ambiguous errors do not expose credentials or claim a specific cause', () => {
  const value = applicationError(new Error('unexpected upstream response containing secret-token'));
  assert.equal(value.code, 'OPERATION_FAILED');
  assert.doesNotMatch(JSON.stringify(value), /secret-token/);
});

test('uncertain publication outcomes give reconciliation guidance', () => {
  assert.equal(applicationError(new Error('Push outcome is unknown; reconcile the remote branch before retrying')).code, 'PUSH_OUTCOME_UNKNOWN');
  assert.match(applicationError(new Error('Pull-request outcome is unknown; reconcile before retrying')).recovery, /Reconcile/);
});
