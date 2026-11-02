import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { editableSourcePaths, importSourceManifest } from '../../ontology-authoring/src/source-manifest.js';

test.use({ actionTimeout: 10000 });

test('unreadable local layout is not silently overwritten by automatic placement', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Unreadable layout', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    const key = `chargeweave.canvas.v2.${workspace.id}.default`;
    await page.evaluate(key => sessionStorage.setItem(key, '{broken'), key);
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Relationships for Device' })).toHaveAttribute('data-layout', 'ready');
    await expect(page.getByText(/Local layout could not be read/)).toBeVisible();
    expect(await page.evaluate(key => sessionStorage.getItem(key), key)).toBe('{broken');
    await page.getByRole('button', { name: 'Save shared view' }).click();
    await expect(page.getByText(/Could not save view: Canvas positions could not be read/)).toBeVisible();
    expect(store.savedView(workspace.id, 'default').viewRevision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('a delayed shared-view load cannot overwrite a newly selected view', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'View race', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  let interceptedResolve;
  const intercepted = new Promise(resolve => { interceptedResolve = resolve; });
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    const failList = async route => {
      if (route.request().postDataJSON()?.params?.name === 'ontology_view_saved_list') await route.abort();
      else await route.continue();
    };
    await page.route('**/mcp', failList);
    await page.getByRole('button', { name: 'Save shared view' }).click();
    await expect(page.getByText(/Shared view saved, but the view list could not be refreshed/)).toBeVisible();
    expect(store.savedView(workspace.id, 'default').viewRevision).toBe(1);
    await page.unroute('**/mcp', failList);
    await page.route('**/mcp', async route => {
      const params = route.request().postDataJSON()?.params;
      if (params?.name === 'ontology_view_saved_get' && params.arguments?.viewId === 'default') { interceptedResolve(); await gate; }
      await route.continue();
    });
    await page.getByRole('button', { name: 'Load shared view' }).click();
    await intercepted;
    await expect(page.getByRole('button', { name: 'Load shared view' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Save shared view' })).toBeDisabled();
    await expect(page.getByText('Loading shared view…')).toBeVisible();
    await page.getByLabel('View ID').fill('other');
    await page.getByRole('button', { name: 'Choose view ID' }).click();
    await expect(page.getByText('other', { exact: true }).first()).toBeVisible();
    const oldResponse = page.waitForResponse(response => response.url().endsWith('/mcp') && response.request().postDataJSON()?.params?.name === 'ontology_view_saved_get' && response.request().postDataJSON()?.params?.arguments?.viewId === 'default');
    release();
    await oldResponse;
    await expect(page.getByText('Shared view loaded.')).toHaveCount(0);
  } finally { release(); await page.close(); await service.shutdown(); store.close(); }
});

test('navigator search refreshes when another client changes the draft', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Refresh search', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|Original device.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    const workspaceStatus = page.getByRole('region', { name: 'Workspace status' });
    await expect(workspaceStatus).toContainText('Connected');
    await expect(workspaceStatus).toContainText('Revision 0');
    await expect(workspaceStatus.getByRole('link', { name: 'Checks: no result displayed' })).toBeVisible();
    const validation = page.getByRole('region', { name: 'Validation issues' });
    await expect(validation.getByText('No validation result is displayed for this draft.', { exact: false })).toBeVisible();
    await expect(validation.getByRole('button', { name: 'Run structural check' })).toBeEnabled();
    const destinations = page.getByRole('navigation', { name: 'Workspace destinations' });
    await destinations.getByRole('link', { name: 'Activity' }).click();
    await expect(page.getByRole('heading', { name: 'Activity', exact: true })).toBeInViewport();
    await destinations.getByRole('link', { name: 'Model' }).click();
    await expect(page.getByRole('heading', { name: 'Discover concepts' })).toBeFocused();
    await validation.getByRole('button', { name: 'Collapse validation' }).click();
    await expect(validation.getByRole('button', { name: 'Run structural check', includeHidden: true })).toBeHidden();
    await workspaceStatus.getByRole('link', { name: 'Checks: no result displayed' }).click();
    await expect(validation.getByRole('button', { name: 'Run structural check' })).toBeVisible();
    await page.getByRole('button', { name: 'Hide navigator' }).click();
    await page.keyboard.press('Control+k');
    await expect(page.getByLabel('Search model')).toBeFocused();
    const tree = page.getByRole('list', { name: 'Loaded concepts by module' });
    await expect(tree.locator('summary', { hasText: 'foundation' })).toBeVisible();
    await expect(tree.getByRole('button', { name: 'Device', exact: true })).toBeVisible();
    await tree.locator('summary').click();
    await expect(tree.getByRole('button', { name: 'Device', exact: true })).toBeHidden();
    await tree.locator('summary').click();
    await page.getByLabel('Search model').fill('Device');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('Original device.')).toBeVisible();
    store.apply({ workspaceId: workspace.id, actor: 'other-client', operationId: 'update-search-result', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Device', definition: 'Updated device definition.' }] });
    await expect(page.getByRole('status')).toContainText('revision 1');
    await expect(workspaceStatus).toContainText('Revision 1');
    await expect(page.getByText('Updated device definition.')).toBeVisible();
    await expect(page.getByLabel('Search model')).toHaveValue('Device');
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('named diagram views keep independent local positions', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop pointer interaction is covered here.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Independent views', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    const canvas = page.getByRole('region', { name: 'Relationships for Device' });
    const node = canvas.locator('.react-flow__node[data-id="Device"]');
    async function move(dx, dy) {
      await expect(canvas).toHaveAttribute('data-layout', 'ready');
      await node.scrollIntoViewIfNeeded();
      const box = await node.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + dx, box.y + box.height / 2 + dy, { steps: 5 }); await page.mouse.up();
    }
    await expect(canvas).toHaveAttribute('data-layout', 'ready');
    await page.getByRole('button', { name: 'Save shared view' }).click();
    await expect(page.getByText('Shared view saved.')).toBeVisible();
    expect(store.savedView(workspace.id, 'default').definition.positions.Device).toBeDefined();
    await move(40, 30);
    const firstPosition = await node.getAttribute('style');
    await page.getByLabel('View ID').fill('other');
    await page.getByRole('button', { name: 'Choose view ID' }).click();
    await move(95, 65);
    const secondPosition = await node.getAttribute('style');
    expect(secondPosition).not.toBe(firstPosition);
    await page.getByLabel('View ID').fill('default');
    await page.getByRole('button', { name: 'Choose view ID' }).click();
    await expect(node).toHaveAttribute('style', firstPosition);
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('outgoing diagram relationships start bounded and expand without editing', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const fields = Array.from({ length: 16 }, (_, i) => `link${i}:Record?`).join(' ');
  const workspace = store.create({ title: 'Outgoing expansion', baselineCommit: 'a'.repeat(40), schema: `MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|${fields}\n` });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    await expect(page.getByText(/5 additional outgoing relationships/)).toBeVisible();
    await page.getByRole('button', { name: 'Show more outgoing' }).click();
    await expect(page.getByText(/5 additional outgoing relationships/)).not.toBeVisible();
    await expect(page.getByRole('region', { name: 'Relationships for Device' }).locator('.react-flow__edge-path')).toHaveCount(17);
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('incoming diagram references can be expanded without changing the model', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const classes = Array.from({ length: 25 }, (_, i) => `Device${String(i).padStart(2, '0')}|Record|A device.|`).join('\n');
  const workspace = store.create({ title: 'Incoming expansion', baselineCommit: 'a'.repeat(40), schema: `MODULE|foundation\nRecord|root|A record.|\n${classes}\n` });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('button', { name: 'Record', exact: true }).click();
    await page.getByLabel('Show incoming references').check();
    await expect(page.getByText(/5 additional incoming references/)).toBeVisible();
    await page.getByRole('button', { name: 'Show more incoming' }).click();
    await expect(page.getByText(/5 additional incoming references/)).not.toBeVisible();
    await expect(page.getByRole('region', { name: 'Relationships for Record' }).locator('.react-flow__node[data-id="Device24"]')).toHaveCount(1);
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('unapplied concept input requests a browser warning before leaving', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Leave warning', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  const warningRequested = () => page.evaluate(() => { const event = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(event); return event.defaultPrevented; });
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await expect(page.getByRole('status')).toContainText('revision 0');
    expect(await warningRequested()).toBe(false);
    await page.getByText('Add a concept', { exact: true }).click();
    await page.getByLabel('Class name').fill('UnfinishedConcept');
    expect(await warningRequested()).toBe(true);
    await page.getByLabel('Class name').fill('');
    expect(await warningRequested()).toBe(false);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('disconnecting warns about an unfinished concept', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Unfinished concept', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByText('Add a concept', { exact: true }).click();
    await page.getByLabel('Class name').fill('UnfinishedConcept');
    await page.getByRole('button', { name: 'Disconnect', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Unapplied edits' })).toBeVisible();
    await page.getByRole('button', { name: 'Stay and keep editing' }).click();
    await expect(page.getByLabel('Class name')).toHaveValue('UnfinishedConcept');
    await page.getByRole('button', { name: 'Disconnect', exact: true }).click();
    await page.getByRole('button', { name: 'Discard and disconnect' }).click();
    await expect(page.getByRole('status')).toContainText('Disconnected');
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('unfinished field creation is retained or discarded explicitly on navigation', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Unfinished field', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('button', { name: 'Record', exact: true }).click();
    await page.getByText('Add a field or relationship', { exact: true }).click();
    await page.getByLabel('Field name').fill('draftField');
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Unapplied edits' })).toBeVisible();
    await page.getByRole('button', { name: 'Stay and keep editing' }).click();
    await expect(page.getByLabel('Field name')).toHaveValue('draftField');
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    await page.getByRole('button', { name: 'Discard and open Device' }).click();
    await expect(page.getByRole('heading', { name: 'Device', exact: true })).toBeVisible();
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('inspector finds direct incoming references and navigates to their source', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Incoming references', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|\nStation|Device|A station.|device:Device!\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    await page.getByLabel('Show incoming references').check();
    const diagram = page.getByRole('region', { name: 'Relationships for Device' });
    await expect(diagram.locator('.react-flow__node[data-id="Station"]')).toBeVisible();
    await expect(page.locator('.studio-graph li').filter({ hasText: 'device from' })).toContainText('Station');
    await page.getByText('Referenced by', { exact: true }).click();
    await page.getByRole('button', { name: 'Find references' }).click();
    await expect(page.getByText('Showing 2 of 2 references.')).toBeVisible();
    await expect(page.locator('#studio-inspector-pane').getByText(/Station.*device/)).toBeVisible();
    await page.getByRole('button', { name: 'Inspect Station' }).first().click();
    await expect(page.getByRole('heading', { name: 'Station', exact: true })).toBeVisible();
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('concept creation offers existing modules and validates its definition', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const extra = Array.from({ length: 60 }, (_, i) => `Asset${String(i).padStart(3, '0')}|Record|An asset.|`).join('\n');
  const workspace = store.create({ title: 'Create concept', baselineCommit: 'a'.repeat(40), schema: `MODULE|foundation\nRecord|root|A record.|\n${extra}\nMODULE|assets\nZDevice|Record|A device.|\n` });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await expect(page.getByText('Showing 50 of 62 concepts.')).toBeVisible();
    await page.getByText('Add a concept', { exact: true }).click();
    await page.getByLabel('Class name').fill('ServiceWindow');
    await page.getByLabel('Concept module').selectOption('assets');
    await page.getByLabel('Parent class').fill('ZDev');
    await expect(page.locator('#studio-parent-suggestions option[value="ZDevice"]')).toHaveCount(1);
    await page.getByLabel('Parent class').fill('ZDevice');
    await page.getByLabel('Class definition').fill('Invalid | separator');
    await page.getByRole('button', { name: 'Add concept', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('single line');
    expect(store.get(workspace.id).revision).toBe(0);
    await page.getByLabel('Class definition').fill('A service window.');
    await page.getByRole('button', { name: 'Add concept', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('revision 1');
    expect(store.search(workspace.id, 'ServiceWindow').results[0]).toMatchObject({ module: 'assets', parent: 'ZDevice' });
    await expect(page.getByRole('heading', { name: 'ServiceWindow', exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Relationships for ServiceWindow' })).toBeVisible();
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('a narrower desktop keeps a wide model editor and opens the inspector as an overlay', async ({ page, isMobile }) => {
  test.skip(isMobile, 'This scenario covers a narrow desktop viewport.');
  await page.setViewportSize({ width: 1280, height: 800 });
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Narrow desktop', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('button', { name: 'Record', exact: true }).click();
    const editor = page.locator('.studio-editor');
    expect((await editor.boundingBox()).width).toBeGreaterThanOrEqual(560);
    await page.getByRole('button', { name: 'Show inspector' }).click();
    await expect(page.getByRole('heading', { name: 'Inspector' })).toBeVisible();
    expect((await editor.boundingBox()).width).toBeGreaterThanOrEqual(560);
    await page.getByRole('button', { name: 'Hide inspector' }).click();
    await expect(page.getByRole('heading', { name: 'Inspector' })).not.toBeVisible();
    await page.getByRole('list', { name: 'Loaded concepts by module' }).getByRole('button', { name: 'Device', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Inspector' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Device', exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Relationships for Record' })).toBeVisible();
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('a remote field change blocks a stale inspector edit while preserving input', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Field conflict', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|recordName:string?\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('button', { name: 'Record', exact: true }).click();
    const recordNameRow = page.getByRole('row').filter({ has: page.getByRole('rowheader', { name: /recordName/ }) });
    await expect(recordNameRow).toContainText('Optional (0..1)');
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => { window.copiedIdentifier = value; } } }));
    const iri = await page.locator('.studio-identifier code').innerText();
    await page.getByRole('button', { name: 'Copy identifier' }).click();
    await expect(page.getByText('Identifier copied.')).toBeVisible();
    expect(await page.evaluate(() => window.copiedIdentifier)).toBe(iri);
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('denied'); } } }));
    await page.getByRole('button', { name: 'Copy identifier' }).click();
    await expect(page.getByText('Clipboard unavailable; select and copy the identifier shown here.')).toBeVisible();
    await page.getByRole('button', { name: 'Edit recordName' }).click();
    await page.getByLabel('New cardinality').selectOption('+');
    store.apply({ workspaceId: workspace.id, actor: 'other-client', operationId: 'remote-field', expectedRevision: 0, commands: [{ type: 'property.update', owner: 'Record', name: 'recordName', expectedRange: 'string', expectedCardinality: '?', range: 'string', cardinality: '!' }] });
    await expect(page.getByRole('alert').filter({ hasText: 'This field changed in another client' })).toBeVisible();
    await expect(page.getByLabel('New cardinality')).toHaveValue('+');
    await expect(page.getByRole('button', { name: 'Update field contract' })).toBeDisabled();
    await page.getByRole('button', { name: 'Cancel field edit' }).click();
    await expect(page.getByRole('button', { name: 'Edit recordName' })).toBeFocused();
    await page.getByRole('button', { name: 'Edit recordName' }).click();
    await expect(page.getByLabel('New cardinality')).toHaveValue('!');
    expect(store.get(workspace.id).revision).toBe(1);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('a partially edited field is retained until navigation is confirmed', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Unsaved field', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|recordName:string?\nDevice|Record|A device.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('button', { name: 'Record', exact: true }).click();
    await page.getByRole('button', { name: 'Edit recordName' }).click();
    await page.getByLabel('New cardinality').selectOption('!');
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Unapplied edits' })).toBeVisible();
    await page.getByRole('button', { name: 'Stay and keep editing' }).click();
    await expect(page.getByLabel('New cardinality')).toHaveValue('!');
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    await page.getByRole('button', { name: 'Discard and open Device' }).click();
    await expect(page.getByRole('heading', { name: 'Device', exact: true })).toBeVisible();
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('switching concepts preserves an unapplied definition until the modeller decides', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Unsaved navigation', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('button', { name: 'Record', exact: true }).click();
    const definition = page.getByRole('textbox', { name: 'Definition', exact: true });
    await definition.fill('An unsaved definition.');
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Unapplied edits' })).toBeVisible();
    await page.getByRole('button', { name: 'Stay and keep editing' }).click();
    await expect(definition).toHaveValue('An unsaved definition.');
    await page.getByRole('button', { name: 'Disconnect', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Discard and disconnect' })).toBeVisible();
    await page.getByRole('button', { name: 'Stay and keep editing' }).click();
    await expect(definition).toHaveValue('An unsaved definition.');
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    await page.getByRole('button', { name: 'Discard and open Device' }).click();
    await expect(page.getByRole('heading', { name: 'Device', exact: true })).toBeVisible();
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('desktop panel sizes can be adjusted with the keyboard and restored', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Compact layout uses stacked panels.');
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Panel sizes', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.locator('summary').filter({ hasText: 'Panel sizes' }).click();
    const slider = page.getByLabel('Navigator width');
    await slider.focus(); await page.keyboard.press('ArrowRight');
    await expect(slider).toHaveValue('250');
    await expect(page.locator('.studio-panels > section').first()).toHaveCSS('width', '250px');
    await page.reload();
    await page.locator('summary').filter({ hasText: 'Panel sizes' }).click();
    await expect(page.getByLabel('Navigator width')).toHaveValue('250');
    const splitter = page.getByRole('separator', { name: 'Resize navigator' });
    const handle = await splitter.boundingBox();
    await page.mouse.move(handle.x + handle.width / 2, handle.y + 30);
    await page.mouse.down(); await page.mouse.move(handle.x + handle.width / 2 + 30, handle.y + 30, { steps: 4 }); await page.mouse.up();
    await expect(splitter).toHaveAttribute('aria-valuenow', '280');
    await splitter.focus(); await page.keyboard.press('ArrowLeft');
    await expect(splitter).toHaveAttribute('aria-valuenow', '270');
    const inspector = page.getByRole('separator', { name: 'Resize inspector' });
    const inspectorHandle = await inspector.boundingBox();
    await page.mouse.move(inspectorHandle.x + inspectorHandle.width / 2, inspectorHandle.y + 30);
    await page.mouse.down(); await page.mouse.move(inspectorHandle.x + inspectorHandle.width / 2 - 30, inspectorHandle.y + 30, { steps: 4 }); await page.mouse.up();
    await expect(inspector).toHaveAttribute('aria-valuenow', '350');
    await page.getByRole('button', { name: 'Hide inspector' }).click();
    await expect(splitter).toBeVisible();
    await splitter.focus(); await page.keyboard.press('ArrowRight');
    await expect(splitter).toHaveAttribute('aria-valuenow', '280');
    await page.getByRole('button', { name: 'Show inspector' }).click();
    await page.getByRole('button', { name: 'Hide navigator' }).click();
    await expect(inspector).toBeVisible();
    await inspector.focus(); await page.keyboard.press('ArrowLeft');
    await expect(inspector).toHaveAttribute('aria-valuenow', '360');
    await page.getByRole('button', { name: 'Reset panel sizes' }).click();
    await expect(page.getByLabel('Navigator width')).toHaveValue('240');
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('advanced connection identifies an invalid workspace ID without treating the token as a UUID', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Connection', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const token = 'test-token-'.repeat(4);
  const service = createHttpService({ store, token, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByText('Advanced connection with workspace ID and token').click();
    await page.getByLabel('Workspace ID').fill(token);
    await page.getByLabel('Draft token').fill(token);
    await page.getByRole('button', { name: 'Connect', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Workspace ID must be a UUID');
    await page.getByLabel('Workspace ID').fill(workspace.id);
    await page.getByRole('button', { name: 'Connect', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('revision 0');
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('a remote definition edit preserves local input and requires conflict review', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Definition conflict', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|Original definition.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByLabel('Search model').fill('Record');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Record', exact: true }).click();
    const input = page.getByRole('textbox', { name: 'Definition', exact: true });
    await input.fill('My unsaved definition.');
    store.apply({ workspaceId: workspace.id, actor: 'other-client', operationId: 'remote-definition', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Record', definition: 'A different remote definition.' }] });
    await expect(page.getByRole('alert').filter({ hasText: 'changed in another client' })).toBeVisible();
    await expect(input).toHaveValue('My unsaved definition.');
    await expect(page.getByRole('button', { name: 'Save definition' })).toBeDisabled();
    await expect(page.getByText('Latest: A different remote definition.')).toBeVisible();
    await page.getByRole('button', { name: 'Keep my text' }).click();
    await page.getByRole('button', { name: 'Save definition' }).click();
    await expect(page.getByRole('status')).toContainText('revision 2');
    expect(store.search(workspace.id, 'Record').results[0].definition).toBe('My unsaved definition.');
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('an older search cannot replace newer navigator results', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Search race', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  let release, observed;
  const delayed = new Promise(resolve => { release = resolve; });
  const intercepted = new Promise(resolve => { observed = resolve; });
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await expect(page.getByRole('status')).toContainText('revision 0');
    await page.route('**/mcp', async route => {
      const body = route.request().postDataJSON();
      if (body?.params?.name === 'ontology_context_search' && body.params.arguments.query === 'Record') { observed(); await delayed; }
      await route.continue();
    });
    await page.getByLabel('Search model').fill('Record');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await intercepted;
    await page.getByLabel('Search model').fill('Device');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Device', exact: true })).toBeVisible();
    const oldResponse = page.waitForResponse(response => response.url().endsWith('/mcp') && response.request().postDataJSON()?.params?.arguments?.query === 'Record');
    release(); await oldResponse;
    await expect(page.getByRole('button', { name: 'Device', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Record', exact: true })).toHaveCount(0);
  } finally { release(); await page.close(); await service.shutdown(); store.close(); }
});

test('navigator browses beyond the first page without searching', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const classes = Array.from({ length: 55 }, (_, i) => `Thing${String(i).padStart(3, '0')}|Record|A concept.|`).join('\n');
  const workspace = store.create({ title: 'Browse', baselineCommit: 'a'.repeat(40), schema: `MODULE|foundation\nRecord|root|A record.|\n${classes}\nMODULE|operations\nStation|Record|A station.|\n` });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await expect(page.getByText('Showing 50 of 57 concepts.')).toBeVisible();
    const operations = page.getByRole('list', { name: 'Loaded concepts by module' }).locator('details').filter({ has: page.locator('summary', { hasText: 'operations' }) });
    if (!await operations.evaluate(element => element.open)) await operations.locator('summary').click();
    await operations.getByRole('button', { name: 'Browse operations' }).click();
    await expect(page.getByText('Showing 1 of 1 concepts.')).toBeVisible();
    await page.getByLabel('Filter by module').selectOption('');
    await expect(page.getByText('Showing 50 of 57 concepts.')).toBeVisible();
    await page.getByRole('button', { name: 'Load more concepts' }).click();
    await expect(page.getByText('Showing 57 of 57 concepts.')).toBeVisible();
    await page.getByRole('button', { name: 'Thing054', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Thing054', exact: true })).toBeVisible();
    await page.getByLabel('Filter by module').selectOption('operations');
    await expect(page.getByText('Showing 1 of 1 concepts.')).toBeVisible();
    store.apply({ workspaceId: workspace.id, actor: 'other-client', operationId: 'update-filtered-module', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Station', definition: 'Updated station.' }] });
    await expect(page.getByRole('status')).toContainText('revision 1');
    await expect(page.getByLabel('Filter by module')).toHaveValue('operations');
    await expect(page.getByText('Showing 1 of 1 concepts.')).toBeVisible();
    await page.getByRole('button', { name: 'Station', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Station', exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Relationships for Thing054' })).toBeVisible();
    await page.getByRole('button', { name: 'Focus neighbourhood' }).click();
    await expect(page.getByRole('region', { name: 'Relationships for Station' })).toBeVisible();
    await page.getByText('Diagram legend').click();
    await expect(page.locator('.studio-diagram-legend dd', { hasText: 'Optional, at most one' })).toBeVisible();
    await expect(page.getByRole('list', { name: 'Loaded concepts by module' }).getByRole('button', { name: 'Station', exact: true })).toHaveAttribute('aria-current', 'true');
    await page.getByRole('button', { name: 'Previous view' }).click();
    await expect(page.getByRole('region', { name: 'Relationships for Thing054' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Station', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Next view' }).click();
    await expect(page.getByRole('region', { name: 'Relationships for Station' })).toBeVisible();
    await page.getByRole('button', { name: 'Previous view' }).click();
    await expect(page.getByRole('region', { name: 'Relationships for Thing054' })).toBeVisible();
    await page.getByRole('list', { name: 'Loaded concepts by module' }).getByRole('button', { name: 'Station', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('region', { name: 'Relationships for Station' })).toBeVisible();
    await page.getByLabel('Search model').fill('Record');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    const result = page.locator('#studio-navigator-pane').getByRole('button', { name: 'Record', exact: true });
    await result.click();
    await expect(result).toHaveAttribute('aria-current', 'true');
    await expect(page.getByRole('region', { name: 'Relationships for Station' })).toBeVisible();
    await result.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('region', { name: 'Relationships for Record' })).toBeVisible();
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('two studio tabs share edits while keeping independent selections', async ({ page, context }) => {
  test.setTimeout(60000);
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Two tabs', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  let second;
  try {
    const url = `http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`;
    await page.goto(url); await page.getByLabel('Pairing code').fill(pairingCode); await page.getByRole('button', { name: 'Pair local studio' }).click();
    await expect(page.getByRole('status')).toContainText('revision 0');
    second = await context.newPage(); await second.goto(url); await expect(second.getByRole('status')).toContainText('revision 0');
    for (const [tab, name] of [[page, 'Record'], [second, 'Device']]) {
      await tab.getByLabel('Search model').fill(name); await tab.getByRole('button', { name: 'Search', exact: true }).click();
      await tab.getByRole('button', { name, exact: true }).click();
      await expect(tab.getByRole('heading', { name, exact: true })).toBeVisible();
    }
    await page.getByRole('textbox', { name: 'Definition', exact: true }).fill('A record edited in the first tab.');
    await page.getByRole('button', { name: 'Save definition' }).click();
    await expect(page.getByRole('status')).toContainText('revision 1');
    await expect(second.getByRole('status')).toContainText('revision 1');
    await expect(second.getByRole('heading', { name: 'Device', exact: true })).toBeVisible();
    expect(store.get(workspace.id).revision).toBe(1);
  } finally { if (second) await second.close(); await page.close(); await service.shutdown(); store.close(); }
});

test('reviewer creates and switches between workspaces', async ({ page }) => {
  test.setTimeout(60000);
  const repo = mkdtempSync(join(tmpdir(), 'chargeweave-browser-create-'));
  const git = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const put = (path, text) => { const target = join(repo, path); mkdirSync(join(target, '..'), { recursive: true }); writeFileSync(target, text); };
  let store, service;
  try {
    git('init'); git('config', 'user.name', 'Test'); git('config', 'user.email', 'test@example.invalid');
    git('remote', 'add', 'origin', 'https://github.com/pli-poc/charge-weave.git');
    put('model/domain.schema', 'MODULE|foundation\nRecord|root|A record.|\n');
    for (const path of editableSourcePaths) put(path, '{}\n');
    for (const path of ['tools/authoring_adapter.py', 'tools/domain_schema.py']) { mkdirSync(join(repo, 'tools'), { recursive: true }); copyFileSync(fileURLToPath(new URL(`../../${path}`, import.meta.url)), join(repo, path)); }
    git('add', '.'); git('commit', '-m', 'Baseline'); const commit = git('rev-parse', 'HEAD');
    store = new WorkspaceStore(':memory:');
    const original = store.create({ title: 'Original', baselineCommit: commit, schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
    const pairingCode = 'synthetic-pairing-code-'.repeat(2);
    service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: original.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)), repository: repo, allowWorkspaceCreate: true });
    service.listen(0, '127.0.0.1'); await once(service, 'listening');
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode); await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByText('Create a workspace', { exact: true }).click();
    await page.getByLabel('New workspace title').fill('New proposal'); await page.getByLabel('Baseline commit SHA').fill(commit);
    await page.getByRole('button', { name: 'Create workspace' }).click();
    await expect(page.getByLabel('Current workspace')).toHaveValue(/.+/);
    await expect(page.getByLabel('Current workspace').locator('option:checked')).toHaveText('New proposal');
    await page.getByRole('button', { name: 'Record', exact: true }).click();
    const definition = page.getByRole('textbox', { name: 'Definition', exact: true });
    await definition.fill('Unapplied workspace edit.');
    await page.getByLabel('Current workspace').selectOption(original.id);
    await expect(page.getByRole('dialog', { name: 'Unapplied edits' })).toBeVisible();
    await page.getByRole('button', { name: 'Stay and keep editing' }).click();
    await expect(definition).toHaveValue('Unapplied workspace edit.');
    await expect(page.getByLabel('Current workspace').locator('option:checked')).toHaveText('New proposal');
    await page.getByLabel('Current workspace').selectOption(original.id);
    await page.getByRole('button', { name: 'Discard and open Original' }).click();
    await expect(page.getByLabel('Current workspace').locator('option:checked')).toHaveText('Original');
  } finally { await page.close(); if (service) await service.shutdown(); if (store) store.close(); rmSync(repo, { recursive: true, force: true }); }
});

test('browser authors an interval rule with draft cases and source patches', async ({ page }) => {
  test.setTimeout(60000);
  const repository = fileURLToPath(new URL('../..', import.meta.url));
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim();
  const show = path => execFileSync('git', ['show', `${commit}:${path}`], { cwd: repository });
  const paths = [...new Set([...editableSourcePaths, 'model/domain.schema', 'tools/authoring_adapter.py', 'tools/domain_schema.py'])].sort();
  const manifest = paths.map(path => ({ path, sha256: createHash('sha256').update(show(path)).digest('hex') }));
  const sourceBlobs = Object.fromEntries([...editableSourcePaths].map(path => [path, show(path).toString('utf8')]));
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Interval browser test', baselineCommit: commit, schema: show('model/domain.schema').toString('utf8'), sourceManifest: manifest, sourceBlobs });
  const requirement = store.requirementsSearch(workspace.id, 'BR-012').results.find(item => item.id === 'BR-012');
  store.apply({ workspaceId: workspace.id, actor: 'test', operationId: 'prepare', expectedRevision: 0, commands: [
    { type: 'class.add', name: 'PlannedServiceWindow', module: 'foundation', parent: 'Record', definition: 'A planned service window.' },
    { type: 'property.add', owner: 'PlannedServiceWindow', name: 'maintenanceStartsAt', range: 'dateTime', cardinality: '!' },
    { type: 'property.add', owner: 'PlannedServiceWindow', name: 'maintenanceEndsAt', range: 'dateTime', cardinality: '!' },
    { type: 'requirement.link', requirementId: requirement.id, className: 'PlannedServiceWindow', expectedClasses: requirement.classes },
    { type: 'temporal.policy_set', className: 'PlannedServiceWindow', expectedPolicy: null, policy: 'snapshot-versioned' },
  ] });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)), repository });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByLabel('Search model').fill('PlannedServiceWindow');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'PlannedServiceWindow', exact: true }).click();
    await page.getByLabel('Search requirements').fill('BR-012');
    await page.getByRole('button', { name: 'Search requirements', exact: true }).click();
    await page.getByText('Add interval rule for BR-012').click();
    await page.getByLabel('Interval start').selectOption('maintenanceStartsAt');
    await page.getByLabel('Interval end').selectOption('maintenanceEndsAt');
    await page.getByLabel('New rule ID').fill('B900');
    await page.getByRole('button', { name: 'Add interval constraint' }).click();
    await expect(page.getByRole('status')).toContainText('revision 2');
    await page.getByRole('button', { name: 'Inspect changes' }).click();
    await expect(page.getByText('Source patch: model/audit-rules.json')).toBeVisible();
    await expect(page.getByText('Source patch: tests/negative-cases.json')).toBeVisible();
    await expect(page.getByText('Source patch: tests/business-acceptance.json')).toBeVisible();
    expect(JSON.parse(store.get(workspace.id).sourceOverlays['tests/business-acceptance.json']).filter(item => item.rule === 'B900').every(item => item.provenance === 'template-derived')).toBe(true);
    await page.getByLabel('Requirement ID', { exact: true }).fill('BR-012');
    await page.getByLabel('Rule ID', { exact: true }).fill('B900');
    await page.getByLabel('Unique case ID').fill('BR-012-B900-REVIEW-PASS');
    await page.getByLabel('Start (UTC, YYYY-MM-DDTHH:MM:SSZ)').fill('2026-10-01T10:00:00Z');
    await page.getByLabel('End (UTC, YYYY-MM-DDTHH:MM:SSZ)').fill('2026-10-01T12:00:00Z');
    await page.getByLabel('Business scenario and expected result').fill('A maintenance window ending later is accepted.');
    await page.getByRole('button', { name: 'Save reviewer case' }).click();
    await expect(page.getByRole('status')).toContainText('revision 3');
    expect(JSON.parse(store.get(workspace.id).sourceOverlays['tests/business-acceptance.json']).find(item => item.id === 'BR-012-B900-REVIEW-PASS').provenance).toBe('independent');
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('reviewer can inspect a publication target without publishing', async ({ page }) => {
  test.setTimeout(45000);
  const directory = mkdtempSync(join(tmpdir(), 'chargeweave-browser-publish-'));
  const repository = join(directory, 'checkout'), remote = join(directory, 'remote.git');
  mkdirSync(repository);
  const git = (cwd, args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  let store, service;
  try {
    git(directory, ['init', '--bare', remote]); git(repository, ['init']);
    writeFileSync(join(repository, 'README.md'), 'baseline\n');
    git(repository, ['add', '.']); git(repository, ['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-m', 'baseline']);
    git(repository, ['remote', 'add', 'origin', remote]); git(repository, ['push', 'origin', 'HEAD:refs/heads/main']);
    const commit = git(repository, ['rev-parse', 'HEAD']);
    store = new WorkspaceStore(':memory:');
    const workspace = store.create({ title: 'Publication preflight', baselineCommit: commit, schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
    const pairingCode = 'synthetic-pairing-code-'.repeat(2);
    const ciFetch = async url => ({ ok: true, json: async () => {
      if (url.includes('/protection/')) return { contexts: ['Synthetic required'] };
      if (url.includes('/rules/')) return [];
      if (url.includes('/check-runs?')) return { total_count: 1, check_runs: [{ name: 'Synthetic required', head_sha: commit, status: 'completed', conclusion: 'success' }] };
      if (url.includes('/status?')) return { sha: commit, total_count: 0, statuses: [] };
      return { workflow_runs: [{ id: 123, name: 'Synthetic check', status: 'completed', conclusion: 'success', head_sha: commit }] };
    } });
    service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)), repository, publicationFixture: { remote, branch: 'main' }, ciFetch });
    service.listen(0, '127.0.0.1'); await once(service, 'listening');
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('button', { name: 'Check publication target' }).click();
    await expect(page.getByText(/local-test-remote · main · matches-baseline/)).toBeVisible();
    await expect(page.getByText(/Preflight alone does not authorize publication/)).toBeVisible();
    await page.getByRole('button', { name: 'Inspect publication history' }).click();
    await expect(page.getByText(/Publisher permission: not enabled/)).toBeVisible();
    await page.getByLabel('Commit SHA').fill(commit);
    await page.getByRole('button', { name: 'Check commit workflows' }).click();
    await expect(page.getByRole('link', { name: 'Synthetic check' })).toBeVisible();
    await expect(page.getByText(/branch-protection requirements and deployment are not checked/)).toBeVisible();
    await page.getByRole('button', { name: 'Check required status checks' }).click();
    await expect(page.getByText('Synthetic required: passed')).toBeVisible();
    expect(git(repository, ['rev-parse', 'HEAD'])).toBe(commit);
  } finally { await page.close(); if (service) await service.shutdown(); store?.close(); rmSync(directory, { recursive: true, force: true }); }
});

test('reviewer opens a simulated draft pull request for a recorded branch', async ({ page }) => {
  test.setTimeout(60000);
  const directory = mkdtempSync(join(tmpdir(), 'chargeweave-browser-pr-'));
  const repository = join(directory, 'repo'), root = fileURLToPath(new URL('../..', import.meta.url));
  const git = args => execFileSync('git', args, { cwd: repository, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  let store, service;
  try {
    mkdirSync(repository); mkdirSync(join(repository, 'model')); mkdirSync(join(repository, 'tools'));
    for (const name of ['authoring_adapter.py', 'domain_schema.py']) copyFileSync(join(root, 'tools', name), join(repository, 'tools', name));
    const schema = 'MODULE|foundation\nRecord|root|A record.|\n';
    writeFileSync(join(repository, 'model', 'domain.schema'), schema);
    git(['init']); git(['add', '.']); git(['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-m', 'baseline']);
    const commit = git(['rev-parse', 'HEAD']);
    store = new WorkspaceStore(':memory:');
    const workspace = store.create({ title: 'Synthetic pull request', baselineCommit: commit, schema, sourceManifest: importSourceManifest(repository, commit) });
    store.apply({ workspaceId: workspace.id, actor: 'draft', operationId: 'edit', expectedRevision: 0, commands: [{ type: 'class.add', name: 'DemoCandidate', module: 'foundation', parent: 'Record', definition: 'A synthetic reviewed candidate.' }] });
    const candidate = store.get(workspace.id);
    for (const profile of ['structural', 'reference', 'audit', 'acceptance']) {
      const job = store.createJob(workspace.id, 1, candidate.sourceDigest, 'test', profile, profile).job;
      store.updateJob(job.id, 'passed');
    }
    const review = store.recordReview(workspace.id, { actor: 'reviewer', operationId: 'accept', expectedRevision: 1, sourceDigest: candidate.sourceDigest, decision: 'accept', reason: 'Synthetic test review.' });
    const preview = store.createJob(workspace.id, 1, candidate.sourceDigest, 'reviewer', 'preview', 'publication-preview', review.id).job;
    store.saveJobArtifacts(preview.id, { reviewId: review.id, sourceDigest: candidate.sourceDigest, baselineCommit: commit, revision: 1, files: [{ path: 'model/domain.schema', sha256: candidate.sourceDigest }] });
    store.updateJob(preview.id, 'passed');
    const intent = store.reservePublication(workspace.id, { actor: 'reviewer', operationId: 'reserve', expectedRevision: 1, sourceDigest: candidate.sourceDigest, reviewId: review.id, previewJobId: preview.id, subject: 'Synthetic model change', body: 'Synthetic test description.' });
    const head = 'b'.repeat(40);
    store.savePublicationCommit(workspace.id, intent.id, head, Buffer.from('synthetic bundle'));
    store.advancePublication(workspace.id, intent.id, 'commit_created', 'push_pending');
    store.advancePublication(workspace.id, intent.id, 'push_pending', 'pushed', head);
    const response = value => ({ ok: true, text: async () => JSON.stringify(value) });
    const pullRequestFetch = async (url, options) => {
      if (url.includes('/pulls?')) return response([]);
      if (url.endsWith('/git/ref/heads/main')) return response({ ref: 'refs/heads/main', object: { sha: commit } });
      if (url.includes('/git/ref/heads/')) return response({ ref: `refs/heads/${intent.branch}`, object: { sha: head } });
      const request = JSON.parse(options.body);
      return response({ number: 77, state: 'open', body: request.body, head: { ref: intent.branch, sha: head, repo: { full_name: 'pli-poc/charge-weave' } }, base: { ref: 'main', repo: { full_name: 'pli-poc/charge-weave' } } });
    };
    const pairingCode = 'synthetic-pairing-code-'.repeat(2);
    service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, repository, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)), allowPublish: true, githubToken: 'synthetic-publisher-token-'.repeat(2), pullRequestFetch });
    service.listen(0, '127.0.0.1'); await once(service, 'listening');
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('button', { name: 'Inspect publication history' }).click();
    await expect(page.getByText(/Publisher permission: enabled/)).toBeVisible();
    await page.getByRole('button', { name: 'Create draft pull request' }).click();
    await expect(page.getByRole('link', { name: 'Pull request #77' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Pull request #77' })).toHaveAttribute('href', 'https://github.com/pli-poc/charge-weave/pull/77');
    expect(store.publication(workspace.id, intent.id).state).toBe('pr_created');
  } finally { await page.close(); if (service) await service.shutdown(); store?.close(); rmSync(directory, { recursive: true, force: true }); }
});

test('browser updates a field with a visible compatibility warning', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Field editing', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|recordName:string? peer:Record?\nDevice|Record|A device.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByLabel('Search model').fill('Record');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Record', exact: true }).click();
    await page.getByLabel('Filter fields').fill('peer');
    await expect(page.getByText('Showing 1 of 2 fields.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit recordName' })).toHaveCount(0);
    await page.getByLabel('Filter fields').clear();
    await page.getByLabel('Sort fields').selectOption('name');
    await expect(page.locator('.studio-field-table tbody tr').first()).toContainText('peer');
    await page.getByRole('button', { name: 'Edit recordName' }).click();
    await expect(page.locator('.studio-panels').getByRole('heading', { name: 'Edit field contract' })).toBeVisible();
    await expect(page.getByLabel('New datatype or target class')).toBeFocused();
    await page.getByRole('button', { name: 'Cancel field edit' }).click();
    await expect(page.getByRole('button', { name: 'Edit recordName' })).toBeFocused();
    await page.getByRole('button', { name: 'Edit recordName' }).click();
    await page.getByLabel('New cardinality').selectOption('!');
    await page.getByRole('button', { name: 'Update field contract' }).click();
    await expect(page.getByRole('status')).toContainText('revision 1');
    await expect(page.getByRole('row').filter({ has: page.getByRole('rowheader', { name: /recordName/ }) })).toContainText('Exactly one (1)');
    expect(store.get(workspace.id).schema).toContain('recordName:string!');
    await page.getByRole('button', { name: 'Review draft changes' }).click();
    await expect(page.getByRole('heading', { name: 'Changes at revision 1' })).toBeFocused();
    await expect(page.getByText(/recordName: potentially-breaking/)).toBeVisible();
    await expect(page.getByText(/existing data or consumers may need migration/)).toBeVisible();
    await page.getByRole('button', { name: 'Require peer' }).click();
    await expect(page.getByRole('status')).toContainText('revision 2');
    expect(store.get(workspace.id).schema).toContain('peer:Record!');
    store.suggestView(workspace.id, { actor: 'codex', operationId: 'suggest-device', expectedRevision: 2, root: 'Device', viewpoint: 'information', explanation: 'Inspect the device.' });
    await expect(page.getByText('Inspect the device.')).toBeVisible();
    await page.getByRole('button', { name: 'Focus Device' }).click();
    await expect(page.getByRole('heading', { name: 'Device', exact: true })).toBeVisible();
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('following suggestions pauses for manual work and resumes for new events', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Following', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  const suggest = (operationId, root) => store.suggestView(workspace.id, { actor: 'codex', operationId, expectedRevision: 0, root, viewpoint: 'information', explanation: operationId });
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByLabel('Search model').fill('Record');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Record', exact: true }).click();
    await page.getByLabel('Follow new changes and suggestions').check();
    suggest('first-suggestion', 'Device');
    await expect(page.getByRole('heading', { name: 'Device', exact: true })).toBeVisible();
    await page.getByLabel('Search model').focus();
    await expect(page.getByText('Following paused after interaction.')).toBeVisible();
    suggest('paused-suggestion', 'Record');
    await expect(page.getByText('paused-suggestion', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Device', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Resume following' }).click();
    suggest('resumed-suggestion', 'Record');
    await expect(page.getByRole('heading', { name: 'Record', exact: true })).toBeVisible();
    await page.getByLabel('Follow new changes and suggestions').uncheck();
    suggest('disabled-suggestion', 'Device');
    await expect(page.getByText('disabled-suggestion', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Record', exact: true })).toBeVisible();
    expect(store.get(workspace.id).revision).toBe(0);
    await page.getByLabel('Follow new changes and suggestions').check();
    store.apply({ workspaceId: workspace.id, actor: 'codex', operationId: 'add-planned-window', expectedRevision: 0, commands: [{ type: 'class.add', name: 'PlannedWindow', module: 'foundation', parent: 'Record', definition: 'A planned window.' }] });
    await expect(page.getByRole('heading', { name: 'PlannedWindow', exact: true })).toBeVisible();
    await expect(page.getByText(/Latest change: codex updated PlannedWindow/)).toBeVisible();
    await page.getByLabel('Search model').fill('Record');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Record', exact: true }).first().click();
    await page.getByRole('button', { name: 'Show latest change' }).click();
    await expect(page.getByRole('heading', { name: 'PlannedWindow', exact: true })).toBeVisible();
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('relationship gestures and keyboard form do not edit until submitted', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop connector gestures are covered separately from the mobile list.');
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Relationship authoring', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByLabel('Search model').fill('Device');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    const graph = page.getByRole('region', { name: 'Relationships for Device' });
    await expect(graph).toHaveAttribute('data-layout', 'ready');
    // The initial fit animation moves both handles after layout completes.
    await page.waitForTimeout(500);
    const from = graph.locator('.react-flow__node[data-id="Device"] .react-flow__handle.source');
    const to = graph.locator('.react-flow__node[data-id="Record"] .react-flow__handle.target');
    await graph.scrollIntoViewIfNeeded();
    // The initial view prioritizes readable scale; fit both endpoints before dragging.
    await graph.locator('.react-flow__controls-fitview').click();
    await from.scrollIntoViewIfNeeded();
    const sourceBox = await from.boundingBox(), targetBox = await to.boundingBox();
    await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 15 });
    await page.mouse.up();
    await expect(page.getByRole('form', { name: 'New relationship' })).toBeVisible();
    expect(store.get(workspace.id).revision).toBe(0);
    await page.getByRole('button', { name: 'Cancel relationship' }).click();
    await page.getByText('Create a relationship using the keyboard').click();
    await page.getByRole('button', { name: 'Relate Device to Record' }).click();
    await page.getByLabel('Predicate name').focus();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Relate Device to Record' })).toBeFocused();
    await page.getByRole('button', { name: 'Relate Device to Record' }).click();
    await page.getByLabel('Predicate name').fill('linkedRecord');
    await page.getByLabel('Relationship description').fill('The record linked to this device.');
    await page.getByLabel('Relationship cardinality').selectOption('!');
    expect(store.get(workspace.id).revision).toBe(0);
    await page.getByRole('button', { name: 'Create relationship', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('revision 1');
    expect(store.get(workspace.id).schema).toContain('linkedRecord:Record!');
    expect(store.get(workspace.id).schema).toContain('# FIELD-DESCRIPTION|Device|linkedRecord|The record linked to this device.');
    await expect(page.getByRole('row').filter({ has: page.getByRole('rowheader', { name: /linkedRecord/ }) })).toContainText('Record');
    await expect(page.getByRole('rowheader', { name: /linkedRecord/ })).toContainText('The record linked to this device');
    await page.getByRole('heading', { name: 'Inspector' }).click();
    await page.keyboard.press('Control+k');
    await expect(page.getByLabel('Search model')).toBeFocused();
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('interactive graph preserves view positions and supports keyboard selection', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop pointer and keyboard interaction is covered separately from the mobile list.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Graph interaction', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|serial:string? peer:Record?\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByLabel('Search model').fill('Device');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    const canvas = page.getByRole('region', { name: 'Relationships for Device' });
    await expect(canvas).toHaveAttribute('data-layout', 'ready');
    const node = canvas.locator('.react-flow__node[data-id="Device"]');
    await expect(node).toBeVisible();
    await expect(node.getByText('serial:string?')).toBeVisible();
    await expect(canvas.locator('.react-flow__edge-text').filter({ hasText: 'peer 0..1' })).toBeVisible();
    await expect(canvas.locator('.react-flow__edge-path').first()).toHaveAttribute('marker-end', /url/);
    const relationshipPaths = await canvas.locator('.react-flow__edge-path').evaluateAll(paths => paths.map(path => path.getAttribute('d')));
    expect(new Set(relationshipPaths).size).toBe(2);
    await canvas.locator('.react-flow__controls-fitview').click();
    await canvas.getByRole('button', { name: 'Focus selected concept' }).click();
    await expect(canvas.locator('.react-flow__viewport')).toHaveAttribute('style', /scale\(1\)/);
    await page.getByLabel('View ID').fill('maintenance');
    await page.getByRole('button', { name: 'Choose view ID' }).click();
    await expect(page.getByRole('region', { name: 'Relationships for Device' })).toHaveAttribute('data-layout', 'ready');
    await node.scrollIntoViewIfNeeded();
    const initial = await node.getAttribute('style');
    const box = await node.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + 65, box.y + box.height / 2 + 55, { steps: 6 }); await page.mouse.up();
    await expect(node).not.toHaveAttribute('style', initial);
    const moved = await node.getAttribute('style');
    expect(store.get(workspace.id).revision).toBe(0);
    await page.getByText('View groups and annotations').click();
    await page.getByLabel('Group name').fill('Core');
    await page.getByLabel('Group concepts (comma separated)').fill('Device, Record');
    await page.getByRole('button', { name: 'Add view group' }).click();
    await page.getByLabel('Note for selected concept').fill('Review the device.');
    await page.getByRole('button', { name: 'Add view note' }).click();
    await page.getByRole('button', { name: 'Save shared view' }).click();
    await expect(page.getByText('Shared view saved.')).toBeVisible();
    const exportPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export saved view' }).click();
    const exported = JSON.parse(readFileSync(await (await exportPromise).path(), 'utf8'));
    expect(exported.contractVersion).toBe('chargeweave-view-v1'); expect(exported.viewId).toBe('maintenance');
    expect(exported.definition.root).toBe('Device'); expect(exported.definition.annotations[0].text).toBe('Review the device.');
    expect(store.savedView(workspace.id, 'maintenance').definition.root).toBe('Device');
    store.apply({ workspaceId: workspace.id, actor: 'other-client', operationId: 'remote-edit', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Device', definition: 'A remotely updated device.' }] });
    await expect(page.getByRole('status')).toContainText('revision 1');
    await expect(node).toHaveAttribute('style', moved);
    await page.evaluate(id => sessionStorage.removeItem(`chargeweave.canvas.v2.${id}.maintenance`), workspace.id);
    await page.reload();
    await expect(page.getByRole('status')).toContainText('revision 1');
    await page.getByLabel('Search model').fill('Device');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    await page.getByLabel('Existing shared views').selectOption('maintenance');
    await page.getByRole('button', { name: 'Load shared view' }).click();
    await expect(page.getByText('Shared view loaded.')).toBeVisible();
    await page.getByText('View groups and annotations').click();
    await expect(page.getByText('Core: Device, Record')).toBeVisible();
    await expect(page.getByText('Device: Review the device.')).toBeVisible();
    const restored = page.getByRole('region', { name: 'Relationships for Device' });
    await expect(restored.locator('.react-flow__node[data-id="Device"]')).toHaveAttribute('style', moved);
    const parent = restored.locator('.react-flow__node[data-id="Record"]');
    await parent.focus(); await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'Record', exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Relationships for Device' })).toBeVisible();
    await page.getByRole('textbox', { name: 'Definition', exact: true }).fill('A changed record.');
    await expect(page.getByRole('button', { name: 'Save definition' })).toBeEnabled();
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page.getByRole('button', { name: 'Focus neighbourhood' }).click();
    await expect(page.getByRole('region', { name: 'Relationships for Record' })).toBeVisible();
    expect(store.get(workspace.id).revision).toBe(1);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('mobile relationship list remains usable without horizontal page scrolling', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'This checks the compact layout.');
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Compact graph', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByLabel('Search model').fill('Device');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    const navigation = page.getByRole('navigation', { name: 'Workspace sections' });
    await navigation.getByRole('button', { name: 'Inspector', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Inspector' })).toBeFocused();
    await navigation.getByRole('button', { name: 'Diagram', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Workspace', exact: true })).toBeFocused();
    const relationship = page.locator('.studio-graph li').filter({ hasText: 'subClassOf' });
    await relationship.getByRole('button', { name: 'Record' }).click();
    await expect(page.getByRole('region', { name: 'Relationships for Record' })).toBeVisible();
    const overflows = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflows).toBe(false);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('browser maps an existing responsibility relationship without inventing one', async ({ page }) => {
  const source = 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|owner:Record?\n';
  const mapping = JSON.stringify({ version: 'chargeweave-responsibility-v1', bindings: [] }, null, 2) + '\n';
  const entries = { 'model/domain.schema': source, 'model/responsibility-bindings.json': mapping, 'tools/authoring_adapter.py': readFileSync(fileURLToPath(new URL('../../tools/authoring_adapter.py', import.meta.url)), 'utf8'), 'tools/domain_schema.py': readFileSync(fileURLToPath(new URL('../../tools/domain_schema.py', import.meta.url)), 'utf8') };
  const manifest = Object.entries(entries).map(([path, value]) => ({ path, sha256: createHash('sha256').update(value).digest('hex') })).sort((a, b) => a.path < b.path ? -1 : 1);
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Responsibility mapping', baselineCommit: 'a'.repeat(40), schema: source, sourceManifest: manifest, sourceBlobs: { 'model/responsibility-bindings.json': mapping } });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByLabel('Search model').fill('Device');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    await page.getByRole('button', { name: 'Inspect responsibilities for selected concept' }).click();
    await page.getByText('Map an existing responsibility relationship').click();
    await page.getByLabel('Declared object relationship').selectOption('owner');
    await page.getByLabel('Responsibility label').fill('Accountable party');
    await page.getByRole('button', { name: 'Add responsibility mapping' }).click();
    await expect(page.getByRole('status')).toContainText('revision 1');
    expect(store.get(workspace.id).schema).toBe(source);
    await page.getByRole('button', { name: 'Inspect responsibilities for selected concept' }).click();
    await expect(page.getByText(/Accountable party: owner → Record/)).toBeVisible();
    await page.getByRole('button', { name: 'Undo latest command group' }).click();
    await expect(page.getByRole('status')).toContainText('revision 2');
    expect(store.responsibilityView(workspace.id, 'Device', 2).bindings).toEqual([]);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('browser inspects the pinned temporal policy and explicit time fields', async ({ page }) => {
  test.setTimeout(90000);
  const repository = fileURLToPath(new URL('../..', import.meta.url));
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim();
  const show = path => execFileSync('git', ['show', `${commit}:${path}`], { cwd: repository });
  const paths = ['model/audit-rules.json', 'model/domain.schema', 'model/temporal-policy.json', 'model/temporal-queries.json', 'requirements/business-requirements.json', 'requirements/journeys.json', 'tools/authoring_adapter.py', 'tools/domain_schema.py'];
  const manifest = paths.map(path => ({ path, sha256: createHash('sha256').update(show(path)).digest('hex') }));
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Temporal browser test', baselineCommit: commit, schema: show('model/domain.schema').toString('utf8'), sourceManifest: manifest, sourceBlobs: { 'requirements/business-requirements.json': show('requirements/business-requirements.json').toString('utf8'), 'model/temporal-policy.json': show('model/temporal-policy.json').toString('utf8') } });
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode: 'synthetic-pairing-code-'.repeat(2), workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)), repository });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill('synthetic-pairing-code-'.repeat(2));
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByLabel('Search model').fill('TimeWindow');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'TimeWindow', exact: true }).first().click();
    await page.getByRole('button', { name: 'Inspect time for selected concept' }).click();
    await expect(page.getByText('Class policy: snapshot-versioned')).toBeVisible();
    await expect(page.getByText(/Policy source: model\/temporal-policy\.json/)).toBeVisible();
    await expect(page.getByText(/Model revision 0; policy from baseline/)).toContainText(commit);
    await expect(page.getByRole('heading', { name: 'Explicit time fields and window references' })).toBeVisible();
    await page.getByLabel('Search model').fill('RecurringWindow');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'RecurringWindow', exact: true }).first().click();
    await page.getByRole('button', { name: 'Focus neighbourhood' }).click();
    await page.getByRole('button', { name: 'Inspect time for selected concept' }).click();
    await page.getByLabel('Graph viewpoint').selectOption('temporal');
    await expect(page.locator('.studio-graph li').filter({ hasText: 'exceptionWindow' })).toBeVisible();
    await page.getByLabel('Filter graph relationships').fill('exceptionWindow');
    await expect(page.locator('.studio-graph li').filter({ hasText: 'exceptionWindow' })).toBeVisible();
    await page.getByRole('button', { name: 'Save shared view' }).click();
    await expect(page.getByText('Shared view saved.')).toBeVisible();
    await page.getByLabel('Graph viewpoint').selectOption('information');
    await page.getByLabel('Filter graph relationships').fill('');
    await page.getByRole('button', { name: 'Load shared view' }).click();
    await expect(page.getByLabel('Graph viewpoint')).toHaveValue('temporal');
    await expect(page.getByLabel('Filter graph relationships')).toHaveValue('exceptionWindow');
    await page.getByRole('button', { name: 'Inspect TimeWindow' }).click();
    await expect(page.getByRole('heading', { name: 'TimeWindow', exact: true })).toBeVisible();
    await page.getByLabel('Graph viewpoint').selectOption('information');
    await page.getByLabel('Filter graph relationships').fill('');
    await page.getByRole('button', { name: 'Inspect responsibilities for selected concept' }).click();
    await expect(page.getByText('No responsibility binding defined in this mapping.')).toBeVisible();
    await page.getByRole('button', { name: 'Add a field or relationship', exact: true }).click();
    await expect(page.getByLabel('Field name')).toBeVisible();
    await page.getByLabel('Search model').fill('ChargingStation');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'ChargingStation', exact: true }).first().click();
    await page.getByRole('button', { name: 'Focus neighbourhood' }).click();
    await page.getByLabel('Graph viewpoint').selectOption('responsibility');
    await expect(page.locator('.studio-graph li').filter({ hasText: 'assetOwner' })).toBeVisible();
    await page.getByLabel('Filter graph relationships').fill('assetOwner');
    await expect(page.locator('.studio-graph li').filter({ hasText: 'assetOwner' })).toBeVisible();
    await expect(page.locator('.studio-graph li').filter({ hasText: 'maintenanceProvider' })).toHaveCount(0);
    await page.getByLabel('Graph viewpoint').selectOption('information');
    await page.getByLabel('Filter graph relationships').fill('');
    await page.getByRole('button', { name: 'Inspect responsibilities for selected concept' }).click();
    await expect(page.getByText('Asset owner', { exact: true })).toBeVisible();
    await expect(page.getByText(/Asset owner: assetOwner → LegalEntity/)).toBeVisible();
    await page.getByLabel('Filter responsibility category').selectOption('service');
    await expect(page.getByText('Asset owner', { exact: true })).toHaveCount(0);
    await page.getByLabel('Filter responsibility category').selectOption('ownership');
    await page.getByText('Why this binding appears').first().click();
    await expect(page.getByText(/Predicate IRI:/).first()).toBeVisible();
    await page.getByRole('button', { name: 'Inspect LegalEntity' }).first().click();
    await expect(page.getByRole('heading', { name: 'LegalEntity', exact: true })).toBeVisible();
    await page.getByLabel('Search model').fill('ChargingStation');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'ChargingStation', exact: true }).first().click();
    await page.getByRole('textbox', { name: 'Definition', exact: true }).fill('A reviewed station definition.');
    await page.getByRole('button', { name: 'Save definition' }).click();
    await expect(page.getByRole('status')).toContainText('revision 1');
    await page.getByRole('button', { name: 'Inspect explicit impact references' }).click();
    await expect(page.getByText(/Changed classes: ChargingStation/)).toBeVisible();
    await expect(page.locator('section').filter({ has: page.getByRole('heading', { name: 'Change impact' }) }).getByText(/requirement BR-/).first()).toBeVisible();
    await page.getByLabel('Reason', { exact: true }).fill('Add a deliberate negative fixture.');
    await page.getByRole('button', { name: 'Record reviewer decision' }).click();
    await expect(page.getByText('Add a deliberate negative fixture.')).toBeVisible();
    await expect(page.getByText(/Changes requested · revision 1 · local-reviewer · current/)).toBeVisible();
    await page.getByRole('textbox', { name: 'Definition', exact: true }).fill('A revised station definition.');
    await page.getByRole('button', { name: 'Save definition' }).click();
    await expect(page.getByRole('status')).toContainText('revision 2');
    await expect(page.getByText(/Changes requested · revision 1 · local-reviewer · stale/)).toBeVisible();
    await page.getByLabel('Search requirements').fill('BR-001');
    await page.getByRole('button', { name: 'Search requirements', exact: true }).click();
    await page.locator('li').filter({ hasText: 'BR-001' }).getByRole('button', { name: 'Link selected concept' }).click();
    await expect(page.getByRole('status')).toContainText('revision 3');
    await page.getByRole('button', { name: 'Inspect changes' }).click();
    await expect(page.getByText('Source patch: requirements/business-requirements.json')).toBeVisible();
    await page.getByRole('button', { name: 'Inspect time for selected concept' }).click();
    await page.getByLabel('Set explicit temporal policy').selectOption('immutable-aggregate');
    await page.getByRole('button', { name: 'Save temporal policy' }).click();
    await expect(page.getByRole('status')).toContainText('revision 4');
    await page.getByRole('button', { name: 'Inspect time for selected concept' }).click();
    await expect(page.getByText('Class policy: immutable-aggregate')).toBeVisible();
    await expect(page.getByText(/draft policy from baseline/)).toBeVisible();
    await page.getByRole('button', { name: 'Inspect changes' }).click();
    await expect(page.getByText('Source patch: model/temporal-policy.json')).toBeVisible();
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('failed validation can be inspected, corrected and retried on the current draft', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Repair', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|Needs correction.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const validationRunner = async (target, input, job) => {
    if (job.profile === 'maintenance-demo') {
      const report = JSON.stringify({ cases: [{ case: 'missing-station', expectedConformance: false, actualConformance: true, passed: false }, { case: 'reversed-shared-interval', expectedConformance: false, actualConformance: false, passed: true }] });
      target.startJobStep(job.id, 0, 'tools/test_authoring_maintenance_demo.py');
      target.finishJobStep(job.id, 0, 'failed', report);
      target.updateJob(job.id, 'failed', report);
      return;
    }
    const failing = input.schema.includes('Needs correction.');
    target.startJobStep(job.id, 0, 'tools/example-check.py');
    target.finishJobStep(job.id, 0, failing ? 'failed' : 'passed', failing ? 'Synthetic fixture: definition needs correction.' : 'Fixture passed.');
    target.updateJob(job.id, failing ? 'failed' : 'passed', failing ? 'Synthetic fixture: definition needs correction.' : 'Fixture passed.');
  };
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, repository: '.', validationRunner, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('button', { name: 'Collapse validation' }).click();
    await page.getByRole('button', { name: 'Check draft', exact: true }).click();
    const issues = page.getByRole('region', { name: 'Validation issues' });
    await expect(issues.getByRole('heading', { name: 'Failed check: tools/example-check.py' })).toBeVisible();
    await issues.getByLabel('Filter failed checks').fill('unmatched check');
    await expect(issues.getByText('Showing 0 of 1 failed checks matching the filter.')).toBeVisible();
    await expect(issues.getByRole('heading', { name: 'Failed check: tools/example-check.py' })).toHaveCount(0);
    await issues.getByLabel('Filter failed checks').fill('definition needs correction');
    await expect(issues.getByRole('heading', { name: 'Failed check: tools/example-check.py' })).toBeVisible();
    await issues.getByLabel('Filter failed checks').clear();
    await page.getByRole('button', { name: 'View check details' }).click();
    await expect(issues.getByRole('heading', { name: 'Validation issues' })).toBeFocused();
    await issues.getByText('Recorded check output').click();
    await expect(issues.getByText('Synthetic fixture: definition needs correction.')).toBeVisible();
    await page.getByLabel('Search model').fill('Record');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Record', exact: true }).click();
    await page.getByRole('textbox', { name: 'Definition', exact: true }).fill('Corrected definition.');
    await page.getByRole('button', { name: 'Save definition' }).click();
    await expect(issues.getByText(/stale for the current draft/)).toBeVisible();
    await issues.getByRole('button', { name: 'Retry structural check on current draft' }).click();
    await expect(issues.getByText(/structural check at revision 1: passed/)).toBeVisible();
    await expect(issues.getByText(/Other required checks may still be missing/)).toBeVisible();
    await page.getByRole('button', { name: 'Run maintenance fixtures' }).click();
    await expect(issues.getByText('missing-station: expected rejection, observed conformance.')).toBeVisible();
    await expect(issues.getByRole('button', { name: 'Inspect PlannedMaintenanceWindow' })).toBeVisible();
    await expect(issues.getByText(/reversed-shared-interval: expected/)).toHaveCount(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

for (const denied of ['events', 'mcp']) test(`browser stops reconnecting when ${denied} authorization expires`, async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Reconnect', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await expect(page.getByRole('status')).toContainText('Connected');
    await expect(page.getByRole('button', { name: 'Search', exact: true })).toBeEnabled();
    let attempts = 0;
    await page.route(denied === 'events' ? '**/events?**' : '**/mcp', route => { attempts += 1; return route.fulfill({ status: 401, body: 'Unauthorized' }); });
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await expect(page.getByRole('status')).toContainText('Authorization expired; reconnect');
    await expect(page.getByRole('button', { name: 'Search', exact: true })).toBeDisabled();
    await page.waitForTimeout(1300);
    expect(attempts).toBe(1);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('browser discovers and edits the shared MCP workspace', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Browser test', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|recordName:string!\n' });
  const token = 'test-token-'.repeat(4);
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token, pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)), repository: '.', validationRunner: async (target, input, job) => { target.startJobStep(job.id, 0, 'tools/build.py'); target.finishJobStep(job.id, 0, 'passed'); if (job.profile === 'reference') target.saveJobArtifacts(job.id, { changedCount: 1, baselineManifestSha256: 'a'.repeat(64), candidateManifestSha256: 'b'.repeat(64), changes: [{ path: 'ontology/example.ttl', kind: 'changed' }], omitted: 0, note: 'Synthetic comparison for browser testing.' }); target.updateJob(job.id, 'passed'); } });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    const workspaceReads = [];
    page.on('request', request => { if (request.method() === 'POST' && request.url().endsWith('/mcp')) { try { const body = request.postDataJSON(); if (body.method === 'resources/read' && body.params?.uri?.includes('/v1/summary')) workspaceReads.push(body.params.uri); } catch { /* unrelated request */ } } });
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/developer/modeler/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await expect(page.getByRole('status')).toContainText('revision 0');
    expect(workspaceReads).toContain(`ontology://workspace/${workspace.id}/v1/summary`);
    await page.getByLabel('Search model').fill('NoMatchingConcept');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText(/No matching concepts/)).toBeVisible();
    const cookies = await page.context().cookies();
    expect(cookies.find(cookie => cookie.name === 'cw_studio')?.httpOnly).toBe(true);
    await page.reload();
    await expect(page.getByRole('status')).toContainText('revision 0');
    await page.getByLabel('Change-set intent').fill('Clarify and extend the record.');
    await page.getByRole('button', { name: 'Open change set' }).click();
    await expect(page.getByText(/Clarify and extend the record. · draft/)).toBeVisible();
    await page.getByRole('button', { name: 'Hide navigator' }).click();
    await expect(page.getByRole('heading', { name: 'Discover concepts' })).not.toBeVisible();
    await page.getByRole('button', { name: 'Show navigator' }).click();
    await page.getByRole('button', { name: 'Hide inspector' }).click();
    await expect(page.getByRole('heading', { name: 'Inspector', exact: true })).not.toBeVisible();
    await page.getByRole('button', { name: 'Show inspector' }).click();
    await page.getByText('Connection diagnostics').click();
    await expect(page.getByText(/negotiated MCP protocol:/)).toContainText('2025-06-18');
    await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: text => { window.copiedDiagnostics = text; return Promise.resolve(); } } }); });
    await page.getByRole('button', { name: 'Copy redacted diagnostics' }).click();
    const diagnostics = await page.evaluate(() => window.copiedDiagnostics);
    expect(diagnostics).toContain(workspace.id);
    expect(diagnostics).not.toContain(token);
    expect(diagnostics).not.toContain(pairingCode);
    await page.getByText('Connect an MCP client').click();
    await page.getByRole('button', { name: 'Copy connection details' }).click();
    const connectionDetails = await page.evaluate(() => window.copiedDiagnostics);
    expect(connectionDetails).toContain(workspace.id);
    expect(connectionDetails).toContain('<your draft token>');
    expect(connectionDetails).not.toContain(token);
    await page.getByRole('button', { name: 'Run structural generator' }).click();
    await expect(page.getByText('tools/build.py: passed')).toBeVisible();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download evidence report' }).click();
    const download = await downloadPromise;
    const report = JSON.parse(readFileSync(await download.path(), 'utf8'));
    expect(report.workspaceId).toBe(workspace.id); expect(report.status).toBe('passed');
    expect(report.steps).toEqual([{ checkName: 'tools/build.py', status: 'passed' }]);
    await page.getByRole('button', { name: 'Run reference checks' }).click();
    await expect(page.getByRole('heading', { name: 'Generated artifact comparison' })).toBeVisible();
    await expect(page.getByText('changed: ontology/example.ttl')).toBeVisible();
    await page.getByLabel('Search model').fill('Record');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Record', exact: true }).click();
    await page.getByRole('textbox', { name: 'Definition', exact: true }).fill('An edited record.');
    await page.getByLabel('Reason for next edit (optional)').fill('Clarify the definition.');
    await page.getByRole('button', { name: 'Save definition' }).click();
    await expect(page.getByRole('status')).toContainText('revision 1');
    await expect(page.getByText('Reason: Clarify the definition.')).toBeVisible();
    await expect(page.getByLabel('Reason for next edit (optional)')).toHaveValue('');
    expect(store.search(workspace.id, 'Record').results[0].definition).toBe('An edited record.');
    await page.getByRole('button', { name: 'Inspect changes' }).click();
    await expect(page.getByText('changed: Record')).toBeVisible();
    await expect(page.getByText('After: An edited record.')).toBeVisible();
    await page.getByRole('button', { name: 'Focus changed Record' }).click();
    await expect(page.getByRole('heading', { name: 'Record', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Inspect review gates' }).click();
    await expect(page.getByText('structural: not run for this draft')).toBeVisible();
    await expect(page.getByText('Source patch', { exact: true })).toBeVisible();
    await expect(page.locator('pre').filter({ hasText: '+Record|root|An edited record.' })).toBeVisible();
    await page.getByText('Add a concept').click();
    await page.getByLabel('Class name').fill('MaintenanceWindow');
    await page.getByLabel('Class definition').fill('A planned maintenance window.');
    await page.getByRole('button', { name: 'Add concept' }).click();
    await expect(page.getByRole('status')).toContainText('revision 2');
    await page.getByLabel('Search model').fill('MaintenanceWindow');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'MaintenanceWindow', exact: true }).click();
    const inheritedField = page.getByRole('row').filter({ has: page.getByRole('rowheader', { name: /recordName/ }) });
    await expect(inheritedField).toContainText('string');
    await expect(inheritedField).toContainText('Inherited from Record');
    await expect(page.getByRole('region', { name: 'Relationships for MaintenanceWindow' })).toBeVisible();
    await expect(page.locator('.react-flow__node[data-id="MaintenanceWindow"]')).toContainText('Added in draft');
    await expect(page.getByText('subClassOf →')).toBeVisible();
    await expect(page.getByText(/added · model\/domain\.schema:4/)).toBeVisible();
    await page.getByText('Add a field or relationship').click();
    await page.getByLabel('Field name').fill('windowNote');
    await page.getByRole('button', { name: 'Add field' }).click();
    await expect(page.getByRole('status')).toContainText('revision 3');
    expect(store.search(workspace.id, 'MaintenanceWindow').results[0].fields).toBe('windowNote:string?');
    await page.getByRole('button', { name: 'Undo latest command group' }).click();
    await expect(page.getByRole('status')).toContainText('revision 4');
    expect(store.search(workspace.id, 'MaintenanceWindow').results[0].fields).toBe('');
    await expect(page.getByText(/undid revision 3/)).toBeVisible();
    await page.getByRole('button', { name: 'Inspect revision 1', exact: true }).click();
    const historical = page.getByRole('region', { name: 'Historical comparison' });
    await expect(historical.getByText('Historical revision 1')).toBeVisible();
    await expect(historical.locator('pre').first()).toContainText('+Record|root|An edited record.');
    await expect(historical.getByText('Reason: Clarify the definition.')).toBeVisible();
    await expect(historical.getByText(/Command group:/)).toBeVisible();
    let releaseHistory;
    const historyGate = new Promise(resolve => { releaseHistory = resolve; });
    let interceptedHistory;
    const historyIntercepted = new Promise(resolve => { interceptedHistory = resolve; });
    const delayHistory = async route => {
      const params = route.request().postDataJSON()?.params;
      if (params?.name === 'ontology_history_detail' && params.arguments?.revision === 2) { interceptedHistory(); await historyGate; }
      await route.continue();
    };
    await page.route('**/mcp', delayHistory);
    try {
      await page.getByRole('button', { name: 'Inspect revision 2', exact: true }).click();
      await historyIntercepted;
      const recentResponse = page.waitForResponse(response => response.request().postDataJSON()?.params?.name === 'ontology_history_detail' && response.request().postDataJSON()?.params?.arguments?.revision === 1);
      await page.getByRole('button', { name: 'Inspect revision 1', exact: true }).click();
      await recentResponse;
      const oldResponse = page.waitForResponse(response => response.request().postDataJSON()?.params?.name === 'ontology_history_detail' && response.request().postDataJSON()?.params?.arguments?.revision === 2);
      releaseHistory(); await oldResponse;
      await expect(historical.getByText('Historical revision 1')).toBeVisible();
    } finally { releaseHistory(); await page.unroute('**/mcp', delayHistory); }
    await expect(page.getByRole('status')).toContainText('revision 4');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await historical.getByRole('button', { name: 'Return to current draft' }).click();
    await expect(historical).toHaveCount(0);
    await page.getByLabel('Decision').selectOption('reject');
    await page.getByLabel('Reason', { exact: true }).fill('The proposal needs revision.');
    await page.getByRole('button', { name: 'Record reviewer decision' }).click();
    await expect(page.getByText(/Clarify and extend the record. · rejected/)).toBeVisible();
    await page.getByRole('button', { name: 'Reopen change set' }).click();
    await expect(page.getByText(/Clarify and extend the record. · draft/)).toBeVisible();
    await page.route('**/events?**', route => route.abort());
    await page.route('**/mcp', route => route.abort());
    service.closeAllConnections();
    await expect(page.getByRole('status')).toContainText('Reconnecting');
    await expect(page.getByRole('button', { name: 'Search', exact: true })).toBeDisabled();
    await page.waitForTimeout(1500);
    await expect(page.getByRole('status')).toContainText('Reconnecting');
    await page.unroute('**/mcp');
    await page.unroute('**/events?**');
    await expect(page.getByRole('status')).toContainText('Connected');
    await expect(page.getByRole('button', { name: 'Search', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Disconnect' }).click();
    await expect(page.getByRole('status')).toContainText('Disconnected');
    expect((await page.context().cookies()).some(cookie => cookie.name === 'cw_studio')).toBe(false);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
