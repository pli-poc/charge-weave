import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { editableSourcePaths, importSourceManifest, sha256 } from './source-manifest.js';
import { publicationPreflight } from './publication-preflight.js';

const aliases = new Set(['https://github.com/pli-poc/charge-weave', 'https://github.com/pli-poc/charge-weave.git', 'git@github.com:pli-poc/charge-weave', 'git@github.com:pli-poc/charge-weave.git']);

// The caller supplies a commit identity, never a repository path or executable.
export function createWorkspaceFromRepository(store, repository, { title, baselineCommit, operationId, actor }) {
  if (typeof title !== 'string' || !title.trim() || title.length > 120 || !/^[a-f0-9]{40}$/.test(baselineCommit ?? '')) throw new Error('Invalid workspace creation request');
  const git = args => execFileSync('git', args, { cwd: repository, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 30000, maxBuffer: 4 * 1024 * 1024, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } });
  if (!aliases.has(git(['remote', 'get-url', 'origin']).trim())) throw new Error('Repository remote is not allowlisted');
  let resolved;
  try { resolved = git(['rev-parse', '--verify', `${baselineCommit}^{commit}`]).trim(); }
  catch { throw new Error('Baseline commit is unavailable'); }
  if (resolved !== baselineCommit) throw new Error('Baseline commit is unavailable');
  const show = path => git(['show', `${baselineCommit}:${path}`]);
  const schema = show('model/domain.schema');
  const sourceManifest = importSourceManifest(repository, baselineCommit);
  for (const path of ['tools/authoring_adapter.py', 'tools/domain_schema.py']) {
    const expected = sourceManifest.find(entry => entry.path === path)?.sha256;
    const actual = sha256(readFileSync(new URL(`../../${path}`, import.meta.url)));
    if (!expected || expected !== actual) throw new Error('Baseline adapter differs from this running service');
  }
  const sourceBlobs = Object.fromEntries([...editableSourcePaths].map(path => [path, show(path)]));
  return store.create({ title: title.trim(), baselineCommit, schema, sourceManifest, sourceBlobs }, { actor, operationId });
}

// Create a target-based workspace and carry only files whose pinned baseline
// bytes have not changed at the target. Same-path edits fail closed.
export async function carryForwardWorkspaceFromRepository(store, repository, { sourceWorkspaceId, expectedRevision, expectedSourceDigest, baselineCommit, operationId, actor, publicationFixture = null, preflight = publicationPreflight }) {
  if (typeof sourceWorkspaceId !== 'string' || !Number.isSafeInteger(expectedRevision) || !/^[a-f0-9]{64}$/.test(expectedSourceDigest ?? '') || !/^[a-f0-9]{40}$/.test(baselineCommit ?? '') || typeof operationId !== 'string' || !operationId || operationId.length > 113 || !actor) throw new Error('Invalid carry-forward request');
  const source = store.get(sourceWorkspaceId);
  if (source.revision !== expectedRevision || source.sourceDigest !== expectedSourceDigest) throw new Error('Source draft changed; inspect it and retry carry-forward');
  if (source.digestVersion !== 4 || !source.sourceManifest) throw new Error('Carry-forward requires a version-four source workspace');
  const proof = await preflight(store, sourceWorkspaceId, expectedRevision, repository, publicationFixture);
  if (proof.stale || proof.target?.status !== 'changed' || proof.target.head !== baselineCommit) throw new Error('Baseline commit is not the current configured publication target; run preflight again');
  if (proof.comparison?.status !== 'disjoint-paths') {
    return { status: 'conflict', sourceWorkspaceId, baselineCommit, conflicts: proof.comparison?.overlap?.map(path => ({ path, reason: 'target and draft both changed this source' })) ?? [{ path: null, reason: 'target comparison is unavailable or diverged' }], carriedFiles: [] };
  }
  const confirmedSource = store.get(sourceWorkspaceId);
  if (confirmedSource.revision !== expectedRevision || confirmedSource.sourceDigest !== expectedSourceDigest) throw new Error('Source draft changed during preflight; inspect it and retry carry-forward');
  const git = args => execFileSync('git', args, { cwd: repository, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 30000, maxBuffer: 4 * 1024 * 1024, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } });
  try { git(['rev-parse', '--verify', `${baselineCommit}^{commit}`]); }
  catch {
    const branch = proof.target.branch;
    if (typeof branch !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._/-]{0,127}$/.test(branch) || branch.includes('..') || branch.endsWith('/') || branch.includes('//')) throw new Error('Configured target branch is invalid');
    try { git(['fetch', '--quiet', '--no-tags', '--', 'origin', `refs/heads/${branch}`]); }
    catch { throw new Error('Current target commit is not available in the local repository'); }
    if (git(['rev-parse', 'FETCH_HEAD']).trim() !== baselineCommit) throw new Error('Publication target moved during carry-forward; run preflight again');
  }
  if (!aliases.has(git(['remote', 'get-url', 'origin']).trim())) throw new Error('Repository remote is not allowlisted');
  let resolved;
  try { resolved = git(['rev-parse', '--verify', `${baselineCommit}^{commit}`]).trim(); }
  catch { throw new Error('Target baseline commit is unavailable'); }
  if (resolved !== baselineCommit) throw new Error('Target baseline commit is unavailable');
  try { git(['merge-base', '--is-ancestor', source.baselineCommit, baselineCommit]); }
  catch { throw new Error('Target baseline must descend from the draft baseline'); }
  const sourceChanges = store.diff(sourceWorkspaceId);
  const changedPaths = [...(sourceChanges.source.before !== sourceChanges.source.after ? ['model/domain.schema'] : []), ...sourceChanges.additionalSources.map(item => item.path)];
  if (!changedPaths.length) throw new Error('Source workspace has no draft changes to carry forward');
  const baseline = path => {
    if (path === 'model/domain.schema') return sourceChanges.source.before;
    try { return git(['show', `${source.baselineCommit}:${path}`]); }
    catch { throw new Error(`Pinned source file is unavailable: ${path}`); }
  };
  const target = path => {
    try { return git(['show', `${baselineCommit}:${path}`]); }
    catch { return null; }
  };
  const sourceFiles = { 'model/domain.schema': sourceChanges.source.after, ...source.sourceOverlays };
  const carry = {};
  const conflicts = [];
  for (const path of changedPaths) {
    if (path !== 'model/domain.schema' && !editableSourcePaths.has(path)) { conflicts.push({ path, reason: 'source is not an editable workspace overlay' }); continue; }
    const before = baseline(path), next = target(path), draft = sourceFiles[path];
    if (typeof next !== 'string') { conflicts.push({ path, reason: 'target source was added, removed or is unavailable' }); continue; }
    if (next !== before) { conflicts.push({ path, reason: 'target and draft both changed this source' }); continue; }
    carry[path] = draft;
  }
  if (conflicts.length) return { status: 'conflict', sourceWorkspaceId, baselineCommit, conflicts, carriedFiles: [] };
  const title = `Carry forward: ${source.title}`.slice(0, 120);
  const created = createWorkspaceFromRepository(store, repository, { title, baselineCommit, operationId, actor });
  try {
    store.carryForward({ workspaceId: created.id, actor, operationId: `carry:${operationId}`, sourceWorkspaceId, expectedRevision, expectedSourceDigest, files: carry });
  } catch (error) { throw new Error(`Carry-forward workspace was created but changes were not applied: ${error.message}`); }
  const result = store.get(created.id);
  return { status: 'carried-forward', workspaceId: result.id, title: result.title, baselineCommit, revision: result.revision, sourceDigest: result.sourceDigest, carriedFiles: Object.keys(carry).sort(), validationRequired: true, reviewRequired: true };
}
