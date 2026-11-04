import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('diagram can be panned with keyboard buttons without changing concept positions', async ({ page, isMobile }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Keyboard pan', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|peer:Record?\n' });
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
    await canvas.getByRole('button', { name: 'Focus selected concept' }).click();
    await expect.poll(() => page.evaluate(key => sessionStorage.getItem(key), viewportKey)).not.toBeNull();
    const before = await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)), viewportKey);
    const positions = await page.evaluate(key => sessionStorage.getItem(key), positionKey);
    await canvas.getByText('Layout', { exact: true }).click();
    await canvas.getByText('Pan diagram', { exact: true }).click();
    const left = canvas.getByRole('button', { name: 'Move diagram left' });
    await left.focus(); await page.keyboard.press('Enter');
    await expect.poll(() => page.evaluate(key => JSON.parse(sessionStorage.getItem(key)).x, viewportKey)).toBeCloseTo(before.x - 100);
    await canvas.getByRole('button', { name: 'Move diagram down' }).click();
    await expect.poll(() => page.evaluate(key => JSON.parse(sessionStorage.getItem(key)).y, viewportKey)).toBeCloseTo(before.y + 100);
    expect(await page.evaluate(key => sessionStorage.getItem(key), positionKey)).toBe(positions);
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
