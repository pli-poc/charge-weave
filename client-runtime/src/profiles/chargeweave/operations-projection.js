import { fixed, formatFixed } from '../../services/decimal.js';
import { rateReading } from './rating.js';

/** One-case operational projection; the separate historical network is not included. */
export function correctionOperationsProjection(task, caseData) {
  const terminal = ['completed', 'declined'].includes(task.status);
  const waitingApproval = task.status === 'awaitingApproval' && task.flowState === 'awaitingApproval';
  const waitingEvidence = task.status === 'open' && task.flowState === 'awaitingEvidence';
  const original = rateReading(caseData.originalMeterEnd, caseData);
  const corrected = task.status === 'completed' && task.outcome?.type === 'correction.accepted' ? task.outcome : null;
  const adjustment = corrected ? formatFixed(fixed(corrected.amount, 2) - fixed(original.amountEur, 2), 2) : null;
  return {
    scope: { subject: 'correction case', grain: 'distinct case and current task', caseId: caseData.id, sessionId: caseData.sessionId, timeBasis: 'current saved or in-memory checkpoint', currency: 'EUR', population: 1 },
    openCases: terminal ? 0 : 1,
    actionableTasks: waitingApproval ? 1 : 0,
    waitingEvidence: waitingEvidence ? 1 : 0,
    completedCorrections: corrected ? 1 : 0,
    approvedNetAdjustment: adjustment,
    pendingPartnerDelivery: null,
    state: task.status,
    flowState: task.flowState,
    revision: task.revision,
    original,
  };
}
