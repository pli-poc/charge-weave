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

test('shared canvas projection keeps all correction steps and executable routes', async () => {
  const { GRAPH, stepPosition, edgeGeometry } = await import('../src/flow/presentation.js');
  const flow = normaliseWorkflowProfile(profile);
  const positions = new Map(flow.steps.map((s, i) => [s.id, stepPosition(s, i)]));
  assert.equal(new Set([...positions.values()].map(p => `${p.x}:${p.y}`)).size, flow.steps.length);
  for (const edge of projectTransitions(flow)) {
    const geometry = edgeGeometry(positions.get(edge.source), positions.get(edge.target), 0);
    assert.match(geometry.d, /^M /);
    assert.ok(positions.get(edge.source).x + GRAPH.nodeWidth <= GRAPH.width);
  }
});
