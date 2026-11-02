import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('a field conflict preserves entered values until an explicit review', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Field conflict', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|recordName:string? alias:string?\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, eventPollMs: 100, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('button', { name: 'Record', exact: true }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await page.getByRole('button', { name: 'Edit recordName' }).click();
    await page.getByLabel('New cardinality').selectOption('+');
    await expect(page.getByRole('button', { name: 'Edit alias' })).toBeDisabled();
    store.apply({ workspaceId: workspace.id, actor: 'other', operationId: 'remote', expectedRevision: 0, commands: [{ type: 'property.update', owner: 'Record', name: 'recordName', expectedRange: 'string', expectedCardinality: '?', range: 'string', cardinality: '!' }] });
    const conflict = page.getByRole('alert').filter({ hasText: 'This field changed in another client.' });
    await expect(conflict).toBeVisible();
    await expect(conflict).toContainText('Previous: string (?)');
    await expect(conflict).toContainText('Current: string (!)');
    await expect(conflict).toContainText('Entered: string (+)');
    await expect(page.getByLabel('New cardinality')).toHaveValue('+');
    await expect(page.getByRole('button', { name: 'Update field contract' })).toBeDisabled();
    await conflict.getByRole('button', { name: 'Reviewed latest, keep my field input' }).click();
    await expect(page.getByLabel('New cardinality')).toHaveValue('+');
    await expect(page.getByRole('button', { name: 'Update field contract' })).toBeEnabled();
    await page.getByRole('button', { name: 'Update field contract' }).click();
    await expect.poll(() => store.get(workspace.id).revision).toBe(2);
    expect(store.get(workspace.id).schema).toContain('recordName:string+');
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('an untouched field editor refreshes its contract when another client changes it', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Clean field', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|recordName:string?\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, eventPollMs: 100, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('button', { name: 'Record', exact: true }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await page.getByRole('button', { name: 'Edit recordName' }).click();
    store.apply({ workspaceId: workspace.id, actor: 'other', operationId: 'remote', expectedRevision: 0, commands: [{ type: 'property.update', owner: 'Record', name: 'recordName', expectedRange: 'string', expectedCardinality: '?', range: 'string', cardinality: '!' }] });
    await expect(page.getByLabel('New cardinality')).toHaveValue('!');
    await expect(page.getByRole('alert').filter({ hasText: 'This field changed in another client.' })).toHaveCount(0);
    expect(store.get(workspace.id).revision).toBe(1);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
