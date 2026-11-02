import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

for (const width of [320, 390]) {
  test(`touch controls remain reachable at ${width}px`, async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Touch targets are exercised on the mobile device profile.');
    await page.setViewportSize({ width, height: 800 });
    const store = new WorkspaceStore(':memory:');
    const workspace = store.create({ title: 'Touch', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|\n' });
    const pairingCode = 'synthetic-pairing-code-'.repeat(2);
    const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
    service.listen(0, '127.0.0.1'); await once(service, 'listening');
    try {
      await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
      await page.getByLabel('Pairing code').fill(pairingCode);
      await page.getByRole('button', { name: 'Pair local studio' }).click();
      expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
      await page.getByLabel('Density').selectOption('compact');
      const targets = [page.getByLabel('Appearance'), page.getByLabel('Density'), page.getByLabel('Search model'), page.getByRole('button', { name: 'Check draft', exact: true })];
      for (const target of targets) {
        const box = await target.boundingBox();
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
      await page.getByLabel('Search model').fill('Device');
      await page.getByRole('button', { name: 'Search', exact: true }).click();
      await page.getByRole('button', { name: 'Device', exact: true }).click();
      await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram' }).click();
      const graphControl = page.locator('.studio-flow .react-flow__controls button').first();
      await expect(graphControl).toBeVisible();
      const graphBox = await graphControl.boundingBox();
      expect(graphBox.width).toBeGreaterThanOrEqual(44);
      expect(graphBox.height).toBeGreaterThanOrEqual(44);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      expect(store.get(workspace.id).revision).toBe(0);
    } finally { await page.close(); await service.shutdown(); store.close(); }
  });
}

test('touch tablet keeps the expanded results and status in the viewport', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Touch layout is exercised on the mobile device profile.');
  await page.setViewportSize({ width: 1024, height: 768 });
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Touch tablet', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('navigation', { name: 'Results panels' }).getByRole('button', { name: 'Problems' }).click();
    const bounds = await page.evaluate(() => ({ dock: document.querySelector('.studio-bottom-dock').getBoundingClientRect().toJSON(), status: document.querySelector('.studio-status-bar').getBoundingClientRect().toJSON(), viewport: window.innerHeight, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth }));
    expect(bounds.dock.bottom).toBeLessThanOrEqual(bounds.status.top + 1);
    expect(bounds.status.bottom).toBeLessThanOrEqual(bounds.viewport + 1);
    expect(bounds.overflow).toBe(false);
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
