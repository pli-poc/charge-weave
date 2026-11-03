import { execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from '../node_modules/playwright/index.mjs';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

// Read only committed public model source and use an isolated in-memory draft.
const repository = resolve(process.env.CHARGEWEAVE_REPOSITORY ?? '..');
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim();
const schema = execFileSync('git', ['show', `${commit}:model/domain.schema`], { cwd: repository, encoding: 'utf8' });
const store = new WorkspaceStore(':memory:');
const workspace = store.create({ title: 'Committed model neighbourhood', baselineCommit: commit, schema });
const incoming = store.incoming(workspace.id, 'LegalEntity', 0, 0, 100);
if (incoming.total <= 20 || incoming.total > 100) throw new Error('The selected example is no longer a bounded high-degree neighbourhood.');
const pairingCode = 'synthetic-pairing-code-'.repeat(2);
const service = createHttpService({ store, token: 'synthetic-evidence-token-'.repeat(2), pairingCode, workspaceId: workspace.id, staticDirectory: resolve(repository, 'website/dist') });
service.listen(0, '127.0.0.1'); await once(service, 'listening');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
  await page.getByLabel('Pairing code').fill(pairingCode);
  await page.getByRole('button', { name: 'Pair local studio' }).click();
  await page.getByLabel('Search model').fill('LegalEntity');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByRole('button', { name: 'LegalEntity', exact: true }).click();
  const canvas = page.getByRole('region', { name: 'Relationships for LegalEntity' });
  await canvas.waitFor();
  await page.getByLabel('Show incoming references').check();
  for (let limit = 20; limit < incoming.total; limit += 20) {
    const button = page.getByRole('button', { name: 'Show more incoming' });
    await button.waitFor(); await button.click();
    const expected = Math.min(incoming.total, limit + 20);
    await page.waitForFunction(expectedCount => document.querySelectorAll('.react-flow__edge').length >= expectedCount, expected);
  }
  await page.waitForFunction(() => document.querySelector('.studio-flow')?.dataset.layout === 'ready');
  await canvas.getByRole('button', { name: 'Focus selected concept' }).click();
  const output = resolve(repository, 'evidence/ontology-studio/ide'); mkdirSync(output, { recursive: true });
  for (const [width, height] of [[1280, 800], [1920, 1080]]) for (const theme of ['light', 'dark']) {
    await page.setViewportSize({ width, height }); await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await page.waitForFunction(value => document.documentElement.dataset.studioTheme === value, theme);
    await page.locator('#studio-editor-pane').evaluate(element => { element.scrollTop = 0; });
    await page.screenshot({ path: resolve(output, `real-neighbourhood-${width}-${theme}.png`), animations: 'disabled' });
  }
  console.log(JSON.stringify({ commit, browser: browser.version(), root: 'LegalEntity', directIncoming: incoming.total, renderedNodes: await page.locator('.react-flow__node').count(), renderedEdges: await page.locator('.react-flow__edge').count(), scope: 'committed public model, isolated workspace, no inferred relationships' }));
  await page.close();
} finally { await browser.close(); await service.shutdown(); store.close(); }
