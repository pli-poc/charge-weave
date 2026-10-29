import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { indexedDB } from "fake-indexeddb";
import pkg from "../generated/application.json" with { type: "json" };
import { createWorkspace } from "../src/profiles/chargeweave/workspace.js";
import { createLocalClient } from "../src/graphql/client.js";
import { createCheckpointStore } from "../src/adapters/browser/checkpoints.js";
import { rateReading } from "../src/profiles/chargeweave/rating.js";
import { evaluateRules } from "../src/services/validation.js";
import { createFlowRuntime } from "../src/flow/engine.js";
const input = {
  meterEnd: "12849.600",
  reason: "partner-correction",
  evidenceReference: "EV-2026-4481",
  operatorNote:
    "Signed partner evidence checked against the accepted register.",
};
const args = { input, expectedRevision: 0, idempotencyKey: "test-1" };
const workspace = () => createWorkspace({ applicationPackage: pkg });
test("exact correction arithmetic and bounded precision", () => {
  assert.deepEqual(rateReading(input.meterEnd, pkg.task.case), {
    energyKwh: "9.100",
    amountEur: "2.91",
    calculationVersion: "meter-fixed-v1",
  });
  assert.throws(() => rateReading("12849.60001", pkg.task.case));
});
test("accepted command runs existing correction flow once; changed retry and stale revision rejected", async () => {
  const w = workspace();
  const r = await w.submit(args);
  assert.equal(r.accepted, true, JSON.stringify(r));
  assert.equal(r.task.flowState, "completed");
  assert.equal(r.task.outcome.amount, "2.91");
  assert.deepEqual(await w.submit(args), r);
  assert.equal(w.history().length, 1);
  assert.equal(
    (await w.submit({ ...args, input: { ...input, meterEnd: "12849.7" } }))
      .code,
    "KEY_REUSED",
  );
  assert.equal(
    (await w.submit({ ...args, idempotencyKey: "other" })).accepted,
    false,
  );
});
test("invalid inputs, unsupported rules and denied role cannot change records", async () => {
  for (const change of [
    { meterEnd: "0" },
    { evidenceReference: "EV-0000-0000" },
    { operatorNote: "short" },
    { reason: "unknown" },
  ]) {
    const w = workspace();
    assert.equal(
      (await w.submit({ ...args, input: { ...input, ...change } })).accepted,
      false,
    );
    assert.equal(w.export().revision, 0);
  }
  assert.equal(
    (
      await createWorkspace({
        applicationPackage: pkg,
        principal: { role: "viewer" },
      }).submit(args)
    ).code,
    "FORBIDDEN",
  );
  assert.equal(evaluateRules(["absent"], {}, {}).length, 1);
});
test("local GraphQL has typed validation and rejects multi-command aliases/fragments", async () => {
  const w = workspace();
  const c = createLocalClient({
    applicationPackage: pkg,
    services: {
      sites: () => [{ id: "s", name: "Site", country: "NL" }],
      sessions: () => [],
      task: w.task,
      submitCorrection: w.submit,
      prepareCorrection: w.prepare,
      decideCorrection: ({ input, ...args }) => w.decide({ ...input, ...args }),
      analytics: () => {},
      temporal: () => {},
    },
  });
  assert.equal(
    (await c.execute({ query: "{ sites { id name } task { revision } }" })).data
      .sites[0].id,
    "s",
  );
  const q =
    'mutation($input:CorrectionInput!){submitCorrection(input:$input,expectedRevision:0,idempotencyKey:"gql"){accepted task{flowState}}}';
  assert.ok(
    (
      await c.execute({
        query: q,
        variables: { input: { ...input, meterEnd: 123 } },
      })
    ).errors,
  );
  assert.equal(
    (await c.execute({ query: q, variables: { input } })).data.submitCorrection
      .accepted,
    true,
  );
  assert.ok(
    (
      await c.execute({
        query:
          'mutation { ...M } fragment M on Mutation { a:submitCorrection(input:{meterEnd:"1",reason:"x",evidenceReference:"x",operatorNote:"x"},expectedRevision:0,idempotencyKey:"a"){accepted} b:submitCorrection(input:{meterEnd:"1",reason:"x",evidenceReference:"x",operatorNote:"x"},expectedRevision:0,idempotencyKey:"b"){accepted} }',
      })
    ).errors,
  );
});
test("coherent checkpoint, conflict, integrity, pinned version and scoped reset", async () => {
  const s = createCheckpointStore({
    indexedDB,
    crypto: webcrypto,
    database: "tests",
  });
  const w = workspace();
  await w.submit(args);
  await s.save("one", w.export(), pkg, 0);
  const saved = await s.load("one", pkg);
  assert.deepEqual(
    createWorkspace({
      applicationPackage: pkg,
      snapshot: saved.payload,
    }).task(),
    w.task(),
  );
  await assert.rejects(s.save("one", w.export(), pkg, 0));
  await assert.rejects(s.load("one", { ...pkg, digest: "new" }));
  await assert.rejects(s.verify({ ...saved, checksum: "bad" }, pkg));
  await s.save("two", w.export(), pkg, 0);
  await s.remove("one", 1);
  assert.equal(await s.load("one", pkg), null);
  assert.ok(await s.load("two", pkg));
});
test("domain neutral document review uses shared compiler and snapshot restoration", () => {
  const d = {
    id: "document-review",
    version: "1",
    initialStep: "review",
    steps: [
      {
        id: "review",
        kind: "humanTask",
        on: { approve: { target: "done" }, reject: { target: "declined" } },
      },
      { id: "done", kind: "end" },
      { id: "declined", kind: "end" },
    ],
  };
  const runtime = createFlowRuntime();
  const a = runtime.createActor(d);
  a.start();
  const snapshot = a.getPersistedSnapshot();
  a.stop();
  const b = runtime.createActor(d, { snapshot });
  b.start();
  b.send({ type: "approve" });
  assert.equal(b.getSnapshot().value, "done");
  b.stop();
});
test("failed workflow evidence does not partially commit and a checkpoint cannot race a queued command", async () => {
  const damaged = structuredClone(pkg);
  damaged.task.case.evidence.signatureValid = false;
  const bad = createWorkspace({ applicationPackage: damaged });
  const r = await bad.submit(args);
  assert.equal(r.code, "WORKFLOW_REJECTED");
  assert.equal(bad.export().revision, 0);
  const w = workspace();
  const pending = w.submit(args);
  assert.throws(() => w.export(), /Unsettled/);
  await pending;
  assert.equal(w.export().revision, 1);
});
test("checkpoint restoration rejects inconsistent business and process state", async () => {
  const w = workspace();
  await w.submit(args);
  const s = w.export();
  s.outcome.amount = "999.00";
  assert.throws(
    () => createWorkspace({ applicationPackage: pkg, snapshot: s }),
    /Incoherent/,
  );
});

test('task reads and queued command inputs cannot mutate authoritative workspace state', async () => {
  const w=workspace();
  const submitted=structuredClone(args);
  const pending=w.submit(submitted);
  submitted.input.meterEnd='0';
  assert.equal((await pending).accepted,true);
  const read=w.task();read.outcome.amount='999';read.descriptor.form.fields[0].required=false;
  assert.equal(w.task().outcome.amount,'2.91');
  assert.equal(w.task().descriptor.form.fields[0].required,true);
});

test('a one-cent correction is material and cannot disappear through binary subtraction', async () => {
  const custom = structuredClone(pkg); custom.task.case.proposedMeterEnd = 12851.070;
  const w=createWorkspace({ applicationPackage: custom });
  const result=await w.submit({...args,input:{...input,meterEnd:'12851.070'}});
  assert.equal(result.accepted,true);
  assert.equal(result.task.outcome.amount,'3.38');
  assert.equal(result.task.flowState,'completed');
  assert.equal(w.export().actor.context.rating.grossDeltaEur,0.01);
});

test('separate approval survives restore and applies a decision exactly once', async () => {
  const w = workspace();
  const pending = await w.prepare(args);
  assert.equal(pending.code, 'AWAITING_APPROVAL');
  assert.equal(pending.task.flowState, 'awaitingApproval');
  assert.equal(pending.task.id, 'correction-approval');
  assert.equal(pending.task.descriptor.form.id, pkg.flow.steps.find(s => s.id === 'awaitingApproval').taskFormProfile.id);
  assert.equal(w.export().actor.context.credit, undefined);
  const restored = createWorkspace({ applicationPackage: pkg, snapshot: w.export() });
  const decision = { outcome: 'approve', note: 'Evidence and calculated amount checked carefully.', expectedRevision: 1, idempotencyKey: 'approval-1' };
  const accepted = await restored.decide(decision);
  assert.equal(accepted.task.flowState, 'completed');
  assert.equal(accepted.task.outcome.amount, '2.91');
  assert.deepEqual(await restored.decide(decision), accepted);
  assert.equal((await restored.decide({ ...decision, idempotencyKey: 'stale' })).code, 'STALE_REVISION');
  assert.equal(restored.history().length, 2);
  assert.equal(createWorkspace({ applicationPackage: pkg, snapshot: restored.export() }).task().status, 'completed');
});

test('rejection and virtual deadline do not create financial effects and survive restore', async () => {
  for (const expire of [false, true]) {
    let now = '2026-10-13T08:00:00.000Z';
    const w = createWorkspace({ applicationPackage: pkg, clock: () => now });
    await w.prepare(args);
    if (expire) now = '2026-10-13T09:00:00.000Z';
    const r = await w.decide({ outcome: expire ? 'approve' : 'reject', note: 'Evidence does not support this proposed correction.', expectedRevision: 1, idempotencyKey: 'decision' });
    assert.equal(r.code, expire ? 'APPROVAL_EXPIRED' : 'DECLINED');
    assert.equal(w.export().actor.context.credit, undefined);
    const restored = createWorkspace({ applicationPackage: pkg, snapshot: w.export(), clock: () => now });
    assert.equal(restored.task().flowState, expire ? 'manualReview' : 'declined');
    assert.equal((await restored.decide({ outcome: 'approve', note: 'Evidence and calculated amount checked carefully.', expectedRevision: 2, idempotencyKey: 'again' })).code, 'TASK_NOT_OPEN');
  }
});

 test('a changed reading cannot be accepted under another evidence reference', async () => {
  const w = workspace();
  const result = await w.prepare({ ...args, input: { ...input, meterEnd: '12849.700' } });
  assert.equal(result.accepted, false);
  assert.match(result.violations.map(v => v.message).join(' '), /does not match/);
  assert.equal(w.export().revision, 0);
});

test('explicit virtual deadline advance is persisted and idempotent', async () => {
  const w = workspace(); await w.prepare(args);
  const command = { expectedRevision: 1, idempotencyKey: 'advance-clock' };
  const result = await w.expireApproval(command);
  assert.equal(result.code, 'APPROVAL_EXPIRED');
  assert.equal(result.task.flowState, 'manualReview');
  assert.deepEqual(await w.expireApproval(command), result);
  const restored = createWorkspace({ applicationPackage: pkg, snapshot: w.export() });
  assert.equal(restored.task().status, 'expired');
  assert.equal((await restored.decide({ outcome: 'approve', note: 'Evidence and amount reviewed carefully.', expectedRevision: 2, idempotencyKey: 'late' })).code, 'TASK_NOT_OPEN');
});

test('generated GraphQL commands preserve the approval boundary and reject stale decisions', async () => {
  const w = workspace();
  const client = createLocalClient({ applicationPackage: pkg, services: {
    sites: () => [], sessions: () => [], task: w.task, analytics: () => {}, temporal: () => {},
    submitCorrection: w.submit, prepareCorrection: w.prepare,
    decideCorrection: ({ input, ...args }) => w.decide({ ...input, ...args }),
  } });
  const prepare = 'mutation($input:PrepareCorrectionInput!){prepareCorrection(input:$input,expectedRevision:0,idempotencyKey:"prepare"){accepted code task{flowState revision}}}';
  const p = await client.execute({ query: prepare, variables: { input } });
  assert.equal(p.data.prepareCorrection.task.flowState, 'awaitingApproval');
  const decision = 'mutation($input:CorrectionDecisionInput!,$revision:Int!){decideCorrection(input:$input,expectedRevision:$revision,idempotencyKey:"decide"){accepted code task{flowState outcome}}}';
  const result = await client.execute({ query: decision, variables: { input: { outcome: 'approve', note: 'The evidence and amount are reviewed carefully.' }, revision: 1 } });
  assert.equal(result.data.decideCorrection.task.outcome.amount, '2.91');
  const retry = await client.execute({ query: decision, variables: { input: { outcome: 'approve', note: 'The evidence and amount are reviewed carefully.' }, revision: 1 } });
  assert.deepEqual(retry.data, result.data);
});

test('unchanged rating closes without presenting a financial correction', async () => {
  const custom = structuredClone(pkg); custom.task.case.proposedMeterEnd = custom.task.case.originalMeterEnd;
  const w = createWorkspace({ applicationPackage: custom });
  const r = await w.prepare({ ...args, input: { ...input, meterEnd: String(custom.task.case.originalMeterEnd) } });
  assert.equal(r.task.flowState, 'completedNoChange');
  assert.equal(r.task.outcome.type, 'correction.noChange');
  assert.equal(r.task.records.credit, null);
  assert.equal(r.task.records.correctedCdr, null);
});

test('only observed process routes are recorded and survive a checkpoint', async () => {
  const w = workspace();
  await w.prepare(args);
  const waiting = w.export();
  assert.ok(waiting.trace.some(e => e.source === 'approvalDecision' && e.event === 'approvalRequired' && e.target === 'awaitingApproval'));
  assert.ok(!waiting.trace.some(e => e.source === 'awaitingApproval' && e.event === 'approval.rejected'));
  const restored = createWorkspace({ applicationPackage: pkg, snapshot: waiting });
  await restored.decide({ outcome: 'approve', note: 'The evidence and proposed amount were reviewed.', expectedRevision: 1, idempotencyKey: 'trace-decision' });
  const trace = restored.task().trace;
  assert.ok(trace.some(e => e.source === 'awaitingApproval' && e.event === 'approval.granted'));
  assert.ok(!trace.some(e => e.source === 'awaitingApproval' && e.event === 'approval.rejected'));
  assert.deepEqual(createWorkspace({ applicationPackage: pkg, snapshot: restored.export() }).task().trace, trace);
  const damaged = restored.export(); damaged.trace[0].target = 'completed';
  assert.throws(() => createWorkspace({ applicationPackage: pkg, snapshot: damaged }), /workflow trace/);
});
