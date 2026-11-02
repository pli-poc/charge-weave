import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('follow toggle remains labelled, keyboard operable and sized for the input device', async ({ page, isMobile }) => {
  if (isMobile) await page.setViewportSize({ width: 320, height: 800 });
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Toggle layout', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Results' }).click();
    const toggle = page.getByLabel('Follow new changes and suggestions');
    const metrics = await toggle.evaluate(input => {
      const label = input.closest('label');
      const box = input.getBoundingClientRect();
      return { width: box.width, height: box.height, labelHeight: label.getBoundingClientRect().height, layout: getComputedStyle(label).display };
    });
    expect(metrics.layout).toBe('flex');
    expect(metrics.width).toBeLessThanOrEqual(24);
    expect(metrics.height).toBeGreaterThanOrEqual(isMobile ? 24 : 18);
    if (isMobile) expect(metrics.labelHeight).toBeGreaterThanOrEqual(44);
    await toggle.focus();
    await toggle.press('Space');
    await expect(toggle).toBeChecked();
    await expect(page.getByText('Following new changes and suggestions.', { exact: true })).toBeVisible();
    expect(store.get(workspace.id).revision).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
