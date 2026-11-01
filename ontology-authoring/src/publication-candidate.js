import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { captureGeneratedArtifacts, summarizeGeneratedArtifacts } from './artifact-summary.js';
import { editableSourcePaths, sha256 } from './source-manifest.js';

const exec = promisify(execFile);

// Build and stage in a disposable checkout. This is a preview, not a commit or
// push; callers must independently check the remote before actual publication.
export async function preparePublicationCandidate(store, workspaceId, reviewId, repository, python = 'python', dependencies = {}) {
  const workspace = store.get(workspaceId), review = store.reviewDecision(workspaceId, reviewId);
  const readiness = store.reviewReadiness(workspaceId);
  if (review.decision !== 'accept' || review.stale || !readiness.canAccept) throw new Error('Current accepted review and passing checks are required');
  const latestDecision = store.reviewDecisions(workspaceId)[0];
  if (latestDecision?.id !== reviewId) throw new Error('A later reviewer decision supersedes this acceptance');
  const acceptance = review.evidence.find(item => item.profile === 'acceptance');
  const original = acceptance ? store.job(workspaceId, acceptance.jobId).artifactSummary : null;
  if (!original || original.omitted !== 0) throw new Error('Complete generated artifact evidence is required');
  let directory;
  try {
    directory = await mkdtemp(join(tmpdir(), 'chargeweave-publish-candidate-'));
    const archive = join(directory, 'baseline.tar');
    await exec('git', ['-c', 'core.autocrlf=false', 'archive', '--format=tar', `--output=${archive}`, workspace.baselineCommit], { cwd: repository, timeout: 30000 });
    await exec('tar', ['-xf', archive, '-C', directory], { timeout: 30000 });
    await rm(archive);
    const git = { cwd: directory, timeout: 60000, maxBuffer: 8 * 1024 * 1024, env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_ALLOW_PROTOCOL: 'file', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: process.platform === 'win32' ? 'NUL' : '/dev/null' } };
    await exec('git', ['init', '--quiet', '--template=', directory], git);
    await exec('git', ['-c', 'protocol.file.allow=always', 'fetch', '--quiet', '--no-tags', '--depth=1', '--no-write-fetch-head', '--', resolve(repository), workspace.baselineCommit], git);
    await exec('git', ['update-ref', 'HEAD', workspace.baselineCommit], git);
    await exec('git', ['reset', '--quiet', '--mixed', workspace.baselineCommit], git);
    await writeFile(join(directory, 'model', 'domain.schema'), workspace.schema, 'utf8');
    for (const [path, content] of Object.entries(workspace.sourceOverlays)) {
      if (!editableSourcePaths.has(path) || typeof content !== 'string' || Buffer.byteLength(content) > 2_000_000) throw new Error('Invalid source overlay');
      await writeFile(join(directory, ...path.split('/')), content, 'utf8');
    }
    const verifySources = async () => {
      for (const source of workspace.sourceManifest) {
        if (sha256(await readFile(join(directory, ...source.path.split('/')))) !== source.sha256) throw new Error(`Source differs from accepted manifest: ${source.path}`);
      }
    };
    await verifySources();
    const capture = dependencies.capture ?? captureGeneratedArtifacts;
    const before = await capture(directory, python);
    if (dependencies.build) await dependencies.build(directory, python);
    else await exec(python, ['tools/build_all.py'], { cwd: directory, timeout: 600000, maxBuffer: 4 * 1024 * 1024, env: { ...process.env, PYTHONUTF8: '1' } });
    await verifySources();
    const after = await capture(directory, python), summary = summarizeGeneratedArtifacts(before, after);
    if (summary.candidateManifestSha256 !== original.candidateManifestSha256 || summary.baselineManifestSha256 !== original.baselineManifestSha256 || summary.omitted || summary.changedCount !== original.changedCount) throw new Error('Generated output differs from accepted evidence');
    const diff = store.diff(workspaceId);
    const sourceFiles = [...(diff.source.before !== diff.source.after ? [diff.source.path] : []), ...diff.additionalSources.map(item => item.path)];
    const paths = [...new Set([...sourceFiles, ...summary.changes.map(item => item.path)])].sort();
    if (!paths.length || paths.length > 1000) throw new Error('Invalid staged file set');
    await exec('git', ['add', '-A', '--', ...paths], git);
    const stagedOutput = (await exec('git', ['diff', '--cached', '--name-only', '-z', '--no-renames'], git)).stdout;
    const staged = stagedOutput.split('\0').filter(Boolean).sort();
    if (JSON.stringify(staged) !== JSON.stringify(paths)) throw new Error('Staged files differ from the reviewed candidate');
    const files = [];
    for (const path of staged) {
      const generated = summary.changes.find(item => item.path === path);
      const expected = workspace.sourceManifest.find(item => item.path === path)?.sha256 ?? generated?.afterSha256;
      if (generated?.kind === 'removed') { files.push({ path, kind: 'removed', sha256: null, bytes: 0 }); continue; }
      const entry = (await exec('git', ['show', `:${path}`], { ...git, encoding: 'buffer', maxBuffer: 32 * 1024 * 1024 })).stdout;
      if (!expected || sha256(entry) !== expected) throw new Error(`Staged bytes differ from accepted content: ${path}`);
      files.push({ path, kind: generated?.kind ?? 'changed', sha256: expected, bytes: entry.length });
    }
    const current = store.get(workspaceId);
    const currentReview = store.reviewDecision(workspaceId, reviewId);
    if (current.revision !== workspace.revision || current.sourceDigest !== workspace.sourceDigest || currentReview.stale || store.reviewDecisions(workspaceId)[0]?.id !== reviewId || !store.reviewReadiness(workspaceId).canAccept) throw new Error('Draft or review changed while preparing candidate');
    return { workspaceId, reviewId, baselineCommit: workspace.baselineCommit, revision: workspace.revision, sourceDigest: workspace.sourceDigest, generatedManifestSha256: summary.candidateManifestSha256, files, note: 'Isolated staged preview only; no commit, push, remote recheck or branch-protection verification was performed.' };
  } finally { if (directory) await rm(directory, { recursive: true, force: true }); }
}

export async function runPublicationPreview(store, workspaceId, reviewId, job, repository, python, signal) {
  try {
    store.updateJob(job.id, 'running');
    const preview = await preparePublicationCandidate(store, workspaceId, reviewId, repository, python);
    if (signal?.aborted) { store.updateJob(job.id, 'cancelled'); return; }
    store.saveJobArtifacts(job.id, preview);
    store.updateJob(job.id, 'passed');
  } catch (error) { store.updateJob(job.id, signal?.aborted ? 'cancelled' : 'failed', error.message); }
}
