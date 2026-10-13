import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { indexedDB } from "fake-indexeddb";
import { createBroker } from "../src/engineering/broker.js";
import { createEngineeringKit } from "../src/engineering/kit.js";
import { createCoordinator, createScriptedAdapter } from "../src/engineering/coordinator.js";
import { readResponseStream, createOpenAIAdapter } from "../src/engineering/openai.js";
import { sha256, object, string } from "../src/engineering/contracts.js";
import { compileApplicationBody } from "../src/compiler/application.js";
import { createCheckpointStore } from "../src/adapters/browser/checkpoints.js";
import { chargeweaveAdapters } from "../../website/src/engineering/chargeweave-adapter.js";
import pkg from "../generated/application.json" with { type: "json" };
import bundle from "../generated/engineering.json" with { type: "json" };
import catalog from "../../model/catalog.json" with { type: "json" };
import analytics from "../../model/analytics-profile.json" with { type: "json" };
async function compile(sources) {
  const get = id => JSON.parse(sources[id]);
  const body = compileApplicationBody({ namespace: "https://example.org/charge-domain#", catalog, api: get("model/client-api-profile.json"), task: get("model/client-task-profile.json"), commands: get("model/client-command-profile.json"), capabilities: get("model/client-capabilities.json"), flow: get("xflow/charge-correction.profile.json"), analytics, inputDigest: await sha256(sources) });
  return { ...body, digest: await sha256(body) };
}
const kit = snapshot => createEngineeringKit({ bundle, initialPackage: pkg, compile, adapters: chargeweaveAdapters, snapshot });
const inputs = { scenarioId: "correction.valid", seed: "proof-12", startAt: "2026-10-13T08:00:00.000Z" };
test("broker rejects unknown tools, forged grants, invalid inputs/results and reused operation IDs", async () => {
  const identity = () => ({ candidateDigest: "pinned", workspaceRevision: 0 });
  const b = createBroker({ identity }); let writes = 0;
  b.register({ id: "demo.write", effect: "candidate-write", description: "Test", inputSchema: object({ text: string }), outputSchema: object({ text: string }) }, args => { writes++; return args; });
  const host = { grant: { taskId: "one", capabilities: ["demo.write"] }, invocationId: "one" };
  await assert.rejects(b.invoke("unknown", {}, host), /Unknown/);
  await assert.rejects(b.invoke("demo.write", { text: "x" }, { ...host, grant: { taskId: "one", capabilities: [] } }), /granted/);
  await assert.rejects(b.invoke("demo.write", { text: "x", approved: true }, host), /Unknown/);
  const result = await b.invoke("demo.write", { text: "x" }, host);
  assert.deepEqual(await b.invoke("demo.write", { text: "x" }, host), result); assert.equal(writes, 1);
  await assert.rejects(b.invoke("demo.write", { text: "other" }, host), /reused/);
  b.register({ id: "demo.bad", effect: "read", description: "Test", inputSchema: object(), outputSchema: object({ text: string }) }, () => ({ text: 9 }));
  await assert.rejects(b.invoke("demo.bad", {}, { ...host, invocationId: "bad", grant: { taskId: "one", capabilities: ["demo.bad"] } }), /type/);
});
test("all correction and protocol adapters use real services and replay byte-stable evidence", async () => {
  const k = await kit();
  for (const s of k.runner.list()) {
    const run = await k.invoke("scenario.run", { ...inputs, scenarioId: s.id });
    assert.ok(run.data.assertions.every(a => a.passed), s.id);
    const replay = await k.invoke("scenario.run", { ...inputs, scenarioId: s.id });
    assert.equal(run.data.id, replay.data.id);
  }
  const save = k.export(); const restored = await kit(save); assert.equal(restored.runner.export().length, k.runner.list().length);
  const bad = structuredClone(save); bad.evidence[0].output = { changed: true };
  await assert.rejects(kit(bad), /Damaged/);
});
test("candidate changes invalidate compilation and source caches; unknown required rules cannot compile", async () => {
  const k = await kit();
  const s = k.candidate.sources().find(s => s.id === "model/client-command-profile.json");
  const changed = JSON.parse(s.text); changed.commands[0].requiredRules.push("unsupported-rule");
  await k.invoke("candidate.apply_change", { sourceId: s.id, expectedHash: s.hash, expectedRevision: 0, text: JSON.stringify(changed) });
  await assert.rejects(k.invoke("scenario.run", inputs), /compilation/);
  await assert.rejects(k.invoke("model.compile_supported", { expectedRevision: 1 }), /Unsupported required rule/);
  await assert.rejects(k.invoke("context.read", { sourceId: s.id, expectedHash: s.hash }), /stale/);
  await assert.rejects(k.invoke("candidate.reset", { expectedRevision: 0 }), /Stale/);
  await k.invoke("candidate.reset", { expectedRevision: 1 });
  assert.equal((await k.invoke("scenario.run", inputs)).data.assertions.every(a => a.passed), true);
});
test("candidate compilation is pure, reversible and preserves required-input semantics", async () => {
  const k = await kit(), s = k.candidate.sources().find(s => s.id === "model/client-task-profile.json");
  const task = JSON.parse(s.text); task.task.instructions += " Independently check the evidence.";
  await k.invoke("candidate.apply_change", { sourceId: s.id, expectedHash: s.hash, expectedRevision: 0, text: JSON.stringify(task) });
  const out = await k.invoke("model.compile_supported", { expectedRevision: 1 });
  assert.notEqual(out.candidateDigest, pkg.digest);
  assert.equal((await k.invoke("scenario.run", inputs)).data.assertions.every(a => a.passed), true);
  const restored = await kit(k.export());
  await restored.invoke("model.compile_supported", { expectedRevision: 1 }); assert.equal(restored.candidate.identity().candidateDigest, out.candidateDigest);
});
test("context exact/dependency retrieval is scoped and versioned, with budget gaps visible", async () => {
  const k = await kit();
  const first = await k.context.search("evidence"); await k.context.search("evidence"); assert.equal(k.context.metrics().hits, 1);
  assert.ok(first.some(s => s.id === "model/client-task-profile.json"));
  const packet = await k.context.assemble({ goal: "unfindableword", taskId: "t" }); assert.ok(packet.gaps.length);
});
test("scripted assistance uses real broker operations, bounded calls and current evidence", async () => {
  const k = await kit(), saved = [];
  const c = createCoordinator({ kit: k, adapter: createScriptedAdapter(), checkpoint: async t => saved.push(t) });
  const t = await c.start({ goal: "meter correction evidence", ...inputs });
  assert.equal(t.status, "completed"); assert.equal(t.calls, 2); assert.equal(t.output.evidenceRefs.length, 1);
  assert.ok(saved.some(t => t.pendingCall));
  const limited = createCoordinator({ kit: k, adapter: createScriptedAdapter(), budgets: { maxSteps: 1 } });
  assert.equal((await limited.start({ goal: "meter", ...inputs })).status, "failed"); c.dispose(); limited.dispose();
});
test("engineering persistence is isolated, rejects multi-tab writes and keeps interrupted effects unresolved", async () => {
  const k = await kit(), storage = createCheckpointStore({ indexedDB, crypto: webcrypto, database: "engineering-test" });
  await k.invoke("scenario.run", inputs); const payload = k.export();
  await storage.save("task", payload, pkg, 0); await assert.rejects(storage.save("task", payload, pkg, 0), /conflict/);
  const restored = await kit((await storage.load("task", pkg)).payload); assert.equal(restored.runner.export().length, 1);
  const c = createCoordinator({ kit: restored, adapter: createScriptedAdapter(), snapshot: { provider: "scripted-v1", pendingCall: { id: "unsettled" } } });
  await assert.rejects(c.start({ resume: true }), /unreconciled/); c.dispose();
});
test("Responses streaming tolerates chunk boundaries but rejects truncation and incomplete output", async () => {
  const completed = { status: "completed", output: [{ type: "reasoning", encrypted_content: "opaque" }, { type: "function_call", call_id: "c", name: "context_search", arguments: '{"query":"meter"}' }] };
  const bytes = new TextEncoder().encode(`data: ${JSON.stringify({ type: "response.completed", response: completed })}\n\n`);
  const stream = new ReadableStream({ start(c) { for (let i = 0; i < bytes.length; i += 3) c.enqueue(bytes.slice(i, i + 3)); c.close(); } });
  assert.deepEqual(await readResponseStream(new Response(stream, { headers: { "content-type": "text/event-stream" } })), completed);
  await assert.rejects(readResponseStream(new Response('data: {"type":"response.created"}\n\n', { headers: { "content-type": "text/event-stream" } })), /Interrupted/);
});
test("OpenAI adapter preserves opaque output/call correlations and never stores browser credentials in requests", async () => {
  const requests = [];
  const a = createOpenAIAdapter({ endpoint: "https://relay.example/ai", model: "model-allowed", authorization: "session-secret", fetch: async (url, init) => {
    requests.push({ url, init });
    return new Response(JSON.stringify(url.endsWith("capabilities") ? { models: ["model-allowed"], features: {} } : { status: "completed", output: [], usage: {} }), { headers: { "content-type": "application/json" } });
  } });
  const continuation = [{ type: "reasoning", encrypted_content: "opaque" }, { type: "function_call", call_id: "c", name: "context_search", arguments: "{}" }, { type: "function_call_output", call_id: "c", output: "{}" }];
  await a.next({ task: { continuation }, packet: { identity: {} }, tools: [], signal: new AbortController().signal });
  const body = JSON.parse(requests.at(-1).init.body);
  assert.deepEqual(body.input.slice(1, 4), continuation); assert.equal(body.store, false); assert.ok(!requests.at(-1).init.body.includes("session-secret"));
});
