import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('validation actions are disabled while the studio reconnects', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Offline checks', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, repository: '.', staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Results' }).click();
    const checks = page.getByRole('navigation', { name: 'Results panels' }).getByRole('button', { name: 'Checks', exact: true });
    if (await checks.getAttribute('aria-pressed') !== 'true') await checks.click();
    const start = page.getByRole('button', { name: 'Run structural check' });
    await expect(start).toBeEnabled();
    await page.route('**/events?**', route => route.abort());
    await page.route('**/mcp', route => route.abort());
    service.closeAllConnections();
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('Reconnecting');
    await expect(start).toBeDisabled();
    await page.unroute('**/mcp'); await page.unroute('**/events?**');
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('Connected');
    await expect(start).toBeEnabled();
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
