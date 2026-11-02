/** Project executable transitions without inventing routes or execution history. */
export function outgoingTransitions(step) {
  if (step.kind === "eventWait" || step.kind === "humanTask") return Object.entries(step.on ?? {}).map(([event, transition]) => ({ event, target: transition.target }));
  if (step.kind === "serviceTask") return [{ event: "success", target: step.onDone?.target }, { event: "error", target: step.onError?.target }];
  if (step.kind === "decision") return [...(step.routes ?? []).map((route) => ({ event: route.guard, target: route.target })), { event: "otherwise", target: step.defaultTarget }];
  return [];
}

/** Retain missing destinations as diagnostics rather than silently hiding them. */
export function projectTransitions(definition) {
  const ids = new Set(definition.steps.map((step) => step.id));
  return definition.steps.flatMap((step) => outgoingTransitions(step).map((edge, index) => ({ id: `${step.id}:${index}`, source: step.id, ...edge, targetExists: ids.has(edge.target) })));
}

// Stable positions for the featured flow; unknown steps are placed separately below.
export const GRAPH = {
  width: 1450, height: 2150, nodeWidth: 220, nodeHeight: 84, bottomLane: 2100,
  positions: Object.fromEntries([
    ['awaitingEvidence', 0], ['evidenceReceived', 1], ['verifyingEvidence', 2],
    ['reconcilingUsage', 3], ['assessingReadiness', 4], ['readinessDecision', 5],
    ['recalculatingRating', 6], ['ratingDecision', 7], ['approvalDecision', 8],
    ['awaitingApproval', 9], ['issuingCredit', 10], ['issuingCorrectedCdr', 11],
    ['propagatingCorrection', 12], ['completed', 13],
  ].map(([id, row]) => [id, { x: 600, y: 55 + row * 145 }]).concat([
    ['quarantined', { x: 135, y: 345 }],
    ['manualReview', { x: 135, y: 1360 }],
    ['awaitingAdditionalEvidence', { x: 1040, y: 780 }],
    ['completedNoChange', { x: 1040, y: 1070 }],
    ['declined', { x: 1040, y: 1360 }],
  ])),
};

export function stepPosition(step, index) {
  return GRAPH.positions[step.id] ?? { x: 55 + (Math.floor(index / 14) * 350), y: 55 + ((index % 14) * 145) };
}

/** Preserve the known presentation while placing added nodes without collisions. */
export function layoutWorkflow(definition) {
  const occupied = new Set();
  const positions = new Map();
  let next = 0;
  for (const step of definition.steps) {
    if (GRAPH.positions[step.id]) { const base = GRAPH.positions[step.id]; const p = ['eventWait', 'decision', 'end'].includes(step.kind) && base.x === 600 ? { ...base, x: base.x + 68 } : base; positions.set(step.id, p); occupied.add(`${p.x}:${p.y}`); }
  }
  for (const step of definition.steps) {
    if (positions.has(step.id)) continue;
    let p;
    do { p = { x: GRAPH.width + 55 + (Math.floor(next / 14) * 350), y: 55 + ((next % 14) * 145) }; next++; } while (occupied.has(`${p.x}:${p.y}`));
    positions.set(step.id, p); occupied.add(`${p.x}:${p.y}`);
  }
  const xs = [...positions.values()].map(p => p.x), ys = [...positions.values()].map(p => p.y);
  const width = Math.max(GRAPH.width, ...xs.map(x => x + GRAPH.nodeWidth + 75));
  const height = Math.max(GRAPH.height, ...ys.map(y => y + GRAPH.nodeHeight + 100));
  return { positions, width, height, bottomLane: height - 50 };
}

/** Business labels preserve the original event identifier for inspection. */
export function transitionLabel(event) {
  return ({ 'success': 'Success', 'error': 'Service failure', 'otherwise': 'Default',
    'timer.expired': 'Deadline expired', 'approval.granted': 'Approved',
    'approval.rejected': 'Rejected', 'billingReady': 'Billing ready',
    'approvalRequired': 'Approval required', 'noMaterialChange': 'No material change' })[event] ?? event.replaceAll('.', ' ');
}

/** Orthogonal connections use the actual symbol's top/bottom ports. */
export function nodePort(position, kind, side) {
  const compact = ['eventWait', 'decision', 'end'].includes(kind);
  const x = position.x + (compact ? 42 : GRAPH.nodeWidth / 2);
  return { x, y: position.y + (side === 'bottom' ? GRAPH.nodeHeight : 0) };
}

export function edgeGeometry(source, target, index, canvas = GRAPH, sourceKind = 'serviceTask', targetKind = 'serviceTask') {
  const down = target.y > source.y;
  const a = nodePort(source, sourceKind, down ? 'bottom' : 'top');
  const b = nodePort(target, targetKind, down ? 'top' : 'bottom');
  if (a.x === b.x && Math.abs(target.y - source.y) <= 150) {
    const lane = (a.y + b.y) / 2;
    return { d: `M ${a.x} ${a.y} V ${lane} H ${b.x} V ${b.y}`, labelX: (a.x + b.x) / 2, labelY: lane - 5 };
  }
  // Move into the gutter before changing rows, keeping long recovery paths off nodes.
  const direction = target.x < source.x ? -1 : 1;
  const laneX = direction < 0 ? Math.min(source.x, target.x) - 35 - (index % 3) * 12 : Math.max(source.x, target.x) + GRAPH.nodeWidth + 35 + (index % 3) * 12;
  const startY = a.y + (down ? 22 : -22);
  const endY = b.y + (down ? -22 : 22);
  return { d: `M ${a.x} ${a.y} V ${startY} H ${laneX} V ${endY} H ${b.x} V ${b.y}`, labelX: laneX, labelY: (startY + endY) / 2 };
}
