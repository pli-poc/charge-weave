import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('narrow controlled values with a guarded draft and revision check', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Controlled values', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|state:{Draft,Final,Archived}?\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await page.getByRole('button', { name: 'Narrow values for state' }).click();
    const editor = page.getByRole('region', { name: 'Narrow allowed values' });
    await expect(editor.getByRole('button', { name: 'Apply allowed values' })).toBeDisabled();
    await editor.getByLabel('Archived').uncheck();
    await expect(editor.getByRole('button', { name: 'Apply allowed values' })).toBeEnabled();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Model' }).click();
    await page.getByRole('list', { name: 'Loaded concepts by module' }).getByRole('button', { name: 'Record', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Unapplied edits' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Stay and keep editing' }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await expect(editor.getByLabel('Archived')).not.toBeChecked();
    store.apply({ workspaceId: workspace.id, actor: 'other', operationId: 'other-change', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Record', definition: 'Updated record.' }] });
    await expect(editor.getByRole('alert')).toContainText('draft changed');
    await expect(editor.getByRole('button', { name: 'Apply allowed values' })).toBeDisabled();
    await expect(editor.getByLabel('Archived')).not.toBeChecked();
    await editor.getByRole('button', { name: 'Cancel allowed values' }).click();
    await page.getByRole('button', { name: 'Narrow values for state' }).click();
    await editor.getByLabel('Archived').uncheck();
    await editor.getByRole('button', { name: 'Apply allowed values' }).click();
    await expect.poll(() => store.get(workspace.id).revision).toBe(2);
    expect(store.get(workspace.id).schema).toContain('state:{Draft,Final}?');
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
