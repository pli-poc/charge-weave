import test from "node:test";
import assert from "node:assert/strict";
import { correctionApprovalForm } from "./correction-approval-form.js";
import { correctionWorkflowDefinition, correctionWorkflowRuntime } from "./correction-workflow.js";
import { compileTaskForm, createSimulatedTaskHost, validateTaskSubmission } from "./task-form-engine.js";

const approver = { id: "operator-17", roles: ["BillingApprover"] };

function compiled(profile = correctionApprovalForm) {
  return compileTaskForm({ definition: correctionWorkflowDefinition, profile });
}

async function openApprovalTask() {
  const actor = correctionWorkflowRuntime.createActor(correctionWorkflowDefinition).start();
  actor.send({
    type: "meter.corrected",
    evidence: {
      id: "METER-EVIDENCE-7781",
      signatureValid: true,
      sameRegisterEpoch: true,
      correctedEnergyKwh: 10,
      receivedAt: "2026-09-27T00:00:00.000Z",
    },
  });
  actor.send({ type: "evidence.validate" });
  await new Promise((resolve, reject) => {
    if (actor.getSnapshot().matches("awaitingApproval")) return resolve();
    const timeout = setTimeout(() => reject(new Error("approval task did not open")), 1000);
    const subscription = actor.subscribe((snapshot) => {
      if (!snapshot.matches("awaitingApproval")) return;
      clearTimeout(timeout);
      subscription.unsubscribe();
      resolve();
    });
  });
  return actor;
}

const validApproval = {
  correctionKind: "Credit",
  correctionReason: "Meter correction confirmed against signed source evidence.",
  correctionEvidence: "EVIDENCE-METER-7781",
  proposedCreditAmount: { amount: "0.19", currency: "EUR" },
};

test("task form compiler infers ontology controls and only compiles the declared task scope", () => {
  const form = compiled();
  assert.equal(form.stepId, "awaitingApproval");
  assert.deepEqual(form.fields.map((field) => [field.id, field.control, field.mode]), [
    ["correctionKind", "select", "input"],
    ["correctionReason", "textarea", "input"],
    ["correctionEvidence", "evidence", "input"],
    ["proposedCreditAmount", "money", "input"],
    ["paymentReference", "masked", "display"],
  ]);
  assert.deepEqual(form.fields.find((field) => field.id === "correctionKind").allowedValues, ["Credit", "Replace", "Reverse", "Adjust"]);
  assert.equal(form.fields.find((field) => field.id === "paymentReference").binding.range, "string");
  assert.equal(form.fields.find((field) => field.id === "paymentReference").sensitive, true);
});

test("compiler rejects unknown ontology bindings, controls, task roles and undeclared outcomes", () => {
  const unknownBinding = structuredClone(correctionApprovalForm);
  unknownBinding.fields[0].binding.property = "unmodeledField";
  assert.throws(() => compiled(unknownBinding), /must bind to a field/);

  const wrongControl = structuredClone(correctionApprovalForm);
  wrongControl.fields[0].control = "money";
  assert.throws(() => compiled(wrongControl), /incompatible with ontology range/);

  const unsafeMask = structuredClone(correctionApprovalForm);
  unsafeMask.fields[4].control = "text";
  assert.throws(() => compiled(unsafeMask), /sensitive fields must be read-only and masked/);

  const wrongRole = structuredClone(correctionApprovalForm);
  wrongRole.role = "BillingOperator";
  assert.throws(() => compiled(wrongRole), /role must match/);

  const undeclaredOutcome = structuredClone(correctionApprovalForm);
  undeclaredOutcome.outcomes.push({ eventType: "record.overwrite", label: "Overwrite" });
  assert.throws(() => compiled(undeclaredOutcome), /not declared on the bound HumanTask/);

  const missingOutcome = structuredClone(correctionApprovalForm);
  missingOutcome.fields[0].shape.requiredOn = ["approval.rejected"];
  missingOutcome.outcomes = missingOutcome.outcomes.filter((outcome) => outcome.eventType !== "approval.rejected");
  assert.throws(() => compiled(missingOutcome), /references undeclared task outcome/);
});

test("submission validation applies event-specific requirements and exact bounded money", () => {
  const form = compiled();
  const context = { rating: { grossDeltaEur: 0.19 } };
  assert.deepEqual(validateTaskSubmission({ form, eventType: "approval.granted", values: validApproval, context }), []);
  assert.match(validateTaskSubmission({
    form,
    eventType: "approval.granted",
    values: { ...validApproval, proposedCreditAmount: { amount: "0.20", currency: "EUR" } },
    context,
  }).join(" "), /cannot exceed the calculated 0.19 EUR adjustment/);
  assert.match(validateTaskSubmission({
    form,
    eventType: "approval.granted",
    values: { ...validApproval, proposedCreditAmount: { amount: "0.191", currency: "EUR" } },
    context,
  }).join(" "), /no more than 2 decimal places/);
  assert.match(validateTaskSubmission({ form, eventType: "approval.granted", values: validApproval, context: {} }).join(" "), /ceiling is unavailable/);
  assert.match(validateTaskSubmission({
    form,
    eventType: "approval.granted",
    values: { ...validApproval, correctionKind: "Delete" },
    context,
  }).join(" "), /valid correction type/);
  assert.match(validateTaskSubmission({
    form,
    eventType: "approval.rejected",
    values: {
      correctionKind: "not a valid kind",
      correctionReason: "Insufficient evidence to approve this correction.",
      proposedCreditAmount: { amount: "not money", currency: "GBP" },
    },
    context,
  }).join(" "), /^$/);
  assert.match(validateTaskSubmission({
    form,
    eventType: "approval.rejected",
    values: { correctionReason: "too short" },
    context,
  }).join(" "), /at least 12 characters/);
  assert.match(validateTaskSubmission({
    form,
    eventType: "approval.granted",
    values: { ...validApproval, privateAdminField: "forbidden" },
    context,
  }).join(" "), /outside this task's editable scope/);
});

test("simulated host enforces role, task revision and open state before resuming XState", async () => {
  const actor = await openApprovalTask();
  const form = compiled();
  const host = createSimulatedTaskHost({ form, actor, getTaskRevision: () => 4, now: () => "2026-09-27T12:00:00.000Z" });
  const base = { eventType: "approval.granted", values: validApproval, expectedRevision: 4, idempotencyKey: "approval-1" };
  assert.equal(host.submit({ ...base, principal: { id: "intruder", roles: ["BillingOperator"] } }).code, "forbidden");
  assert.equal(host.submit({ ...base, expectedRevision: 3, principal: approver }).code, "stale-task");

  const accepted = host.submit({ ...base, principal: approver });
  assert.equal(accepted.ok, true);
  assert.equal(accepted.audit.actorId, "operator-17");
  assert.equal(accepted.audit.values.proposedCreditAmount.amount, "0.19");
  assert.equal(accepted.audit.submittedAt, "2026-09-27T12:00:00.000Z");
  const duplicate = host.submit({ ...base, principal: approver });
  assert.equal(duplicate.duplicate, true);
  assert.equal(host.submit({ ...base, principal: { id: "intruder", roles: ["BillingOperator"] } }).code, "forbidden");
  assert.equal(host.submit({ ...base, principal: approver, values: { ...validApproval, proposedCreditAmount: { amount: "0.18", currency: "EUR" } } }).code, "idempotency-conflict");
  assert.equal(accepted.audit.correlationId, "SESSION-DEMO-1042");
  assert.equal(actor.getSnapshot().context.approval.outcome, "approval.granted");
  assert.equal(actor.getSnapshot().context.approval.values.correctionEvidence, "EVIDENCE-METER-7781");
  actor.stop();
});

test("rejection is a declared workflow event that keeps its decision reason", async () => {
  const actor = await openApprovalTask();
  const form = compiled();
  const host = createSimulatedTaskHost({ form, actor });
  const receipt = host.submit({
    eventType: "approval.rejected",
    values: { correctionReason: "Evidence does not establish the reported meter change." },
    principal: approver,
    expectedRevision: 1,
    idempotencyKey: "reject-1",
  });
  assert.equal(receipt.ok, true);
  assert.equal(actor.getSnapshot().value, "declined");
  assert.equal(actor.getSnapshot().context.rejection.values.correctionReason, "Evidence does not establish the reported meter change.");
  actor.stop();
});
