import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('explorer filters changed class contracts and refreshes on external edits', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Changed concepts', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByLabel('Show changed class contracts only').check();
    await expect(page.getByText('Showing 0 of 0 concepts.')).toBeVisible();
    store.apply({ workspaceId: workspace.id, actor: 'other-client', operationId: 'describe', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Device', definition: 'Updated device.' }] });
    await expect(page.getByText('Showing 1 of 1 concepts.')).toBeVisible();
    const tree = page.getByRole('list', { name: 'Loaded concepts by module' });
    await expect(tree.getByRole('button', { name: 'Device', exact: true })).toBeVisible();
    await expect(tree.getByRole('button', { name: 'Record', exact: true })).toHaveCount(0);
    await page.getByLabel('Show changed class contracts only').uncheck();
    await expect(page.getByText('Showing 2 of 2 concepts.')).toBeVisible();
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
