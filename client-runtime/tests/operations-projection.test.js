import test from 'node:test';
import assert from 'node:assert/strict';
import pkg from '../generated/application.json' with { type: 'json' };
import { createWorkspace } from '../src/profiles/chargeweave/workspace.js';
import { correctionOperationsProjection as project } from '../src/profiles/chargeweave/operations-projection.js';

test('operational projection follows committed case and task, and survives restoration', async () => {
  const w = createWorkspace({ applicationPackage: pkg });
  const input = { meterEnd: String(pkg.task.case.proposedMeterEnd), reason: 'partner-correction', evidenceReference: pkg.task.case.evidenceReference, operatorNote: 'Evidence has been checked against the register.' };
  let p = project(w.task(), pkg.task.case);
  assert.equal(p.openCases, 1); assert.equal(p.waitingEvidence, 1); assert.equal(p.actionableTasks, 0); assert.equal(p.approvedNetAdjustment, null);
  await w.prepare({ input, expectedRevision: 0, idempotencyKey: 'prepare' });
  p = project(w.task(), pkg.task.case);
  assert.equal(p.actionableTasks, 1); assert.equal(p.waitingEvidence, 0);
  await w.decide({ outcome: 'approve', note: 'Evidence and proposed amount reviewed carefully.', expectedRevision: 1, idempotencyKey: 'approve' });
  p = project(w.task(), pkg.task.case);
  assert.equal(p.openCases, 0); assert.equal(p.actionableTasks, 0); assert.equal(p.completedCorrections, 1); assert.equal(p.pendingPartnerDelivery, null);
  assert.equal(p.approvedNetAdjustment, '-0.48');
  const restored = createWorkspace({ applicationPackage: pkg, snapshot: w.export() });
  assert.deepEqual(project(restored.task(), pkg.task.case), p);
});
