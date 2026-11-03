import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('zoom controls show scale, simplify overview and restore readable detail', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The compact experience uses the relationship list first.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Zoom', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|serial:string? peer:Record?\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
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
    const node = canvas.locator('.react-flow__node[data-id="Device"]');
    await expect(node.getByText('serial:string?')).toBeVisible();
    const before = await page.evaluate(id => sessionStorage.getItem(`chargeweave.canvas.v2.${id}.default`), workspace.id);
    for (let count = 0; count < 6; count += 1) await canvas.locator('.react-flow__controls-zoomout').click();
    await expect(canvas).toHaveAttribute('data-detail', 'overview');
    await expect(node.getByText('serial:string?')).toHaveCount(0);
    expect(Number.parseInt(await canvas.getByLabel('Diagram zoom level').textContent(), 10)).toBeLessThan(60);
    const reset = canvas.getByRole('button', { name: 'Reset zoom to 100%' });
    await reset.focus(); await page.keyboard.press('Enter');
    await expect(canvas.getByLabel('Diagram zoom level')).toHaveText('100%');
    await expect(canvas).toHaveAttribute('data-detail', 'full');
    await expect(node.getByText('serial:string?')).toBeVisible();
    expect(await page.evaluate(id => sessionStorage.getItem(`chargeweave.canvas.v2.${id}.default`), workspace.id)).toBe(before);
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('a very small overview can focus its root when selection is outside the view', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The compact experience uses the relationship list first.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Overview focus', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|peer:Record?\nExtra|Record|Another concept.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode); await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByLabel('Search model').fill('Device'); await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    const canvas = page.getByRole('region', { name: 'Relationships for Device' });
    await expect(canvas).toHaveAttribute('data-layout', 'ready');
    await page.getByLabel('Search model').fill('Extra'); await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Extra', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Workspace status' })).toContainText('Selected: Extra');
    for (let count = 0; count < 11; count++) await canvas.locator('.react-flow__controls-zoomout').click();
    const root = canvas.getByRole('button', { name: 'Focus view root' });
    await expect(root).toBeVisible(); await root.focus(); await page.keyboard.press('Enter');
    await expect(canvas.getByLabel('Diagram zoom level')).toHaveText('100%');
    await expect(canvas.getByRole('button', { name: 'Reset zoom to 100%' })).toBeFocused();
    await expect(page.getByRole('region', { name: 'Workspace status' })).toContainText('Selected: Extra');
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
