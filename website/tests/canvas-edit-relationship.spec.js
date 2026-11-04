import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('a diagram relationship opens the same checked field editor', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Relationship edit', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nAsset|Record|An asset.|\nDevice|Record|A device.|asset:Asset?\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode); await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByLabel('Search model').fill('Device'); await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram' }).click();
    const picker = page.getByLabel('Inspect relationship');
    await picker.selectOption(await picker.locator('option').filter({ hasText: /Device.*asset.*Asset/ }).getAttribute('value'));
    await page.getByRole('region', { name: 'Relationship details' }).getByRole('button', { name: 'Inspect target Asset' }).click();
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 0');
    await page.getByRole('button', { name: 'Edit relationship asset' }).click();
    await expect(page.getByRole('heading', { name: 'Edit field contract' })).toBeVisible();
    await expect(page.getByLabel('New datatype or target class')).toHaveValue('Asset');
    await page.getByLabel('New cardinality').selectOption('!');
    expect(store.get(workspace.id).revision).toBe(0);
    await page.getByRole('button', { name: 'Update field contract' }).click();
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 1');
    expect(store.get(workspace.id).schema).toContain('asset:Asset!');
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

for (const cancel of [false, true]) test(cancel ? 'opening a delayed relationship editor can be cancelled' : 'a delayed relationship editor does not open after another client changes the draft', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Relationship race', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nAsset|Record|An asset.|\nDevice|Record|A device.|asset:Asset?\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  let release, observed;
  const gate = new Promise(resolve => { release = resolve; });
  const intercepted = new Promise(resolve => { observed = resolve; });
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode); await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByLabel('Search model').fill('Device'); await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram' }).click();
    const picker = page.getByLabel('Inspect relationship');
    await picker.selectOption(await picker.locator('option').filter({ hasText: /Device.*asset.*Asset/ }).getAttribute('value'));
    await page.getByRole('region', { name: 'Relationship details' }).getByRole('button', { name: 'Inspect target Asset' }).click();
    await page.route('**/mcp', async route => {
      const params = route.request().postDataJSON()?.params;
      if (params?.name === 'ontology_entity_get' && params.arguments?.name === 'Device' && params.arguments?.expectedRevision === 0) {
        const response = await route.fetch(); observed(); await gate; await route.fulfill({ response }).catch(() => {});
      } else await route.continue();
    });
    await page.getByRole('button', { name: 'Edit relationship asset' }).click();
    await intercepted;
    await expect(page.getByText('Loading Device.asset for editing…').locator('visible=true')).toBeVisible();
    if (cancel) await page.getByRole('button', { name: 'Cancel opening relationship editor' }).click();
    else {
      store.apply({ workspaceId: workspace.id, actor: 'other-client', operationId: 'race-edit', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Device', definition: 'A revised device.' }] });
      await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 1');
    }
    release(); await page.unrouteAll({ behavior: 'wait' });
    await expect(page.getByRole('heading', { name: 'Edit field contract' })).toHaveCount(0);
    if (!cancel) await expect(page.getByText('The workspace changed while opening the relationship. Inspect it again before editing.')).toBeVisible();
    expect(store.get(workspace.id).schema).toContain('asset:Asset?');
  } finally { release(); await page.unrouteAll({ behavior: 'wait' }); await page.close(); await service.shutdown(); store.close(); }
});

test('diagram editing preserves unfinished inspector input', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Relationship draft guard', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nAsset|Record|An asset.|\nDevice|Record|A device.|asset:Asset?\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode); await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByLabel('Search model').fill('Device'); await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    const definition = page.getByRole('textbox', { name: 'Definition', exact: true });
    await definition.fill('An unfinished definition.');
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram' }).click();
    const picker = page.getByLabel('Inspect relationship');
    await picker.selectOption(await picker.locator('option').filter({ hasText: /Device.*asset.*Asset/ }).getAttribute('value'));
    await page.getByRole('button', { name: 'Edit relationship asset' }).click();
    await expect(page.getByText('Apply or discard the current inspector input before editing a relationship.')).toBeVisible();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await expect(definition).toHaveValue('An unfinished definition.');
    await expect(page.getByRole('heading', { name: 'Edit field contract' })).toHaveCount(0);
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('a failed relationship source read can be retried', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Relationship retry', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nAsset|Record|An asset.|\nDevice|Record|A device.|asset:Asset?\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  let failed = false;
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode); await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByLabel('Search model').fill('Device'); await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram' }).click();
    const picker = page.getByLabel('Inspect relationship');
    await picker.selectOption(await picker.locator('option').filter({ hasText: /Device.*asset.*Asset/ }).getAttribute('value'));
    await page.getByRole('region', { name: 'Relationship details' }).getByRole('button', { name: 'Inspect target Asset' }).click();
    await page.route('**/mcp', async route => {
      const params = route.request().postDataJSON()?.params;
      if (!failed && params?.name === 'ontology_entity_get' && params.arguments?.name === 'Device') { failed = true; await route.abort('failed'); }
      else await route.continue();
    });
    await page.getByRole('button', { name: 'Edit relationship asset' }).click();
    await expect.poll(() => failed).toBe(true);
    await expect(page.getByText('Loading Device.asset for editing…').locator('visible=true')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Edit field contract' })).toHaveCount(0);
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram' }).click();
    await page.getByRole('button', { name: 'Edit relationship asset' }).click();
    await expect(page.getByRole('heading', { name: 'Edit field contract' })).toBeVisible();
    await expect(page.getByLabel('New datatype or target class')).toHaveValue('Asset');
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.unrouteAll({ behavior: 'wait' }); await page.close(); await service.shutdown(); store.close(); }
});

test('the relationship list opens the shared editor with the keyboard', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Relationship list', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nAsset|Record|An asset.|\nDevice|Record|A device.|asset:Asset?\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode); await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByLabel('Search model').fill('Device'); await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    if (isMobile) {
      await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram' }).click();
      if (!await page.locator('.studio-compact-relationships').evaluate(element => element.open)) await page.getByText(/Relationship list \(/).click();
    }
    const list = page.getByRole('region', { name: 'Relationship list for Device' });
    const edit = list.getByRole('button', { name: 'Edit relationship Device asset Asset' });
    await edit.focus(); await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'Edit field contract' })).toBeVisible();
    await expect(page.getByLabel('New datatype or target class')).toHaveValue('Asset');
    await page.getByRole('button', { name: 'Cancel field edit' }).click();
    const returnTarget = isMobile ? page.getByRole('button', { name: 'Edit asset', exact: true }) : edit;
    await expect(returnTarget).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'Edit field contract' })).toBeVisible();
    await page.getByLabel('New cardinality').selectOption('!');
    await page.getByRole('button', { name: 'Update field contract' }).click();
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 1');
    expect(store.get(workspace.id).schema).toContain('asset:Asset!');
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
