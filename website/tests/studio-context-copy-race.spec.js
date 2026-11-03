import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('delayed clipboard feedback cannot describe a newer context', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Clipboard race', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: text => new Promise(resolve => { window.copiedContext = text; window.completeCopy = resolve; }) } }));
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('list', { name: 'Loaded concepts by module' }).getByRole('button', { name: 'Record', exact: true }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await page.getByText('Prepare context for Codex').click();
    const preview = page.getByLabel('Context preview');
    await expect(preview).toHaveValue(/revision: 0/);
    await page.getByRole('button', { name: 'Copy context' }).click();
    await expect.poll(() => page.evaluate(() => Boolean(window.completeCopy))).toBe(true);
    store.apply({ workspaceId: workspace.id, actor: 'other-client', operationId: 'copy-race', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Record', definition: 'Updated record.' }] });
    await expect(preview).toHaveValue(/revision: 1/);
    await page.evaluate(() => window.completeCopy());
    await expect(page.getByText('Context copied. Paste it into your connected client.')).toHaveCount(0);
    expect(await page.evaluate(() => window.copiedContext)).toContain('revision: 0');
    const section = page.locator('details.studio-context-handoff');
    if (!await section.evaluate(element => element.open)) await page.getByText('Prepare context for Codex').click();
    await page.getByRole('button', { name: 'Copy context' }).click();
    await page.evaluate(() => window.completeCopy());
    await expect(page.getByText('Context copied. Paste it into your connected client.')).toBeVisible();
    expect(await page.evaluate(() => window.copiedContext)).toContain('revision: 1');
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
