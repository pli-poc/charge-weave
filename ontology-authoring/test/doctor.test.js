import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { diagnose } from '../src/doctor.js';

test('doctor reports missing setup and never returns credential material', async () => {
  const secret = 'private-test-secret';
  const checks = await diagnose({ CHARGEWEAVE_REPOSITORY: fileURLToPath(new URL('../..', import.meta.url)), CHARGEWEAVE_DRAFT_TOKEN: secret, CHARGEWEAVE_PYTHON: 'missing-python-executable', CHARGEWEAVE_PORT: 'invalid' });
  assert.equal(checks.find(item => item.name === 'Draft credential').ok, false);
  assert.equal(checks.find(item => item.name === 'Workspace grant').ok, false);
  assert.equal(checks.find(item => item.name === 'Loopback port').ok, false);
  assert.equal(checks.find(item => item.name === 'Python dependencies').ok, false);
  assert.equal(JSON.stringify(checks).includes(secret), false);
});

test('doctor detects an occupied loopback port', async () => {
  const listener = createServer();
  listener.listen(0, '127.0.0.1'); await once(listener, 'listening');
  try {
    const checks = await diagnose({ CHARGEWEAVE_REPOSITORY: fileURLToPath(new URL('../..', import.meta.url)), CHARGEWEAVE_PORT: String(listener.address().port), CHARGEWEAVE_PYTHON: 'missing-python-executable' });
    assert.equal(checks.find(item => item.name === 'Loopback port').ok, false);
  } finally { await new Promise(resolve => listener.close(resolve)); }
});
