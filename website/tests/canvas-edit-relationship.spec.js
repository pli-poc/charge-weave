import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('a diagram relationship opens the same checked field editor', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Relationship edit', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nAsset|Record|An asset.|\nDevice|Record|A device.|asset:Asset?\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode); await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByLabel('Search model').fill('Device'); await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram' }).click();
    const picker = page.getByLabel('Inspect relationship');
    await picker.selectOption(await picker.locator('option').filter({ hasText: /Device.*asset.*Asset/ }).getAttribute('value'));
    await page.getByRole('region', { name: 'Relationship details' }).getByRole('button', { name: 'Inspect target Asset' }).click();
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 0');
    await page.getByRole('button', { name: 'Edit relationship asset' }).click();
    await expect(page.getByRole('heading', { name: 'Edit field contract' })).toBeVisible();
    await expect(page.getByLabel('New datatype or target class')).toHaveValue('Asset');
    await page.getByLabel('New cardinality').selectOption('!');
    expect(store.get(workspace.id).revision).toBe(0);
    await page.getByRole('button', { name: 'Update field contract' }).click();
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 1');
    expect(store.get(workspace.id).schema).toContain('asset:Asset!');
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
