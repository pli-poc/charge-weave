import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('keyboard graph focus and panel resizing remain visible in forced colors', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Resizable desktop panels and keyboard graph interaction are exercised on desktop.');
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Keyboard focus', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|owner:Record?\n' });
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
    const node = page.locator('.studio-flow .react-flow__node[data-id="Record"]');
    await expect(node).toBeVisible();
    await page.keyboard.press('Tab');
    await node.focus();
    await expect(node).toHaveCSS('outline-style', 'solid');
    await expect(node).toHaveCSS('outline-color', 'rgb(23, 63, 116)');
    await page.getByLabel('Inspect relationship').selectOption({ index: 1 });
    const details = page.getByRole('region', { name: 'Relationship details' });
    await expect(details).toBeVisible();
    for (const theme of ['dark', 'light']) {
      await page.getByLabel('Appearance').selectOption(theme);
      const ratios = await details.evaluate(section => {
        const luminance = color => {
          const channels = color.match(/[\d.]+/g).slice(0, 3).map(value => Number(value) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
          return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
        };
        const background = luminance(getComputedStyle(section).backgroundColor);
        return [...section.querySelectorAll('h3, p')].map(element => {
          const foreground = luminance(getComputedStyle(element).color);
          return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
        });
      });
      expect(ratios.length).toBeGreaterThan(1);
      expect(ratios.every(ratio => ratio >= 4.5)).toBe(true);
      await page.keyboard.press('Tab');
      const action = details.getByRole('button').first();
      await action.focus();
      await expect(action).toHaveCSS('outline-color', theme === 'dark' ? 'rgb(124, 221, 194)' : 'rgb(5, 103, 85)');
    }
    const separator = page.getByRole('separator', { name: 'Resize navigator' });
    await expect(separator).toBeVisible();
    await page.emulateMedia({ forcedColors: 'active' });
    await separator.focus();
    await expect(separator).toHaveCSS('outline-style', 'solid');
    await expect(separator).toHaveCSS('outline-width', '2px');
    const before = Number(await separator.getAttribute('aria-valuenow'));
    await separator.press('ArrowRight');
    await expect(separator).toHaveAttribute('aria-valuenow', String(Math.min(360, before + 10)));
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('compact selected navigation remains distinct in forced colors', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Compact navigation is exercised on mobile.');
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ forcedColors: 'active' });
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Forced colors', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    const nav = page.getByRole('navigation', { name: 'Workspace sections' });
    const selected = nav.getByRole('button', { name: 'Model' });
    const other = nav.getByRole('button', { name: 'Diagram' });
    await expect(selected).toHaveAttribute('aria-pressed', 'true');
    const colors = await Promise.all([selected.evaluate(node => getComputedStyle(node).borderTopColor), other.evaluate(node => getComputedStyle(node).borderTopColor)]);
    expect(colors[0]).not.toBe(colors[1]);
    await other.click();
    await expect(other).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
