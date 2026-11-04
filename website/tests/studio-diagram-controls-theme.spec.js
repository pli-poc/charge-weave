import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('diagram controls remain readable and keyboard usable in both themes', async ({ page, isMobile }) => {
  test.skip(isMobile, 'This checks the desktop floating diagram controls.');
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Diagram controls', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|peer:Record?\n' });
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
    const canvas = page.getByRole('region', { name: 'Relationships for Device' });
    await expect(canvas).toHaveAttribute('data-layout', 'ready');
    const menu = canvas.locator('.studio-canvas-layout-menu');
    const summary = menu.locator(':scope > summary');
    const zoom = canvas.getByRole('group', { name: 'Diagram zoom' });
    const contrast = async (foreground, background) => foreground.evaluate((element, parent) => {
      const luminance = color => color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, i) => sum + value * [.2126, .7152, .0722][i], 0);
      const a = luminance(getComputedStyle(element).color), b = luminance(getComputedStyle(element.closest(parent)).backgroundColor);
      return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
    }, background);
    for (const theme of ['dark', 'light']) {
      await page.getByLabel('Appearance').selectOption(theme);
      await expect(summary).toBeVisible();
      expect(await contrast(summary, '.studio-canvas-layout-menu')).toBeGreaterThanOrEqual(4.5);
      expect(await contrast(zoom.locator('span[aria-label="Diagram zoom level"]'), '.studio-canvas-zoom')).toBeGreaterThanOrEqual(4.5);
      await summary.focus(); await page.keyboard.press('Enter');
      await expect(menu).toHaveAttribute('open', '');
      await expect(menu.getByRole('button', { name: 'Arrange visible concepts' })).toBeVisible();
      expect(await contrast(menu.locator('p').first(), '.studio-canvas-layout-menu')).toBeGreaterThanOrEqual(4.5);
      await summary.focus(); await page.keyboard.press('Enter');
      await expect(menu).not.toHaveAttribute('open', '');
    }
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
