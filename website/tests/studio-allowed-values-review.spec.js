import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('review latest controlled values without losing a changed selection', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Value review', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|state:{Draft,Final,Archived}?\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, eventPollMs: 100, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await page.getByRole('button', { name: 'Narrow values for state' }).click();
    const editor = page.getByRole('region', { name: 'Narrow allowed values' });
    store.apply({ workspaceId: workspace.id, actor: 'other', operationId: 'replace-values', expectedRevision: 0, commands: [{ type: 'property.update', owner: 'Device', name: 'state', expectedRange: '{Draft,Final,Archived}', expectedCardinality: '?', range: '{Draft,New,Archived}', cardinality: '?' }] });
    const alert = editor.getByRole('alert');
    await expect(alert).toContainText('Current: Draft, New, Archived');
    await expect(alert).toContainText('These selected values no longer exist: Final');
    await editor.getByLabel('New (new in current contract)').check();
    await editor.getByLabel('Final', { exact: true }).uncheck();
    await expect(editor.getByRole('button', { name: 'Reviewed latest, keep selected values' })).toBeDisabled();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Model' }).click();
    await page.getByRole('list', { name: 'Loaded concepts by module' }).getByRole('button', { name: 'Record', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Unapplied edits' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Stay and keep editing' }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await editor.getByLabel('Archived', { exact: true }).uncheck();
    await editor.getByRole('button', { name: 'Reviewed latest, keep selected values' }).click();
    await expect(editor.getByLabel('Draft', { exact: true })).toBeChecked();
    await expect(editor.getByLabel('New', { exact: true })).toBeChecked();
    await editor.getByRole('button', { name: 'Apply allowed values' }).click();
    await expect.poll(() => store.get(workspace.id).revision).toBe(2);
    expect(store.get(workspace.id).schema).toContain('state:{Draft,New}?');
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
