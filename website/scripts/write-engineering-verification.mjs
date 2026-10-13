import { readFileSync, writeFileSync } from "node:fs";
import { createDocumentApplication } from "../src/engineering/document-application.js";
if (process.env.CI !== "true" || !/^[a-f0-9]{40}$/.test(process.env.GITHUB_SHA ?? "") || !process.env.GITHUB_REPOSITORY) throw Error("Commit verification is emitted only by the successful CI build job");
const pkg = JSON.parse(readFileSync(new URL("../../client-runtime/generated/application.json", import.meta.url)));
const neutral = await createDocumentApplication(pkg.digest);
const full = process.env.ARTICLE_ONLY !== "true";
const report = { format: 1, repository: process.env.GITHUB_REPOSITORY, commit: process.env.GITHUB_SHA, packages: [pkg.digest, neutral.initialPackage.digest], checks: { runtime: "passed", relay: "passed", console: full ? "passed" : "skipped", browser: full ? "passed" : "skipped", "protected-build": "passed" }, scope: "website-deployment", unsupported: ["live-openai", "live-mcp", "production-services"] };
writeFileSync(new URL("../dist/engineering-verification.json", import.meta.url), JSON.stringify(report, null, 2) + "\n");
console.log(`Verification emitted for ${report.commit}`);
