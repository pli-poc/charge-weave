import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
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
    const result = await exec(python, ['tools/build.py'], { cwd: directory, timeout: 120000, maxBuffer: 1024 * 1024 });
    store.updateJob(job.id, 'passed', `${result.stdout}\n${result.stderr}`);
  } catch (error) {
    store.updateJob(job.id, 'failed', `${error.message}\n${error.stdout ?? ''}\n${error.stderr ?? ''}`);
  } finally {
    if (directory) await rm(directory, { recursive: true, force: true });
  }
}
