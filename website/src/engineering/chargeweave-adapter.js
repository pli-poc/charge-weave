import { createWorkspace } from "../../../client-runtime/src/profiles/chargeweave/workspace.js";
import { createApplicationHost } from "../../../client-runtime/src/application/host.js";
import { createChargeweaveHostWorkspace } from "../../../client-runtime/src/profiles/chargeweave/host.js";
import { runSimulation, SCENARIOS } from "../simulation/runtime.js";
export function chargeweaveAdapters(getPackage) {
  const cases = [
    ["correction.valid", "Accept verified correction"], ["correction.bad-evidence", "Reject mismatched evidence"],
    ["correction.reversed-meter", "Reject reversed reading"], ["correction.stale", "Reject stale revision"],
    ["correction.duplicate", "Replay command once"], ["correction.restore", "Restore a stable checkpoint"],
    ["correction.missing-billing", "Resume after billing evidence"], ["correction.invalid-signature", "Reject invalid synthetic signature"], ["correction.wrong-epoch", "Reject a register epoch mismatch"],
    ["correction.no-change", "Close without a financial change"], ["correction.below-threshold", "Correct below the approval threshold"],
    ["correction.approval-restore", "Restore and approve a waiting correction"], ["correction.approval-reject", "Reject a waiting correction"], ["correction.approval-expiry", "Expire a waiting correction"],
  ];
  return [{
    id: "chargeweave.correction", version: "1.0.0", scenarios: cases.map(([id, label]) => ({ id, label, clock: "configurable" })),
    async run({ scenarioId, seed, startAt }) {
      const pkg = getPackage();
      const host = createApplicationHost({ applicationPackage: pkg, factory: createChargeweaveHostWorkspace, options: { clock: () => startAt } });
      const w = host.workspace;
      const input = Object.fromEntries(pkg.task.task.form.fields.map(f => [f.id, f.defaultValue ?? ""]));
      input.operatorNote = "Signed partner evidence checked against the accepted register.";
      if (scenarioId === "correction.bad-evidence") input.evidenceReference = "EV-0000-0000";
      if (scenarioId === "correction.reversed-meter") input.meterEnd = "0";
      const args = { input, expectedRevision: scenarioId === "correction.stale" ? 99 : 0, idempotencyKey: `scenario-${seed}` };
      if (["correction.missing-billing", "correction.invalid-signature", "correction.wrong-epoch"].includes(scenarioId)) {
        const custom = structuredClone(pkg);
        if (scenarioId === "correction.missing-billing") custom.task.case.billingInputsComplete = false;
        if (scenarioId === "correction.invalid-signature") custom.task.case.evidence.signatureValid = false;
        if (scenarioId === "correction.wrong-epoch") custom.task.case.evidence.sameRegisterEpoch = false;
        let workspace = createWorkspace({ applicationPackage: custom, clock: () => startAt });
        const prepared = await workspace.prepare(args), before = workspace.export();
        if (scenarioId !== "correction.missing-billing") return { assertions: [
          { id: "rejected-evidence", passed: !prepared.accepted && prepared.code === "WORKFLOW_REJECTED", detail: prepared.code },
          { id: "no-financial-effects", passed: before.revision === 0 && !before.actor, detail: "No rating or correction committed" },
        ], output: { prepared, snapshot: before }, trace: workspace.history(), unsupported: pkg.capabilities.unsupported };
        workspace = createWorkspace({ applicationPackage: custom, snapshot: before, clock: () => startAt });
        const resumed = await workspace.supplyEvidence({ evidence: "TAX-EVIDENCE-001", expectedRevision: 1, idempotencyKey: `supply-${seed}` });
        return { assertions: [
          { id: "billing-wait", passed: prepared.code === "WAITING_BILLING_EVIDENCE" && !before.actor.context.rating && !before.actor.context.credit, detail: "No rating before billing evidence" },
          { id: "resumed-instance", passed: resumed.code === "AWAITING_APPROVAL" && resumed.task.flowState === "awaitingApproval", detail: "Restored instance resumes to approval" },
          { id: "exact-rating", passed: workspace.export().actor.context.rating?.grossEur === "2.91", detail: "Pinned expected amount EUR 2.91" },
        ], output: { prepared, resumed, snapshot: workspace.export() }, trace: workspace.history(), unsupported: pkg.capabilities.unsupported };
      }
      if (["correction.no-change", "correction.below-threshold"].includes(scenarioId)) {
        const custom = structuredClone(pkg);
        const unchanged = scenarioId === "correction.no-change";
        custom.task.case.proposedMeterEnd = unchanged ? 12851.100 : 12851.070;
        const scenarioInput = { ...input, meterEnd: unchanged ? "12851.100" : "12851.070" };
        const workspace = createWorkspace({ applicationPackage: custom, clock: () => startAt });
        const result = await workspace.prepare({ ...args, input: scenarioInput });
        const snapshot = workspace.export();
        const expectedState = unchanged ? "completedNoChange" : "completed";
        return { assertions: [
          { id: "configured-route", passed: result.accepted && result.task.flowState === expectedState, detail: result.task.flowState },
          { id: "no-approval-task", passed: result.task.status === "completed", detail: "The guard does not create an approval wait" },
          { id: "exact-effects", passed: unchanged ? result.task.outcome.type === "correction.noChange" && !snapshot.actor.context.credit : result.task.outcome.amount === "3.38" && snapshot.actor.context.credit?.amountEur === -3.39, detail: "Independent original EUR 3.39 and replacement EUR 3.38; no credit for unchanged rating" },
        ], output: { result, snapshot }, trace: workspace.history(), unsupported: pkg.capabilities.unsupported };
      }
      if (scenarioId.startsWith("correction.approval-")) {
        let now = startAt;
        let actor = createWorkspace({ applicationPackage: pkg, clock: () => now });
        const prepared = await actor.prepare(args);
        const waiting = actor.export();
        actor = createWorkspace({ applicationPackage: pkg, snapshot: waiting, clock: () => now });
        if (scenarioId === "correction.approval-expiry") now = new Date(Date.parse(startAt) + 3600000).toISOString();
        const decision = { outcome: scenarioId === "correction.approval-reject" ? "reject" : "approve", note: "Evidence and the proposed amount reviewed carefully.", expectedRevision: 1, idempotencyKey: `decision-${seed}` };
        const result = await actor.decide(decision);
        const expected = scenarioId === "correction.approval-restore" ? "ACCEPTED" : scenarioId === "correction.approval-reject" ? "DECLINED" : "APPROVAL_EXPIRED";
        const snapshot = actor.export();
        return { assertions: [
          { id: "waiting-restore", passed: prepared.code === "AWAITING_APPROVAL" && waiting.actor.value === "awaitingApproval", detail: "Persisted approval actor" },
          { id: "decision-outcome", passed: result.code === expected, detail: result.code },
          { id: "financial-effects", passed: expected === "ACCEPTED" ? result.task.outcome.amount === "2.91" && snapshot.actor.context.credit?.amountEur === -3.39 : !snapshot.actor.context.credit, detail: "Pinned independent EUR 3.39 original and EUR 2.91 replacement; no effects on rejection or expiry" },
          { id: "decision-idempotency", passed: JSON.stringify(await actor.decide(decision)) === JSON.stringify(result), detail: "Repeated decision returns the same receipt" },
        ], output: { result, snapshot }, trace: actor.history(), unsupported: pkg.capabilities.unsupported };
      }
      const gql = await host.execute({ query: "mutation($input:CorrectionInput!,$revision:Int!,$key:String!){submitCorrection(input:$input,expectedRevision:$revision,idempotencyKey:$key){accepted code revision violations{ruleId field message} task{id revision status stage descriptor values outcome flowState}}}", variables: { input, revision: args.expectedRevision, key: args.idempotencyKey } });
      if (gql.errors) throw Error(gql.errors.map(e => e.message).join("; "));
      const result = gql.data.submitCorrection;
      const rejected = ["correction.bad-evidence", "correction.reversed-meter", "correction.stale"].includes(scenarioId);
      const assertions = [
        { id: "command-outcome", passed: result.accepted === !rejected, detail: result.code },
        { id: "atomic-effects", passed: w.history().length === (rejected ? 0 : 1), detail: `${w.history().length} committed correction(s)` },
      ];
      if (!rejected) assertions.push({ id: "exact-rating", passed: result.task.outcome.amount === "2.91", detail: result.task.outcome.amount });
      if (scenarioId === "correction.duplicate") assertions.push({ id: "idempotent-retry", passed: (await w.submit(args)).revision === result.revision && w.history().length === 1, detail: "Repeated operation returns the original receipt" });
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
