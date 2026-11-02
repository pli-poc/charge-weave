import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('changed concept cards keep the field count visible at readable type sizes', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Readable cards', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|alpha:string? beta:string? gamma:string? delta:string?\n' });
  store.apply({ workspaceId: workspace.id, actor: 'test', operationId: 'describe', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Device', definition: 'A reviewed device.' }] });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByLabel('Search model').fill('Device');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram' }).click();
    await expect(page.getByRole('region', { name: 'Relationships for Device' })).toHaveAttribute('data-layout', 'ready');
    const card = page.locator('.react-flow__node[data-id="Device"] .studio-concept-card');
    await expect(card.getByText('Changed in draft')).toBeVisible();
    await expect(card.locator('li')).toHaveCount(3);
    await expect(card.getByText('+1 fields', { exact: true })).toBeVisible();
    await expect(card.locator('.studio-concept-heading strong')).toHaveCSS('font-size', '15px');
    await expect(card.locator('.studio-concept-kind')).toHaveCSS('font-size', '12px');
    await expect(card.locator('.studio-concept-module')).toHaveCSS('font-size', '12px');
    const bounds = await card.evaluate(element => {
      const parent = element.getBoundingClientRect();
      const parts = [...element.querySelectorAll('.studio-concept-heading, .studio-concept-module, .studio-concept-change, li, .studio-concept-more')];
      return { bottom: parent.bottom, children: parts.map(part => part.getBoundingClientRect().bottom) };
    });
    expect(bounds.children.every(bottom => bottom <= bounds.bottom + 1)).toBe(true);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
