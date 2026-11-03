import { execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { cpus, platform, release } from 'node:os';
import { resolve } from 'node:path';
import { chromium } from '../node_modules/playwright/index.mjs';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

// Exercise the built application, including its network reads, React and canvas.
// The bounded neighbourhood currently permits up to 50 outgoing and 100 incoming
// references, so this fixture reaches 150 edges rather than the 200-edge target.
const repo = resolve(process.env.CHARGEWEAVE_REPOSITORY ?? '..');
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim();
const typical = process.argv.includes('--typical');
const names = Array.from({ length: typical ? 49 : 150 }, (_, i) => `Synthetic${String(i).padStart(3, '0')}`);
const outgoing = typical ? 49 : 50;
const schema = ['MODULE|foundation', `Record|root|Synthetic root.|${names.slice(0, outgoing).map((name, i) => `out${i}:${name}?`).join(' ')}`, ...names.map((name, i) => `${name}|root|Synthetic concept.|${typical ? `in${i}a:Record? in${i}b:Record?` : i >= 50 ? `in${i}:Record?` : ''}`)].join('\n') + '\n';
const store = new WorkspaceStore(':memory:');
const workspace = store.create({ title: 'Synthetic canvas measurement', baselineCommit: commit, schema });
const pairingCode = 'synthetic-pairing-code-'.repeat(2);
const service = createHttpService({ store, token: 'synthetic-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: resolve(repo, 'website/dist') });
service.listen(0, '127.0.0.1'); await once(service, 'listening');
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
try {
  await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
  await page.getByLabel('Pairing code').fill(pairingCode);
  await page.getByRole('button', { name: 'Pair local studio' }).click();
  await page.getByRole('region', { name: 'Relationships for Record' }).waitFor();
  for (let i = 0; i < 4; i++) {
    const button = page.getByRole('button', { name: 'Show more outgoing' });
    await button.waitFor(); await button.click();
    await page.waitForFunction(n => document.querySelectorAll('.react-flow__edge').length >= n, Math.min(outgoing, 24 + i * 12));
  }
  await page.getByLabel('Show incoming references').check();
  await page.waitForFunction(n => document.querySelectorAll('.react-flow__edge').length >= n, outgoing + 20);
  const expansions = [];
  for (let i = 0; i < (typical ? 2 : 4); i++) {
    const button = page.getByRole('button', { name: 'Show more incoming' });
    await button.waitFor();
    const start = performance.now(); await button.click();
    await page.waitForFunction(n => document.querySelectorAll('.react-flow__edge').length >= n && document.querySelector('.studio-flow')?.dataset.layout === 'ready', outgoing + 40 + i * 20);
    expansions.push(performance.now() - start);
  }
  const canvas = page.locator('.react-flow__pane');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas is not visible');
  const startPoint = await page.evaluate(({ x, y, width, height }) => {
    for (let py = y + 25; py < y + height - 25; py += 20) for (let px = x + 25; px < x + width - 60; px += 20) {
      if (document.elementFromPoint(px, py)?.classList.contains('react-flow__pane')) return { x: px, y: py };
    }
    return null;
  }, box);
  if (!startPoint) throw new Error('No unobstructed canvas point for pan');
  const viewportBefore = await page.locator('.react-flow__viewport').getAttribute('style');
  await page.evaluate(() => { window.measureFrames = []; let previous = performance.now(); window.measureFrame = requestAnimationFrame(function sample(now) { window.measureFrames.push(now - previous); previous = now; window.measureFrame = requestAnimationFrame(sample); }); });
  await page.mouse.move(startPoint.x, startPoint.y); await page.mouse.down();
  for (let i = 0; i < 120; i++) await page.mouse.move(startPoint.x + 30 * Math.sin(i / 15), startPoint.y + 15 * Math.cos(i / 15), { steps: 1 });
  await page.mouse.up();
  const viewportAfter = await page.locator('.react-flow__viewport').getAttribute('style');
  if (viewportBefore === viewportAfter) throw new Error('The synthetic pan did not move the viewport');
  const frames = await page.evaluate(() => { cancelAnimationFrame(window.measureFrame); return window.measureFrames; });
  frames.sort((a, b) => a - b);
  console.log(JSON.stringify({ commit, node: process.version, os: `${platform()} ${release()}`, cpu: cpus()[0]?.model, browser: browser.version(), viewport: '1280x800', graphNodes: await page.locator('.react-flow__node').count(), graphEdges: await page.locator('.react-flow__edge').count(), incomingExpansionMs: expansions, frameSamples: frames.length, frameP95Ms: frames[Math.ceil(frames.length * 0.95) - 1], slowFramesOver22ms: frames.filter(ms => ms > 1000 / 45).length, scope: `Synthetic ${typical ? 'typical' : 'stress'} bounded neighbourhood in built app, headless Chromium; expansion includes server reads and DOM rendering. Pan frame intervals are an approximation, not physical-display frame rate. Single run.${typical ? '' : ' 150-edge cap falls short of 200-edge acceptance target.'}` }));
} finally { await page.close(); await browser.close(); await service.shutdown(); store.close(); }
