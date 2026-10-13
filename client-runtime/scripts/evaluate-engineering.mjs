import { readFileSync, writeFileSync } from "node:fs";
import { createContextEngine } from "../src/engineering/context.js";
import { performance } from "node:perf_hooks";
const bundle = JSON.parse(readFileSync(new URL("../generated/engineering.json", import.meta.url)));
const pkg = JSON.parse(readFileSync(new URL("../generated/application.json", import.meta.url)));
const engine = createContextEngine({ sources: () => bundle.sources, identity: () => ({ candidateDigest: pkg.digest, workspaceRevision: 0 }) });
const cases = [
  ["submitCorrection", "model/client-command-profile.json"],
  ["operatorNote", "model/client-task-profile.json"],
  ["unsupported", "model/client-capabilities.json"],
  ["ChargingSite", "model/client-api-profile.json"],
  ["approval", "xflow/charge-correction.profile.json"],
];
const sourceBytes = bundle.sources.reduce((n, s) => n + Buffer.byteLength(s.text), 0), results = [];
for (const [query, expected] of cases) {
  const start = performance.now(), packet = await engine.assemble({ goal: query, taskId: "retrieval-evaluation" }), coldMs = performance.now() - start;
  const warm = performance.now(), replay = await engine.assemble({ goal: query, taskId: "retrieval-evaluation" }), warmMs = performance.now() - warm;
  const found = packet.evidence.some(s => s.id === expected);
  if (!found || packet.digest !== replay.digest) throw Error(`Retrieval evaluation failed: ${query}`);
  results.push({ query, expected, requiredSourceFound: found, sourceBytes, selectedSourceBytes: packet.bytes, gaps: packet.gaps, coldMs, warmMs });
}
const report = { version: "1.0.0", commit: bundle.sourceRevision, candidateDigest: pkg.digest, scope: "five-curated-source-queries", requiredSourceRecall: results.filter(r => r.requiredSourceFound).length / results.length, cache: engine.metrics(), results, limitations: ["No live model task success or latency measured", "Small synthetic source corpus; no general performance guarantee", "Source byte counts are not model token counts"] };
writeFileSync(new URL("../generated/engineering-evaluation.json", import.meta.url), JSON.stringify(report, null, 2) + "\n");
console.log(`Context evaluation: ${results.length}/${results.length} required sources retained, ${report.cache.hits} exact cache hits`);
