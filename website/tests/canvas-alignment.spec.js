import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

async function setup(page) {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Alignment', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|peer:Record?\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  await page.addInitScript(id => sessionStorage.setItem(`chargeweave.canvas.v2.${id}.default`, JSON.stringify({ Device: { x: 700, y: 500 }, Record: { x: 0, y: 0 }, HiddenRecord: { x: 1200, y: 200 } })), workspace.id);
  await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
  await page.getByLabel('Pairing code').fill(pairingCode);
  await page.getByRole('button', { name: 'Pair local studio' }).click();
  await page.getByLabel('Search model').fill('Device');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByRole('button', { name: 'Device', exact: true }).click();
  const canvas = page.getByRole('region', { name: 'Relationships for Device' });
  await expect(canvas).toHaveAttribute('data-layout', 'ready');
  await canvas.getByText('Layout', { exact: true }).click();
  await canvas.getByText('Align selected concepts', { exact: true }).click();
  return { store, workspace, service, canvas };
}

test('layout selection aligns visible concepts without semantic writes', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop canvas positioning is separate from the compact relationship list.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const { store, workspace, service, canvas } = await setup(page);
  try {
    const menu = canvas.locator('.studio-canvas-layout-menu');
    await menu.getByRole('checkbox', { name: 'Device' }).check();
    await menu.getByRole('checkbox', { name: 'Record' }).check();
    await expect(menu).toContainText('2 concepts selected for layout.');
    await expect(canvas.locator('.react-flow__node[data-id="Device"]')).toContainText('Selected for layout');
    await expect(canvas.locator('.react-flow__node[data-id="Record"]')).toContainText('Selected for layout');
    await menu.getByRole('button', { name: 'Align left' }).click();
    const positions = await page.evaluate(id => JSON.parse(sessionStorage.getItem(`chargeweave.canvas.v2.${id}.default`)), workspace.id);
    expect(positions.Device.x).toBe(positions.Record.x);
    expect(positions.Device.y).toBe(500);
    expect(positions.HiddenRecord).toEqual({ x: 1200, y: 200 });
    expect(store.get(workspace.id).revision).toBe(0);
    await expect(page.getByRole('region', { name: 'Workspace status' })).toContainText('View changed locally');
    await canvas.getByText('Layout', { exact: true }).click();
    const node = canvas.locator('.react-flow__node[data-id="Device"]');
    await node.focus();
    await page.keyboard.press('Shift+Enter');
    await expect(node).not.toContainText('Selected for layout');
    await canvas.getByText('Layout', { exact: true }).click();
    await expect(menu.getByRole('checkbox', { name: 'Device' })).not.toBeChecked();
    await expect(menu.getByRole('checkbox', { name: 'Record' })).toBeChecked();
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('alignment leaves positions unchanged if local storage fails', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop canvas positioning is separate from the compact relationship list.');
  const { store, workspace, service, canvas } = await setup(page);
  try {
    const menu = canvas.locator('.studio-canvas-layout-menu');
    await menu.getByRole('checkbox', { name: 'Device' }).check();
    await menu.getByRole('checkbox', { name: 'Record' }).check();
    const key = `chargeweave.canvas.v2.${workspace.id}.default`;
    const before = await page.evaluate(id => sessionStorage.getItem(id), key);
    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function(name, value) { if (name.startsWith('chargeweave.canvas.')) throw new Error('Synthetic storage failure'); return original.call(this, name, value); };
    });
    await menu.getByRole('button', { name: 'Align left' }).click();
    await expect(canvas.getByText('Could not store the alignment. No positions were changed.')).toBeVisible();
    expect(await page.evaluate(id => sessionStorage.getItem(id), key)).toBe(before);
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
