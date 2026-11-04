import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('field search pages declared owners and clears stale results', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const rows = Array.from({ length: 27 }, (_, i) => `Asset${String(i).padStart(2, '0')}|Record|Asset.|shared:string?${i === 26 ? ' related:Record?' : ''}`);
  const workspace = store.create({ title: 'Field discovery', baselineCommit: 'a'.repeat(40), schema: `MODULE|foundation\nRecord|root|Record.|parentField:string?\n${rows.join('\n')}\n` });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByText('Properties and relationships', { exact: true }).click();
    await page.getByLabel('Find properties or relationships').fill('shared');
    await page.getByRole('button', { name: 'Search fields', exact: true }).click();
    await expect(page.getByText('Showing 25 of 27 declared fields.')).toBeVisible();
    await page.getByRole('button', { name: 'Load more fields' }).click();
    await expect(page.getByText('Showing 27 of 27 declared fields.')).toBeVisible();
    await page.getByLabel('Concept context (optional)').fill('Asset26');
    await page.getByLabel('Find properties or relationships').fill('parentField');
    await page.getByRole('button', { name: 'Search fields', exact: true }).click();
    await expect(page.locator('details').filter({ has: page.getByText('Properties and relationships', { exact: true }) }).getByText('inherited from Record', { exact: false })).toBeVisible();
    await page.getByRole('button', { name: 'Inspect context Asset26' }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await expect(page.getByRole('heading', { name: 'Asset26', exact: true })).toBeVisible();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Model' }).click();
    await page.getByLabel('Find properties or relationships').fill('');
    await page.getByLabel('Field kind').selectOption('relationship');
    await page.getByRole('button', { name: 'Search fields', exact: true }).click();
    await expect(page.getByText('Showing 1 of 1 fields for Asset26.')).toBeVisible();
    await expect(page.getByText('related', { exact: true })).toBeVisible();
    await page.getByLabel('Field kind').selectOption('all');
    await page.getByLabel('Concept context (optional)').fill('');
    await page.getByLabel('Find properties or relationships').fill('shared');
    await page.getByRole('button', { name: 'Search fields', exact: true }).click();
    await page.getByRole('button', { name: 'Load more fields' }).click();
    await page.getByRole('button', { name: 'Inspect owner Asset26' }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await expect(page.getByRole('heading', { name: 'Asset26', exact: true })).toBeVisible();
    store.apply({ workspaceId: workspace.id, actor: 'other', operationId: 'update', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Record', definition: 'Updated.' }] });
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 1');
    await expect(page.getByText('Showing 27 of 27 declared fields.')).toHaveCount(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
