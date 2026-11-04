import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('studio appearance follows the system and remembers an explicit choice', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Appearance', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode: 'synthetic-pairing-code-'.repeat(2), workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    if (isMobile) await page.getByRole('button', { name: 'Studio preferences' }).click();
    const appearance = page.getByLabel('Appearance');
    await expect(appearance).toHaveValue('system');
    await expect(page.locator('html')).toHaveAttribute('data-studio-theme', 'light');
    await expect(page.locator('.studio-app-bar')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.locator('html')).toHaveAttribute('data-studio-theme', 'dark');
    await appearance.selectOption('light');
    await expect(page.locator('html')).toHaveAttribute('data-studio-theme', 'light');
    await page.reload();
    if (isMobile) await page.getByRole('button', { name: 'Studio preferences' }).click();
    await expect(page.getByLabel('Appearance')).toHaveValue('light');
    await expect(page.locator('html')).toHaveAttribute('data-studio-theme', 'light');
    await page.getByLabel('Appearance').selectOption('dark');
    await expect(page.locator('.studio-app-bar')).toHaveCSS('background-color', 'rgb(16, 33, 39)');
    await page.getByLabel('Appearance').selectOption('system');
    await expect(page.locator('html')).toHaveAttribute('data-studio-theme', 'dark');
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
