import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('layout redo restores an undone change and is cleared by a new layout change', async ({ page, isMobile }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Layout redo', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|peer:Record?\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  const initial = { Device: { x: 700, y: 500 }, Record: { x: 0, y: 0 } };
  await page.addInitScript(({ id, initial }) => sessionStorage.setItem(`chargeweave.canvas.v2.${id}.default`, JSON.stringify(initial)), { id: workspace.id, initial });
  const positions = () => page.evaluate(id => JSON.parse(sessionStorage.getItem(`chargeweave.canvas.v2.${id}.default`)), workspace.id);
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByLabel('Search model').fill('Device');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram' }).click();
    const canvas = page.getByRole('region', { name: 'Relationships for Device' });
    await expect(canvas).toHaveAttribute('data-layout', 'ready');
    await canvas.getByText('Layout', { exact: true }).click();
    await canvas.getByText('Align selected concepts', { exact: true }).click();
    await canvas.getByRole('checkbox', { name: 'Device', exact: true }).check();
    await canvas.getByRole('checkbox', { name: 'Record', exact: true }).check();
    const redo = canvas.getByRole('button', { name: 'Redo last layout change' });
    await expect(redo).toBeDisabled();
    await canvas.getByRole('button', { name: 'Align left' }).click();
    const aligned = await positions();
    expect(aligned.Device.x).toBe(0);
    await canvas.getByRole('button', { name: 'Undo last layout change' }).click();
    expect(await positions()).toEqual(initial);
    await redo.focus(); await page.keyboard.press('Enter');
    expect(await positions()).toEqual(aligned);
    await canvas.getByRole('button', { name: 'Undo last layout change' }).click();
    await canvas.getByRole('button', { name: 'Align top' }).click();
    await expect(redo).toBeDisabled();
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
