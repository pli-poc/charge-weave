import test from "node:test";
import assert from "node:assert/strict";
import profile from "../../xflow/charge-correction.profile.json" with { type: "json" };
import { normaliseWorkflowProfile } from "../src/flow/normalize.js";
import { outgoingTransitions, projectTransitions } from "../src/flow/presentation.js";

test("projection covers executable correction transitions and retains deadline identity", () => {
  const flow = normaliseWorkflowProfile(profile);
  const edges = projectTransitions(flow);
  assert.ok(edges.every((edge) => edge.targetExists));
  assert.equal(new Set(edges.map((edge) => edge.id)).size, edges.length);
  const approval = edges.filter((edge) => edge.source === "awaitingApproval");
  assert.deepEqual(approval.map((edge) => edge.event), ["approval.granted", "approval.rejected", "timer.expired"]);
  assert.equal(approval.find((edge) => edge.event === "timer.expired").target, "manualReview");
  assert.equal(outgoingTransitions(flow.steps.find((step) => step.id === "completed")).length, 0);
});

test("projection reports missing destinations", () => {
  const [edge] = projectTransitions({ steps: [{ id: "a", kind: "eventWait", on: { go: { target: "missing" } } }] });
  assert.equal(edge.targetExists, false);
});
