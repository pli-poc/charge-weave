import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('200% browser-scale reflow keeps the model and relationship list usable', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop browser-scale emulation is exercised in Chromium desktop.');
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 640, height: 400, deviceScaleFactor: 2, mobile: false, screenWidth: 1280, screenHeight: 800 });
  const scale = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, pixelRatio: devicePixelRatio }));
  expect(scale).toEqual({ width: 640, height: 400, pixelRatio: 2 });

  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Zoom reflow', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|peer:Record?\nDevice|Record|A device.|record:Record?\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    const sections = page.getByRole('navigation', { name: 'Workspace sections' });
    await expect(sections).toBeVisible();
    await page.getByLabel('Search model').fill('Device');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    const list = page.getByRole('region', { name: 'Relationship list for Device' });
    await expect(list).toBeVisible();
    const relatedConcept = list.getByRole('button', { name: 'Open related concept Record' }).first();
    await expect(list.getByRole('button', { name: 'Open related concept Record' })).toHaveCount(2);
    await relatedConcept.scrollIntoViewIfNeeded();
    await expect(relatedConcept).toBeInViewport();
    await expect(page.getByRole('region', { name: 'Workspace status' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await relatedConcept.click();
    await expect(page.getByRole('region', { name: 'Relationships for Record' })).toBeVisible();

    await sections.getByRole('button', { name: 'Inspector' }).click();
    await expect(page.getByRole('heading', { name: 'Record', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  } finally { await cdp.detach(); await page.close(); await service.shutdown(); store.close(); }
});

test('400% effective browser zoom keeps core modelling tasks reachable', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop browser-scale emulation is exercised in Chromium desktop.');
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 200, deviceScaleFactor: 4, mobile: false, screenWidth: 1280, screenHeight: 800 });
  const scale = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, pixelRatio: devicePixelRatio }));
  expect(scale).toEqual({ width: 320, height: 200, pixelRatio: 4 });

  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: '400 percent reflow', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|peer:Record?\nDevice|Record|A device.|record:Record?\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    const sections = page.getByRole('navigation', { name: 'Workspace sections' });
    await expect(sections).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

    await sections.getByRole('button', { name: 'Model' }).click();
    const navigator = page.locator('#studio-navigator-pane');
    await navigator.getByLabel('Search model').fill('Device');
    await navigator.getByRole('button', { name: 'Search', exact: true }).click();
    const device = navigator.getByRole('button', { name: 'Device', exact: true });
    await device.scrollIntoViewIfNeeded();
    await expect(device).toBeVisible();
    await device.click();
    await sections.getByRole('button', { name: 'Inspector' }).click();
    await expect(page.getByRole('heading', { name: 'Device', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

    await sections.getByRole('button', { name: 'Diagram' }).click();
    await expect(page.getByRole('region', { name: 'Relationships for Device' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Relationship list for Device' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  } finally { await cdp.detach(); await page.close(); await service.shutdown(); store.close(); }
});

test('short 320px viewport keeps controls and dialogs reachable', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Compact reflow is exercised in the mobile browser.');
  // A short CSS viewport exercises the reflow expected at high zoom without claiming a real zoom measurement.
  await page.setViewportSize({ width: 320, height: 240 });
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Reflow', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('button', { name: 'Studio preferences' }).click();
    await page.getByLabel('Appearance').selectOption('light');
    await expect(page.locator('html')).toHaveAttribute('data-studio-theme', 'light');
    const sections = page.getByRole('navigation', { name: 'Workspace sections' });
    await expect(sections).toHaveCSS('position', 'static');
    await expect(page.getByRole('region', { name: 'Workspace status' })).toHaveCSS('position', 'static');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await sections.getByRole('button', { name: 'Results' }).click();
    await page.getByRole('navigation', { name: 'Results panels' }).getByRole('button', { name: 'Activity', exact: true }).click();
    const activityLink = page.getByRole('link', { name: 'Open full activity history' });
    await page.keyboard.press('Tab');
    await activityLink.focus();
    await expect(activityLink).toHaveCSS('outline-color', 'rgb(5, 103, 85)');
    const commandTrigger = page.getByRole('button', { name: 'Commands', exact: true });
    await commandTrigger.click();
    const dialog = page.getByRole('dialog', { name: 'Commands' });
    await expect(dialog.getByLabel('Find a command')).toBeFocused();
    const bounds = await dialog.boundingBox();
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(240);
    await expect(dialog.getByRole('button', { name: 'Close commands' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(commandTrigger).toBeFocused();
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('unsaved-edit dialog remains scrollable in a short viewport', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Compact reflow is exercised in the mobile browser.');
  await page.setViewportSize({ width: 320, height: 240 });
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Unsaved edit', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByLabel('Search model').fill('Record');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Record', exact: true }).click();
    const sections = page.getByRole('navigation', { name: 'Workspace sections' });
    await sections.getByRole('button', { name: 'Inspector' }).click();
    await page.getByRole('textbox', { name: 'Definition', exact: true }).fill('Unapplied edit retained for review.');
    await sections.getByRole('button', { name: 'Model' }).click();
    await page.getByLabel('Search model').fill('Device');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Unapplied edits' });
    await expect(dialog).toBeVisible();
    const bounds = await dialog.boundingBox();
    expect(bounds.height).toBeLessThanOrEqual(208);
    const stay = dialog.getByRole('button', { name: 'Stay and keep editing' });
    await stay.scrollIntoViewIfNeeded();
    await expect(stay).toBeVisible();
    await stay.click();
    await expect(dialog).toHaveCount(0);
    await sections.getByRole('button', { name: 'Inspector' }).click();
    await expect(page.getByRole('textbox', { name: 'Definition', exact: true })).toHaveValue('Unapplied edit retained for review.');
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
