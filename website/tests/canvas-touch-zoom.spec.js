import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

for (const width of [320, 390]) {
  test(`touch zoom reset is reachable at ${width}px`, async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Touch targets are checked in the mobile browser profile.');
    await page.setViewportSize({ width, height: 800 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const store = new WorkspaceStore(':memory:');
    const workspace = store.create({ title: 'Touch zoom', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|peer:Record?\n' });
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
      await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram' }).click();
      const canvas = page.getByRole('region', { name: 'Relationships for Device' });
      await expect(canvas).toHaveAttribute('data-layout', 'ready');
      expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
      const reset = canvas.getByRole('button', { name: 'Reset zoom to 100%' });
      const bounds = await reset.boundingBox();
      expect(bounds.width).toBeGreaterThanOrEqual(44);
      expect(bounds.height).toBeGreaterThanOrEqual(44);
      await canvas.locator('.react-flow__controls-zoomout').click();
      await expect(canvas.getByLabel('Diagram zoom level')).not.toHaveText('100%');
      await reset.click();
      await expect(canvas.getByLabel('Diagram zoom level')).toHaveText('100%');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      expect(store.get(workspace.id).revision).toBe(0);
    } finally { await page.close(); await service.shutdown(); store.close(); }
  });
}
