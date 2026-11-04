import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

async function setup(page) {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Viewport', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|peer:Record?\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
  await page.getByLabel('Pairing code').fill(pairingCode);
  await page.getByRole('button', { name: 'Pair local studio' }).click();
  await page.getByLabel('Search model').fill('Device');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByRole('button', { name: 'Device', exact: true }).click();
  const canvas = page.getByRole('region', { name: 'Relationships for Device' });
  await expect(canvas).toHaveAttribute('data-layout', 'ready');
  await canvas.getByRole('button', { name: 'Focus selected concept' }).click();
  await expect(canvas.getByLabel('Diagram zoom level')).toHaveText('100%');
  return { store, workspace, service, canvas };
}

test('zoom is restored independently for each open view', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The compact experience uses the relationship list first.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const { store, workspace, service, canvas } = await setup(page);
  try {
    await canvas.locator('.react-flow__controls-zoomout').click();
    await canvas.locator('.react-flow__controls-zoomout').click();
    const zoom = canvas.getByLabel('Diagram zoom level');
    await expect(zoom).not.toHaveText('100%');
    const originalZoom = await zoom.textContent();
    const key = `chargeweave.canvas-viewport.v1.${workspace.id}.default.Device`;
    await expect.poll(() => page.evaluate(name => JSON.parse(sessionStorage.getItem(name) || 'null')?.zoom ?? 1, key)).toBeLessThan(1);
    await page.getByLabel('View ID').fill('other');
    await page.getByRole('button', { name: 'Choose view ID' }).click();
    await expect(page.getByRole('navigation', { name: 'Open diagram views' }).getByRole('button', { name: 'other', exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('region', { name: 'Relationships for Device' }).getByLabel('Diagram zoom level')).toHaveText('100%');
    await page.getByRole('navigation', { name: 'Open diagram views' }).getByRole('button', { name: 'default', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Relationships for Device' }).getByLabel('Diagram zoom level')).toHaveText(originalZoom);
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('navigation back restores the viewport for the previous root', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The compact experience uses the relationship list first.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const { store, workspace, service, canvas } = await setup(page);
  try {
    await canvas.locator('.react-flow__controls-zoomout').click();
    await canvas.locator('.react-flow__controls-zoomout').click();
    const originalZoom = await canvas.getByLabel('Diagram zoom level').textContent();
    const key = `chargeweave.canvas-viewport.v1.${workspace.id}.default.Device`;
    await expect.poll(() => page.evaluate(name => JSON.parse(sessionStorage.getItem(name) || 'null')?.zoom ?? 1, key)).toBeLessThan(1);
    const parent = canvas.locator('.react-flow__node[data-id="Record"]');
    await parent.focus(); await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'Record', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Focus neighbourhood' }).click();
    await expect(page.getByRole('region', { name: 'Relationships for Record' })).toHaveAttribute('data-layout', 'ready');
    await page.getByRole('button', { name: 'Previous view' }).click();
    const restored = page.getByRole('region', { name: 'Relationships for Device' });
    await expect(restored).toHaveAttribute('data-layout', 'ready');
    await expect(restored.getByLabel('Diagram zoom level')).toHaveText(originalZoom);
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
