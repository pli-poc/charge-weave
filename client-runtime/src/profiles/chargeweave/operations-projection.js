import { fixed, formatFixed } from '../../services/decimal.js';
import { rateReading } from './rating.js';

function uniqueById(rows, label) {
  const map = new Map();
  for (const row of rows) {
    if (!row?.id) throw Error(`${label} identity required`);
    const previous = map.get(row.id);
    if (previous && JSON.stringify(previous) !== JSON.stringify(row)) throw Error(`Conflicting ${label} identity ${row.id}`);
    map.set(row.id, row);
  }
  return [...map.values()];
}

/** Aggregate declared operational records, not historical network facts. */
export function aggregateCorrectionOperations({ cases, tasks, adjustments, currency = 'EUR', role = 'BillingApprover', virtualTime = null }) {
  const uniqueCases = uniqueById(cases, 'case'), uniqueTasks = uniqueById(tasks, 'task'), uniqueAdjustments = uniqueById(adjustments, 'adjustment');
  const ids = new Set(uniqueCases.map(item => item.id));
  if ([...uniqueTasks, ...uniqueAdjustments].some(item => !ids.has(item.caseId))) throw Error('Operational record has unknown case');
  if (uniqueAdjustments.some(item => item.currency !== currency)) throw Error('Mixed currency requires an explicit conversion contract');
  const open = uniqueCases.filter(item => !['completed', 'declined'].includes(item.status));
  const openIds = new Set(open.map(item => item.id));
  const waits = open.filter(item => ['awaitingEvidence', 'awaitingAdditionalEvidence', 'awaitingApproval'].includes(item.flowState));
  const now = virtualTime === null ? null : Date.parse(virtualTime);
  if (virtualTime !== null && !Number.isFinite(now)) throw Error('Invalid virtual time');
  const ages = now === null ? [] : waits.map(item => Date.parse(item.waitSince)).filter(Number.isFinite).filter(at => at <= now).map(at => now - at);
  const cents = uniqueAdjustments.reduce((sum, item) => sum + fixed(item.amount, 2), 0n);
  return {
    openCases: open.length,
    actionableTasks: uniqueTasks.filter(item => item.status === 'open' && item.role === role && openIds.has(item.caseId)).length,
    waitingEvidence: open.filter(item => ['awaitingEvidence', 'awaitingAdditionalEvidence'].includes(item.flowState)).length,
    completedCorrections: uniqueCases.filter(item => item.status === 'completed' && item.outcome === 'correction.accepted').length,
    approvedNetAdjustment: uniqueAdjustments.length ? formatFixed(cents, 2) : null,
    oldestOpenWaitMs: ages.length ? Math.max(...ages) : null,
    pendingPartnerDelivery: null,
    evidence: { caseCount: uniqueCases.length, taskCount: uniqueTasks.length, adjustmentCount: uniqueAdjustments.length, currency, role, virtualTime, grain: 'distinct identities at current checkpoint' },
  };
}

/** Single connected scenario projected through the shared operational contract. */
export function correctionOperationsProjection(task, caseData) {
  const original = rateReading(caseData.originalMeterEnd, caseData);
  const corrected = task.status === 'completed' && task.outcome?.type === 'correction.accepted' ? task.outcome : null;
  const adjustment = corrected ? formatFixed(fixed(corrected.amount, 2) - fixed(original.amountEur, 2), 2) : null;
  const result = aggregateCorrectionOperations({
    cases: [{ id: caseData.id, status: task.status, flowState: task.flowState, outcome: task.outcome?.type ?? null }],
    tasks: task.status === 'awaitingApproval' ? [{ id: task.id, caseId: caseData.id, status: 'open', role: 'BillingApprover' }] : [],
    adjustments: adjustment === null ? [] : [{ id: corrected.correctionId, caseId: caseData.id, amount: adjustment, currency: 'EUR' }],
  });
  return { ...result, scope: { subject: 'correction case', grain: 'distinct case and current task', caseId: caseData.id, sessionId: caseData.sessionId, timeBasis: 'current saved or in-memory checkpoint', currency: 'EUR', population: 1 }, state: task.status, flowState: task.flowState, revision: task.revision, original };
}
