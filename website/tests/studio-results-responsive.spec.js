import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('long activity reasons remain readable in a narrow results panel', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Narrow results', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const rationale = `https://example.test/${'unbroken-reference-'.repeat(40)}`;
  store.apply({ workspaceId: workspace.id, actor: 'test', operationId: 'edit', expectedRevision: 0, rationale, commands: [{ type: 'class.describe', name: 'Record', definition: 'A revised record.' }] });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, repository: '.', staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Results' }).click();
    const results = page.getByRole('region', { name: 'Workspace results' });
    await results.getByRole('button', { name: 'Activity', exact: true }).click();
    const content = results.getByRole('region', { name: 'Results content' });
    await expect(content.getByText(`Reason: ${rationale}`)).toBeVisible();
    expect(await content.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    expect(store.get(workspace.id).revision).toBe(1);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
