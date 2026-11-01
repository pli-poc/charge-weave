import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { generatedInputs, sha256 } from './source-manifest.js';

const exec = promisify(execFile);

export const releaseGates = [
  ['validate.py', '--meta'], ['test_business.py'], ['test_boundaries.py'], ['test_trust_boundary.py'], ['check_owl.py'], ['check_release.py'], ['test_analytics.py'], ['check_audit.py'], ['test_business_acceptance.py'], ['test_lifecycle.py'], ['check_naming.py'], ['audit_temporal.py'], ['test_temporal.py'], ['test_xflow.py'],
  ...['closure', 'charge', 'credit', 'offline', 'reimbursement', 'privacy', 'energy', 'migration', 'asset', 'allowance', 'access', 'settlement', 'process'].map(family => ['test_journey_snapshots.py', '--family', family]),
  ...['access', 'credit', 'allowance', 'dunning', 'history', 'hold'].map(family => ['test_adversarial.py', '--family', family]),
];
export function commandsFor(profile) {
  if (profile === 'structural') return [['tools/build.py']];
  if (profile === 'reference') return [['tools/build_all.py'], ['tools/validate.py', '--meta'], ['tools/test_business.py'], ['tools/test_boundaries.py']];
  if (profile === 'acceptance') return [['tools/build_all.py'], ['tools/check_generated.py'], ...releaseGates.map(([name, ...args]) => [`tools/${name}`, ...args])];
  throw new Error('Invalid validation profile');
}

// Run fixed repository checks in an isolated copy of the pinned baseline.
// Neither profile alone establishes all independent acceptance evidence.
export async function runGenerator(store, workspace, job, repository, python = 'python', signal) {
  let directory;
  let output = '';
  let currentStep = null;
  try {
    store.updateJob(job.id, 'running');
    directory = await mkdtemp(join(tmpdir(), 'chargeweave-validation-'));
    const archive = join(directory, 'baseline.tar');
    await exec('git', ['archive', '--format=tar', `--output=${archive}`, workspace.baselineCommit], { cwd: repository, timeout: 30000 });
    await exec('tar', ['-xf', archive, '-C', directory], { timeout: 30000 });
    await rm(archive);
    // Several release checks record `git rev-parse HEAD`. Give the isolated
    // candidate its actual baseline identity without modifying the source checkout.
    // Reset only the index: the candidate overlay remains an ordinary worktree diff.
    const gitOptions = { cwd: directory, timeout: 60000, env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_ALLOW_PROTOCOL: 'file', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: process.platform === 'win32' ? 'NUL' : '/dev/null' } };
    await exec('git', ['init', '--quiet', '--template=', directory], gitOptions);
    await exec('git', ['-c', 'protocol.file.allow=always', 'fetch', '--quiet', '--no-tags', '--depth=1', '--no-write-fetch-head', '--', resolve(repository), workspace.baselineCommit], gitOptions);
    await exec('git', ['update-ref', 'HEAD', workspace.baselineCommit], gitOptions);
    await exec('git', ['reset', '--quiet', '--mixed', workspace.baselineCommit], gitOptions);
    await writeFile(join(directory, 'model', 'domain.schema'), workspace.schema, 'utf8');
    const tracked = await exec('git', ['ls-tree', '-r', '-z', '--name-only', workspace.baselineCommit, '--', 'model', 'benchmark', 'requirements', 'tests', 'tools', 'requirements.txt'], { cwd: repository, timeout: 30000, maxBuffer: 4 * 1024 * 1024 });
    const sourcePaths = tracked.stdout.split('\0').filter(path => path && !generatedInputs.has(path));
    const sourceBytes = new Map();
    for (const path of sourcePaths) sourceBytes.set(path, await readFile(join(directory, path)));
    if (workspace.digestVersion === 3) {
      const actual = [...sourceBytes].map(([path, bytes]) => ({ path, sha256: sha256(bytes) })).sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
      if (JSON.stringify(actual) !== JSON.stringify(workspace.sourceManifest)) throw new Error('Candidate source manifest does not match materialized inputs');
    }
    if (job.profile === 'acceptance') {
      const verifier = await readFile(join(directory, 'tools', 'verify_all.py'), 'utf8');
      if (!verifier.includes("if sys.argv[1:] == ['--list-json']")) throw new Error('Baseline verifier does not expose a compatible release-gate catalogue');
      const listed = await exec(python, ['tools/verify_all.py', '--list-json'], { cwd: directory, timeout: 30000, maxBuffer: 1024 * 1024, env: { ...process.env, PYTHONUTF8: '1' } });
      if (JSON.stringify(JSON.parse(listed.stdout)) !== JSON.stringify(releaseGates)) throw new Error('Release-gate catalogue differs from the supported acceptance profile');
    }
    const commands = commandsFor(job.profile);
    for (const [ordinal, args] of commands.entries()) {
      if (signal?.aborted) { store.updateJob(job.id, 'cancelled', output); return; }
      currentStep = ordinal;
      store.startJobStep(job.id, ordinal, args.join(' '));
      store.updateJob(job.id, 'running', `${output}\nRunning: ${args.join(' ')}`);
      const result = await exec(python, args, { cwd: directory, timeout: 600000, maxBuffer: 4 * 1024 * 1024, env: { ...process.env, PYTHONUTF8: '1' } });
      output += `$ ${args.join(' ')}\n${result.stdout}\n${result.stderr}\n`;
      for (const path of sourcePaths) {
        const before = sourceBytes.get(path), after = await readFile(join(directory, path));
        const equal = path === 'model/domain.schema' ? before.toString('utf8').replace(/\r\n/g, '\n') === after.toString('utf8').replace(/\r\n/g, '\n') : before.equals(after);
        if (!equal) throw new Error(`Generator rewrote source ${path}; reconcile changes before review`);
      }
      store.finishJobStep(job.id, ordinal, 'passed', `${result.stdout}\n${result.stderr}`);
      currentStep = null;
    }
    if (signal?.aborted) { store.updateJob(job.id, 'cancelled', output); return; }
    store.updateJob(job.id, 'passed', output);
  } catch (error) {
    if (currentStep !== null) store.finishJobStep(job.id, currentStep, signal?.aborted ? 'cancelled' : 'failed', `${error.message}\n${error.stdout ?? ''}\n${error.stderr ?? ''}`);
    store.updateJob(job.id, signal?.aborted ? 'cancelled' : 'failed', `${output}\n${error.message}\n${error.stdout ?? ''}\n${error.stderr ?? ''}`);
  } finally {
    if (directory) await rm(directory, { recursive: true, force: true });
  }
}
