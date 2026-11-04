import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('all card badges and the accurate field overflow fit together', async ({ page, isMobile }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const store = new WorkspaceStore(':memory:');
  const module = 'AnExtremelyLongModuleNameUsedToCheckThatCardMetadataDoesNotWrap';
  const workspace = store.create({ title: 'Card badges', baselineCommit: 'a'.repeat(40), schema: `MODULE|foundation\nRecord|root|A record.|\nMODULE|${module}\nDevice|Record|A device.|alpha:string? beta:string? gamma:string? delta:string?\n` });
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
    const canvas = page.getByRole('region', { name: 'Relationships for Device' });
    await expect(canvas).toHaveAttribute('data-layout', 'ready');
    await canvas.getByRole('button', { name: 'Focus selected concept' }).click();
    await expect(canvas.getByLabel('Diagram zoom level')).toHaveText('100%');
    await canvas.getByText('Layout', { exact: true }).click();
    await canvas.getByText('Align selected concepts', { exact: true }).click();
    await canvas.getByRole('checkbox', { name: 'Device', exact: true }).check();
    await canvas.getByRole('button', { name: 'Pin selected', exact: true }).click();
    await canvas.getByText('Layout', { exact: true }).click();
    const node = canvas.locator('.react-flow__node[data-id="Device"]');
    const card = node.locator('.studio-concept-card');
    await expect(card.getByText('Changed in draft', { exact: true })).toBeVisible();
    await expect(card.getByText('Selected for layout', { exact: true })).toBeVisible();
    await expect(card.getByText('Pinned', { exact: true })).toBeVisible();
    await expect(card.locator('li')).toHaveCount(2);
    await expect(card.getByText('+2 fields', { exact: true })).toBeVisible();
    await expect(card.locator('.studio-concept-module')).toHaveAttribute('title', module);
    if (isMobile) await page.getByRole('button', { name: 'Studio preferences' }).click();
    for (const theme of ['light', 'dark']) {
      await page.getByLabel('Appearance').selectOption(theme);
      const geometry = await card.evaluate(element => {
        const bounds = element.getBoundingClientRect();
        const parts = [...element.querySelectorAll('.studio-concept-heading, .studio-concept-module, .studio-concept-badges > *, li, .studio-concept-more')].map(part => {
          const rect = part.getBoundingClientRect();
          return { left: rect.left, right: rect.right, bottom: rect.bottom };
        });
        const cardNode = element.closest('.react-flow__node').getBoundingClientRect();
        return { bounds: { left: bounds.left, right: bounds.right, bottom: bounds.bottom }, parts, width: cardNode.width, height: cardNode.height, moduleWhiteSpace: getComputedStyle(element.querySelector('.studio-concept-module')).whiteSpace };
      });
      expect(geometry.width).toBeCloseTo(220, 0);
      expect(geometry.height).toBeCloseTo(128, 0);
      expect(geometry.moduleWhiteSpace).toBe('nowrap');
      expect(geometry.parts.every(part => part.left >= geometry.bounds.left - 1 && part.right <= geometry.bounds.right + 1 && part.bottom <= geometry.bounds.bottom + 1)).toBe(true);
    }
    expect(store.get(workspace.id).revision).toBe(1);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
