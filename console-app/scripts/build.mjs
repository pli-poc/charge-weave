import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(project, "src");
const output = path.join(project, "dist");

await fs.rm(output, { recursive: true, force: true });
await fs.cp(source, output, { recursive: true });
console.log(`Built isolated ChargeWeave console into ${path.relative(project, output)}/`);
