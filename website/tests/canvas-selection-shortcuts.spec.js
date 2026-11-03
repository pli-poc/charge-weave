import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('layout selection shortcuts use visible concepts and leave the model unchanged', async ({ page, isMobile }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Selection shortcuts', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|peer:Record?\n' });
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
    await canvas.getByText('Layout', { exact: true }).click();
    await canvas.getByText('Align selected concepts', { exact: true }).click();
    const all = canvas.getByRole('button', { name: 'Select all visible concepts' });
    await all.focus(); await page.keyboard.press('Enter');
    await expect(canvas.getByRole('checkbox', { name: 'Device', exact: true })).toBeChecked();
    await expect(canvas.getByRole('checkbox', { name: 'Record', exact: true })).toBeChecked();
    await canvas.getByRole('button', { name: 'Clear layout selection' }).click();
    await canvas.getByRole('button', { name: 'Select Device and visible neighbours' }).click();
    await expect(canvas).toContainText('2 concepts selected for layout.');
    await canvas.getByRole('button', { name: 'Hide selected from diagram' }).click();
    await all.click();
    await expect(canvas).toContainText('1 concepts selected for layout.');
    await expect(canvas.getByRole('checkbox', { name: 'Device', exact: true })).toBeChecked();
    await expect(canvas.getByRole('checkbox', { name: 'Record', exact: true })).toHaveCount(0);
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
