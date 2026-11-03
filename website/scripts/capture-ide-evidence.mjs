import { chromium } from '@playwright/test';
import { once } from 'node:events';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

const scriptPath = fileURLToPath(import.meta.url);
const repo = resolve(dirname(scriptPath), '../..');
const output = join(repo, 'evidence/ontology-studio/ide');
const staticDirectory = join(repo, 'website/dist');
const model = readFileSync(join(repo, 'model/domain.schema'), 'utf8');
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim();
const pairingCode = 'synthetic-ide-evidence-pairing-code';
const store = new WorkspaceStore(':memory:');
const workspace = store.create({ title: 'IDE UX evidence · synthetic model', baselineCommit: 'a'.repeat(40), schema: model });
const service = createHttpService({
  store,
  token: 'synthetic-ide-evidence-draft-token',
  pairingCode,
  workspaceId: workspace.id,
  staticDirectory,
});

mkdirSync(output, { recursive: true });
service.listen(0, '127.0.0.1');
await once(service, 'listening');

let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
  await page.getByLabel('Pairing code').fill(pairingCode);
  await page.getByRole('button', { name: 'Pair local studio' }).click();
  await page.getByLabel('Search model').waitFor({ state: 'visible' });
  await page.getByLabel('Search model').fill('ChargingStation');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByRole('button', { name: 'ChargingStation', exact: true }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'ChargingStation', exact: true }).click();
  await page.getByRole('button', { name: 'Reveal selected concept' }).click();
  await page.getByText('Browsing from ChargingStation; earlier concepts are not shown.').waitFor({ state: 'visible' });
  await page.screenshot({ path: join(output, 'workbench-viewport-desktop.png') });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: join(output, 'workbench-viewport-compact.png') });

  process.stdout.write(JSON.stringify({
    commit,
    workspaceId: workspace.id,
    scenario: 'Pair to an isolated synthetic workspace, search for ChargingStation, reveal its model neighborhood.',
    screenshots: [
      { file: 'workbench-viewport-desktop.png', viewport: '1440x1000', theme: 'system default' },
      { file: 'workbench-viewport-compact.png', viewport: '390x844', theme: 'system default' },
    ],
  }, null, 2) + '\n');
} finally {
  await browser?.close();
  await service.shutdown();
  store.close();
}
