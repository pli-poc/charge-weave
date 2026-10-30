import test from 'node:test';
import assert from 'node:assert/strict';
import pkg from '../../client-runtime/generated/application.json' with { type: 'json' };
import { createWorkspace } from '../../client-runtime/src/profiles/chargeweave/workspace.js';
import { correctionPopulation } from '../src/correction-population.js';

test('seeded population retains independent cases while the interactive case moves through approval', async () => {
  const w = createWorkspace({ applicationPackage: pkg });
  const project = () => correctionPopulation(w.task(), pkg.task.case);
  let before = project();
  assert.equal(before.cases.length, 13);
  assert.equal(before.metrics.openCases, 8);
  assert.equal(before.metrics.actionableTasks, 3);
  assert.equal(before.metrics.waitingEvidence, 4);
  assert.equal(before.arrivals.reduce((n, x) => n + x.count, 0), 13);
  assert.equal(before.distributions.reduce((n, x) => n + x.count, 0), 13);
  assert.equal(before.metrics.approvedNetAdjustment, '-3.78');
  await w.prepare({input:{meterEnd:String(pkg.task.case.proposedMeterEnd),reason:'partner-correction',evidenceReference:pkg.task.case.evidenceReference,operatorNote:'Evidence checked against the register.'},expectedRevision:0,idempotencyKey:'prepare'});
  const waiting = project();
  assert.equal(waiting.metrics.actionableTasks, 4);
  assert.equal(waiting.metrics.waitingEvidence, 3);
  await w.decide({outcome:'approve',note:'Evidence and amount reviewed carefully.',expectedRevision:1,idempotencyKey:'approve'});
  const completed = project();
  assert.equal(completed.metrics.openCases, 7);
  assert.equal(completed.metrics.approvedNetAdjustment, '-4.26');
  assert.equal(completed.distributions.find(x => x.key === 'completed').count, 5);
  assert.deepEqual(completed.cases.filter(x => !x.interactive), before.cases.filter(x => !x.interactive));
  assert.deepEqual(project().arrivals, before.arrivals);
});
