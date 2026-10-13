import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { compileApplicationBody } from "../src/compiler/application.js";
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
export function compileApplication(options) {
  const body = compileApplicationBody(options);
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
