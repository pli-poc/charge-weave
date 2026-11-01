const repo = 'pli-poc/charge-weave';

// Public, fixed-repository lookup only. Workflow success is not proof that
// branch-protection-required checks are known or that a deployment occurred.
export async function githubCommitWorkflows(sha, fetcher = fetch) {
  if (!/^[a-f0-9]{40}$/.test(sha ?? '')) throw new Error('A full lowercase commit SHA is required');
  const workflows = [];
  try {
    for (let page = 1; page <= 5; page++) {
      const url = `https://api.github.com/repos/${repo}/actions/runs?head_sha=${sha}&per_page=100&page=${page}`;
      const response = await fetcher(url, { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'ChargeWeave-ontology-studio', 'X-GitHub-Api-Version': '2022-11-28' }, signal: AbortSignal.timeout(15000), redirect: 'error' });
      if (!response.ok) return { sha, status: 'unavailable', workflows: [], reason: response.status === 403 || response.status === 429 ? 'GitHub denied or rate-limited the lookup.' : 'GitHub workflow lookup failed.' };
      const data = await response.json();
      if (!data || !Array.isArray(data.workflow_runs) || data.workflow_runs.length > 100) throw new Error('Invalid GitHub response');
      for (const run of data.workflow_runs) {
        if (run.head_sha !== sha || !Number.isSafeInteger(run.id) || run.id < 1 || typeof run.name !== 'string' || typeof run.status !== 'string' || !(run.conclusion === null || typeof run.conclusion === 'string')) throw new Error('Invalid workflow run');
        workflows.push({ id: run.id, name: run.name.slice(0, 200), status: run.status, conclusion: run.conclusion, url: `https://github.com/${repo}/actions/runs/${run.id}` });
      }
      if (data.workflow_runs.length < 100) break;
      if (page === 5) return { sha, status: 'incomplete', workflows, reason: 'More workflow runs exist than the bounded lookup can retrieve.' };
    }
    const status = !workflows.length ? 'not-found' : workflows.some(run => run.conclusion === 'failure' || run.conclusion === 'timed_out' || run.conclusion === 'action_required' || run.conclusion === 'startup_failure') ? 'failed' : workflows.some(run => run.status !== 'completed') ? 'pending' : workflows.every(run => run.conclusion === 'success') ? 'passed' : 'incomplete';
    return { sha, status, workflows, requiredChecksVerified: false, note: 'This lists workflow runs for the exact commit; branch-protection requirements and deployment are not checked.' };
  } catch {
    return { sha, status: 'unavailable', workflows: [], reason: 'GitHub workflow lookup was unavailable or returned invalid data.' };
  }
}
