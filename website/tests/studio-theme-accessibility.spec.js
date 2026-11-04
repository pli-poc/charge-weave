import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
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

test('studio preferences toggle accessibly and reset their default across the compact breakpoint', async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 800 });
  await withStudio(page, async () => {
    const toggle = page.getByRole('button', { name: 'Studio preferences' });
    const appearance = page.getByLabel('Appearance');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(appearance).toHaveCount(0);
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(appearance).toBeVisible();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(appearance).toHaveCount(0);

    await page.setViewportSize({ width: 601, height: 800 });
    await expect(page.locator('.studio-appearance-menu')).toHaveAttribute('data-compact', 'false');
    await expect(appearance).toBeVisible();
    await page.setViewportSize({ width: 600, height: 800 });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(appearance).toHaveCount(0);
  });
});

test('connected editor avoids WCAG 2.1 and 2.2 A/AA violations in both themes', async ({ page, isMobile }) => {
  await page.setViewportSize({ width: isMobile ? 390 : 1440, height: isMobile ? 844 : 1000 });
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Accessibility audit', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|peer:Record?\nDevice|Record|A device.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    for (const theme of ['light', 'dark']) {
      if (isMobile) await page.getByRole('button', { name: 'Studio preferences' }).click();
      await page.getByLabel('Appearance').selectOption(theme);
      if (isMobile) await page.getByRole('button', { name: 'Studio preferences' }).click();
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      expect(result.violations.map(({ id, help, nodes }) => ({ id, help, elements: nodes.map(node => node.target) }))).toEqual([]);
      await page.getByLabel('Search model').fill('Device');
      await page.getByRole('button', { name: 'Search', exact: true }).click();
      await page.getByRole('button', { name: 'Device', exact: true }).click();
      if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
      await expect(page.getByRole('heading', { name: 'Device', exact: true })).toBeVisible();
      const selectedResult = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      expect(selectedResult.violations.map(({ id, help, nodes }) => ({ id, help, elements: nodes.map(node => node.target) }))).toEqual([]);
      const panelNavigation = page.getByRole('navigation', { name: 'Results panels' });
      if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Results' }).click();
      for (const panel of ['Problems', 'Checks', 'Activity', 'Output']) {
        await panelNavigation.getByRole('button', { name: panel, exact: true }).click();
        const panelResult = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
        expect(panelResult.violations.map(({ id, help, nodes }) => ({ id, help, elements: nodes.map(node => node.target) })), `${panel} panel in ${theme} theme`).toEqual([]);
      }
      if (!isMobile) {
        await page.getByRole('navigation', { name: 'Workspace destinations' }).getByRole('link', { name: 'Review' }).click();
        const reviewResult = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
        expect(reviewResult.violations.map(({ id, help, nodes }) => ({ id, help, elements: nodes.map(node => node.target) })), `Review workspace in ${theme} theme`).toEqual([]);
        await page.getByRole('navigation', { name: 'Workspace destinations' }).getByRole('link', { name: 'Model' }).click();
      }
      if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Model' }).click();
      await page.getByRole('button', { name: 'Clear search' }).click();
    }
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('populated result panels and review avoid WCAG 2.1 A and AA violations', async ({ page, isMobile }) => {
  await page.setViewportSize({ width: isMobile ? 390 : 1440, height: isMobile ? 844 : 1000 });
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Populated accessibility audit', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|peer:Record?\nDevice|Record|A device.|\n' });
  store.apply({ workspaceId: workspace.id, actor: 'Synthetic accessibility reviewer', operationId: 'accessibility-activity', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Device', definition: 'A reviewed synthetic device.' }] });
  const snapshot = store.get(workspace.id);
  const job = store.createJob(workspace.id, snapshot.revision, snapshot.sourceDigest, 'Synthetic accessibility reviewer', 'accessibility-check', 'structural').job;
  store.startJobStep(job.id, 0, 'synthetic-accessibility-check');
  store.finishJobStep(job.id, 0, 'failed', 'Synthetic recorded failure details.');
  store.updateJob(job.id, 'failed', 'Synthetic recorded job output.');
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    for (const theme of ['light', 'dark']) {
      if (isMobile) await page.getByRole('button', { name: 'Studio preferences' }).click();
      await page.getByLabel('Appearance').selectOption(theme);
      if (isMobile) await page.getByRole('button', { name: 'Studio preferences' }).click();
      if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Results' }).click();
      const panelNavigation = page.getByRole('navigation', { name: 'Results panels' });
      for (const panel of ['Problems', 'Checks', 'Activity', 'Output']) {
        await panelNavigation.getByRole('button', { name: panel === 'Problems' ? /Problems/ : panel, exact: panel !== 'Problems' }).click();
        const panelContent = page.getByRole('region', { name: { Problems: 'Problems', Checks: 'Validation issues', Activity: 'Recent activity', Output: 'Job output' }[panel] });
        await expect(panelContent).toBeVisible();
        const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
        expect(result.violations.map(({ id, help, nodes }) => ({ id, help, elements: nodes.map(node => node.target) })), `Populated ${panel} panel in ${theme} theme`).toEqual([]);
      }
      if (!isMobile) {
        await page.getByRole('navigation', { name: 'Workspace destinations' }).getByRole('link', { name: 'Review' }).click();
        const reviewResult = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
        expect(reviewResult.violations.map(({ id, help, nodes }) => ({ id, help, elements: nodes.map(node => node.target) })), `Populated Review workspace in ${theme} theme`).toEqual([]);
        await page.getByRole('navigation', { name: 'Workspace destinations' }).getByRole('link', { name: 'Model' }).click();
      }
    }
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('forced colors retain a system focus ring and reduced motion keeps zoom controls usable', async ({ page, isMobile }) => {
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await withStudio(page, async () => {
    expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches && matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
    const search = page.getByLabel('Search model');
    await search.focus();
    const focusColors = await search.evaluate(element => {
      const probe = document.createElement('span');
      probe.style.color = 'Highlight';
      document.body.append(probe);
      const systemColor = getComputedStyle(probe).color;
      probe.remove();
      const style = getComputedStyle(element);
      return { systemColor, outlineColor: style.outlineColor, outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
    });
    expect(focusColors).toEqual({ systemColor: focusColors.systemColor, outlineColor: focusColors.systemColor, outlineStyle: 'solid', outlineWidth: '2px' });
    await expect(search).toHaveCSS('transition-duration', '0s');
    await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto');

    await page.getByLabel('Search model').fill('Device');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    const canvas = page.getByRole('region', { name: 'Relationships for Device' });
    await expect(canvas).toHaveAttribute('data-layout', 'ready');
    const zoom = canvas.getByLabel('Diagram zoom level');
    const zoomOut = canvas.locator('.react-flow__controls-zoomout');
    await expect(zoomOut).toBeVisible();
    await zoomOut.click();
    await expect(zoom).not.toHaveText('100%');
    await canvas.getByRole('button', { name: 'Reset zoom to 100%' }).click();
    await expect(zoom).toHaveText('100%');
    if (isMobile) await expect(page.getByRole('navigation', { name: 'Workspace sections' })).toBeVisible();
  });
});

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
    const fieldName = region.locator('tbody th[scope="row"]').first();
    const initialLeft = await fieldName.evaluate(element => element.getBoundingClientRect().left);
    await region.focus();
    for (let i = 0; i < 8; i++) await page.keyboard.press('ArrowRight');
    await expect.poll(() => region.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
    expect(Math.abs((await fieldName.evaluate(element => element.getBoundingClientRect().left)) - initialLeft)).toBeLessThan(2);
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
    await rail.getByRole('link', { name: 'Activity' }).press('Enter');
    await expect(page.getByRole('navigation', { name: 'Results panels' }).getByRole('button', { name: 'Activity' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('heading', { name: 'Recent activity' })).toBeFocused();
    await page.getByRole('button', { name: 'Hide navigator' }).click();
    await rail.getByRole('link', { name: 'Model' }).press('Enter');
    await expect(page.getByRole('heading', { name: 'Discover concepts' })).toBeVisible();
    await rail.getByRole('link', { name: 'Review' }).press('Enter');
    await expect(page.getByRole('heading', { name: 'Review workflow' })).toBeVisible();
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
    const settings = page.getByRole('button', { name: 'Studio preferences' });
    await expect(settings).toBeVisible();
    await expect(page.getByLabel('Appearance')).toHaveCount(0);
    await expect(page.getByLabel('Density')).toHaveCount(0);
    const settingsTop = await settings.evaluate(element => element.getBoundingClientRect().top);
    const workspaceTop = await page.locator('.studio-workspaces').evaluate(element => element.getBoundingClientRect().top);
    expect(workspaceTop - settingsTop).toBeLessThan(100);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    for (const theme of ['light', 'dark']) {
      await settings.click();
      await expect(page.getByLabel('Appearance')).toBeVisible();
      await expect(page.getByLabel('Density')).toBeVisible();
      await page.getByLabel('Appearance').selectOption(theme);
      await settings.click();
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
