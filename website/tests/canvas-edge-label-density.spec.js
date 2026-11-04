import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('dense diagram labels collapse automatically but remain explicitly available', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Compact layouts use the relationship list.');
  const store = new WorkspaceStore(':memory:');
  const relations = Array.from({ length: 13 }, (_, index) => `linked${String(index).padStart(2, '0')}:Record?`).join(' ');
  const workspace = store.create({ title: 'Dense relationship labels', baselineCommit: 'a'.repeat(40), schema: `MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|${relations}\n` });
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
    await expect(canvas.locator('.react-flow__edge')).toHaveCount(14);
    await expect(canvas.locator('.react-flow__edge-text')).toHaveCount(0);
    await expect(canvas.locator('.react-flow__edge[aria-label="Relationship linked00: Device to Record; multiplicity 0..1"]')).toHaveCount(1);

    await page.getByLabel('Inspect relationship').selectOption({ label: 'Device — linked00 → Record' });
    await expect(canvas.locator('.react-flow__edge-text')).toHaveText(['linked00 0..1']);
    const labelMode = page.getByLabel('Relationship labels');
    await labelMode.selectOption('all');
    await expect(canvas.locator('.react-flow__edge-text')).toHaveCount(14);
    await labelMode.selectOption('focus');
    await expect(canvas.locator('.react-flow__edge-text')).toHaveCount(1);
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
