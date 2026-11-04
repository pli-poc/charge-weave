import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('results activity can be scrolled with the keyboard', async ({ page, isMobile }) => {
  if (isMobile) await page.setViewportSize({ width: 320, height: 800 });
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Results scrolling', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  for (let revision = 0; revision < 10; revision++) {
    store.apply({ workspaceId: workspace.id, actor: 'test', operationId: `edit-${revision}`, expectedRevision: revision, commands: [{ type: 'class.describe', name: 'Record', definition: `Record definition ${revision}.` }] });
  }
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, repository: '.', staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Results' }).click();
    const results = page.getByRole('region', { name: 'Workspace results' });
    await results.getByRole('button', { name: 'Activity', exact: true }).click();
    const content = results.getByRole('region', { name: 'Results content' });
    await expect(results.getByText('Showing the latest 10 of 10 loaded workspace events. The service retains up to 100 in this view.')).toBeVisible();
    expect(await content.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
    await results.getByRole('button', { name: 'Close results panel' }).focus();
    await page.keyboard.press('Tab');
    await expect(content).toBeFocused();
    await expect(content).toHaveCSS('outline-style', 'solid');
    await page.keyboard.press('PageDown');
    await expect.poll(() => content.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
    expect(store.get(workspace.id).revision).toBe(10);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
