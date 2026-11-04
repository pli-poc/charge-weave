import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('inheritance and relationship lines remain distinguishable during inspection', async ({ page, isMobile }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Line styles', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|peer:Record?\n' });
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
    const inheritance = canvas.locator('.react-flow__edge.studio-flow-inheritance');
    const relationship = canvas.locator('.react-flow__edge').filter({ hasText: 'peer' });
    await expect(inheritance).toHaveCount(1);
    await expect(inheritance.locator('.react-flow__edge-path')).toHaveCSS('stroke-dasharray', '7px, 4px');
    await expect(relationship.locator('.react-flow__edge-path')).toHaveCSS('stroke-dasharray', 'none');
    const legend = page.getByLabel('Diagram relationship line styles');
    await expect(legend).toContainText('Inheritance (subClassOf)');
    await expect(legend).toContainText('Arrows point to the target.');
    const picker = page.getByLabel('Inspect relationship');
    const option = picker.locator('option').filter({ hasText: /Device.*subClassOf.*Record/ });
    await picker.selectOption(await option.getAttribute('value'));
    await expect(inheritance).toHaveClass(/selected/);
    await expect(inheritance.locator('.react-flow__edge-path')).toHaveCSS('stroke-dasharray', '7px, 4px');
    await expect(page.getByRole('region', { name: 'Relationship details' })).toContainText('Inheritance: subClassOf');
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
