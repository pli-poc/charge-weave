import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';
import { closeDraftContext, openDraftContext } from './studio-utilities.js';

test('responsibility filter announces its results and resets for a new concept', async ({ page, isMobile }) => {
  const source = 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|owner:Record? provider:Record?\n';
  const mapping = JSON.stringify({ version: 'chargeweave-responsibility-v1', bindings: [
    { owner: 'Device', property: 'owner', range: 'Record', label: 'Owner', category: 'ownership' },
    { owner: 'Device', property: 'provider', range: 'Record', label: 'Provider', category: 'service' }
  ] });
  const entries = { 'model/domain.schema': source, 'model/responsibility-bindings.json': mapping, 'tools/authoring_adapter.py': readFileSync(fileURLToPath(new URL('../../tools/authoring_adapter.py', import.meta.url)), 'utf8'), 'tools/domain_schema.py': readFileSync(fileURLToPath(new URL('../../tools/domain_schema.py', import.meta.url)), 'utf8') };
  const sourceManifest = Object.entries(entries).map(([path, value]) => ({ path, sha256: createHash('sha256').update(value).digest('hex') })).sort((a, b) => a.path < b.path ? -1 : 1);
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Responsibility filter', baselineCommit: 'a'.repeat(40), schema: source, sourceManifest, sourceBlobs: { 'model/responsibility-bindings.json': mapping } });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  const surface = async name => { if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name, exact: true }).click(); };
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    await surface('Results');
    await openDraftContext(page);
    await page.getByRole('button', { name: 'Inspect responsibilities for selected concept' }).click();
    const status = page.getByRole('status').filter({ hasText: 'responsibility bindings' });
    await expect(status).toHaveText('Showing 2 of 2 responsibility bindings.');
    await page.getByLabel('Filter responsibility category').selectOption('ownership');
    await expect(status).toHaveText('Showing 1 of 2 responsibility bindings.');
    await page.getByLabel('Filter responsibility category').selectOption('role');
    await expect(status).toHaveText('Showing 0 of 2 responsibility bindings.');
    await closeDraftContext(page);
    await surface('Model');
    await page.getByRole('list', { name: 'Loaded concepts by module' }).getByRole('button', { name: 'Record', exact: true }).click();
    await surface('Results');
    await openDraftContext(page);
    await page.getByRole('button', { name: 'Inspect responsibilities for selected concept' }).click();
    await expect(page.getByLabel('Filter responsibility category')).toHaveValue('all');
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
