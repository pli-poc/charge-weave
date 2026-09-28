/**
 * A browser fixture of the host-facing WorkItem/Task model contract. The app
 * view consumes these descriptors; it does not know the workflow's XState
 * state names or draw the workflow definition.
 */
export const meterCorrectionModel = {
  process: {
    id: "meter-correction-review",
    version: 1,
    label: "Meter correction",
    stages: [
      { id: "detected", label: "Mismatch detected" },
      { id: "evidence", label: "Evidence received" },
      { id: "review", label: "Operator review" },
      { id: "adjustment", label: "Billing adjustment" },
    ],
  },
  case: {
    id: "CW-BILL-0471",
    title: "Review corrected meter reading",
    description: "A partner supplied a revised meter value for a completed charging session. Review the evidence and decide whether to apply the correction.",
    category: "Billing exception",
    status: "open",
    priority: "Needs attention",
    dueLabel: "Due today · 16:30",
    assignedRole: "CPO billing operations",
    assignee: "Unassigned",
    openedAt: "Today · 09:42",
    currentStage: "review",
    sessionId: "SES-AMS-260928-0471",
    cdrId: "CDR-NL-EV-0471",
    site: "Arena parking P2 · Amsterdam",
    partner: "Northline Charge Installations",
    meterId: "NL-MTR-AMS-4481",
    meterStart: 12840.5,
    originalMeterEnd: 12883.1,
    proposedMeterEnd: 12882.7,
    tariffEurPerKwh: 0.55,
    evidenceReference: "EV-2026-4481",
  },
  task: {
    id: "review-meter-correction",
    version: 1,
    title: "Review partner correction",
    instructions: "Compare the signed evidence with the original meter record. If it is valid, enter the corrected register value and explain your decision.",
    submitLabel: "Record decision",
    form: {
      id: "meter-correction-decision",
      version: 1,
      fields: [
        {
          id: "meterEnd",
          label: "Corrected meter end reading",
          concept: "ChargingSession.meterEndReading",
          datatype: "decimal",
          control: "quantity",
          unit: "kWh",
          min: 12840.5,
          step: 0.001,
          required: true,
          defaultValue: "12882.700",
          help: "Must be greater than the accepted start reading. The platform recalculates the energy and amount.",
          span: "wide",
        },
        {
          id: "reason",
          label: "Reason for correction",
          concept: "RecordCorrection.reason",
          datatype: "controlled-vocabulary",
          control: "select",
          required: true,
          defaultValue: "partner-correction",
          options: [
            { value: "partner-correction", label: "Partner submitted corrected meter evidence" },
            { value: "transcription-error", label: "Original value was transcribed incorrectly" },
            { value: "meter-review", label: "Meter register was reviewed by operations" },
          ],
          help: "Select the reason that best matches the supporting evidence.",
        },
        {
          id: "evidenceReference",
          label: "Evidence reference",
          concept: "RecordCorrection.sourceEvidenceReference",
          datatype: "identifier",
          control: "masked",
          mask: "EV-####-####",
          pattern: "EV-[0-9]{4}-[0-9]{4}",
          maxLength: 12,
          required: true,
          defaultValue: "EV-2026-4481",
          help: "Enter the reference of the signed partner evidence.",
        },
        {
          id: "operatorNote",
          label: "Decision note",
          concept: "RecordCorrection.operatorNote",
          datatype: "string",
          control: "textarea",
          minLength: 20,
          maxLength: 500,
          required: true,
          placeholder: "Explain what you checked and why the correction is valid…",
          help: "This note is retained with the correction record for audit and reconciliation.",
          span: "wide",
        },
      ],
    },
  },
};

export function makeMeterCorrectionRun() {
  return {
    status: "open",
    currentStage: meterCorrectionModel.case.currentStage,
    values: Object.fromEntries(
      meterCorrectionModel.task.form.fields.map((field) => [field.id, field.defaultValue ?? ""]),
    ),
    outcome: null,
  };
}

export function rateCorrectedReading(reading, caseData = meterCorrectionModel.case) {
  const energyKwh = Number(reading) - caseData.meterStart;
  return {
    energyKwh,
    amountEur: Math.round((energyKwh * caseData.tariffEurPerKwh + Number.EPSILON) * 100) / 100,
  };
}
