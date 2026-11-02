import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('field creation retains input and requires explicit review after another client changes the workspace', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Field draft', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, eventPollMs: 100, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await page.getByText('Add a field or relationship', { exact: true }).click();
    await page.getByLabel('Field name', { exact: true }).fill('serialNumber');
    await page.getByLabel('Datatype or target class', { exact: true }).fill('string');
    await expect(page.getByRole('button', { name: 'Add field', exact: true })).toBeEnabled();
    store.apply({ workspaceId: workspace.id, actor: 'other', operationId: 'other-change', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Device', definition: 'A revised device.' }] });
    const alert = page.getByRole('alert').filter({ hasText: 'workspace changed since this field draft' });
    await expect(alert).toBeVisible();
    await expect(page.getByLabel('Field name', { exact: true })).toHaveValue('serialNumber');
    await expect(page.getByRole('button', { name: 'Add field', exact: true })).toBeDisabled();
    await expect(alert.getByText(/serialNumber/)).toBeVisible();
    const review = alert.getByRole('button', { name: 'Reviewed latest, continue field draft' });
    await expect(review).toBeEnabled();
    await review.click();
    await expect(page.getByRole('button', { name: 'Add field', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Add field', exact: true }).click();
    await expect.poll(() => store.get(workspace.id).revision).toBe(2);
    expect(store.get(workspace.id).schema).toContain('serialNumber:string?');
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
