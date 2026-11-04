import { execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { resolve } from 'node:path';
import { chromium } from '../node_modules/playwright/index.mjs';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

// Isolated local diagnostic: no existing workspace, user data or production credentials.
const repo = resolve(process.env.CHARGEWEAVE_REPOSITORY ?? '..');
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim();
const workingTreeDirty = Boolean(execFileSync('git', ['status', '--porcelain', '--', 'website/src', 'ontology-authoring/src'], { cwd: repo, encoding: 'utf8' }).trim());
const schema = execFileSync('git', ['show', `${commit}:model/domain.schema`], { cwd: repo, encoding: 'utf8' });
const store = new WorkspaceStore(':memory:');
const workspace = store.create({ title: 'Synthetic search measurement', baselineCommit: commit, schema });
const token = 'synthetic-measurement-token-'.repeat(2), pairingCode = 'synthetic-pairing-code-'.repeat(2);
const service = createHttpService({ store, token, pairingCode, workspaceId: workspace.id, staticDirectory: resolve(repo, 'website/dist') });
service.listen(0, '127.0.0.1'); await once(service, 'listening');
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const queries = ['chargingstation', 'tariff'].map(query => ({ query, result: store.searchFields(workspace.id, query, 0, 0, 25) }));
try {
  if (queries.some(item => !item.result.results.length)) throw new Error('Measurement queries must have matching fields');
  await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
  await page.getByLabel('Pairing code').fill(pairingCode);
  await page.getByRole('button', { name: 'Pair local studio' }).click();
  await page.getByText('Properties and relationships', { exact: true }).click();
  const panel = page.locator('details').filter({ has: page.getByText('Properties and relationships', { exact: true }) });
  const times = [];
  for (let i = 0; i < 35; i += 1) {
    const { query, result } = queries[i % queries.length];
    await page.getByLabel('Find properties or relationships').fill(query);
    const start = performance.now();
    await page.getByRole('button', { name: 'Search fields', exact: true }).click();
    await panel.getByText(`Showing ${result.results.length} of ${result.total} declared fields.`, { exact: true }).waitFor({ state: 'visible' });
    await panel.getByRole('listitem').first().getByText(result.results[0].name, { exact: true }).waitFor({ state: 'visible' });
    if (i >= 5) times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  console.log(JSON.stringify({ commit, workingTreeDirty, buildNote: 'Build identity is not independently verified; build the website immediately before measuring.', node: process.version, platform: process.platform, architecture: process.arch, browser: browser.version(), samples: times.length, warmup: 5, p50Ms: Number(times[14].toFixed(2)), p95Ms: Number(times[Math.ceil(times.length * .95) - 1].toFixed(2)), maxMs: Number(times.at(-1).toFixed(2)), scope: 'Warm local field-search click to visible bounded results in headless Chromium, including MCP transport and rendering; excludes startup and model inference.' }, null, 2));
} finally { await page.close(); await browser.close(); await service.shutdown(); store.close(); }
