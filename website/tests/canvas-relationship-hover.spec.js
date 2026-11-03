import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('hover previews relationship endpoints without changing the inspected relationship', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Hover is tested with the desktop pointer.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Relationship hover', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nPerson|root|A person.|\nDevice|Record|A device.|peer:Record? owner:Person?\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  const initial = { Device: { x: 0, y: 0 }, Record: { x: 340, y: 0 }, Person: { x: 340, y: 180 } };
  await page.addInitScript(({ id, initial }) => sessionStorage.setItem(`chargeweave.canvas.v2.${id}.default`, JSON.stringify(initial)), { id: workspace.id, initial });
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByLabel('Search model').fill('Device');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    const canvas = page.getByRole('region', { name: 'Relationships for Device' });
    await expect(canvas).toHaveAttribute('data-layout', 'ready');
    await page.getByLabel('Inspect relationship').selectOption({ label: 'Device — peer → Record' });
    const details = page.getByRole('region', { name: 'Relationship details' });
    const owner = canvas.locator('.react-flow__edge').filter({ hasText: 'owner' });
    const record = canvas.locator('.react-flow__node[data-id="Record"]');
    const person = canvas.locator('.react-flow__node[data-id="Person"]');
    const before = await page.evaluate(id => sessionStorage.getItem(`chargeweave.canvas.v2.${id}.default`), workspace.id);
    for (const [theme, color] of [['light', 'rgb(0, 86, 168)'], ['dark', 'rgb(185, 224, 255)']]) {
      await page.getByLabel('Appearance').selectOption(theme);
      await owner.locator('.react-flow__edge-interaction').hover({ force: true });
      await expect(person).toHaveClass(/studio-relationship-endpoint/);
      await expect(person.locator('.studio-concept-card')).toHaveCSS('outline-color', color);
      await expect(record).not.toHaveClass(/studio-relationship-endpoint/);
      await expect(details).toContainText('Relationship: peer');
      await page.mouse.move(1, 1);
      await expect(person).not.toHaveClass(/studio-relationship-endpoint/);
      await expect(record).toHaveClass(/studio-relationship-endpoint/);
    }
    await details.getByRole('button', { name: 'Dim other relationships' }).click();
    await expect(owner).toHaveCSS('opacity', '0.18');
    await owner.locator('.react-flow__edge-interaction').hover({ force: true });
    await expect(owner).toHaveCSS('opacity', '1');
    await expect(person).toHaveClass(/studio-relationship-endpoint/);
    await page.mouse.move(1, 1);
    await expect(owner).toHaveCSS('opacity', '0.18');
    await expect(record).toHaveClass(/studio-relationship-endpoint/);
    await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
    await owner.locator('.react-flow__edge-interaction').hover({ force: true });
    const highlight = await page.evaluate(() => { const sample = document.createElement('span'); sample.style.color = 'Highlight'; document.body.append(sample); const color = getComputedStyle(sample).color; sample.remove(); return color; });
    await expect(person.locator('.studio-concept-card')).toHaveCSS('outline-color', highlight);
    await expect(owner).toHaveCSS('opacity', '1');
    expect(await page.evaluate(id => sessionStorage.getItem(`chargeweave.canvas.v2.${id}.default`), workspace.id)).toBe(before);
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
