function values(value) {
  return value === undefined ? [] : Array.isArray(value) ? value : [value];
}

function refName(value) {
  const raw = typeof value === "string" ? value : value?.["@id"];
  if (typeof raw !== "string") return "";
  if (raw.startsWith("#")) return raw.slice(1);
  if (raw.includes("#")) return raw.slice(raw.lastIndexOf("#") + 1);
  return raw.split(/[/:]/).filter(Boolean).at(-1) ?? raw;
}

function typeName(step) {
  const types = values(step["@type"]);
  const type = types.find((candidate) => typeof candidate === "string" && candidate.startsWith("xflow:"));
  return type?.slice("xflow:".length) ?? "";
}

function namedActions(actionRefs) {
  const names = values(actionRefs).map(refName).filter(Boolean);
  return names.length === 0 ? undefined : names.length === 1 ? names[0] : names;
}

function transitionFrom(node) {
  return {
    target: refName(node.targetStep),
    ...(node.actionRef === undefined ? {} : { actions: namedActions(node.actionRef) }),
  };
}

export function normaliseWorkflowProfile(jsonLd) {
  const graph = jsonLd?.["@graph"];
  if (!Array.isArray(graph)) throw new Error("XFlow profile must contain a JSON-LD @graph.");
  const root = graph.find((node) => values(node["@type"]).includes("xflow:WorkflowDefinition"));
  if (!root) throw new Error("XFlow profile is missing xflow:WorkflowDefinition.");
  const stepIndex = new Map(graph.filter((node) => node.stepKey).map((node) => [refName(node["@id"]), node]));
  const referencedSteps = values(root.hasStep).map(refName);
  const steps = referencedSteps.map((stepId) => {
    const source = stepIndex.get(stepId);
    if (!source) return { id: stepId, kind: "missing" };
    const common = {
      id: refName(source["@id"]),
      kind: ({ EventWait: "eventWait", ServiceTask: "serviceTask", Decision: "decision", HumanTask: "humanTask", EndStep: "end" })[typeName(source)] ?? "unknown",
      label: source.label,
      description: source.description,
      ...(source.domainBinding === undefined ? {} : { domainBindings: values(source.domainBinding).map(refName) }),
    };
    if (common.kind === "eventWait" || common.kind === "humanTask") {
      common.on = Object.fromEntries(values(source.onEvent).map((eventTransition) => [eventTransition.eventType, transitionFrom(eventTransition)]));
    }
    if (common.kind === "serviceTask") {
      common.activity = refName(source.activityRef);
      common.onDone = transitionFrom(source.onSuccess ?? {});
      common.onError = transitionFrom(source.onFailure ?? {});
    }
    if (common.kind === "decision") {
      common.routes = values(source.route)
        .sort((left, right) => Number(left.priority ?? 0) - Number(right.priority ?? 0))
        .map((route) => ({ guard: refName(route.guardRef), target: refName(route.targetStep) }));
      common.defaultTarget = refName(source.defaultTarget);
    }
    if (source.timeoutAfter !== undefined) {
      common.timeout = {
        after: refName(source.timeoutAfter),
        event: source.timeoutEvent,
        target: refName(source.timeoutTarget),
      };
      const timeoutActions = namedActions(source.timeoutAction);
      const timeoutTransition = common.on?.[source.timeoutEvent];
      if (timeoutActions !== undefined && timeoutTransition) {
        const actions = [...new Set([
          ...values(timeoutTransition.actions),
          ...values(timeoutActions),
        ])];
        common.on[source.timeoutEvent] = {
          ...timeoutTransition,
          actions: actions.length === 1 ? actions[0] : actions,
        };
      }
    }
    if (source.assigneeRole !== undefined) common.assigneeRole = refName(source.assigneeRole);
    if (source.taskFormProfileId !== undefined || source.taskFormProfileVersion !== undefined) {
      common.taskFormProfile = { id: source.taskFormProfileId, version: source.taskFormProfileVersion };
    }
    return common;
  });

  const jsonContext = root.initialContext?.["@value"] ?? {};
  return {
    id: root.workflowId,
    version: root.workflowVersion,
    processKind: refName(root.processKind),
    journeyReferences: values(root.journeyReference),
    processRecords: {
      execution: refName(root.executionRecordClass),
      step: refName(root.stepRecordClass),
      transition: refName(root.transitionRecordClass),
    },
    ontologyBindings: values(root.domainBinding).map(refName),
    initialStep: refName(root.initialStep),
    initialContext: jsonContext,
    steps,
  };
}

