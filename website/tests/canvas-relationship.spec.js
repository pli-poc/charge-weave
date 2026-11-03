import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('visible relationships can be inspected from the keyboard without editing the model', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The desktop canvas is complemented by the mobile relationship list.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Relationship inspection', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|peer:Record?\n' });
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
    const picker = page.getByLabel('Inspect relationship');
    await picker.selectOption({ label: 'Device — peer → Record' });
    const details = page.getByRole('region', { name: 'Relationship details' });
    await expect(details).toContainText('Relationship: peer');
    await expect(details).toContainText('Device → Record');
    await expect(details).toContainText('Multiplicity: 0..1');
    await expect(details).toContainText('model/domain.schema:3');
    await expect(details).toContainText('does not change the model');
    expect(store.get(workspace.id).revision).toBe(0);
    await details.getByRole('button', { name: 'Inspect target Record' }).click();
    await expect(page.getByRole('heading', { name: 'Record', exact: true })).toBeVisible();
    await expect(canvas).toBeVisible();
    await details.getByRole('button', { name: 'Close relationship details' }).click();
    await expect(details).toHaveCount(0);
    const peerEdge = canvas.locator('.react-flow__edge').filter({ hasText: 'peer' });
    await peerEdge.focus();
    await page.keyboard.press('Enter');
    await expect(details).toContainText('Relationship: peer');
    await page.getByLabel('Filter graph relationships').fill('not-present');
    await expect(details).toHaveCount(0);
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('dense incoming filter reports hidden and unloaded references', async ({ page, isMobile }) => {
  test.skip(isMobile, 'This checks desktop graph controls.');
  const store = new WorkspaceStore(':memory:');
  const schema = `MODULE|foundation\nRecord|root|A record.|\n${Array.from({ length: 25 }, (_, index) => `Source${String(index).padStart(2, '0')}|root|A source.|owner:Record?`).join('\n')}\n`;
  const workspace = store.create({ title: 'Dense filter', baselineCommit: 'a'.repeat(40), schema });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByLabel('Search model').fill('Record');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Record', exact: true }).click();
    await page.getByLabel('Show incoming references').check();
    await expect(page.getByText('5 additional incoming references are not shown.', { exact: false })).toBeVisible();
    await page.getByLabel('Filter graph relationships').fill('Source24');
    await expect(page.getByText('20 loaded incoming references hidden by the current filter.')).toBeVisible();
    await expect(page.getByText('The filter applies to loaded relationships only. Show more relationships to search further.')).toBeVisible();
    await page.getByRole('button', { name: 'Show more incoming' }).click();
    await expect(page.getByText('The filter applies to loaded relationships only. Show more relationships to search further.')).toHaveCount(0);
    await expect(page.getByText('24 loaded incoming references hidden by the current filter.')).toBeVisible();
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
