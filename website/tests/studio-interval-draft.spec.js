import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';
import { editableSourcePaths } from '../../ontology-authoring/src/source-manifest.js';

test('interval input remains visible after a new revision and cannot silently rebase', async ({ page, isMobile }) => {
  test.setTimeout(60000);
  const repository = fileURLToPath(new URL('../..', import.meta.url));
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim();
  const show = path => execFileSync('git', ['show', `${commit}:${path}`], { cwd: repository });
  const paths = [...new Set([...editableSourcePaths, 'model/domain.schema', 'tools/authoring_adapter.py', 'tools/domain_schema.py'])].sort();
  const sourceManifest = paths.map(path => ({ path, sha256: createHash('sha256').update(show(path)).digest('hex') }));
  const sourceBlobs = Object.fromEntries([...editableSourcePaths].map(path => [path, show(path).toString('utf8')]));
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Interval draft', baselineCommit: commit, schema: show('model/domain.schema').toString('utf8'), sourceManifest, sourceBlobs });
  const requirement = store.requirementsSearch(workspace.id, 'BR-012').results.find(item => item.id === 'BR-012');
  store.apply({ workspaceId: workspace.id, actor: 'test', operationId: 'prepare', expectedRevision: 0, commands: [
    { type: 'class.add', name: 'PlannedServiceWindow', module: 'foundation', parent: 'Record', definition: 'A planned service window.' },
    { type: 'property.add', owner: 'PlannedServiceWindow', name: 'maintenanceStartsAt', range: 'dateTime', cardinality: '!' },
    { type: 'property.add', owner: 'PlannedServiceWindow', name: 'maintenanceEndsAt', range: 'dateTime', cardinality: '!' },
    { type: 'requirement.link', requirementId: requirement.id, className: 'PlannedServiceWindow', expectedClasses: requirement.classes },
    { type: 'temporal.policy_set', className: 'PlannedServiceWindow', expectedPolicy: null, policy: 'snapshot-versioned' },
  ] });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, eventPollMs: 100, repository, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByLabel('Search model').fill('PlannedServiceWindow');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'PlannedServiceWindow', exact: true }).click();
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Results' }).click();
    await page.getByLabel('Search requirements').fill('BR-012');
    await page.getByRole('button', { name: 'Search requirements', exact: true }).click();
    await page.getByText('Add interval rule for BR-012').click();
    await page.getByLabel('Interval start').selectOption('maintenanceStartsAt');
    await page.getByLabel('Interval end').selectOption('maintenanceEndsAt');
    await page.getByLabel('New rule ID').fill('B900');
    store.apply({ workspaceId: workspace.id, actor: 'other', operationId: 'other-change', expectedRevision: 1, commands: [{ type: 'class.describe', name: 'PlannedServiceWindow', definition: 'A revised window.' }] });
    const warning = page.getByRole('alert').filter({ hasText: 'workspace changed since this interval draft began' });
    await expect(warning).toBeVisible();
    await expect(warning).toContainText('maintenanceStartsAt to maintenanceEndsAt');
    await expect(page.getByLabel('New rule ID')).toHaveValue('B900');
    await expect(page.getByRole('button', { name: 'Add interval constraint' })).toBeDisabled();
    expect(store.get(workspace.id).revision).toBe(2);
    await warning.getByRole('button', { name: 'Inspect latest interval requirement' }).click();
    await expect(warning).toContainText('Current requirement:');
    await expect(warning).toContainText('Current start: maintenanceStartsAt');
    const accept = warning.getByRole('button', { name: 'Reviewed latest, keep interval input' });
    await expect(accept).toBeEnabled();
    await accept.click();
    await expect(page.getByLabel('New rule ID')).toHaveValue('B900');
    await expect(page.getByLabel('Interval start')).toHaveValue('maintenanceStartsAt');
    await expect(page.getByLabel('Interval end')).toHaveValue('maintenanceEndsAt');
    await page.getByRole('button', { name: 'Add interval constraint' }).click();
    await expect.poll(() => store.get(workspace.id).revision).toBe(3);
    expect(store.get(workspace.id).sourceOverlays['model/audit-rules.json']).toContain('B900');
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
