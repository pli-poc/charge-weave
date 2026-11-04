const repo = 'pli-poc/charge-weave';

// Fixed-repository lookup only. Workflow success is not proof that
// branch-protection-required checks are known or that a deployment occurred.
export async function githubCommitWorkflows(sha, fetcher = fetch, token = null) {
  if (!/^[a-f0-9]{40}$/.test(sha ?? '')) throw new Error('A full lowercase commit SHA is required');
  const workflows = [];
  try {
    for (let page = 1; page <= 5; page++) {
      const url = `https://api.github.com/repos/${repo}/actions/runs?head_sha=${sha}&per_page=100&page=${page}`;
      const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'ChargeWeave-ontology-studio', 'X-GitHub-Api-Version': '2022-11-28' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await fetcher(url, { headers, signal: AbortSignal.timeout(15000), redirect: 'error' });
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

// Conservative exact-SHA assessment: a missing policy, incomplete response,
// ambiguous context or skipped result is never reported as a verified pass.
export async function githubRequiredChecks(sha, token, fetcher = fetch) {
  if (!/^[a-f0-9]{40}$/.test(sha ?? '')) throw new Error('A full lowercase commit SHA is required');
  const root = `https://api.github.com/repos/${repo}`;
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'ChargeWeave-ontology-studio', 'X-GitHub-Api-Version': '2022-11-28' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const get = async path => {
    const response = await fetcher(`${root}${path}`, { headers, signal: AbortSignal.timeout(15000), redirect: 'error' });
    if (!response.ok) throw new Error('GitHub policy or checks unavailable');
    return response.json();
  };
  try {
    const [classic, rules, runs, statuses] = await Promise.all([
      get('/branches/main/protection/required_status_checks'), get('/rules/branches/main?per_page=100'),
      get(`/commits/${sha}/check-runs?filter=latest&per_page=100`), get(`/commits/${sha}/status?per_page=100`),
    ]);
    if (!classic || !Array.isArray(classic.contexts) || !Array.isArray(rules) || rules.length >= 100 || !Array.isArray(runs?.check_runs) || runs.check_runs.length > 100 || !Number.isSafeInteger(runs.total_count) || runs.total_count < 0 || runs.total_count > runs.check_runs.length || !Array.isArray(statuses?.statuses) || statuses.statuses.length > 100 || statuses.sha !== sha || !Number.isSafeInteger(statuses.total_count) || statuses.total_count < 0 || statuses.total_count > statuses.statuses.length) throw new Error('Incomplete GitHub response');
    const required = new Map();
    const add = (context, appId = null) => {
      if (typeof context !== 'string' || !context || context.length > 200 || !(appId === null || Number.isSafeInteger(appId))) throw new Error('Invalid required context');
      const prior = required.get(context);
      if (prior !== undefined && prior !== null && appId !== null && prior !== appId) throw new Error('Ambiguous app requirements');
      required.set(context, prior == null ? appId : prior);
    };
    for (const context of classic.contexts) add(context);
    if (classic.checks !== undefined) {
      if (!Array.isArray(classic.checks)) throw new Error('Invalid required checks');
      for (const check of classic.checks) add(check.context, check.app_id === -1 ? null : check.app_id ?? null);
    }
    let unsupported = false;
    for (const rule of rules) {
      if (['required_workflows', 'workflows'].includes(rule?.type)) unsupported = true;
      if (rule?.type !== 'required_status_checks') continue;
      if (!Array.isArray(rule.parameters?.required_status_checks)) throw new Error('Invalid ruleset checks');
      for (const check of rule.parameters.required_status_checks) add(check.context, check.integration_id ?? null);
    }
    const checks = [...required].map(([context, appId]) => {
      const matchingRuns = runs.check_runs.filter(run => run.name === context && run.head_sha === sha && (appId === null || run.app?.id === appId));
      const matchingStatuses = appId === null ? statuses.statuses.filter(status => status.context === context) : [];
      if (matchingRuns.length + matchingStatuses.length > 1) return { context, appId, status: 'ambiguous' };
      if (matchingRuns.length) {
        const run = matchingRuns[0];
        const status = run.status !== 'completed' ? 'pending' : run.conclusion === 'success' ? 'passed' : ['skipped', 'neutral'].includes(run.conclusion) ? 'skipped' : run.conclusion ? 'failed' : 'unknown';
        return { context, appId, status };
      }
      if (matchingStatuses.length) {
        const state = matchingStatuses[0].state;
        return { context, appId, status: state === 'success' ? 'passed' : state === 'pending' ? 'pending' : ['failure', 'error'].includes(state) ? 'failed' : 'unknown' };
      }
      return { context, appId, status: 'pending' };
    });
    const status = unsupported ? 'unknown' : !checks.length ? 'not-configured' : checks.some(item => item.status === 'failed') ? 'failed' : checks.some(item => ['ambiguous', 'unknown'].includes(item.status)) ? 'unknown' : checks.some(item => item.status === 'pending') ? 'pending' : checks.some(item => item.status === 'skipped') ? 'incomplete' : 'passed';
    return { sha, status, checks, requiredChecksVerified: status === 'passed', note: 'Exact-commit status checks only; merge eligibility, deployment and other branch rules are separate.' };
  } catch {
    return { sha, status: 'unknown', checks: [], requiredChecksVerified: false, note: 'Required policy or exact-commit checks were unavailable, ambiguous or incomplete.' };
  }
}
