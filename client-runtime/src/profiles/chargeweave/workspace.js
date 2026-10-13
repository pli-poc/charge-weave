import { createCorrectionWorkflowRuntime } from "./correction-workflow.js";
import { fixed } from "../../services/decimal.js";
import { rateReading } from "./rating.js";
import { evaluateRules, validateFields } from "../../services/validation.js";
const copy = (v) => JSON.parse(JSON.stringify(v));
const identity = (v) =>
  JSON.stringify(Object.fromEntries(Object.entries(v).sort()));
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
      if (
        state.status !== "completed" ||
        state.actor?.status !== "done" ||
        !["completed", "completedNoChange"].includes(state.actor?.value) ||
        last.revision !== state.revision ||
        JSON.stringify(last.input) !== JSON.stringify(state.values) ||
        expected.amountEur !== state.outcome?.amount
      )
        throw Error("Incoherent business/process checkpoint");
      const restored = createCorrectionWorkflowRuntime().createActor(pkg.flow, {
        snapshot: state.actor,
      });
      restored.start();
      if (restored.getSnapshot().status !== "done")
        throw Error("Unstable restored process");
      restored.stop();
    }
  }
  let queue = Promise.resolve();
  let busy = false;
  let pending = 0;
  const task = () => ({
    id: model.task.id,
    revision: state.revision,
    status: state.status,
    stage: state.currentStage,
    descriptor: model.task,
    values: copy(state.values),
    outcome: state.outcome,
    flowState: state.actor?.value ?? pkg.flow.initialStep,
  });
  const result = (accepted, code, violations = []) => ({
    accepted,
    code,
    violations,
    revision: state.revision,
    task: task(),
  });
  async function execute({ input, expectedRevision, idempotencyKey }) {
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
    const signature = identity({ input, expectedRevision });
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
      "evidence-match": () =>
        input.evidenceReference === caseData.evidenceReference
          ? []
          : [
              {
                field: "evidenceReference",
                message:
                  "No verified synthetic evidence matches this reference",
              },
            ],
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
              Number(original.energyKwh) - Number(rating.energyKwh),
          };
        },
        async calculateCorrectedRating() {
          return {
            correctedEnergyKwh: rating.energyKwh,
            currency: "EUR",
            grossEur: rating.amountEur,
            grossDeltaEur:
              Number(original.amountEur) - Number(rating.amountEur),
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
        approvalThresholdKwh: 0,
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
          type: "correction.accepted",
          amount: rating.amountEur,
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
  return {
    task,
    history: () => copy(state.history),
    isBusy: () => busy || pending > 0,
    export: () => {
      if (busy || pending > 0) throw Error("Unsettled workspace");
      return copy(state);
    },
    submit(args) {
      pending++;
      const run = queue.then(async () => {
        busy = true;
        try {
          return await execute(args);
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
