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

test('explorer expands declared and inherited fields at the current revision', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Explorer members', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|recordName:string?\nDevice|Record|A device.|serial:string!\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    const row = page.getByRole('list', { name: 'Loaded concepts by module' }).locator('li').filter({ has: page.getByRole('button', { name: 'Device', exact: true }) }).last();
    await row.getByRole('button', { name: 'Show fields for Device' }).click();
    await expect(row.getByText('Declared fields', { exact: true })).toBeVisible();
    await expect(row.getByText('serial', { exact: true })).toBeVisible();
    await expect(row.getByText('recordName', { exact: true })).toBeHidden();
    await row.getByText('Inherited fields (1)', { exact: true }).click();
    await expect(row.getByText('recordName', { exact: true })).toBeVisible();
    await expect(row.getByText(/from Record/)).toBeVisible();
    expect(store.get(workspace.id).revision).toBe(0);
    await row.getByRole('button', { name: 'Hide fields for Device' }).click();
    let release, observed;
    const gate = new Promise(resolve => { release = resolve; });
    const intercepted = new Promise(resolve => { observed = resolve; });
    const delay = async route => {
      const params = route.request().postDataJSON()?.params;
      if (params?.name === 'ontology_entity_get' && params.arguments?.name === 'Device' && params.arguments?.expectedRevision === 0) {
        observed(); await gate;
        // The revision change aborts this intentionally delayed stale request.
        await route.continue().catch(() => {});
      } else await route.continue();
    };
    await page.route('**/mcp', delay);
    try {
      await row.getByRole('button', { name: 'Show fields for Device' }).click();
      await intercepted;
      store.apply({ workspaceId: workspace.id, actor: 'other-client', operationId: 'add-member', expectedRevision: 0, commands: [{ type: 'property.add', owner: 'Device', name: 'modelNumber', range: 'string', cardinality: '?' }] });
      await expect(page.getByRole('region', { name: 'Workspace status' })).toContainText('Revision 1');
      release();
      await expect(page.getByRole('button', { name: 'Hide fields for Device' })).toHaveAttribute('aria-expanded', 'true');
      const refreshed = page.getByRole('list', { name: 'Loaded concepts by module' }).locator('li').filter({ has: page.getByRole('button', { name: 'Hide fields for Device' }) }).last();
      await expect(refreshed.getByText('modelNumber', { exact: true })).toBeVisible();
      await refreshed.getByText('Inherited fields (1)', { exact: true }).click();
      await refreshed.getByRole('button', { name: 'Inspect declaration of recordName' }).click();
      await expect(page.getByRole('heading', { name: 'Record', exact: true })).toBeVisible();
    } finally { release(); }
    expect(store.get(workspace.id).revision).toBe(1);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('inherited fields link to their declaring concept', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Inherited fields', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|recordName:string?\nDevice|Record|A device.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Relationships for Device' })).toBeVisible();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await page.getByRole('button', { name: 'Inspect parent Record' }).click();
    await expect(page.getByRole('heading', { name: 'Record', exact: true })).toBeVisible();
    if (!isMobile) await expect(page.getByRole('region', { name: 'Relationships for Device' })).toBeVisible();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Model' }).click();
    await page.getByRole('list', { name: 'Loaded concepts by module' }).getByRole('button', { name: 'Device', exact: true }).click();
    await page.getByRole('button', { name: 'Inspect owner Record' }).click();
    await expect(page.getByRole('heading', { name: 'Record', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit recordName' })).toBeVisible();
    if (!isMobile) await expect(page.getByRole('region', { name: 'Relationships for Device' })).toBeVisible();
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('unreadable local layout is not silently overwritten by automatic placement', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Unreadable layout', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    const key = `chargeweave.canvas.v2.${workspace.id}.default`;
    await page.addInitScript(key => sessionStorage.setItem(key, '{broken'), key);
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Relationships for Device' })).toHaveAttribute('data-layout', 'ready');
    await expect(page.getByText(/Local layout could not be read/)).toBeVisible();
    expect(await page.evaluate(key => sessionStorage.getItem(key), key)).toBe('{broken');
    await page.getByRole('button', { name: 'Save shared view' }).click();
    await expect(page.getByText(/Could not save view: Canvas positions could not be read/)).toBeVisible();
    expect(store.savedView(workspace.id, 'default').viewRevision).toBe(0);
    await page.getByRole('button', { name: 'Replace unreadable local layout' }).click();
    await expect(page.getByText(/Local layout replaced with the current diagram positions/)).toBeVisible();
    expect(JSON.parse(await page.evaluate(key => sessionStorage.getItem(key), key)).Device).toBeDefined();
    await page.getByRole('button', { name: 'Save shared view' }).click();
    await expect(page.getByText('Shared view saved.')).toBeVisible();
    expect(store.savedView(workspace.id, 'default').viewRevision).toBe(1);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('explorer finds and links a requirement to the selected concept', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const schema = 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|\n';
  const requirements = JSON.stringify([{ id: 'BR-001', statement: 'Track the record.', classes: ['Record'], rules: [] }], null, 2) + '\n';
  const hash = value => createHash('sha256').update(value).digest('hex');
  const manifest = [
    { path: 'model/domain.schema', sha256: hash(schema) },
    { path: 'requirements/business-requirements.json', sha256: hash(requirements) },
    { path: 'tools/authoring_adapter.py', sha256: hash(readFileSync(new URL('../../tools/authoring_adapter.py', import.meta.url))) },
    { path: 'tools/domain_schema.py', sha256: hash(readFileSync(new URL('../../tools/domain_schema.py', import.meta.url))) },
  ];
  const workspace = store.create({ title: 'Requirement explorer', baselineCommit: 'a'.repeat(40), schema, sourceManifest: manifest, sourceBlobs: { 'requirements/business-requirements.json': requirements } });
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
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Model' }).click();
    const explorer = page.locator('details.studio-requirement-explorer');
    await explorer.getByText('Requirements', { exact: true }).click();
    await explorer.getByLabel('Find requirements').fill('BR-001');
    await explorer.getByRole('button', { name: 'Find requirements' }).click();
    await expect(explorer).toContainText('Track the record.');
    await expect(explorer).toContainText('Showing 1 of 1 matching requirements.');
    await explorer.getByRole('button', { name: 'Link Device' }).click();
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 1');
    await explorer.getByRole('button', { name: 'Find requirements' }).click();
    await expect(explorer.getByRole('button', { name: 'Linked to Device' })).toBeDisabled();
    expect(store.requirementsSearch(workspace.id, 'BR-001', 20, 1).results[0].classes).toContain('Device');
    let release, intercepted;
    const gate = new Promise(resolve => { release = resolve; });
    const observed = new Promise(resolve => { intercepted = resolve; });
    const delay = async route => {
      if (route.request().postDataJSON()?.params?.name === 'ontology_requirement_search') {
        const response = await route.fetch(); intercepted(); await gate;
        await route.fulfill({ response }).catch(() => {});
      } else await route.continue();
    };
    await page.route('**/mcp', delay);
    try {
      await explorer.getByRole('button', { name: 'Find requirements' }).click();
      await observed;
      store.apply({ workspaceId: workspace.id, actor: 'other-client', operationId: 'newer-requirement-context', expectedRevision: 1, commands: [{ type: 'class.describe', name: 'Device', definition: 'A revised device.' }] });
      await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 2');
    } finally { release(); await page.unroute('**/mcp', delay); }
    await expect(explorer.getByText('Track the record.')).toHaveCount(0);
    await explorer.getByRole('button', { name: 'Find requirements' }).click();
    await expect(explorer.getByRole('button', { name: 'Linked to Device' })).toBeDisabled();
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('saved views open from the explorer and preserve local view changes', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Saved views', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|\n' });
  for (const [viewId, root] of [['alpha', 'Device'], ['beta', 'Record']]) store.saveView({ workspaceId: workspace.id, viewId, actor: 'other-client', operationId: `save-${viewId}`, expectedViewRevision: 0, definition: { root, positions: {} } });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.locator('#studio-navigator-pane').getByText('Saved views', { exact: true }).click();
    const open = async id => {
      if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Model' }).click();
      await page.getByRole('button', { name: `Open shared view ${id}` }).click();
    };
    await open('alpha');
    await expect(page.getByRole('region', { name: 'Relationships for Device' })).toBeVisible();
    await page.getByLabel('Filter graph relationships').fill('local filter');
    await expect(page.getByRole('region', { name: 'Workspace status' })).toContainText('View changed locally');
    await open('beta');
    await expect(page.getByRole('region', { name: 'Relationships for Record' })).toBeVisible();
    await open('alpha');
    await expect(page.getByLabel('Filter graph relationships')).toHaveValue('local filter');
    await expect(page.getByText('Local view changes were retained. Use Load shared view to replace them after review.')).toBeVisible();
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('a delayed shared-view load cannot overwrite a newly selected view', async ({ page, isMobile }) => {
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
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Model' }).click();
    await page.locator('#studio-navigator-pane').getByText('Saved views', { exact: true }).click();
    await page.getByRole('button', { name: 'Retry saved views' }).click();
    await expect(page.getByRole('button', { name: 'Open shared view default' })).toBeVisible();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram' }).click();
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
    await expect(page.getByRole('button', { name: 'Close default view' })).toBeDisabled();
    const oldResponse = page.waitForResponse(response => response.url().endsWith('/mcp') && response.request().postDataJSON()?.params?.name === 'ontology_view_saved_get' && response.request().postDataJSON()?.params?.arguments?.viewId === 'default');
    release();
    await oldResponse;
    await expect(page.getByRole('button', { name: 'Close default view' })).toBeEnabled();
    await expect(page.getByText('Shared view loaded.')).toHaveCount(0);
  } finally { release(); await page.close(); await service.shutdown(); store.close(); }
});

test('a shared-view load preserves changes made while it is pending', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'View edit race', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  let signal;
  const intercepted = new Promise(resolve => { signal = resolve; });
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    await page.getByRole('button', { name: 'Save shared view' }).click();
    await expect(page.getByText('Shared view saved.')).toBeVisible();
    await page.route('**/mcp', async route => {
      if (route.request().postDataJSON()?.params?.name === 'ontology_view_saved_get') { signal(); await gate; }
      await route.continue();
    });
    await page.getByRole('button', { name: 'Load shared view' }).click();
    await intercepted;
    await page.getByText('View groups and annotations').click();
    await page.getByLabel('Note for selected concept').fill('Keep this note');
    await page.getByRole('button', { name: 'Add view note' }).click();
    release();
    await expect(page.getByText('The shared view was not loaded because this view changed while it was loading.')).toBeVisible();
    await expect(page.getByText('Device: Keep this note')).toBeVisible();
    await expect(page.getByRole('region', { name: 'Workspace status' })).toContainText('View changed locally');
  } finally { release(); await page.close(); await service.shutdown(); store.close(); }
});

test('navigator search refreshes when another client changes the draft', async ({ page, isMobile }) => {
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
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Results' }).click();
    const results = page.getByRole('region', { name: 'Workspace results' });
    const resultNav = results.getByRole('navigation', { name: 'Results panels' });
    await resultNav.getByRole('button', { name: 'Problems', exact: true }).click();
    await expect(results.getByText('No validation result is displayed. Run a check to inspect failures.')).toBeVisible();
    await resultNav.getByRole('button', { name: 'Activity', exact: true }).click();
    await expect(results.getByRole('region', { name: 'Recent activity' })).toBeVisible();
    await resultNav.getByRole('button', { name: 'Output', exact: true }).click();
    await expect(results.getByText('No job output is available.')).toBeVisible();
    await resultNav.getByRole('button', { name: 'Close results panel' }).click();
    await expect(resultNav.getByRole('button', { name: 'Output', exact: true })).toBeFocused();
    await workspaceStatus.getByRole('link', { name: 'Checks: no result displayed' }).click();
    const validation = page.getByRole('region', { name: 'Validation issues' });
    await expect(validation.getByText('No validation result is displayed for this draft.', { exact: false })).toBeVisible();
    await expect(validation.getByRole('button', { name: 'Run structural check' })).toBeEnabled();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await page.getByRole('button', { name: 'Find a concept' }).click();
    await expect(page.getByLabel('Search model')).toBeFocused();
    const destinations = page.getByRole('navigation', { name: 'Workspace destinations' });
    await destinations.getByRole('link', { name: 'Activity' }).click();
    await expect(page.getByRole('heading', { name: 'Activity', exact: true })).toBeInViewport();
    if (test.info().project.name === 'desktop') await expect(destinations).toBeInViewport();
    await destinations.getByRole('link', { name: 'Model' }).click();
    await expect(page.getByRole('heading', { name: 'Discover concepts' })).toBeFocused();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Results' }).click();
    await validation.getByRole('button', { name: 'Collapse validation' }).click();
    await expect(validation.getByRole('button', { name: 'Run structural check', includeHidden: true })).toBeHidden();
    await workspaceStatus.getByRole('link', { name: 'Checks: no result displayed' }).click();
    await expect(validation.getByRole('button', { name: 'Run structural check' })).toBeVisible();
    if (!isMobile) await page.getByRole('button', { name: 'Hide navigator' }).click();
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
    await expect(page.locator('#studio-navigator-pane').getByText('Original device.')).toBeVisible();
    store.apply({ workspaceId: workspace.id, actor: 'other-client', operationId: 'update-search-result', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Device', definition: 'Updated device definition.' }] });
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 1');
    await expect(workspaceStatus).toContainText('Revision 1');
    await expect(page.locator('#studio-navigator-pane').getByText('Updated device definition.')).toBeVisible();
    await expect(page.getByLabel('Search model')).toHaveValue('Device');
    await expect(page.getByText('1 matching concept shown.')).toBeVisible();
    await page.getByRole('button', { name: 'Clear search' }).click();
    await expect(page.getByLabel('Search model')).toHaveValue('');
    await expect(page.getByRole('heading', { name: 'Browse concepts' })).toBeVisible();
    await page.getByLabel('Search model').fill('NoSuchConcept');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('0 matching concepts shown.')).toBeVisible();
    await page.getByRole('button', { name: 'Create a new concept' }).click();
    await expect(page.getByLabel('Class name')).toBeFocused();
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
    await expect(page.getByRole('region', { name: 'Workspace status' })).toContainText('View changed locally');
    const firstPosition = await node.getAttribute('style');
    page.once('dialog', dialog => dialog.dismiss());
    await page.getByRole('button', { name: 'Load shared view' }).click();
    await expect(node).toHaveAttribute('style', firstPosition);
    await expect(page.getByRole('region', { name: 'Workspace status' })).toContainText('View changed locally');
    await page.getByRole('button', { name: 'Save shared view' }).click();
    await expect(page.getByRole('region', { name: 'Workspace status' })).not.toContainText('View changed locally');
    await page.getByLabel('View ID').fill('other');
    await page.getByRole('button', { name: 'Choose view ID' }).click();
    await move(95, 65);
    const secondPosition = await node.getAttribute('style');
    expect(secondPosition).not.toBe(firstPosition);
    await page.getByText('View groups and annotations').click();
    await page.getByLabel('Group name', { exact: true }).fill('Equipment');
    await page.getByLabel('Group concepts (comma separated)').fill('Device');
    await page.getByRole('button', { name: 'Add view group' }).click();
    await page.getByLabel('Note for selected concept').fill('Local note');
    await page.getByRole('button', { name: 'Add view note' }).click();
    await page.getByLabel('Graph viewpoint').selectOption('temporal');
    await page.getByLabel('Filter graph relationships').fill('window');
    await expect(page.getByRole('region', { name: 'Workspace status' })).toContainText('View changed locally');
    const views = page.getByRole('navigation', { name: 'Open diagram views' });
    await expect(views.getByRole('button', { name: 'other, local changes' })).toHaveAttribute('aria-current', 'page');
    page.once('dialog', dialog => dialog.dismiss());
    await views.getByRole('button', { name: 'Close other view' }).click();
    await expect(page.getByText('Device: Local note')).toBeVisible();
    await views.getByRole('button', { name: 'default', exact: true }).click();
    await expect(node).toHaveAttribute('style', firstPosition);
    await expect(page.getByRole('region', { name: 'Workspace status' })).not.toContainText('View changed locally');
    const remote = store.saveView({ workspaceId: workspace.id, viewId: 'other', actor: 'other modeller', operationId: 'other-view-change', expectedViewRevision: 0, definition: { root: 'Device', positions: {} } });
    await expect(page.locator('.studio-connection-settings')).toContainText(`last event cursor: ${remote.eventSequence}`, { timeout: 15000 });
    await expect(page.locator('.studio-workspace')).toBeEnabled();
    await views.getByRole('button', { name: 'other, local changes' }).click();
    await expect(page.getByRole('region', { name: 'Workspace status' })).toContainText('View changed locally');
    await expect(page.getByText('Equipment: Device')).toBeVisible();
    await expect(page.getByText('Device: Local note')).toBeVisible();
    await expect(page.getByLabel('Graph viewpoint')).toHaveValue('temporal');
    await expect(page.getByLabel('Filter graph relationships')).toHaveValue('window');
    await expect(page.getByRole('button', { name: 'Save shared view' })).toBeEnabled();
    await page.getByRole('button', { name: 'Save shared view' }).click();
    await expect(page.getByText(/Could not save view/)).toBeVisible();
    await expect(page.getByText('Device: Local note')).toBeVisible();
    expect(store.savedView(workspace.id, 'other').viewRevision).toBe(1);
    expect(await page.evaluate(() => { const event = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(event); return event.defaultPrevented; })).toBe(true);
    page.once('dialog', dialog => dialog.accept());
    await views.getByRole('button', { name: 'Close other view' }).click();
    await expect(views.getByRole('button', { name: 'Close other view' })).toHaveCount(0);
    await expect(views.getByRole('button', { name: 'default', exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(views.getByRole('button', { name: 'default', exact: true })).toBeFocused();
    expect(store.savedView(workspace.id, 'other').viewRevision).toBe(1);
    expect(await page.evaluate(id => sessionStorage.getItem(`chargeweave.canvas.v2.${id}.other`), workspace.id)).toBeNull();
    expect(await page.evaluate(() => { const event = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(event); return event.defaultPrevented; })).toBe(false);
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('viewpoint and filter changes are marked as unsaved presentation edits', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'View settings', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    const status = page.getByRole('region', { name: 'Workspace status' });
    await page.getByLabel('Filter graph relationships').fill('window');
    await expect(status).toContainText('View changed locally');
    await page.getByRole('button', { name: 'Save shared view' }).click();
    await expect(status).not.toContainText('View changed locally');
    await page.getByLabel('Graph viewpoint').selectOption('temporal');
    await expect(status).toContainText('View changed locally');
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('open views can be restored and closed without discarding changed views', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'View tabs', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    await page.getByLabel('View ID').fill('inspection');
    await page.getByRole('button', { name: 'Choose view ID' }).click();
    const views = page.getByRole('navigation', { name: 'Open diagram views' });
    await expect(views.getByRole('button', { name: 'inspection', exact: true })).toHaveAttribute('aria-current', 'page');
    await page.reload();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram' }).click();
    await expect(views.getByRole('button', { name: 'inspection', exact: true })).toBeVisible();
    await views.getByRole('button', { name: 'inspection', exact: true }).click();
    await views.getByRole('button', { name: 'Close inspection view' }).click();
    await expect(views.getByRole('button', { name: 'inspection', exact: true })).toHaveCount(0);
    await expect(views.getByRole('button', { name: 'default', exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(views.getByRole('button', { name: 'default', exact: true })).toBeFocused();
    await page.reload();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram' }).click();
    await expect(views.getByRole('button', { name: 'inspection', exact: true })).toHaveCount(0);
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

test('unapplied concept input requests a browser warning before leaving', async ({ page, isMobile }) => {
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
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 0');
    expect(await warningRequested()).toBe(false);
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram' }).click();
    await page.getByRole('button', { name: 'Create a concept' }).click();
    await expect(page.getByLabel('Class name')).toBeFocused();
    await page.getByLabel('Class name').fill('UnfinishedConcept');
    expect(await warningRequested()).toBe(true);
    await page.getByLabel('Class name').fill('');
    expect(await warningRequested()).toBe(false);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('disconnecting warns about an unfinished concept', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Unfinished concept', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram' }).click();
    await page.getByText('Add a concept', { exact: true }).click();
    await page.getByLabel('Class name').fill('UnfinishedConcept');
    await page.getByRole('button', { name: 'Disconnect', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Unapplied edits' })).toBeVisible();
    await page.getByRole('button', { name: 'Stay and keep editing' }).click();
    await expect(page.getByLabel('Class name')).toHaveValue('UnfinishedConcept');
    await page.getByRole('button', { name: 'Disconnect', exact: true }).click();
    await page.getByRole('button', { name: 'Discard and disconnect' }).click();
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('Disconnected');
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('unfinished field creation is retained or discarded explicitly on navigation', async ({ page, isMobile }) => {
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
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await page.getByText('Add a field or relationship', { exact: true }).click();
    await page.getByLabel('Field name').fill('draftField');
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Model' }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Unapplied edits' })).toBeVisible();
    await page.getByRole('button', { name: 'Stay and keep editing' }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await expect(page.getByLabel('Field name')).toHaveValue('draftField');
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Model' }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    await page.getByRole('button', { name: 'Discard and open Device' }).click();
    await expect(page.getByRole('heading', { name: 'Device', exact: true })).toBeVisible();
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('inspector finds direct incoming references and navigates to their source', async ({ page, isMobile }) => {
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
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await page.getByText('Referenced by', { exact: true }).click();
    await page.getByRole('button', { name: 'Find references' }).click();
    await expect(page.getByText('Showing 2 of 2 references.')).toBeVisible();
    await expect(page.locator('#studio-inspector-pane').getByText(/Station.*device/)).toBeVisible();
    await page.getByRole('button', { name: 'Inspect Station' }).first().click();
    if (isMobile) {
      await expect(page.getByRole('region', { name: 'Relationships for Station' })).toBeVisible();
      await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    }
    await expect(page.getByRole('heading', { name: 'Station', exact: true })).toBeVisible();
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('concept creation offers existing modules and validates its definition', async ({ page, isMobile }) => {
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
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram' }).click();
    await page.getByRole('button', { name: 'Create a concept' }).click();
    await expect(page.getByLabel('Class name')).toBeFocused();
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
    let releaseCommand, interceptedCommand;
    const commandGate = new Promise(resolve => { releaseCommand = resolve; });
    const commandIntercepted = new Promise(resolve => { interceptedCommand = resolve; });
    const delayCommand = async route => {
      if (route.request().postDataJSON()?.params?.name === 'ontology_changeset_apply') { interceptedCommand(); await commandGate; }
      await route.continue();
    };
    await page.route('**/mcp', delayCommand);
    try {
      await page.getByRole('button', { name: 'Add concept', exact: true }).click();
      await commandIntercepted;
      await expect(page.getByRole('button', { name: 'Add concept', exact: true })).toBeDisabled();
      await expect(page.getByLabel('Class name')).toBeDisabled();
      await expect(page.getByLabel('Class definition')).toBeDisabled();
      await expect(page.getByLabel('Reason for next edit (optional)')).toBeDisabled();
      await expect(page.getByText('Saving model change…')).toBeVisible();
      await expect(page.getByLabel('Current workspace')).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Disconnect' })).toBeDisabled();
      if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Model' }).click();
      await page.getByRole('list', { name: 'Loaded concepts by module' }).getByRole('button', { name: 'Asset001', exact: true }).click();
      await expect(page.getByRole('alert')).toContainText('Wait for the model change to finish before selecting another concept.');
      expect(await page.evaluate(() => { const event = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(event); return event.defaultPrevented; })).toBe(true);
      releaseCommand();
      await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 1');
      if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram' }).click();
    } finally { releaseCommand(); await page.unroute('**/mcp', delayCommand); }
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 1');
    expect(store.search(workspace.id, 'ServiceWindow').results[0]).toMatchObject({ module: 'assets', parent: 'ZDevice' });
    await expect(page.getByRole('region', { name: 'Relationships for ServiceWindow' })).toBeVisible();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await expect(page.getByRole('heading', { name: 'ServiceWindow', exact: true })).toBeVisible();
    await expect(page.locator('#studio-field-type-suggestions option[value="Asset059"]')).toHaveCount(0);
    await page.getByText('Add a field or relationship', { exact: true }).click();
    await page.getByLabel('Datatype or target class', { exact: true }).fill('Asset059');
    await expect(page.locator('#studio-field-type-suggestions option[value="Asset059"]')).toHaveAttribute('label', 'Concept');
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

test('a remote field change blocks a stale inspector edit while preserving input', async ({ page, isMobile }) => {
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
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
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

test('a partially edited field is retained until navigation is confirmed', async ({ page, isMobile }) => {
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
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await page.getByRole('button', { name: 'Edit recordName' }).click();
    await page.getByLabel('New cardinality').selectOption('!');
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Model' }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Unapplied edits' })).toBeVisible();
    await page.getByRole('button', { name: 'Stay and keep editing' }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await expect(page.getByLabel('New cardinality')).toHaveValue('!');
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Model' }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    await page.getByRole('button', { name: 'Discard and open Device' }).click();
    await expect(page.getByRole('heading', { name: 'Device', exact: true })).toBeVisible();
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('switching concepts preserves an unapplied definition until the modeller decides', async ({ page, isMobile }) => {
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
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    const definition = page.getByRole('textbox', { name: 'Definition', exact: true });
    await definition.fill('An unsaved definition.');
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Model' }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Unapplied edits' })).toBeVisible();
    await page.getByRole('button', { name: 'Stay and keep editing' }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await expect(definition).toHaveValue('An unsaved definition.');
    await page.getByRole('button', { name: 'Disconnect', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Discard and disconnect' })).toBeVisible();
    await page.getByRole('button', { name: 'Stay and keep editing' }).click();
    await expect(definition).toHaveValue('An unsaved definition.');
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Model' }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    await page.getByRole('button', { name: 'Discard and open Device' }).click();
    await expect(page.getByRole('heading', { name: 'Device', exact: true })).toBeVisible();
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('command palette supports keyboard search, execution and dismissal', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Commands', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    const trigger = page.getByRole('button', { name: 'Commands', exact: true });
    await trigger.focus();
    await page.keyboard.press('Control+Shift+P');
    const palette = page.getByRole('dialog', { name: 'Commands' });
    const input = palette.getByRole('combobox', { name: 'Find a command' });
    await expect(input).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(palette.getByRole('option', { name: 'Add a concept' })).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowUp');
    await input.fill('search');
    await expect(palette.getByRole('option', { name: 'Search model' })).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Enter');
    await expect(palette).toHaveCount(0);
    await expect(page.getByLabel('Search model')).toBeFocused();
    await trigger.click();
    await palette.getByRole('combobox').fill('no such command');
    await expect(palette.getByText('No matching commands.')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('desktop workbench keeps the main panels within the initial viewport', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Compact screens use stacked navigation.');
  await page.setViewportSize({ width: 1440, height: 900 });
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Workbench', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await expect(page.locator('.studio-app-bar').getByLabel('Current workspace')).toBeVisible();
    await expect(page.locator('#studio-editor-pane')).toBeVisible();
    await expect(page.getByRole('region', { name: 'Workspace status' })).toBeVisible();
    const bounds = await page.evaluate(() => ({ scrollY: window.scrollY, header: document.querySelector('.studio-app-bar').getBoundingClientRect().toJSON(), panel: document.querySelector('#studio-editor-pane').getBoundingClientRect().toJSON(), status: document.querySelector('.studio-status-bar').getBoundingClientRect().toJSON() }));
    expect(bounds.scrollY).toBe(0);
    expect(bounds.header.top).toBeGreaterThanOrEqual(0);
    expect(bounds.panel.height).toBeGreaterThan(400);
    expect(bounds.panel.bottom).toBeLessThanOrEqual(bounds.status.top + 2);
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    const canvas = page.getByRole('region', { name: 'Relationships for Device' });
    await expect(canvas).toHaveAttribute('data-layout', 'ready');
    await expect(page.getByLabel('Graph viewpoint')).toBeInViewport();
    await expect(page.getByLabel('Filter graph relationships')).toBeInViewport();
    const canvasBounds = await canvas.boundingBox();
    expect(canvasBounds.y + canvasBounds.height).toBeLessThanOrEqual(bounds.panel.bottom + 2);
    const results = page.getByRole('region', { name: 'Workspace results' });
    await results.getByRole('button', { name: 'Checks', exact: true }).click();
    await expect(results.getByRole('region', { name: 'Validation issues' })).toBeVisible();
    const expanded = await page.evaluate(() => ({ panel: document.querySelector('#studio-editor-pane').getBoundingClientRect().toJSON(), dock: document.querySelector('.studio-bottom-dock').getBoundingClientRect().toJSON(), status: document.querySelector('.studio-status-bar').getBoundingClientRect().toJSON() }));
    expect(expanded.panel.height).toBeLessThan(bounds.panel.height);
    expect(expanded.dock.bottom).toBeLessThanOrEqual(expanded.status.top + 2);
    const splitter = results.getByRole('separator', { name: 'Resize results panel' });
    await expect(splitter).toHaveAttribute('aria-valuenow', '184');
    await splitter.focus(); await page.keyboard.press('ArrowUp');
    await expect(splitter).toHaveAttribute('aria-valuenow', '200');
    const handle = await splitter.boundingBox();
    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
    await page.mouse.down(); await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2 + 20, { steps: 4 }); await page.mouse.up();
    await expect(splitter).toHaveAttribute('aria-valuenow', '180');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('chargeweave.studio.results-height.v1'))).toBe('180');
    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(splitter).toHaveAttribute('aria-valuenow', '176');
    await page.evaluate(() => window.scrollTo(0, 0));
    const compact = await page.evaluate(() => ({ dock: document.querySelector('.studio-bottom-dock').getBoundingClientRect().toJSON(), status: document.querySelector('.studio-status-bar').getBoundingClientRect().toJSON() }));
    expect(compact.dock.bottom).toBeLessThanOrEqual(compact.status.top + 2);
    await expect.poll(() => page.evaluate(() => localStorage.getItem('chargeweave.studio.results-height.v1'))).toBe('176');
    await page.setViewportSize({ width: 920, height: 768 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(splitter).toHaveAttribute('aria-valuenow', '160');
    const narrower = await page.evaluate(() => ({ dock: document.querySelector('.studio-bottom-dock').getBoundingClientRect().toJSON(), status: document.querySelector('.studio-status-bar').getBoundingClientRect().toJSON() }));
    expect(narrower.dock.bottom).toBeLessThanOrEqual(narrower.status.top + 2);
    await page.setViewportSize({ width: 901, height: 768 });
    await page.evaluate(() => window.scrollTo(0, 0));
    const breakpoint = await page.evaluate(() => ({ dock: document.querySelector('.studio-bottom-dock').getBoundingClientRect().toJSON(), status: document.querySelector('.studio-status-bar').getBoundingClientRect().toJSON() }));
    expect(breakpoint.dock.bottom).toBeLessThanOrEqual(breakpoint.status.top + 2);
    await expect.poll(() => page.evaluate(() => localStorage.getItem('chargeweave.studio.results-height.v1'))).toBe('160');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.reload();
    await results.getByRole('button', { name: 'Checks', exact: true }).click();
    await expect(results.getByRole('separator', { name: 'Resize results panel' })).toHaveAttribute('aria-valuenow', '160');
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
    await page.reload();
    await expect(page.getByRole('button', { name: 'Show navigator' })).toBeVisible();
    await expect(page.locator('#studio-navigator-pane')).toBeHidden();
    await page.getByRole('button', { name: 'Show navigator' }).click();
    await page.locator('summary').filter({ hasText: 'Panel sizes' }).click();
    await page.getByRole('button', { name: 'Reset panel sizes' }).click();
    await expect(page.getByLabel('Navigator width')).toHaveValue('240');
    await page.getByRole('button', { name: 'Hide navigator' }).click();
    await page.getByRole('navigation', { name: 'Results panels' }).getByRole('button', { name: 'Checks', exact: true }).click();
    const resultsSplitter = page.getByRole('separator', { name: 'Resize results panel' });
    await resultsSplitter.focus(); await page.keyboard.press('End');
    await expect(resultsSplitter).not.toHaveAttribute('aria-valuenow', '184');
    await page.getByRole('button', { name: 'Reset layout' }).click();
    await expect(page.locator('#studio-navigator-pane')).toBeVisible();
    await expect(resultsSplitter).toHaveAttribute('aria-valuenow', '184');
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('advanced connection identifies an invalid workspace ID without treating the token as a UUID', async ({ page, isMobile }) => {
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
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 0');
    await page.getByRole('navigation', { name: 'Workspace destinations' }).getByRole('link', { name: 'Review' }).click();
    const workflow = page.getByRole('region', { name: 'Review workflow' });
    await expect(workflow).toContainText('Reviewer access is required to record a decision.');
    await workflow.getByRole('button', { name: 'Go to reviewer decision' }).click();
    await expect(page.getByRole('heading', { name: 'Reviewer decision' })).toBeFocused();
    await expect(page.getByText('Reviewer decisions are unavailable for this connection. Connect with reviewer access.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Record reviewer decision' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Save reviewer case' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Inspect review gates' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Check publication target' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Check required status checks' })).toBeDisabled();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Model' }).click();
    await expect(page.getByRole('button', { name: 'Search', exact: true })).toBeEnabled();
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('a remote definition edit preserves local input and requires conflict review', async ({ page, isMobile }) => {
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
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    const input = page.getByRole('textbox', { name: 'Definition', exact: true });
    await input.fill('My unsaved definition.');
    store.apply({ workspaceId: workspace.id, actor: 'other-client', operationId: 'remote-definition', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Record', definition: 'A different remote definition.' }] });
    await expect(page.getByRole('alert').filter({ hasText: 'changed in another client' })).toBeVisible();
    await expect(input).toHaveValue('My unsaved definition.');
    await expect(page.getByRole('button', { name: 'Save definition' })).toBeDisabled();
    await expect(page.getByText('Latest: A different remote definition.')).toBeVisible();
    await page.getByRole('button', { name: 'Keep my text' }).click();
    await page.getByRole('button', { name: 'Save definition' }).click();
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 2');
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
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 0');
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

test('navigator browses beyond the first page without searching', async ({ page, isMobile }) => {
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
    let releasePage, interceptedPage;
    const pageGate = new Promise(resolve => { releasePage = resolve; });
    const pageIntercepted = new Promise(resolve => { interceptedPage = resolve; });
    const delayPage = async route => {
      const params = route.request().postDataJSON()?.params;
      if (params?.name === 'ontology_explorer_list' && params.arguments?.cursor) { interceptedPage(); await pageGate; }
      await route.continue();
    };
    await page.route('**/mcp', delayPage);
    try {
      await page.getByRole('button', { name: 'Load more concepts' }).click();
      await pageIntercepted;
      await expect(page.getByRole('button', { name: 'Load more concepts' })).toBeDisabled();
      await expect(page.getByText('Loading concepts…')).toBeVisible();
      releasePage();
      await expect(page.getByText('Showing 57 of 57 concepts.')).toBeVisible();
    } finally { releasePage(); await page.unroute('**/mcp', delayPage); }
    await expect(page.getByText('Showing 57 of 57 concepts.')).toBeVisible();
    await page.getByRole('button', { name: 'Thing054', exact: true }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await expect(page.getByRole('heading', { name: 'Thing054', exact: true })).toBeVisible();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Model' }).click();
    await page.getByLabel('Filter by module').selectOption('operations');
    await expect(page.getByText('Showing 1 of 1 concepts.')).toBeVisible();
    store.apply({ workspaceId: workspace.id, actor: 'other-client', operationId: 'update-filtered-module', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Station', definition: 'Updated station.' }] });
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 1');
    await expect(page.getByLabel('Filter by module')).toHaveValue('operations');
    await expect(page.getByText('Showing 1 of 1 concepts.')).toBeVisible();
    await page.getByRole('button', { name: 'Station', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Station', exact: true })).toBeVisible();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram' }).click();
    await expect(page.getByRole('region', { name: 'Relationships for Thing054' })).toBeVisible();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await page.getByRole('button', { name: 'Focus neighbourhood' }).click();
    await expect(page.getByRole('region', { name: 'Relationships for Station' })).toBeVisible();
    await page.getByText('Diagram legend').click();
    await expect(page.locator('.studio-diagram-legend dd', { hasText: 'Optional, at most one' })).toBeVisible();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Model' }).click();
    await expect(page.getByRole('list', { name: 'Loaded concepts by module' }).getByRole('button', { name: 'Station', exact: true })).toHaveAttribute('aria-current', 'true');
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram' }).click();
    await page.getByRole('button', { name: 'Previous view' }).click();
    await expect(page.getByRole('region', { name: 'Relationships for Thing054' })).toBeVisible();
    if (!isMobile) await expect(page.getByRole('heading', { name: 'Station', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Next view' }).click();
    await expect(page.getByRole('region', { name: 'Relationships for Station' })).toBeVisible();
    await page.getByRole('button', { name: 'Previous view' }).click();
    await expect(page.getByRole('region', { name: 'Relationships for Thing054' })).toBeVisible();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Model' }).click();
    await page.getByRole('list', { name: 'Loaded concepts by module' }).getByRole('button', { name: 'Station', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('region', { name: 'Relationships for Station' })).toBeVisible();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Model' }).click();
    await page.getByLabel('Search model').fill('Record');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    const result = page.locator('#studio-navigator-pane').getByRole('button', { name: 'Record', exact: true });
    await result.click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Model' }).click();
    await expect(result).toHaveAttribute('aria-current', 'true');
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram' }).click();
    await expect(page.getByRole('region', { name: 'Relationships for Station' })).toBeVisible();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Model' }).click();
    await result.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('region', { name: 'Relationships for Record' })).toBeVisible();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Model' }).click();
    await page.getByLabel('Search model').fill('Thing');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('25 matching concepts shown.')).toBeVisible();
    await expect(page.getByText(/Search shows up to 25 matches/)).toBeVisible();
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('two studio tabs share edits while keeping independent selections', async ({ page, context, isMobile }) => {
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
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 0');
    second = await context.newPage(); await second.goto(url); await expect(second.getByRole('status')).toContainText('revision 0');
    for (const [tab, name] of [[page, 'Record'], [second, 'Device']]) {
      await tab.getByLabel('Search model').fill(name); await tab.getByRole('button', { name: 'Search', exact: true }).click();
      await tab.getByRole('button', { name, exact: true }).click();
      if (isMobile) await tab.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
      await expect(tab.getByRole('heading', { name, exact: true })).toBeVisible();
    }
    await page.getByRole('textbox', { name: 'Definition', exact: true }).fill('A record edited in the first tab.');
    await page.getByRole('button', { name: 'Save definition' }).click();
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 1');
    await expect(second.getByRole('status')).toContainText('revision 1');
    await expect(second.getByRole('heading', { name: 'Device', exact: true })).toBeVisible();
    expect(store.get(workspace.id).revision).toBe(1);
  } finally { if (second) await second.close(); await page.close(); await service.shutdown(); store.close(); }
});

test('reviewer creates and switches between workspaces', async ({ page, isMobile }) => {
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
    await expect(page.getByLabel('New workspace title')).toBeHidden();
    await expect(page.locator('.studio-app-bar').getByLabel('Current workspace')).toBeVisible();
    await page.getByRole('button', { name: 'Show fields for Record' }).click();
    await expect(page.getByRole('button', { name: 'Hide fields for Record' })).toHaveAttribute('aria-expanded', 'true');
    await page.getByRole('button', { name: 'Record', exact: true }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
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
    await expect(page.locator('.studio-app-bar').getByLabel('Current workspace').locator('option:checked')).toHaveText('Original');
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Model' }).click();
    await expect(page.getByRole('button', { name: 'Show fields for Record' })).toBeVisible();
    await page.getByLabel('Current workspace').selectOption({ label: 'New proposal' });
    await expect(page.getByRole('button', { name: 'Hide fields for Record' })).toBeVisible();
  } finally { await page.close(); if (service) await service.shutdown(); if (store) store.close(); rmSync(repo, { recursive: true, force: true }); }
});

test('browser authors an interval rule with draft cases and source patches', async ({ page, isMobile }) => {
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
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Results' }).click();
    await page.getByLabel('Search requirements').fill('BR-012');
    await page.getByRole('button', { name: 'Search requirements', exact: true }).click();
    await page.getByText('Add interval rule for BR-012').click();
    await page.getByLabel('Interval start').selectOption('maintenanceStartsAt');
    await page.getByLabel('Interval end').selectOption('maintenanceEndsAt');
    await page.getByLabel('New rule ID').fill('B900');
    expect(await page.evaluate(() => { const event = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(event); return event.defaultPrevented; })).toBe(true);
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Model' }).click();
    await page.getByLabel('Search model').fill('Record');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.locator('#studio-navigator-pane').getByRole('button', { name: 'Record', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Unapplied edits' })).toBeVisible();
    await page.getByRole('button', { name: 'Stay and keep editing' }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Results' }).click();
    await expect(page.getByLabel('New rule ID')).toHaveValue('B900');
    let releaseRule, interceptedRule;
    const ruleGate = new Promise(resolve => { releaseRule = resolve; });
    const ruleIntercepted = new Promise(resolve => { interceptedRule = resolve; });
    const delayRule = async route => {
      if (route.request().postDataJSON()?.params?.name === 'ontology_changeset_apply') { interceptedRule(); await ruleGate; }
      await route.continue();
    };
    await page.route('**/mcp', delayRule);
    try {
      await page.getByRole('button', { name: 'Add interval constraint' }).click();
      await ruleIntercepted;
      await expect(page.getByLabel('New rule ID')).toBeDisabled();
      await expect(page.getByLabel('Interval start')).toBeDisabled();
      releaseRule();
      await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 2');
    } finally { releaseRule(); await page.unroute('**/mcp', delayRule); }
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 2');
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram' }).click();
    await page.getByRole('button', { name: 'Inspect changes' }).click();
    await expect(page.getByText('Source patch: model/audit-rules.json')).toBeVisible();
    await expect(page.getByText('Source patch: tests/negative-cases.json')).toBeVisible();
    await expect(page.getByText('Source patch: tests/business-acceptance.json')).toBeVisible();
    expect(JSON.parse(store.get(workspace.id).sourceOverlays['tests/business-acceptance.json']).filter(item => item.rule === 'B900').every(item => item.provenance === 'template-derived')).toBe(true);
    await page.getByRole('navigation', { name: 'Workspace destinations' }).getByRole('link', { name: 'Review' }).click();
    await page.getByLabel('Requirement ID', { exact: true }).fill('BR-012');
    await page.getByLabel('Rule ID', { exact: true }).fill('B900');
    await page.getByLabel('Unique case ID').fill('BR-012-B900-REVIEW-PASS');
    await page.getByLabel('Start (UTC, YYYY-MM-DDTHH:MM:SSZ)').fill('2026-10-01T10:00:00Z');
    await page.getByLabel('End (UTC, YYYY-MM-DDTHH:MM:SSZ)').fill('2026-10-01T12:00:00Z');
    await page.getByLabel('Business scenario and expected result').fill('A maintenance window ending later is accepted.');
    await page.getByRole('button', { name: 'Save reviewer case' }).click();
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 3');
    expect(JSON.parse(store.get(workspace.id).sourceOverlays['tests/business-acceptance.json']).find(item => item.id === 'BR-012-B900-REVIEW-PASS').provenance).toBe('independent');
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('reviewer can inspect a publication target without publishing', async ({ page, isMobile }) => {
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
    await page.getByRole('navigation', { name: 'Workspace destinations' }).getByRole('link', { name: 'Review' }).click();
    await page.getByRole('button', { name: 'Check publication target' }).click();
    await expect(page.getByText(/local-test-remote · main · matches-baseline/)).toBeVisible();
    await expect(page.getByRole('region', { name: 'Review workflow' })).toContainText('Target main: matches-baseline');
    await expect(page.getByText(/Preflight alone does not authorize publication/)).toBeVisible();
    await page.getByRole('button', { name: 'Inspect publication history' }).click();
    await expect(page.getByText(/Publisher permission: not enabled/)).toBeVisible();
    await page.getByLabel('Commit SHA').fill(commit);
    await page.getByRole('button', { name: 'Check commit workflows' }).click();
    await expect(page.getByRole('link', { name: 'Synthetic check' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Review workflow' })).toContainText(`Commit ${commit}: passed`);
    await expect(page.getByText(/branch-protection requirements and deployment are not checked/)).toBeVisible();
    await page.getByRole('button', { name: 'Check required status checks' }).click();
    await expect(page.getByText('Synthetic required: passed')).toBeVisible();
    let releaseChecks, workflowsObserved, requiredObserved;
    const checksGate = new Promise(resolve => { releaseChecks = resolve; });
    const workflowsStarted = new Promise(resolve => { workflowsObserved = resolve; });
    const requiredStarted = new Promise(resolve => { requiredObserved = resolve; });
    const delayChecks = async route => {
      const name = route.request().postDataJSON()?.params?.name;
      if (name === 'ontology_github_commit_workflows' || name === 'ontology_github_required_checks') {
        if (name === 'ontology_github_commit_workflows') workflowsObserved(); else requiredObserved();
        await checksGate;
      }
      await route.continue().catch(() => {});
    };
    await page.route('**/mcp', delayChecks);
    try {
      await page.getByRole('button', { name: 'Check commit workflows' }).click();
      await workflowsStarted;
      await page.getByRole('button', { name: 'Check required status checks' }).click();
      await requiredStarted;
      await page.getByLabel('Commit SHA').fill('b'.repeat(40));
      await expect(page.getByRole('link', { name: 'Synthetic check' })).toHaveCount(0);
      await expect(page.getByText('Synthetic required: passed')).toHaveCount(0);
      const finishedWorkflows = page.waitForResponse(response => response.url().endsWith('/mcp') && response.request().postDataJSON()?.params?.name === 'ontology_github_commit_workflows');
      const finishedRequired = page.waitForResponse(response => response.url().endsWith('/mcp') && response.request().postDataJSON()?.params?.name === 'ontology_github_required_checks');
      releaseChecks();
      await Promise.all([finishedWorkflows, finishedRequired]);
      await expect(page.getByRole('link', { name: 'Synthetic check' })).toHaveCount(0);
      await expect(page.getByText('Synthetic required: passed')).toHaveCount(0);
      await expect(page.getByRole('region', { name: 'Review workflow' })).toContainText('Commit checks not inspected');
    } finally { releaseChecks(); await page.unroute('**/mcp', delayChecks); }
    expect(git(repository, ['rev-parse', 'HEAD'])).toBe(commit);
  } finally { await page.close(); if (service) await service.shutdown(); store?.close(); rmSync(directory, { recursive: true, force: true }); }
});

test('reviewer opens a simulated draft pull request for a recorded branch', async ({ page, isMobile }) => {
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
    await page.getByRole('navigation', { name: 'Workspace destinations' }).getByRole('link', { name: 'Review' }).click();
    await expect(page.getByText(/Publisher permission: not checked/)).toBeVisible();
    await page.getByRole('button', { name: 'Inspect publication history' }).click();
    await expect(page.getByText(/Publisher permission: enabled/)).toBeVisible();
    await page.getByRole('button', { name: 'Create draft pull request' }).click();
    await expect(page.getByRole('link', { name: 'Pull request #77' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Pull request #77' })).toHaveAttribute('href', 'https://github.com/pli-poc/charge-weave/pull/77');
    expect(store.publication(workspace.id, intent.id).state).toBe('pr_created');
    await page.getByRole('button', { name: 'Disconnect', exact: true }).click();
    await page.getByText('Advanced connection with workspace ID and token').click();
    await page.getByLabel('Workspace ID').fill(workspace.id);
    await page.getByLabel('Draft token').fill('test-token-'.repeat(4));
    await page.getByRole('button', { name: 'Connect', exact: true }).click();
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 1');
    await page.getByRole('navigation', { name: 'Workspace destinations' }).getByRole('link', { name: 'Review' }).click();
    await expect(page.getByText(/Publisher permission: unavailable for this connection/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Inspect publication history' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Create draft pull request' })).toHaveCount(0);
  } finally { await page.close(); if (service) await service.shutdown(); store?.close(); rmSync(directory, { recursive: true, force: true }); }
});

test('browser updates a field with a visible compatibility warning', async ({ page, isMobile }) => {
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
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await page.getByLabel('Filter fields').fill('peer');
    await expect(page.getByText('Showing 1 of 2 fields.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit recordName' })).toHaveCount(0);
    await page.getByLabel('Filter fields').clear();
    await page.getByLabel('Sort fields').selectOption('name');
    await expect(page.locator('.studio-field-table tbody tr').first()).toContainText('peer');
    await page.getByRole('button', { name: 'Edit recordName' }).click();
    await expect(page.locator('.studio-panels').getByRole('heading', { name: 'Edit field contract' })).toBeVisible();
    await expect(page.getByLabel('New datatype or target class')).toBeFocused();
    await expect(page.locator('#studio-field-type-suggestions option[value="dateTime"]')).toHaveAttribute('label', 'Datatype');
    await expect(page.locator('#studio-field-type-suggestions option[value="Record"]')).toHaveAttribute('label', 'Concept');
    await page.getByText('Add a field or relationship', { exact: true }).click();
    const typeRequest = page.waitForRequest(request => request.postDataJSON()?.params?.name === 'ontology_context_search' && request.postDataJSON()?.params?.arguments?.query === 'Device');
    await page.getByLabel('Datatype or target class', { exact: true }).fill('Device');
    await typeRequest;
    await page.getByLabel('Datatype or target class', { exact: true }).fill('string');
    await page.getByRole('button', { name: 'Cancel field edit' }).click();
    await expect(page.getByRole('button', { name: 'Edit recordName' })).toBeFocused();
    await page.getByRole('button', { name: 'Edit recordName' }).click();
    await page.getByLabel('New cardinality').selectOption('!');
    await page.getByRole('button', { name: 'Update field contract' }).click();
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 1');
    await expect(page.getByRole('row').filter({ has: page.getByRole('rowheader', { name: /recordName/ }) })).toContainText('Exactly one (1)');
    expect(store.get(workspace.id).schema).toContain('recordName:string!');
    await page.getByRole('button', { name: 'Review draft changes' }).click();
    await page.getByRole('region', { name: 'Review workflow' }).getByRole('button', { name: 'Open draft changes' }).click();
    await expect(page.getByRole('heading', { name: 'Changes at revision 1' })).toBeFocused();
    await expect(page.getByText(/recordName: potentially-breaking/)).toBeVisible();
    await expect(page.getByText(/existing data or consumers may need migration/)).toBeVisible();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await page.getByRole('button', { name: 'Require peer' }).click();
    await page.getByRole('button', { name: 'Confirm required relationship' }).click();
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 2');
    expect(store.get(workspace.id).schema).toContain('peer:Record!');
    store.suggestView(workspace.id, { actor: 'codex', operationId: 'suggest-device', expectedRevision: 2, root: 'Device', viewpoint: 'information', explanation: 'Inspect the device.' });
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Results' }).click();
    await expect(page.getByText('Inspect the device.')).toBeVisible();
    await page.getByRole('button', { name: 'Focus Device' }).click();
    if (isMobile) {
      await expect(page.getByRole('region', { name: 'Relationships for Device' })).toBeVisible();
      await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    }
    await expect(page.getByRole('heading', { name: 'Device', exact: true })).toBeVisible();
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('draft comparison groups added and changed concepts with before and after', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Change review', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|Original record.|\n' });
  store.apply({ workspaceId: workspace.id, actor: 'test', operationId: 'reviewed-changes', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Record', definition: 'Updated record.' }, { type: 'class.add', name: 'Device', module: 'foundation', parent: 'Record', definition: 'A new device.' }] });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    const diagram = page.getByRole('region', { name: 'Relationships for Device' });
    await expect(diagram).toHaveAttribute('data-layout', 'ready');
    const node = diagram.locator('.react-flow__node[data-id="Device"]');
    const position = await node.getAttribute('style');
    await page.getByRole('button', { name: 'Review draft changes' }).click();
    await page.getByRole('region', { name: 'Review workflow' }).getByRole('button', { name: 'Open draft changes' }).click();
    await expect(page.getByRole('heading', { name: 'Changes at revision 1' })).toBeFocused();
    await expect(page.getByText('1 added · 1 changed · 0 removed · 0 additional source files changed')).toBeVisible();
    const added = page.getByRole('region', { name: 'Added concepts' });
    const changed = page.getByRole('region', { name: 'Changed concepts' });
    await expect(added).toContainText('added: Device');
    await expect(added).toContainText('After: A new device.');
    await expect(changed).toContainText('Before: Original record.');
    await expect(changed).toContainText('After: Updated record.');
    await page.getByText('Comparison identity', { exact: true }).click();
    await expect(page.getByText('Baseline commit:', { exact: false })).toContainText('a'.repeat(40));
    await expect(page.getByText('Source patch', { exact: true })).toBeVisible();
    if (isMobile) expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const documents = page.getByRole('navigation', { name: 'Editor documents' });
    await expect(diagram).toBeHidden();
    await documents.getByRole('button', { name: 'Diagram view' }).click();
    await expect(diagram).toBeVisible();
    await expect(node).toHaveAttribute('style', position);
    await documents.getByRole('button', { name: 'Changes', exact: true }).click();
    store.apply({ workspaceId: workspace.id, actor: 'other-client', operationId: 'newer-review', expectedRevision: 1, commands: [{ type: 'class.describe', name: 'Record', definition: 'Later record.' }] });
    await expect(page.getByRole('region', { name: 'Workspace status' })).toContainText('Revision 2');
    await expect(page.getByText('This comparison is out of date for the current draft.', { exact: false })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Focus changed Record' })).toBeDisabled();
    await page.getByRole('button', { name: 'Refresh comparison' }).click();
    await expect(page.getByRole('heading', { name: 'Changes at revision 2' })).toBeFocused();
    await expect(page.getByText('After: Later record.')).toBeVisible();
    expect(store.get(workspace.id).revision).toBe(2);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('concept context can be previewed and copied for the current draft', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Context', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const job = store.createJob(workspace.id, 0, workspace.sourceDigest, 'tester', 'context-check', 'structural').job;
  store.startJobStep(job.id, 0, 'synthetic-check');
  store.finishJobStep(job.id, 0, 'failed', 'private recorded output');
  store.updateJob(job.id, 'failed');
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const token = 'test-token-'.repeat(4);
  const service = createHttpService({ store, token, pairingCode, workspaceId: workspace.id, repository: '.', staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.copiedContext = text; } } }));
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await expect(page.getByText(/Latest structural operation: failed/)).toBeVisible();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Model' }).click();
    await page.getByLabel('Search model').fill('Record');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Record', exact: true }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await page.getByText('Prepare context for Codex').click();
    const preview = page.getByLabel('Context preview');
    await expect(preview).toHaveValue(/Selected concept: Record/);
    await expect(preview).toHaveValue(/revision: 0/);
    await expect(preview).toHaveValue(/synthetic-check/);
    await page.getByRole('button', { name: 'Copy context' }).click();
    const copied = await page.evaluate(() => window.copiedContext);
    expect(copied).toContain(workspace.id);
    expect(copied).not.toContain(token);
    expect(copied).not.toContain(pairingCode);
    expect(copied).not.toContain('private recorded output');
    store.apply({ workspaceId: workspace.id, actor: 'other-client', operationId: 'context-update', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Record', definition: 'A revised record.' }] });
    await expect(preview).toHaveValue(/revision: 1/);
    await expect(preview).toHaveValue(/A revised record/);
    await expect(preview).toHaveValue(/out of date for current draft/);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('inspector pages through explicit linked requirements', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const schema = 'MODULE|foundation\nRecord|root|A record.|\n';
  const requirements = JSON.stringify(Array.from({ length: 51 }, (_, index) => ({ id: `BR-${String(index + 1).padStart(3, '0')}`, statement: `Requirement ${index + 1}`, classes: ['Record'] })));
  const hash = value => createHash('sha256').update(value).digest('hex');
  const manifest = [
    { path: 'model/domain.schema', sha256: hash(schema) },
    { path: 'requirements/business-requirements.json', sha256: hash(requirements) },
    { path: 'tools/authoring_adapter.py', sha256: hash(readFileSync(new URL('../../tools/authoring_adapter.py', import.meta.url))) },
    { path: 'tools/domain_schema.py', sha256: hash(readFileSync(new URL('../../tools/domain_schema.py', import.meta.url))) },
  ];
  const workspace = store.create({ title: 'Many requirements', baselineCommit: 'a'.repeat(40), schema, sourceManifest: manifest, sourceBlobs: { 'requirements/business-requirements.json': requirements } });
  const firstPage = store.requirementsSearch(workspace.id, '', 20, 0);
  expect(firstPage.total).toBe(51);
  expect(firstPage.nextOffset).toBe(20);
  expect(store.requirementsSearch(workspace.id, '', 20, 0, 20).results[0].id).toBe('BR-021');
  expect(() => store.requirementsSearch(workspace.id, '', 20, undefined, 20)).toThrow();
  expect(() => store.requirementsSearch(workspace.id, '', 20, 1, 20)).toThrow(/Revision conflict/);
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    const explorer = page.locator('details.studio-requirement-explorer');
    await explorer.getByText('Requirements', { exact: true }).click();
    await explorer.getByRole('button', { name: 'Find requirements' }).click();
    await expect(explorer).toContainText('Showing 20 of 51 matching requirements.');
    await explorer.getByRole('button', { name: 'Load more requirements' }).click();
    await expect(explorer).toContainText('Showing 40 of 51 matching requirements.');
    await explorer.getByRole('button', { name: 'Load more requirements' }).click();
    await expect(explorer).toContainText('Showing 51 of 51 matching requirements.');
    await expect(explorer.getByRole('button', { name: 'Load more requirements' })).toHaveCount(0);
    await page.getByLabel('Search model').fill('Record');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Record', exact: true }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await page.getByText('Linked requirements', { exact: true }).click();
    const links = page.locator('details.studio-requirement-links');
    await expect(links).toContainText('Showing 50 of 51 linked requirements.');
    await expect(links).not.toContainText('BR-051');
    await links.getByRole('button', { name: 'Load more requirements' }).click();
    await expect(links).toContainText('Showing 51 of 51 linked requirements.');
    await expect(links).toContainText('BR-051');
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('a running validation is restored and monitored after reload', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Restored checks', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const job = store.createJob(workspace.id, 0, workspace.sourceDigest, 'other-client', 'check', 'structural').job;
  store.updateJob(job.id, 'running');
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, repository: '.', staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await expect(page.getByText(/Latest structural operation: running/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Check draft', exact: true })).toBeDisabled();
    store.updateJob(job.id, 'passed');
    await expect(page.getByText(/Latest structural operation: passed/)).toBeVisible();
    await page.reload();
    await expect(page.getByText(/Latest structural operation: passed/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Check draft', exact: true })).toBeEnabled();
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('validation started by another client updates the connected studio', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Shared checks', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, repository: '.', eventPollMs: 100, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    const stream = page.waitForResponse(response => response.url().includes('/events?') && response.status() === 200);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await stream;
    const job = store.createJob(workspace.id, 0, workspace.sourceDigest, 'other-client', 'check', 'structural').job;
    store.updateJob(job.id, 'running');
    await expect(page.getByText(/Latest structural operation: running/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Check draft', exact: true })).toBeDisabled();
    store.updateJob(job.id, 'passed');
    await expect(page.getByText(/Latest structural operation: passed/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Check draft', exact: true })).toBeEnabled();
    const demo = store.createJob(workspace.id, 0, workspace.sourceDigest, 'other-client', 'demo', 'maintenance-demo').job;
    store.updateJob(demo.id, 'running');
    await expect(page.getByText(/Latest maintenance-demo operation: running/)).toBeVisible();
    store.updateJob(demo.id, 'passed');
    await expect(page.getByText(/Latest maintenance-demo operation: passed/)).toBeVisible();
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('an older validation restore cannot replace a newly started check', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Validation restore race', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const validationRunner = async (target, input, job) => { target.updateJob(job.id, 'passed'); };
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, repository: '.', validationRunner, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  let release, observed, finished;
  const gate = new Promise(resolve => { release = resolve; });
  const intercepted = new Promise(resolve => { observed = resolve; });
  const completed = new Promise(resolve => { finished = resolve; });
  const delay = async route => {
    if (route.request().postDataJSON()?.params?.name === 'ontology_validation_latest') {
      const response = await route.fetch(); observed(); await gate;
      await route.fulfill({ response }).catch(() => {}); finished();
    } else await route.continue();
  };
  await page.route('**/mcp', delay);
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await intercepted;
    await page.getByRole('button', { name: 'Check draft', exact: true }).click();
    await expect(page.getByText(/Latest structural operation: passed/)).toBeVisible();
    release(); await completed;
    await expect(page.getByText(/Latest structural operation: passed/)).toBeVisible();
  } finally { release(); await page.unroute('**/mcp', delay); await page.close(); await service.shutdown(); store.close(); }
});

test('check profile selects the scope sent to the shared service', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Check scope', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  let release, started;
  const gate = new Promise(resolve => { release = resolve; });
  const observed = new Promise(resolve => { started = resolve; });
  const validationRunner = async (target, input, job) => { started(job.profile); await gate; target.updateJob(job.id, 'passed'); };
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, repository: '.', validationRunner, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    const profile = page.getByLabel('Check profile');
    await expect(profile).toHaveValue('structural');
    await profile.selectOption('reference');
    await page.getByRole('button', { name: 'Check draft', exact: true }).click();
    expect(await observed).toBe('reference');
    await expect(profile).toBeDisabled();
    release();
    await expect(profile).toBeEnabled();
    await expect(page.getByText(/Latest reference operation: passed/)).toBeVisible();
  } finally { release(); await page.close(); await service.shutdown(); store.close(); }
});

test('review gate evidence is cleared when checks start and finish', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Check evidence', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  let release, started;
  const gate = new Promise(resolve => { release = resolve; });
  const running = new Promise(resolve => { started = resolve; });
  let releaseReadiness, observedReadiness;
  const readinessGate = new Promise(resolve => { releaseReadiness = resolve; });
  const readinessIntercepted = new Promise(resolve => { observedReadiness = resolve; });
  const delayReadiness = async route => {
    if (route.request().postDataJSON()?.params?.name === 'ontology_review_readiness') {
      const response = await route.fetch();
      observedReadiness(); await readinessGate;
      await route.fulfill({ response }).catch(() => {});
    } else await route.continue();
  };
  const validationRunner = async (target, input, job) => {
    target.startJobStep(job.id, 0, 'tools/example-check.py');
    started(); await gate;
    target.finishJobStep(job.id, 0, 'passed');
    target.updateJob(job.id, 'passed');
  };
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, repository: '.', validationRunner, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('navigation', { name: 'Workspace destinations' }).getByRole('link', { name: 'Review' }).click();
    const workflow = page.getByRole('region', { name: 'Review workflow' });
    await page.getByRole('button', { name: 'Inspect review gates' }).click();
    await expect(workflow).toContainText('Last inspection: review gates incomplete:');
    await page.getByRole('button', { name: 'Check draft', exact: true }).click();
    await running;
    await expect(workflow).toContainText('Review gates not inspected for this draft');
    await page.route('**/mcp', delayReadiness);
    await page.getByRole('button', { name: 'Inspect review gates' }).click();
    await readinessIntercepted;
    release();
    await expect(page.getByRole('button', { name: 'Check draft', exact: true })).toBeEnabled();
    releaseReadiness();
    await expect(page.getByRole('alert')).toContainText('Review evidence changed while gates were loading.');
    await expect(workflow).toContainText('Review gates not inspected for this draft');
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { release(); releaseReadiness(); await page.unroute('**/mcp', delayReadiness); await page.close(); await service.shutdown(); store.close(); }
});

test('checks from another client invalidate review evidence without changing the draft', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Shared evidence', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, repository: '.', eventPollMs: 50, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('navigation', { name: 'Workspace destinations' }).getByRole('link', { name: 'Review' }).click();
    const workflow = page.getByRole('region', { name: 'Review workflow' });
    const inspect = page.getByRole('button', { name: 'Inspect review gates' });
    await inspect.click();
    await expect(workflow).toContainText('Last inspection: review gates incomplete:');
    const { job } = store.createJob(workspace.id, workspace.revision, workspace.sourceDigest, 'other-client', 'external-check', 'structural');
    await expect(workflow).toContainText('Review gates not inspected for this draft');
    await inspect.click();
    await expect(workflow).toContainText('Last inspection: review gates incomplete:');
    store.updateJob(job.id, 'passed');
    await expect(workflow).toContainText('Review gates not inspected for this draft');
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('an older decision lookup cannot hide a newly recorded review', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Decision race', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  let release, observed, delayed = false;
  const gate = new Promise(resolve => { release = resolve; });
  const intercepted = new Promise(resolve => { observed = resolve; });
  const delay = async route => {
    if (!delayed && route.request().postDataJSON()?.params?.name === 'ontology_review_decisions') {
      delayed = true;
      const response = await route.fetch();
      observed(); await gate;
      await route.fulfill({ response }).catch(() => {});
    } else await route.continue();
  };
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('navigation', { name: 'Workspace destinations' }).getByRole('link', { name: 'Review' }).click();
    await page.route('**/mcp', delay);
    await page.getByRole('button', { name: 'Inspect review gates' }).click();
    await intercepted;
    const decisionSection = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Reviewer decision', exact: true }) });
    await decisionSection.getByLabel('Decision').selectOption('reject');
    await decisionSection.getByLabel('Reason', { exact: true }).fill('The draft needs further review.');
    await page.getByRole('button', { name: 'Record reviewer decision' }).click();
    await expect(page.getByText(/Rejected · revision 0 · local-reviewer · current/)).toBeVisible();
    const oldResponse = page.waitForResponse(response => response.request().postDataJSON()?.params?.name === 'ontology_review_decisions');
    release(); await oldResponse;
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await expect(page.getByRole('region', { name: 'Review workflow' })).toContainText('Latest decision: reject · revision 0 · current');
    expect(store.reviewDecisions(workspace.id)[0].decision).toBe('reject');
  } finally { release(); await page.unroute('**/mcp', delay); await page.close(); await service.shutdown(); store.close(); }
});

test('delayed review readiness cannot describe a newer draft', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Readiness race', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|Original.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  let release, observed;
  const gate = new Promise(resolve => { release = resolve; });
  const intercepted = new Promise(resolve => { observed = resolve; });
  const delay = async route => {
    if (route.request().postDataJSON()?.params?.name === 'ontology_review_readiness') {
      const response = await route.fetch();
      observed(); await gate;
      await route.fulfill({ response });
    } else await route.continue();
  };
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('navigation', { name: 'Workspace destinations' }).getByRole('link', { name: 'Review' }).click();
    await page.route('**/mcp', delay);
    await page.getByRole('button', { name: 'Inspect review gates' }).click();
    await intercepted;
    store.apply({ workspaceId: workspace.id, actor: 'other-client', operationId: 'newer-draft', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Record', definition: 'Updated during review.' }] });
    await expect(page.getByRole('region', { name: 'Workspace status' })).toContainText('Revision 1');
    release();
    await expect(page.getByRole('alert')).toContainText('The draft changed while review gates were loading.');
    await expect(page.getByText('Revision 0, digest', { exact: false })).toHaveCount(0);
    await page.unroute('**/mcp', delay);
    await page.getByRole('button', { name: 'Inspect review gates' }).click();
    await expect(page.getByText('Revision 1, digest', { exact: false })).toBeVisible();
  } finally { release(); await page.unroute('**/mcp', delay); await page.close(); await service.shutdown(); store.close(); }
});

test('a delayed draft comparison cannot replace the current revision', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Comparison race', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|Original.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  let release, observed;
  const gate = new Promise(resolve => { release = resolve; });
  const intercepted = new Promise(resolve => { observed = resolve; });
  const delay = async route => {
    if (route.request().postDataJSON()?.params?.name === 'ontology_changeset_diff') {
      const response = await route.fetch();
      observed(); await gate;
      await route.fulfill({ response });
    } else await route.continue();
  };
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.route('**/mcp', delay);
    await page.getByRole('button', { name: 'Review draft changes' }).click();
    await page.getByRole('region', { name: 'Review workflow' }).getByRole('button', { name: 'Open draft changes' }).click();
    await intercepted;
    store.apply({ workspaceId: workspace.id, actor: 'other-client', operationId: 'newer-draft', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Record', definition: 'Updated during review.' }] });
    await expect(page.getByRole('region', { name: 'Workspace status' })).toContainText('Revision 1');
    release();
    await expect(page.getByRole('alert')).toContainText('The draft changed while changes were loading.');
    await expect(page.getByRole('heading', { name: 'Changes at revision 0' })).toHaveCount(0);
    await page.unroute('**/mcp', delay);
    await page.getByRole('button', { name: 'Review draft changes' }).click();
    await page.getByRole('region', { name: 'Review workflow' }).getByRole('button', { name: 'Open draft changes' }).click();
    await expect(page.getByRole('heading', { name: 'Changes at revision 1' })).toBeFocused();
    await expect(page.getByText('After: Updated during review.')).toBeVisible();
  } finally { release(); await page.unroute('**/mcp', delay); await page.close(); await service.shutdown(); store.close(); }
});

test('review workflow links to separate review and publication steps', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Review workflow', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    const reviewLink = page.getByRole('navigation', { name: 'Workspace destinations' }).getByRole('link', { name: 'Review' });
    await reviewLink.click();
    const workflow = page.getByRole('region', { name: 'Review workflow' });
    await expect(workflow.getByRole('heading', { name: 'Review workflow' })).toBeFocused();
    const documents = page.getByRole('navigation', { name: 'Editor documents' });
    await expect(documents.getByRole('button', { name: 'Review', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await documents.getByRole('button', { name: 'Diagram view' }).click();
    await expect(workflow).toBeHidden();
    await documents.getByRole('button', { name: 'Review', exact: true }).click();
    await expect(workflow).toBeVisible();
    const reviewTools = page.getByRole('region', { name: 'Review and publication' });
    for (const heading of ['Review readiness', 'Reviewer decision', 'Publication preflight', 'GitHub commit checks']) {
      await expect(reviewTools.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    }
    await expect(workflow).toContainText(workspace.sourceDigest);
    await expect(workflow).toContainText('Checks and review decisions do not publish the draft.');
    await expect(workflow).toContainText('Comparison not opened');
    await expect(workflow).toContainText('Review gates not inspected for this draft');
    await expect(workflow).toContainText('Decision not inspected');
    await expect(workflow).toContainText('Target not checked for this draft');
    await expect(workflow).toContainText('Commit checks not inspected');
    for (const [button, heading] of [['Go to reviewer decision', 'Reviewer decision'], ['Go to publication preflight', 'Publication preflight'], ['Go to commit checks', 'GitHub commit checks']]) {
      await workflow.getByRole('button', { name: button }).click();
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeFocused();
      await reviewLink.click();
    }
    await workflow.getByRole('button', { name: 'Open validation checks' }).click();
    await expect(page.getByRole('heading', { name: 'Validation issues' })).toBeFocused();
    await reviewLink.click();
    await workflow.getByRole('button', { name: 'Open draft changes' }).click();
    await expect(page.getByRole('heading', { name: 'Changes at revision 0' })).toBeFocused();
    expect(store.get(workspace.id).revision).toBe(0);
    await reviewLink.click();
    await expect(workflow).toContainText('Comparison current at revision 0');
    await page.getByRole('button', { name: 'Inspect review gates' }).click();
    await expect(workflow).toContainText('Last inspection: review gates incomplete:');
    await expect(workflow).toContainText('No decision returned');
    store.apply({ workspaceId: workspace.id, actor: 'other-client', operationId: 'newer-review', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Record', definition: 'A newer record.' }] });
    await expect(page.getByRole('region', { name: 'Workspace status' })).toContainText('Revision 1');
    await expect(workflow).toContainText('Comparison out of date (revision 0)');
    await expect(workflow).toContainText('Review gates not inspected for this draft');
    expect(store.get(workspace.id).revision).toBe(1);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('undo identifies the author and refuses a newer draft', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Undo review', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|Original.|\n' });
  store.apply({ workspaceId: workspace.id, actor: 'other-client', operationId: 'first', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Record', definition: 'First change.' }] });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Results' }).click();
    const undo = page.getByRole('button', { name: 'Undo latest command group' });
    await undo.click();
    const confirmation = page.getByRole('region', { name: 'Confirm undo' });
    await expect(confirmation).toContainText("other-client's command group: class.describe");
    await confirmation.getByRole('button', { name: 'Cancel undo' }).click();
    expect(store.get(workspace.id).revision).toBe(1);
    await undo.click();
    store.apply({ workspaceId: workspace.id, actor: 'third-client', operationId: 'newer', expectedRevision: 1, commands: [{ type: 'class.describe', name: 'Record', definition: 'Newer change.' }] });
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 2');
    await expect(confirmation.getByText('The draft changed. Cancel and review the latest revision before undoing.')).toBeVisible();
    await expect(confirmation.getByRole('button', { name: 'Confirm undo revision 1' })).toBeDisabled();
    await confirmation.getByRole('button', { name: 'Cancel undo' }).click();
    await undo.click();
    await expect(confirmation).toContainText("third-client's command group: class.describe");
    expect(store.get(workspace.id).revision).toBe(2);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('recent activity describes a suggestion and opens the current concept', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Recent activity', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    store.suggestView(workspace.id, { actor: 'codex', operationId: 'activity-suggestion', expectedRevision: 0, root: 'Device', viewpoint: 'information', explanation: 'Inspect the device neighbourhood.' });
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Results' }).click();
    await page.getByRole('navigation', { name: 'Results panels' }).getByRole('button', { name: 'Activity', exact: true }).click();
    const activity = page.getByRole('region', { name: 'Recent activity' });
    await expect(activity.getByText('Suggested Device · information view')).toBeVisible();
    await expect(activity.getByText('Inspect the device neighbourhood.')).toBeVisible();
    await activity.getByRole('button', { name: 'Inspect current Device' }).click();
    if (isMobile) {
      await expect(page.getByRole('region', { name: 'Relationships for Device' })).toBeVisible();
      await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    }
    await expect(page.getByRole('heading', { name: 'Device', exact: true })).toBeVisible();
    store.apply({ workspaceId: workspace.id, actor: 'codex', operationId: 'activity-edit', expectedRevision: 0, rationale: 'Clarify device terminology.', commands: [{ type: 'class.describe', name: 'Device', definition: 'A revised device.' }] });
    if (isMobile) {
      await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Results' }).click();
      const activityButton = page.getByRole('navigation', { name: 'Results panels' }).getByRole('button', { name: 'Activity', exact: true });
      if (await activityButton.getAttribute('aria-pressed') !== 'true') await activityButton.click();
    }
    await expect(activity.getByText('Updated a definition')).toBeVisible();
    await expect(activity.getByText('Reason: Clarify device terminology.')).toBeVisible();
    await expect(activity.locator('time').first()).toHaveAttribute('datetime', /Z$/);
    await activity.getByRole('button', { name: 'Inspect revision 1' }).click();
    const detail = activity.getByRole('region', { name: 'Activity revision detail' });
    await expect(detail.getByRole('heading', { name: 'Historical revision 1' })).toBeFocused();
    await expect(detail.locator('pre').first()).toContainText('A revised device.');
    await detail.getByRole('button', { name: 'Back to recent activity' }).click();
    await expect(activity.getByRole('heading', { name: 'Recent activity' })).toBeFocused();
    await expect(activity.getByText('Updated a definition')).toBeVisible();
    expect(store.get(workspace.id).revision).toBe(1);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('following suggestions pauses for manual work and resumes for new events', async ({ page, isMobile }) => {
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
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Results' }).click();
    await page.getByLabel('Follow new changes and suggestions').check();
    await expect(page.getByText('Following new changes and suggestions.', { exact: true })).toBeVisible();
    suggest('first-suggestion', 'Device');
    await expect(page.getByRole('region', { name: 'Workspace status' })).toContainText('Selected: Device');
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await expect(page.getByRole('heading', { name: 'Device', exact: true })).toBeVisible();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Model' }).click();
    await page.getByLabel('Search model').focus();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Results' }).click();
    await expect(page.getByText('Following paused after interaction.')).toBeVisible();
    suggest('paused-suggestion', 'Record');
    await expect(page.getByText('paused-suggestion', { exact: true })).toBeVisible();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await expect(page.getByRole('heading', { name: 'Device', exact: true })).toBeVisible();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Results' }).click();
    await page.getByRole('button', { name: 'Resume following' }).click();
    await expect(page.getByText('Following new changes and suggestions.', { exact: true })).toBeVisible();
    suggest('resumed-suggestion', 'Record');
    await expect(page.getByRole('region', { name: 'Workspace status' })).toContainText('Selected: Record');
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await expect(page.getByRole('heading', { name: 'Record', exact: true })).toBeVisible();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Results' }).click();
    await page.getByLabel('Follow new changes and suggestions').uncheck();
    suggest('disabled-suggestion', 'Device');
    await expect(page.getByText('disabled-suggestion', { exact: true })).toBeVisible();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await expect(page.getByRole('heading', { name: 'Record', exact: true })).toBeVisible();
    expect(store.get(workspace.id).revision).toBe(0);
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Results' }).click();
    await page.getByLabel('Follow new changes and suggestions').check();
    store.apply({ workspaceId: workspace.id, actor: 'codex', operationId: 'add-planned-window', expectedRevision: 0, commands: [{ type: 'class.add', name: 'PlannedWindow', module: 'foundation', parent: 'Record', definition: 'A planned window.' }] });
    await expect(page.getByRole('region', { name: 'Workspace status' })).toContainText('Selected: PlannedWindow');
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await expect(page.getByRole('heading', { name: 'PlannedWindow', exact: true })).toBeVisible();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Results' }).click();
    await expect(page.getByText(/Latest change: codex updated PlannedWindow/)).toBeVisible();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Model' }).click();
    await page.getByLabel('Search model').fill('Record');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Record', exact: true }).first().click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Results' }).click();
    await page.getByRole('button', { name: 'Show latest change' }).click();
    if (isMobile) {
      await expect(page.getByRole('region', { name: 'Relationships for PlannedWindow' })).toBeVisible();
      await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    }
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
    let releaseRelationship, interceptedRelationship;
    const relationshipGate = new Promise(resolve => { releaseRelationship = resolve; });
    const relationshipIntercepted = new Promise(resolve => { interceptedRelationship = resolve; });
    const delayRelationship = async route => {
      if (route.request().postDataJSON()?.params?.name === 'ontology_changeset_apply') { interceptedRelationship(); await relationshipGate; }
      await route.continue();
    };
    await page.route('**/mcp', delayRelationship);
    try {
      await page.getByRole('button', { name: 'Create relationship', exact: true }).click();
      await relationshipIntercepted;
      await expect(page.getByLabel('Predicate name')).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Cancel relationship' })).toBeDisabled();
      await page.getByRole('form', { name: 'New relationship' }).dispatchEvent('keydown', { key: 'Escape' });
      await expect(page.getByRole('form', { name: 'New relationship' })).toBeVisible();
      releaseRelationship();
      await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 1');
    } finally { releaseRelationship(); await page.unroute('**/mcp', delayRelationship); }
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 1');
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
    await page.getByLabel('Group name', { exact: true }).fill('Core');
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
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 1');
    await expect(node).toHaveAttribute('style', moved);
    await page.evaluate(id => sessionStorage.removeItem(`chargeweave.canvas.v2.${id}.maintenance`), workspace.id);
    await page.reload();
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 1');
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
  const workspace = store.create({ title: 'Compact graph', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|peer:Record?\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    const navigation = page.getByRole('navigation', { name: 'Workspace sections' });
    await expect(navigation.getByRole('button', { name: 'Model', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#studio-editor-pane')).toBeHidden();
    await expect(page.locator('#studio-inspector-pane')).toBeHidden();
    await page.getByLabel('Search model').fill('Device');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    await expect(navigation.getByRole('button', { name: 'Diagram', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#studio-navigator-pane')).toBeHidden();
    await navigation.getByRole('button', { name: 'Inspector', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Inspector' })).toBeFocused();
    await expect(page.locator('#studio-editor-pane')).toBeHidden();
    await navigation.getByRole('button', { name: 'Diagram', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Workspace', exact: true })).toBeFocused();
    await expect(page.locator('.studio-compact-relationships')).toHaveAttribute('open', '');
    await page.getByText('Relationship list (2)', { exact: true }).click();
    await expect(page.locator('.studio-compact-relationships')).not.toHaveAttribute('open', '');
    await page.getByText('Relationship list (2)', { exact: true }).click();
    const list = page.getByRole('region', { name: 'Relationship list for Device' });
    const graph = page.getByRole('region', { name: 'Relationships for Device' });
    await expect(list).toBeVisible();
    await expect(list.locator('li').filter({ hasText: 'peer' })).toContainText('(0..1)');
    const order = await page.evaluate(() => ({ list: document.querySelector('.studio-relationship-list').getBoundingClientRect().top, graph: document.querySelector('.studio-flow').getBoundingClientRect().top }));
    expect(order.list).toBeLessThan(order.graph);
    const relationship = page.locator('.studio-graph li').filter({ hasText: 'subClassOf' });
    await relationship.getByRole('button', { name: 'Record' }).click();
    await expect(page.getByRole('region', { name: 'Relationships for Record' })).toBeVisible();
    await navigation.getByRole('button', { name: 'Inspector', exact: true }).click();
    await page.getByRole('textbox', { name: 'Definition', exact: true }).fill('Unapplied compact edit.');
    await navigation.getByRole('button', { name: 'Results', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Validation issues' })).toBeFocused();
    await expect(page.locator('.studio-panels')).toBeHidden();
    await expect(page.getByRole('heading', { name: 'Publication preflight' })).toHaveCount(0);
    await navigation.getByRole('button', { name: 'Inspector', exact: true }).click();
    await expect(page.getByRole('textbox', { name: 'Definition', exact: true })).toHaveValue('Unapplied compact edit.');
    await page.getByRole('navigation', { name: 'Workspace destinations' }).getByRole('link', { name: 'Review' }).click();
    await expect(page.getByRole('heading', { name: 'Review workflow' })).toBeFocused();
    await expect(page.getByRole('heading', { name: 'Publication preflight' })).toBeVisible();
    await page.getByRole('navigation', { name: 'Workspace destinations' }).getByRole('link', { name: 'Activity' }).click();
    await expect(page.getByRole('heading', { name: 'Activity', exact: true })).toBeFocused();
    await navigation.getByRole('button', { name: 'Model', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Discover concepts' })).toBeFocused();
    await page.locator('#studio-navigator-pane').getByRole('button', { name: 'Device', exact: true }).press('Enter');
    await expect(page.getByRole('dialog', { name: 'Unapplied edits' })).toBeVisible();
    await page.getByRole('button', { name: 'Discard and open Device' }).click();
    await expect(page.getByRole('region', { name: 'Relationships for Device' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    await page.setViewportSize({ width: 320, height: 844 });
    const overflows = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflows).toBe(false);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('compact layout retains the relationship list and diagram on resize', async ({ page, isMobile }) => {
  test.skip(isMobile, 'This checks a desktop-to-phone viewport transition.');
  await page.setViewportSize({ width: 1440, height: 900 });
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Responsive model', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    const list = page.getByRole('region', { name: 'Relationship list for Device' });
    const canvas = page.getByRole('region', { name: 'Relationships for Device' });
    await expect(canvas).toBeVisible();
    await expect(list).toBeVisible();
    expect(await canvas.evaluate((element, other) => Boolean(element.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_FOLLOWING), await list.elementHandle())).toBe(true);
    await canvas.evaluate(element => { window.__testCanvasBeforeResize = element; });
    await page.getByRole('button', { name: 'Hide navigator' }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => page.evaluate(() => Boolean(document.querySelector('.studio-relationship-list').compareDocumentPosition(document.querySelector('.studio-flow')) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
    expect(await page.evaluate(() => document.querySelector('.studio-flow') === window.__testCanvasBeforeResize)).toBe(true);
    await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram', exact: true }).click();
    await expect(canvas).toBeVisible();
    const compactList = page.locator('.studio-compact-relationships');
    await expect(compactList).toHaveAttribute('open', '');
    await compactList.locator('summary').click();
    await expect(compactList).not.toHaveAttribute('open', '');
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(compactList).toHaveCount(0);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(compactList).not.toHaveAttribute('open', '');
    await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Model', exact: true }).click();
    await expect(page.getByLabel('Search model')).toBeVisible();
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.getByRole('button', { name: 'Show navigator' })).toBeVisible();
    await expect(page.getByLabel('Search model')).toBeHidden();
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('browser maps an existing responsibility relationship without inventing one', async ({ page, isMobile }) => {
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
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Results' }).click();
    await page.getByRole('button', { name: 'Inspect responsibilities for selected concept' }).click();
    await page.getByText('Map an existing responsibility relationship').click();
    await page.getByLabel('Declared object relationship').selectOption('owner');
    await page.getByLabel('Responsibility label').fill('Accountable party');
    expect(await page.evaluate(() => { const event = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(event); return event.defaultPrevented; })).toBe(true);
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Model' }).click();
    await page.getByLabel('Search model').fill('Record');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.locator('#studio-navigator-pane').getByRole('button', { name: 'Record', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Unapplied edits' })).toBeVisible();
    await page.getByRole('button', { name: 'Stay and keep editing' }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Results' }).click();
    await expect(page.getByLabel('Responsibility label')).toHaveValue('Accountable party');
    let releaseMapping, interceptedMapping;
    const mappingGate = new Promise(resolve => { releaseMapping = resolve; });
    const mappingIntercepted = new Promise(resolve => { interceptedMapping = resolve; });
    const delayMapping = async route => {
      if (route.request().postDataJSON()?.params?.name === 'ontology_changeset_apply') { interceptedMapping(); await mappingGate; }
      await route.continue();
    };
    await page.route('**/mcp', delayMapping);
    try {
      await page.getByRole('button', { name: 'Add responsibility mapping' }).click();
      await mappingIntercepted;
      await expect(page.getByLabel('Responsibility label')).toBeDisabled();
      await expect(page.getByLabel('Declared object relationship')).toBeDisabled();
      releaseMapping();
      await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 1');
    } finally { releaseMapping(); await page.unroute('**/mcp', delayMapping); }
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 1');
    expect(store.get(workspace.id).schema).toBe(source);
    await page.getByRole('button', { name: 'Inspect responsibilities for selected concept' }).click();
    await expect(page.getByText(/Accountable party: owner → Record/)).toBeVisible();
    let releaseUndo, interceptedUndo;
    const undoGate = new Promise(resolve => { releaseUndo = resolve; });
    const undoIntercepted = new Promise(resolve => { interceptedUndo = resolve; });
    const delayUndo = async route => {
      if (route.request().postDataJSON()?.params?.name === 'ontology_changeset_undo') { interceptedUndo(); await undoGate; }
      await route.continue();
    };
    await page.route('**/mcp', delayUndo);
    try {
      await page.getByRole('button', { name: 'Undo latest command group' }).click();
      await expect(page.getByRole('region', { name: 'Confirm undo' })).toContainText('viewpoint.binding_add');
      await page.getByRole('button', { name: 'Confirm undo revision 1' }).click();
      await undoIntercepted;
      await expect(page.getByRole('button', { name: 'Undo latest command group' })).toBeDisabled();
      await expect(page.getByLabel('Current workspace')).toBeDisabled();
      releaseUndo();
      await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 2');
    } finally { releaseUndo(); await page.unroute('**/mcp', delayUndo); }
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 2');
    expect(store.responsibilityView(workspace.id, 'Device', 2).bindings).toEqual([]);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('browser inspects the pinned temporal policy and explicit time fields', async ({ page, isMobile }) => {
  test.setTimeout(90000);
  const surface = async name => { if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name, exact: true }).click(); };
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
    await surface('Results');
    await page.getByRole('button', { name: 'Inspect time for selected concept' }).click();
    await expect(page.getByText('Class policy: snapshot-versioned')).toBeVisible();
    await expect(page.getByText(/Policy source: model\/temporal-policy\.json/)).toBeVisible();
    await expect(page.getByText(/Model revision 0; policy from baseline/)).toContainText(commit);
    await expect(page.getByRole('heading', { name: 'Explicit time fields and window references' })).toBeVisible();
    await surface('Model');
    await page.getByLabel('Search model').fill('RecurringWindow');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'RecurringWindow', exact: true }).first().click();
    await page.getByRole('button', { name: 'Focus neighbourhood' }).click();
    await surface('Results');
    await page.getByRole('button', { name: 'Inspect time for selected concept' }).click();
    await surface('Diagram');
    await page.getByLabel('Graph viewpoint').selectOption('temporal');
    if (isMobile && !await page.locator('.studio-compact-relationships').evaluate(element => element.open)) await page.locator('.studio-compact-relationships > summary').click();
    await expect(page.locator('.studio-graph li').filter({ hasText: 'exceptionWindow' })).toBeVisible();
    await page.getByLabel('Filter graph relationships').fill('exceptionWindow');
    await expect(page.locator('.studio-graph li').filter({ hasText: 'exceptionWindow' })).toBeVisible();
    await page.getByRole('button', { name: 'Save shared view' }).click();
    await expect(page.getByText('Shared view saved.')).toBeVisible();
    await page.getByLabel('Graph viewpoint').selectOption('information');
    await page.getByLabel('Filter graph relationships').fill('');
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Load shared view' }).click();
    await expect(page.getByLabel('Graph viewpoint')).toHaveValue('temporal');
    await expect(page.getByLabel('Filter graph relationships')).toHaveValue('exceptionWindow');
    await surface('Results');
    await page.getByRole('button', { name: 'Inspect TimeWindow' }).click();
    if (isMobile) await expect(page.getByRole('region', { name: 'Relationships for TimeWindow' })).toBeVisible();
    await surface('Inspector');
    await expect(page.getByRole('heading', { name: 'TimeWindow', exact: true })).toBeVisible();
    await surface('Diagram');
    await page.getByLabel('Graph viewpoint').selectOption('information');
    await page.getByLabel('Filter graph relationships').fill('');
    await surface('Results');
    await page.getByRole('button', { name: 'Inspect responsibilities for selected concept' }).click();
    await expect(page.getByText('No responsibility binding defined in this mapping.')).toBeVisible();
    await page.getByRole('button', { name: 'Add a field or relationship', exact: true }).click();
    await expect(page.getByLabel('Field name')).toBeVisible();
    await surface('Model');
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
    await surface('Results');
    await page.getByRole('button', { name: 'Inspect responsibilities for selected concept' }).click();
    await expect(page.getByText('Asset owner', { exact: true })).toBeVisible();
    await expect(page.getByText(/Asset owner: assetOwner → LegalEntity/)).toBeVisible();
    await page.getByLabel('Filter responsibility category').selectOption('service');
    await expect(page.getByText('Asset owner', { exact: true })).toHaveCount(0);
    await page.getByLabel('Filter responsibility category').selectOption('ownership');
    await page.getByText('Why this binding appears').first().click();
    await expect(page.getByText(/Predicate IRI:/).first()).toBeVisible();
    await page.getByRole('button', { name: 'Inspect LegalEntity' }).first().click();
    if (isMobile) await expect(page.getByRole('region', { name: 'Relationships for LegalEntity' })).toBeVisible();
    await surface('Inspector');
    await expect(page.getByRole('heading', { name: 'LegalEntity', exact: true })).toBeVisible();
    await surface('Model');
    await page.getByLabel('Search model').fill('ChargingStation');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'ChargingStation', exact: true }).first().click();
    await page.getByRole('textbox', { name: 'Definition', exact: true }).fill('A reviewed station definition.');
    await page.getByRole('button', { name: 'Save definition' }).click();
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 1');
    await page.getByRole('navigation', { name: 'Workspace destinations' }).getByRole('link', { name: 'Review' }).click();
    await page.getByRole('button', { name: 'Inspect explicit impact references' }).click();
    await expect(page.getByText(/Changed classes: ChargingStation/)).toBeVisible();
    await expect(page.locator('section').filter({ has: page.getByRole('heading', { name: 'Change impact' }) }).getByText(/requirement BR-/).first()).toBeVisible();
    await page.getByRole('navigation', { name: 'Workspace destinations' }).getByRole('link', { name: 'Review' }).click();
    await page.getByLabel('Reason', { exact: true }).fill('Add a deliberate negative fixture.');
    await page.getByRole('button', { name: 'Record reviewer decision' }).click();
    await expect(page.getByText('Add a deliberate negative fixture.')).toBeVisible();
    await expect(page.getByText(/Changes requested · revision 1 · local-reviewer · current/)).toBeVisible();
    await surface('Inspector');
    await page.getByRole('textbox', { name: 'Definition', exact: true }).fill('A revised station definition.');
    await page.getByRole('button', { name: 'Save definition' }).click();
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 2');
    await page.getByRole('navigation', { name: 'Workspace destinations' }).getByRole('link', { name: 'Review' }).click();
    await expect(page.getByText(/Changes requested · revision 1 · local-reviewer · stale/)).toBeVisible();
    await surface('Results');
    await page.getByLabel('Search requirements').fill('BR-001');
    await page.getByRole('button', { name: 'Search requirements', exact: true }).click();
    await page.locator('li').filter({ hasText: 'BR-001' }).getByRole('button', { name: 'Link selected concept' }).click();
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 3');
    await surface('Inspector');
    await page.getByText('Linked requirements', { exact: true }).click();
    const linkedRequirements = page.locator('details.studio-requirement-links');
    await expect(linkedRequirements).toContainText('BR-001');
    await expect(linkedRequirements).toContainText('do not establish coverage or acceptance');
    await page.getByText('Prepare context for Codex').click();
    await expect(page.getByLabel('Context preview')).toHaveValue(/Explicit concept requirement links:.*BR-001/);
    await surface('Diagram');
    await page.getByRole('navigation', { name: 'Editor documents' }).getByRole('button', { name: 'Diagram view' }).click();
    await page.getByRole('button', { name: 'Inspect changes' }).click();
    await expect(page.getByText('Source patch: requirements/business-requirements.json')).toBeVisible();
    await surface('Results');
    await page.getByRole('button', { name: 'Inspect time for selected concept' }).click();
    await expect(page.getByLabel('Set explicit temporal policy')).toBeVisible();
    let releaseTemporal, interceptedTemporal;
    const temporalGate = new Promise(resolve => { releaseTemporal = resolve; });
    const temporalIntercepted = new Promise(resolve => { interceptedTemporal = resolve; });
    const delayTemporal = async route => {
      if (route.request().postDataJSON()?.params?.name === 'ontology_temporal_view_get') { interceptedTemporal(); await temporalGate; }
      await route.continue();
    };
    await page.route('**/mcp', delayTemporal);
    try {
      await page.getByRole('button', { name: 'Inspect time for selected concept' }).click();
      await temporalIntercepted;
      await page.getByLabel('Set explicit temporal policy').selectOption('immutable-aggregate');
      const oldResponse = page.waitForResponse(response => response.request().postDataJSON()?.params?.name === 'ontology_temporal_view_get');
      releaseTemporal(); await oldResponse;
      await expect(page.getByLabel('Set explicit temporal policy')).toHaveValue('immutable-aggregate');
    } finally { releaseTemporal(); await page.unroute('**/mcp', delayTemporal); }
    expect(await page.evaluate(() => { const event = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(event); return event.defaultPrevented; })).toBe(true);
    await surface('Model');
    await page.getByLabel('Search model').fill('Record');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.locator('#studio-navigator-pane').getByRole('button', { name: 'Record', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Unapplied edits' })).toBeVisible();
    await page.getByRole('button', { name: 'Stay and keep editing' }).click();
    await surface('Results');
    await page.getByRole('button', { name: 'Inspect time for selected concept' }).click();
    await expect(page.getByRole('alert')).toContainText('Apply or discard the temporal policy edit');
    await expect(page.getByLabel('Set explicit temporal policy')).toHaveValue('immutable-aggregate');
    await page.getByRole('button', { name: 'Discard temporal policy edit' }).click();
    await page.getByLabel('Set explicit temporal policy').selectOption('immutable-aggregate');
    await page.getByRole('button', { name: 'Save temporal policy' }).click();
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 4');
    await page.getByRole('button', { name: 'Inspect time for selected concept' }).click();
    await expect(page.getByText('Class policy: immutable-aggregate')).toBeVisible();
    await expect(page.getByText(/draft policy from baseline/)).toBeVisible();
    await surface('Diagram');
    await page.getByRole('navigation', { name: 'Editor documents' }).getByRole('button', { name: 'Diagram view' }).click();
    await page.getByRole('button', { name: 'Inspect changes' }).click();
    await expect(page.getByText('Source patch: model/temporal-policy.json')).toBeVisible();
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('failed validation can be inspected, corrected and retried on the current draft', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Repair', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|Needs correction.|\nPlannedMaintenanceWindow|Record|A planned window.|\n' });
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
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Results' }).click();
    if (!isMobile) await page.getByRole('navigation', { name: 'Results panels' }).getByRole('button', { name: 'Checks', exact: true }).click();
    await page.getByRole('button', { name: 'Collapse validation' }).click();
    await page.getByRole('button', { name: 'Close results panel' }).click();
    await page.getByRole('button', { name: 'Check draft', exact: true }).click();
    const problems = page.getByRole('region', { name: 'Problems' });
    await expect(problems.getByText('tools/example-check.py', { exact: true })).toBeVisible();
    await expect(problems.getByText(/does not automatically identify a model defect/)).toBeVisible();
    await expect(problems.getByText(/Affected concept and cause are unknown/)).toBeVisible();
    await problems.getByText('Recorded output for tools/example-check.py').click();
    await expect(problems.getByRole('region', { name: 'Problem output: tools/example-check.py' })).toContainText('Synthetic fixture: definition needs correction.');
    await problems.getByRole('button', { name: 'Inspect failed checks' }).click();
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
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Model' }).click();
    await page.getByLabel('Search model').fill('Record');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Record', exact: true }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await page.getByRole('textbox', { name: 'Definition', exact: true }).fill('Corrected definition.');
    await page.getByRole('button', { name: 'Save definition' }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Results' }).click();
    await expect(issues.getByText(/stale for the current draft/)).toBeVisible();
    await issues.getByRole('button', { name: 'Retry structural check on current draft' }).click();
    await expect(issues.getByText(/structural check at revision 1: passed/)).toBeVisible();
    await expect(issues.getByText(/Other required checks may still be missing/)).toBeVisible();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram' }).click();
    await page.getByRole('button', { name: 'Run maintenance fixtures' }).click();
    await expect(problems.getByText('Synthetic fixture missing-station: target PlannedMaintenanceWindow.maintenanceStation.')).toBeVisible();
    await expect(problems.getByRole('button', { name: 'Inspect fixture target PlannedMaintenanceWindow' })).toBeEnabled();
    await problems.getByRole('button', { name: 'Inspect fixture target PlannedMaintenanceWindow' }).click();
    await expect(page.locator('#studio-inspector-pane').getByRole('heading', { name: 'PlannedMaintenanceWindow', exact: true })).toBeVisible();
    await expect(page.locator('.studio-flow[aria-label="Relationships for Record"]')).toHaveCount(1);
    if (isMobile) { await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Results' }).click(); await page.getByRole('navigation', { name: 'Results panels' }).getByRole('button', { name: /Problems/ }).click(); }
    await problems.getByRole('button', { name: 'Inspect failed checks' }).click();
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
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('Connected');
    await expect(page.getByRole('button', { name: 'Search', exact: true })).toBeEnabled();
    let attempts = 0;
    await page.route(denied === 'events' ? '**/events?**' : '**/mcp', route => { attempts += 1; return route.fulfill({ status: 401, body: 'Unauthorized' }); });
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('Authorization expired; reconnect');
    await expect(page.getByRole('button', { name: 'Search', exact: true })).toBeDisabled();
    await page.waitForTimeout(1300);
    expect(attempts).toBe(1);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('browser discovers and edits the shared MCP workspace', async ({ page, isMobile }) => {
  const surface = async name => { if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name, exact: true }).click(); };
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
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 0');
    expect(workspaceReads).toContain(`ontology://workspace/${workspace.id}/v1/summary`);
    await page.getByLabel('Search model').fill('NoMatchingConcept');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText(/No matching concepts/)).toBeVisible();
    const cookies = await page.context().cookies();
    expect(cookies.find(cookie => cookie.name === 'cw_studio')?.httpOnly).toBe(true);
    await page.reload();
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 0');
    await surface('Results');
    await page.getByLabel('Change-set intent').fill('Clarify and extend the record.');
    await page.getByRole('button', { name: 'Open change set' }).click();
    await expect(page.getByText(/Clarify and extend the record. · draft/)).toBeVisible();
    if (!isMobile) {
      await page.getByRole('button', { name: 'Hide navigator' }).click();
      await expect(page.getByRole('heading', { name: 'Discover concepts' })).not.toBeVisible();
      await page.getByRole('button', { name: 'Show navigator' }).click();
      await page.getByRole('button', { name: 'Hide inspector' }).click();
      await expect(page.getByRole('heading', { name: 'Inspector', exact: true })).not.toBeVisible();
      await page.getByRole('button', { name: 'Show inspector' }).click();
    }
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
    await surface('Diagram');
    await page.getByRole('button', { name: 'Run structural generator' }).click();
    await expect(page.getByText('tools/build.py: passed')).toBeVisible();
    await page.getByRole('button', { name: 'View check details' }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download evidence report' }).click();
    const download = await downloadPromise;
    const report = JSON.parse(readFileSync(await download.path(), 'utf8'));
    expect(report.workspaceId).toBe(workspace.id); expect(report.status).toBe('passed');
    expect(report.steps).toEqual([{ checkName: 'tools/build.py', status: 'passed' }]);
    await surface('Diagram');
    await page.getByRole('button', { name: 'Run reference checks' }).click();
    await surface('Results');
    await expect(page.getByRole('heading', { name: 'Generated artifact comparison' })).toBeVisible();
    await expect(page.getByText('changed: ontology/example.ttl')).toBeVisible();
    await surface('Model');
    await page.getByLabel('Search model').fill('Record');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Record', exact: true }).click();
    await surface('Inspector');
    await page.getByRole('textbox', { name: 'Definition', exact: true }).fill('An edited record.');
    await surface('Diagram');
    await page.getByLabel('Reason for next edit (optional)').fill('Clarify the definition.');
    await surface('Inspector');
    await page.getByRole('button', { name: 'Save definition' }).click();
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 1');
    await surface('Results');
    await expect(page.getByText('Reason: Clarify the definition.')).toBeVisible();
    await surface('Diagram');
    await expect(page.getByLabel('Reason for next edit (optional)')).toHaveValue('');
    expect(store.search(workspace.id, 'Record').results[0].definition).toBe('An edited record.');
    await page.getByRole('button', { name: 'Inspect changes' }).click();
    await expect(page.getByText('changed: Record')).toBeVisible();
    await expect(page.getByText('After: An edited record.')).toBeVisible();
    await page.getByRole('button', { name: 'Focus changed Record' }).click();
    if (isMobile) await expect(page.getByRole('region', { name: 'Relationships for Record' })).toBeVisible();
    await surface('Inspector');
    await expect(page.getByRole('heading', { name: 'Record', exact: true })).toBeVisible();
    await page.getByRole('navigation', { name: 'Workspace destinations' }).getByRole('link', { name: 'Review' }).click();
    await page.getByRole('button', { name: 'Inspect review gates' }).click();
    await expect(page.getByText('structural: not run for this draft')).toBeVisible();
    await surface('Diagram');
    await page.getByRole('navigation', { name: 'Editor documents' }).getByRole('button', { name: 'Changes', exact: true }).click();
    await expect(page.getByText('Source patch', { exact: true })).toBeVisible();
    await expect(page.locator('pre').filter({ hasText: '+Record|root|An edited record.' })).toBeVisible();
    await page.getByRole('navigation', { name: 'Editor documents' }).getByRole('button', { name: 'Diagram view' }).click();
    await page.getByText('Add a concept').click();
    await page.getByLabel('Class name').fill('MaintenanceWindow');
    await page.getByLabel('Class definition').fill('A planned maintenance window.');
    await page.getByRole('button', { name: 'Add concept' }).click();
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 2');
    await surface('Model');
    await page.getByLabel('Search model').fill('MaintenanceWindow');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'MaintenanceWindow', exact: true }).click();
    await surface('Inspector');
    const inheritedField = page.getByRole('row').filter({ has: page.getByRole('rowheader', { name: /recordName/ }) });
    await expect(inheritedField).toContainText('string');
    await expect(inheritedField).toContainText('Inherited from Record');
    await page.getByLabel('Field origin').selectOption('inherited');
    await expect(inheritedField).toBeVisible();
    await expect(inheritedField.getByRole('button', { name: 'Edit recordName' })).toHaveCount(0);
    await page.getByLabel('Field origin').selectOption('declared');
    await expect(inheritedField).toHaveCount(0);
    await expect(page.getByText('No fields match these filters. Clear the text or change the origin.')).toBeVisible();
    await page.getByLabel('Field origin').selectOption('all');
    await surface('Diagram');
    await expect(page.getByRole('region', { name: 'Relationships for MaintenanceWindow' })).toBeVisible();
    await expect(page.locator('.react-flow__node[data-id="MaintenanceWindow"]')).toContainText('Added in draft');
    if (isMobile && !await page.locator('.studio-compact-relationships').evaluate(element => element.open)) await page.locator('.studio-compact-relationships > summary').click();
    await expect(page.getByText('subClassOf →', { exact: true })).toBeVisible();
    await expect(page.getByText(/added · model\/domain\.schema:4/)).toBeVisible();
    await surface('Inspector');
    await page.getByText('Add a field or relationship').click();
    await page.getByLabel('Field name').fill('windowNote');
    await page.getByRole('button', { name: 'Add field' }).click();
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 3');
    expect(store.search(workspace.id, 'MaintenanceWindow').results[0].fields).toBe('windowNote:string?');
    await surface('Results');
    await page.getByRole('button', { name: 'Undo latest command group' }).click();
    await page.getByRole('button', { name: 'Confirm undo revision 3' }).click();
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 4');
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
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 4');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await historical.getByRole('button', { name: 'Return to current draft' }).click();
    await expect(historical).toHaveCount(0);
    await page.getByRole('navigation', { name: 'Workspace destinations' }).getByRole('link', { name: 'Review' }).click();
    await page.getByLabel('Decision').selectOption('reject');
    await page.getByLabel('Reason', { exact: true }).fill('The proposal needs revision.');
    await page.getByRole('button', { name: 'Record reviewer decision' }).click();
    await surface('Results');
    await expect(page.getByText(/Clarify and extend the record. · rejected/)).toBeVisible();
    await page.getByRole('button', { name: 'Reopen change set' }).click();
    await expect(page.getByText(/Clarify and extend the record. · draft/)).toBeVisible();
    await surface('Model');
    await page.route('**/events?**', route => route.abort());
    await page.route('**/mcp', route => route.abort());
    service.closeAllConnections();
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('Reconnecting');
    await expect(page.getByRole('button', { name: 'Search', exact: true })).toBeDisabled();
    await page.waitForTimeout(1500);
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('Reconnecting');
    await page.unroute('**/mcp');
    await page.unroute('**/events?**');
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('Connected');
    await expect(page.getByRole('button', { name: 'Search', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Disconnect' }).click();
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('Disconnected');
    expect((await page.context().cookies()).some(cookie => cookie.name === 'cw_studio')).toBe(false);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
