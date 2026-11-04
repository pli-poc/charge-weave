import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

for (const status of ['running', 'interrupted']) {
  test(`an ${status} validation is not presented as passing`, async ({ page, isMobile }) => {
    const store = new WorkspaceStore(':memory:');
    const workspace = store.create({ title: 'Incomplete check', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
    const { job } = store.createJob(workspace.id, 0, workspace.sourceDigest, 'tester', `check-${status}`, 'structural');
    store.updateJob(job.id, status);
    const pairingCode = 'synthetic-pairing-code-'.repeat(2);
    const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, repository: '.', staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
    service.listen(0, '127.0.0.1'); await once(service, 'listening');
    try {
      await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
      await page.getByLabel('Pairing code').fill(pairingCode);
      await page.getByRole('button', { name: 'Pair local studio' }).click();
      if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Results' }).click();
      const dock = page.getByRole('region', { name: 'Results content' });
      await page.getByRole('navigation', { name: 'Results panels' }).getByRole('button', { name: 'Problems', exact: true }).click();
      const message = status === 'running' ? 'This check has not finished. No failed step has been reported yet.' : 'This check did not finish. No failed step was reported; the draft has not passed this check.';
      await expect(dock.getByRole('region', { name: 'Problems' }).getByText(message)).toBeVisible();
      await page.getByRole('navigation', { name: 'Results panels' }).getByRole('button', { name: 'Checks', exact: true }).click();
      await expect(dock.getByRole('region', { name: 'Validation issues' }).getByText(message)).toBeVisible();
    } finally { await page.close(); await service.shutdown(); store.close(); }
  });
}
