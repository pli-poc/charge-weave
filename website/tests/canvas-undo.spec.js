import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

async function setup(page) {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Layout undo', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|peer:Record?\n' });
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
  return { store, workspace, service, canvas };
}

const storedPositions = (page, id) => page.evaluate(workspaceId => JSON.parse(sessionStorage.getItem(`chargeweave.canvas.v2.${workspaceId}.default`)), id);

test('undo arrangement restores view positions without changing ontology or pins', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The desktop canvas uses position controls; mobile uses the relationship list first.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const { store, workspace, service, canvas } = await setup(page);
  try {
    const before = await storedPositions(page, workspace.id);
    await canvas.getByText('Layout', { exact: true }).click();
    await canvas.getByRole('button', { name: 'Arrange visible concepts' }).click();
    await expect(canvas.getByText(/Visible concepts arranged locally/)).toBeVisible();
    expect(await storedPositions(page, workspace.id)).not.toEqual(before);
    await canvas.getByText('Layout', { exact: true }).click();
    await canvas.getByText('Align selected concepts', { exact: true }).click();
    await canvas.getByRole('checkbox', { name: 'Device', exact: true }).check();
    await canvas.getByRole('button', { name: 'Pin selected', exact: true }).click();
    await canvas.getByRole('button', { name: 'Undo last layout change' }).click();
    await expect(canvas.getByText('Undid the last layout arrangement. Ontology and pin settings are unchanged.')).toBeVisible();
    expect(await storedPositions(page, workspace.id)).toEqual(before);
    await expect(canvas.locator('.react-flow__node[data-id="Device"]')).toContainText('Pinned');
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('undo restores a dragged position and rejects externally changed storage', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The desktop canvas uses position controls; mobile uses the relationship list first.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const { store, workspace, service, canvas } = await setup(page);
  try {
    await canvas.getByRole('button', { name: 'Focus selected concept' }).click();
    const node = canvas.locator('.react-flow__node[data-id="Device"]');
    await node.scrollIntoViewIfNeeded();
    const box = await node.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + 65, box.y + box.height / 2 + 45, { steps: 6 }); await page.mouse.up();
    const moved = await storedPositions(page, workspace.id);
    expect(moved.Device).not.toEqual({ x: 700, y: 500 });
    await canvas.getByText('Layout', { exact: true }).click();
    const undo = canvas.getByRole('button', { name: 'Undo last layout change' });
    await expect(undo).toBeEnabled();
    const key = `chargeweave.canvas.v2.${workspace.id}.default`;
    await page.evaluate(id => { const value = JSON.parse(sessionStorage.getItem(id)); value.Device.x += 1; sessionStorage.setItem(id, JSON.stringify(value)); }, key);
    await undo.click();
    await expect(canvas.getByText('Could not undo: the local layout changed or could not be stored. No positions were changed.')).toBeVisible();
    const external = await storedPositions(page, workspace.id);
    expect(external.Device.x).toBe(moved.Device.x + 1);
    await page.evaluate(({ id, value }) => sessionStorage.setItem(id, JSON.stringify(value)), { id: key, value: moved });
    await undo.click();
    await expect(canvas.getByText('Undid the last layout move. Ontology and pin settings are unchanged.')).toBeVisible();
    expect((await storedPositions(page, workspace.id)).Device).toEqual({ x: 700, y: 500 });
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
