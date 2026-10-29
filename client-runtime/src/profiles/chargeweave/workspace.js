import { createCorrectionWorkflowRuntime } from "./correction-workflow.js";
import { fixed, formatFixed } from "../../services/decimal.js";
import { rateReading } from "./rating.js";
import { evaluateRules, validateFields } from "../../services/validation.js";
const copy = (v) => JSON.parse(JSON.stringify(v));
const identity = (v) =>
  JSON.stringify(v, (_, value) =>
    value && typeof value === "object" && !Array.isArray(value)
      ? Object.fromEntries(
          Object.entries(value).sort(([a], [b]) =>
            a < b ? -1 : a > b ? 1 : 0,
          ),
        )
      : value,
  );
async function settle(actor, definition) {
  for (let i = 0; i < 100; i++) {
    const s = actor.getSnapshot();
    const kind = definition.steps.find((x) => x.id === s.value)?.kind;
    if (s.status === "error") throw s.error;
    if (["humanTask", "end", "eventWait"].includes(kind)) return s;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  throw Error("Workflow did not reach a stable boundary");
}
export function createWorkspace({
  applicationPackage: pkg,
  principal = { role: "BillingApprover" },
  clock = () => "2026-10-13T08:00:00.000Z",
  snapshot,
} = {}) {
  const model = pkg.task;
  const caseData = model.case;
  const initialValues = Object.fromEntries(
    model.task.form.fields.map((f) => [f.id, f.defaultValue ?? ""]),
  );
  let state = snapshot
    ? copy(snapshot)
    : {
        revision: 0,
        values: initialValues,
        history: [],
        receipts: {},
        actor: null,
        status: "open",
        currentStage: "review",
        outcome: null,
      };
  if (snapshot) {
    if (
      !Number.isInteger(state.revision) ||
      state.revision < 0 ||
      !Array.isArray(state.history) ||
      state.history.length !== state.revision ||
      !state.values ||
      !state.receipts
    )
      throw Error("Invalid workspace structure");
    if (
      state.revision === 0 &&
      (state.status !== "open" || state.actor !== null)
    )
      throw Error("Invalid initial checkpoint");
    if (state.revision > 0) {
      const last = state.history.at(-1);
      const expected = rateReading(state.values.meterEnd, caseData);
      if (state.status === "awaitingApproval") {
        if (state.actor?.status !== "active" || state.actor?.value !== "awaitingApproval" || last.revision !== state.revision || JSON.stringify(last.input) !== JSON.stringify(state.values) || expected.amountEur !== state.actor?.context?.rating?.grossEur || !state.approvalDueAt) throw Error("Incoherent waiting checkpoint");
        const restored = createCorrectionWorkflowRuntime().createActor(pkg.flow, { snapshot: state.actor });
        restored.start();
        if (restored.getSnapshot().value !== "awaitingApproval") throw Error("Unstable restored process");
        restored.stop();
      } else if (["declined", "expired"].includes(state.status)) {
        const expectedStep = state.status === "declined" ? "declined" : "manualReview";
        if (state.actor?.value !== expectedStep || last.revision !== state.revision || state.actor?.context?.credit || state.actor?.context?.correctedCdr) throw Error("Incoherent exception checkpoint");
      } else if (
        state.status !== "completed" ||
        state.actor?.status !== "done" ||
        !["completed", "completedNoChange"].includes(state.actor?.value) ||
        last.revision !== state.revision ||
        JSON.stringify(last.input) !== JSON.stringify(state.values) ||
        expected.amountEur !== state.outcome?.amount
      )
        throw Error("Incoherent business/process checkpoint");
      if (state.status === "completed") {
        const restored = createCorrectionWorkflowRuntime().createActor(pkg.flow, { snapshot: state.actor });
        restored.start();
        if (restored.getSnapshot().status !== "done") throw Error("Unstable restored process");
        restored.stop();
      }
    }
  }
  let queue = Promise.resolve();
  let busy = false;
  let pending = 0;
  const task = () => ({
    id: state.status === "awaitingApproval" ? model.additionalTasks[0].id : model.task.id,
    revision: state.revision,
    status: state.status,
    stage: state.currentStage,
    descriptor: copy(state.status === "awaitingApproval" ? model.additionalTasks[0] : model.task),
    values: copy(state.values),
    outcome: copy(state.outcome),
    flowState: state.actor?.value ?? pkg.flow.initialStep,
    approvalDueAt: state.approvalDueAt ?? null,
    records: copy({ credit: state.actor?.context?.credit ?? null, correctedCdr: state.actor?.context?.correctedCdr ?? null }),
    history: copy(state.history),
  });
  const result = (accepted, code, violations = []) => ({
    accepted,
    code,
    violations,
    revision: state.revision,
    task: task(),
  });
  async function execute({ input, expectedRevision, idempotencyKey }, pauseForApproval = false) {
    const command = pkg.commands.commands.find(
      (c) => c.id === "submitCorrection",
    );
    if (principal.role !== command.role)
      return result(false, "FORBIDDEN", [
        {
          ruleId: "task-scope",
          message: "Simulated role cannot submit this task",
        },
      ]);
    if (
      typeof idempotencyKey !== "string" ||
      !idempotencyKey.trim() ||
      idempotencyKey.length > 120
    )
      return result(false, "INVALID_KEY");
    const signature = identity({ input, expectedRevision, ...(pauseForApproval ? { operation: "prepare" } : {}) });
    if (Object.hasOwn(state.receipts, idempotencyKey)) {
      const prior = state.receipts[idempotencyKey];
      return prior.signature === signature
        ? copy(prior.result)
        : result(false, "KEY_REUSED");
    }
    const registry = {
      "task-fields": () => validateFields(model.task.form.fields, input),
      "meter-order": () => {
        try {
          return fixed(input.meterEnd, 3) > fixed(caseData.meterStart, 3)
            ? []
            : [
                {
                  field: "meterEnd",
                  message:
                    "Corrected reading must exceed the accepted start reading",
                },
              ];
        } catch (e) {
          return [{ field: "meterEnd", message: e.message }];
        }
      },
      "evidence-match": () => {
        if (input.evidenceReference !== caseData.evidenceReference) return [{ field: "evidenceReference", message: "No verified synthetic evidence matches this reference" }];
        try {
          if (fixed(input.meterEnd, 3) !== fixed(caseData.proposedMeterEnd, 3)) return [{ field: "meterEnd", message: "The reading does not match the referenced synthetic evidence" }];
        } catch { return [{ field: "meterEnd", message: "Invalid evidence reading" }]; }
        return [];
      },
      "task-scope": () =>
        state.status === "open" ? [] : [{ message: "Task is no longer open" }],
      "expected-revision": () =>
        expectedRevision === state.revision
          ? []
          : [{ message: "Stale task revision" }],
    };
    const violations = evaluateRules(command.requiredRules, registry, {
      input,
    });
    if (violations.length) return result(false, "REJECTED", violations);
    const rating = rateReading(input.meterEnd, caseData),
      original = rateReading(caseData.originalMeterEnd, caseData);
    const runtime = createCorrectionWorkflowRuntime({
      activityOverrides: {
        async reconcileMeterUsage() {
          return {
            originalEnergyKwh: Number(original.energyKwh),
            correctedEnergyKwh: Number(rating.energyKwh),
            energyDeltaKwh:
              Number(formatFixed(fixed(original.energyKwh, 3) - fixed(rating.energyKwh, 3), 3)),
          };
        },
        async calculateCorrectedRating() {
          return {
            correctedEnergyKwh: rating.energyKwh,
            currency: "EUR",
            grossEur: rating.amountEur,
            grossDeltaEur:
              Number(formatFixed(fixed(original.amountEur, 2) - fixed(rating.amountEur, 2), 2)),
            ratingVersion: rating.calculationVersion,
          };
        },
      },
    });
    const actor = runtime.createActor(pkg.flow, {
      context: {
        sessionId: caseData.sessionId,
        originalCdrId: caseData.cdrId,
        originalEnergyKwh: Number(original.energyKwh),
        originalGrossEur: Number(original.amountEur),
        unitPriceEur: caseData.tariffEurPerKwh,
        fixedFeeEur: 0,
        billingInputsComplete: true,
        approvalThresholdKwh: pkg.flow.initialContext.approvalThresholdKwh,
        approvalTimeoutMs: 3600000,
      },
    });
    actor.start();
    try {
      actor.send({
        type: "meter.corrected",
        evidence: {
          id: input.evidenceReference,
          signatureValid: caseData.evidence?.signatureValid === true,
          sameRegisterEpoch: caseData.evidence?.sameRegisterEpoch === true,
          correctedEnergyKwh: rating.energyKwh,
          receivedAt: clock(),
        },
      });
      actor.send({ type: "evidence.validate" });
      let s = await settle(actor, pkg.flow);
      if (s.value === "awaitingApproval" && pauseForApproval) {
        const recordedAt = clock();
        const at = Date.parse(recordedAt);
        if (!Number.isFinite(at)) throw Error("Invalid virtual clock");
        state = {
          ...state, revision: state.revision + 1, values: copy(input),
          status: "awaitingApproval", currentStage: "review", outcome: null,
          approvalDueAt: new Date(at + s.context.approvalTimeoutMs).toISOString(),
          actor: actor.getPersistedSnapshot(),
          history: [...state.history, { revision: state.revision + 1, recordedAt, input: copy(input), rating, original, flowState: s.value }],
        };
        const accepted = result(true, "AWAITING_APPROVAL");
        state.receipts = { ...state.receipts, [idempotencyKey]: { signature, result: copy(accepted) } };
        return accepted;
      }
      if (s.value === "awaitingApproval") {
        actor.send({
          type: "approval.granted",
          taskSubmission: {
            taskId: model.task.id,
            values: input,
            role: principal.role,
          },
        });
        s = await settle(actor, pkg.flow);
      }
      if (
        s.status !== "done" ||
        !["completed", "completedNoChange"].includes(s.value)
      )
        return result(false, "WORKFLOW_REJECTED", [
          { ruleId: "workflow", message: `Workflow stopped at ${s.value}` },
        ]);
      state = {
        ...state,
        revision: state.revision + 1,
        values: copy(input),
        status: "completed",
        currentStage: "adjustment",
        outcome: {
          type: s.value === "completedNoChange" ? "correction.noChange" : "correction.accepted",
          amount: rating.amountEur,
          correctionId: s.context.correctedCdr?.id ?? caseData.cdrId,
          energyKwh: rating.energyKwh,
          calculationVersion: rating.calculationVersion,
        },
        actor: actor.getPersistedSnapshot(),
        history: [
          ...state.history,
          {
            revision: state.revision + 1,
            recordedAt: clock(),
            input: copy(input),
            rating,
            original,
            flowState: s.value,
          },
        ],
      };
      const accepted = result(true, "ACCEPTED");
      state.receipts = {
        ...state.receipts,
        [idempotencyKey]: { signature, result: copy(accepted) },
      };
      return accepted;
    } finally {
      actor.stop();
    }
  }
  async function decide({ outcome, note, expectedRevision, idempotencyKey }, advanceToDeadline = false) {
    if (principal.role !== "BillingApprover") return result(false, "FORBIDDEN");
    if (typeof idempotencyKey !== "string" || !idempotencyKey.trim() || idempotencyKey.length > 120) return result(false, "INVALID_KEY");
    const signature = identity({ operation: advanceToDeadline ? "expire" : "decision", outcome, note, expectedRevision });
    if (Object.hasOwn(state.receipts, idempotencyKey)) {
      const prior = state.receipts[idempotencyKey];
      return prior.signature === signature ? copy(prior.result) : result(false, "KEY_REUSED");
    }
    if (expectedRevision !== state.revision) return result(false, "STALE_REVISION");
    if (state.status !== "awaitingApproval") return result(false, "TASK_NOT_OPEN");
    if (!["approve", "reject"].includes(outcome) || typeof note !== "string" || note.trim().length < 20 || note.length > 500) return result(false, "REJECTED", [{ field: "note", message: "Select an outcome and provide a decision note of 20–500 characters." }]);
    const now = advanceToDeadline ? state.approvalDueAt : clock();
    if (!Number.isFinite(Date.parse(now))) throw Error("Invalid virtual clock");
    const expired = Date.parse(now) >= Date.parse(state.approvalDueAt);
    const runtime = createCorrectionWorkflowRuntime();
    const actor = runtime.createActor(pkg.flow, { snapshot: state.actor });
    actor.start();
    try {
      actor.send(expired ? { type: "timer.expired" } : { type: outcome === "approve" ? "approval.granted" : "approval.rejected", taskSubmission: { taskId: model.additionalTasks[0].id, role: principal.role, note, outcome } });
      const s = await settle(actor, pkg.flow);
      if (expired || outcome === "reject") {
        if (s.value !== (expired ? "manualReview" : "declined")) return result(false, "WORKFLOW_REJECTED");
        state = { ...state, revision: state.revision + 1, status: expired ? "expired" : "declined", currentStage: "review", actor: actor.getPersistedSnapshot(), outcome: { type: expired ? "approval.expired" : "correction.declined", note: expired ? null : note }, history: [...state.history, { revision: state.revision + 1, recordedAt: now, input: copy(state.values), flowState: s.value, decision: { outcome: expired ? "expired" : outcome, note: expired ? null : note } }] };
        const accepted = result(true, expired ? "APPROVAL_EXPIRED" : "DECLINED");
        state.receipts = { ...state.receipts, [idempotencyKey]: { signature, result: copy(accepted) } };
        return accepted;
      }
      if (s.status !== "done" || s.value !== "completed") return result(false, "WORKFLOW_REJECTED");
      const rating = rateReading(state.values.meterEnd, caseData);
      state = { ...state, revision: state.revision + 1, status: "completed", currentStage: "adjustment", actor: actor.getPersistedSnapshot(), outcome: { type: "correction.accepted", amount: rating.amountEur, correctionId: s.context.correctedCdr?.id ?? caseData.cdrId, energyKwh: rating.energyKwh, calculationVersion: rating.calculationVersion }, history: [...state.history, { revision: state.revision + 1, recordedAt: now, input: copy(state.values), rating, original: rateReading(caseData.originalMeterEnd, caseData), flowState: s.value, decision: { outcome, note } }] };
      const accepted = result(true, "ACCEPTED");
      state.receipts = { ...state.receipts, [idempotencyKey]: { signature, result: copy(accepted) } };
      return accepted;
    } finally { actor.stop(); }
  }
  function enqueue(fn) {
    pending++;
    const run = queue.then(async () => { busy = true; try { return await fn(); } finally { busy = false; pending--; } });
    queue = run.catch(() => {});
    return run;
  }
  return {
    task,
    prepare(args) { const submitted = copy(args); return enqueue(() => execute(submitted, true)); },
    decide(args) { const submitted = copy(args); return enqueue(() => decide(submitted)); },
    expireApproval({ expectedRevision, idempotencyKey }) {
      return enqueue(() => decide({ outcome: "approve", note: "Virtual deadline advanced for this demonstration.", expectedRevision, idempotencyKey }, true));
    },
    history: () => copy(state.history),
    isBusy: () => busy || pending > 0,
    export: () => {
      if (busy || pending > 0) throw Error("Unsettled workspace");
      return copy(state);
    },
    submit(args) {
      const submitted = copy(args);
      pending++;
      const run = queue.then(async () => {
        busy = true;
        try {
          return await execute(submitted);
        } finally {
          busy = false;
          pending--;
        }
      });
      queue = run.catch(() => {});
      return run;
    },
  };
}
