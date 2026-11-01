import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { editableSourcePaths, importSourceManifest } from '../../ontology-authoring/src/source-manifest.js';

test.use({ actionTimeout: 10000 });

test('browser authors an interval rule with draft cases and source patches', async ({ page }) => {
  test.setTimeout(60000);
  const repository = fileURLToPath(new URL('../..', import.meta.url));
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim();
  const show = path => execFileSync('git', ['show', `${commit}:${path}`], { cwd: repository });
  const paths = [...new Set([...editableSourcePaths, 'model/domain.schema', 'tools/authoring_adapter.py', 'tools/domain_schema.py'])].sort();
  const manifest = paths.map(path => ({ path, sha256: createHash('sha256').update(show(path)).digest('hex') }));
  const sourceBlobs = Object.fromEntries([...editableSourcePaths].map(path => [path, show(path).toString('utf8')]));
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Interval browser test', baselineCommit: commit, schema: show('model/domain.schema').toString('utf8'), sourceManifest: manifest, sourceBlobs });
  const requirement = store.requirementsSearch(workspace.id, 'BR-012').results.find(item => item.id === 'BR-012');
  store.apply({ workspaceId: workspace.id, actor: 'test', operationId: 'prepare', expectedRevision: 0, commands: [
    { type: 'class.add', name: 'PlannedServiceWindow', module: 'foundation', parent: 'Record', definition: 'A planned service window.' },
    { type: 'property.add', owner: 'PlannedServiceWindow', name: 'maintenanceStartsAt', range: 'dateTime', cardinality: '!' },
    { type: 'property.add', owner: 'PlannedServiceWindow', name: 'maintenanceEndsAt', range: 'dateTime', cardinality: '!' },
    { type: 'requirement.link', requirementId: requirement.id, className: 'PlannedServiceWindow', expectedClasses: requirement.classes },
    { type: 'temporal.policy_set', className: 'PlannedServiceWindow', expectedPolicy: null, policy: 'snapshot-versioned' },
  ] });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)), repository });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByLabel('Search model').fill('PlannedServiceWindow');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'PlannedServiceWindow', exact: true }).click();
    await page.getByLabel('Search requirements').fill('BR-012');
    await page.getByRole('button', { name: 'Search requirements', exact: true }).click();
    await page.getByText('Add interval rule for BR-012').click();
    await page.getByLabel('Interval start').selectOption('maintenanceStartsAt');
    await page.getByLabel('Interval end').selectOption('maintenanceEndsAt');
    await page.getByLabel('New rule ID').fill('B900');
    await page.getByRole('button', { name: 'Add interval constraint' }).click();
    await expect(page.getByRole('status')).toContainText('revision 2');
    await page.getByRole('button', { name: 'Inspect changes' }).click();
    await expect(page.getByText('Source patch: model/audit-rules.json')).toBeVisible();
    await expect(page.getByText('Source patch: tests/negative-cases.json')).toBeVisible();
    await expect(page.getByText('Source patch: tests/business-acceptance.json')).toBeVisible();
    expect(JSON.parse(store.get(workspace.id).sourceOverlays['tests/business-acceptance.json']).filter(item => item.rule === 'B900').every(item => item.provenance === 'template-derived')).toBe(true);
    await page.getByLabel('Requirement ID', { exact: true }).fill('BR-012');
    await page.getByLabel('Rule ID', { exact: true }).fill('B900');
    await page.getByLabel('Unique case ID').fill('BR-012-B900-REVIEW-PASS');
    await page.getByLabel('Start (UTC, YYYY-MM-DDTHH:MM:SSZ)').fill('2026-10-01T10:00:00Z');
    await page.getByLabel('End (UTC, YYYY-MM-DDTHH:MM:SSZ)').fill('2026-10-01T12:00:00Z');
    await page.getByLabel('Business scenario and expected result').fill('A maintenance window ending later is accepted.');
    await page.getByRole('button', { name: 'Save reviewer case' }).click();
    await expect(page.getByRole('status')).toContainText('revision 3');
    expect(JSON.parse(store.get(workspace.id).sourceOverlays['tests/business-acceptance.json']).find(item => item.id === 'BR-012-B900-REVIEW-PASS').provenance).toBe('independent');
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('reviewer can inspect a publication target without publishing', async ({ page }) => {
  test.setTimeout(45000);
  const directory = mkdtempSync(join(tmpdir(), 'chargeweave-browser-publish-'));
  const repository = join(directory, 'checkout'), remote = join(directory, 'remote.git');
  mkdirSync(repository);
  const git = (cwd, args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  let store, service;
  try {
    git(directory, ['init', '--bare', remote]); git(repository, ['init']);
    writeFileSync(join(repository, 'README.md'), 'baseline\n');
    git(repository, ['add', '.']); git(repository, ['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-m', 'baseline']);
    git(repository, ['remote', 'add', 'origin', remote]); git(repository, ['push', 'origin', 'HEAD:refs/heads/main']);
    const commit = git(repository, ['rev-parse', 'HEAD']);
    store = new WorkspaceStore(':memory:');
    const workspace = store.create({ title: 'Publication preflight', baselineCommit: commit, schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
    const pairingCode = 'synthetic-pairing-code-'.repeat(2);
    const ciFetch = async () => ({ ok: true, json: async () => ({ workflow_runs: [{ id: 123, name: 'Synthetic check', status: 'completed', conclusion: 'success', head_sha: commit }] }) });
    service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)), repository, publicationFixture: { remote, branch: 'main' }, ciFetch });
    service.listen(0, '127.0.0.1'); await once(service, 'listening');
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('button', { name: 'Check publication target' }).click();
    await expect(page.getByText(/local-test-remote · main · matches-baseline/)).toBeVisible();
    await expect(page.getByText(/Preflight alone does not authorize publication/)).toBeVisible();
    await page.getByRole('button', { name: 'Inspect publication history' }).click();
    await expect(page.getByText(/Publisher permission: not enabled/)).toBeVisible();
    await page.getByLabel('Commit SHA').fill(commit);
    await page.getByRole('button', { name: 'Check commit workflows' }).click();
    await expect(page.getByRole('link', { name: 'Synthetic check' })).toBeVisible();
    await expect(page.getByText(/branch-protection requirements and deployment are not checked/)).toBeVisible();
    expect(git(repository, ['rev-parse', 'HEAD'])).toBe(commit);
  } finally { await page.close(); if (service) await service.shutdown(); store?.close(); rmSync(directory, { recursive: true, force: true }); }
});

test('reviewer opens a simulated draft pull request for a recorded branch', async ({ page }) => {
  test.setTimeout(60000);
  const directory = mkdtempSync(join(tmpdir(), 'chargeweave-browser-pr-'));
  const repository = join(directory, 'repo'), root = fileURLToPath(new URL('../..', import.meta.url));
  const git = args => execFileSync('git', args, { cwd: repository, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  let store, service;
  try {
    mkdirSync(repository); mkdirSync(join(repository, 'model')); mkdirSync(join(repository, 'tools'));
    for (const name of ['authoring_adapter.py', 'domain_schema.py']) copyFileSync(join(root, 'tools', name), join(repository, 'tools', name));
    const schema = 'MODULE|foundation\nRecord|root|A record.|\n';
    writeFileSync(join(repository, 'model', 'domain.schema'), schema);
    git(['init']); git(['add', '.']); git(['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-m', 'baseline']);
    const commit = git(['rev-parse', 'HEAD']);
    store = new WorkspaceStore(':memory:');
    const workspace = store.create({ title: 'Synthetic pull request', baselineCommit: commit, schema, sourceManifest: importSourceManifest(repository, commit) });
    store.apply({ workspaceId: workspace.id, actor: 'draft', operationId: 'edit', expectedRevision: 0, commands: [{ type: 'class.add', name: 'DemoCandidate', module: 'foundation', parent: 'Record', definition: 'A synthetic reviewed candidate.' }] });
    const candidate = store.get(workspace.id);
    for (const profile of ['structural', 'reference', 'audit', 'acceptance']) {
      const job = store.createJob(workspace.id, 1, candidate.sourceDigest, 'test', profile, profile).job;
      store.updateJob(job.id, 'passed');
    }
    const review = store.recordReview(workspace.id, { actor: 'reviewer', operationId: 'accept', expectedRevision: 1, sourceDigest: candidate.sourceDigest, decision: 'accept', reason: 'Synthetic test review.' });
    const preview = store.createJob(workspace.id, 1, candidate.sourceDigest, 'reviewer', 'preview', 'publication-preview', review.id).job;
    store.saveJobArtifacts(preview.id, { reviewId: review.id, sourceDigest: candidate.sourceDigest, baselineCommit: commit, revision: 1, files: [{ path: 'model/domain.schema', sha256: candidate.sourceDigest }] });
    store.updateJob(preview.id, 'passed');
    const intent = store.reservePublication(workspace.id, { actor: 'reviewer', operationId: 'reserve', expectedRevision: 1, sourceDigest: candidate.sourceDigest, reviewId: review.id, previewJobId: preview.id, subject: 'Synthetic model change', body: 'Synthetic test description.' });
    const head = 'b'.repeat(40);
    store.savePublicationCommit(workspace.id, intent.id, head, Buffer.from('synthetic bundle'));
    store.advancePublication(workspace.id, intent.id, 'commit_created', 'push_pending');
    store.advancePublication(workspace.id, intent.id, 'push_pending', 'pushed', head);
    const response = value => ({ ok: true, text: async () => JSON.stringify(value) });
    const pullRequestFetch = async (url, options) => {
      if (url.includes('/pulls?')) return response([]);
      if (url.endsWith('/git/ref/heads/main')) return response({ ref: 'refs/heads/main', object: { sha: commit } });
      if (url.includes('/git/ref/heads/')) return response({ ref: `refs/heads/${intent.branch}`, object: { sha: head } });
      const request = JSON.parse(options.body);
      return response({ number: 77, state: 'open', body: request.body, head: { ref: intent.branch, sha: head, repo: { full_name: 'pli-poc/charge-weave' } }, base: { ref: 'main', repo: { full_name: 'pli-poc/charge-weave' } } });
    };
    const pairingCode = 'synthetic-pairing-code-'.repeat(2);
    service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, repository, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)), allowPublish: true, githubToken: 'synthetic-publisher-token-'.repeat(2), pullRequestFetch });
    service.listen(0, '127.0.0.1'); await once(service, 'listening');
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('button', { name: 'Inspect publication history' }).click();
    await expect(page.getByText(/Publisher permission: enabled/)).toBeVisible();
    await page.getByRole('button', { name: 'Create draft pull request' }).click();
    await expect(page.getByRole('link', { name: 'Pull request #77' })).toBeVisible();
    expect(store.publication(workspace.id, intent.id).state).toBe('pr_created');
  } finally { await page.close(); if (service) await service.shutdown(); store?.close(); rmSync(directory, { recursive: true, force: true }); }
});

test('browser updates a field with a visible compatibility warning', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Field editing', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|recordName:string? peer:Record?\nDevice|Record|A device.|\n' });
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
    await page.getByRole('button', { name: 'Edit recordName' }).click();
    await page.getByLabel('New cardinality').selectOption('!');
    await page.getByRole('button', { name: 'Update field contract' }).click();
    await expect(page.getByRole('status')).toContainText('revision 1');
    expect(store.get(workspace.id).schema).toContain('recordName:string!');
    await page.getByRole('button', { name: 'Inspect changes' }).click();
    await expect(page.getByText(/recordName: potentially-breaking/)).toBeVisible();
    await expect(page.getByText(/existing data or consumers may need migration/)).toBeVisible();
    await page.getByRole('button', { name: 'Require peer' }).click();
    await expect(page.getByRole('status')).toContainText('revision 2');
    expect(store.get(workspace.id).schema).toContain('peer:Record!');
    store.suggestView(workspace.id, { actor: 'codex', operationId: 'suggest-device', expectedRevision: 2, root: 'Device', viewpoint: 'information', explanation: 'Inspect the device.' });
    await expect(page.getByText('Inspect the device.')).toBeVisible();
    await page.getByRole('button', { name: 'Focus Device' }).click();
    await expect(page.getByRole('heading', { name: 'Device', exact: true })).toBeVisible();
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('browser inspects the pinned temporal policy and explicit time fields', async ({ page }) => {
  test.setTimeout(90000);
  const repository = fileURLToPath(new URL('../..', import.meta.url));
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim();
  const show = path => execFileSync('git', ['show', `${commit}:${path}`], { cwd: repository });
  const paths = ['model/audit-rules.json', 'model/domain.schema', 'model/temporal-policy.json', 'model/temporal-queries.json', 'requirements/business-requirements.json', 'requirements/journeys.json', 'tools/authoring_adapter.py', 'tools/domain_schema.py'];
  const manifest = paths.map(path => ({ path, sha256: createHash('sha256').update(show(path)).digest('hex') }));
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Temporal browser test', baselineCommit: commit, schema: show('model/domain.schema').toString('utf8'), sourceManifest: manifest, sourceBlobs: { 'requirements/business-requirements.json': show('requirements/business-requirements.json').toString('utf8'), 'model/temporal-policy.json': show('model/temporal-policy.json').toString('utf8') } });
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode: 'synthetic-pairing-code-'.repeat(2), workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)), repository });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill('synthetic-pairing-code-'.repeat(2));
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByLabel('Search model').fill('TimeWindow');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'TimeWindow', exact: true }).first().click();
    await page.getByRole('button', { name: 'Inspect time for selected concept' }).click();
    await expect(page.getByText('Class policy: snapshot-versioned')).toBeVisible();
    await expect(page.getByText(/Policy source: model\/temporal-policy\.json/)).toBeVisible();
    await expect(page.getByText(/Model revision 0; policy from baseline/)).toContainText(commit);
    await expect(page.getByRole('heading', { name: 'Explicit time fields and window references' })).toBeVisible();
    await page.getByRole('button', { name: 'Inspect responsibilities for selected concept' }).click();
    await expect(page.getByText('No responsibility binding defined in this mapping.')).toBeVisible();
    await page.getByLabel('Search model').fill('ChargingStation');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'ChargingStation', exact: true }).first().click();
    await page.getByRole('button', { name: 'Inspect responsibilities for selected concept' }).click();
    await expect(page.getByText('Asset owner', { exact: true })).toBeVisible();
    await expect(page.getByText(/Asset owner: assetOwner → LegalEntity/)).toBeVisible();
    await page.getByRole('textbox', { name: 'Definition', exact: true }).fill('A reviewed station definition.');
    await page.getByRole('button', { name: 'Save definition' }).click();
    await expect(page.getByRole('status')).toContainText('revision 1');
    await page.getByRole('button', { name: 'Inspect explicit impact references' }).click();
    await expect(page.getByText(/Changed classes: ChargingStation/)).toBeVisible();
    await expect(page.locator('section').filter({ has: page.getByRole('heading', { name: 'Change impact' }) }).getByText(/requirement BR-/).first()).toBeVisible();
    await page.getByLabel('Reason', { exact: true }).fill('Add a deliberate negative fixture.');
    await page.getByRole('button', { name: 'Record reviewer decision' }).click();
    await expect(page.getByText('Add a deliberate negative fixture.')).toBeVisible();
    await expect(page.getByText(/Changes requested · revision 1 · local-reviewer · current/)).toBeVisible();
    await page.getByRole('textbox', { name: 'Definition', exact: true }).fill('A revised station definition.');
    await page.getByRole('button', { name: 'Save definition' }).click();
    await expect(page.getByRole('status')).toContainText('revision 2');
    await expect(page.getByText(/Changes requested · revision 1 · local-reviewer · stale/)).toBeVisible();
    await page.getByLabel('Search requirements').fill('BR-001');
    await page.getByRole('button', { name: 'Search requirements', exact: true }).click();
    await page.locator('li').filter({ hasText: 'BR-001' }).getByRole('button', { name: 'Link selected concept' }).click();
    await expect(page.getByRole('status')).toContainText('revision 3');
    await page.getByRole('button', { name: 'Inspect changes' }).click();
    await expect(page.getByText('Source patch: requirements/business-requirements.json')).toBeVisible();
    await page.getByRole('button', { name: 'Inspect time for selected concept' }).click();
    await page.getByLabel('Set explicit temporal policy').selectOption('immutable-aggregate');
    await page.getByRole('button', { name: 'Save temporal policy' }).click();
    await expect(page.getByRole('status')).toContainText('revision 4');
    await page.getByRole('button', { name: 'Inspect time for selected concept' }).click();
    await expect(page.getByText('Class policy: immutable-aggregate')).toBeVisible();
    await expect(page.getByText(/draft policy from baseline/)).toBeVisible();
    await page.getByRole('button', { name: 'Inspect changes' }).click();
    await expect(page.getByText('Source patch: model/temporal-policy.json')).toBeVisible();
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('browser discovers and edits the shared MCP workspace', async ({ page }) => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Browser test', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|recordName:string!\n' });
  const token = 'test-token-'.repeat(4);
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token, pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)), repository: '.', validationRunner: async (target, input, job) => { target.startJobStep(job.id, 0, 'tools/build.py'); target.finishJobStep(job.id, 0, 'passed'); if (job.profile === 'reference') target.saveJobArtifacts(job.id, { changedCount: 1, baselineManifestSha256: 'a'.repeat(64), candidateManifestSha256: 'b'.repeat(64), changes: [{ path: 'ontology/example.ttl', kind: 'changed' }], omitted: 0, note: 'Synthetic comparison for browser testing.' }); target.updateJob(job.id, 'passed'); } });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await expect(page.getByRole('status')).toContainText('revision 0');
    const cookies = await page.context().cookies();
    expect(cookies.find(cookie => cookie.name === 'cw_studio')?.httpOnly).toBe(true);
    await page.reload();
    await expect(page.getByRole('status')).toContainText('revision 0');
    await page.getByRole('button', { name: 'Run structural generator' }).click();
    await expect(page.getByText('tools/build.py: passed')).toBeVisible();
    await page.getByRole('button', { name: 'Run reference checks' }).click();
    await expect(page.getByRole('heading', { name: 'Generated artifact comparison' })).toBeVisible();
    await expect(page.getByText('changed: ontology/example.ttl')).toBeVisible();
    await page.getByLabel('Search model').fill('Record');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Record', exact: true }).click();
    await page.getByRole('textbox', { name: 'Definition', exact: true }).fill('An edited record.');
    await page.getByRole('button', { name: 'Save definition' }).click();
    await expect(page.getByRole('status')).toContainText('revision 1');
    expect(store.search(workspace.id, 'Record').results[0].definition).toBe('An edited record.');
    await page.getByRole('button', { name: 'Inspect changes' }).click();
    await expect(page.getByText('changed: Record')).toBeVisible();
    await expect(page.getByText('After: An edited record.')).toBeVisible();
    await expect(page.getByText('Source patch', { exact: true })).toBeVisible();
    await expect(page.locator('pre').filter({ hasText: '+Record|root|An edited record.' })).toBeVisible();
    await page.getByText('Add a concept').click();
    await page.getByLabel('Class name').fill('MaintenanceWindow');
    await page.getByLabel('Class definition').fill('A planned maintenance window.');
    await page.getByRole('button', { name: 'Add concept' }).click();
    await expect(page.getByRole('status')).toContainText('revision 2');
    await page.getByLabel('Search model').fill('MaintenanceWindow');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'MaintenanceWindow', exact: true }).click();
    await expect(page.getByText(/recordName: string.*inherited from Record/)).toBeVisible();
    await expect(page.getByRole('img', { name: 'Relationships for MaintenanceWindow' })).toBeVisible();
    await expect(page.getByText('subClassOf →')).toBeVisible();
    await expect(page.getByText(/added · model\/domain\.schema:4/)).toBeVisible();
    await page.getByText('Add a field or relationship').click();
    await page.getByLabel('Field name').fill('windowNote');
    await page.getByRole('button', { name: 'Add field' }).click();
    await expect(page.getByRole('status')).toContainText('revision 3');
    expect(store.search(workspace.id, 'MaintenanceWindow').results[0].fields).toBe('windowNote:string?');
    await page.getByRole('button', { name: 'Undo latest command group' }).click();
    await expect(page.getByRole('status')).toContainText('revision 4');
    expect(store.search(workspace.id, 'MaintenanceWindow').results[0].fields).toBe('');
    await expect(page.getByText(/undid revision 3/)).toBeVisible();
    await page.route('**/events?**', route => route.abort());
    await page.route('**/mcp', route => route.abort());
    service.closeAllConnections();
    await expect(page.getByRole('status')).toContainText('Reconnecting');
    await expect(page.getByRole('button', { name: 'Search', exact: true })).toBeDisabled();
    await page.waitForTimeout(1500);
    await expect(page.getByRole('status')).toContainText('Reconnecting');
    await page.unroute('**/mcp');
    await page.unroute('**/events?**');
    await expect(page.getByRole('status')).toContainText('Connected');
    await expect(page.getByRole('button', { name: 'Search', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Disconnect' }).click();
    await expect(page.getByRole('status')).toContainText('Disconnected');
    expect((await page.context().cookies()).some(cookie => cookie.name === 'cw_studio')).toBe(false);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
