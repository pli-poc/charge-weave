import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('focusing layout concepts reveals the diagram and retains menu input', async ({ page, isMobile }) => {
  await page.setViewportSize({ width: isMobile ? 320 : 1280, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Layout focus', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|peer:Record?\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  const initial = { Device: { x: 0, y: 0 }, Record: { x: 1400, y: 1000 } };
  await page.addInitScript(({ id, initial }) => sessionStorage.setItem(`chargeweave.canvas.v2.${id}.default`, JSON.stringify(initial)), { id: workspace.id, initial });
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
    const menu = canvas.locator('.studio-canvas-layout-menu');
    const summary = menu.locator(':scope > summary');
    await summary.click();
    await menu.getByText('Align selected concepts', { exact: true }).click();
    await menu.getByRole('checkbox', { name: 'Record', exact: true }).check();
    const groupName = menu.getByRole('textbox', { name: 'New group name' });
    await groupName.fill('Retained draft');
    const focus = menu.getByRole('button', { name: 'Focus selected layout concepts' });
    await focus.focus(); await page.keyboard.press('Enter');
    await expect(menu).not.toHaveAttribute('open', '');
    await expect(summary).toBeFocused();
    const record = canvas.locator('.react-flow__node[data-id="Record"]');
    await expect.poll(async () => {
      const [node, bounds] = await Promise.all([record.boundingBox(), canvas.boundingBox()]);
      return Boolean(node && bounds && node.x >= bounds.x - 1 && node.y >= bounds.y - 1 && node.x + node.width <= bounds.x + bounds.width + 1 && node.y + node.height <= bounds.y + bounds.height + 1);
    }).toBe(true);
    await summary.press('Enter');
    await expect(groupName).toHaveValue('Retained draft');
    expect(await page.evaluate(id => JSON.parse(sessionStorage.getItem(`chargeweave.canvas.v2.${id}.default`)), workspace.id)).toEqual(initial);
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
