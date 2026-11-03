import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('focused diagram pans with arrow keys without moving concepts', async ({ page, isMobile }) => {
  await page.setViewportSize({ width: isMobile ? 320 : 1280, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Direct keyboard pan', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|peer:Record?\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  const positionKey = `chargeweave.canvas.v2.${workspace.id}.default`;
  const viewportKey = `chargeweave.canvas-viewport.v1.${workspace.id}.default.Device`;
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
    await expect(canvas).toHaveAttribute('tabindex', '0');
    await expect(canvas).toHaveAttribute('aria-keyshortcuts', 'ArrowLeft ArrowRight ArrowUp ArrowDown');
    await expect(canvas).toHaveAccessibleDescription(/Use the arrow keys to pan the diagram/);
    await canvas.getByRole('button', { name: 'Focus selected concept' }).click();
    await expect.poll(() => page.evaluate(key => sessionStorage.getItem(key), viewportKey)).not.toBeNull();
    const before = await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)), viewportKey);
    const positions = await page.evaluate(key => sessionStorage.getItem(key), positionKey);
    await canvas.focus();
    await page.keyboard.press('ArrowLeft');
    await expect.poll(() => page.evaluate(key => JSON.parse(sessionStorage.getItem(key)).x, viewportKey)).toBeCloseTo(before.x - 100);
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => page.evaluate(key => JSON.parse(sessionStorage.getItem(key)).y, viewportKey)).toBeCloseTo(before.y + 100);
    const after = await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)), viewportKey);
    await page.keyboard.press('Shift+ArrowRight');
    expect(await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)), viewportKey)).toEqual(after);
    const summary = canvas.locator('.studio-canvas-layout-menu > summary');
    await summary.focus(); await page.keyboard.press('ArrowRight');
    expect(await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)), viewportKey)).toEqual(after);
    expect(await page.evaluate(key => sessionStorage.getItem(key), positionKey)).toBe(positions);
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
