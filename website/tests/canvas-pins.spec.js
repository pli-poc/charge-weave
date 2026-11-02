import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

async function setup(page, { brokenPins = false } = {}) {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Local pins', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|peer:Record?\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  await page.addInitScript(({ id, broken }) => {
    const positions = `chargeweave.canvas.v2.${id}.default`, pins = `chargeweave.canvas-pins.v1.${id}.default`;
    if (sessionStorage.getItem(positions) === null) sessionStorage.setItem(positions, JSON.stringify({ Device: { x: 700, y: 500 }, Record: { x: 0, y: 0 }, HiddenRecord: { x: 1200, y: 200 } }));
    if (broken && sessionStorage.getItem(pins) === null) sessionStorage.setItem(pins, '{broken');
  }, { id: workspace.id, broken: brokenPins });
  await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
  await page.getByLabel('Pairing code').fill(pairingCode);
  await page.getByRole('button', { name: 'Pair local studio' }).click();
  return { store, workspace, service };
}

async function openDevice(page) {
  await page.getByLabel('Search model').fill('Device');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByRole('button', { name: 'Device', exact: true }).click();
  const canvas = page.getByRole('region', { name: 'Relationships for Device' });
  await expect(canvas).toHaveAttribute('data-layout', 'ready');
  return canvas;
}

test('pins are view-local, survive reload, and protect positions during layout', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The compact experience uses a relationship list first.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const { store, workspace, service } = await setup(page);
  try {
    let canvas = await openDevice(page);
    await canvas.getByText('Layout', { exact: true }).click();
    await canvas.getByText('Align selected concepts', { exact: true }).click();
    await canvas.getByRole('checkbox', { name: 'Device', exact: true }).check();
    await canvas.getByRole('button', { name: 'Pin selected', exact: true }).click();
    await expect(canvas.locator('.react-flow__node[data-id="Device"]')).toContainText('Pinned');
    await canvas.getByRole('checkbox', { name: 'Record', exact: true }).check();
    await expect(canvas.getByRole('button', { name: 'Align left' })).toBeDisabled();
    await expect(canvas).toContainText('Unpin selected concepts before alignment.');
    expect(store.get(workspace.id).revision).toBe(0);
    await page.reload();
    await expect(page.locator('.studio-sr-status')).toContainText('revision 0');
    canvas = await openDevice(page);
    await expect(canvas.locator('.react-flow__node[data-id="Device"]')).toContainText('Pinned');
    await canvas.getByText('Layout', { exact: true }).click();
    await canvas.getByRole('button', { name: 'Arrange visible concepts' }).click();
    await expect(canvas.getByText(/Visible concepts arranged locally/)).toBeVisible();
    const positions = await page.evaluate(id => JSON.parse(sessionStorage.getItem(`chargeweave.canvas.v2.${id}.default`)), workspace.id);
    expect(positions.Device).toEqual({ x: 700, y: 500 });
    expect(positions.Record).not.toEqual({ x: 0, y: 0 });
    expect(positions.HiddenRecord).toEqual({ x: 1200, y: 200 });
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('unreadable pin settings are not silently overwritten', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The compact experience uses a relationship list first.');
  const { store, workspace, service } = await setup(page, { brokenPins: true });
  try {
    const canvas = await openDevice(page);
    await canvas.getByText('Layout', { exact: true }).click();
    await expect(canvas.getByRole('button', { name: 'Arrange visible concepts' })).toBeDisabled();
    const key = `chargeweave.canvas-pins.v1.${workspace.id}.default`;
    expect(await page.evaluate(value => sessionStorage.getItem(value), key)).toBe('{broken');
    await canvas.getByRole('button', { name: 'Replace unreadable pin settings' }).click();
    expect(await page.evaluate(value => sessionStorage.getItem(value), key)).toBe('[]');
    await expect(canvas.getByRole('button', { name: 'Arrange visible concepts' })).toBeEnabled();
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
