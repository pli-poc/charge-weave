import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('searching a dense relationship picker retains inspection without changing the diagram', async ({ page, isMobile }) => {
  test.skip(isMobile, 'This tests the desktop relationship diagram.');
  const names = Array.from({ length: 50 }, (_, i) => `Synthetic${String(i).padStart(3, '0')}`);
  const schema = ['MODULE|foundation', `Record|root|Synthetic root.|${names.map((name, i) => `out${i}:${name}?`).join(' ')}`, ...names.map(name => `${name}|root|Synthetic target.|`)].join('\n') + '\n';
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Relationship search', baselineCommit: 'a'.repeat(40), schema });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    const canvas = page.getByRole('region', { name: 'Relationships for Record' });
    await canvas.waitFor();
    for (const count of [24, 36, 48, 50]) {
      await page.getByRole('button', { name: 'Show more outgoing' }).click();
      await expect.poll(() => canvas.locator('.react-flow__edge').count()).toBe(count);
    }
    await expect(canvas).toHaveAttribute('data-layout', 'ready');
    const before = await page.evaluate(id => sessionStorage.getItem(`chargeweave.canvas.v2.${id}.default`), workspace.id);
    const search = page.getByLabel('Find visible relationships');
    const picker = page.getByLabel('Inspect relationship');
    const status = page.locator('.studio-canvas-edge-picker p');
    await search.fill('OUT49');
    await expect(status).toContainText('Showing 1 of 50 visible relationships.');
    await expect(status).toContainText('Unloaded and hidden relationships are excluded.');
    await expect(picker.locator('option')).toHaveCount(2);
    await picker.focus();
    await page.keyboard.press('End');
    await expect(page.getByRole('region', { name: 'Relationship details' })).toContainText('Relationship: out49');
    await search.fill('out0');
    await expect(status).toContainText('Showing 1 of 50 visible relationships.');
    await expect(status).toContainText('The inspected relationship remains available outside these results.');
    await expect(picker.locator('option')).toHaveCount(3);
    await expect(picker.locator('option:checked')).toHaveText('Record — out49 → Synthetic049 (currently inspected)');
    await search.fill('no-such-relationship');
    await expect(status).toContainText('Showing 0 of 50 visible relationships.');
    await expect(picker.locator('option:checked')).toHaveText('Record — out49 → Synthetic049 (currently inspected)');
    await page.getByRole('button', { name: 'Clear relationship search' }).click();
    await expect(search).toBeFocused();
    await expect(picker.locator('option')).toHaveCount(51);
    await expect(picker.locator('option:checked')).toHaveText('Record — out49 → Synthetic049');
    await expect(canvas.locator('.react-flow__edge')).toHaveCount(50);
    expect(await page.evaluate(id => sessionStorage.getItem(`chargeweave.canvas.v2.${id}.default`), workspace.id)).toBe(before);
    expect(store.get(workspace.id).revision).toBe(0);
    await search.fill('out0');
    await page.getByLabel('Filter graph relationships').fill('out0');
    await expect(page.getByRole('region', { name: 'Relationship details' })).toHaveCount(0);
    await expect(status).toContainText('Showing 1 of 1 visible relationships.');
    await expect(picker.locator('option')).toHaveCount(2);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
