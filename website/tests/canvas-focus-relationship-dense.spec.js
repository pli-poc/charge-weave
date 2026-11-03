import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('focus an inspected relationship in a dense diagram without moving the model', async ({ page, isMobile }) => {
  test.skip(isMobile, 'This exercises the desktop diagram at dense scale.');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const names = Array.from({ length: 50 }, (_, i) => `Synthetic${String(i).padStart(3, '0')}`);
  const schema = ['MODULE|foundation', `Record|root|Synthetic root.|${names.map((name, i) => `out${i}:${name}?`).join(' ')}`, ...names.map(name => `${name}|root|Synthetic target.|`)].join('\n') + '\n';
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Dense relationship focus', baselineCommit: 'a'.repeat(40), schema });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  const initial = { Record: { x: 0, y: 0 }, ...Object.fromEntries(names.map((name, i) => [name, { x: i === 0 ? 1400 : 340, y: i === 0 ? 1000 : i * 150 }])) };
  await page.addInitScript(({ id, initial }) => sessionStorage.setItem(`chargeweave.canvas.v2.${id}.default`, JSON.stringify(initial)), { id: workspace.id, initial });
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
    await page.getByLabel('Inspect relationship').selectOption({ label: 'Record — out0 → Synthetic000' });
    const details = page.getByRole('region', { name: 'Relationship details' });
    await details.getByRole('button', { name: 'Dim other relationships' }).click();
    await expect(canvas.locator('.studio-flow-edge-muted')).toHaveCount(49);
    await details.getByRole('button', { name: 'Focus relationship on diagram' }).click();
    await expect(canvas).toBeFocused();
    await expect.poll(async () => {
      const bounds = await canvas.boundingBox();
      const endpoints = await Promise.all(['Record', 'Synthetic000'].map(name => canvas.locator(`.react-flow__node[data-id="${name}"]`).boundingBox()));
      return Boolean(bounds && endpoints.every(box => box && box.x >= bounds.x - 1 && box.y >= bounds.y - 1 && box.x + box.width <= bounds.x + bounds.width + 1 && box.y + box.height <= bounds.y + bounds.height + 1));
    }).toBe(true);
    await expect(canvas.locator('.studio-flow-edge-muted')).toHaveCount(49);
    expect(await page.evaluate(id => sessionStorage.getItem(`chargeweave.canvas.v2.${id}.default`), workspace.id)).toBe(before);
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
