import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('first-time modeller can discover, edit, check, and review a synthetic model', async ({ page, isMobile }) => {
  if (isMobile) await page.setViewportSize({ width: 320, height: 800 });
  async function expectNoHorizontalPageOverflow() {
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'First-time journey', baselineCommit: 'a'.repeat(40), schema: 'MODULE|assets\nRecord|root|A record.|\nDevice|Record|A device.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({
    store,
    token: 'test-token-'.repeat(4),
    pairingCode,
    workspaceId: workspace.id,
    repository: '.',
    staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)),
    validationRunner: async (target, input, job) => {
      target.startJobStep(job.id, 0, 'synthetic-structural-check');
      target.finishJobStep(job.id, 0, 'passed', 'Synthetic fixture check passed.');
      target.updateJob(job.id, 'passed');
    },
  });
  service.listen(0, '127.0.0.1');
  await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 0');
    await expectNoHorizontalPageOverflow();

    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Model' }).click();
    await page.getByLabel('Search model').fill('Device');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Device', exact: true }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await expect(page.getByRole('heading', { name: 'Device', exact: true })).toBeVisible();
    await expectNoHorizontalPageOverflow();
    const savedDefinition = page.getByRole('textbox', { name: 'Definition', exact: true });
    await savedDefinition.fill('An inspected device.');
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram' }).click();
    await page.getByLabel('Reason for next edit (optional)').fill('Clarify the device definition.');
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await page.getByRole('button', { name: 'Save definition' }).click();
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 1');
    expect(store.search(workspace.id, 'Device').results[0].definition).toBe('An inspected device.');

    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram' }).click();
    await page.getByText('Add a concept', { exact: true }).click();
    await page.getByLabel('Class name').fill('ServiceWindow');
    await page.getByLabel('Concept module').selectOption('assets');
    await page.getByLabel('Parent class').fill('Record');
    await page.getByLabel('Class definition').fill('A service window.');
    await page.getByRole('button', { name: 'Add concept', exact: true }).click();
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 2');
    expect(store.search(workspace.id, 'ServiceWindow').results[0]).toMatchObject({ module: 'assets', parent: 'Record', definition: 'A service window.' });

    const graph = page.getByRole('region', { name: 'Relationships for ServiceWindow' });
    await expect(graph).toBeVisible();
    await page.getByText('Create a relationship using the keyboard', { exact: true }).click();
    await page.getByRole('button', { name: 'Relate ServiceWindow to Record' }).click();
    await page.getByLabel('Predicate name').fill('record');
    await page.getByLabel('Relationship description').fill('The record covered by this window.');
    await page.getByLabel('Relationship cardinality').selectOption('?');
    await page.getByRole('button', { name: 'Create relationship', exact: true }).click();
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 3');
    expect(store.get(workspace.id).schema).toContain('record:Record?');

    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Inspector' }).click();
    await page.getByText('Add a field or relationship', { exact: true }).click();
    await page.getByLabel('Field name').fill('state');
    await page.getByLabel('Datatype or target class').fill('{Draft,Active,Complete}');
    await page.getByRole('button', { name: 'Add field', exact: true }).click();
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 4');
    expect(store.get(workspace.id).schema).toContain('state:{Draft,Active,Complete}?');
    const narrowValues = page.getByRole('button', { name: 'Narrow values for state' });
    await narrowValues.focus();
    await narrowValues.press('Enter');
    const valuesEditor = page.getByRole('region', { name: 'Narrow allowed values' });
    await valuesEditor.getByLabel('Complete').uncheck();
    await valuesEditor.getByRole('button', { name: 'Apply allowed values' }).click();
    await expect(page.getByRole('status', { name: 'Studio connection status' })).toContainText('revision 5');
    expect(store.get(workspace.id).schema).toContain('state:{Draft,Active}?');

    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Results' }).click();
    await page.getByRole('button', { name: 'Check draft' }).click();
    await expect(page.getByRole('alert').filter({ hasText: /MCP error/ })).toHaveCount(0);
    const latestOperation = page.getByText('Latest structural operation: passed', { exact: true });
    await expect(latestOperation).toHaveAttribute('role', 'status');
    await expect(latestOperation).toHaveAttribute('aria-live', 'polite');
    if (isMobile) {
      await page.getByRole('link', { name: 'Check: passed' }).click();
      await expect(page.getByRole('navigation', { name: 'Results panels' }).getByRole('button', { name: 'Checks', exact: true })).toHaveAttribute('aria-pressed', 'true');
      await page.getByRole('button', { name: 'View check details' }).click();
      await expect(page.getByRole('button', { name: 'Collapse validation' })).toHaveAttribute('aria-expanded', 'true');
    } else {
      await expect(page.getByText(/structural checks: passed for revision 5/)).toBeVisible();
      await page.getByRole('button', { name: 'View check details' }).click();
    }
    await expect(page.getByRole('region', { name: 'Validation issues' }).getByText('No failed steps in this job. Other required checks may still be missing.')).toBeVisible();
    await expect(page.getByRole('region', { name: 'Results content' }).getByRole('region', { name: 'Recorded check steps' })).toContainText('synthetic-structural-check: passed');
    await expectNoHorizontalPageOverflow();
    const recordedOutputDisclosure = page.getByText('Recorded output for synthetic-structural-check', { exact: true });
    await recordedOutputDisclosure.focus();
    await recordedOutputDisclosure.press('Enter');
    await expect(page.getByRole('region', { name: 'Recorded step output: synthetic-structural-check' })).toContainText('Synthetic fixture check passed.');

    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Diagram' }).click();
    await page.getByRole('button', { name: 'Inspect changes' }).click();
    await expect(page.getByText('changed: Device')).toBeVisible();
    await expect(page.getByText('added: ServiceWindow')).toBeVisible();
    await page.getByRole('navigation', { name: 'Workspace destinations' }).getByRole('link', { name: 'Review' }).click();
    await expect(page.getByRole('region', { name: 'Review workflow' })).toContainText('Checks and review decisions do not publish the draft.');
    await expectNoHorizontalPageOverflow();
    await page.getByRole('button', { name: 'Inspect review gates' }).click();
    await expect(page.getByRole('region', { name: 'Review workflow' })).toContainText('Last inspection: review gates incomplete:');
    expect(store.get(workspace.id).revision).toBe(5);
  } finally {
    await page.close();
    await service.shutdown();
    store.close();
  }
});
