import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
const root = new URL("../../", import.meta.url);
const paths = [
  ["model/client-api-profile.json", "API contract", true, ["model/client-command-profile.json"]],
  ["model/client-task-profile.json", "Task and synthetic correction evidence", true, ["model/client-command-profile.json", "xflow/charge-correction.profile.json"]],
  ["model/client-command-profile.json", "Command requirements and handler binding", true, ["model/client-capabilities.json"]],
  ["model/client-capabilities.json", "Supported browser rules and limitations", false, []],
  ["xflow/charge-correction.profile.json", "Correction workflow", true, ["model/client-task-profile.json"]],
];
const sources = paths.map(([id, label, editable, dependencies]) => {
  const text = readFileSync(new URL(id, root), "utf8");
  return { id, label, editable, dependencies, text, hash: createHash("sha256").update(text).digest("hex"), mediaType: "application/json", state: "implemented" };
});
const bundle = { version: "1.0.0", sourceRevision: process.env.GITHUB_SHA ?? "local-build", sourceRepository: process.env.GITHUB_REPOSITORY ?? "pli-poc/charge-weave", sources };
writeFileSync(new URL("client-runtime/generated/engineering.json", root), JSON.stringify(bundle) + "\n");
console.log(`Engineering catalogue: ${sources.length} pinned contracts`);
