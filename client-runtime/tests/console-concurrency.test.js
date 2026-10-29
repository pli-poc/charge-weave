import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { indexedDB } from 'fake-indexeddb';
import { createConsoleClient } from '../../console-app/src/local-client.js';
import pkg from '../generated/application.json' with { type: 'json' };

test('a losing tab rolls back its command when the checkpoint revision conflicts', async () => {
  const provider = { getSites: () => [], getLiveSessions: () => [], queryAnalytics: () => {} };
  const env = { indexedDB, crypto: webcrypto, database: 'console-cas-test' };
  const first = createConsoleClient(provider, env), second = createConsoleClient(provider, env);
  await first.restore(); await second.restore();
  const input = Object.fromEntries(pkg.task.task.form.fields.map(f => [f.id, f.defaultValue ?? '']));
  input.operatorNote = 'Evidence checked against the synthetic register carefully.';
  assert.equal((await first.prepare(input, 0, 'first')).code, 'AWAITING_APPROVAL');
  await assert.rejects(second.prepare(input, 0, 'second'), /conflict/i);
  assert.equal((await second.task()).flowState, 'awaitingEvidence');
  await second.restore();
  assert.equal((await second.task()).flowState, 'awaitingApproval');
});
