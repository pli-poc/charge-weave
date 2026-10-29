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

test('operational aggregation counts distinct cases and tasks and rejects ambiguous currency', async () => {
  const { aggregateCorrectionOperations: aggregate } = await import('../src/profiles/chargeweave/operations-projection.js');
  const a = { id: 'a', status: 'awaitingApproval', flowState: 'awaitingApproval', waitSince: '2026-10-13T08:00:00Z' };
  const b = { id: 'b', status: 'completed', flowState: 'completed', outcome: 'correction.accepted' };
  const t = { id: 'task-1', caseId: 'a', status: 'open', role: 'BillingApprover' };
  const adjustment = { id: 'effect-1', caseId: 'b', amount: '-0.48', currency: 'EUR' };
  const input = { cases: [a, b, a], tasks: [t, t, { ...t, id: 'task-2' }], adjustments: [adjustment, adjustment], virtualTime: '2026-10-13T09:00:00Z' };
  const result = aggregate(input);
  assert.equal(result.openCases, 1); assert.equal(result.actionableTasks, 2); assert.equal(result.completedCorrections, 1);
  assert.equal(result.approvedNetAdjustment, '-0.48'); assert.equal(result.oldestOpenWaitMs, 3600000);
  assert.throws(() => aggregate({ ...input, adjustments: [adjustment, { ...adjustment, id: 'other', currency: 'GBP' }] }), /Mixed currency/);
  assert.throws(() => aggregate({ ...input, tasks: [t, { ...t, role: 'Other' }] }), /Conflicting/);
  assert.equal(aggregate({ cases: [], tasks: [], adjustments: [] }).approvedNetAdjustment, null);
  assert.equal(aggregate({ cases: [{ ...b, status: 'awaitingApproval' }], tasks: [], adjustments: [] }).completedCorrections, 0);
});
