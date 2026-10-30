import { aggregateCorrectionOperations, correctionOperationsProjection } from '../../client-runtime/src/profiles/chargeweave/operations-projection.js';

// Pinned case snapshots, not real customer records or a continuous event history.
const fixture = Object.freeze([
  ['CW-BILL-1101','Maasboulevard · Rotterdam','awaitingApproval','awaitingApproval','2026-10-12T11:00:00Z','2026-10-09',null,null],
  ['CW-BILL-1102','Jaarbeurs P4 · Utrecht','awaitingApproval','awaitingApproval','2026-10-12T15:00:00Z','2026-10-10',null,null],
  ['CW-BILL-1103','Leuven Station P1','awaitingEvidence','awaitingEvidence','2026-10-12T17:00:00Z','2026-10-10',null,null],
  ['CW-BILL-1104','Antwerpen Zuid P+R','waitingBillingEvidence','awaitingAdditionalEvidence','2026-10-13T05:00:00Z','2026-10-11',null,null],
  ['CW-BILL-1105','Gent Zuid Parking','expired','manualReview','2026-10-13T06:00:00Z','2026-10-11',null,null],
  ['CW-BILL-1106','Brussels North P2','completed','completed',null,'2026-10-07','correction.accepted','-1.24'],
  ['CW-BILL-1107','High Tech Campus · Eindhoven','completed','completed',null,'2026-10-08','correction.accepted','-0.76'],
  ['CW-BILL-1108','Maasboulevard · Rotterdam','completed','completed',null,'2026-10-09','correction.accepted','0.32'],
  ['CW-BILL-1109','Jaarbeurs P4 · Utrecht','declined','declined',null,'2026-10-12','correction.rejected',null],
  ['CW-BILL-1110','Leuven Station P1','awaitingApproval','awaitingApproval','2026-10-13T07:00:00Z','2026-10-12',null,null],
  ['CW-BILL-1111','Antwerpen Zuid P+R','completed','completed',null,'2026-10-12','correction.accepted','-2.10'],
  ['CW-BILL-1112','Gent Zuid Parking','awaitingEvidence','awaitingEvidence','2026-10-13T07:30:00Z','2026-10-13',null,null],
]);
export const CORRECTION_CLOCK = '2026-10-13T08:00:00Z';
export function correctionPopulation(task, caseData) {
  const local = correctionOperationsProjection(task, caseData);
  const historical = fixture.map(([id, site, status, flowState, waitSince, created, outcome, amount]) => ({ id, site, status, flowState, waitSince, created, outcome, amount, interactive: false }));
  const current = { id: caseData.id, site: caseData.site, status: task.status, flowState: task.flowState, outcome: task.outcome?.type ?? null, created: '2026-10-13', waitSince: null, interactive: true };
  const cases = [...historical, current];
  const tasks = cases.filter(c => c.status === 'awaitingApproval').map(c => ({ id: `approval:${c.id}`, caseId: c.id, status: 'open', role: 'BillingApprover' }));
  const adjustments = historical.filter(c => c.amount !== null).map(c => ({ id: `adjustment:${c.id}`, caseId: c.id, amount: c.amount, currency: 'EUR' }));
  if (local.approvedNetAdjustment !== null) adjustments.push({ id: `adjustment:${current.id}`, caseId: current.id, amount: local.approvedNetAdjustment, currency: 'EUR' });
  const metrics = aggregateCorrectionOperations({ cases, tasks, adjustments, virtualTime: CORRECTION_CLOCK });
  const isEvidence = c => ['awaitingEvidence', 'awaitingAdditionalEvidence'].includes(c.flowState);
  const distributions = [
    { key: 'approval', label: 'Awaiting approval', count: cases.filter(c => c.status === 'awaitingApproval').length },
    { key: 'evidence', label: 'Waiting for evidence', count: cases.filter(isEvidence).length },
    { key: 'review', label: 'Manual review', count: cases.filter(c => c.status === 'expired' || c.flowState === 'manualReview').length },
    { key: 'completed', label: 'Completed', count: cases.filter(c => c.status === 'completed').length },
    { key: 'declined', label: 'Declined', count: cases.filter(c => c.status === 'declined').length },
  ];
  const dates = ['2026-10-07','2026-10-08','2026-10-09','2026-10-10','2026-10-11','2026-10-12','2026-10-13'];
  const arrivals = dates.map(date => ({ date, count: cases.filter(c => c.created === date).length }));
  return { metrics, cases, distributions, arrivals, local, clock: CORRECTION_CLOCK };
}
