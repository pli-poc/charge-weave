import { execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { cpus, platform, release } from 'node:os';
import { resolve } from 'node:path';
import { chromium } from '../node_modules/playwright/index.mjs';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

const repository = resolve(process.env.CHARGEWEAVE_REPOSITORY ?? '..');
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim();
const schema = execFileSync('git', ['show', `${commit}:model/domain.schema`], { cwd: repository, encoding: 'utf8' });
const store = new WorkspaceStore(':memory:');
const workspace = store.create({ title: 'Synthetic reconnect measurement', baselineCommit: commit, schema });
const token = 'synthetic-measurement-token-'.repeat(2), pairingCode = 'synthetic-pairing-code-'.repeat(2);
const service = createHttpService({ store, token, pairingCode, workspaceId: workspace.id, staticDirectory: resolve(repository, 'website/dist') });
service.listen(0, '127.0.0.1'); await once(service, 'listening');
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
try {
  await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
  await page.getByLabel('Pairing code').fill(pairingCode);
  await page.getByRole('button', { name: 'Pair local studio' }).click();
  const status = page.getByRole('status', { name: 'Studio connection status' });
  await status.waitFor();
  await page.waitForFunction(() => /Connected/.test(document.querySelector('[aria-label="Studio connection status"]')?.textContent ?? ''));
  const samples = [];
  for (let i = 0; i < 12; i++) {
    await page.route('**/events?**', route => route.abort());
    await page.route('**/mcp', route => route.abort());
    service.closeAllConnections();
    await page.waitForFunction(() => /Reconnecting/.test(document.querySelector('[aria-label="Studio connection status"]')?.textContent ?? ''));
    store.apply({ workspaceId: workspace.id, actor: 'measurement', operationId: `offline-${i}`, expectedRevision: i, commands: [{ type: 'class.describe', name: 'Record', definition: `Synthetic offline edit ${i}.` }] });
    const start = performance.now();
    await page.unroute('**/mcp'); await page.unroute('**/events?**');
    await page.waitForFunction(revision => {
      const text = document.querySelector('[aria-label="Studio connection status"]')?.textContent ?? '';
      return /Connected/.test(text) && new RegExp(`revision ${revision}(?:\\s|$)`).test(text);
    }, i + 1);
    if (i >= 2) samples.push(performance.now() - start);
  }
  samples.sort((a, b) => a - b);
  console.log(JSON.stringify({ commit, node: process.version, os: `${platform()} ${release()}`, cpu: cpus()[0]?.model, browser: browser.version(), samples: samples.length, warmup: 2, p50Ms: samples[4], p95Ms: samples[9], maxMs: samples.at(-1), scope: 'Restoring browser access to connected status and latest revision after one synthetic offline edit; loopback service remains running, no graph selected' }));
} finally { await page.close(); await browser.close(); await service.shutdown(); store.close(); }
