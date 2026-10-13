import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { buildSchema, validateSchema } from "graphql";
import { normaliseWorkflowProfile } from "../src/flow/normalize.js";
const root = fileURLToPath(new URL("../../", import.meta.url));
const read = (p) => readFileSync(resolve(root, p), "utf8");
const json = (p) => JSON.parse(read(p));
const stable = (v) =>
  JSON.stringify(v, (_, x) =>
    x && typeof x === "object" && !Array.isArray(x)
      ? Object.fromEntries(
          Object.keys(x)
            .sort()
            .map((k) => [k, x[k]]),
        )
      : x,
  );
const hash = (v) =>
  createHash("sha256")
    .update(typeof v === "string" ? v : stable(v))
    .digest("hex");
export function compileApplication({
  catalog,
  api,
  task,
  commands,
  capabilities,
  flow,
  analytics,
  inputDigest,
}) {
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
  for (const f of task.task.form.fields) {
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
        !task.task.form.fields.some(
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
       `input ${c.inputType} { ${task.task.form.fields
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
 type Query { ${api.operations.map((o) => `${o.name}: ${o.type}`).join("\n")} task: Task!, metadata: JSON!, analytics(input: AnalyticsInput!): AnalyticsResult!, temporal(validAt: String!, knownAt: String!): TemporalResult! }
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
        { iri: "https://example.org/charge-domain#" + name, ...catalog[name] },
      ]),
  );
  const body = {
    schema,
    runtimeModel,
    api,
    task,
    commands,
    capabilities,
    flow: normaliseWorkflowProfile(flow),
    analytics,
    inputDigest,
    contractVersion: "1.0.0",
    compilerVersion: "1.0.0",
  };
  return { ...body, digest: hash(body) };
}
function files(dir) {
  return readdirSync(resolve(root, dir), { withFileTypes: true })
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
    .flatMap((e) =>
      e.isDirectory() ? files(dir + "/" + e.name) : [dir + "/" + e.name],
    );
}
if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  const inputs = [
    "model/catalog.json",
    "model/domain.schema",
    "model/client-api-profile.json",
    "model/client-task-profile.json",
    "model/client-command-profile.json",
    "model/client-capabilities.json",
    "model/analytics-profile.json",
    "model/analytics-rules.json",
    "model/rules.json",
    "model/audit-rules.json",
    "model/temporal-policy.json",
    "xflow/charge-correction.profile.json",
    "client-runtime/package-lock.json",
    "client-runtime/scripts/build-package.mjs",
    "model/temporal-example.json",
    "console-app/src/analytics/fixture.js",
    "console-app/src/data.js",
    ...files("client-runtime/src"),
    ...readdirSync(resolve(root, "validation"))
      .sort()
      .filter((x) => x.endsWith(".ttl"))
      .map((x) => "validation/" + x),
  ];
  const options = {
    catalog: json(inputs[0]),
    api: json(inputs[2]),
    task: json(inputs[3]),
    commands: json(inputs[4]),
    capabilities: json(inputs[5]),
    flow: json("xflow/charge-correction.profile.json"),
    analytics: json("model/analytics-profile.json"),
    inputDigest: hash(inputs.map((path) => [path, hash(read(path))])),
  };
  const pkg = compileApplication(options);
  if (stable(pkg) !== stable(compileApplication(options)))
    throw Error("Nondeterministic generation");
  const out = resolve(root, "client-runtime/generated");
  mkdirSync(out, { recursive: true });
  const outputs = {
    "application.json": stable(pkg) + "\n",
    "schema.graphql": pkg.schema,
    "api-bindings.json": stable(pkg.api) + "\n",
    "runtime-model.json": stable(pkg.runtimeModel) + "\n",
    "flows.json": stable(pkg.flow) + "\n",
    "task-descriptors.json": stable(pkg.task.task) + "\n",
    "analytics-descriptors.json": stable(pkg.analytics) + "\n",
    "capabilities.json": stable(pkg.capabilities) + "\n",
    "rule-support.json":
      stable(
        json("model/rules.json").map((rule) => ({
          id: rule.id,
          status: "reference-only",
          relatedBrowserChecks: Object.entries(pkg.capabilities.ruleSources)
            .filter(([, ids]) => ids.includes(rule.id))
            .map(([id]) => id),
        })),
      ) + "\n",
    "manifest.json":
      stable({
        digest: pkg.digest,
        inputDigest: pkg.inputDigest,
        contractVersion: pkg.contractVersion,
      }) + "\n",
  };
  outputs["manifest.json"] =
    stable({
      digest: pkg.digest,
      inputDigest: pkg.inputDigest,
      contractVersion: pkg.contractVersion,
      compilerVersion: pkg.compilerVersion,
      artifacts: Object.fromEntries(
        Object.entries(outputs)
          .filter(([name]) => name !== "manifest.json")
          .map(([name, value]) => [name, hash(value)]),
      ),
    }) + "\n";
  for (const [name, value] of Object.entries(outputs)) {
    if (process.argv.includes("--check")) {
      if (readFileSync(resolve(out, name), "utf8") !== value)
        throw Error(`Generated drift: ${name}`);
    } else writeFileSync(resolve(out, name), value);
  }
  const snapshotPath = resolve(root, "tests/client-contract/schema.graphql");
  if (process.argv.includes("--update-schema-snapshot")) {
    mkdirSync(resolve(root,"tests/client-contract"),{recursive:true});
    writeFileSync(snapshotPath,pkg.schema);
  }
  if (process.argv.includes("--check") && readFileSync(snapshotPath,"utf8") !== pkg.schema) {
    throw Error("Generated public schema changed: review the diff and regenerate the approved schema snapshot");
  }
  console.log(`Application package ${pkg.digest}`);
}
