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
    const mutation = page.waitForRequest(request => request.url().endsWith('/mcp') && request.postDataJSON()?.params?.name === 'ontology_changeset_apply');
    await editor.getByRole('button', { name: 'Apply allowed values' }).click();
    expect((await mutation).postDataJSON().params.arguments.expectedEventSequence).toBeGreaterThanOrEqual(1);
    await expect.poll(() => store.get(workspace.id).revision).toBe(2);
    expect(store.get(workspace.id).schema).toContain('state:{Draft,Final}?');
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('change-set transitions at the same revision do not silently rebase allowed values', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Change set guard', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|state:{Draft,Final,Archived}?\n' });
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
    await editor.getByLabel('Archived').uncheck();
    const opened = store.openChangeSet({ workspaceId: workspace.id, actor: 'other', operationId: 'open', expectedRevision: 0, intent: 'Review new policy', requirements: [] });
    await expect(editor.getByRole('alert')).toContainText('change set');
    await expect(editor.getByRole('button', { name: 'Apply allowed values' })).toBeDisabled();
    await expect(editor.getByLabel('Archived')).not.toBeChecked();
    expect(store.get(workspace.id).revision).toBe(0);
    await editor.getByRole('button', { name: 'Cancel allowed values' }).click();
    await page.getByRole('button', { name: 'Narrow values for state' }).click();
    await editor.getByLabel('Archived').uncheck();
    store.recordReview(workspace.id, { actor: 'reviewer', operationId: 'reject', expectedRevision: 0, changeSetId: opened.changeSet.id, sourceDigest: workspace.sourceDigest, decision: 'reject', reason: 'Needs revision' });
    await expect(editor.getByRole('alert')).toContainText('locked');
    await expect(editor.getByRole('button', { name: 'Apply allowed values' })).toBeDisabled();
    await expect(editor.getByLabel('Archived')).not.toBeChecked();
    store.reopenChangeSet({ workspaceId: workspace.id, actor: 'reviewer', operationId: 'reopen', expectedRevision: 0, changeSetId: opened.changeSet.id });
    await expect(page.locator('body')).toContainText('reopened change set');
    await expect(editor.getByRole('button', { name: 'Apply allowed values' })).toBeDisabled();
    await editor.getByRole('button', { name: 'Cancel allowed values' }).click();
    await expect(page.getByRole('button', { name: 'Narrow values for state' })).toBeEnabled();
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
