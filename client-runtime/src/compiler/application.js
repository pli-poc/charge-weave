import { buildSchema, validateSchema } from "graphql";
import { normaliseWorkflowProfile } from "../flow/normalize.js";
export function compileApplicationBody({
  catalog,
  api,
  task,
  commands,
  capabilities,
  flow,
  analytics,
  inputDigest,
  namespace,
  tasks,
  modules = { analytics: true, temporal: true },
}) {
  if (typeof namespace !== "string" || !/^[a-z][a-z0-9+.-]*:/i.test(namespace)) throw Error("Explicit application namespace required");
  const taskList = tasks ?? [task.task];
  if (!Array.isArray(taskList) || !taskList.length || new Set(taskList.map(t => t.id)).size !== taskList.length) throw Error("Unique application tasks required");
  const taskFields = taskList.flatMap(t => t.form.fields);
  const names = new Set();
  for (const t of api.types) {
    if (!catalog[t.class]) throw Error(`Unknown class ${t.class}`);
    if (!/^[_A-Za-z][_0-9A-Za-z]*$/.test(t.name) || names.has(t.name))
      throw Error(`Type collision ${t.name}`);
    names.add(t.name);
    const fields = new Set();
    for (const f of t.fields) {
      if (fields.has(f.name)) throw Error(`Field collision ${f.name}`);
      fields.add(f.name);
      if (!f.binding.startsWith("projection:"))
        throw Error(`Unresolved binding ${f.binding}`);
    }
  }
  for (const c of commands.commands) {
    if (!catalog[c.class]) throw Error(`Unknown class ${c.class}`);
    if (!capabilities.handlers.includes(c.handler))
      throw Error(`Unknown handler ${c.handler}`);
    for (const id of c.requiredRules)
      if (!capabilities.rules.includes(id))
        throw Error(`Unsupported required rule ${id}`);
  }
  for (const f of taskFields) {
    if (
      f.binding?.kind !== "commandInput" ||
      !commands.commands
        .find((c) => c.id === f.binding.command)
        ?.inputs.includes(f.id)
    )
      throw Error(`Unresolved task input ${f.id}`);
    if (!f.concept.startsWith("command:")) {
      const [className, property] = f.concept.split(".");
      let current = catalog[className],
        field;
      while (current && !field) {
        field = current.fields.find((p) => p.property === property);
        current = catalog[current.parent];
      }
      if (!field) throw Error(`Unknown property ${f.concept}`);
    }
  }
  for (const command of commands.commands) {
    for (const required of command.requiredInputs ?? []) {
      if (
        !taskFields.some(
          (f) =>
            f.id === required && f.required && f.binding.command === command.id,
        )
      )
        throw Error(`Weakened required input ${required}`);
    }
  }
  const schema = `scalar JSON\nscalar Decimal\nscalar DateTime\nscalar IRI\nscalar BigInteger\n${api.types.map((t) => `type ${t.name} { ${t.fields.map((f) => `${f.name}: ${f.type}`).join("\n")} }`).join("\n")}
 type Violation { ruleId: String!, field: String, message: String! }
 type Task { id: ID!, revision: Int!, status: String!, stage: String!, descriptor: JSON!, values: JSON!, outcome: JSON, flowState: String! }
 type CommandResult { accepted: Boolean!, code: String!, revision: Int!, violations: [Violation!]!, task: Task! }
 ${commands.commands
   .map(
     (c) =>
       `input ${c.inputType} { ${taskFields
         .filter((f) => f.binding.command === c.id)
         .map(
           (f) =>
             `${f.id}: ${f.datatype === "decimal" ? "Decimal" : "String"}${f.required ? "!" : ""}`,
         )
         .join("\n")} }`,
   )
   .join("\n")}
 input FilterInput { dimension: String!, operator: String!, values: [String!]!, stage: String!, datatype: String! }
 input TimeInput { start: DateTime!, end: DateTime!, knownAt: DateTime!, timezone: String!, bucket: String! }
 input WindowInput { start: DateTime!, end: DateTime! }
 input ComparisonInput { kind: String!, window: WindowInput, target: Float }
 input RankingInput { by: String!, direction: String!, limit: Int!, ties: String! }
 input HavingInput { operator: String!, value: Float! }
 input AnalyticsInput { subject: String!, measure: String!, dimension: String, filters: [FilterInput!]!, time: TimeInput!, comparison: ComparisonInput!, operator: String!, ranking: RankingInput!, having: HavingInput }
 type AnalyticsRow { key: String, label: String, value: Float, numerator: Float, denominator: Float, count: Int, reference: Float, change: Float, percentChange: Float }
 type AnalyticsResult { rows: [AnalyticsRow!]!, total: AnalyticsRow!, totalGroups: Int!, field: String!, evidence: JSON!, measure: JSON!, dimension: JSON, query: JSON! }
 type TemporalResult { state: String!, price: Decimal, commit: JSON, slice: JSON }
 type Query { ${api.operations.map((o) => `${o.name}: ${o.type}`).join("\n")} ${tasks ? "tasks: [Task!]!, task(id: ID!): Task!" : "task: Task!"}, metadata: JSON!${modules.analytics ? ", analytics(input: AnalyticsInput!): AnalyticsResult!" : ""}${modules.temporal ? ", temporal(validAt: String!, knownAt: String!): TemporalResult!" : ""} }
 type Mutation { ${commands.commands.map((c) => `${c.id}(input: ${c.inputType}!, expectedRevision: Int!, idempotencyKey: String!): CommandResult!`).join("\n")} }
 `;
  const errors = validateSchema(buildSchema(schema));
  if (errors.length) throw errors[0];
  const referencedClasses = new Set([
    ...api.types.map((t) => t.class),
    ...commands.commands.map((c) => c.class),
  ]);
  for (const name of referencedClasses) {
    const parent = catalog[name]?.parent;
    if (parent) referencedClasses.add(parent);
  }
  const runtimeModel = Object.fromEntries(
    [...referencedClasses]
      .sort()
      .map((name) => [
        name,
        { iri: namespace + name, ...catalog[name] },
      ]),
  );
  const body = {
    schema,
    runtimeModel,
    api,
    ...(tasks ? { tasks, namespace, modules } : { task }),
    commands,
    capabilities,
    flow: normaliseWorkflowProfile(flow),
    analytics,
    inputDigest,
    contractVersion: "1.0.0",
    compilerVersion: "1.0.0",
  };
  return body;
}
