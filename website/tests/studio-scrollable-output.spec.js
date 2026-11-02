import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('long validation output and historical patches are reachable by keyboard', async ({ page, isMobile }) => {
  if (isMobile) await page.setViewportSize({ width: 320, height: 800 });
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Scrollable output', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  store.apply({ workspaceId: workspace.id, actor: 'test', operationId: 'history', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Record', definition: 'A revised record.' }] });
  const output = Array.from({ length: 200 }, (_, index) => `Recorded diagnostic ${index}: synthetic validation evidence.`).join('\n');
  const validationRunner = async (target, input, job) => {
    target.startJobStep(job.id, 0, 'tools/example-check.py');
    target.finishJobStep(job.id, 0, 'failed', output);
    target.updateJob(job.id, 'failed', output);
  };
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, repository: '.', validationRunner, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('button', { name: 'Check draft', exact: true }).click();
    await expect(page.getByText(/Latest structural operation: failed/)).toBeVisible();
    await page.getByRole('button', { name: 'View check details' }).click();
    const issues = page.getByRole('region', { name: 'Validation issues' });
    await issues.getByText('Recorded check output', { exact: true }).click();
    const recorded = issues.getByRole('region', { name: 'Recorded output: tools/example-check.py' });
    await expect(recorded).toBeVisible();
    expect(await recorded.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
    await recorded.focus();
    await expect(recorded).toBeFocused();
    await recorded.press('PageDown');
    await expect.poll(() => recorded.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
    const results = page.getByRole('region', { name: 'Workspace results' });
    await results.getByRole('button', { name: 'Output', exact: true }).click();
    const jobOutput = results.getByRole('region', { name: 'Recorded job output' });
    await jobOutput.focus();
    await expect(jobOutput).toBeFocused();
    await jobOutput.press('PageDown');
    await expect.poll(() => jobOutput.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
    await results.getByRole('button', { name: 'Activity', exact: true }).click();
    await results.getByRole('button', { name: 'Inspect revision 1' }).click();
    const patch = results.getByRole('region', { name: 'Historical command group patch' });
    await patch.focus();
    await expect(patch).toBeFocused();
    expect(store.get(workspace.id).revision).toBe(1);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
