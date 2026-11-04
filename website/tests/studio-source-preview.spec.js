import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('source preview distinguishes draft, baseline and an added concept', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Source preview', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|Original device.|\n' });
  store.apply({ workspaceId: workspace.id, actor: 'author', operationId: 'prepare', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Device', definition: 'Revised device.' }, { type: 'class.add', name: 'NewAsset', module: 'foundation', parent: 'Record', definition: 'A new asset.' }] });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('list', { name: 'Loaded concepts by module' }).getByRole('button', { name: 'Device', exact: true }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    const inspector = page.locator('#studio-inspector-pane');
    await inspector.getByText('Source preview', { exact: true }).click();
    await inspector.getByRole('button', { name: 'Load source preview' }).click();
    await expect(inspector.getByRole('region', { name: 'Source excerpt for Device' })).toContainText('Revised device.');
    await inspector.getByLabel('Source version').selectOption('baseline');
    await inspector.getByRole('button', { name: 'Load source preview' }).click();
    await expect(inspector.getByRole('region', { name: 'Source excerpt for Device' })).toContainText('Original device.');
    store.apply({ workspaceId: workspace.id, actor: 'other-client', operationId: 'describe', expectedRevision: 1, commands: [{ type: 'class.describe', name: 'Device', definition: 'Later device.' }] });
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 2');
    await expect(inspector.getByRole('region', { name: 'Source excerpt for Device' })).toHaveCount(0);
    await inspector.getByLabel('Source version').selectOption('candidate');
    await inspector.getByRole('button', { name: 'Load source preview' }).click();
    await expect(inspector.getByRole('region', { name: 'Source excerpt for Device' })).toContainText('Later device.');
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Model' }).click();
    await page.getByRole('list', { name: 'Loaded concepts by module' }).getByRole('button', { name: 'NewAsset', exact: true }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await inspector.getByText('Source preview', { exact: true }).click();
    await inspector.getByLabel('Source version').selectOption('baseline');
    await inspector.getByRole('button', { name: 'Load source preview' }).click();
    await expect(inspector.getByText(/concept not present/)).toBeVisible();
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('a delayed source preview cannot replace a later concept selection', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Source preview race', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  let release, observed;
  const gate = new Promise(resolve => { release = resolve; });
  const intercepted = new Promise(resolve => { observed = resolve; });
  const delay = async route => {
    if (route.request().postDataJSON()?.params?.name === 'ontology_source_excerpt') {
      const response = await route.fetch(); observed(); await gate;
      await route.fulfill({ response }).catch(() => {});
    } else await route.continue();
  };
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('list', { name: 'Loaded concepts by module' }).getByRole('button', { name: 'Device', exact: true }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await page.locator('#studio-inspector-pane').getByText('Source preview', { exact: true }).click();
    await page.route('**/mcp', delay);
    await page.getByRole('button', { name: 'Load source preview' }).click();
    await intercepted;
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Model' }).click();
    await page.getByRole('list', { name: 'Loaded concepts by module' }).getByRole('button', { name: 'Record', exact: true }).click();
    release(); await page.unrouteAll({ behavior: 'wait' });
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    const inspector = page.locator('#studio-inspector-pane');
    await expect(inspector.getByRole('heading', { name: 'Record', exact: true })).toBeVisible();
    await expect(inspector.getByRole('region', { name: 'Source excerpt for Device' })).toHaveCount(0);
    await inspector.getByText('Source preview', { exact: true }).click();
    await inspector.getByRole('button', { name: 'Load source preview' }).click();
    await expect(inspector.getByRole('region', { name: 'Source excerpt for Record' })).toContainText('Record|root|A record.');
  } finally { release(); await page.unrouteAll({ behavior: 'wait' }); await page.close(); await service.shutdown(); store.close(); }
});
