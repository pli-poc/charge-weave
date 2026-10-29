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

export const GRAPH = {
  width: 1400,
  height: 1000,
  nodeWidth: 220,
  nodeHeight: 84,
  bottomLane: 950,
  positions: {
    awaitingEvidence: { x: 55, y: 60 },
    evidenceReceived: { x: 55, y: 180 },
    verifyingEvidence: { x: 55, y: 300 },
    reconcilingUsage: { x: 55, y: 420 },
    assessingReadiness: { x: 55, y: 540 },
    readinessDecision: { x: 55, y: 660 },
    quarantined: { x: 405, y: 60 },
    awaitingApproval: { x: 405, y: 180 },
    approvalDecision: { x: 405, y: 300 },
    ratingDecision: { x: 405, y: 420 },
    recalculatingRating: { x: 405, y: 540 },
    awaitingAdditionalEvidence: { x: 405, y: 780 },
    manualReview: { x: 755, y: 60 },
    declined: { x: 755, y: 180 },
    completedNoChange: { x: 755, y: 300 },
    issuingCredit: { x: 755, y: 540 },
    issuingCorrectedCdr: { x: 1105, y: 540 },
    propagatingCorrection: { x: 1105, y: 660 },
    completed: { x: 1105, y: 780 },
  },
};

export function stepPosition(step, index) {
  return GRAPH.positions[step.id] ?? {
    x: 55 + (Math.floor(index / 7) * 350),
    y: 60 + ((index % 7) * 120),
  };
}

/** Preserve the known presentation while placing added nodes without collisions. */
export function layoutWorkflow(definition) {
  const occupied = new Set();
  const positions = new Map();
  let next = 0;
  for (const step of definition.steps) {
    if (GRAPH.positions[step.id]) { const p = GRAPH.positions[step.id]; positions.set(step.id, p); occupied.add(`${p.x}:${p.y}`); }
  }
  for (const step of definition.steps) {
    if (positions.has(step.id)) continue;
    let p;
    do { p = { x: 55 + (Math.floor(next / 7) * 350), y: 60 + ((next % 7) * 120) }; next++; } while (occupied.has(`${p.x}:${p.y}`));
    positions.set(step.id, p); occupied.add(`${p.x}:${p.y}`);
  }
  const xs = [...positions.values()].map(p => p.x), ys = [...positions.values()].map(p => p.y);
  const width = Math.max(GRAPH.width, ...xs.map(x => x + GRAPH.nodeWidth + 75));
  const height = Math.max(GRAPH.height, ...ys.map(y => y + GRAPH.nodeHeight + 100));
  return { positions, width, height, bottomLane: height - 50 };
}

export function edgeGeometry(source, target, index, canvas = GRAPH) {
  const { nodeWidth, nodeHeight } = GRAPH;
  const { bottomLane } = canvas;
  const sx = source.x;
  const sy = source.y;
  const tx = target.x;
  const ty = target.y;
  const sourceCenter = sy + nodeHeight / 2;
  const targetCenter = ty + nodeHeight / 2;
  if (sx === tx && sy === ty) {
    const startY = sourceCenter - 11;
    const endY = sourceCenter + 13;
    const loopX = sx + nodeWidth + 42;
    return {
      d: `M ${sx + nodeWidth} ${startY} C ${loopX} ${startY - 25}, ${loopX} ${endY + 25}, ${sx + nodeWidth} ${endY}`,
      labelX: loopX + 4,
      labelY: sourceCenter + ((index % 3) - 1) * 11,
    };
  }
  if (sx === tx) {
    if (Math.abs(sy - ty) <= nodeHeight + 40) {
      const downward = ty > sy;
      const startY = downward ? sy + nodeHeight : sy;
      const endY = downward ? ty : ty + nodeHeight;
      return {
        d: `M ${sx + nodeWidth / 2} ${startY} V ${endY}`,
        labelX: sx + nodeWidth / 2,
        labelY: (startY + endY) / 2 + 3,
      };
    }
    const useRightGutter = sx + nodeWidth + 35 < canvas.width;
    const laneX = useRightGutter ? sx + nodeWidth + 35 : sx - 35;
    const startX = useRightGutter ? sx + nodeWidth : sx;
    const endX = useRightGutter ? tx + nodeWidth : tx;
    return {
      d: `M ${startX} ${sourceCenter} H ${laneX} V ${targetCenter} H ${endX}`,
      labelX: laneX,
      labelY: (sourceCenter + targetCenter) / 2 + ((index % 3) - 1) * 11,
    };
  }
  const forward = tx > sx;
  const adjacentColumn = Math.abs(tx - sx) <= nodeWidth + 150;
  if (forward && adjacentColumn) {
    const startX = sx + nodeWidth;
    const endX = tx;
    const laneX = (startX + endX) / 2;
    return {
      d: `M ${startX} ${sourceCenter} H ${laneX} V ${targetCenter} H ${endX}`,
      labelX: laneX,
      labelY: (sourceCenter + targetCenter) / 2 + ((index % 3) - 1) * 11,
    };
  }
  const startGutter = sx + nodeWidth + 35;
  const targetGutter = tx + nodeWidth + 35;
  const startX = sx + nodeWidth;
  const endX = tx + nodeWidth;
  return {
    d: `M ${startX} ${sourceCenter} H ${startGutter} V ${bottomLane} H ${targetGutter} V ${targetCenter} H ${endX}`,
    labelX: (startGutter + targetGutter) / 2,
    labelY: bottomLane - 8 - (index % 3) * 12,
  };
}

