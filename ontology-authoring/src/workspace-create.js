import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { editableSourcePaths, importSourceManifest, sha256 } from './source-manifest.js';

const aliases = new Set(['https://github.com/pli-poc/charge-weave', 'https://github.com/pli-poc/charge-weave.git', 'git@github.com:pli-poc/charge-weave', 'git@github.com:pli-poc/charge-weave.git']);

// The caller supplies a commit identity, never a repository path or executable.
export function createWorkspaceFromRepository(store, repository, { title, baselineCommit, operationId, actor }) {
  if (typeof title !== 'string' || !title.trim() || title.length > 120 || !/^[a-f0-9]{40}$/.test(baselineCommit ?? '')) throw new Error('Invalid workspace creation request');
  const git = args => execFileSync('git', args, { cwd: repository, encoding: 'utf8', timeout: 30000, maxBuffer: 4 * 1024 * 1024, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } });
  if (!aliases.has(git(['remote', 'get-url', 'origin']).trim())) throw new Error('Repository remote is not allowlisted');
  if (git(['rev-parse', '--verify', `${baselineCommit}^{commit}`]).trim() !== baselineCommit) throw new Error('Baseline commit is unavailable');
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
