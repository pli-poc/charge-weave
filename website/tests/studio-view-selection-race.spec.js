import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('a delayed shared-view load cannot replace a later concept selection', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Selection race', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|peer:Record?\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  let release, observed;
  const gate = new Promise(resolve => { release = resolve; });
  const intercepted = new Promise(resolve => { observed = resolve; });
  const delay = async route => {
    const params = route.request().postDataJSON()?.params;
    if (params?.name === 'ontology_view_saved_get' && params.arguments.viewId === 'default') { observed(); await gate; }
    await route.continue().catch(() => {});
  };
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('list', { name: 'Loaded concepts by module' }).getByRole('button', { name: 'Device', exact: true }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram' }).click();
    await page.getByRole('button', { name: 'Save shared view' }).click();
    await expect(page.getByText('Shared view saved.')).toBeVisible();
    await page.route('**/mcp', delay);
    await page.getByRole('button', { name: 'Load shared view' }).click();
    await intercepted;
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Model' }).click();
    await page.getByRole('list', { name: 'Loaded concepts by module' }).getByRole('button', { name: 'Record', exact: true }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram' }).click();
    release();
    await expect(page.getByText('The shared view was not loaded because your selection changed while it was loading.')).toBeVisible();
    await expect(page.getByRole('region', { name: 'Relationships for Device' })).toBeVisible();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await expect(page.locator('#studio-inspector-pane').getByRole('heading', { name: 'Record', exact: true })).toBeVisible();
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { release(); await page.unroute('**/mcp', delay); await page.close(); await service.shutdown(); store.close(); }
});
