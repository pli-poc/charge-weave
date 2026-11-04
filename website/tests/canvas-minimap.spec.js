import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('diagram overview can be toggled by keyboard without changing the model', async ({ page, isMobile }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Diagram overview', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|peer:Record?\n' });
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
    await expect(canvas.getByRole('img', { name: 'Diagram overview' })).toHaveCount(0);
    await canvas.getByText('Layout', { exact: true }).click();
    const toggle = canvas.getByRole('checkbox', { name: 'Show diagram overview' });
    await toggle.focus(); await page.keyboard.press('Space');
    const minimap = canvas.getByRole('img', { name: 'Diagram overview' });
    await expect(minimap).toBeVisible();
    await expect(minimap.locator('.react-flow__minimap-node')).toHaveCount(2);
    await expect(canvas).toContainText('Use Pan diagram or the zoom controls to navigate with the keyboard.');
    await toggle.focus(); await page.keyboard.press('Space');
    await expect(minimap).toHaveCount(0);
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
