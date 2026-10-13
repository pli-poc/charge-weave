import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { compileApplication } from "../scripts/build-package.mjs";
const read = (p) =>
  JSON.parse(readFileSync(new URL("../../" + p, import.meta.url)));
const options = {
  catalog: read("model/catalog.json"),
  api: read("model/client-api-profile.json"),
  task: read("model/client-task-profile.json"),
  commands: read("model/client-command-profile.json"),
  capabilities: read("model/client-capabilities.json"),
  flow: read("xflow/charge-correction.profile.json"),
  analytics: read("model/analytics-profile.json"),
  inputDigest: "test",
};
test("profile edits generate input shape and metadata together", () => {
  const next = structuredClone(options);
  next.task.task.form.fields.push({
    id: "reviewTicket",
    datatype: "string",
    required: true,
    binding: {
      kind: "commandInput",
      command: "submitCorrection",
      field: "reviewTicket",
    },
    concept: "command:submitCorrection.reviewTicket",
  });
  next.commands.commands[0].inputs.push("reviewTicket");
  const out = compileApplication(next);
  assert.match(out.schema, /reviewTicket: String!/);
  assert.equal(out.task.task.form.fields.at(-1).id, "reviewTicket");
  assert.notEqual(out.digest, compileApplication(options).digest);
});
test("unresolved semantic names, type collisions and unsupported handlers/rules fail generation", () => {
  for (const change of [
    (o) => (o.api.types[0].class = "Absent"),
    (o) => o.api.types.push(o.api.types[0]),
    (o) => (o.commands.commands[0].handler = "absent"),
    (o) => o.commands.commands[0].requiredRules.push("absent"),
    (o) => (o.task.task.form.fields[0].binding.command = "absent"),
  ]) {
    const input = structuredClone(options);
    change(input);
    assert.throws(() => compileApplication(input));
  }
});
test("required command fields cannot be weakened in presentation", () => {
  const next = structuredClone(options);
  next.task.task.form.fields[0].required = false;
  assert.throws(() => compileApplication(next), /Weakened/);
});
test("editable model inheritance and immediate decision cycles cannot lock the browser preview", async () => {
  const next = structuredClone(options); next.catalog.ChargingSite.parent = "ChargingSite";
  assert.throws(() => compileApplication(next), /Circular class inheritance/);
  const { createFlowRuntime } = await import("../src/flow/engine.js");
  const runtime = createFlowRuntime({ guards: { never: () => false } });
  assert.throws(() => runtime.createActor({ id: "loop", version: "1", initialStep: "decide", steps: [{ id: "decide", kind: "decision", routes: [{ guard: "never", target: "done" }], defaultTarget: "decide" }, { id: "done", kind: "end" }] }), /Immediate decision cycle/);
});
test("a document review package runs through the same generator, GraphQL dispatcher and flow compiler", async () => {
  const { createLocalClient } = await import("../src/graphql/client.js");
  const { createFlowRuntime } = await import("../src/flow/engine.js");
  const p = compileApplication({
    catalog: { Document: { fields: [], parent: null } },
    api: {
      maxDepth: 8,
      maxFields: 30,
      types: [
        {
          name: "Document",
          class: "Document",
          fields: [
            { name: "id", type: "ID!", source: "id", binding: "projection:id" },
          ],
        },
      ],
      operations: [
        { name: "documents", type: "[Document!]!", handler: "documents" },
      ],
    },
    task: {
      task: {
        id: "review",
        form: {
          fields: [
            {
              id: "note",
              datatype: "string",
              required: true,
              concept: "command:reviewDocument.note",
              binding: {
                kind: "commandInput",
                command: "reviewDocument",
                field: "note",
              },
            },
          ],
        },
      },
    },
    commands: {
      commands: [
        {
          id: "reviewDocument",
          inputType: "DocumentReviewInput",
          handler: "review",
          class: "Document",
          requiredInputs: ["note"],
          inputs: ["note"],
          requiredRules: [],
        },
      ],
    },
    capabilities: { handlers: ["review"], rules: [] },
    flow: {
      "@graph": [
        {
          "@type": "xflow:WorkflowDefinition",
          workflowId: "document-review",
          workflowVersion: "1",
          initialStep: { "@id": "#review" },
          hasStep: [{ "@id": "#review" }, { "@id": "#done" }],
        },
        {
          "@id": "#review",
          "@type": "xflow:HumanTask",
          stepKey: "review",
          onEvent: [{ eventType: "approve", targetStep: { "@id": "#done" } }],
        },
        { "@id": "#done", "@type": "xflow:EndStep", stepKey: "done" },
      ],
    },
    analytics: {},
    inputDigest: "neutral-fixture",
  });
  const actor = createFlowRuntime().createActor(p.flow);
  actor.start();
  const c = createLocalClient({
    applicationPackage: p,
    services: {
      documents: () => [{ id: "document-1" }],
      review: () => {
        actor.send({ type: "approve" });
        return {
          accepted: true,
          code: "ACCEPTED",
          revision: 1,
          violations: [],
          task: {
            id: "review",
            revision: 1,
            status: "completed",
            stage: "done",
            descriptor: {},
            values: {},
            flowState: actor.getSnapshot().value,
          },
        };
      },
    },
  });
  const result = await c.execute({
    query:
      'mutation {reviewDocument(input:{note:"Reviewed"},expectedRevision:0,idempotencyKey:"doc-1"){accepted task{flowState}}}',
  });
  assert.equal(result.errors, undefined);
  assert.equal(result.data.reviewDocument.task.flowState, "done");
  actor.stop();
});
