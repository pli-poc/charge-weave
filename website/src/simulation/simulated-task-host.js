import { validateTaskSubmission, valuesForTaskOutcome } from "../task-forms/engine.js";

function pathValue(value, path) {
  return String(path ?? "").split(".").filter(Boolean).reduce((current, key) => current?.[key], value);
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}

/** Browser-only adapter for exercising task contracts against an XState actor. */
export function createSimulatedTaskHost({ form, actor, getTaskRevision = () => 1, now = () => new Date().toISOString() }) {
  const receipts = new Map();
  return {
    submit({ eventType, values, principal, expectedRevision, idempotencyKey }) {
      if (typeof idempotencyKey !== "string" || !idempotencyKey.trim()) return { ok: false, code: "idempotency-required", errors: ["A submission key is required."] };
      if (!principal || !Array.isArray(principal.roles) || !principal.roles.includes(form.role)) return { ok: false, code: "forbidden", errors: ["Your assigned role cannot complete this task."] };
      const fingerprint = JSON.stringify(canonicalize({ eventType, values, expectedRevision, actorId: principal.id }));
      if (receipts.has(idempotencyKey)) {
        const prior = receipts.get(idempotencyKey);
        return prior.fingerprint === fingerprint
          ? { ...prior.receipt, duplicate: true }
          : { ok: false, code: "idempotency-conflict", errors: ["This submission key was already used for different task inputs."] };
      }
      const snapshot = actor.getSnapshot();
      if (snapshot.value !== form.stepId || snapshot.status !== "active") return { ok: false, code: "task-not-open", errors: ["This task is no longer open."] };
      if (expectedRevision !== getTaskRevision()) return { ok: false, code: "stale-task", errors: ["This task changed. Refresh the task before submitting again."] };
      const errors = validateTaskSubmission({ form, eventType, values, context: snapshot.context });
      if (errors.length) return { ok: false, code: "invalid", errors };
      const audit = {
        taskId: form.id,
        taskVersion: form.version,
        workflowId: form.workflowId,
        workflowVersion: form.workflowVersion,
        stepId: form.stepId,
        correlationId: form.correlationPath ? pathValue(snapshot.context, form.correlationPath) ?? null : null,
        outcome: eventType,
        actorId: principal.id,
        expectedRevision,
        idempotencyKey,
        submittedAt: now(),
        values: valuesForTaskOutcome(form, eventType, values ?? {}),
      };
      actor.send({ type: eventType, taskSubmission: audit });
      const receipt = { ok: true, code: "accepted", eventType, audit, duplicate: false };
      receipts.set(idempotencyKey, { fingerprint, receipt });
      return receipt;
    },
  };
}
