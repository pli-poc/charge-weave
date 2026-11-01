import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('browser discovers and edits the shared MCP workspace', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Browser test', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const token = 'test-token-'.repeat(4);
  const service = createHttpService({ store, token, allowedOrigin: 'http://127.0.0.1:4173' });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto('modelling/');
    await page.getByLabel('Local service').fill(`http://127.0.0.1:${service.address().port}`);
    await page.getByLabel('Workspace ID').fill(workspace.id);
    await page.getByLabel('Draft token').fill(token);
    await page.getByRole('button', { name: 'Connect' }).click();
    await expect(page.getByRole('status')).toContainText('revision 0');
    await page.getByLabel('Search model').fill('Record');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Record', exact: true }).click();
    await page.getByRole('textbox', { name: 'Definition', exact: true }).fill('An edited record.');
    await page.getByRole('button', { name: 'Save definition' }).click();
    await expect(page.getByRole('status')).toContainText('revision 1');
    expect(store.search(workspace.id, 'Record').results[0].definition).toBe('An edited record.');
    await page.getByRole('button', { name: 'Inspect changes' }).click();
    await expect(page.getByText('changed: Record')).toBeVisible();
    await expect(page.getByText('After: An edited record.')).toBeVisible();
    await page.getByText('Add a concept').click();
    await page.getByLabel('Class name').fill('MaintenanceWindow');
    await page.getByLabel('Class definition').fill('A planned maintenance window.');
    await page.getByRole('button', { name: 'Add concept' }).click();
    await expect(page.getByRole('status')).toContainText('revision 2');
    await page.getByLabel('Search model').fill('MaintenanceWindow');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'MaintenanceWindow', exact: true }).click();
    await expect(page.getByRole('img', { name: 'Relationships for MaintenanceWindow' })).toBeVisible();
    await expect(page.getByText('subClassOf →')).toBeVisible();
    await page.getByText('Add a field or relationship').click();
    await page.getByLabel('Field name').fill('windowNote');
    await page.getByRole('button', { name: 'Add field' }).click();
    await expect(page.getByRole('status')).toContainText('revision 3');
    expect(store.search(workspace.id, 'MaintenanceWindow').results[0].fields).toBe('windowNote:string?');
  } finally { await page.close(); await new Promise(resolve => service.close(resolve)); store.close(); }
});
