import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('selected diagram relationship exposes details without covering the canvas', async ({ page, isMobile }) => {
  await page.setViewportSize({ width: isMobile ? 320 : 1280, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Relationship selection', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|peer:Record?\n' });
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
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram' }).click();
    const canvas = page.getByRole('region', { name: 'Relationships for Device' });
    await expect(canvas).toHaveAttribute('data-layout', 'ready');
    const positions = await page.evaluate(id => sessionStorage.getItem(`chargeweave.canvas.v2.${id}.default`), workspace.id);
    const edge = canvas.getByRole('group', { name: 'Relationship peer: Device to Record; multiplicity 0..1' });
    await edge.focus(); await page.keyboard.press('Enter');
    const strip = page.getByRole('group', { name: /Selected relationship: Relationship peer/ });
    await expect(strip).toContainText('peer · Device → Record');
    const [stripBox, canvasBox] = await Promise.all([strip.boundingBox(), canvas.boundingBox()]);
    expect(stripBox.y + stripBox.height).toBeLessThanOrEqual(canvasBox.y + 1);
    expect(stripBox.x).toBeGreaterThanOrEqual(0);
    expect(stripBox.x + stripBox.width).toBeLessThanOrEqual((isMobile ? 320 : 1280) + 1);
    const details = page.getByRole('region', { name: 'Relationship details' });
    const open = strip.getByRole('button', { name: 'Open relationship details' });
    await expect(open).toHaveAttribute('aria-controls', await details.getAttribute('id'));
    await open.focus(); await page.keyboard.press('Enter');
    await expect(details).toBeFocused();
    await expect(details).toContainText('Relationship: peer');
    const clear = strip.getByRole('button', { name: 'Clear relationship selection' });
    await clear.focus(); await page.keyboard.press('Enter');
    await expect(strip).toHaveCount(0);
    await expect(details).toHaveCount(0);
    await expect(canvas).toBeFocused();
    expect(await page.evaluate(id => sessionStorage.getItem(`chargeweave.canvas.v2.${id}.default`), workspace.id)).toBe(positions);
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
