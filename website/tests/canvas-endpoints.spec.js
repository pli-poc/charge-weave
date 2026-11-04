import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('relationship inspection highlights its endpoints and clears them when closed', async ({ page, isMobile }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Relationship endpoints', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nAsset|Record|An asset.|\nDevice|Record|A device.|asset:Asset?\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByLabel('Search model').fill('Device');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram' }).click();
    const canvas = page.getByRole('region', { name: 'Relationships for Device' });
    await expect(canvas).toHaveAttribute('data-layout', 'ready');
    const picker = page.getByLabel('Inspect relationship');
    const assetOption = picker.locator('option').filter({ hasText: /Device.*asset.*Asset/ });
    await picker.selectOption(await assetOption.getAttribute('value'));
    const source = canvas.locator('.react-flow__node[data-id="Device"]');
    const target = canvas.locator('.react-flow__node[data-id="Asset"]');
    const other = canvas.locator('.react-flow__node[data-id="Record"]');
    await expect(source).toHaveClass(/studio-relationship-endpoint/);
    await expect(target).toHaveClass(/studio-relationship-endpoint/);
    await expect(other).not.toHaveClass(/studio-relationship-endpoint/);
    await expect(target.locator('.studio-concept-card')).toHaveCSS('outline-style', 'dashed');
    const details = page.getByRole('region', { name: 'Relationship details' });
    await expect(details).toContainText('Relationship: asset');
    await details.getByRole('button', { name: 'Close relationship details' }).click();
    await expect(canvas.locator('.studio-relationship-endpoint')).toHaveCount(0);
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
