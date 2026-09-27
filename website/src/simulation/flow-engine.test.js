import test from "node:test";
import assert from "node:assert/strict";
import { assign } from "xstate";
import { createFlowRuntime, validateWorkflowDefinition } from "./flow-engine.js";
import { correctionWorkflowDefinition, correctionWorkflowRuntime } from "./correction-workflow.js";

function waitFor(actor, predicate, timeoutMs = 1500) {
  const current = actor.getSnapshot();
  if (predicate(current)) return Promise.resolve(current);
  return new Promise((resolve, reject) => {
    let subscription;
    const timeout = setTimeout(() => {
      subscription?.unsubscribe();
      reject(new Error("Timed out waiting for the workflow state."));
    }, timeoutMs);
    subscription = actor.subscribe((snapshot) => {
      if (!predicate(snapshot)) return;
      clearTimeout(timeout);
      subscription?.unsubscribe();
      resolve(snapshot);
    });
    if (predicate(actor.getSnapshot())) {
      clearTimeout(timeout);
      subscription.unsubscribe();
      resolve(actor.getSnapshot());
    }
  });
}

function makeClock() {
  let now = 0;
  let nextId = 0;
  const tasks = new Map();
  return {
    setTimeout(callback, delay) {
      const id = ++nextId;
      tasks.set(id, { callback, at: now + Number(delay) });
      return id;
    },
    clearTimeout(id) { tasks.delete(id); },
    advanceBy(ms) {
      const end = now + ms;
      while (true) {
        const next = [...tasks.entries()].sort((a, b) => a[1].at - b[1].at)[0];
        if (!next || next[1].at > end) break;
        now = next[1].at;
        tasks.delete(next[0]);
        next[1].callback();
      }
      now = end;
    },
  };
}

const doubleValueDefinition = {
  id: "test.double-value",
  version: "1.0.0",
  initialStep: "waiting",
  steps: [
    { id: "waiting", kind: "eventWait", on: { "value.received": { target: "running", actions: "captureValue" } } },
    {
      id: "running", kind: "serviceTask", activity: "doubleValue",
      onDone: { target: "completed", actions: "captureResult" },
      onError: { target: "failed", actions: "captureFailure" },
    },
    { id: "completed", kind: "end" },
    { id: "failed", kind: "end" },
  ],
};

function makeTestRuntime() {
  return createFlowRuntime({
    activities: { async doubleValue({ context }) { return { result: context.value * 2 }; } },
    actions: {
      captureValue: assign(({ event }) => ({ value: event.value })),
      captureResult: assign(({ event }) => ({ result: event.output.result })),
      captureFailure: assign(({ event }) => ({ failure: String(event.error) })),
    },
  });
}

test("serializable XFlow steps compile to an XState actor with registered activities", async () => {
  const runtime = makeTestRuntime();
  const actor = runtime.createActor(doubleValueDefinition);
  actor.start();
  actor.send({ type: "value.received", value: 21 });
  const finished = await waitFor(actor, (snapshot) => snapshot.matches("completed"));
  assert.equal(finished.context.result, 42);
  actor.stop();
});

test("a waiting actor snapshot restores and resumes from its pinned workflow definition", async () => {
  const runtime = makeTestRuntime();
  const firstActor = runtime.createActor(doubleValueDefinition).start();
  const checkpoint = JSON.parse(JSON.stringify(firstActor.getPersistedSnapshot()));
  firstActor.stop();
  const resumed = runtime.createActor(doubleValueDefinition, { snapshot: checkpoint }).start();
  resumed.send({ type: "value.received", value: 9 });
  const finished = await waitFor(resumed, (snapshot) => snapshot.matches("completed"));
  assert.equal(finished.context.result, 18);
  resumed.stop();
});

test("a configured human-task deadline is delivered as its declared host event", async () => {
  const definition = {
    id: "test.human-task-deadline", version: "1.0.0", initialStep: "approval",
    initialContext: { timeoutMs: 5000 },
    steps: [
      {
        id: "approval", kind: "humanTask",
        on: {
          approved: { target: "done" },
          "deadline.expired": { target: "escalated" },
        },
        timeout: { after: "approvalDeadline", event: "deadline.expired", target: "escalated" },
      },
      { id: "done", kind: "end" },
      { id: "escalated", kind: "end" },
    ],
  };
  const runtime = createFlowRuntime({ delays: { approvalDeadline: ({ context }) => context.timeoutMs } });
  const clock = makeClock();
  const actor = runtime.createActor(definition, { clock }).start();
  const delay = runtime.resolveDelay("approvalDeadline", actor.getSnapshot().context);
  clock.advanceBy(delay - 1);
  assert.equal(actor.getSnapshot().value, "approval");
  clock.advanceBy(1);
  assert.equal(actor.getSnapshot().value, "approval", "the host decides when to deliver a deadline event");
  actor.send({ type: definition.steps[0].timeout.event });
  await waitFor(actor, (snapshot) => snapshot.matches("escalated"));
  actor.stop();
});

test("the correction profile preserves its domain bindings and executes credit lineage", async () => {
  assert.deepEqual(correctionWorkflowRuntime.validate(correctionWorkflowDefinition), []);
  assert.deepEqual(correctionWorkflowDefinition.journeyReferences, ["J07", "J08"]);
  assert.deepEqual(correctionWorkflowDefinition.processRecords, {
    execution: "ProcessExecution", step: "ProcessStep", transition: "StateTransition",
  });
  assert.ok(correctionWorkflowDefinition.ontologyBindings.includes("RecordCorrection"));
  assert.deepEqual(
    correctionWorkflowDefinition.steps.find((step) => step.id === "awaitingApproval").taskFormProfile,
    { id: "chargeweave.correction-approval", version: "1.0.0" },
  );
  assert.deepEqual(correctionWorkflowDefinition.steps.find((step) => step.id === "awaitingApproval").timeout, {
    after: "approvalDeadline", event: "timer.expired", target: "manualReview",
  });
  assert.equal(
    correctionWorkflowDefinition.steps.find((step) => step.id === "awaitingApproval").on["timer.expired"].actions,
    "captureTimeout",
  );

  const actor = correctionWorkflowRuntime.createActor(correctionWorkflowDefinition).start();
  actor.send({
    type: "meter.corrected",
    evidence: {
      id: "METER-EVIDENCE-01", signatureValid: true, sameRegisterEpoch: true,
      correctedEnergyKwh: 10, receivedAt: "2026-09-27T00:00:00.000Z",
    },
  });
  assert.equal(actor.getSnapshot().value, "evidenceReceived");
  actor.send({ type: "evidence.validate" });
  await waitFor(actor, (snapshot) => snapshot.matches("awaitingApproval"));
  actor.send({ type: "approval.granted", approval: { by: "billing-operator" } });
  const completed = await waitFor(actor, (snapshot) => snapshot.matches("completed"));
  assert.equal(completed.context.credit.amountEur, -3.39);
  assert.equal(completed.context.correctedCdr.grossEur, 3.2);
  assert.equal(completed.context.correctedCdr.correctionOf, "CDR-DEMO-1042");
  actor.stop();
});

test("incomplete billing evidence blocks rating until a supplemental event arrives", async () => {
  const actor = correctionWorkflowRuntime.createActor(correctionWorkflowDefinition, {
    context: { billingInputsComplete: false },
  }).start();
  actor.send({ type: "meter.corrected", evidence: { id: "E-02", signatureValid: true, sameRegisterEpoch: true, correctedEnergyKwh: 10 } });
  actor.send({ type: "evidence.validate" });
  await waitFor(actor, (snapshot) => snapshot.matches("awaitingAdditionalEvidence"));
  assert.equal(actor.getSnapshot().context.rating, undefined);
  actor.send({ type: "evidence.supplemented", evidence: { id: "TAX-COMMERCIAL-EVIDENCE-02" } });
  await waitFor(actor, (snapshot) => snapshot.matches("awaitingApproval"));
  assert.equal(actor.getSnapshot().context.readiness.ready, true);
  actor.stop();
});

test("the long-wait approval state restores from a serialized checkpoint and resumes", async () => {
  const clock = makeClock();
  const actor = correctionWorkflowRuntime.createActor(correctionWorkflowDefinition, { clock }).start();
  actor.send({ type: "meter.corrected", evidence: { id: "E-03", signatureValid: true, sameRegisterEpoch: true, correctedEnergyKwh: 10 } });
  actor.send({ type: "evidence.validate" });
  await waitFor(actor, (snapshot) => snapshot.matches("awaitingApproval"));
  const checkpoint = JSON.parse(JSON.stringify(actor.getPersistedSnapshot()));
  actor.stop();

  const resumed = correctionWorkflowRuntime.createActor(correctionWorkflowDefinition, {
    snapshot: checkpoint,
    clock: makeClock(),
  }).start();
  assert.equal(resumed.getSnapshot().value, "awaitingApproval");
  assert.equal(resumed.getSnapshot().context.credit, undefined);
  resumed.send({ type: "approval.granted", approval: { by: "restored-operator" } });
  const completed = await waitFor(resumed, (snapshot) => snapshot.matches("completed"));
  assert.equal(completed.context.correctedCdr.correctionOf, "CDR-DEMO-1042");
  resumed.stop();
});

test("a restored named deadline fires through the selected host clock", async () => {
  const firstClock = makeClock();
  const waiting = correctionWorkflowRuntime.createActor(correctionWorkflowDefinition, { clock: firstClock }).start();
  waiting.send({ type: "meter.corrected", evidence: { id: "E-04", signatureValid: true, sameRegisterEpoch: true, correctedEnergyKwh: 10 } });
  waiting.send({ type: "evidence.validate" });
  await waitFor(waiting, (snapshot) => snapshot.matches("awaitingApproval"));
  const checkpoint = JSON.parse(JSON.stringify(waiting.getPersistedSnapshot()));
  waiting.stop();

  const restoredClock = makeClock();
  const restored = correctionWorkflowRuntime.createActor(correctionWorkflowDefinition, { snapshot: checkpoint, clock: restoredClock }).start();
  const timeout = correctionWorkflowDefinition.steps.find((step) => step.id === restored.getSnapshot().value).timeout;
  restoredClock.advanceBy(correctionWorkflowRuntime.resolveDelay(timeout.after, restored.getSnapshot().context));
  assert.equal(restored.getSnapshot().value, "awaitingApproval", "restored timer deadlines are re-delivered by the host");
  restored.send({ type: timeout.event });
  const escalated = await waitFor(restored, (snapshot) => snapshot.matches("manualReview"));
  assert.equal(escalated.context.approvalEscalated, true);
  restored.stop();
});

test("invalid signatures and register resets end in quarantine before any financial effect", async () => {
  for (const evidence of [
    { id: "E-BAD-SIGNATURE", signatureValid: false, sameRegisterEpoch: true, correctedEnergyKwh: 10 },
    { id: "E-NEW-EPOCH", signatureValid: true, sameRegisterEpoch: false, correctedEnergyKwh: 10 },
  ]) {
    const actor = correctionWorkflowRuntime.createActor(correctionWorkflowDefinition).start();
    actor.send({ type: "meter.corrected", evidence });
    actor.send({ type: "evidence.validate" });
    const quarantined = await waitFor(actor, (snapshot) => snapshot.matches("quarantined"));
    assert.equal(quarantined.context.credit, undefined);
    assert.equal(quarantined.context.correctedCdr, undefined);
    actor.stop();
  }
});

test("XFlow rejects raw executable definitions and unregistered capabilities", () => {
  assert.ok(validateWorkflowDefinition({ ...doubleValueDefinition, initialContext: { unsafe: () => true } }, {}).some((error) => /executable code/.test(error)));
  assert.ok(validateWorkflowDefinition({ ...doubleValueDefinition, steps: [{ id: "s", kind: "serviceTask", activity: "unregistered", onDone: { target: "s" }, onError: { target: "s" } }] }, {}).some((error) => /registered activity/.test(error)));
  assert.ok(validateWorkflowDefinition({ ...doubleValueDefinition, steps: [{ id: "s", kind: "eventWait", on: { "event.sent": { target: "missing" } } }] }, {}).some((error) => /unknown step/.test(error)));
});

test("XFlow capabilities must be own registered functions and deadlines must match an event transition", () => {
  let inheritedDelayWasCalled = false;
  const inherited = Object.create({
    toString: () => true,
    deadline() { inheritedDelayWasCalled = true; return 5; },
  });
  const definition = {
    id: "test.inherited-capabilities", version: "1.0.0", initialStep: "approval",
    steps: [
      {
        id: "approval", kind: "humanTask",
        on: {
          proceed: { target: "decision", actions: "toString" },
          "deadline.expired": { target: "done" },
        },
        timeout: { after: "toString", event: "deadline.expired", target: "done" },
      },
      { id: "decision", kind: "decision", routes: [{ guard: "toString", target: "activity" }], defaultTarget: "activity" },
      { id: "activity", kind: "serviceTask", activity: "toString", onDone: { target: "done" }, onError: { target: "done" } },
      { id: "done", kind: "end" },
    ],
  };
  const errors = validateWorkflowDefinition(definition, {
    activities: inherited, guards: inherited, actions: inherited, delays: inherited,
  }).join(" ");
  assert.match(errors, /registered activity/);
  assert.match(errors, /unknown guard/);
  assert.match(errors, /unknown action/);
  assert.match(errors, /registered delay/);
  const runtimeWithInheritedDelay = createFlowRuntime({ delays: inherited });
  assert.throws(() => runtimeWithInheritedDelay.resolveDelay("deadline"), /Unknown delay/);
  assert.equal(inheritedDelayWasCalled, false);

  const mismatchedTimeout = {
    ...definition,
    steps: definition.steps.map((step) => step.id === "approval"
      ? { ...step, timeout: { ...step.timeout, target: "decision" } }
      : step),
  };
  const mismatchErrors = validateWorkflowDefinition(mismatchedTimeout, {
    delays: { toString: () => 10 },
  }).join(" ");
  assert.match(mismatchErrors, /must match the target/);

  const nonCallableAction = validateWorkflowDefinition({
    ...doubleValueDefinition,
    steps: [{ id: "s", kind: "eventWait", on: { start: { target: "s", actions: "bad" } } }],
  }, { actions: { bad: "not callable" } }).join(" ");
  assert.match(nonCallableAction, /unknown action/);
});
