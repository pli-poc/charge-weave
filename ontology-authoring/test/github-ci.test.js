import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { githubCommitWorkflows, githubRequiredChecks } from '../src/github-ci.js';

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

test('required checks bind policy, app and exact SHA without treating unavailable or skipped as passing', async () => {
  const data = {
    classic: { contexts: ['build'], checks: [{ context: 'build', app_id: 12 }] },
    rules: [{ type: 'required_status_checks', parameters: { required_status_checks: [{ context: 'lint' }] } }],
    runs: { total_count: 1, check_runs: [{ name: 'build', head_sha: sha, app: { id: 12 }, status: 'completed', conclusion: 'success' }] },
    statuses: { sha, total_count: 1, statuses: [{ context: 'lint', state: 'success' }] },
  };
  const fetcher = async url => ({ ok: true, json: async () => url.includes('/protection/') ? data.classic : url.includes('/rules/') ? data.rules : url.includes('/check-runs?') ? data.runs : data.statuses });
  assert.equal((await githubRequiredChecks(sha, null, fetcher)).status, 'passed');
  data.runs.check_runs[0].conclusion = 'skipped';
  assert.equal((await githubRequiredChecks(sha, null, fetcher)).status, 'incomplete');
  data.runs.check_runs[0].conclusion = 'failure';
  assert.equal((await githubRequiredChecks(sha, null, fetcher)).status, 'failed');
  data.runs.check_runs[0].conclusion = 'success'; data.runs.check_runs[0].app.id = 99;
  assert.equal((await githubRequiredChecks(sha, null, fetcher)).status, 'pending');
  data.runs.check_runs[0].app.id = 12; data.rules.push({ type: 'workflows' });
  assert.equal((await githubRequiredChecks(sha, null, fetcher)).status, 'unknown');
  data.rules.pop(); data.runs.total_count = 2;
  assert.equal((await githubRequiredChecks(sha, null, fetcher)).status, 'unknown');
  assert.equal((await githubRequiredChecks(sha, null, async () => ({ ok: false, status: 403 }))).status, 'unknown');
  await assert.rejects(() => githubRequiredChecks('main', null, fetcher), /full lowercase commit SHA/);
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
