import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('keyboard focus returns from the diagram to the inspected relationship', async ({ page, isMobile }) => {
  test.skip(isMobile, 'This checks the desktop relationship diagram.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Relationship focus return', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|peer:Record?\n' });
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
    const canvas = page.getByRole('region', { name: 'Relationships for Device' });
    await expect(canvas).toHaveAttribute('data-layout', 'ready');
    await page.getByLabel('Inspect relationship').selectOption({ label: 'Device — peer → Record' });
    const details = page.getByRole('region', { name: 'Relationship details' });
    const focus = details.getByRole('button', { name: 'Focus relationship on diagram' });
    await focus.focus(); await page.keyboard.press('Enter');
    await expect(canvas).toBeFocused();
    await expect(canvas).toHaveAccessibleDescription('Use the arrow keys to pan the diagram. After focusing a relationship on the diagram, press Escape to return to its details.');
    await page.keyboard.press('Escape');
    await expect(focus).toBeFocused();
    await expect(details).toContainText('Relationship: peer');

    // Escape inside another canvas control retains that control's own behavior.
    await focus.press('Enter');
    const menu = canvas.locator('.studio-canvas-layout-menu');
    const summary = menu.locator(':scope > summary');
    await summary.focus(); await page.keyboard.press('Enter');
    await expect(menu).toHaveAttribute('open', '');
    await page.keyboard.press('Escape');
    await expect(menu).not.toHaveAttribute('open', '');
    await expect(summary).toBeFocused();
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
