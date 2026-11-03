import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('search scopes find properties and requirements and route commands into the palette', async ({ page, isMobile }) => {
  await page.setViewportSize({ width: isMobile ? 390 : 1440, height: 1000 });
  const store = new WorkspaceStore(':memory:');
  const schema = 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|peer:Record?\n';
  const requirements = JSON.stringify([{ id: 'BR-001', statement: 'Track device peers.', classes: ['Device'], rules: [] }], null, 2) + '\n';
  const hash = value => createHash('sha256').update(value).digest('hex');
  const manifest = [
    { path: 'model/domain.schema', sha256: hash(schema) },
    { path: 'requirements/business-requirements.json', sha256: hash(requirements) },
    { path: 'tools/authoring_adapter.py', sha256: hash(readFileSync(new URL('../../tools/authoring_adapter.py', import.meta.url))) },
    { path: 'tools/domain_schema.py', sha256: hash(readFileSync(new URL('../../tools/domain_schema.py', import.meta.url))) },
  ];
  const workspace = store.create({ title: 'Search scopes', baselineCommit: 'a'.repeat(40), schema, sourceManifest: manifest, sourceBlobs: { 'requirements/business-requirements.json': requirements } });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    const scopes = page.getByRole('group', { name: 'Search scope' });
    await scopes.getByRole('button', { name: 'Properties' }).click();
    await page.getByLabel('Search model').fill('peer');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    const properties = page.getByRole('region', { name: 'properties search results' });
    const peerResult = properties.getByRole('button', { name: 'Inspect Device.peer' });
    await expect(peerResult).toBeVisible();
    await peerResult.click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await expect(page.locator('#studio-inspector-pane').getByRole('rowheader', { name: /peer/ })).toBeVisible();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Model' }).click();

    await scopes.getByRole('button', { name: 'Requirements' }).click();
    await page.getByLabel('Search model').fill('BR-001');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    const requirementResults = page.getByRole('region', { name: 'requirements search results' });
    await expect(requirementResults).toContainText('Track device peers.');
    await requirementResults.getByRole('button', { name: 'Inspect Device' }).click();
    await expect(page.getByRole('region', { name: 'Workspace status' })).toContainText('Device');
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Model' }).click();

    await scopes.getByRole('button', { name: 'Commands' }).click();
    await page.getByLabel('Search model').fill('Review draft changes');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    const palette = page.getByRole('dialog', { name: 'Commands' });
    const reviewCommand = palette.getByRole('option', { name: /Review draft changes/ });
    await expect(reviewCommand).toBeVisible();
    await palette.getByRole('combobox', { name: 'Find a command' }).press('Enter');
    await expect(page.locator('.studio-document-tabs').getByRole('button', { name: 'Review' })).toHaveAttribute('aria-pressed', 'true');
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
