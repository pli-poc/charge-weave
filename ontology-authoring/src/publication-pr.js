const api = 'https://api.github.com/repos/pli-poc/charge-weave';
const repo = 'pli-poc/charge-weave';

// Fixed repository and server-provisioned credential only. Fetch is injectable
// by the host for isolated tests, never supplied by an MCP client.
export async function openPublicationPullRequest(store, workspaceId, publicationId, token, fetcher = fetch) {
  let record = store.publication(workspaceId, publicationId);
  if (!/^chargeweave\/studio-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(record.branch ?? '')) throw new Error('Invalid publication branch');
  if (record.state === 'pr_created' && record.prNumber) return { publication: record, url: `https://github.com/${repo}/pull/${record.prNumber}`, note: 'Pull request was already recorded.' };
  if (!['pushed', 'pr_unknown'].includes(record.state) || !/^[a-f0-9]{40}$/.test(record.commitSha ?? '')) throw new Error('A confirmed pushed branch is required');
  if (typeof token !== 'string' || token.length < 20 || /[\r\n\0]/.test(token)) throw new Error('A configured GitHub publisher token is required');
  const headers = { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'User-Agent': 'ChargeWeave-ontology-studio', 'X-GitHub-Api-Version': '2022-11-28' };
  const request = async (url, options = {}) => {
    let response;
    try { response = await fetcher(url, { ...options, headers: { ...headers, ...(options.body ? { 'Content-Type': 'application/json' } : {}) }, signal: AbortSignal.timeout(30000), redirect: 'error' }); }
    catch { throw new Error('GitHub request was unavailable'); }
    if (!response.ok) throw new Error('GitHub request was not successful');
    const text = await response.text();
    if (text.length > 2_000_000) throw new Error('GitHub response exceeded the limit');
    try { return JSON.parse(text); } catch { throw new Error('GitHub response was invalid'); }
  };
  const marker = `<!-- chargeweave-publication:${record.id} -->`;
  const validate = pull => {
    if (!pull || !Number.isSafeInteger(pull.number) || pull.number < 1 || !['open', 'closed'].includes(pull.state) || pull.head?.ref !== record.branch || pull.head?.sha !== record.commitSha || pull.head?.repo?.full_name !== repo || pull.base?.ref !== 'main' || pull.base?.repo?.full_name !== repo || typeof pull.body !== 'string' || !pull.body.includes(marker)) throw new Error('Pull request does not match the publication');
    return pull;
  };
  const query = new URLSearchParams({ state: 'all', head: `pli-poc:${record.branch}`, base: 'main', per_page: '100' });
  const existing = await request(`${api}/pulls?${query}`);
  if (!Array.isArray(existing) || existing.length > 1) throw new Error('Pull-request reconciliation is ambiguous');
  if (existing.length === 1) {
    const pull = validate(existing[0]);
    if (record.state === 'pushed') record = store.advancePublication(workspaceId, publicationId, 'pushed', 'pr_pending');
    record = store.recordPublicationPullRequest(workspaceId, publicationId, record.state, pull.number, pull.state);
    return { publication: record, url: `https://github.com/${repo}/pull/${pull.number}`, note: 'Existing pull request was confirmed.' };
  }
  const ref = async branch => {
    const encoded = branch.split('/').map(encodeURIComponent).join('/');
    const result = await request(`${api}/git/ref/heads/${encoded}`);
    if (result?.ref !== `refs/heads/${branch}` || !/^[a-f0-9]{40}$/.test(result?.object?.sha ?? '')) throw new Error('GitHub branch response was invalid');
    return result.object.sha;
  };
  const [base, head] = await Promise.all([ref('main'), ref(record.branch)]);
  if (base !== record.baselineCommit) throw new Error('Target branch changed; revalidate before opening a pull request');
  if (head !== record.commitSha) throw new Error('Publication branch no longer matches the reviewed commit');
  if (record.state === 'pr_unknown') record = store.retryPublicationAfterAbsentPullRequest(workspaceId, publicationId);
  record = store.advancePublication(workspaceId, publicationId, 'pushed', 'pr_pending');
  const body = `${record.body}\n\nReviewed baseline: ${record.baselineCommit}\nReviewed source digest: ${record.sourceDigest}\nCommit: ${record.commitSha}\n\n${marker}`;
  try {
    const pull = validate(await request(`${api}/pulls`, { method: 'POST', body: JSON.stringify({ title: record.subject, body, head: record.branch, base: 'main', draft: true }) }));
    record = store.recordPublicationPullRequest(workspaceId, publicationId, 'pr_pending', pull.number, pull.state);
    return { publication: record, url: `https://github.com/${repo}/pull/${pull.number}`, note: 'Draft pull request created; required checks and deployment are separate.' };
  } catch {
    store.advancePublication(workspaceId, publicationId, 'pr_pending', 'pr_unknown');
    throw new Error('Pull-request outcome is unknown; reconcile before retrying');
  }
}

export async function runPublicationPullRequest(store, workspaceId, publicationId, job, token, fetcher) {
  try {
    store.updateJob(job.id, 'running');
    const result = await openPublicationPullRequest(store, workspaceId, publicationId, token, fetcher);
    store.saveJobArtifacts(job.id, result);
    store.updateJob(job.id, 'passed');
  } catch (error) { store.updateJob(job.id, 'failed', error.message); }
}
