import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('a new workspace opens a bounded view and the first selection can replace it', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Initial view', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|peer:Record?\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram' }).click();
    await expect(page.getByRole('region', { name: 'Relationships for Device' })).toHaveAttribute('data-layout', 'ready');
    if (!isMobile) {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect.poll(async () => (await page.getByRole('region', { name: 'Relationships for Device' }).boundingBox()).height).toBeGreaterThanOrEqual(500);
      await page.setViewportSize({ width: 1280, height: 800 });
    }
    if (isMobile) await expect(page.getByRole('navigation', { name: 'Diagram navigation', includeHidden: true })).toBeHidden();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Model' }).click();
    await page.getByRole('list', { name: 'Loaded concepts by module' }).getByRole('button', { name: 'Record', exact: true }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram' }).click();
    await expect(page.getByRole('region', { name: 'Relationships for Record' })).toHaveAttribute('data-layout', 'ready');
    if (isMobile) await expect(page.getByRole('navigation', { name: 'Diagram navigation' }).getByRole('button', { name: 'Previous view' })).toBeEnabled();
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('an existing default shared view is not replaced by the automatic view', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Saved initial view', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|\n' });
  store.saveView({ workspaceId: workspace.id, viewId: 'default', actor: 'author', operationId: 'save-default', expectedViewRevision: 0, definition: { root: 'Record', positions: {} } });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.locator('#studio-navigator-pane').getByText('Saved views', { exact: true }).click();
    await page.getByRole('button', { name: 'Open shared view default' }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram' }).click();
    await expect(page.getByRole('region', { name: 'Relationships for Record' })).toHaveAttribute('data-layout', 'ready');
    expect(store.savedView(workspace.id, 'default').viewRevision).toBe(1);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('a delayed default-view read does not replace a user choice', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Initial view race', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|\n' });
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
  await page.route('**/mcp', delay);
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await intercepted;
    await page.getByRole('list', { name: 'Loaded concepts by module' }).getByRole('button', { name: 'Record', exact: true }).click();
    release();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram' }).click();
    await expect(page.getByRole('region', { name: 'Relationships for Record' })).toHaveAttribute('data-layout', 'ready');
    await expect(page.getByRole('region', { name: 'Relationships for Device' })).toHaveCount(0);
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { release(); await page.unroute('**/mcp', delay); await page.close(); await service.shutdown(); store.close(); }
});
