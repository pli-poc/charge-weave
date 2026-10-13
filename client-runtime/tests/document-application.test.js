import test from "node:test";
import assert from "node:assert/strict";
import { createDocumentApplication } from "../../website/src/engineering/document-application.js";
import { createEngineeringKit } from "../src/engineering/kit.js";
import { createApplicationHost } from "../src/application/host.js";
import { createDocumentWorkspace } from "../src/profiles/document-review/workspace.js";
import { createCoordinator, createScriptedAdapter } from "../src/engineering/coordinator.js";
test("neutral app has independent namespace, multiple task/command API and shared scenario conformance", async () => {
  const config = await createDocumentApplication("runtime-v1");
  const pkg = config.initialPackage;
  assert.equal(pkg.runtimeModel.Document.iri, "urn:syntriq:document-review:Document");
  assert.equal(pkg.tasks.length, 4); assert.ok(!pkg.schema.includes("analytics(input:"));
  const host = createApplicationHost({ applicationPackage: pkg, factory: createDocumentWorkspace });
  const result = await host.execute({ query: '{documents{id title status} tasks{id descriptor} task(id:"draft"){flowState}}' });
  assert.equal(result.errors, undefined); assert.equal(result.data.tasks.length, 4); host.dispose();
  const kit = await createEngineeringKit(config);
  for (const scenario of kit.runner.list()) {
    const inputs = { scenarioId: scenario.id, seed: "neutral-17", startAt: "2026-10-13T12:00:00.000Z" };
    const run = await kit.invoke("scenario.run", inputs);
    assert.ok(run.data.assertions.every(a => a.passed), JSON.stringify(run.data.assertions));
    assert.equal((await kit.invoke("scenario.run", inputs)).data.id, run.data.id);
  }
  const c = createCoordinator({ kit, adapter: createScriptedAdapter() });
  const task = await c.start({ goal: "Document review", scenarioId: "document.changes", seed: "neutral-ai", startAt: "2026-10-13T12:00:00.000Z" });
  assert.equal(task.status, "completed"); c.dispose();
});
test("neutral waiting checkpoints cannot forge approved document state or history", async () => {
  const { initialPackage: pkg } = await createDocumentApplication("runtime-v1");
  const w = createDocumentWorkspace({ applicationPackage: pkg });
  await w.submitDocument({ input: { note: "Ready for review." }, expectedRevision: 0, idempotencyKey: "first" });
  const snapshot = w.export(); w.dispose(); snapshot.document.status = "approved";
  assert.throws(() => createDocumentWorkspace({ applicationPackage: pkg, snapshot }), /Incoherent/);
});
