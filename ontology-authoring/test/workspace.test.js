import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { WorkspaceStore } from '../src/workspace.js';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createHash, randomUUID } from 'node:crypto';
import { applyPatch } from 'diff';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { importSourceManifest } from '../src/source-manifest.js';
import { changeImpact } from '../src/impact.js';

const schema = '# source\nMODULE|foundation\nRecord|root|A record.|\n';
test('explicit change set locks accepted and rejected drafts until reviewer reopening', () => {
  const repository = fileURLToPath(new URL('../..', import.meta.url));
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim();
  const baseline = execFileSync('git', ['show', `${commit}:model/domain.schema`], { cwd: repository, encoding: 'utf8' });
  const directory = mkdtempSync(join(tmpdir(), 'chargeweave-changeset-'));
  const path = join(directory, 'workspace.sqlite');
  let store = new WorkspaceStore(path);
  try {
    const workspace = store.create({ title: 'Change set', baselineCommit: commit, schema: baseline, sourceManifest: importSourceManifest(repository, commit) });
    const open = { workspaceId: workspace.id, actor: 'draft', operationId: 'open', expectedRevision: 0, intent: 'Clarify a definition.', requirements: [] };
    const opened = store.openChangeSet(open);
    assert.deepEqual(store.openChangeSet(open), opened);
    assert.equal(opened.changeSet.status, 'draft');
    assert.equal(store.get(workspace.id).revision, 0);
    assert.throws(() => store.openChangeSet({ ...open, operationId: 'another' }), /already has/);
    const edit = { workspaceId: workspace.id, actor: 'draft', operationId: 'edit', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Record', definition: 'A revised record.' }] };
    assert.throws(() => store.apply(edit), /not editable/);
    const edited = store.apply({ ...edit, changeSetId: opened.changeSet.id });
    const reject = store.recordReview(workspace.id, { actor: 'reviewer', operationId: 'reject', expectedRevision: 1, changeSetId: opened.changeSet.id, sourceDigest: edited.sourceDigest, decision: 'reject', reason: 'Needs revision.' });
    assert.equal(reject.decision, 'reject');
    assert.equal(store.get(workspace.id).changeSet.status, 'rejected');
    store.close(); store = new WorkspaceStore(path);
    assert.equal(store.get(workspace.id).changeSet.status, 'rejected');
    assert.throws(() => store.apply({ ...edit, operationId: 'blocked', expectedRevision: 1, changeSetId: opened.changeSet.id }), /not editable/);
    const reopen = { workspaceId: workspace.id, actor: 'reviewer', operationId: 'reopen', expectedRevision: 1, changeSetId: opened.changeSet.id };
    assert.equal(store.reopenChangeSet(reopen).changeSet.status, 'draft');
    assert.equal(store.reopenChangeSet(reopen).changeSet.status, 'draft');
    let acceptanceJob;
    for (const profile of ['structural', 'reference', 'audit', 'acceptance']) {
      const job = store.createJob(workspace.id, 1, edited.sourceDigest, 'test', `job-${profile}`, profile).job;
      store.updateJob(job.id, 'passed');
      if (profile === 'acceptance') acceptanceJob = job.id;
    }
    const accepted = store.recordReview(workspace.id, { actor: 'reviewer', operationId: 'accept', expectedRevision: 1, changeSetId: opened.changeSet.id, sourceDigest: edited.sourceDigest, decision: 'accept', reason: 'Reviewed the evidence.' });
    assert.equal(store.get(workspace.id).changeSet.status, 'accepted');
    assert.equal(accepted.stale, false);
    const publicationId = randomUUID(), now = new Date().toISOString();
    store.db.prepare('INSERT INTO publications (id, workspace, actor, baseline_commit, revision, digest, review_id, preview_job, branch, subject, body, state, commit_sha, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(publicationId, workspace.id, 'reviewer', commit, 1, edited.sourceDigest, accepted.id, acceptanceJob, 'synthetic-branch', 'Synthetic', 'Synthetic test', 'push_unknown', 'a'.repeat(40), now, now);
    assert.throws(() => store.reopenChangeSet({ ...reopen, operationId: 'uncertain-push' }), /requires reconciliation/);
    store.db.prepare("UPDATE publications SET state = 'commit_created' WHERE id = ?").run(publicationId);
    store.reopenChangeSet({ ...reopen, operationId: 'reopen-accepted' });
    assert.equal(store.reviewDecision(workspace.id, accepted.id).stale, true);
    assert.throws(() => store.advancePublication(workspace.id, publicationId, 'commit_created', 'push_pending'), /review is stale/);
    assert.equal(store.get(workspace.id).revision, 1);
    assert.equal(store.get(workspace.id).sourceDigest, edited.sourceDigest);
  } finally { store.close(); rmSync(directory, { recursive: true, force: true }); }
});
test('curated responsibility mappings refer to declared object relationships', () => {
  const model = readFileSync(fileURLToPath(new URL('../../model/domain.schema', import.meta.url)), 'utf8');
  const mappings = JSON.parse(readFileSync(fileURLToPath(new URL('../../model/responsibility-bindings.json', import.meta.url)), 'utf8'));
  const classes = new Set(model.split(/\r?\n/).filter(line => line && !line.startsWith('#') && !line.startsWith('MODULE|')).map(line => line.split('|')[0]));
  for (const binding of mappings.bindings) {
    const row = model.split(/\r?\n/).find(line => line.startsWith(`${binding.owner}|`));
    assert.ok(row, `Missing owner ${binding.owner}`);
    assert.ok(classes.has(binding.range), `Missing target ${binding.range}`);
    assert.match(row.split('|')[3], new RegExp(`(?:^|\\s)${binding.property}:${binding.range}[!?+*](?:\\s|$)`));
  }
});
test('responsibility bindings attach only to declared relationships and undo atomically', () => {
  const source = 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|owner:Record?\n';
  const mapping = JSON.stringify({ version: 'chargeweave-responsibility-v1', bindings: [] }, null, 2) + '\n';
  const adapter = fileURLToPath(new URL('../../tools/authoring_adapter.py', import.meta.url));
  const parser = fileURLToPath(new URL('../../tools/domain_schema.py', import.meta.url));
  const entries = { 'model/domain.schema': source, 'model/responsibility-bindings.json': mapping, 'tools/authoring_adapter.py': readFileSync(adapter, 'utf8'), 'tools/domain_schema.py': readFileSync(parser, 'utf8') };
  const manifest = Object.entries(entries).map(([path, content]) => ({ path, sha256: createHash('sha256').update(content).digest('hex') })).sort((a, b) => a.path < b.path ? -1 : 1);
  const store = new WorkspaceStore(':memory:');
  try {
    const workspace = store.create({ title: 'Bindings', baselineCommit: 'a'.repeat(40), schema: source, sourceManifest: manifest, sourceBlobs: { 'model/responsibility-bindings.json': mapping } });
    const command = { type: 'viewpoint.binding_add', owner: 'Device', property: 'owner', range: 'Record', label: 'Accountable party', category: 'ownership' };
    assert.throws(() => store.apply({ workspaceId: workspace.id, actor: 'test', operationId: 'invalid', expectedRevision: 0, commands: [{ ...command, range: 'Device' }] }), /existing declared object relationship/);
    const applied = store.apply({ workspaceId: workspace.id, actor: 'test', operationId: 'binding', expectedRevision: 0, commands: [command] });
    const result = store.responsibilityView(workspace.id, 'Device', 1);
    assert.equal(result.bindings[0].label, 'Accountable party');
    assert.deepEqual(result.bindings[0].mappingSource, { path: 'model/responsibility-bindings.json', scope: 'draft' });
    assert.equal(store.get(workspace.id).schema, source);
    assert.ok(store.diff(workspace.id).additionalSources.some(item => item.path === 'model/responsibility-bindings.json'));
    assert.throws(() => store.apply({ workspaceId: workspace.id, actor: 'test', operationId: 'duplicate', expectedRevision: 1, commands: [command] }), /Duplicate/);
    store.undo({ workspaceId: workspace.id, actor: 'test', operationId: 'undo', expectedRevision: 1, targetRevision: 1 });
    assert.equal(store.get(workspace.id).sourceDigest, workspace.sourceDigest);
    assert.deepEqual(store.responsibilityView(workspace.id, 'Device', 2).bindings, []);
    assert.notEqual(applied.sourceDigest, workspace.sourceDigest);
  } finally { store.close(); }
});
test('shared view revisions persist independently and reject conflicts without changing semantics', () => {
  const directory = mkdtempSync(join(tmpdir(), 'chargeweave-views-'));
  let store;
  try {
    const path = join(directory, 'workspace.sqlite');
    store = new WorkspaceStore(path);
    const workspace = store.create({ title: 'Views', baselineCommit: 'a'.repeat(40), schema });
    const request = { workspaceId: workspace.id, viewId: 'default', actor: 'reviewer', operationId: 'save', expectedViewRevision: 0, definition: { root: 'Record', positions: { Record: { x: 10, y: 20 } }, mappingVersion: 'chargeweave-authoring-v1', viewpoint: 'information', filter: '', groups: [{ name: 'Core', members: ['Record'] }], annotations: [{ target: 'Record', text: 'Presentation note.' }] } };
    const saved = store.saveView(request);
    assert.equal(saved.viewRevision, 1);
    assert.equal(saved.semanticRevision, 0);
    assert.deepEqual(store.saveView(request), saved);
    assert.equal(store.get(workspace.id).sourceDigest, workspace.sourceDigest);
    assert.throws(() => store.saveView({ ...request, operationId: 'other' }), /revision conflict/);
    assert.throws(() => store.saveView({ ...request, operationId: 'bad', expectedViewRevision: 1, definition: { root: 'Missing', positions: {} } }), /unknown concept/);
    assert.throws(() => store.saveView({ ...request, operationId: 'bad-group', expectedViewRevision: 1, definition: { ...request.definition, groups: [{ name: 'Invalid', members: ['Missing'] }] } }), /unknown concept/);
    store.close(); store = new WorkspaceStore(path);
    assert.deepEqual(store.savedView(workspace.id, 'default').definition, request.definition);
    assert.equal(store.savedView(workspace.id, 'default').viewRevision, 1);
    assert.deepEqual(store.savedViews(workspace.id).views, [{ viewId: 'default', viewRevision: 1 }]);
    assert.equal(store.get(workspace.id).revision, 0);
  } finally { store?.close(); rmSync(directory, { recursive: true, force: true }); }
});
test('historical comparisons retain exact command snapshots across edits, undo and restart', () => {
  const directory = mkdtempSync(join(tmpdir(), 'chargeweave-history-'));
  let store;
  try {
    const path = join(directory, 'workspace.sqlite');
    store = new WorkspaceStore(path);
    const workspace = store.create({ title: 'History', baselineCommit: 'a'.repeat(40), schema });
    store.apply({ workspaceId: workspace.id, actor: 'reviewer', operationId: 'first', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Record', definition: 'First revision.' }] });
    const digest = store.get(workspace.id).sourceDigest;
    store.apply({ workspaceId: workspace.id, actor: 'codex', operationId: 'second', expectedRevision: 1, commands: [{ type: 'class.describe', name: 'Record', definition: 'Second revision.' }] });
    store.undo({ workspaceId: workspace.id, actor: 'reviewer', operationId: 'undo', expectedRevision: 2, targetRevision: 2 });
    const current = store.get(workspace.id);
    store.close(); store = new WorkspaceStore(path);
    const first = store.historyDetail(workspace.id, 1), second = store.historyDetail(workspace.id, 2);
    assert.equal(first.sourceDigest, digest);
    assert.equal(first.actor, 'reviewer');
    assert.match(first.createdAt, /^\d{4}-\d\d-\d\dT/);
    assert.equal(store.events(workspace.id)[0].createdAt, first.createdAt);
    assert.match(first.patch, /\+Record\|root\|First revision\./);
    assert.match(second.patch, /\+Record\|root\|Second revision\./);
    assert.match(second.baselinePatch, /\+Record\|root\|Second revision\./);
    assert.equal(store.get(workspace.id).sourceDigest, current.sourceDigest);
    assert.equal(store.get(workspace.id).revision, 3);
    assert.throws(() => store.historyDetail(workspace.id, 3), /not found/);
    store.db.prepare('UPDATE command_groups SET after_schema = NULL WHERE workspace = ? AND revision = 1').run(workspace.id);
    assert.equal(store.historyDetail(workspace.id, 1).available, false);
  } finally { store?.close(); rmSync(directory, { recursive: true, force: true }); }
});
test('view suggestions survive restart without changing the candidate or duplicating events', () => {
  const directory = mkdtempSync(join(tmpdir(), 'chargeweave-suggestions-'));
  let store;
  try {
    const path = join(directory, 'workspace.sqlite');
    store = new WorkspaceStore(path);
    const workspace = store.create({ title: 'Suggestion', baselineCommit: 'a'.repeat(40), schema });
    const request = { actor: 'codex', operationId: 'suggest', expectedRevision: 0, root: 'Record', viewpoint: 'information', explanation: 'Inspect this concept.' };
    const first = store.suggestView(workspace.id, request);
    store.close(); store = new WorkspaceStore(path);
    assert.equal(store.suggestView(workspace.id, request).eventSequence, first.eventSequence);
    assert.equal(store.events(workspace.id).length, 1);
    assert.equal(store.get(workspace.id).sourceDigest, workspace.sourceDigest);
    assert.equal(store.get(workspace.id).revision, 0);
    assert.throws(() => store.suggestView(workspace.id, { ...request, explanation: 'Changed.' }), /reused/);
  } finally { store?.close(); rmSync(directory, { recursive: true, force: true }); }
});
test('version-four drafts atomically link an existing requirement and undo both sources', () => {
  const repository = fileURLToPath(new URL('../..', import.meta.url));
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim();
  const show = path => execFileSync('git', ['show', `${commit}:${path}`], { cwd: repository, encoding: 'utf8' });
  const baselineSchema = show('model/domain.schema'), requirements = show('requirements/business-requirements.json'), policy = show('model/temporal-policy.json');
  const manifest = importSourceManifest(repository, commit);
  const store = new WorkspaceStore(':memory:');
  assert.throws(() => store.create({ title: 'Bad source', baselineCommit: commit, schema: baselineSchema, sourceManifest: manifest, sourceBlobs: { 'requirements/business-requirements.json': '{}\n' } }), /Invalid editable source blob/);
  assert.throws(() => store.create({ title: 'Unsafe source', baselineCommit: commit, schema: baselineSchema, sourceManifest: manifest, sourceBlobs: { '../outside.json': '{}' } }), /Invalid editable source blob/);
  const workspace = store.create({ title: 'Multi-source', baselineCommit: commit, schema: baselineSchema, sourceManifest: manifest, sourceBlobs: { 'requirements/business-requirements.json': requirements, 'model/temporal-policy.json': policy } });
  assert.equal(workspace.digestVersion, 4);
  assert.deepEqual(workspace.sourceOverlays, {});
  const requirement = store.requirementsSearch(workspace.id, 'BR-001', 20, 0).results.find(item => item.id === 'BR-001');
  const request = { workspaceId: workspace.id, actor: 'test', operationId: 'link', expectedRevision: 0, commands: [
    { type: 'class.add', name: 'NewDomainConcept', module: 'foundation', parent: 'Record', definition: 'A new domain concept.' },
    { type: 'requirement.link', requirementId: requirement.id, className: 'NewDomainConcept', expectedClasses: requirement.classes },
    { type: 'temporal.policy_set', className: 'NewDomainConcept', expectedPolicy: null, policy: 'snapshot-versioned' },
  ] };
  assert.throws(() => store.apply({ ...request, operationId: 'rollback', commands: [...request.commands, { type: 'class.add', name: 'Record', module: 'foundation', parent: 'Record', definition: 'Duplicate.' }] }), /Invalid/);
  assert.deepEqual(store.get(workspace.id).sourceOverlays, {});
  assert.equal(store.get(workspace.id).sourceDigest, workspace.sourceDigest);
  const result = store.apply(request);
  assert.equal(store.apply(request).revision, result.revision);
  const changed = store.get(workspace.id);
  assert.notEqual(changed.sourceDigest, workspace.sourceDigest);
  const source = changed.sourceOverlays['requirements/business-requirements.json'];
  assert.ok(JSON.parse(source).find(item => item.id === requirement.id).classes.includes('NewDomainConcept'));
  const diff = store.diff(workspace.id);
  assert.equal(diff.additionalSources.length, 2);
  assert.equal(applyPatch(requirements, diff.additionalSources.find(item => item.path === 'requirements/business-requirements.json').patch), source);
  assert.equal(applyPatch(policy, diff.additionalSources.find(item => item.path === 'model/temporal-policy.json').patch), changed.sourceOverlays['model/temporal-policy.json']);
  const temporal = store.temporalView(workspace.id, 'NewDomainConcept', 1, repository);
  assert.equal(temporal.policy, 'snapshot-versioned');
  assert.equal(temporal.policySource.scope, 'draft');
  assert.ok(changeImpact(changed, diff.changes, repository).references.some(item => item.kind === 'requirement' && item.id === 'BR-001' && item.terms.includes('NewDomainConcept')));
  assert.throws(() => store.apply({ ...request, operationId: 'bad', expectedRevision: 1, commands: [{ ...request.commands[1], expectedClasses: [] }] }), /precondition/);
  assert.throws(() => store.apply({ ...request, operationId: 'bad-policy', expectedRevision: 1, commands: [{ ...request.commands[2], policy: 'abstract' }] }), /precondition/);
  assert.equal(store.get(workspace.id).sourceDigest, changed.sourceDigest);
  store.undo({ workspaceId: workspace.id, actor: 'test', operationId: 'undo', expectedRevision: 1, targetRevision: 1 });
  assert.deepEqual(store.get(workspace.id).sourceOverlays, {});
  assert.equal(store.get(workspace.id).sourceDigest, workspace.sourceDigest);
  assert.equal(store.get(workspace.id).schema, workspace.schema);
  const historical = store.historyDetail(workspace.id, 1);
  assert.equal(historical.sourceDigest, changed.sourceDigest);
  assert.equal(applyPatch(requirements, historical.additionalSources.find(item => item.path === 'requirements/business-requirements.json').patch), source);
  assert.equal(applyPatch(policy, historical.additionalSources.find(item => item.path === 'model/temporal-policy.json').patch), changed.sourceOverlays['model/temporal-policy.json']);
  store.close();
});
test('version-four source overlays and receipts survive restart', () => {
  const directory = mkdtempSync(join(tmpdir(), 'chargeweave-sources-'));
  let store;
  try {
    const path = join(directory, 'workspace.sqlite');
    const baselineSchema = 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|\nOther|Record|Another record.|\n';
    const requirements = JSON.stringify([{ id: 'BR-001', statement: 'A requirement', classes: ['Record'] }], null, 2) + '\n';
    const hash = value => createHash('sha256').update(value).digest('hex');
    const manifest = [
      { path: 'model/domain.schema', sha256: hash(baselineSchema) },
      { path: 'requirements/business-requirements.json', sha256: hash(requirements) },
      { path: 'tools/authoring_adapter.py', sha256: hash(readFileSync(new URL('../../tools/authoring_adapter.py', import.meta.url))) },
      { path: 'tools/domain_schema.py', sha256: hash(readFileSync(new URL('../../tools/domain_schema.py', import.meta.url))) },
    ];
    store = new WorkspaceStore(path);
    const workspace = store.create({ title: 'Restart', baselineCommit: 'a'.repeat(40), schema: baselineSchema, sourceManifest: manifest, sourceBlobs: { 'requirements/business-requirements.json': requirements } });
    const request = { workspaceId: workspace.id, actor: 'test', operationId: 'link', expectedRevision: 0, commands: [{ type: 'requirement.link', requirementId: 'BR-001', className: 'Device', expectedClasses: ['Record'] }] };
    const result = store.apply(request);
    store.close(); store = new WorkspaceStore(path);
    assert.equal(store.apply(request).revision, result.revision);
    assert.equal(store.get(workspace.id).sourceDigest, result.sourceDigest);
    assert.deepEqual(store.requirementsSearch(workspace.id, 'BR-001').results[0].classes, ['Record', 'Device']);
    store.apply({ workspaceId: workspace.id, actor: 'test', operationId: 'second', expectedRevision: 1, commands: [{ type: 'requirement.link', requirementId: 'BR-001', className: 'Other', expectedClasses: ['Record', 'Device'] }] });
    assert.deepEqual(store.requirementsSearch(workspace.id, 'BR-001').results[0].classes, ['Record', 'Device', 'Other']);
    store.undo({ workspaceId: workspace.id, actor: 'test', operationId: 'undo', expectedRevision: 2, targetRevision: 2 });
    assert.equal(store.get(workspace.id).sourceDigest, result.sourceDigest);
    assert.deepEqual(store.requirementsSearch(workspace.id, 'BR-001').results[0].classes, ['Record', 'Device']);
  } finally { store?.close(); rmSync(directory, { recursive: true, force: true }); }
});
test('field updates enforce old contracts and classify compatibility in review', () => {
  const store = new WorkspaceStore(':memory:');
  const source = 'MODULE|foundation\nRecord|root|A record.|label:string?\n';
  const workspace = store.create({ title: 'Field review', baselineCommit: 'a'.repeat(40), schema: source });
  const command = { type: 'property.update', owner: 'Record', name: 'label', expectedRange: 'string', expectedCardinality: '?', range: 'string', cardinality: '!' };
  assert.throws(() => store.apply({ workspaceId: workspace.id, actor: 'test', operationId: 'stale', expectedRevision: 0, commands: [{ ...command, expectedCardinality: '*' }] }), /precondition/);
  store.apply({ workspaceId: workspace.id, actor: 'test', operationId: 'tighten', expectedRevision: 0, commands: [command] });
  assert.equal(store.diff(workspace.id).changes[0].fieldChanges[0].compatibility, 'potentially-breaking');
  assert.match(store.get(workspace.id).schema, /label:string!/);
  store.undo({ workspaceId: workspace.id, actor: 'test', operationId: 'undo', expectedRevision: 1, targetRevision: 1 });
  assert.equal(store.get(workspace.id).schema, source);
  store.close();
});
test('responsibility view shows only exact mapped declarations and preserves source provenance', () => {
  const repository = fileURLToPath(new URL('../..', import.meta.url));
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim();
  const baselineSchema = execFileSync('git', ['show', `${commit}:model/domain.schema`], { cwd: repository, encoding: 'utf8' });
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Responsibility', baselineCommit: commit, schema: baselineSchema });
  const view = store.responsibilityView(workspace.id, 'ChargingStation', 0);
  assert.equal(view.coverage, 'partial');
  const owner = view.bindings.find(binding => binding.property === 'assetOwner');
  assert.equal(owner.category, 'ownership');
  assert.equal(owner.predicateIri, 'https://example.org/charge-domain#assetOwner');
  assert.equal(owner.targetIri, 'https://example.org/charge-domain#LegalEntity');
  assert.equal(owner.source.path, 'model/domain.schema');
  assert.equal(owner.mappingVersion, view.mappingVersion);
  assert.deepEqual(store.responsibilityView(workspace.id, 'TimeWindow', 0).bindings, []);
  assert.throws(() => store.responsibilityView(workspace.id, 'ChargingStation', 1), /Revision conflict/);
  store.close();
});
test('temporal view binds policy to the baseline and exposes only explicit time fields', () => {
  const repository = fileURLToPath(new URL('../..', import.meta.url));
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim();
  const show = path => execFileSync('git', ['show', `${commit}:${path}`], { cwd: repository });
  const hash = bytes => createHash('sha256').update(bytes).digest('hex');
  const baselineSchema = show('model/domain.schema').toString('utf8');
  const paths = ['model/domain.schema', 'model/temporal-policy.json', 'tools/authoring_adapter.py', 'tools/domain_schema.py'];
  const manifest = paths.map(path => ({ path, sha256: hash(show(path)) }));
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Temporal', baselineCommit: commit, schema: baselineSchema, sourceManifest: manifest });
  const view = store.temporalView(workspace.id, 'TimeWindow', 0, repository);
  assert.equal(view.policy, 'snapshot-versioned');
  assert.equal(view.policySource.sha256, manifest[1].sha256);
  assert.equal(view.baselineCommit, commit);
  assert.ok(view.fields.some(field => field.range === 'dateTime'));
  assert.ok(view.fields.every(field => field.source.path === 'model/domain.schema'));
  assert.throws(() => store.temporalView(workspace.id, 'TimeWindow', 1, repository), /Revision conflict/);
  store.apply({ workspaceId: workspace.id, actor: 'test', operationId: 'new', expectedRevision: 0, commands: [{ type: 'class.add', name: 'NewTemporalConcept', module: 'foundation', parent: 'Record', definition: 'A new concept.' }] });
  assert.equal(store.temporalView(workspace.id, 'NewTemporalConcept', 1, repository).policy, null);
  const legacy = store.create({ title: 'Legacy', baselineCommit: commit, schema: baselineSchema });
  assert.throws(() => store.temporalView(legacy.id, 'TimeWindow', 0, repository), /pinned source manifest/);
  store.close();
});
test('information view traces draft relationships to source and baseline', () => {
  const store = new WorkspaceStore(':memory:');
  const initial = '# source\nMODULE|foundation\nRecord|root|A record.|\nDevice|-|A device.|owns:Record!\n';
  const workspace = store.create({ title: 'View', baselineCommit: 'a'.repeat(40), schema: initial });
  const first = store.view(workspace.id, 'Device', 0);
  assert.equal(first.viewpoint, 'information');
  assert.equal(first.nodes[0].iri, 'https://example.org/charge-domain#Device');
  assert.deepEqual(first.nodes[0].sourceRef, { path: 'model/domain.schema', line: 4 });
  assert.equal(first.nodes[0].changeStatus, 'unchanged');
  assert.equal(first.edges.find(edge => edge.predicate === 'owns').cardinality, '!');
  assert.equal(first.edges.find(edge => edge.predicate === 'owns').changeStatus, 'unchanged');
  store.apply({ workspaceId: workspace.id, actor: 'test', operationId: 'edit', expectedRevision: 0, commands: [{ type: 'relationship.add', owner: 'Device', name: 'references', range: 'Record', cardinality: '*' }] });
  const next = store.view(workspace.id, 'Device', 1);
  assert.equal(next.nodes[0].changeStatus, 'changed');
  const edge = next.edges.find(item => item.predicate === 'references');
  assert.equal(edge.changeStatus, 'added');
  assert.equal(edge.predicateIri, 'https://example.org/charge-domain#references');
  assert.deepEqual(edge.sourceRef, { path: 'model/domain.schema', line: 4 });
  assert.equal(edge.cardinality, '*');
  assert.equal(edge.mappingVersion, next.mappingVersion);
  store.close();
});
test('candidate identity binds the pinned baseline', () => {
  const store = new WorkspaceStore(':memory:');
  const first = store.create({ title: 'One', baselineCommit: 'a'.repeat(40), schema });
  const second = store.create({ title: 'Two', baselineCommit: 'b'.repeat(40), schema });
  assert.equal(first.digestVersion, 2);
  assert.notEqual(first.sourceDigest, second.sourceDigest);
  const hash = value => createHash('sha256').update(value).digest('hex');
  assert.throws(() => store.create({ title: 'Unsafe', baselineCommit: 'a'.repeat(40), schema, sourceManifest: [{ path: 'model/../secret', sha256: '0'.repeat(64) }, { path: 'model/domain.schema', sha256: hash(schema) }] }), /Invalid source manifest/);
  const baseManifest = [{ path: 'model/domain.schema', sha256: hash(schema) }, { path: 'tools/build.py', sha256: '1'.repeat(64) }];
  const third = store.create({ title: 'Three', baselineCommit: 'a'.repeat(40), schema, sourceManifest: baseManifest });
  const fourth = store.create({ title: 'Four', baselineCommit: 'a'.repeat(40), schema, sourceManifest: [baseManifest[0], { ...baseManifest[1], sha256: '2'.repeat(64) }] });
  assert.equal(third.digestVersion, 3);
  assert.notEqual(third.sourceDigest, fourth.sourceDigest);
  store.close();
});

test('version-three workspaces refuse mismatched or missing parser adapters', () => {
  const store = new WorkspaceStore(':memory:');
  const hash = bytes => createHash('sha256').update(bytes).digest('hex');
  const manifest = [
    { path: 'model/domain.schema', sha256: hash(schema) },
    { path: 'tools/authoring_adapter.py', sha256: hash(readFileSync(new URL('../../tools/authoring_adapter.py', import.meta.url))) },
    { path: 'tools/domain_schema.py', sha256: hash(readFileSync(new URL('../../tools/domain_schema.py', import.meta.url))) },
  ];
  const workspace = store.create({ title: 'Pinned', baselineCommit: 'a'.repeat(40), schema, sourceManifest: manifest });
  const request = { workspaceId: workspace.id, actor: 'test', operationId: 'edit', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Record', definition: 'Updated.' }] };
  assert.equal(store.apply(request).revision, 1);
  const mismatched = store.create({ title: 'Mismatched', baselineCommit: 'a'.repeat(40), schema, sourceManifest: [manifest[0], { ...manifest[1], sha256: '0'.repeat(64) }, manifest[2]] });
  assert.throws(() => store.apply({ ...request, workspaceId: mismatched.id }), /Pinned adapter differs/);
  assert.throws(() => store.entity(mismatched.id, 'Record'), /Pinned adapter differs/);
  assert.equal(store.get(mismatched.id).revision, 0);
  store.close();
});

test('legacy workspace digests and undo remain usable without rewriting receipts', () => {
  const directory = mkdtempSync(join(tmpdir(), 'chargeweave-legacy-'));
  try {
    const path = join(directory, 'store.sqlite'), id = randomUUID();
    const hash = value => createHash('sha256').update(value).digest('hex');
    const digest = hash(JSON.stringify({ adapter: 'domain-schema-v1', sources: { 'model/domain.schema': hash(schema) } }));
    const db = new DatabaseSync(path);
    db.exec('CREATE TABLE workspaces (id TEXT PRIMARY KEY, title TEXT NOT NULL, baseline_commit TEXT NOT NULL, baseline_schema TEXT NOT NULL, schema TEXT NOT NULL, revision INTEGER NOT NULL, digest TEXT NOT NULL)');
    db.prepare('INSERT INTO workspaces VALUES (?, ?, ?, ?, ?, 0, ?)').run(id, 'Legacy', 'a'.repeat(40), schema, schema, digest);
    db.close();
    const store = new WorkspaceStore(path);
    assert.equal(store.get(id).digestVersion, 1);
    assert.equal(store.get(id).sourceDigest, digest);
    assert.ok(store.reviewReadiness(id).missing.includes('legacy digest does not bind the baseline commit'));
    store.apply({ workspaceId: id, actor: 'test', operationId: 'edit', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Record', definition: 'Changed.' }] });
    store.undo({ workspaceId: id, actor: 'test', operationId: 'undo', expectedRevision: 1, targetRevision: 1 });
    assert.equal(store.get(id).sourceDigest, digest);
    store.close();
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
test('atomic edits, durable receipts and stale revisions', () => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Test', baselineCommit: 'a'.repeat(40), schema });
  const request = { workspaceId: workspace.id, actor: 'architect', operationId: 'one', expectedRevision: 0, commands: [{ type: 'class.add', module: 'foundation', name: 'Example', parent: 'Record', definition: 'An example.' }] };
  const result = store.apply(request);
  assert.deepEqual(store.apply(request), result);
  assert.equal(store.search(workspace.id, 'example').results[0].name, 'Example');
  assert.equal(store.entity(workspace.id, 'Example', 1).entity.source.path, 'model/domain.schema');
  assert.throws(() => store.entity(workspace.id, 'Example', 0), /Revision conflict/);
  assert.throws(() => store.view(workspace.id, 'Example', 0), /Revision conflict/);
  assert.throws(() => store.search(workspace.id, 'example', 25, 0), /Revision conflict/);
  assert.throws(() => store.apply({ ...request, commands: [] }), /reused/);
  assert.throws(() => store.apply({ ...request, operationId: 'two' }), /Stale/);
  assert.throws(() => store.apply({ ...request, operationId: 'three', expectedRevision: 1, commands: [{ type: 'class.describe', name: 'Example', definition: 'Changed.' }, { type: 'class.add', name: 'Example' }] }), /Invalid/);
  assert.equal(store.get(workspace.id).revision, 1);
  assert.equal(store.search(workspace.id, 'example').results[0].definition, 'An example.');
  assert.equal(store.events(workspace.id).length, 1);
  assert.equal(store.snapshot(workspace.id).eventSequence, result.eventSequence);
  assert.equal(store.reviewReadiness(workspace.id).canAccept, false);
  store.close();
});

test('typed fields reject unknown targets and reused global properties atomically', () => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Fields', baselineCommit: 'a'.repeat(40), schema });
  const base = { workspaceId: workspace.id, actor: 'architect', expectedRevision: 0 };
  assert.throws(() => store.apply({ ...base, operationId: 'bad', commands: [{ type: 'relationship.add', owner: 'Record', name: 'target', range: 'Missing', cardinality: '!' }] }), /Invalid/);
  store.apply({ ...base, operationId: 'good', commands: [{ type: 'property.add', owner: 'Record', name: 'title', range: 'string', cardinality: '!' }, { type: 'relationship.add', owner: 'Record', name: 'related', range: 'Record', cardinality: '*' }] });
  assert.match(store.get(workspace.id).schema, /title:string! related:Record\*/);
  assert.deepEqual(store.view(workspace.id, 'Record').edges.map(edge => edge.predicate), ['related']);
  assert.equal(store.diff(workspace.id).changes[0].kind, 'changed');
  assert.equal(store.diff(workspace.id).source.before, schema);
  assert.equal(applyPatch(schema, store.diff(workspace.id).source.patch), store.get(workspace.id).schema);
  assert.throws(() => store.apply({ ...base, expectedRevision: 1, operationId: 'duplicate', commands: [{ type: 'property.add', owner: 'Record', name: 'title', range: 'string', cardinality: '?' }] }), /Invalid/);
  assert.throws(() => store.apply({ ...base, expectedRevision: 1, operationId: 'bad-enum', commands: [{ type: 'property.add', owner: 'Record', name: 'state', range: '{Draft,Draft}', cardinality: '!' }] }), /Invalid/);
  store.apply({ ...base, expectedRevision: 1, operationId: 'enum', commands: [{ type: 'property.add', owner: 'Record', name: 'state', range: '{Draft,Confirmed,Cancelled}', cardinality: '!' }] });
  assert.match(store.get(workspace.id).schema, /state:\{Draft,Confirmed,Cancelled\}!/);
  store.close();
});

test('undo restores the latest group as an idempotent new revision', () => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Undo', baselineCommit: 'a'.repeat(40), schema });
  store.apply({ workspaceId: workspace.id, actor: 'test', operationId: 'edit', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Record', definition: 'Changed.' }] });
  const request = { workspaceId: workspace.id, actor: 'test', operationId: 'undo', expectedRevision: 1, targetRevision: 1 };
  const result = store.undo(request);
  assert.equal(result.revision, 2);
  assert.equal(store.get(workspace.id).schema, schema);
  assert.deepEqual(store.undo(request), result);
  assert.throws(() => store.undo({ ...request, operationId: 'again', expectedRevision: 2 }), /latest revision/);
  assert.equal(store.events(workspace.id)[1].payload.type, 'undo');
  store.close();
});

test('event predecessors are workspace-specific despite interleaved global sequences', () => {
  const store = new WorkspaceStore(':memory:');
  const first = store.create({ title: 'First', baselineCommit: 'a'.repeat(40), schema });
  const second = store.create({ title: 'Second', baselineCommit: 'a'.repeat(40), schema });
  const edit = (workspaceId, expectedRevision, operationId) => store.apply({ workspaceId, actor: 'test', operationId, expectedRevision, commands: [{ type: 'class.describe', name: 'Record', definition: operationId }] });
  const a = edit(first.id, 0, 'one');
  const b = edit(second.id, 0, 'other');
  const c = edit(first.id, 1, 'two');
  assert.equal(store.events(first.id, a.eventSequence)[0].previousSequence, a.eventSequence);
  assert.equal(store.hasCursor(first.id, b.eventSequence), false);
  assert.equal(store.hasCursor(first.id, c.eventSequence), true);
  store.close();
});

test('real repository schema is searchable and receipts survive restart', () => {
  const directory = mkdtempSync(join(tmpdir(), 'chargeweave-workspace-'));
  try {
    const path = join(directory, 'workspace.sqlite');
    let store = new WorkspaceStore(path);
    const workspace = store.create({ title: 'Real model', baselineCommit: 'a'.repeat(40), schema: readFileSync(new URL('../../model/domain.schema', import.meta.url), 'utf8') });
    assert.equal(store.search(workspace.id, 'ChargingStation').results.some(item => item.name === 'ChargingStation'), true);
    const request = { workspaceId: workspace.id, actor: 'architect', operationId: 'persisted', expectedRevision: 0, commands: [{ type: 'class.add', module: 'foundation', name: 'ExampleDraft', parent: 'Record', definition: 'A draft example.' }] };
    const result = store.apply(request);
    store.close();
    store = new WorkspaceStore(path);
    assert.deepEqual(store.apply(request), result);
    assert.equal(store.get(workspace.id).revision, 1);
    assert.equal(store.events(workspace.id)[0].sequence, result.eventSequence);
    store.close();
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
