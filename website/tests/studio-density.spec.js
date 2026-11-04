import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

async function withStudio(page, run) {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Test workbench', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|recordName:string?\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await run({ store, workspace });
  } finally { await page.close(); await service.shutdown(); store.close(); }
}

async function openAppearanceSettings(page, isMobile) {
  if (isMobile) await page.getByRole('button', { name: 'Appearance and density settings' }).click();
}

test('density preference changes spacing, preserves readable text and survives reload', async ({ page, isMobile }) => {
  await withStudio(page, async ({ store, workspace }) => {
    await openAppearanceSettings(page, isMobile);
    const density = page.getByLabel('Density');
    await expect(density).toHaveValue('comfortable');
    await page.getByLabel('Search model').fill('Record');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Record', exact: true }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    const field = page.getByRole('rowheader', { name: /recordName/ });
    await expect(field).toBeVisible();
    const before = await field.evaluate(element => ({ padding: parseFloat(getComputedStyle(element).paddingTop), font: getComputedStyle(element).fontSize }));
    if (isMobile) await density.selectOption('compact');
    else { await density.focus(); await density.press('End'); await expect(density).toHaveValue('compact'); }
    await expect(page.locator('html')).toHaveAttribute('data-studio-density', 'compact');
    const after = await field.evaluate(element => ({ padding: parseFloat(getComputedStyle(element).paddingTop), font: getComputedStyle(element).fontSize }));
    expect(after.padding).toBeLessThan(before.padding);
    expect(after.font).toBe(before.font);
    expect(store.get(workspace.id).revision).toBe(0);
    await page.getByLabel('Appearance').selectOption('dark');
    await expect(density).toHaveValue('compact');
    await page.reload();
    await expect(page.getByLabel('Density')).toHaveValue('compact');
    await expect(page.locator('html')).toHaveAttribute('data-studio-density', 'compact');
    await page.getByLabel('Density').selectOption('comfortable');
    await expect(page.locator('html')).toHaveAttribute('data-studio-density', 'comfortable');
  });
});

test('compact density preserves compact-screen navigation targets', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Touch-sized compact navigation is exercised on mobile.');
  await page.setViewportSize({ width: 320, height: 800 });
  await withStudio(page, async () => {
    await page.getByRole('button', { name: 'Appearance and density settings' }).click();
    await page.getByLabel('Density').selectOption('compact');
    const controls = page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button');
    await expect(controls).toHaveCount(4);
    expect(await controls.evaluateAll(elements => elements.every(element => element.getBoundingClientRect().height >= 44))).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });
});

test('invalid stored density falls back to comfortable', async ({ page }) => {
  await page.addInitScript(() => { try { localStorage.setItem('chargeweave.studio.density.v1', 'unknown'); } catch { /* No origin yet. */ } });
  await withStudio(page, async () => {
    await expect(page.getByLabel('Density')).toHaveValue('comfortable');
    await expect(page.locator('html')).toHaveAttribute('data-studio-density', 'comfortable');
  });
});
