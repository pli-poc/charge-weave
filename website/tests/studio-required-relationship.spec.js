import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('requiring a relationship reviews the change and rejects stale activity', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Relationship review', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|peer:Record?\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, eventPollMs: 100, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await page.getByRole('button', { name: 'Require peer' }).click();
    const review = page.getByRole('region', { name: 'Review required relationship' });
    await expect(review).toContainText('optional (0..1) to exactly one (1)');
    await expect(review).toContainText('Existing data without a value may no longer conform');
    expect(store.get(workspace.id).revision).toBe(0);
    store.suggestView(workspace.id, { actor: 'other', operationId: 'suggest', expectedRevision: 0, root: 'Device', viewpoint: 'information', explanation: 'Review this concept.' });
    await expect(review.getByRole('alert')).toContainText('workspace changed');
    await expect(review.getByRole('button', { name: 'Confirm required relationship' })).toBeDisabled();
    await review.getByRole('button', { name: 'Cancel required relationship' }).click();
    const requireButton = page.getByRole('button', { name: 'Require peer' });
    await expect(requireButton).toBeEnabled();
    await requireButton.click();
    await review.getByRole('button', { name: 'Confirm required relationship' }).click();
    await expect.poll(() => store.get(workspace.id).revision).toBe(1);
    expect(store.get(workspace.id).schema).toContain('peer:Record!');
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
