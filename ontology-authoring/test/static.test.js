import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { WorkspaceStore } from '../src/workspace.js';
import { createHttpService } from '../src/http.js';

test('local studio serves bounded static files without exposing neighbouring files', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'chargeweave-static-'));
  const root = join(directory, 'dist'); mkdirSync(root);
  writeFileSync(join(root, 'index.html'), '<main>Studio</main>');
  writeFileSync(join(root, 'app.js'), 'export default 1;');
  writeFileSync(join(directory, 'secret.json'), '{"private":true}');
  let linked = false;
  try { symlinkSync(join(directory, 'secret.json'), join(root, 'outside.json')); linked = true; }
  catch (error) { if (!['EPERM', 'EACCES'].includes(error.code)) throw error; }
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Static', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const service = createHttpService({ store, token: 'a'.repeat(32), workspaceId: workspace.id, staticDirectory: root });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  const url = `http://127.0.0.1:${service.address().port}`;
  try {
    const page = await fetch(`${url}/charge-weave-app/modelling/`);
    assert.equal(page.status, 200);
    assert.match(page.headers.get('content-security-policy'), /frame-ancestors 'none'/);
    assert.match(await page.text(), /Studio/);
    const script = await fetch(`${url}/charge-weave-app/app.js`);
    assert.match(script.headers.get('content-type'), /javascript/);
    assert.notEqual((await fetch(`${url}/charge-weave-app/%2e%2e/secret.json`)).status, 200);
    if (linked) assert.equal((await fetch(`${url}/charge-weave-app/outside.json`)).status, 404);
    assert.equal((await fetch(`${url}/mcp`, { method: 'POST' })).status, 401);
  } finally { await service.shutdown(); store.close(); rmSync(directory, { recursive: true, force: true }); }
});
