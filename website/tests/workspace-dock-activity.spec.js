import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('recent activity reveals earlier events from the bounded workspace history', async ({ page, isMobile }) => {
  await page.setViewportSize({ width: isMobile ? 390 : 1440, height: 1000 });
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Activity history', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|\n' });
  for (let revision = 1; revision <= 12; revision += 1) {
    store.apply({ workspaceId: workspace.id, actor: 'synthetic-codex', operationId: `activity-${revision}`, expectedRevision: revision - 1, commands: [{ type: 'class.describe', name: 'Device', definition: `Device revision ${revision}.` }] });
  }
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('navigation', { name: 'Workspace destinations' }).getByRole('link', { name: 'Activity' }).click();
    const activity = page.getByRole('region', { name: 'Results content' }).getByRole('region', { name: 'Recent activity' });
    await expect(activity).toContainText('Showing the latest 10 of 12 loaded workspace events.');
    await expect(activity).toContainText('revision 12');
    await expect(activity).not.toContainText('revision 2');
    await activity.getByRole('button', { name: 'Show earlier activity' }).click();
    await expect(activity).toContainText('Showing the latest 12 of 12 loaded workspace events.');
    await expect(activity).toContainText('revision 2');
    expect(store.get(workspace.id).revision).toBe(12);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
