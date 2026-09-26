import test from "node:test";
import assert from "node:assert/strict";
import { createRuntimeFactory, runSimulation } from "./runtime.js";
import { createMemoryStore, TemporalMemoryStore } from "./stores.js";

test("same seed and composition produce a byte-stable run record and trace", () => {
  const config = { seed: "repeatable-21", scenario: "cdr-correction" };
  const first = runSimulation(config);
  const replay = runSimulation(config);
  assert.deepEqual(replay, first);
  assert.equal(replay.run.fingerprint, first.run.fingerprint);
  assert.ok(first.checks.every((check) => check.passed));
});

test("changing the seed changes generated identities and meter data", () => {
  const first = runSimulation({ seed: 4242 });
  const second = runSimulation({ seed: 4243 });
  assert.notEqual(first.run.id, second.run.id);
  assert.notEqual(first.summary.sessionId, second.summary.sessionId);
  assert.notEqual(first.summary.energyKwh, second.summary.energyKwh);
  assert.notEqual(first.run.fingerprint, second.run.fingerprint);
});

test("OCPP frames and OCPI exchanges retain explicit versioned fixture shapes", () => {
  const result = runSimulation({ seed: 4242 });
  const calls = result.protocols.ocpp.filter((entry) => entry.messageType === "CALL");
  const responses = result.protocols.ocpp.filter((entry) => entry.messageType === "CALLRESULT");
  assert.ok(calls.some((entry) => entry.action === "RequestStartTransaction" && entry.frame[0] === 2));
  assert.ok(calls.some((entry) => entry.action === "TransactionEvent" && entry.frame[3].eventType === "Started"));
  assert.equal(calls.length, responses.length);
  assert.ok(calls.every((entry) => typeof entry.frame[1] === "string" && entry.frame.length === 4));

  const start = result.protocols.ocpi.find((entry) => entry.path.endsWith("/commands/START_SESSION"));
  assert.equal(start.method, "POST");
  assert.equal(start.request.body.location_id, "CW-UTR-001");
  assert.equal(start.response.body.status_code, 1000);
  assert.equal(start.response.body.data.result, "ACCEPTED");
  const cdr = result.protocols.ocpi.find((entry) => entry.path.endsWith("/cdrs"));
  assert.equal(cdr.method, "POST");
  assert.equal(cdr.request.body.total_energy, result.summary.energyKwh);
  assert.equal(cdr.response.body.status_code, 1000);
  assert.ok(cdr.response.headers.Location.endsWith(cdr.request.body.id));
});

test("authorization rejection leaves no active session, CDR or operational record", () => {
  const result = runSimulation({ seed: 42, scenario: "authorization-denied" });
  assert.equal(result.summary.status, "rejected");
  assert.equal(result.summary.sessionStatus, "NOT_CREATED");
  assert.equal(result.summary.cdrCount, 0);
  assert.deepEqual(result.stores.operational, []);
  assert.ok(result.timeline.some((event) => event.status === "rejected"));
});

test("duplicate transaction sequence is retained as evidence but applied once", () => {
  const result = runSimulation({ seed: 42, scenario: "duplicate-event" });
  assert.equal(result.summary.duplicateEventsIgnored, 1);
  assert.equal(result.stores.operational[0].history.filter((event) => event.eventId.endsWith(":1")).length, 1);
  assert.ok(result.stores.evidence.some((row) => row.source.includes("OCPP 2.1")));
  assert.ok(result.timeline.some((event) => event.title === "Duplicate event ignored"));
});

test("late observations retain both times; credit correction appends a linked CDR", () => {
  const late = runSimulation({ seed: 42, scenario: "late-meter" });
  const lateReading = late.stores.telemetry.find((row) => row.quality === "synthetic-late-correction");
  assert.ok(Date.parse(lateReading.receivedAt) > Date.parse(lateReading.observedAt));
  assert.equal(late.summary.cdrCount, 1);
  assert.ok(late.timeline.some((event) => event.title === "Late meter observation retained"));

  const corrected = runSimulation({ seed: 42, scenario: "cdr-correction" });
  const cdrs = corrected.protocols.ocpi.filter((entry) => entry.method === "POST" && entry.path.endsWith("/cdrs"));
  assert.equal(cdrs.length, 2);
  assert.equal(cdrs[1].request.body.credit, true);
  assert.equal(cdrs[1].request.body.credit_reference_id, cdrs[0].request.body.id);
  assert.notEqual(cdrs[0].request.body.total_energy, corrected.stores.temporal.filter((row) => row.key.endsWith(":energy")).at(-1).value);
  assert.equal(corrected.summary.cdrCount, 2);
});

test("one source, process or store adapter can be replaced independently", () => {
  const factory = createRuntimeFactory();
  const defaults = factory.compose();
  factory.registerInput("ocpp", "virtual-replay", { ...defaults.adapters.inputs.ocpp, label: "Virtual replay station" });
  factory.registerProcess("synthetic-replay", { ...defaults.adapters.process, label: "Synthetic replay process" });
  factory.registerStore("telemetry", "alternate-memory", {
    label: "Alternate telemetry memory",
    create: () => createMemoryStore("telemetry"),
  });
  const composed = factory.compose({
    inputs: { ocpp: "virtual-replay" },
    process: "synthetic-replay",
    stores: { telemetry: "alternate-memory" },
  });
  const result = factory.run({ seed: 42, composition: composed.composition });
  assert.equal(result.summary.status, "completed");
  assert.deepEqual(result.protocols.ocpp, runSimulation({ seed: 42 }).protocols.ocpp);
  assert.equal(result.run.composition.inputs.ocpi, "virtual");
  assert.equal(composed.composition.stores.telemetry, "alternate-memory");
  assert.equal(composed.composition.stores.temporal, "memory");
  assert.equal(composed.composition.inputs.ocpp, "virtual-replay");
  assert.equal(composed.composition.inputs.ocpi, "virtual");
  assert.equal(factory.availableAdapters().stores.telemetry.length, 2);
});

test("unsupported live adapters fail clearly until registered", () => {
  const factory = createRuntimeFactory();
  assert.throws(() => factory.compose({ inputs: { ocpp: "live" } }), /No adapter registered for inputs\.ocpp=live/);
});

test("temporal memory can answer what was known before a correction arrived", () => {
  const store = new TemporalMemoryStore();
  store.append({ key: "energy", value: 10.4, validAt: "2026-09-26T08:30:00.000Z", recordedAt: "2026-09-26T08:30:00.000Z" });
  store.append({ key: "energy", value: 10.0, validAt: "2026-09-26T08:30:00.000Z", recordedAt: "2026-09-26T08:31:00.000Z" });
  assert.equal(store.asKnownAt({ key: "energy", validAt: "2026-09-26T08:30:00.000Z", knownAt: "2026-09-26T08:30:30.000Z" }).value, 10.4);
  assert.equal(store.asKnownAt({ key: "energy", validAt: "2026-09-26T08:30:00.000Z", knownAt: "2026-09-26T08:32:00.000Z" }).value, 10.0);
});
