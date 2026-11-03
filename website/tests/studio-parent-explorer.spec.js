import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('explorer pages direct children and combines parent and changed filters', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const children = Array.from({ length: 52 }, (_, i) => `Asset${String(i).padStart(2, '0')}|Record|An asset.|`);
  const schema = `MODULE|foundation\nRecord|root|A record.|\n${children.join('\n')}\nNested|Asset00|A nested asset.|\n`;
  const workspace = store.create({ title: 'Parent explorer', baselineCommit: 'a'.repeat(40), schema });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByLabel('Direct parent').fill('Record');
    await page.getByRole('button', { name: 'Filter parent' }).click();
    await expect(page.getByText('Showing 50 of 52 concepts.')).toBeVisible();
    await expect(page.getByText('Direct parent: Record. Indirect descendants are not included.')).toBeVisible();
    await page.getByRole('button', { name: 'Load more concepts' }).click();
    await expect(page.getByText('Showing 52 of 52 concepts.')).toBeVisible();
    const tree = page.getByRole('list', { name: 'Loaded concepts by module' });
    await expect(tree.getByRole('button', { name: 'Asset51', exact: true })).toBeVisible();
    await expect(tree.getByRole('button', { name: 'Nested', exact: true })).toHaveCount(0);
    store.apply({ workspaceId: workspace.id, actor: 'other-client', operationId: 'describe', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Asset51', definition: 'A revised asset.' }] });
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 1');
    await page.getByLabel('Show changed class contracts only').check();
    await expect(page.getByText('Showing 1 of 1 concepts.')).toBeVisible();
    await expect(tree.getByRole('button', { name: 'Asset51', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Clear parent filter' }).click();
    await expect(page.getByLabel('Direct parent')).toHaveValue('');
    await expect(page.getByText('Showing 1 of 1 concepts.')).toBeVisible();
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
