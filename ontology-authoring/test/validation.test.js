import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../src/workspace.js';
import { runGenerator } from '../src/validation.js';

test('generator evidence is bound to its input and becomes stale after edits', async () => {
  const repository = fileURLToPath(new URL('../..', import.meta.url));
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim();
  const schema = readFileSync(new URL('../../model/domain.schema', import.meta.url), 'utf8');
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Validation', baselineCommit: commit, schema });
  const { job } = store.createJob(workspace.id, workspace.revision, workspace.sourceDigest, 'test', 'job-one');
  assert.equal(store.createJob(workspace.id, workspace.revision, workspace.sourceDigest, 'test', 'job-one').created, false);
  assert.throws(() => store.createJob(workspace.id, 1, workspace.sourceDigest, 'test', 'job-one'), /reused/);
  await runGenerator(store, workspace, job, repository, process.env.CHARGEWEAVE_TEST_PYTHON || process.execPath);
  const finished = store.job(workspace.id, job.id);
  assert.equal(finished.status, process.env.CHARGEWEAVE_TEST_PYTHON ? 'passed' : 'failed', finished.output);
  assert.equal(finished.stale, false);
  store.apply({ workspaceId: workspace.id, actor: 'test', operationId: 'edit', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Record', definition: 'Updated record.' }] });
  assert.equal(store.job(workspace.id, job.id).stale, true);
  assert.throws(() => store.createJob(workspace.id, 0, workspace.sourceDigest, 'test', 'job-two'), /Stale/);
  store.close();
});

test('validation retry survives restart without starting another job', () => {
  const directory = mkdtempSync(join(tmpdir(), 'chargeweave-jobs-'));
  try {
    const path = join(directory, 'store.sqlite');
    let store = new WorkspaceStore(path);
    const workspace = store.create({ title: 'Jobs', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
    const first = store.createJob(workspace.id, 0, workspace.sourceDigest, 'test', 'retry');
    store.updateJob(first.job.id, 'running');
    store.close();
    store = new WorkspaceStore(path);
    const retry = store.createJob(workspace.id, 0, workspace.sourceDigest, 'test', 'retry');
    assert.equal(retry.created, false);
    assert.equal(retry.job.id, first.job.id);
    assert.equal(retry.job.status, 'interrupted');
    store.close();
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('reference profile runs generated model and fixture checks', { skip: !process.env.CHARGEWEAVE_TEST_REFERENCE, timeout: 600000 }, async () => {
  const repository = fileURLToPath(new URL('../..', import.meta.url));
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim();
  const schema = readFileSync(new URL('../../model/domain.schema', import.meta.url), 'utf8');
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Reference', baselineCommit: commit, schema });
  const { job } = store.createJob(workspace.id, 0, workspace.sourceDigest, 'test', 'reference', 'reference');
  await runGenerator(store, workspace, job, repository, process.env.CHARGEWEAVE_TEST_PYTHON);
  const result = store.job(workspace.id, job.id);
  assert.equal(result.status, 'passed', result.output);
  assert.match(result.output, /tools\/test_boundaries.py/);
  store.close();
});
