import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../src/workspace.js';
import { runGenerator } from '../src/validation.js';

test('generator evidence is bound to its input and becomes stale after edits', async () => {
  const repository = fileURLToPath(new URL('../..', import.meta.url));
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim();
  const schema = readFileSync(new URL('../../model/domain.schema', import.meta.url), 'utf8');
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Validation', baselineCommit: commit, schema });
  const job = store.createJob(workspace.id, workspace.revision, workspace.sourceDigest);
  await runGenerator(store, workspace, job, repository, process.env.CHARGEWEAVE_TEST_PYTHON || process.execPath);
  const finished = store.job(workspace.id, job.id);
  assert.equal(finished.status, process.env.CHARGEWEAVE_TEST_PYTHON ? 'passed' : 'failed', finished.output);
  assert.equal(finished.stale, false);
  store.apply({ workspaceId: workspace.id, actor: 'test', operationId: 'edit', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Record', definition: 'Updated record.' }] });
  assert.equal(store.job(workspace.id, job.id).stale, true);
  assert.throws(() => store.createJob(workspace.id, 0, workspace.sourceDigest), /Stale/);
  store.close();
});
