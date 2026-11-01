import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../src/workspace.js';
import { runGenerator, releaseGates } from '../src/validation.js';
import { importSourceManifest } from '../src/source-manifest.js';

test('acceptance profile matches the repository release gate catalogue', () => {
  const repository = fileURLToPath(new URL('../..', import.meta.url));
  const output = execFileSync(process.env.CHARGEWEAVE_TEST_PYTHON || 'python', ['tools/verify_all.py', '--list-json'], { cwd: repository, encoding: 'utf8' });
  assert.deepEqual(JSON.parse(output), releaseGates);
});

test('generator evidence is bound to its input and becomes stale after edits', async () => {
  const repository = fileURLToPath(new URL('../..', import.meta.url));
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim();
  const schema = execFileSync('git', ['show', `${commit}:model/domain.schema`], { cwd: repository, encoding: 'utf8' });
  const store = new WorkspaceStore(':memory:');
  const sourceManifest = importSourceManifest(repository, commit);
  const created = store.create({ title: 'Validation', baselineCommit: commit, schema, sourceManifest });
  assert.equal(created.digestVersion, 3);
  assert.deepEqual(created.sourceManifest, sourceManifest);
  store.apply({ workspaceId: created.id, actor: 'test', operationId: 'enum', expectedRevision: 0, commands: [{ type: 'class.add', name: 'ValidationExample', module: 'foundation', parent: 'Record', definition: 'A validation example.' }, { type: 'property.add', owner: 'ValidationExample', name: 'validationExampleState', range: '{Draft,Confirmed,Cancelled}', cardinality: '!' }] });
  const workspace = store.get(created.id);
  assert.notEqual(workspace.sourceManifest.find(item => item.path === 'model/domain.schema').sha256, sourceManifest.find(item => item.path === 'model/domain.schema').sha256);
  const { job } = store.createJob(workspace.id, workspace.revision, workspace.sourceDigest, 'test', 'job-one');
  assert.equal(store.createJob(workspace.id, workspace.revision, workspace.sourceDigest, 'test', 'job-one').created, false);
  assert.throws(() => store.createJob(workspace.id, workspace.revision, workspace.sourceDigest, 'test', 'concurrent'), /already active/);
  assert.throws(() => store.createJob(workspace.id, 2, workspace.sourceDigest, 'test', 'job-one'), /reused/);
  await runGenerator(store, workspace, job, repository, process.env.CHARGEWEAVE_TEST_PYTHON || process.execPath);
  const finished = store.job(workspace.id, job.id);
  assert.equal(finished.status, process.env.CHARGEWEAVE_TEST_PYTHON ? 'passed' : 'failed', finished.output);
  assert.equal(finished.steps.length, 1);
  assert.equal(finished.steps[0].checkName, 'tools/build.py');
  assert.equal(finished.steps[0].status, finished.status);
  assert.equal(store.evidence(workspace.id, job.id).baselineCommit, commit);
  assert.equal(store.evidence(workspace.id, job.id).completeAcceptanceEvidence, false);
  assert.equal(finished.stale, false);
  store.apply({ workspaceId: workspace.id, actor: 'test', operationId: 'edit', expectedRevision: 1, commands: [{ type: 'class.describe', name: 'Record', definition: 'Updated record.' }] });
  assert.equal(store.job(workspace.id, job.id).stale, true);
  store.undo({ workspaceId: workspace.id, actor: 'test', operationId: 'undo-edit', expectedRevision: 2, targetRevision: 2 });
  assert.equal(store.get(workspace.id).sourceDigest, workspace.sourceDigest);
  assert.equal(store.job(workspace.id, job.id).stale, true);
  assert.throws(() => store.createJob(workspace.id, 1, workspace.sourceDigest, 'test', 'job-two'), /Stale/);
  const altered = sourceManifest.map(entry => entry.path === 'tools/build.py' ? { ...entry, sha256: '0'.repeat(64) } : entry);
  const mismatched = store.create({ title: 'Mismatched manifest', baselineCommit: commit, schema, sourceManifest: altered });
  const mismatchJob = store.createJob(mismatched.id, 0, mismatched.sourceDigest, 'test', 'verify').job;
  await runGenerator(store, mismatched, mismatchJob, repository, process.env.CHARGEWEAVE_TEST_PYTHON || process.execPath);
  assert.equal(store.job(mismatched.id, mismatchJob.id).status, 'failed');
  assert.match(store.job(mismatched.id, mismatchJob.id).output, /manifest does not match/);
  store.close();
});

test('validation retry survives restart without starting another job', () => {
  const directory = mkdtempSync(join(tmpdir(), 'chargeweave-jobs-'));
  try {
    const path = join(directory, 'store.sqlite');
    let store = new WorkspaceStore(path);
    const workspace = store.create({ title: 'Jobs', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
    const first = store.createJob(workspace.id, 0, workspace.sourceDigest, 'test', 'retry');
    assert.throws(() => store.evidence(workspace.id, first.job.id), /not complete/);
    store.updateJob(first.job.id, 'running');
    store.startJobStep(first.job.id, 0, 'tools/build.py');
    store.close();
    store = new WorkspaceStore(path);
    const retry = store.createJob(workspace.id, 0, workspace.sourceDigest, 'test', 'retry');
    assert.equal(retry.created, false);
    assert.equal(retry.job.id, first.job.id);
    assert.equal(retry.job.status, 'interrupted');
    assert.equal(retry.job.steps[0].status, 'interrupted');
    store.close();
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('a cancelled generator never reports passing evidence', async () => {
  const repository = fileURLToPath(new URL('../..', import.meta.url));
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim();
  const schema = readFileSync(new URL('../../model/domain.schema', import.meta.url), 'utf8');
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Cancel', baselineCommit: commit, schema });
  const { job } = store.createJob(workspace.id, 0, workspace.sourceDigest, 'test', 'start');
  const controller = new AbortController(); controller.abort();
  await runGenerator(store, workspace, job, repository, process.execPath, controller.signal);
  assert.equal(store.job(workspace.id, job.id).status, 'cancelled');
  store.close();
});

test('generator changes to another tracked source fail validation', { skip: !process.env.CHARGEWEAVE_TEST_PYTHON }, async () => {
  const repository = mkdtempSync(join(tmpdir(), 'chargeweave-drift-'));
  try {
    mkdirSync(join(repository, 'model')); mkdirSync(join(repository, 'tools'));
    const schema = 'MODULE|foundation\nRecord|root|A record.|\n';
    writeFileSync(join(repository, 'model', 'domain.schema'), schema);
    writeFileSync(join(repository, 'model', 'audit-rules.json'), '{}\n');
    writeFileSync(join(repository, 'tools', 'build.py'), "from pathlib import Path\nPath('model/audit-rules.json').write_text('{\"rewritten\":true}')\n");
    writeFileSync(join(repository, 'tools', 'verify_all.py'), "raise RuntimeError('must not run an incompatible verifier')\n");
    const git = args => execFileSync('git', args, { cwd: repository, stdio: 'ignore' });
    git(['init']); git(['add', '.']); git(['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-m', 'fixture']);
    const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim();
    const store = new WorkspaceStore(':memory:');
    const workspace = store.create({ title: 'Drift', baselineCommit: commit, schema });
    const { job } = store.createJob(workspace.id, 0, workspace.sourceDigest, 'test', 'drift');
    await runGenerator(store, workspace, job, repository, process.env.CHARGEWEAVE_TEST_PYTHON);
    const result = store.job(workspace.id, job.id);
    assert.equal(result.status, 'failed');
    assert.equal(result.steps[0].status, 'failed');
    assert.match(result.output, /Generator rewrote source model\/audit-rules.json/);
    const incompatible = store.createJob(workspace.id, 0, workspace.sourceDigest, 'test', 'acceptance', 'acceptance').job;
    await runGenerator(store, workspace, incompatible, repository, process.env.CHARGEWEAVE_TEST_PYTHON);
    assert.equal(store.job(workspace.id, incompatible.id).status, 'failed');
    assert.match(store.job(workspace.id, incompatible.id).output, /does not expose a compatible release-gate catalogue/);
    store.close();
  } finally { rmSync(repository, { recursive: true, force: true }); }
});

test('reference profile runs generated model and fixture checks', { skip: !process.env.CHARGEWEAVE_TEST_REFERENCE, timeout: 600000 }, async () => {
  const repository = fileURLToPath(new URL('../..', import.meta.url));
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim();
  const schema = execFileSync('git', ['show', `${commit}:model/domain.schema`], { cwd: repository, encoding: 'utf8' });
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Reference', baselineCommit: commit, schema, sourceManifest: importSourceManifest(repository, commit) });
  const { job } = store.createJob(workspace.id, 0, workspace.sourceDigest, 'test', 'reference', 'reference');
  await runGenerator(store, workspace, job, repository, process.env.CHARGEWEAVE_TEST_PYTHON);
  const result = store.job(workspace.id, job.id);
  assert.equal(result.status, 'passed', result.output);
  assert.match(result.output, /tools\/test_boundaries.py/);
  store.close();
});
