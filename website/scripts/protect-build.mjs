import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import JavaScriptObfuscator from "javascript-obfuscator";

const root = path.resolve("dist");
const reportFile = path.resolve(".production-protection-report.json");

if (!fs.existsSync(root)) {
  throw new Error("Production build not found. Run the website and console builds before protection.");
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

const files = walk(root).filter((file) => file.endsWith(".js")).sort();
if (files.length === 0) throw new Error("No JavaScript bundles found in dist.");

const results = [];
for (const [index, file] of files.entries()) {
  const relative = path.relative(root, file).replaceAll(path.sep, "/");
  const source = fs.readFileSync(file, "utf8");
  const vendorLike =
    /(?:^|\/)(?:vendor|react|three|xstate|leaflet)(?:[-./]|$)/i.test(relative) ||
    relative.startsWith("app/assets/");

  const options = {
    compact: true,
    controlFlowFlattening: !vendorLike,
    controlFlowFlatteningThreshold: vendorLike ? 0 : 0.35,
    deadCodeInjection: false,
    debugProtection: false,
    disableConsoleOutput: false,
    identifierNamesGenerator: "hexadecimal",
    identifiersPrefix: `cw${index.toString(36)}_`,
    ignoreImports: true,
    log: false,
    numbersToExpressions: !vendorLike,
    renameGlobals: false,
    renameProperties: false,
    seed: 247113 + index,
    selfDefending: false,
    simplify: true,
    sourceMap: false,
    splitStrings: !vendorLike,
    splitStringsChunkLength: 8,
    stringArray: true,
    stringArrayCallsTransform: !vendorLike,
    stringArrayCallsTransformThreshold: vendorLike ? 0 : 0.5,
    stringArrayEncoding: ["base64"],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayThreshold: vendorLike ? 0.35 : 0.8,
    stringArrayWrappersCount: vendorLike ? 1 : 2,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersParametersMaxCount: 4,
    target: "browser",
    transformObjectKeys: false,
    unicodeEscapeSequence: false,
  };

  const output = JavaScriptObfuscator.obfuscate(source, options).getObfuscatedCode();
  if (!output || output === source) throw new Error(`Obfuscation produced no change for ${relative}`);

  fs.writeFileSync(file, output);
  results.push({
    file: relative,
    profile: vendorLike ? "compatibility" : "application",
    beforeBytes: Buffer.byteLength(source),
    afterBytes: Buffer.byteLength(output),
    beforeSha256: sha256(source),
    afterSha256: sha256(output),
  });
}

fs.writeFileSync(
  reportFile,
  JSON.stringify(
    {
      schema: 1,
      tool: "javascript-obfuscator",
      toolVersion: "5.8.0",
      productionOnly: true,
      files: results,
    },
    null,
    2,
  ) + "\n",
);

console.log(`Protected ${results.length} JavaScript bundles. Report: ${path.basename(reportFile)}`);
