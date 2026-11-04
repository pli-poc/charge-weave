import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('definition edits retain text and require review after workspace activity', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Definition draft', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, eventPollMs: 100, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('button', { name: 'Record', exact: true }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    const input = page.getByRole('textbox', { name: 'Definition', exact: true });
    await input.fill('My draft definition.');
    store.suggestView(workspace.id, { actor: 'other', operationId: 'suggest', expectedRevision: 0, root: 'Record', viewpoint: 'information', explanation: 'Review this concept.' });
    const changed = page.getByRole('alert').filter({ hasText: 'workspace changed while you were editing this definition' });
    await expect(changed).toBeVisible();
    await expect(input).toHaveValue('My draft definition.');
    await expect(changed).toContainText('Previous: A record.');
    await expect(changed).toContainText('Latest: A record.');
    await expect(changed).toContainText('Your text: My draft definition.');
    await expect(page.getByRole('button', { name: 'Save definition' })).toBeDisabled();
    await changed.getByRole('button', { name: 'Keep my text' }).click();
    await expect(page.getByRole('button', { name: 'Save definition' })).toBeEnabled();
    store.apply({ workspaceId: workspace.id, actor: 'other', operationId: 'edit', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Record', definition: 'Another definition.' }] });
    const conflict = page.getByRole('alert').filter({ hasText: 'This definition changed in another client' });
    await expect(conflict).toBeVisible();
    await expect(conflict).toContainText('Latest: Another definition.');
    await expect(conflict).toContainText('Your text: My draft definition.');
    await conflict.getByRole('button', { name: 'Keep my text' }).click();
    await page.getByRole('button', { name: 'Save definition' }).click();
    await expect.poll(() => store.get(workspace.id).revision).toBe(2);
    expect(store.get(workspace.id).schema).toContain('Record|root|My draft definition.|');
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
