import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

async function openDevice(page, isMobile) {
  await page.getByLabel('Search model').fill('Device');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByRole('button', { name: 'Device', exact: true }).click();
  if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram' }).click();
  const canvas = page.getByRole('region', { name: 'Relationships for Device' });
  await expect(canvas).toHaveAttribute('data-layout', 'ready');
  return canvas;
}

test('hide and restore affect only the local diagram and retain positions and pins', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Visibility', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|peer:Record?\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    let canvas = await openDevice(page, isMobile);
    const positionKey = `chargeweave.canvas.v2.${workspace.id}.default`;
    const positions = await page.evaluate(key => sessionStorage.getItem(key), positionKey);
    await page.getByLabel('Inspect relationship').selectOption({ label: 'Device — peer → Record' });
    await expect(page.getByRole('region', { name: 'Relationship details' })).toBeVisible();
    await canvas.getByText('Layout', { exact: true }).click();
    await canvas.getByText('Align selected concepts', { exact: true }).click();
    const record = canvas.getByRole('checkbox', { name: 'Record', exact: true });
    await record.focus(); await page.keyboard.press('Space');
    await expect(record).toBeChecked();
    await canvas.getByRole('button', { name: 'Pin selected', exact: true }).click();
    await canvas.getByRole('checkbox', { name: 'Device', exact: true }).check();
    await canvas.getByRole('button', { name: 'Hide selected from diagram' }).click();
    await expect(canvas.locator('.react-flow__node[data-id="Record"]')).toHaveCount(0);
    await expect(canvas.locator('.react-flow__node[data-id="Device"]')).toBeVisible();
    await expect(page.getByRole('region', { name: 'Relationship details' })).toHaveCount(0);
    expect(await page.evaluate(key => sessionStorage.getItem(key), positionKey)).toBe(positions);
    expect(store.get(workspace.id).revision).toBe(0);
    await page.reload();
    await expect(page.locator('.studio-sr-status')).toContainText('revision 0');
    canvas = await openDevice(page, isMobile);
    await expect(canvas.locator('.react-flow__node[data-id="Record"]')).toHaveCount(0);
    await canvas.getByText('Layout', { exact: true }).click();
    await canvas.getByText('Hidden concepts (1)', { exact: true }).click();
    await canvas.getByRole('button', { name: 'Restore Record' }).click();
    await expect(canvas.locator('.react-flow__node[data-id="Record"]')).toContainText('Pinned');
    expect(await page.evaluate(key => sessionStorage.getItem(key), positionKey)).toBe(positions);
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
