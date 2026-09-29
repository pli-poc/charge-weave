import fs from "node:fs";
import path from "node:path";

const root = path.resolve("dist");
const reportFile = path.resolve(".production-protection-report.json");

if (!fs.existsSync(root)) throw new Error("dist/ does not exist.");
if (!fs.existsSync(reportFile)) throw new Error("Protection report is missing.");

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const files = walk(root);
const forbiddenFiles = files
  .map((file) => path.relative(root, file).replaceAll(path.sep, "/"))
  .filter((file) => /(?:\.map$|\.(?:ts|tsx|jsx)$)/i.test(file));

if (forbiddenFiles.length) {
  throw new Error(`Forbidden production artifacts found:\n${forbiddenFiles.join("\n")}`);
}

const jsFiles = files.filter((file) => file.endsWith(".js")).sort();
const report = JSON.parse(fs.readFileSync(reportFile, "utf8"));
const protectedFiles = new Map(report.files.map((entry) => [entry.file, entry]));

for (const file of jsFiles) {
  const relative = path.relative(root, file).replaceAll(path.sep, "/");
  const source = fs.readFileSync(file, "utf8");
  const entry = protectedFiles.get(relative);

  if (!entry) throw new Error(`Bundle was not covered by production protection: ${relative}`);
  if (entry.beforeSha256 === entry.afterSha256) throw new Error(`Bundle was not transformed: ${relative}`);
  if (/sourceMappingURL\s*=/.test(source)) throw new Error(`Source-map reference leaked from ${relative}`);
  if (/\b(?:src|website|console-app)\/(?:[A-Za-z0-9_.-]+\/){0,6}[A-Za-z0-9_.-]+\.(?:ts|tsx|jsx)\b/.test(source)) {
    throw new Error(`Source path leaked from ${relative}`);
  }
}

if (protectedFiles.size !== jsFiles.length) {
  throw new Error(`Protection report/file mismatch: report=${protectedFiles.size}, dist=${jsFiles.length}`);
}

console.log(`Production protection verified for ${jsFiles.length} JavaScript bundles; no source maps or source files are deployable.`);
