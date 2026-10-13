import { createWorkspace } from "../../../client-runtime/src/profiles/chargeweave/workspace.js";
import { runSimulation, SCENARIOS } from "../simulation/runtime.js";
export function chargeweaveAdapters(getPackage) {
  const cases = [
    ["correction.valid", "Accept verified correction"], ["correction.bad-evidence", "Reject mismatched evidence"],
    ["correction.reversed-meter", "Reject reversed reading"], ["correction.stale", "Reject stale revision"],
    ["correction.duplicate", "Replay command once"], ["correction.restore", "Restore a stable checkpoint"],
  ];
  return [{
    id: "chargeweave.correction", version: "1.0.0", scenarios: cases.map(([id, label]) => ({ id, label, clock: "configurable" })),
    async run({ scenarioId, seed, startAt }) {
      const pkg = getPackage();
      const w = createWorkspace({ applicationPackage: pkg, clock: () => startAt });
      const input = Object.fromEntries(pkg.task.task.form.fields.map(f => [f.id, f.defaultValue ?? ""]));
      input.operatorNote = "Signed partner evidence checked against the accepted register.";
      if (scenarioId === "correction.bad-evidence") input.evidenceReference = "EV-0000-0000";
      if (scenarioId === "correction.reversed-meter") input.meterEnd = "0";
      const args = { input, expectedRevision: scenarioId === "correction.stale" ? 99 : 0, idempotencyKey: `scenario-${seed}` };
      const result = await w.submit(args);
      const rejected = ["correction.bad-evidence", "correction.reversed-meter", "correction.stale"].includes(scenarioId);
      const assertions = [
        { id: "command-outcome", passed: result.accepted === !rejected, detail: result.code },
        { id: "atomic-effects", passed: w.history().length === (rejected ? 0 : 1), detail: `${w.history().length} committed correction(s)` },
      ];
      if (!rejected) assertions.push({ id: "exact-rating", passed: result.task.outcome.amount === "23.21", detail: result.task.outcome.amount });
      if (scenarioId === "correction.duplicate") assertions.push({ id: "idempotent-retry", passed: JSON.stringify(await w.submit(args)) === JSON.stringify(result) && w.history().length === 1, detail: "Repeated operation returns the original receipt" });
      const snapshot = w.export();
      if (scenarioId === "correction.restore") assertions.push({ id: "checkpoint-restore", passed: JSON.stringify(createWorkspace({ applicationPackage: pkg, snapshot }).task()) === JSON.stringify(w.task()), detail: "Task and actor restored through the pinned package" });
      return { assertions, output: { result, snapshot }, trace: w.history(), unsupported: pkg.capabilities.unsupported };
    },
  }, {
    id: "chargeweave.protocol", version: "1.0.0", scenarios: SCENARIOS.map(s => ({ id: `protocol.${s.id}`, label: s.label, clock: "fixed:2026-09-26T08:00:00.000Z" })),
    run({ scenarioId, seed }) {
      const r = runSimulation({ scenario: scenarioId.replace("protocol.", ""), seed });
      return { assertions: r.checks.map(c => ({ id: c.id, passed: c.passed, detail: c.detail })), output: r, trace: r.timeline, unsupported: ["live-protocols", "protocol-certification", "configurable-protocol-clock"] };
    },
  }];
}
