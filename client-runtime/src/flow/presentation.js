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
