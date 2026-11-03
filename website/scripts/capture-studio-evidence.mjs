import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { once } from 'node:events';
import { resolve } from 'node:path';
import { chromium } from '../node_modules/playwright/index.mjs';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

// Capture only an isolated, synthetic workspace. Build the website first.
const repository = resolve(process.env.CHARGEWEAVE_REPOSITORY ?? '..');
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim();
const output = resolve(repository, 'evidence/ontology-studio/ide');
mkdirSync(output, { recursive: true });
const schema = 'MODULE|foundation\nRecord|root|Identifiable domain record.|label:string?\nChargingStation|Record|A location where vehicles are charged.|site:Site! operator:Operator?\nSite|Record|A physical site.|\nOperator|Record|An organization responsible for a station.|\n';
const store = new WorkspaceStore(':memory:');
const workspace = store.create({ title: 'Synthetic modelling workspace', baselineCommit: commit, schema });
const pairingCode = 'synthetic-pairing-code-'.repeat(2);
const service = createHttpService({ store, token: 'synthetic-evidence-token-'.repeat(2), pairingCode, workspaceId: workspace.id, staticDirectory: resolve(repository, 'website/dist') });
service.listen(0, '127.0.0.1'); await once(service, 'listening');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
  await page.getByLabel('Pairing code').fill(pairingCode);
  await page.getByRole('button', { name: 'Pair local studio' }).click();
  await page.getByLabel('Search model').fill('ChargingStation');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByRole('button', { name: 'ChargingStation', exact: true }).click();
  await page.getByRole('region', { name: 'Relationships for ChargingStation', includeHidden: true }).waitFor({ state: 'attached' });
  await page.waitForFunction(() => document.querySelector('.studio-flow')?.dataset.layout === 'ready');
  for (const [width, height] of [[1280, 800], [1920, 1080], [390, 844], [320, 800]]) {
    for (const theme of ['light', 'dark']) {
        await page.setViewportSize({ width, height });
        await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
        await page.waitForFunction(value => document.documentElement.dataset.studioTheme === value, theme);
        if (width < 900) {
          await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram' }).click();
          const details = page.locator('details.studio-compact-relationships');
          if (!await details.evaluate(element => element.open)) await page.getByText(/Relationship list \(/).click();
        }
        await page.screenshot({ path: resolve(output, `connected-${width}-${theme}.png`), animations: 'disabled' });
    }
  }
  await page.close();
  console.log(JSON.stringify({ commit, browser: browser.version(), fixture: 'isolated synthetic workspace', output, captures: 8 }));
} finally { await browser.close(); await service.shutdown(); store.close(); }
