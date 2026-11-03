import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { once } from 'node:events';
import { resolve } from 'node:path';
import { chromium } from '../node_modules/playwright/index.mjs';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

const repository = resolve(process.env.CHARGEWEAVE_REPOSITORY ?? '..');
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim();
const output = resolve(repository, 'evidence/ontology-studio/ide'); mkdirSync(output, { recursive: true });
const schema = 'MODULE|foundation\nRecord|root|Identifiable domain record.|\nChargingStation|Record|A station.|site:Site?\nSite|Record|A physical site.|\n';
const store = new WorkspaceStore(':memory:');
const workspace = store.create({ title: 'Synthetic workflow evidence', baselineCommit: commit, schema });
const { job } = store.createJob(workspace.id, 0, workspace.sourceDigest, 'synthetic-reviewer', 'synthetic-check', 'structural');
store.startJobStep(job.id, 0, 'synthetic-structural-check');
store.finishJobStep(job.id, 0, 'failed', 'Synthetic example: inspect the candidate and rerun the check.');
store.updateJob(job.id, 'failed');
const pairingCode = 'synthetic-pairing-code-'.repeat(2);
const service = createHttpService({ store, token: 'synthetic-evidence-token-'.repeat(2), pairingCode, workspaceId: workspace.id, repository, staticDirectory: resolve(repository, 'website/dist') });
service.listen(0, '127.0.0.1'); await once(service, 'listening');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
  async function capture(name) {
    for (const theme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await page.waitForFunction(value => document.documentElement.dataset.studioTheme === value, theme);
      await page.screenshot({ path: resolve(output, `${name}-1280-${theme}.png`), animations: 'disabled' });
    }
  }
  await capture('welcome');
  await page.getByLabel('Pairing code').fill(pairingCode); await page.getByRole('button', { name: 'Pair local studio' }).click();
  await page.getByLabel('Search model').fill('ChargingStation'); await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByRole('button', { name: 'ChargingStation', exact: true }).click();
  await page.getByText(/Latest structural operation: failed/).waitFor();
  const problems = page.getByRole('navigation', { name: 'Results panels' }).getByRole('button', { name: /Problems/ });
  if (await problems.getAttribute('aria-pressed') === 'true') await problems.click();
  await page.getByRole('button', { name: 'Show inspector' }).click();
  await page.getByRole('button', { name: 'Edit site', exact: true }).click();
  await page.getByRole('heading', { name: 'Edit field contract' }).waitFor();
  await capture('relationship-editor');
  await page.getByRole('button', { name: 'Cancel field edit' }).click();
  await page.getByRole('button', { name: 'Hide inspector' }).click();
  if (await problems.getAttribute('aria-pressed') !== 'true') await problems.click();
  await page.getByRole('region', { name: 'Problems' }).getByText('synthetic-structural-check', { exact: true }).waitFor();
  await capture('problems');
  await problems.click();
  await page.getByRole('button', { name: 'Review draft changes' }).click();
  await page.getByRole('heading', { name: 'Review workflow' }).waitFor();
  await capture('review');
  await page.close();
  console.log(JSON.stringify({ commit, browser: browser.version(), fixture: 'synthetic workspace and failed check', captures: 8 }));
} finally { await browser.close(); await service.shutdown(); store.close(); }
