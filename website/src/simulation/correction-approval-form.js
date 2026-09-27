import { correctionWorkflowDefinition } from "./correction-workflow.js";

// This profile scopes the generic renderer to one HumanTask. The editable
// amount is a proposed adjustment bound to the CDR amount concept; the host
// checks it against the workflow's calculated delta before accepting it.
export const correctionApprovalForm = {
  id: "chargeweave.correction-approval",
  version: "1.0.0",
  workflowId: correctionWorkflowDefinition.id,
  workflowVersion: correctionWorkflowDefinition.version,
  stepId: "awaitingApproval",
  role: "BillingApprover",
  fields: [
    {
      id: "correctionKind",
      mode: "input",
      activeOn: ["approval.granted"],
      binding: { class: "RecordCorrection", property: "correctionKind" },
      label: "Correction type",
      help: "Choose the kind of linked correction record this approval authorizes.",
      shape: { requiredOn: ["approval.granted"], minLength: 1 },
    },
    {
      id: "correctionReason",
      mode: "input",
      binding: { class: "RecordCorrection", property: "correctionReason" },
      control: "textarea",
      label: "Decision reason",
      help: "This reason is attached to the task decision for review.",
      shape: { required: true, minLength: 12, maxLength: 500 },
    },
    {
      id: "correctionEvidence",
      mode: "input",
      activeOn: ["approval.granted"],
      binding: { class: "RecordCorrection", property: "correctionEvidence" },
      control: "evidence",
      label: "Supporting evidence",
      help: "Select a retained evidence reference. The form does not upload or expose evidence bytes.",
      options: [
        { id: "EVIDENCE-METER-7781", label: "Signed meter correction · digest 91a7…d20c", class: "EvidenceDocument" },
        { id: "EVIDENCE-CASE-2042", label: "Customer correction request · digest 4c1b…80ee", class: "EvidenceDocument" },
      ],
      shape: { requiredOn: ["approval.granted"] },
    },
    {
      id: "proposedCreditAmount",
      mode: "input",
      activeOn: ["approval.granted"],
      binding: { class: "ChargeDetailRecord", property: "grossAmount" },
      control: "money",
      label: "Proposed credit amount",
      help: "A review proposal only. The host caps it at the calculated adjustment and the rating service remains authoritative.",
      currencies: [{ code: "EUR", minorUnitDigits: 2 }],
      shape: {
        requiredOn: ["approval.granted"],
        min: "0.00",
        maxFrom: "rating.grossDeltaEur",
        precision: 2,
      },
    },
    {
      id: "paymentReference",
      mode: "display",
      binding: { class: "PaymentInstrument", property: "providerInstrumentReference" },
      control: "masked",
      label: "Payment reference",
      help: "Only a masked display value is supplied to this page. No credential is collected.",
      valuePath: "paymentReferenceMasked",
      sensitive: true,
    },
  ],
  outcomes: [
    { eventType: "approval.granted", label: "Approve correction", tone: "primary" },
    { eventType: "approval.rejected", label: "Reject and quarantine", tone: "danger" },
  ],
};
