import profile from "../../../xflow/charge-correction.profile.json" with { type: "json" };
import { assign } from "xstate";
import { createFlowRuntime } from "./flow-engine.js";
import { round } from "./core.js";

function values(value) {
  return value === undefined ? [] : Array.isArray(value) ? value : [value];
}

function refName(value) {
  const raw = typeof value === "string" ? value : value?.["@id"];
  if (typeof raw !== "string") return "";
  if (raw.startsWith("#")) return raw.slice(1);
  if (raw.includes("#")) return raw.slice(raw.lastIndexOf("#") + 1);
  return raw.split(/[/:]/).filter(Boolean).at(-1) ?? raw;
}

function typeName(step) {
  const types = values(step["@type"]);
  const type = types.find((candidate) => typeof candidate === "string" && candidate.startsWith("xflow:"));
  return type?.slice("xflow:".length) ?? "";
}

function namedActions(actionRefs) {
  const names = values(actionRefs).map(refName).filter(Boolean);
  return names.length === 0 ? undefined : names.length === 1 ? names[0] : names;
}

function transitionFrom(node) {
  return {
    target: refName(node.targetStep),
    ...(node.actionRef === undefined ? {} : { actions: namedActions(node.actionRef) }),
  };
}

export function normaliseWorkflowProfile(jsonLd) {
  const graph = jsonLd?.["@graph"];
  if (!Array.isArray(graph)) throw new Error("XFlow profile must contain a JSON-LD @graph.");
  const root = graph.find((node) => values(node["@type"]).includes("xflow:WorkflowDefinition"));
  if (!root) throw new Error("XFlow profile is missing xflow:WorkflowDefinition.");
  const stepIndex = new Map(graph.filter((node) => node.stepKey).map((node) => [refName(node["@id"]), node]));
  const referencedSteps = values(root.hasStep).map(refName);
  const steps = referencedSteps.map((stepId) => {
    const source = stepIndex.get(stepId);
    if (!source) return { id: stepId, kind: "missing" };
    const common = {
      id: refName(source["@id"]),
      kind: ({ EventWait: "eventWait", ServiceTask: "serviceTask", Decision: "decision", HumanTask: "humanTask", EndStep: "end" })[typeName(source)] ?? "unknown",
      label: source.label,
      description: source.description,
      ...(source.domainBinding === undefined ? {} : { domainBindings: values(source.domainBinding).map(refName) }),
    };
    if (common.kind === "eventWait" || common.kind === "humanTask") {
      common.on = Object.fromEntries(values(source.onEvent).map((eventTransition) => [eventTransition.eventType, transitionFrom(eventTransition)]));
    }
    if (common.kind === "serviceTask") {
      common.activity = refName(source.activityRef);
      common.onDone = transitionFrom(source.onSuccess ?? {});
      common.onError = transitionFrom(source.onFailure ?? {});
    }
    if (common.kind === "decision") {
      common.routes = values(source.route)
        .sort((left, right) => Number(left.priority ?? 0) - Number(right.priority ?? 0))
        .map((route) => ({ guard: refName(route.guardRef), target: refName(route.targetStep) }));
      common.defaultTarget = refName(source.defaultTarget);
    }
    if (source.timeoutAfter !== undefined) {
      common.timeout = {
        after: refName(source.timeoutAfter),
        target: refName(source.timeoutTarget),
        ...(source.timeoutAction === undefined ? {} : { actions: namedActions(source.timeoutAction) }),
      };
    }
    if (source.assigneeRole !== undefined) common.assigneeRole = refName(source.assigneeRole);
    return common;
  });

  const jsonContext = root.initialContext?.["@value"] ?? {};
  return {
    id: root.workflowId,
    version: root.workflowVersion,
    processKind: refName(root.processKind),
    journeyReferences: values(root.journeyReference),
    processRecords: {
      execution: refName(root.executionRecordClass),
      step: refName(root.stepRecordClass),
      transition: refName(root.transitionRecordClass),
    },
    ontologyBindings: values(root.domainBinding).map(refName),
    initialStep: refName(root.initialStep),
    initialContext: jsonContext,
    steps,
  };
}

export const correctionWorkflowDefinition = normaliseWorkflowProfile(profile);

export function createCorrectionWorkflowRuntime() {
  const idempotentCredits = new Map();
  const idempotentRecords = new Map();
  return createFlowRuntime({
    activities: {
      async verifySignedEvidence({ context }) {
        const evidence = context.meterEvidence;
        if (!evidence?.signatureValid) throw new Error("Meter evidence signature is invalid.");
        if (!evidence?.sameRegisterEpoch) throw new Error("Meter readings cross a reset or replacement boundary.");
        if (!Number.isFinite(Number(evidence.correctedEnergyKwh))) throw new Error("Corrected usage is missing.");
        return { verified: true, evidenceId: evidence.id, verifiedAt: evidence.receivedAt };
      },
      async reconcileMeterUsage({ context }) {
        const correctedEnergyKwh = round(Number(context.meterEvidence.correctedEnergyKwh), 3);
        const energyDeltaKwh = round(context.originalEnergyKwh - correctedEnergyKwh, 3);
        return { originalEnergyKwh: context.originalEnergyKwh, correctedEnergyKwh, energyDeltaKwh };
      },
      async assessBillingReadiness({ context }) {
        const ready = Boolean(context.billingInputsComplete || context.additionalEvidence);
        return {
          ready,
          blockers: ready ? [] : ["tax and commercial responsibility evidence"],
          assessedAt: context.meterEvidence?.receivedAt ?? "2026-09-27T00:00:00.000Z",
        };
      },
      async calculateCorrectedRating({ context }) {
        const grossEur = round(context.reconciliation.correctedEnergyKwh * context.unitPriceEur + context.fixedFeeEur, 2);
        const grossDeltaEur = round(context.originalGrossEur - grossEur, 2);
        return {
          correctedEnergyKwh: context.reconciliation.correctedEnergyKwh,
          currency: "EUR",
          grossEur,
          grossDeltaEur,
          ratingVersion: "demo-tariff-v1",
        };
      },
      async issueCreditOnce({ context }) {
        const idempotencyKey = `credit:${context.originalCdrId}`;
        if (!idempotentCredits.has(idempotencyKey)) {
          idempotentCredits.set(idempotencyKey, {
            id: `CREDIT-${context.originalCdrId}`,
            idempotencyKey,
            originalCdrId: context.originalCdrId,
            amountEur: -Math.abs(context.originalGrossEur),
            currency: "EUR",
          });
        }
        return idempotentCredits.get(idempotencyKey);
      },
      async issueCorrectedCdr({ context }) {
        const idempotencyKey = `corrected-cdr:${context.originalCdrId}:${context.rating.ratingVersion}`;
        if (!idempotentRecords.has(idempotencyKey)) {
          idempotentRecords.set(idempotencyKey, {
            id: `CDR-${context.originalCdrId}-R1`,
            idempotencyKey,
            correctionOf: context.originalCdrId,
            creditId: context.credit.id,
            energyKwh: context.rating.correctedEnergyKwh,
            grossEur: context.rating.grossEur,
            currency: "EUR",
          });
        }
        return idempotentRecords.get(idempotencyKey);
      },
      async propagateCorrection({ context }) {
        return {
          correctedCdrId: context.correctedCdr.id,
          recipients: ["invoice ledger", "roaming partner"],
          deliveryState: "queued",
        };
      },
    },
    guards: {
      billingReady: ({ context }) => Boolean(context.readiness?.ready),
      noMaterialChange: ({ context }) => Math.abs(context.rating?.grossDeltaEur ?? 0) < 0.01,
      approvalRequired: ({ context }) => Math.abs(context.reconciliation?.energyDeltaKwh ?? 0) >= context.approvalThresholdKwh,
    },
    delays: {
      approvalDeadline: ({ context }) => context.approvalTimeoutMs,
    },
    actions: {
      captureEvidence: assign(({ event }) => ({ meterEvidence: event.evidence })),
      captureVerification: assign(({ event }) => ({ verification: event.output })),
      captureReconciliation: assign(({ event }) => ({ reconciliation: event.output })),
      captureReadiness: assign(({ event }) => ({ readiness: event.output })),
      captureAdditionalEvidence: assign(({ event }) => ({ additionalEvidence: event.evidence, billingInputsComplete: true })),
      captureRating: assign(({ event }) => ({ rating: event.output })),
      captureApproval: assign(({ event }) => ({ approval: event.approval ?? event })),
      captureCredit: assign(({ event }) => ({ credit: event.output })),
      captureCorrectedCdr: assign(({ event }) => ({ correctedCdr: event.output })),
      captureFailure: assign(({ event }) => ({ lastFailure: String(event.error?.message ?? event.error ?? "Workflow activity failed.") })),
      captureTimeout: assign(() => ({ approvalEscalated: true })),
    },
  });
}

export const correctionWorkflowRuntime = createCorrectionWorkflowRuntime();
