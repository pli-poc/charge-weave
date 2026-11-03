import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

async function withStudio(page, run) {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Theme accessibility', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|peer:Record?\nDevice|Record|A device.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await run();
  } finally { await page.close(); await service.shutdown(); store.close(); }
}

test('graph controls stay legible on hover and show a contrasting focus ring in both themes', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Hover is exercised in the desktop browser.');
  await withStudio(page, async () => {
    await page.getByLabel('Search model').fill('Device');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    const control = page.locator('.studio-flow .react-flow__controls button').first();
    await expect(control).toBeVisible();
    for (const theme of ['dark', 'light']) {
      await page.getByLabel('Appearance').selectOption(theme);
      await expect(page.getByLabel('Diagram relationship line styles')).toHaveCSS('color', theme === 'dark' ? 'rgb(228, 238, 239)' : 'rgb(24, 58, 57)');
      await control.hover();
      const contrast = await control.evaluate(element => {
        const style = getComputedStyle(element);
        const luminance = color => {
          const channels = color.match(/[\d.]+/g).slice(0, 3).map(value => Number(value) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
          return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
        };
        const foreground = luminance(style.color), background = luminance(style.backgroundColor);
        return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
      });
      expect(contrast).toBeGreaterThanOrEqual(4.5);
      const cardContrast = await page.locator('.studio-flow-node').first().evaluate(element => {
        const luminance = color => color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => value / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
        const style = getComputedStyle(element), foreground = luminance(style.color), background = luminance(style.backgroundColor);
        return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
      });
      expect(cardContrast).toBeGreaterThanOrEqual(4.5);
      const menuContrast = await page.locator('.studio-canvas-layout-menu > summary').evaluate(element => {
        const luminance = color => color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => value / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
        const foreground = luminance(getComputedStyle(element).color), background = luminance(getComputedStyle(element.parentElement).backgroundColor);
        return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
      });
      expect(menuContrast).toBeGreaterThanOrEqual(4.5);
      await page.keyboard.press('Tab');
      await control.focus();
      await expect(control).toHaveCSS('outline-color', 'rgb(23, 63, 116)');
    }
  });
});

test('the narrow inspector keeps field columns readable and keyboard scrollable', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The drawer-width inspector is exercised on desktop.');
  await page.setViewportSize({ width: 1280, height: 800 });
  await withStudio(page, async () => {
    await page.getByLabel('Search model').fill('Record');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Record', exact: true }).click();
    await page.getByRole('button', { name: 'Show inspector' }).click();
    const region = page.getByRole('region', { name: 'Fields table, scroll horizontally' });
    await expect(region).toBeVisible();
    expect(await region.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
    const cell = region.getByRole('cell', { name: 'Optional (0..1)' });
    expect(await cell.evaluate(element => element.getBoundingClientRect().width)).toBeGreaterThan(70);
    await region.focus();
    for (let i = 0; i < 8; i++) await page.keyboard.press('ArrowRight');
    await expect.poll(() => region.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  });
});

test('desktop activity rail keeps labelled destinations keyboard accessible', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The desktop rail is replaced by compact navigation on mobile.');
  await withStudio(page, async () => {
    const rail = page.getByRole('navigation', { name: 'Workspace destinations' });
    for (const name of ['Model', 'Checks', 'Activity', 'Review']) {
      const destination = rail.getByRole('link', { name, exact: true });
      await expect(destination).toBeVisible();
      await destination.focus();
      await expect(destination).toBeFocused();
    }
    await rail.getByRole('link', { name: 'Checks' }).press('Enter');
    await expect(page.getByRole('navigation', { name: 'Results panels' }).getByRole('button', { name: 'Checks' })).toHaveAttribute('aria-pressed', 'true');
  });
});

test('320px compact navigation keeps controls usable without page overflow', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Compact navigation is exercised in the mobile browser.');
  await page.setViewportSize({ width: 320, height: 800 });
  await withStudio(page, async () => {
    const navigation = page.getByRole('navigation', { name: 'Workspace sections' });
    const controls = navigation.getByRole('button');
    await expect(controls).toHaveCount(4);
    const bounds = await controls.evaluateAll(elements => elements.map(element => {
      const box = element.getBoundingClientRect();
      return { top: box.top, height: box.height };
    }));
    expect(bounds.every(box => box.height >= 44)).toBe(true);
    expect(bounds[2].top).toBeGreaterThan(bounds[0].top);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    for (const theme of ['light', 'dark']) {
      await page.getByLabel('Appearance').selectOption(theme);
      await navigation.getByRole('button', { name: 'Diagram' }).click();
      await navigation.getByRole('button', { name: 'Diagram' }).hover();
      await expect(navigation.getByRole('button', { name: 'Diagram' })).toHaveCSS('background-color', 'rgb(43, 98, 89)');
      await expect(navigation.getByRole('button', { name: 'Diagram' })).toHaveCSS('color', 'rgb(255, 255, 255)');
      await expect(page.getByRole('heading', { name: 'Workspace', exact: true })).toBeFocused();
      const tabs = page.getByRole('navigation', { name: 'Editor documents' }).getByRole('button');
      expect(await tabs.evaluateAll(elements => elements.every(element => element.scrollWidth <= element.clientWidth && getComputedStyle(element).whiteSpace === 'nowrap'))).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    }
  });
});
