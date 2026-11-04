import { createServer } from 'node:http';
import { readFileSync, readdirSync } from 'node:fs';
import { once } from 'node:events';
import { cpus } from 'node:os';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { chromium } from '../node_modules/playwright/index.mjs';

const assets = fileURLToPath(new URL('../dist/assets/', import.meta.url));
const file = readdirSync(assets).find(name => /^layout\.worker-.*\.js$/.test(name));
if (!file) throw new Error('Build the website before measuring the actual layout worker');
const workerSource = readFileSync(resolve(assets, file));
const server = createServer((request, response) => {
  if (request.url === '/worker.js') { response.writeHead(200, { 'Content-Type': 'text/javascript' }); response.end(workerSource); }
  else { response.writeHead(200, { 'Content-Type': 'text/html' }); response.end('<!doctype html><title>Layout measurement</title>'); }
});
server.listen(0, '127.0.0.1'); await once(server, 'listening');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage(); await page.goto(`http://127.0.0.1:${server.address().port}/`);
  const result = await page.evaluate(async () => {
    const nodes = Array.from({ length: 150 }, (_, i) => `node-${i}`);
    const edges = [];
    for (let i = 0; i < 149; i++) edges.push({ id: `edge-${i}`, source: nodes[i], target: nodes[i + 1] });
    for (let i = 0; i < 50; i++) edges.push({ id: `cross-${i}`, source: nodes[i], target: nodes[i + 3] });
    const worker = new Worker('/worker.js'); const times = [];
    for (let i = 0; i < 15; i++) {
      const start = performance.now();
      const result = await new Promise((resolve, reject) => {
        worker.onmessage = event => event.data.error ? reject(new Error(event.data.error)) : resolve(event.data);
        worker.onerror = reject;
        worker.postMessage({ requestId: i, nodes, edges });
      });
      if (result.positions.length !== nodes.length) throw new Error('Incomplete layout');
      if (i >= 3) times.push(performance.now() - start);
    }
    worker.terminate(); times.sort((a, b) => a - b);
    return { nodes: nodes.length, edges: edges.length, warmup: 3, samples: times.length, p50Ms: times[Math.floor(times.length * 0.5)], p95Ms: times[Math.ceil(times.length * 0.95) - 1], maxMs: times.at(-1) };
  });
  console.log(JSON.stringify({ ...result, browser: browser.version(), node: process.version, cpu: cpus()[0]?.model, scope: 'synthetic 150-node, 199-edge directed graph; actual built worker, messaging and layout; does not measure UI rendering' }));
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
