import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { WorkspaceStore } from '../src/workspace.js';

// Diagnostic measurements, not a UI latency or performance acceptance test.
const iterations = 50;
const synthetic = `MODULE|foundation\nRecord|root|A record.|\n${Array.from({ length: 1000 }, (_, i) => `Asset${String(i).padStart(4, '0')}|Record|Synthetic asset.|assetCode${i}:string?`).join('\n')}\n`;
const actual = readFileSync(new URL('../../model/domain.schema', import.meta.url), 'utf8');
const store = new WorkspaceStore(':memory:');
function percentile(values, fraction) {
  const ordered = [...values].sort((a, b) => a - b);
  return Number(ordered[Math.ceil(ordered.length * fraction) - 1].toFixed(2));
}
function measure(title, schema, query) {
  const workspace = store.create({ title, baselineCommit: 'a'.repeat(40), schema });
  const before = performance.now();
  const cold = store.searchFields(workspace.id, query, 0, 0, 25);
  const coldMs = performance.now() - before;
  const times = [];
  for (let i = 0; i < iterations; i += 1) {
    const start = performance.now();
    const page = store.searchFields(workspace.id, query, 0, 0, 25);
    times.push(performance.now() - start);
    if (page.total !== cold.total || page.results.length > 25) throw new Error('Inconsistent bounded search result');
  }
  return { fixture: title, matchingDeclarations: cold.total, returned: cold.results.length, iterations, coldMs: Number(coldMs.toFixed(2)), warmP50Ms: percentile(times, 0.5), warmP95Ms: percentile(times, 0.95) };
}
try {
  console.log(JSON.stringify({ node: process.version, platform: process.platform, architecture: process.arch, scope: 'In-memory backend field-search calls only; excludes transport, browser rendering and user-perceived latency.', measurements: [measure('repository schema', actual, 'station'), measure('synthetic 1000-concept schema', synthetic, 'assetCode')] }, null, 2));
} finally { store.close(); }
