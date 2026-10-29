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

test('additional workflow steps are visible without overlapping existing placements', async () => {
  const { layoutWorkflow } = await import('../src/flow/presentation.js');
  const flow = normaliseWorkflowProfile(profile);
  flow.steps.push(...Array.from({ length: 12 }, (_, i) => ({ id: `new-${i}`, kind: 'end' })));
  const layout = layoutWorkflow(flow);
  assert.equal(layout.positions.size, flow.steps.length);
  assert.equal(new Set([...layout.positions.values()].map(p => `${p.x}:${p.y}`)).size, flow.steps.length);
  assert.ok([...layout.positions.values()].every(p => p.x + 220 <= layout.width && p.y + 84 <= layout.height));
});

test('semantic ports and route captions reflect the projected types and events', async () => {
  const { nodePort, edgeGeometry, transitionLabel } = await import('../src/flow/presentation.js');
  const a = { x: 100, y: 100 }, b = { x: 100, y: 245 };
  assert.deepEqual(nodePort(a, 'eventWait', 'bottom'), { x: 142, y: 184 });
  assert.deepEqual(nodePort(b, 'serviceTask', 'top'), { x: 210, y: 245 });
  const route = edgeGeometry(a, b, 0, undefined, 'eventWait', 'serviceTask');
  assert.match(route.d, /^M 142 184 /);
  assert.match(route.d, /V 245$/);
  assert.equal(transitionLabel('timer.expired'), 'Deadline expired');
  assert.equal(transitionLabel('error'), 'Service failure');
});
