import fs from "node:fs";
import path from "node:path";

const root = path.resolve("dist");
if (!fs.existsSync(root)) throw new Error("dist/ does not exist.");

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const forbidden = [
  "github.com/pli-poc/charge-weave",
  "api.github.com/repos/pli-poc/charge-weave",
  "raw.githubusercontent.com/pli-poc/charge-weave",
];

const textFiles = walk(root).filter((file) =>
  /\.(?:html|js|css|json|xml|txt|md|svg)$/i.test(file),
);

const violations = [];
for (const file of textFiles) {
  const source = fs.readFileSync(file, "utf8");
  for (const needle of forbidden) {
    if (source.includes(needle)) {
      violations.push(`${path.relative(root, file)} -> ${needle}`);
    }
  }
}

if (violations.length) {
  throw new Error(
    "Public build contains links or references to the private-source repository:\n" +
      violations.join("\n"),
  );
}

console.log(`Public-link gate passed across ${textFiles.length} deployable text assets.`);
