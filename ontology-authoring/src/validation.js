import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generatedInputs, sha256 } from './source-manifest.js';

const exec = promisify(execFile);

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
    await writeFile(join(directory, 'model', 'domain.schema'), workspace.schema, 'utf8');
    const tracked = await exec('git', ['ls-tree', '-r', '-z', '--name-only', workspace.baselineCommit, '--', 'model', 'benchmark', 'requirements', 'tests', 'tools', 'requirements.txt'], { cwd: repository, timeout: 30000, maxBuffer: 4 * 1024 * 1024 });
    const sourcePaths = tracked.stdout.split('\0').filter(path => path && !generatedInputs.has(path));
    const sourceBytes = new Map();
    for (const path of sourcePaths) sourceBytes.set(path, await readFile(join(directory, path)));
    if (workspace.digestVersion === 3) {
      const actual = [...sourceBytes].map(([path, bytes]) => ({ path, sha256: sha256(bytes) })).sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
      if (JSON.stringify(actual) !== JSON.stringify(workspace.sourceManifest)) throw new Error('Candidate source manifest does not match materialized inputs');
    }
    const commands = job.profile === 'reference'
      ? [['tools/build_all.py'], ['tools/validate.py', '--meta'], ['tools/test_business.py'], ['tools/test_boundaries.py']]
      : [['tools/build.py']];
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
