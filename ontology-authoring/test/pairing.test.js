import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { once } from 'node:events';
import { PairingSessions } from '../src/pairing.js';
import { WorkspaceStore } from '../src/workspace.js';
import { createHttpService } from '../src/http.js';

test('pairing codes expire, lock out guesses and cannot be reused', () => {
  let clock = 0;
  const code = 'a'.repeat(32), sessions = new PairingSessions(code, () => clock);
  const session = sessions.pair(code);
  assert.ok(session); assert.equal(sessions.pair(code), null);
  assert.ok(sessions.get(session.id));
  clock += 8 * 60 * 60 * 1000;
  assert.equal(sessions.get(session.id), null);
  const expired = new PairingSessions(code, () => clock);
  clock += 5 * 60 * 1000;
  assert.equal(expired.pair(code), null);
  const locked = new PairingSessions(code, () => clock);
  for (let i = 0; i < 5; i++) assert.equal(locked.pair('wrong'), null);
  assert.equal(locked.pair(code), null);
});

test('same-origin pairing creates an HttpOnly session with CSRF enforcement and revocation', async () => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Pair', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const code = 'p'.repeat(32), service = createHttpService({ store, token: 'a'.repeat(32), pairingCode: code, workspaceId: workspace.id });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  const origin = `http://127.0.0.1:${service.address().port}`;
  try {
    const crossOrigin = await fetch(`${origin}/pair`, { method: 'POST', headers: { origin: 'https://untrusted.example', 'content-type': 'application/json' }, body: JSON.stringify({ code }) });
    assert.equal(crossOrigin.status, 403);
    const pair = () => fetch(`${origin}/pair`, { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ code }) });
    const response = await pair(); assert.equal(response.status, 200);
    const cookie = response.headers.get('set-cookie');
    assert.match(cookie, /HttpOnly/); assert.match(cookie, /SameSite=Strict/);
    const { csrf, workspaceId } = await response.json(); assert.equal(workspaceId, workspace.id);
    assert.equal((await pair()).status, 403);
    const mcpHeaders = { origin, cookie, 'content-type': 'application/json', accept: 'application/json, text/event-stream' };
    const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} });
    assert.equal((await fetch(`${origin}/mcp`, { method: 'POST', headers: mcpHeaders, body })).status, 401);
    const authorized = await fetch(`${origin}/mcp`, { method: 'POST', headers: { ...mcpHeaders, 'x-csrf-token': csrf }, body });
    assert.equal(authorized.status, 200);
    const resumed = await fetch(`${origin}/session`, { headers: { cookie, 'sec-fetch-site': 'same-origin' } });
    assert.equal((await resumed.json()).csrf, csrf);
    assert.equal((await fetch(`${origin}/session`, { headers: { cookie, 'sec-fetch-site': 'cross-site' } })).status, 403);
    assert.equal((await fetch(`${origin}/session`, { method: 'DELETE', headers: { origin, cookie, 'x-csrf-token': csrf } })).status, 204);
    assert.equal((await fetch(`${origin}/mcp`, { method: 'POST', headers: { ...mcpHeaders, 'x-csrf-token': csrf }, body })).status, 401);
  } finally { await service.shutdown(); store.close(); }
});
