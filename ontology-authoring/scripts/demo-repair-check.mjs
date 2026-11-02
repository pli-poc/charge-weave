import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { WorkspaceStore } from '../src/workspace.js';
import { maintenanceCommands } from '../src/maintenance-demo.js';
import { editableSourcePaths, importSourceManifest } from '../src/source-manifest.js';
import { runGenerator } from '../src/validation.js';

const repository = resolve(process.env.CHARGEWEAVE_REPOSITORY ?? '..');
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim();
const show = path => execFileSync('git', ['show', `${commit}:${path}`], { cwd: repository, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
const store = new WorkspaceStore(':memory:');
try {
  const workspace = store.create({ title: 'Synthetic failure and repair', baselineCommit: commit, schema: show('model/domain.schema'), sourceManifest: importSourceManifest(repository, commit), sourceBlobs: Object.fromEntries([...editableSourcePaths].map(path => [path, show(path)])) });
  const apply = (expectedRevision, operationId, commands) => store.apply({ workspaceId: workspace.id, actor: 'synthetic-repair', expectedRevision, operationId, commands });
  apply(0, 'proposal', maintenanceCommands());
  const edit = (from, to) => ({ type: 'property.update', owner: 'PlannedMaintenanceWindow', name: 'maintenanceStation', expectedRange: 'ChargingStation', expectedCardinality: from, range: 'ChargingStation', cardinality: to });
  apply(1, 'weaken', [edit('!', '?')]);
  async function run(operationId) {
    const candidate = store.get(workspace.id);
    const { job } = store.createJob(workspace.id, candidate.revision, candidate.sourceDigest, 'synthetic-repair', operationId, 'maintenance-demo');
    await runGenerator(store, candidate, job, repository, process.env.CHARGEWEAVE_PYTHON);
    const result = store.job(workspace.id, job.id);
    const step = result.steps.find(item => item.checkName === 'tools/test_authoring_maintenance_demo.py');
    const report = step?.output?.split(/\r?\n/).flatMap(line => { try { const value = JSON.parse(line); return Array.isArray(value.cases) ? [value] : []; } catch { return []; } }).at(-1);
    console.log(JSON.stringify({ revision: candidate.revision, digest: candidate.sourceDigest, status: result.status, stale: result.stale, cases: report?.cases }));
    return { result, report };
  }
  const failure = await run('failed-fixtures');
  if (failure.result.status !== 'failed' || !failure.report?.cases.some(item => item.case === 'missing-station' && item.passed === false && item.expectedConformance === false && item.actualConformance === true)) throw new Error('Expected missing-station failure was not observed');
  apply(2, 'repair', [edit('?', '!')]);
  const repaired = await run('repaired-fixtures');
  if (repaired.result.status !== 'passed' || repaired.result.stale || !repaired.report?.cases.every(item => item.passed)) throw new Error('Repair did not produce passing current fixtures');
} finally { store.close(); }
