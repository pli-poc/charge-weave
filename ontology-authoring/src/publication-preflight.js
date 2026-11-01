import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import { mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const exec = promisify(execFile);
const canonicalRemote = 'https://github.com/pli-poc/charge-weave.git';
const canonicalAliases = new Set([canonicalRemote, 'https://github.com/pli-poc/charge-weave', 'git@github.com:pli-poc/charge-weave.git', 'git@github.com:pli-poc/charge-weave']);

// Compare a pinned remote head in a disposable repository. File-level disjointness
// is useful to a reviewer but is not proof of semantic compatibility or a rebase.
async function compareRemoteBase(repository, target, branch, baseline, head, sourceFiles, fixture) {
  let directory;
  try {
    directory = await mkdtemp(join(tmpdir(), 'chargeweave-compare-'));
    const options = { cwd: directory, timeout: 60000, maxBuffer: 4 * 1024 * 1024, env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: process.platform === 'win32' ? 'NUL' : '/dev/null', GIT_ALLOW_PROTOCOL: fixture ? 'file' : 'file:https' } };
    await exec('git', ['init', '--quiet', '--bare', '--template=', directory], options);
    await exec('git', ['-c', 'protocol.file.allow=always', 'fetch', '--quiet', '--no-tags', '--', resolve(repository), baseline], options);
    await exec('git', ['fetch', '--quiet', '--no-tags', '--', target, `refs/heads/${branch}`], options);
    const fetched = (await exec('git', ['rev-parse', 'FETCH_HEAD'], options)).stdout.trim();
    if (fetched !== head) return { status: 'remote-moved', overlap: [], changedFiles: [] };
    try { await exec('git', ['merge-base', '--is-ancestor', baseline, head], options); }
    catch (error) { if (error.code === 1) return { status: 'diverged', overlap: [], changedFiles: [] }; throw error; }
    const listing = (await exec('git', ['diff', '--no-renames', '--name-only', '-z', baseline, head, '--'], options)).stdout;
    const changedFiles = listing.split('\0').filter(Boolean).sort();
    if (changedFiles.length > 10000) throw new Error('Comparison is too large');
    const overlap = sourceFiles.filter(path => changedFiles.includes(path));
    return { status: overlap.length ? 'overlap' : 'disjoint-paths', overlap, changedFiles, note: 'Path comparison only; combined changes require semantic review and fresh validation.' };
  } catch {
    return { status: 'unavailable', overlap: [], changedFiles: [] };
  } finally { if (directory) await rm(directory, { recursive: true, force: true }); }
}

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
  const preliminaryDiff = store.diff(workspaceId);
  const preliminarySourceFiles = [...(preliminaryDiff.source.before !== preliminaryDiff.source.after ? [preliminaryDiff.source.path] : []), ...preliminaryDiff.additionalSources.map(item => item.path)];
  const comparison = remote.status === 'changed' ? await compareRemoteBase(repository, target, branch, workspace.baselineCommit, remote.head, preliminarySourceFiles, fixture) : null;
  const current = store.get(workspaceId);
  const stale = current.revision !== workspace.revision || current.sourceDigest !== workspace.sourceDigest;
  if (stale) return { workspaceId, baselineCommit: workspace.baselineCommit, revision: workspace.revision, sourceDigest: workspace.sourceDigest, stale: true,
    target: { repository: fixture ? 'local-test-remote' : 'pli-poc/charge-weave', branch, ...remote }, sourceFiles: [], generatedEvidence: null, readiness: null, canPublish: false,
    limitations: ['The draft changed during preflight; run it again.', 'Pull-request creation is not implemented.'] };
  const diff = store.diff(workspaceId), readiness = store.reviewReadiness(workspaceId);
  const checked = readiness.evidence.find(item => item.profile === 'acceptance' && item.job?.status === 'passed') ?? readiness.evidence.find(item => item.profile === 'reference' && item.job?.status === 'passed');
  const artifacts = checked ? store.job(workspaceId, checked.job.id).artifactSummary : null;
  const sourceFiles = [...(diff.source.before !== diff.source.after ? [diff.source.path] : []), ...diff.additionalSources.map(item => item.path)];
  return { workspaceId, baselineCommit: workspace.baselineCommit, revision: workspace.revision, sourceDigest: workspace.sourceDigest, stale,
    target: { repository: fixture ? 'local-test-remote' : 'pli-poc/charge-weave', branch, ...remote }, comparison, sourceFiles,
    generatedEvidence: artifacts ? { jobId: checked.job.id, profile: checked.profile, summary: artifacts } : null,
    readiness, canPublish: false,
    limitations: ['Pull-request creation is not implemented.', 'Remote changes require semantic review and revalidation even when paths do not overlap.', 'Generated evidence is a byte comparison, not a staged-file list.', 'Branch protection and exact-commit CI have not been checked.'] };
}
