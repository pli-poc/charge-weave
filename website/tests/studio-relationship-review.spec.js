import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('relationship input survives activity and explicit endpoint review', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Keyboard relationship creation is exercised in the desktop diagram.');
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Relationship review', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, eventPollMs: 100, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByLabel('Search model').fill('Device');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    await page.getByText('Create a relationship using the keyboard').click();
    const relate = page.getByRole('button', { name: 'Relate Device to Record' });
    await relate.click();
    const form = page.getByRole('form', { name: 'New relationship' });
    await form.getByLabel('Predicate name').fill('relatedRecord');
    await form.getByLabel('Relationship description').fill('A related record.');
    await relate.click();
    await expect(page.getByText('Finish or cancel the current relationship draft before starting another.')).toBeVisible();
    await expect(form.getByLabel('Predicate name')).toHaveValue('relatedRecord');
    store.suggestView(workspace.id, { actor: 'other', operationId: 'suggest', expectedRevision: 0, root: 'Record', viewpoint: 'information', explanation: 'Inspect this concept.' });
    const warning = form.getByRole('alert');
    await expect(warning).toContainText('workspace changed');
    await expect(form.getByRole('button', { name: 'Create relationship', exact: true })).toBeDisabled();
    await warning.getByRole('button', { name: 'Inspect latest relationship endpoints' }).click();
    await expect(warning).toContainText('Current source Device: A device.');
    await expect(warning).toContainText('Current target Record: A record.');
    await warning.getByRole('button', { name: 'Reviewed latest, keep relationship input' }).click();
    await expect(form.getByLabel('Predicate name')).toHaveValue('relatedRecord');
    await expect(form.getByLabel('Relationship description')).toHaveValue('A related record.');
    await form.getByRole('button', { name: 'Create relationship', exact: true }).click();
    await expect.poll(() => store.get(workspace.id).revision).toBe(1);
    expect(store.get(workspace.id).schema).toContain('relatedRecord:Record?');
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
