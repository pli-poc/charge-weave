import { createActor, fromPromise, setup } from "xstate";
import { clone } from "./core.js";

const STEP_KINDS = new Set(["eventWait", "serviceTask", "decision", "humanTask", "end"]);

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function refs(value, path, errors) {
  if (typeof value === "string") return [value];
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) return value;
  errors.push(`${path} must name one or more registered capabilities.`);
  return [];
}

function checkRefs(value, path, registry, kind, errors) {
  for (const id of refs(value, path, errors)) {
    if (typeof registry[kind][id] !== "function") errors.push(`${path} references unknown ${kind.slice(0, -1)} '${id}'.`);
  }
}

function checkActions(value, path, registry, errors) {
  for (const id of refs(value, path, errors)) {
    if (!Object.hasOwn(registry.actions, id)) errors.push(`${path} references unknown action '${id}'.`);
  }
}

function checkJsonData(value, path, errors, seen = new WeakSet()) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) errors.push(`${path} must contain only finite JSON numbers.`);
    return;
  }
  if (typeof value !== "object") {
    errors.push(`${path} contains non-JSON data; definitions must not contain executable code.`);
    return;
  }
  if (seen.has(value)) {
    errors.push(`${path} contains a cyclic reference; definitions must be serializable.`);
    return;
  }
  if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) {
    errors.push(`${path} must contain plain JSON objects.`);
    return;
  }
  seen.add(value);
  if (Array.isArray(value)) value.forEach((item, index) => checkJsonData(item, `${path}[${index}]`, errors, seen));
  else for (const [key, nested] of Object.entries(value)) checkJsonData(nested, `${path}.${key}`, errors, seen);
  seen.delete(value);
}

function validateTarget(target, path, stepIds, errors) {
  if (typeof target !== "string" || !target.trim()) errors.push(`${path} must name a target step.`);
  else if (!stepIds.has(target)) errors.push(`${path} references unknown step '${target}'.`);
}

export function validateWorkflowDefinition(definition, registry = {}) {
  const normalizedRegistry = {
    activities: registry.activities ?? {},
    guards: registry.guards ?? {},
    actions: registry.actions ?? {},
    delays: registry.delays ?? {},
  };
  const errors = [];
  checkJsonData(definition, "definition", errors);
  if (!isObject(definition)) return ["definition must be an object."];
  if (typeof definition.id !== "string" || !definition.id.trim()) errors.push("definition.id is required.");
  if (typeof definition.version !== "string" || !definition.version.trim()) errors.push("definition.version is required.");
  if (!Array.isArray(definition.steps) || !definition.steps.length) {
    errors.push("definition.steps must contain at least one step.");
    return [...new Set(errors)];
  }
  const stepIds = new Set();
  for (const [index, step] of definition.steps.entries()) {
    if (!isObject(step)) {
      errors.push(`definition.steps[${index}] must be an object.`);
      continue;
    }
    if (typeof step.id !== "string" || !step.id.trim()) errors.push(`definition.steps[${index}].id is required.`);
    else if (stepIds.has(step.id)) errors.push(`definition.steps contains duplicate id '${step.id}'.`);
    else stepIds.add(step.id);
    if (!STEP_KINDS.has(step.kind)) errors.push(`definition.steps[${index}].kind must be one of ${[...STEP_KINDS].join(", ")}.`);
  }
  if (typeof definition.initialStep !== "string" || !stepIds.has(definition.initialStep)) {
    errors.push("definition.initialStep must name a declared step.");
  }

  for (const step of definition.steps) {
    if (!isObject(step) || typeof step.id !== "string") continue;
    const path = `step '${step.id}'`;
    const transition = (value, transitionPath) => {
      if (!isObject(value)) {
        errors.push(`${transitionPath} must be a transition object.`);
        return;
      }
      validateTarget(value.target, `${transitionPath}.target`, stepIds, errors);
      if (value.actions !== undefined) checkActions(value.actions, `${transitionPath}.actions`, normalizedRegistry, errors);
    };

    if (step.kind === "eventWait" || step.kind === "humanTask") {
      if (!isObject(step.on) || !Object.keys(step.on).length) errors.push(`${path}.on must declare at least one event transition.`);
      else for (const [eventType, target] of Object.entries(step.on)) {
        if (!eventType.trim()) errors.push(`${path}.on contains an empty event name.`);
        transition(target, `${path}.on['${eventType}']`);
      }
    }
    if (step.kind === "serviceTask") {
      if (typeof step.activity !== "string" || typeof normalizedRegistry.activities[step.activity] !== "function") {
        errors.push(`${path}.activity must name a registered activity.`);
      }
      transition(step.onDone, `${path}.onDone`);
      transition(step.onError, `${path}.onError`);
    }
    if (step.kind === "decision") {
      if (!Array.isArray(step.routes) || !step.routes.length) errors.push(`${path}.routes must contain at least one guarded route.`);
      else for (const [index, route] of step.routes.entries()) {
        if (!isObject(route)) {
          errors.push(`${path}.routes[${index}] must be an object.`);
          continue;
        }
        checkRefs(route.guard, `${path}.routes[${index}].guard`, normalizedRegistry, "guards", errors);
        validateTarget(route.target, `${path}.routes[${index}].target`, stepIds, errors);
        if (route.actions !== undefined) checkActions(route.actions, `${path}.routes[${index}].actions`, normalizedRegistry, errors);
      }
      validateTarget(step.defaultTarget, `${path}.defaultTarget`, stepIds, errors);
    }
    if (step.timeout !== undefined) {
      if (!isObject(step.timeout)) errors.push(`${path}.timeout must be an object.`);
      else {
        if (typeof step.timeout.after !== "string" || typeof normalizedRegistry.delays[step.timeout.after] !== "function") {
          errors.push(`${path}.timeout.after must name a registered delay.`);
        }
        validateTarget(step.timeout.target, `${path}.timeout.target`, stepIds, errors);
        if (step.timeout.actions !== undefined) checkActions(step.timeout.actions, `${path}.timeout.actions`, normalizedRegistry, errors);
      }
    }
    if (step.domainBindings !== undefined && (!Array.isArray(step.domainBindings) || step.domainBindings.some((value) => typeof value !== "string"))) {
      errors.push(`${path}.domainBindings must be an array of ontology identifiers.`);
    }
  }
  return [...new Set(errors)];
}

function createMachineConfig(definition) {
  const states = {};
  for (const step of definition.steps) {
    const config = {};
    if (step.kind === "eventWait" || step.kind === "humanTask") {
      config.on = Object.fromEntries(Object.entries(step.on).map(([eventType, transition]) => [eventType, {
        target: transition.target,
        ...(transition.actions === undefined ? {} : { actions: transition.actions }),
      }]));
    }
    if (step.kind === "serviceTask") {
      config.invoke = {
        src: step.activity,
        input: ({ context, event }) => ({ context: clone(context ?? {}), event: clone(event ?? {}) }),
        onDone: { target: step.onDone.target, ...(step.onDone.actions === undefined ? {} : { actions: step.onDone.actions }) },
        onError: { target: step.onError.target, ...(step.onError.actions === undefined ? {} : { actions: step.onError.actions }) },
      };
    }
    if (step.kind === "decision") {
      config.always = [
        ...step.routes.map((route) => ({
          guard: route.guard,
          target: route.target,
          ...(route.actions === undefined ? {} : { actions: route.actions }),
        })),
        { target: step.defaultTarget },
      ];
    }
    if (step.timeout) {
      config.after = {
        [step.timeout.after]: {
          target: step.timeout.target,
          ...(step.timeout.actions === undefined ? {} : { actions: step.timeout.actions }),
        },
      };
    }
    if (step.kind === "end") config.type = "final";
    states[step.id] = config;
  }
  return {
    id: definition.id,
    version: definition.version,
    initial: definition.initialStep,
    context: ({ input }) => ({ ...clone(definition.initialContext ?? {}), ...clone(input?.context ?? {}) }),
    states,
  };
}

export function createFlowRuntime(registry = {}) {
  const normalizedRegistry = {
    activities: registry.activities ?? {},
    guards: registry.guards ?? {},
    actions: registry.actions ?? {},
    delays: registry.delays ?? {},
  };
  const actorLogic = Object.fromEntries(
    Object.entries(normalizedRegistry.activities).map(([id, activity]) => [
      id,
      fromPromise(async ({ input }) => {
        const output = await activity(clone(input ?? {}));
        return output === undefined ? null : clone(output);
      }),
    ]),
  );

  function compile(definition) {
    const errors = validateWorkflowDefinition(definition, normalizedRegistry);
    if (errors.length) throw new Error(`Invalid workflow definition:\n- ${errors.join("\n- ")}`);
    return setup({
      actors: actorLogic,
      guards: normalizedRegistry.guards,
      actions: normalizedRegistry.actions,
      delays: normalizedRegistry.delays,
    }).createMachine(createMachineConfig(definition));
  }

  return {
    compile,
    createActor(definition, { context = {}, snapshot, clock } = {}) {
      const machine = compile(definition);
      const options = { input: { context } };
      if (snapshot !== undefined) options.snapshot = snapshot;
      if (clock !== undefined) options.clock = clock;
      return createActor(machine, options);
    },
    validate: (definition) => validateWorkflowDefinition(definition, normalizedRegistry),
  };
}
