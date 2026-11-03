import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('parallel relationships and inheritance have distinct accessible names', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The desktop diagram is checked separately from the compact relationship list.');
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Accessible relationships', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|peer:Record? owner:Record!\n' });
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
    const peer = canvas.getByRole('group', { name: 'Relationship peer: Device to Record; multiplicity 0..1', exact: true });
    const owner = canvas.getByRole('group', { name: 'Relationship owner: Device to Record; multiplicity 1', exact: true });
    const inheritance = canvas.getByRole('group', { name: 'Inheritance: Device is a subtype of Record', exact: true });
    await expect(peer).toHaveCount(1);
    await expect(owner).toHaveCount(1);
    await expect(inheritance).toHaveCount(1);
    for (const [edge, description] of [[peer, 'Relationship: peer'], [owner, 'Relationship: owner'], [inheritance, 'Inheritance: subClassOf']]) {
      await edge.focus();
      await expect(edge).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('region', { name: 'Relationship details' })).toContainText(description);
    }
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
