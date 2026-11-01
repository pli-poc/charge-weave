import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';

const exec = promisify(execFile);
const canonicalRemote = 'https://github.com/pli-poc/charge-weave.git';
const canonicalAliases = new Set([canonicalRemote, 'https://github.com/pli-poc/charge-weave', 'git@github.com:pli-poc/charge-weave.git', 'git@github.com:pli-poc/charge-weave']);

// The fixture override is supplied by the host, never by an MCP client.
export async function publicationPreflight(store, workspaceId, expectedRevision, repository, fixture = null) {
  const workspace = store.get(workspaceId);
  if (expectedRevision !== undefined && expectedRevision !== workspace.revision) throw new Error('Revision conflict');
  const target = fixture?.remote ?? canonicalRemote, branch = fixture?.branch ?? 'main';
  if (!/^[A-Za-z0-9][A-Za-z0-9._/-]{0,127}$/.test(branch) || branch.includes('..') || branch.endsWith('/') || branch.includes('//')) throw new Error('Invalid configured target branch');
  let remote = { status: 'unavailable', head: null };
  const gitOptions = { cwd: repository, timeout: 20000, maxBuffer: 1024 * 1024, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } };
  try {
    const configured = (await exec('git', ['remote', 'get-url', 'origin'], gitOptions)).stdout.trim();
    if (fixture ? configured !== target : !canonicalAliases.has(configured)) remote = { status: 'repository-not-allowlisted', head: null };
    else {
      const remoteOptions = { ...gitOptions, cwd: tmpdir(), env: { ...gitOptions.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: process.platform === 'win32' ? 'NUL' : '/dev/null', GIT_ALLOW_PROTOCOL: fixture ? 'file' : 'https' } };
      const output = await exec('git', ['ls-remote', '--heads', '--exit-code', '--', target, `refs/heads/${branch}`], remoteOptions);
      const lines = output.stdout.trim().split(/\r?\n/).filter(Boolean);
      const match = lines.length === 1 && /^([a-f0-9]{40})\s+refs\/heads\/(.+)$/.exec(lines[0]);
      if (!match || match[2] !== branch) throw new Error('Unexpected remote result');
      remote = { status: match[1] === workspace.baselineCommit ? 'matches-baseline' : 'changed', head: match[1] };
    }
  } catch { /* Do not expose Git output, URLs or credentials to clients. */ }
  const current = store.get(workspaceId);
  const stale = current.revision !== workspace.revision || current.sourceDigest !== workspace.sourceDigest;
  if (stale) return { workspaceId, baselineCommit: workspace.baselineCommit, revision: workspace.revision, sourceDigest: workspace.sourceDigest, stale: true,
    target: { repository: fixture ? 'local-test-remote' : 'pli-poc/charge-weave', branch, ...remote }, sourceFiles: [], generatedEvidence: null, readiness: null, canPublish: false,
    limitations: ['The draft changed during preflight; run it again.', 'Publication is not implemented.'] };
  const diff = store.diff(workspaceId), readiness = store.reviewReadiness(workspaceId);
  const checked = readiness.evidence.find(item => item.profile === 'acceptance' && item.job?.status === 'passed') ?? readiness.evidence.find(item => item.profile === 'reference' && item.job?.status === 'passed');
  const artifacts = checked ? store.job(workspaceId, checked.job.id).artifactSummary : null;
  const sourceFiles = [...(diff.source.before !== diff.source.after ? [diff.source.path] : []), ...diff.additionalSources.map(item => item.path)];
  return { workspaceId, baselineCommit: workspace.baselineCommit, revision: workspace.revision, sourceDigest: workspace.sourceDigest, stale,
    target: { repository: fixture ? 'local-test-remote' : 'pli-poc/charge-weave', branch, ...remote }, sourceFiles,
    generatedEvidence: artifacts ? { jobId: checked.job.id, profile: checked.profile, summary: artifacts } : null,
    readiness, canPublish: false,
    limitations: ['Publication is not implemented.', 'Remote changes require a three-way comparison and revalidation.', 'Generated evidence is a byte comparison, not a staged-file list.', 'Branch protection and exact-commit CI have not been checked.'] };
}
