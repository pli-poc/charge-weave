import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, writeFile, rm, mkdir, lstat, unlink } from 'node:fs/promises';
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
    await exec('git', ['-c', 'core.autocrlf=false', '-c', 'core.eol=lf', 'archive', '--format=tar', `--output=${archive}`, workspace.baselineCommit], { cwd: repository, timeout: 30000 });
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
    const saved = store.jobGeneratedFiles(workspaceId, acceptance.jobId);
    const savedManifest = saved.map(({ path, sha256: digest, bytes }) => ({ path, sha256: digest, bytes }));
    if (!saved.length || sha256(JSON.stringify(savedManifest)) !== original.candidateManifestSha256) throw new Error('Accepted generated snapshot is unavailable or incomplete; rerun acceptance checks');
    const safePath = async path => {
      if (!/^[A-Za-z0-9._/-]+$/.test(path) || path.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('Unsafe generated snapshot path');
      const parts = path.split('/'); let parent = directory;
      for (const part of parts.slice(0, -1)) {
        parent = join(parent, part);
        let info;
        try { info = await lstat(parent); } catch (error) { if (error.code !== 'ENOENT') throw error; await mkdir(parent); info = await lstat(parent); }
        if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('Generated snapshot directory is unsafe');
      }
      const full = join(parent, parts.at(-1));
      try { const info = await lstat(full); if (!info.isFile() || info.isSymbolicLink()) throw new Error('Generated snapshot target is unsafe'); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
      return full;
    };
    const savedPaths = new Set(saved.map(file => file.path));
    for (const file of before) if (!savedPaths.has(file.path)) await unlink(await safePath(file.path));
    for (const file of saved) {
      if (sha256(file.content) !== file.sha256 || file.content.length !== file.bytes) throw new Error('Accepted generated snapshot is corrupt');
      await writeFile(await safePath(file.path), file.content);
    }
    if (dependencies.build) await dependencies.build(directory, python);
    await verifySources();
    const after = await capture(directory, python), summary = summarizeGeneratedArtifacts(before, after);
    if (summary.candidateManifestSha256 !== original.candidateManifestSha256) throw new Error('Generated output differs from accepted evidence: candidate manifest');
    if (summary.baselineManifestSha256 !== original.baselineManifestSha256) throw new Error('Generated output differs from accepted evidence: baseline manifest');
    if (summary.omitted || summary.changedCount !== original.changedCount) throw new Error('Generated output differs from accepted evidence: changed-file count');
    const diff = store.diff(workspaceId);
    const sourceFiles = [...(diff.source.before !== diff.source.after ? [diff.source.path] : []), ...diff.additionalSources.map(item => item.path)];
    const paths = [...new Set([...sourceFiles, ...summary.changes.map(item => item.path)])].sort();
    if (!paths.length || paths.length > 10000) throw new Error('Invalid staged file set');
    const pathspec = join(directory, 'publication-pathspec');
    await writeFile(pathspec, `${paths.join('\0')}\0`, 'utf8');
    await exec('git', ['add', '-A', `--pathspec-from-file=${pathspec}`, '--pathspec-file-nul'], git);
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
    const preview = { workspaceId, reviewId, baselineCommit: workspace.baselineCommit, revision: workspace.revision, sourceDigest: workspace.sourceDigest, generatedManifestSha256: summary.candidateManifestSha256, files, note: 'Isolated staged preview only; no commit, push, remote recheck or branch-protection verification was performed.' };
    if (dependencies.onPrepared) return await dependencies.onPrepared({ directory, git, preview });
    return preview;
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

// The commit and its prerequisite-based bundle are kept locally in SQLite.
// No remote is contacted and no branch is created by this operation.
export async function createPublicationCommit(store, workspaceId, publicationId, repository, python = 'python', dependencies = {}) {
  const record = store.publication(workspaceId, publicationId);
  if (record.state !== 'prepared' || record.stale) throw new Error('Publication intent is not current and prepared');
  const expected = store.job(workspaceId, record.previewJobId).artifactSummary;
  if (!expected || expected.reviewId !== record.reviewId || expected.sourceDigest !== record.sourceDigest) throw new Error('Staged preview is unavailable');
  let identity = dependencies.identity;
  if (!identity) {
    try {
      identity = {
        name: (await exec('git', ['config', '--get', 'user.name'], { cwd: repository, timeout: 10000 })).stdout.trim(),
        email: (await exec('git', ['config', '--get', 'user.email'], { cwd: repository, timeout: 10000 })).stdout.trim(),
      };
    } catch { throw new Error('Configure Git user.name and user.email before creating a commit'); }
  }
  if (typeof identity.name !== 'string' || !identity.name.trim() || identity.name.length > 200 || /[\x00-\x1f<>]/.test(identity.name) || typeof identity.email !== 'string' || identity.email.length > 254 || !/^[^@\s<>]+@[^@\s<>]+$/.test(identity.email)) throw new Error('Configure a valid Git user.name and user.email before creating a commit');
  return preparePublicationCandidate(store, workspaceId, record.reviewId, repository, python, {
    ...dependencies,
    onPrepared: async ({ directory, git, preview }) => {
      if (preview.sourceDigest !== record.sourceDigest || preview.baselineCommit !== record.baselineCommit || preview.generatedManifestSha256 !== expected.generatedManifestSha256 || JSON.stringify(preview.files) !== JSON.stringify(expected.files)) throw new Error('Rebuilt staged files differ from the saved preview');
      const message = join(directory, 'publication-message.txt'), bundlePath = join(directory, 'publication.bundle');
      await writeFile(message, `${record.subject}\n\n${record.body}\n`, 'utf8');
      await exec('git', ['-c', `user.name=${identity.name}`, '-c', `user.email=${identity.email}`, '-c', 'commit.gpgsign=false', 'commit', '--quiet', '--no-verify', '-F', message], git);
      const commitSha = (await exec('git', ['rev-parse', 'HEAD'], git)).stdout.trim();
      const parent = (await exec('git', ['rev-parse', 'HEAD^'], git)).stdout.trim();
      if (!/^[a-f0-9]{40}$/.test(commitSha) || parent !== record.baselineCommit) throw new Error('Commit does not have the reviewed baseline parent');
      await exec('git', ['bundle', 'create', bundlePath, 'HEAD', `^${record.baselineCommit}`], git);
      const bundle = await readFile(bundlePath);
      return store.savePublicationCommit(workspaceId, publicationId, commitSha, bundle);
    },
  });
}

export async function runPublicationCommit(store, workspaceId, publicationId, job, repository, python) {
  try {
    store.updateJob(job.id, 'running');
    const record = await createPublicationCommit(store, workspaceId, publicationId, repository, python);
    store.saveJobArtifacts(job.id, { publicationId, commitSha: record.commitSha, branch: record.branch, note: 'Commit and recoverable bundle are local; no push has occurred.' });
    store.updateJob(job.id, 'passed');
  } catch (error) { store.updateJob(job.id, 'failed', error.message); }
}
