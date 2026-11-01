import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { changeImpact } from '../src/impact.js';

test('impact indexes explicit pinned references without claiming completeness', () => {
  const repository = fileURLToPath(new URL('../..', import.meta.url));
  const baselineCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim();
  const paths = ['requirements/business-requirements.json', 'requirements/journeys.json', 'model/audit-rules.json', 'model/temporal-queries.json'];
  const sourceManifest = paths.map(path => ({ path, sha256: createHash('sha256').update(execFileSync('git', ['show', `${baselineCommit}:${path}`], { cwd: repository })).digest('hex') }));
  const workspace = { id: 'test', revision: 2, sourceDigest: 'digest', digestVersion: 3, baselineCommit, sourceManifest };
  const changes = [{ name: 'ChargingStation', before: { fields: 'stationName:string!' }, after: { fields: 'stationName:string! assetOwner:LegalEntity?' } }];
  const impact = changeImpact(workspace, changes, repository);
  assert.deepEqual(impact.changedClasses, ['ChargingStation']);
  assert.deepEqual(impact.changedProperties, ['assetOwner']);
  assert.equal(impact.coverage, 'partial');
  assert.ok(impact.references.some(item => item.kind === 'requirement' && item.terms.includes('ChargingStation')));
  assert.ok(impact.references.some(item => item.kind === 'journey' && item.terms.includes('ChargingStation')));
  assert.ok(impact.references.every(item => paths.includes(item.source)));
  assert.throws(() => changeImpact({ ...workspace, sourceManifest: sourceManifest.map((item, index) => index ? item : { ...item, sha256: '0'.repeat(64) }) }, changes, repository), /does not match/);
  assert.throws(() => changeImpact({ ...workspace, digestVersion: 2 }, changes, repository), /pinned source manifest/);
  const empty = changeImpact(workspace, [], repository);
  assert.deepEqual(empty.references, []);
  assert.equal(empty.coverage, 'partial');
});
