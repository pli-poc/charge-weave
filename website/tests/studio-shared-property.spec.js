import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('studio explains and confirms a compatible shared property before adding it', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Shared property', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|label:string?\nDevice|Record|A device.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await page.getByText('Add a field or relationship', { exact: true }).click();
    await page.getByLabel('Field name', { exact: true }).fill('label');
    await page.getByLabel('Datatype or target class', { exact: true }).fill('string');
    const prompt = new Promise(resolve => page.once('dialog', async dialog => { resolve(dialog.message()); await dialog.accept(); }));
    await page.getByRole('button', { name: 'Add field', exact: true }).click();
    await expect.poll(() => store.get(workspace.id).revision).toBe(1);
    expect(await prompt).toContain('Record: string ?');
    expect(await prompt).toContain('extends the same global property');
    expect(store.get(workspace.id).schema).toContain('Device|Record|A device.|label:string?');
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
