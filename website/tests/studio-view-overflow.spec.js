import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('open-view picker exposes and switches among views beyond the tab strip', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'View picker', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|\n' });
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
    for (const id of ['alpha', 'beta', 'gamma', 'a-long-view-name-that-does-not-fit']) {
      await page.getByLabel('View ID').fill(id);
      await page.getByRole('button', { name: 'Choose view ID' }).click();
      await expect(page.getByRole('navigation', { name: 'Open diagram views' }).getByRole('button', { name: id, exact: true })).toHaveAttribute('aria-current', 'page');
    }
    const picker = page.locator('.studio-view-picker');
    await picker.locator('summary').click();
    await expect(picker.getByRole('button', { name: 'a-long-view-name-that-does-not-fit', exact: true })).toBeVisible();
    const longEntry = picker.getByRole('button', { name: 'a-long-view-name-that-does-not-fit', exact: true });
    expect(await longEntry.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await expect(picker.getByRole('button', { name: 'gamma', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await picker.getByRole('button', { name: 'beta', exact: true }).click();
    await expect(picker).not.toHaveAttribute('open', '');
    await expect(page.getByRole('navigation', { name: 'Open diagram views' }).getByRole('button', { name: 'beta', exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(picker.locator('summary')).toContainText('Views (5)');
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
