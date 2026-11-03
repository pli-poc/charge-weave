import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('command palette groups contextual actions and remembers the last command', async ({ page, isMobile }) => {
  await page.setViewportSize({ width: isMobile ? 390 : 1440, height: 1000 });
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Command palette', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|peer:Record?\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.locator('.studio-app-bar').getByRole('button', { name: 'Commands' }).click();
    const palette = page.getByRole('dialog', { name: 'Commands' });
    await expect(palette.getByRole('group', { name: 'Navigate' })).toBeVisible();
    await expect(palette.getByRole('group', { name: 'Create' })).toBeVisible();
    const addRelation = palette.getByRole('option', { name: /Add a field or relationship/ });
    await expect(addRelation).toHaveAttribute('aria-disabled', 'false');
    await expect(addRelation).toContainText('Add a property to');
    const commandSearch = palette.getByRole('combobox', { name: 'Find a command' });
    await commandSearch.fill('Search model');
    await expect(palette.getByRole('option', { name: /Search model/ })).toContainText('Ctrl/⌘ K');
    await commandSearch.press('Enter');
    await page.getByLabel('Search model').fill('Device');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    await page.locator('.studio-app-bar').getByRole('button', { name: 'Commands' }).click();
    const reopened = page.getByRole('dialog', { name: 'Commands' });
    const recent = reopened.getByRole('group', { name: 'Recently used' });
    await expect(recent.getByRole('option', { name: /Search model/ })).toBeVisible();
    const enabledAddRelation = reopened.getByRole('option', { name: /Add a field or relationship/ });
    await expect(enabledAddRelation).toHaveAttribute('aria-disabled', 'false');
    await enabledAddRelation.click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await expect(page.getByLabel('Field name')).toBeVisible();
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
