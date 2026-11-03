import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('concept input is retained and reviewed after intervening workspace activity', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Concept draft', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, eventPollMs: 100, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram' }).click();
    await page.getByText('Add a concept', { exact: true }).click();
    await page.getByLabel('Parent class').fill('Device');
    await page.getByRole('button', { name: 'Disconnect', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Unapplied edits' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Stay and keep editing' }).click();
    await expect(page.getByLabel('Parent class')).toHaveValue('Device');
    await page.getByLabel('Class name').fill('Sensor');
    await page.getByLabel('Class definition').fill('A sensor.');
    store.suggestView(workspace.id, { actor: 'other', operationId: 'suggest', expectedRevision: 0, root: 'Record', viewpoint: 'information', explanation: 'Review this concept.' });
    const conflict = page.getByRole('alert').filter({ hasText: 'workspace changed since this concept draft began' });
    await expect(conflict).toBeVisible();
    await expect(conflict).toContainText('Sensor');
    await expect(conflict).toContainText('parent: Device');
    await expect(page.getByRole('button', { name: 'Add concept' })).toBeDisabled();
    await expect(page.getByLabel('Class name')).toHaveValue('Sensor');
    const review = conflict.getByRole('button', { name: 'Reviewed latest, continue concept draft' });
    await expect(review).toBeEnabled();
    await review.click();
    await page.getByRole('button', { name: 'Add concept' }).click();
    await expect.poll(() => store.get(workspace.id).revision).toBe(1);
    expect(store.get(workspace.id).schema).toContain('Sensor|Device|A sensor.|');
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
