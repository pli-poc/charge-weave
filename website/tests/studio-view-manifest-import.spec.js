import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('studio imports a saved-view manifest without changing ontology revision', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Import view', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|\n' });
  const definition = { root: 'Device', positions: { Device: { x: 12, y: 24 }, Record: { x: 280, y: 24 } }, viewpoint: 'information', groups: [{ name: 'Equipment', members: ['Device', 'Record'] }], annotations: [{ target: 'Device', text: 'A presentation note.' }] };
  const manifest = { contractVersion: 'chargeweave-view-v1', workspaceId: workspace.id, baselineCommit: workspace.baselineCommit, observedRevision: 0, observedSourceDigest: workspace.sourceDigest, viewId: 'portable', viewRevision: 2, definition };
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByText('Saved views', { exact: true }).click();
    await page.getByLabel('View manifest JSON').setInputFiles({ name: 'portable.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(manifest)) });
    await expect(page.getByText(/Ready to import “portable”/)).toBeVisible();
    await page.getByRole('button', { name: 'Import saved view' }).click();
    await expect(page.getByText('Imported “portable” as presentation data. Use Load shared view to apply it.')).toBeVisible();
    expect(store.get(workspace.id).revision).toBe(0);
    expect(store.savedView(workspace.id, 'portable').viewRevision).toBe(1);
    expect(store.savedView(workspace.id, 'portable').definition).toEqual(definition);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
