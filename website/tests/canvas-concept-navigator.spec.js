import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('find, focus and inspect a visible concept without changing the diagram root', async ({ page, isMobile }) => {
  await page.setViewportSize({ width: isMobile ? 320 : 1920, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Concept navigation', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|peer:Record?\n' });
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
    const navigator = page.locator('.studio-canvas-concept-navigator');
    await navigator.locator('summary').click();
    const search = navigator.getByRole('searchbox');
    const choices = navigator.getByRole('combobox');
    await search.fill('Record');
    await expect(navigator).toContainText('Showing 1 of 2 visible concepts. Hidden and unloaded concepts are excluded.');
    await choices.selectOption('Record');
    await search.fill('Device');
    await expect(choices).toHaveValue('Record');
    await expect(navigator).toContainText('The chosen concept remains available outside these results.');
    const focus = navigator.getByRole('button', { name: 'Focus chosen concept on diagram' });
    await focus.focus(); await page.keyboard.press('Enter');
    await expect(canvas).toHaveAttribute('aria-label', 'Relationships for Device');
    await navigator.getByRole('button', { name: 'Inspect chosen concept' }).click();
    await expect(canvas).toHaveAttribute('aria-label', 'Relationships for Device');
    await expect(page.getByRole('region', { name: 'Workspace status' })).toContainText('Record');
    expect(store.get(workspace.id).revision).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
