import { execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { cpus, totalmem } from 'node:os';
import { resolve } from 'node:path';
import { chromium } from '../node_modules/playwright/index.mjs';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

// Isolated diagnostic: each sample pairs a fresh browser context with an in-memory workspace.
const repo = resolve(process.env.CHARGEWEAVE_REPOSITORY ?? '..');
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim();
const workingTreeDirty = Boolean(execFileSync('git', ['status', '--porcelain', '--', 'website/src', 'ontology-authoring/src'], { cwd: repo, encoding: 'utf8' }).trim());
const schema = execFileSync('git', ['show', `${commit}:model/domain.schema`], { cwd: repo, encoding: 'utf8' });
const store = new WorkspaceStore(':memory:');
const workspace = store.create({ title: 'Synthetic load measurement', baselineCommit: commit, schema });
const pairingCode = 'synthetic-pairing-code-'.repeat(2);
const browser = await chromium.launch({ headless: true });
const times = [], viewTimes = [], journeyTimes = [];
try {
  for (let i = 0; i < 11; i += 1) {
    const service = createHttpService({ store, token: 'synthetic-measurement-token-'.repeat(2), pairingCode, workspaceId: workspace.id, staticDirectory: resolve(repo, 'website/dist') });
    service.listen(0, '127.0.0.1'); await once(service, 'listening');
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    try {
      const page = await context.newPage();
      const journeyStart = performance.now();
      await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
      await page.getByLabel('Pairing code').fill(pairingCode);
      const start = performance.now();
      await page.getByRole('button', { name: 'Pair local studio' }).click();
      await page.getByRole('list', { name: 'Loaded concepts by module' }).waitFor({ state: 'visible' });
      times.push(performance.now() - start);
      await page.getByLabel('Search model').fill('ChargingStation');
      await page.getByRole('button', { name: 'Search', exact: true }).click();
      const concept = page.getByRole('button', { name: 'ChargingStation', exact: true });
      await concept.waitFor({ state: 'visible' });
      const viewStart = performance.now();
      await concept.click();
      await page.locator('.studio-flow[data-layout="ready"]').waitFor({ state: 'visible' });
      viewTimes.push(performance.now() - viewStart);
      journeyTimes.push(performance.now() - journeyStart);
    } finally { await context.close(); await service.shutdown(); }
  }
  const warm = times.slice(1).sort((a, b) => a - b);
  const warmViews = viewTimes.slice(1).sort((a, b) => a - b);
  const warmJourneys = journeyTimes.slice(1).sort((a, b) => a - b);
  const summary = values => ({ p50Ms: Number(((values[4] + values[5]) / 2).toFixed(2)), p95Ms: Number(values[Math.ceil(values.length * .95) - 1].toFixed(2)), maxMs: Number(values.at(-1).toFixed(2)) });
  console.log(JSON.stringify({ commit, workingTreeDirty, buildNote: 'Build identity is not independently verified; build the website immediately before measuring.', node: process.version, platform: process.platform, architecture: process.arch, cpu: cpus()[0]?.model, memoryGiB: Number((totalmem() / 2 ** 30).toFixed(1)), browser: browser.version(), coldExplorerMs: Number(times[0].toFixed(2)), coldViewMs: Number(viewTimes[0].toFixed(2)), coldJourneyMs: Number(journeyTimes[0].toFixed(2)), warmSamples: warm.length, warmExplorer: summary(warm), warmView: summary(warmViews), warmJourney: summary(warmJourneys), scope: 'Pairing click to visible bounded explorer and separately selecting ChargingStation from search results to ready diagram; journey additionally includes page load, automated pairing input and search. The initial screen does not automatically open a diagram. Warm samples reuse the workspace store and browser process but use a fresh HTTP service and browser context for one-use pairing; all samples exclude service startup and human input.' }, null, 2));
} finally { await browser.close(); store.close(); }
