import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const exec = promisify(execFile);

// Run only the repository's fixed structural generator in an isolated copy of
// the pinned baseline. This is one evidence tier, not full reference validation.
export async function runGenerator(store, workspace, job, repository, python = 'python') {
  let directory;
  try {
    store.updateJob(job.id, 'running');
    directory = await mkdtemp(join(tmpdir(), 'chargeweave-validation-'));
    const archive = join(directory, 'baseline.tar');
    await exec('git', ['archive', '--format=tar', `--output=${archive}`, workspace.baselineCommit], { cwd: repository, timeout: 30000 });
    await exec('tar', ['-xf', archive, '-C', directory], { timeout: 30000 });
    await writeFile(join(directory, 'model', 'domain.schema'), workspace.schema, 'utf8');
    const commands = job.profile === 'reference'
      ? [['tools/build_all.py'], ['tools/validate.py', '--meta'], ['tools/test_business.py'], ['tools/test_boundaries.py']]
      : [['tools/build.py']];
    let output = '';
    for (const args of commands) {
      const result = await exec(python, args, { cwd: directory, timeout: 600000, maxBuffer: 4 * 1024 * 1024, env: { ...process.env, PYTHONUTF8: '1' } });
      output += `$ ${args.join(' ')}\n${result.stdout}\n${result.stderr}\n`;
      const generatedSchema = await readFile(join(directory, 'model', 'domain.schema'), 'utf8');
      if (generatedSchema.replace(/\r\n/g, '\n') !== workspace.schema.replace(/\r\n/g, '\n')) throw new Error('Generator rewrote domain.schema; reconcile source changes before review');
    }
    store.updateJob(job.id, 'passed', output);
  } catch (error) {
    store.updateJob(job.id, 'failed', `${error.message}\n${error.stdout ?? ''}\n${error.stderr ?? ''}`);
  } finally {
    if (directory) await rm(directory, { recursive: true, force: true });
  }
}
