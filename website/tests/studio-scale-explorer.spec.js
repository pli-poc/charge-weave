import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('large explorer stays paged and supports keyboard discovery', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const classes = Array.from({ length: 1000 }, (_, i) => `Asset${String(i).padStart(4, '0')}|Record|Synthetic asset.|`);
  const workspace = store.create({ title: 'Large explorer', baselineCommit: 'a'.repeat(40), schema: `MODULE|foundation\nRecord|root|A record.|\n${classes.join('\n')}\n` });
  const first = store.explore(workspace.id, { expectedRevision: 0, limit: 50 });
  const second = store.explore(workspace.id, { expectedRevision: 0, limit: 50, cursor: first.nextCursor });
  expect(first.total).toBe(1001);
  expect(first.results).toHaveLength(50);
  expect(second.results).toHaveLength(50);
  expect(second.results[0].name > first.results.at(-1).name).toBe(true);
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await expect(page.getByText('Showing 50 of 1001 concepts.')).toBeVisible();
    let failNextPage = true;
    await page.route('**/mcp', async (route, request) => {
      const body = request.postDataJSON();
      if (failNextPage && body?.method === 'tools/call' && body.params?.name === 'ontology_explorer_list' && body.params.arguments?.cursor) {
        failNextPage = false;
        await route.fulfill({ status: 503, body: 'Synthetic page failure' });
        return;
      }
      await route.continue();
    });
    await page.getByRole('button', { name: 'Load more concepts' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Could not load more concepts' })).toBeVisible();
    await expect(page.getByText('Showing 50 of 1001 concepts.')).toBeVisible();
    await page.getByRole('button', { name: 'Retry loading concepts' }).click();
    await expect(page.getByText('Showing 100 of 1001 concepts.')).toBeVisible();
    const query = page.getByLabel('Search model');
    await query.fill('Asset0999');
    await query.press('Enter');
    const result = page.getByRole('button', { name: 'Asset0999', exact: true });
    await expect(result).toBeVisible();
    await result.focus(); await result.press('Space');
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await expect(page.getByRole('heading', { name: 'Asset0999', exact: true })).toBeVisible();
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
