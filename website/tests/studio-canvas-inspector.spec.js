import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('diagram selection opens the inspector without changing the view or discarding input', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Compact navigation uses a separate inspector surface.');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Diagram inspection', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|peer:Record?\n' });
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
    await canvas.locator('.react-flow__node[data-id="Record"]').click();
    const inspector = page.locator('#studio-inspector-pane');
    await expect(inspector).toBeVisible();
    await expect(inspector.getByRole('heading', { name: 'Record', exact: true })).toBeVisible();
    await expect(canvas).toBeVisible();
    await inspector.getByRole('textbox', { name: 'Definition', exact: true }).fill('Unapplied record definition.');
    await canvas.locator('.react-flow__node[data-id="Device"]').click();
    const guard = page.getByRole('dialog', { name: 'Unapplied edits' });
    await expect(guard).toBeVisible();
    await guard.getByRole('button', { name: 'Stay and keep editing' }).click();
    await expect(inspector.getByRole('textbox', { name: 'Definition', exact: true })).toHaveValue('Unapplied record definition.');
    await expect(inspector.getByRole('heading', { name: 'Record', exact: true })).toBeVisible();
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
