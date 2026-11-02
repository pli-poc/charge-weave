import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('concept form retains its labelled group and disables it while applying', async ({ page, isMobile }) => {
  if (isMobile) await page.setViewportSize({ width: 320, height: 800 });
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Form groups', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  let release, intercepted;
  const gate = new Promise(resolve => { release = resolve; });
  const observed = new Promise(resolve => { intercepted = resolve; });
  const delayApply = async route => {
    if (route.request().postDataJSON()?.params?.name === 'ontology_changeset_apply') {
      const response = await route.fetch();
      intercepted(); await gate;
      await route.fulfill({ response }).catch(() => {});
    } else await route.continue();
  };
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram' }).click();
    const creator = page.locator('#studio-concept-creator');
    const summary = creator.getByText('Add a concept', { exact: true });
    await summary.click();
    const group = creator.getByRole('group', { name: 'Model change' });
    await expect(group).toBeVisible();
    const groupBox = await group.boundingBox();
    expect(groupBox.width).toBeGreaterThan(0);
    expect(groupBox.height).toBeGreaterThan(0);
    await summary.focus();
    await page.keyboard.press('Tab');
    const name = group.getByLabel('Class name');
    await expect(name).toBeFocused();
    await name.fill('ServiceUnit');
    await group.getByLabel('Class definition').fill('A reusable service unit.');
    await page.route('**/mcp', delayApply);
    await group.getByRole('button', { name: 'Add concept' }).click();
    await observed;
    await expect(group).toHaveAttribute('disabled', '');
    await expect(name).toBeDisabled();
    release();
    await expect(page.getByRole('region', { name: 'Workspace status' })).toContainText('Revision 1');
    expect(store.get(workspace.id).revision).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  } finally { release(); await page.unroute('**/mcp', delayApply); await page.close(); await service.shutdown(); store.close(); }
});
