import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('unfinished view note cannot be silently moved to another concept or view', async ({ page, isMobile }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'View note draft', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|peer:Record?\n' });
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
    await page.getByText('View groups and annotations', { exact: true }).click();
    const note = page.getByLabel('Note for selected concept');
    await note.fill('Keep this with Device');
    await page.getByRole('button', { name: 'Save shared view' }).click();
    await expect(page.getByText('Add or clear unfinished view input before saving the shared view.')).toBeVisible();
    expect(store.savedView(workspace.id, 'default').viewRevision).toBe(0);
    await page.getByRole('button', { name: 'Load shared view' }).click();
    await expect(page.getByText('Add or clear unfinished view input before loading the shared view.')).toBeVisible();
    await page.getByLabel('View ID').fill('other');
    await page.getByRole('button', { name: 'Choose view ID' }).click();
    await expect(page.getByText('Add or clear the unfinished view note before switching views.')).toBeVisible();
    await expect(note).toHaveValue('Keep this with Device');
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Model' }).click();
    await page.getByRole('button', { name: 'Clear search' }).click();
    await page.getByRole('list', { name: 'Loaded concepts by module' }).getByRole('button', { name: 'Record', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Unapplied edits' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Stay and keep editing' }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram' }).click();
    await expect(note).toHaveValue('Keep this with Device');
    await page.getByRole('button', { name: 'Add view note' }).click();
    await expect(page.getByText('Device: Keep this with Device')).toBeVisible();

    const canvas = page.getByRole('region', { name: 'Relationships for Device' });
    await expect(canvas).toHaveAttribute('data-layout', 'ready');
    await canvas.getByText('Layout', { exact: true }).click();
    await canvas.getByText('Align selected concepts', { exact: true }).click();
    await canvas.getByLabel('New group name').fill('Canvas group');
    await page.getByRole('button', { name: 'Choose view ID' }).click();
    await expect(page.getByText('Add or clear the unfinished view group before switching views.')).toBeVisible();
    await expect(canvas.getByLabel('New group name')).toHaveValue('Canvas group');
    await canvas.getByRole('button', { name: 'Clear canvas group name' }).click();
    await page.getByRole('button', { name: 'Choose view ID' }).click();
    await expect(page.getByRole('navigation', { name: 'Open diagram views' }).getByRole('button', { name: 'other', exact: true })).toBeVisible();
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
