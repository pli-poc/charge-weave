import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('self-relationship loops remain readable and keyboard selectable', async ({ page, isMobile }) => {
  await page.setViewportSize({ width: isMobile ? 320 : 1920, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Self relationships', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nDevice|root|A device.|parent:Device? peer:Device*\n' });
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
    const parent = canvas.getByRole('group', { name: 'Relationship parent: Device to Device; multiplicity 0..1' });
    const peer = canvas.getByRole('group', { name: 'Relationship peer: Device to Device; multiplicity 0..*' });
    const card = canvas.locator('.react-flow__node[data-id="Device"]');
    const cardBox = await card.boundingBox();
    const labels = await Promise.all([parent, peer].map(edge => edge.locator('.react-flow__edge-textwrapper').boundingBox()));
    expect(labels[0].y + labels[0].height).toBeLessThan(cardBox.y);
    expect(labels[1].y + labels[1].height).toBeLessThan(cardBox.y);
    expect(Math.abs(labels[0].y - labels[1].y)).toBeGreaterThanOrEqual(Math.min(labels[0].height, labels[1].height));
    for (const [edge, text] of [[parent, 'Relationship: parent'], [peer, 'Relationship: peer']]) {
      await edge.focus(); await page.keyboard.press('Enter');
      await expect(page.getByRole('region', { name: 'Relationship details' })).toContainText(text);
    }
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
