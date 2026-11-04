import { execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { cpus, platform, release } from 'node:os';
import { resolve } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { WorkspaceStore } from '../src/workspace.js';
import { createHttpService } from '../src/http.js';

// Measure the real MCP acknowledgement while a controlled runner stays busy.
// The synthetic runner deliberately performs no validation.
const repository = resolve(process.env.CHARGEWEAVE_REPOSITORY ?? '..');
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim();
const schema = execFileSync('git', ['show', `${commit}:model/domain.schema`], { cwd: repository, encoding: 'utf8' });
const store = new WorkspaceStore(':memory:');
const workspace = store.create({ title: 'Synthetic job acknowledgement', baselineCommit: commit, schema });
const token = 'synthetic-measurement-token-'.repeat(2);
let releaseJob;
const service = createHttpService({ store, token, repository, workspaceId: workspace.id, validationRunner: async (target, _input, job) => {
  await new Promise(resolveJob => { releaseJob = resolveJob; });
  target.updateJob(job.id, 'passed');
} });
service.listen(0, '127.0.0.1'); await once(service, 'listening');
const client = new Client({ name: 'synthetic-job-acknowledgement', version: '1' });
try {
  await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${service.address().port}/mcp`), { requestInit: { headers: { authorization: `Bearer ${token}` } } }));
  const samples = [];
  for (let i = 0; i < 35; i++) {
    const start = performance.now();
    const result = await client.callTool({ name: 'ontology_validation_start', arguments: { workspaceId: workspace.id, operationId: `ack-${i}`, expectedRevision: workspace.revision, sourceDigest: workspace.sourceDigest, profile: 'structural' } });
    const elapsed = performance.now() - start;
    if (result.isError || !releaseJob) throw new Error(`Job was not acknowledged while the runner was active: ${JSON.stringify(result)}`);
    if (i >= 5) samples.push(elapsed);
    releaseJob(); releaseJob = null;
    // Wait for the controlled runner to finish before starting another job.
    await new Promise(resolveTurn => setImmediate(resolveTurn));
  }
  samples.sort((a, b) => a - b);
  console.log(JSON.stringify({ commit, node: process.version, os: `${platform()} ${release()}`, cpu: cpus()[0]?.model, warmup: 5, samples: samples.length, p50Ms: samples[14], p95Ms: samples[28], maxMs: samples.at(-1), scope: 'Loopback MCP validation-start acknowledgement with a controlled in-memory runner held until the response; no validation work performed' }));
} finally { releaseJob?.(); await client.close(); await service.shutdown(); store.close(); }
