import { fieldsFor, model } from "../model-utils.js";

const scalarControls = {
  string: "text",
  langString: "text",
  boolean: "checkbox",
  decimal: "decimal",
  integer: "number",
  positiveInteger: "number",
  nonNegativeInteger: "number",
  date: "date",
  dateTime: "datetime-local",
  time: "time",
  anyURI: "url",
};

function list(value) {
  return value === undefined ? [] : Array.isArray(value) ? value : [value];
}

function pathValue(value, path) {
  return String(path ?? "").split(".").filter(Boolean).reduce((current, key) => current?.[key], value);
}

/** Mask at render time so a raw context value cannot leak through a masked widget. */
export function maskSensitiveDisplayValue(value) {
  if (value === undefined || value === null || value === "") return "••••";
  const compact = String(value).replace(/\s/g, "");
  const hasExistingMask = /[•*]/.test(compact);
  const unmasked = compact.replace(/[•*]/g, "");
  if (!hasExistingMask && unmasked.length <= 4) return "••••";
  const suffix = unmasked.slice(-4);
  return suffix ? `•••• ${suffix}` : "••••";
}

function inferControl(field) {
  if (field.type === "enum") return "select";
  if (field.type === "object") return field.range === "EvidenceDocument" ? "evidence" : "reference";
  return scalarControls[field.range] ?? "text";
}

function compatibleControl(field, control, mode) {
  if (control === "display") return mode === "display";
  if (control === "masked") return mode === "display" && field.type === "datatype" && field.range === "string";
  if (control === "textarea") return field.type === "datatype" && field.range === "string";
  if (control === "money") return field.type === "datatype" && field.range === "decimal";
  if (control === "select") return field.type === "enum";
  if (control === "reference") return field.type === "object" && field.range !== "EvidenceDocument";
  if (control === "evidence") return field.type === "object" && field.range === "EvidenceDocument";
  return inferControl(field) === control;
}

function fieldIndex(className) {
  return new Map(fieldsFor(className).map((field) => [field.property, field]));
}

function resolveShapeError(field, profileField, mode) {
  const shape = profileField.shape ?? {};
  const control = profileField.control ?? inferControl(field);
  const fieldValueOptions = list(profileField.options);
  if (shape.minLength !== undefined && (!Number.isInteger(shape.minLength) || shape.minLength < 0)) {
    return `${profileField.id} has an invalid minimum length.`;
  }
  if (shape.maxLength !== undefined && (!Number.isInteger(shape.maxLength) || shape.maxLength < (shape.minLength ?? 0))) {
    return `${profileField.id} has an invalid maximum length.`;
  }
  if (shape.pattern !== undefined) {
    try { new RegExp(shape.pattern); } catch { return `${profileField.id} has an invalid pattern.`; }
  }
  if (shape.precision !== undefined && (!Number.isInteger(shape.precision) || shape.precision < 0 || shape.precision > 6)) {
    return `${profileField.id} has an invalid decimal precision.`;
  }
  if (shape.maxFrom !== undefined && (control !== "money" || typeof shape.maxFrom !== "string" || !shape.maxFrom.trim())) {
    return `${profileField.id} has an invalid contextual maximum; contextual maxima are supported on money controls.`;
  }
  if (control !== "money" && ["min", "max"].some((key) => shape[key] !== undefined && (typeof shape[key] !== "number" || !Number.isFinite(shape[key])))) {
    return `${profileField.id} numeric minimum and maximum must be finite numbers.`;
  }
  if (control !== "money" && shape.min !== undefined && shape.max !== undefined && shape.min > shape.max) {
    return `${profileField.id} has a minimum above its maximum.`;
  }
  if (mode === "input" && field.type === "object") {
    if (!fieldValueOptions.length) return `${profileField.id} must declare task-scoped reference options.`;
    if (fieldValueOptions.some((option) => option.class !== field.range || typeof option.id !== "string" || typeof option.label !== "string")) {
      return `${profileField.id} options must be references to ${field.range}.`;
    }
  }
  if (profileField.currencies !== undefined) {
    if (!Array.isArray(profileField.currencies) || profileField.currencies.some((currency) =>
      typeof currency.code !== "string" || !Number.isInteger(currency.minorUnitDigits) || currency.minorUnitDigits < 0 || currency.minorUnitDigits > 6
    )) return `${profileField.id} must declare valid currency and minor-unit metadata.`;
  }
  if (profileField.control === "money" && !profileField.currencies?.length) {
    return `${profileField.id} money control must declare allowed currencies.`;
  }
  if (profileField.control === "money" && profileField.currencies?.length) {
    const precision = Math.min(Math.max(...profileField.currencies.map((currency) => currency.minorUnitDigits)), shape.precision ?? 6);
    if (shape.min !== undefined && parseMinorUnits(shape.min, precision) === null) return `${profileField.id} has an invalid minimum money amount.`;
    if (shape.max !== undefined && parseMinorUnits(shape.max, precision) === null) return `${profileField.id} has an invalid maximum money amount.`;
    if (shape.min !== undefined && shape.max !== undefined && parseMinorUnits(shape.min, precision) > parseMinorUnits(shape.max, precision)) {
      return `${profileField.id} has a minimum money amount above its maximum.`;
    }
  }
  return null;
}

/** Compile a small form from a pinned workflow HumanTask and ontology bindings. */
export function compileTaskForm({ definition, profile, principal }) {
  const errors = [];
  if (typeof profile?.id !== "string" || !profile.id.trim()) errors.push("Form profile id is required.");
  if (typeof profile?.version !== "string" || !profile.version.trim()) errors.push("Form profile version is required.");
  if (typeof profile?.role !== "string" || !profile.role.trim()) errors.push("Form profile role is required.");
  if (profile?.correlationPath !== undefined && (typeof profile.correlationPath !== "string" || !profile.correlationPath.trim())) errors.push("Form profile correlation path must be a non-empty context path.");
  if (!definition || definition.id !== profile?.workflowId || definition.version !== profile?.workflowVersion) {
    errors.push("Form profile must match the pinned workflow id and version.");
  }
  const step = definition?.steps?.find((candidate) => candidate.id === profile?.stepId);
  if (!step || step.kind !== "humanTask") errors.push("Form profile must bind to a declared HumanTask step.");
  if (!step?.taskFormProfile || step.taskFormProfile.id !== profile?.id || step.taskFormProfile.version !== profile?.version) {
    errors.push("Form profile id and version must match the version pinned by the HumanTask.");
  }
  if (step && step.assigneeRole !== profile.role) errors.push("Form profile role must match the HumanTask assignee role.");
  if (!Array.isArray(profile?.fields) || profile.fields.length === 0) errors.push("Form profile must declare task-scoped fields.");
  if (!Array.isArray(profile?.outcomes) || !profile.outcomes.length) errors.push("Form profile must declare at least one workflow outcome.");

  const seenIds = new Set();
  const fields = (profile?.fields ?? []).map((entry) => {
    if (!entry || typeof entry.id !== "string" || !entry.id.trim()) {
      errors.push("Every task field must have an id.");
      return null;
    }
    if (seenIds.has(entry.id)) errors.push(`Duplicate task field '${entry.id}'.`);
    seenIds.add(entry.id);
    const field = typeof entry.binding?.class === "string" && Object.hasOwn(model.classes, entry.binding.class) && typeof entry.binding?.property === "string"
      ? fieldIndex(entry.binding.class).get(entry.binding.property)
      : null;
    if (!field) {
      errors.push(`${entry.id} must bind to a field in the declared ontology class.`);
      return null;
    }
    const mode = entry.mode ?? "input";
    if (!["input", "display"].includes(mode)) errors.push(`${entry.id} mode must be input or display.`);
    if (mode === "display" && entry.shape) errors.push(`${entry.id} display fields cannot define input constraints.`);
    const control = entry.control ?? (mode === "display" ? "display" : inferControl(field));
    if (typeof entry.label !== "string" || !entry.label.trim()) errors.push(`${entry.id} must have a display label.`);
    if (!compatibleControl(field, control, mode)) errors.push(`${entry.id} control '${control}' is incompatible with ontology range '${field.range}'.`);
    if (mode === "display" && !["display", "masked"].includes(control)) errors.push(`${entry.id} display fields must use a display or safe masked control.`);
    if (mode === "display" && (typeof entry.valuePath !== "string" || !entry.valuePath.trim())) errors.push(`${entry.id} display fields must declare a workflow context value path.`);
    if (entry.sensitive && (mode !== "display" || control !== "masked")) errors.push(`${entry.id} sensitive fields must be read-only and masked.`);
    const profileError = resolveShapeError(field, entry, mode);
    if (profileError) errors.push(profileError);
    if (mode === "input" && entry.sensitive) errors.push(`${entry.id} sensitive fields cannot be submitted by this form engine.`);
    return {
      ...entry,
      mode,
      activeOn: list(entry.activeOn),
      binding: { ...entry.binding, range: field.range, fieldType: field.type, cardinality: field.cardinality },
      allowedValues: list(field.values),
      control,
      options: list(entry.options),
      required: entry.shape?.required === true || list(entry.shape?.requiredOn).length > 0,
    };
  }).filter(Boolean);
  const declaredOutcomes = new Set((profile?.outcomes ?? []).map((outcome) => outcome?.eventType).filter(Boolean));
  for (const field of fields) {
    for (const eventType of [...field.activeOn, ...list(field.shape?.requiredOn)]) {
      if (!declaredOutcomes.has(eventType)) errors.push(`${field.id} references undeclared task outcome '${eventType}'.`);
    }
    for (const eventType of list(field.shape?.requiredOn)) {
      if (field.activeOn.length && !field.activeOn.includes(eventType)) errors.push(`${field.id} is required on '${eventType}' but inactive for that outcome.`);
    }
  }

  const outcomes = (profile?.outcomes ?? []).map((outcome) => {
    if (!outcome || typeof outcome.eventType !== "string" || typeof outcome.label !== "string") {
      errors.push("Every task outcome must have an event type and label.");
      return null;
    }
    if (!step?.on?.[outcome.eventType]) errors.push(`Outcome '${outcome.eventType}' is not declared on the bound HumanTask.`);
    return outcome;
  }).filter(Boolean);
  if (new Set(outcomes.map((outcome) => outcome.eventType)).size !== outcomes.length) errors.push("Task outcomes must have unique event types.");

  if (errors.length) throw new Error(`Invalid task form profile:\n- ${[...new Set(errors)].join("\n- ")}`);
  return Object.freeze({
    id: profile.id,
    version: profile.version,
    workflowId: profile.workflowId,
    workflowVersion: profile.workflowVersion,
    stepId: profile.stepId,
    role: profile.role,
    correlationPath: profile.correlationPath ?? null,
    fields,
    outcomes,
    principal: principal ?? null,
  });
}

function parseMinorUnits(value, precision) {
  const raw = String(value ?? "").trim();
  const match = raw.match(/^(-?)(0|[1-9]\d*)(?:\.(\d+))?$/);
  if (!match) return null;
  const fraction = match[3] ?? "";
  if (fraction.length > precision) return null;
  const magnitude = BigInt(match[2]) * (10n ** BigInt(precision)) + BigInt((fraction + "0".repeat(precision)).slice(0, precision) || "0");
  return match[1] === "-" ? -magnitude : magnitude;
}

function taskRequired(field, eventType) {
  const shape = field.shape ?? {};
  return shape.required === true || list(shape.requiredOn).includes(eventType);
}

function isEmptyValue(field, value) {
  if (value === undefined || value === null || value === "") return true;
  return field.control === "money" && typeof value === "object" && (value.amount === undefined || value.amount === null || String(value.amount).trim() === "");
}

function validateField(field, value, eventType, context) {
  const shape = field.shape ?? {};
  if (field.mode !== "input") return [];
  if (field.activeOn.length && !field.activeOn.includes(eventType)) return [];
  if (isEmptyValue(field, value)) return taskRequired(field, eventType) ? [`${field.label} is required for this outcome.`] : [];
  if (field.control === "textarea" || field.control === "text") {
    const text = String(value);
    if (shape.minLength !== undefined && text.trim().length < shape.minLength) return [`${field.label} must contain at least ${shape.minLength} characters.`];
    if (shape.maxLength !== undefined && text.length > shape.maxLength) return [`${field.label} must contain no more than ${shape.maxLength} characters.`];
    if (shape.pattern && !(new RegExp(shape.pattern).test(text))) return [`${field.label} does not match the required format.`];
    return [];
  }
  if (field.binding.fieldType === "enum" && !field.allowedValues.includes(value)) return [`Choose a valid ${field.label.toLowerCase()}.`];
  if (field.control === "evidence" || field.control === "reference") {
    if (!field.options.some((option) => option.id === value)) return [`Select a ${field.binding.range} from the task's permitted references.`];
    return [];
  }
  if (field.control === "money") {
    if (!value || typeof value !== "object") return [`Enter ${field.label.toLowerCase()} as an amount and currency.`];
    const currency = field.currencies.find((option) => option.code === value.currency);
    if (!currency) return [`Choose a permitted currency for ${field.label.toLowerCase()}.`];
    const precision = Math.min(currency.minorUnitDigits, shape.precision ?? currency.minorUnitDigits);
    const amount = parseMinorUnits(value.amount, precision);
    if (amount === null) return [`Enter a valid ${currency.code} amount with no more than ${precision} decimal places.`];
    const min = shape.min === undefined ? null : parseMinorUnits(shape.min, precision);
    const maxRaw = shape.maxFrom ? pathValue(context, shape.maxFrom) : shape.max;
    if (shape.maxFrom && (maxRaw === undefined || maxRaw === null)) return [`${field.label} cannot be checked because the calculated adjustment ceiling is unavailable.`];
    const max = maxRaw === undefined || maxRaw === null ? null : parseMinorUnits(maxRaw, precision);
    if (min !== null && amount < min) return [`${field.label} must be at least ${shape.min} ${currency.code}.`];
    if (maxRaw !== undefined && maxRaw !== null && (max === null || amount > max)) {
      const shownMax = typeof maxRaw === "number" ? maxRaw.toFixed(precision) : String(maxRaw);
      return [`${field.label} cannot exceed the calculated ${shownMax} ${currency.code} adjustment.`];
    }
    return [];
  }
  if (["decimal", "number"].includes(field.control)) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return [`Enter a valid number for ${field.label.toLowerCase()}.`];
    if (["integer", "positiveInteger", "nonNegativeInteger"].includes(field.binding.range) && !Number.isInteger(parsed)) {
      return [`${field.label} must be a whole number.`];
    }
    if (field.binding.range === "positiveInteger" && parsed <= 0) return [`${field.label} must be greater than zero.`];
    if (field.binding.range === "nonNegativeInteger" && parsed < 0) return [`${field.label} cannot be negative.`];
    if (shape.min !== undefined && parsed < Number(shape.min)) return [`${field.label} must be at least ${shape.min}.`];
    if (shape.max !== undefined && parsed > Number(shape.max)) return [`${field.label} must be no more than ${shape.max}.`];
    return [];
  }
  if (field.control === "checkbox" && typeof value !== "boolean") return [`${field.label} must be true or false.`];
  if (field.control === "date" && (!/^\d{4}-\d{2}-\d{2}$/.test(String(value)) || Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)) || new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) !== String(value))) {
    return [`Enter a valid ${field.label.toLowerCase()}.`];
  }
  if (field.control === "datetime-local" && (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(String(value)) || Number.isNaN(Date.parse(String(value))))) {
    return [`Enter a valid ${field.label.toLowerCase()}.`];
  }
  if (field.control === "time") {
    const match = String(value).match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (!match || Number(match[1]) > 23 || Number(match[2]) > 59 || Number(match[3] ?? 0) > 59) return [`Enter a valid ${field.label.toLowerCase()}.`];
  }
  if (field.control === "url") {
    try { new URL(String(value)); } catch { return [`Enter a valid ${field.label.toLowerCase()}.`]; }
  }
  return [];
}

/** Validate only task-authorized fields and event-specific requirements. */
export function validateTaskSubmission({ form, eventType, values, context }) {
  const errors = [];
  if (!values || typeof values !== "object" || Array.isArray(values)) errors.push("Task inputs must be a structured object.");
  const submittedValues = values && typeof values === "object" && !Array.isArray(values) ? values : {};
  if (!form.outcomes.some((outcome) => outcome.eventType === eventType)) errors.push("This outcome is not allowed by the task contract.");
  const allowed = new Set(form.fields.filter((field) => field.mode === "input").map((field) => field.id));
  for (const key of Object.keys(submittedValues)) if (!allowed.has(key)) errors.push(`Field '${key}' is outside this task's editable scope.`);
  for (const field of form.fields) errors.push(...validateField(field, submittedValues[field.id], eventType, context));
  return [...new Set(errors)];
}

/** Create an editable value map with useful defaults for the shared renderer. */
export function createInitialTaskValues(form) {
  return Object.fromEntries(form.fields
    .filter((field) => field.mode === "input")
    .map((field) => [field.id, field.control === "checkbox"
      ? false
      : field.control === "money"
        ? { amount: "", currency: field.currencies[0]?.code ?? "" }
        : ""]));
}

/** Return only the editable values active for the selected workflow outcome. */
export function valuesForTaskOutcome(form, eventType, values = {}) {
  const payload = {};
  for (const field of form.fields) {
    if (field.mode !== "input" || isEmptyValue(field, values[field.id])) continue;
    if (field.activeOn.length && !field.activeOn.includes(eventType)) continue;
    payload[field.id] = values[field.id];
  }
  return payload;
}
