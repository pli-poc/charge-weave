import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { githubCommitWorkflows } from '../src/github-ci.js';

const sha = 'a'.repeat(40);
const run = (id, status, conclusion, head_sha = sha) => ({ id, name: `workflow ${id}`, status, conclusion, head_sha });
const response = workflow_runs => async url => {
  assert.match(url, new RegExp(`^https://api.github.com/repos/pli-poc/charge-weave/actions/runs\\?head_sha=${sha}&`));
  return { ok: true, json: async () => ({ workflow_runs }) };
};

test('workflow lookup uses the exact SHA and distinguishes completed, pending and missing runs', async () => {
  const success = await githubCommitWorkflows(sha, response([run(10, 'completed', 'success')]));
  assert.equal(success.status, 'passed');
  assert.equal(success.requiredChecksVerified, false);
  assert.equal(success.workflows[0].url, 'https://github.com/pli-poc/charge-weave/actions/runs/10');
  assert.equal((await githubCommitWorkflows(sha, response([run(1, 'in_progress', null)]))).status, 'pending');
  assert.equal((await githubCommitWorkflows(sha, response([run(1, 'completed', 'failure'), run(2, 'queued', null)]))).status, 'failed');
  assert.equal((await githubCommitWorkflows(sha, response([run(1, 'completed', 'skipped')]))).status, 'incomplete');
  assert.equal((await githubCommitWorkflows(sha, response([]))).status, 'not-found');
  assert.equal((await githubCommitWorkflows(sha, response([run(1, 'completed', 'success', 'b'.repeat(40))]))).status, 'unavailable');
  assert.equal((await githubCommitWorkflows(sha, async () => ({ ok: false, status: 403 }))).status, 'unavailable');
  await assert.rejects(() => githubCommitWorkflows('main', response([])), /full lowercase commit SHA/);
});

test('workflow lookup paginates and refuses to call a truncated list complete', async () => {
  let calls = 0;
  const fullPage = Array.from({ length: 100 }, (_, index) => run(index + 1, 'completed', 'success'));
  const result = await githubCommitWorkflows(sha, async () => ({ ok: true, json: async () => ({ workflow_runs: ++calls === 1 ? fullPage : [run(101, 'completed', 'failure')] }) }));
  assert.equal(calls, 2);
  assert.equal(result.status, 'failed');
  assert.equal(result.workflows.length, 101);
  const truncated = await githubCommitWorkflows(sha, response(fullPage));
  assert.equal(truncated.status, 'incomplete');
  assert.equal(truncated.workflows.length, 500);
});
