import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('identical failed steps are grouped without hiding distinct output', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Repeated checks', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const job = store.createJob(workspace.id, 0, workspace.sourceDigest, 'tester', 'check', 'structural').job;
  for (const [index, output] of ['Repeated failure', 'Repeated failure', 'Different failure'].entries()) {
    store.startJobStep(job.id, index, 'example-check');
    store.finishJobStep(job.id, index, 'failed', output);
  }
  store.updateJob(job.id, 'failed');
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, repository: '.', staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Results' }).click();
    await page.getByRole('button', { name: 'View check details' }).click();
    const issues = page.getByRole('region', { name: 'Validation issues' });
    await expect(issues.getByRole('heading', { name: 'Failed check: example-check' })).toHaveCount(2);
    await expect(issues.getByText('2 identical failures in this job.')).toBeVisible();
    await issues.getByLabel('Filter failed checks').fill('Different failure');
    await expect(issues.getByRole('heading', { name: 'Failed check: example-check' })).toHaveCount(1);
    await expect(issues.getByText('Showing 1 of 3 failed checks matching the filter.')).toBeVisible();
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
