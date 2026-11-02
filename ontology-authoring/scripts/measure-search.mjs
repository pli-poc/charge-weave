import { execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { cpus, platform, release } from 'node:os';
import { resolve } from 'node:path';
import { WorkspaceStore } from '../src/workspace.js';
import { createHttpService } from '../src/http.js';

const repo = resolve(process.env.CHARGEWEAVE_REPOSITORY ?? '..');
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim();
const schema = execFileSync('git', ['show', `${commit}:model/domain.schema`], { cwd: repo, encoding: 'utf8' });
const store = new WorkspaceStore(':memory:');
const workspace = store.create({ title: 'Synthetic performance measurement', baselineCommit: commit, schema });
const token = 'synthetic-measurement-token-'.repeat(2);
const service = createHttpService({ store, token, workspaceId: workspace.id });
service.listen(0, '127.0.0.1'); await once(service, 'listening');
const endpoint = `http://127.0.0.1:${service.address().port}/mcp`;
async function search() {
  const start = performance.now();
  const response = await fetch(endpoint, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'MCP-Protocol-Version': '2025-06-18' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'ontology_context_search', arguments: { workspaceId: workspace.id, query: 'charging', limit: 25 } } }) });
  const result = await response.json();
  if (!response.ok || result.error || result.result?.isError) throw new Error('Search measurement failed');
  return performance.now() - start;
}
try {
  for (let i = 0; i < 5; i++) await search();
  const samples = []; for (let i = 0; i < 30; i++) samples.push(await search());
  samples.sort((a, b) => a - b);
  console.log(JSON.stringify({ commit, node: process.version, os: `${platform()} ${release()}`, cpu: cpus()[0]?.model, samples: samples.length, warmup: 5, p50Ms: samples[14], p95Ms: samples[Math.ceil(samples.length * 0.95) - 1], maxMs: samples.at(-1), scope: 'HTTP MCP search only; excludes browser rendering and model inference' }));
} finally { await service.shutdown(); store.close(); }
