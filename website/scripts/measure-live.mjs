import { execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { cpus, platform, release } from 'node:os';
import { resolve } from 'node:path';
import { chromium } from '../node_modules/playwright/index.mjs';
import { Client } from '../../ontology-authoring/node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js';
import { StreamableHTTPClientTransport } from '../../ontology-authoring/node_modules/@modelcontextprotocol/sdk/dist/esm/client/streamableHttp.js';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

const repo = resolve(process.env.CHARGEWEAVE_REPOSITORY ?? '..');
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim();
const schema = execFileSync('git', ['show', `${commit}:model/domain.schema`], { cwd: repo, encoding: 'utf8' });
const store = new WorkspaceStore(':memory:');
const workspace = store.create({ title: 'Synthetic latency measurement', baselineCommit: commit, schema });
const token = 'synthetic-measurement-token-'.repeat(2), pairingCode = 'synthetic-pairing-code-'.repeat(2);
const graphMode = process.argv.includes('--graph');
const service = createHttpService({ store, token, pairingCode, workspaceId: workspace.id, staticDirectory: resolve(repo, 'website/dist') });
service.listen(0, '127.0.0.1'); await once(service, 'listening');
const origin = `http://127.0.0.1:${service.address().port}`;
const client = new Client({ name: 'synthetic-latency', version: '1' });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
try {
  await client.connect(new StreamableHTTPClientTransport(new URL(`${origin}/mcp`), { requestInit: { headers: { authorization: `Bearer ${token}` } } }));
  await page.goto(`${origin}/charge-weave-app/modelling/`);
  await page.getByLabel('Pairing code').fill(pairingCode); await page.getByRole('button', { name: 'Pair local studio' }).click();
  await page.getByRole('button', { name: 'Search', exact: true }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'Search', exact: true }).waitFor({ state: 'attached' });
  await page.waitForFunction(() => { const workspace = document.querySelector('fieldset.studio-workspace'); return workspace && !workspace.disabled; });
  if (graphMode) {
    await page.getByLabel('Search model').fill('Record'); await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Record', exact: true }).click();
    await page.getByRole('region', { name: 'Relationships for Record' }).waitFor({ state: 'visible' });
  }
  const times = [];
  for (let i = 0; i < 35; i++) {
    const expected = i + 1, start = performance.now();
    const name = `latencyRelationship${i}`;
    const command = graphMode ? { type: 'relationship.add', owner: 'Record', name, range: 'ChargingStation', cardinality: '?' } : { type: 'class.describe', name: 'Record', definition: `Synthetic latency measurement ${i}.` };
    const result = await client.callTool({ name: 'ontology_changeset_apply', arguments: { workspaceId: workspace.id, operationId: `latency-${i}`, expectedRevision: i, commands: [command] } });
    if (result.isError) throw new Error('Measurement mutation failed');
    await page.waitForFunction(value => new RegExp(`revision ${value}(?:\\s|$)`).test(document.querySelector('[role=status]')?.textContent ?? ''), expected);
    if (graphMode) await page.locator('.react-flow__edge-text').filter({ hasText: name }).waitFor({ state: 'visible' });
    if (i >= 5) times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  console.log(JSON.stringify({ commit, node: process.version, os: `${platform()} ${release()}`, cpu: cpus()[0]?.model, browser: browser.version(), samples: times.length, warmup: 5, p50Ms: times[14], p95Ms: times[Math.ceil(times.length * 0.95) - 1], maxMs: times.at(-1), scope: graphMode ? 'MCP relationship edit start to visible graph edge in second browser client; excludes model inference' : 'MCP edit start to visible revision in second browser client; no graph selected; excludes model inference', ...(graphMode ? { graphNodes: await page.locator('.react-flow__node').count(), graphEdges: await page.locator('.react-flow__edge').count() } : {}) }));
} finally { await page.close(); await browser.close(); await client.close(); await service.shutdown(); store.close(); }
