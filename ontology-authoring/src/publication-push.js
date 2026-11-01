import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const exec = promisify(execFile);
const canonical = 'https://github.com/pli-poc/charge-weave.git';
const aliases = new Set([canonical, 'https://github.com/pli-poc/charge-weave', 'git@github.com:pli-poc/charge-weave.git', 'git@github.com:pli-poc/charge-weave']);

// Only a host-configured local fixture may replace the canonical GitHub target.
// No caller-controlled URL or refspec is accepted.
export async function pushPublication(store, workspaceId, publicationId, repository, token, fixture = null, dependencies = {}) {
  let record = store.publication(workspaceId, publicationId);
  if (!/^chargeweave\/studio-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(record.branch ?? '')) throw new Error('Invalid publication branch');
  if (record.state === 'pushed' || record.state === 'pr_created') return { publication: record, targetHead: null, note: 'Branch push was already recorded.' };
  if (!['commit_created', 'push_unknown'].includes(record.state) || !record.commitSha) throw new Error('Publication has no recoverable commit');
  if (!fixture && (typeof token !== 'string' || token.length < 20 || /[\r\n\0]/.test(token))) throw new Error('A configured GitHub publisher token is required');
  const target = fixture?.remote ?? canonical, base = fixture?.branch ?? 'main';
  if (!/^[A-Za-z0-9][A-Za-z0-9._/-]{0,127}$/.test(base) || base.includes('..') || base.includes('//') || base.endsWith('/')) throw new Error('Invalid configured target branch');
  const configured = (await exec('git', ['remote', 'get-url', 'origin'], { cwd: repository, timeout: 15000, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } })).stdout.trim();
  if (fixture ? configured !== target : !aliases.has(configured)) throw new Error('Repository remote is not allowlisted');
  let directory;
  try {
    directory = await mkdtemp(join(tmpdir(), 'chargeweave-push-'));
    const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^GIT_/i.test(key) && !/^GH_/i.test(key)));
    Object.assign(env, { GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: process.platform === 'win32' ? 'NUL' : '/dev/null', GIT_ALLOW_PROTOCOL: fixture ? 'file' : 'file:https' });
    const local = { cwd: directory, timeout: 60000, maxBuffer: 8 * 1024 * 1024, env };
    await exec('git', ['init', '--bare', '--quiet', '--template=', directory], local);
    await exec('git', ['-c', 'protocol.file.allow=always', 'fetch', '--quiet', '--no-tags', '--', resolve(repository), record.baselineCommit], local);
    const bundle = store.publicationBundle(workspaceId, publicationId);
    if (bundle.commitSha !== record.commitSha) throw new Error('Publication bundle does not match the journal');
    const bundlePath = join(directory, 'candidate.bundle');
    await writeFile(bundlePath, bundle.content);
    await exec('git', ['fetch', '--quiet', '--no-tags', '--', bundlePath, 'HEAD'], local);
    const fetched = (await exec('git', ['rev-parse', 'FETCH_HEAD'], local)).stdout.trim();
    const parent = (await exec('git', ['rev-parse', `${fetched}^`], local)).stdout.trim();
    if (fetched !== record.commitSha || parent !== record.baselineCommit) throw new Error('Publication bundle has an unexpected commit or parent');
    const remoteEnv = { ...env, GIT_ALLOW_PROTOCOL: fixture ? 'file' : 'https' };
    if (!fixture) Object.assign(remoteEnv, { GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'http.https://github.com/.extraheader', GIT_CONFIG_VALUE_0: `AUTHORIZATION: Basic ${Buffer.from(`x-access-token:${token}`).toString('base64')}` });
    const remoteOptions = { ...local, timeout: 120000, env: remoteEnv };
    const refs = async () => {
      const output = (await exec('git', ['ls-remote', '--heads', '--', target, `refs/heads/${base}`, `refs/heads/${record.branch}`], remoteOptions)).stdout;
      const result = new Map();
      for (const line of output.split(/\r?\n/).filter(Boolean)) {
        const match = /^([a-f0-9]{40})\s+refs\/heads\/(.+)$/.exec(line);
        if (!match || ![base, record.branch].includes(match[2]) || result.has(match[2])) throw new Error('Unexpected remote response');
        result.set(match[2], match[1]);
      }
      return result;
    };
    let heads;
    try { heads = await refs(); } catch { throw new Error('Remote branch lookup failed'); }
    const existing = heads.get(record.branch);
    if (record.state === 'push_unknown') {
      if (existing === record.commitSha) {
        record = store.advancePublication(workspaceId, publicationId, 'push_unknown', 'pushed', record.commitSha);
        return { publication: record, targetHead: heads.get(base) ?? null, note: 'An earlier push was confirmed on the remote branch.' };
      }
      if (existing) throw new Error('Remote publication branch contains a different commit; manual investigation is required');
      if (heads.get(base) !== record.baselineCommit) throw new Error('Target branch changed; revalidate before retrying publication');
      record = store.retryPublicationAfterAbsentRemote(workspaceId, publicationId);
    }
    if (existing) throw new Error('Publication branch already exists');
    if (heads.get(base) !== record.baselineCommit) throw new Error('Target branch changed; revalidate before publication');
    store.advancePublication(workspaceId, publicationId, 'commit_created', 'push_pending');
    try {
      const push = dependencies.push ?? ((args, options) => exec('git', args, options));
      await push(['push', '--porcelain', '--', target, `${record.commitSha}:refs/heads/${record.branch}`], remoteOptions);
      heads = await refs();
      if (heads.get(record.branch) !== record.commitSha) throw new Error('Remote branch did not confirm the commit');
      record = store.advancePublication(workspaceId, publicationId, 'push_pending', 'pushed', record.commitSha);
      return { publication: record, targetHead: heads.get(base) ?? null, note: heads.get(base) === record.baselineCommit ? 'Commit confirmed on the isolated branch; pull request and CI are separate.' : 'Commit confirmed on the isolated branch; the target moved and needs review before a pull request.' };
    } catch {
      store.advancePublication(workspaceId, publicationId, 'push_pending', 'push_unknown');
      throw new Error('Push outcome is unknown; reconcile the remote branch before retrying');
    }
  } finally { if (directory) await rm(directory, { recursive: true, force: true }); }
}

export async function runPublicationPush(store, workspaceId, publicationId, job, repository, token, fixture) {
  try {
    store.updateJob(job.id, 'running');
    const result = await pushPublication(store, workspaceId, publicationId, repository, token, fixture);
    store.saveJobArtifacts(job.id, result);
    store.updateJob(job.id, 'passed');
  } catch (error) { store.updateJob(job.id, 'failed', error.message); }
}
