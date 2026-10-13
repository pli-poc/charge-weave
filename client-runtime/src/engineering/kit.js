import { createBroker } from "./broker.js";
import { createContextEngine } from "./context.js";
import { createCandidateWorkspace } from "./candidate.js";
import { createScenarioRunner } from "./scenarios.js";
import { object, string, integer, VERSION } from "./contracts.js";
export async function createEngineeringKit({ bundle, initialPackage, compile, adapters, snapshot, crypto = globalThis.crypto }) {
  const candidate = createCandidateWorkspace({ bundle, initialPackage, compile, snapshot: snapshot?.candidate });
  await candidate.restore();
  const journal = snapshot?.journal ?? [];
  // An interrupted invocation requires reconciliation; it is never silently rerun.
  for (const entry of journal) if (entry.state === "running") { entry.state = "interrupted"; entry.error = "Browser execution interrupted; start a fresh task after inspection"; }
  const broker = createBroker({ identity: candidate.identity, journal });
  broker.restore(journal);
  const context = createContextEngine({ sources: candidate.sources, identity: candidate.identity });
  const runner = createScenarioRunner({ identity: candidate.identity, adapters: adapters(() => candidate.package()), crypto });
  if (snapshot?.evidence) await runner.import(snapshot.evidence);
  const anyObject = { type: "object", properties: {}, required: [], additionalProperties: true };
  const array = { type: "array", items: anyObject, maxItems: 1000 };
  const register = (id, description, inputSchema, outputSchema, execute, effect = "read") => broker.register({ id, description, inputSchema, outputSchema, effect }, execute);
  register("context.catalog", "List the curated source catalogue with hashes and dependencies.", object(), array, () => context.catalog());
  register("context.search", "Find source contracts by exact, lexical and dependency retrieval.", object({ query: string }), array, ({ query }) => context.search(query));
  register("context.read", "Read one scoped source at its expected hash.", object({ sourceId: string, expectedHash: string }), anyObject, ({ sourceId, expectedHash }) => context.read(sourceId, expectedHash));
  register("context.related", "Find explicit source dependencies.", object({ sourceId: string }), array, ({ sourceId }) => context.related(sourceId));
  register("candidate.inspect", "Inspect source changes and compilation freshness.", object(), anyObject, () => candidate.inspect());
  register("candidate.apply_change", "Apply a reversible JSON source change against a pinned revision and hash.", object({ sourceId: string, expectedHash: string, expectedRevision: integer, text: { type: "string", maxLength: 100000 } }), anyObject, async args => { const out = await candidate.apply(args); context.invalidate(); return out; }, "candidate-write");
  register("candidate.reset", "Discard the candidate overlay at an expected revision.", object({ expectedRevision: integer }), anyObject, async ({ expectedRevision }) => { const out = await candidate.reset(expectedRevision); context.invalidate(); return out; }, "candidate-write");
  register("model.compile_supported", "Compile supported browser contracts; required unsupported rules or handlers block compilation.", object({ expectedRevision: integer }), anyObject, async ({ expectedRevision }) => { const out = await candidate.compile(expectedRevision); context.invalidate(); return out; }, "candidate-write");
  register("model.capability_report", "Inspect the compiled package's supported and unsupported operations.", object(), anyObject, () => candidate.package().capabilities);
  register("scenario.list", "List registered synthetic scenarios and clock support.", object(), array, runner.list);
  register("scenario.run", "Execute a seeded scenario against the current immutable candidate and retain assertions and replay evidence.", object({ scenarioId: string, seed: { type: "string", minLength: 1, maxLength: 48 }, startAt: { type: "string", minLength: 20, maxLength: 40 } }), anyObject, (args, host) => {
    if (!Number.isFinite(Date.parse(args.startAt)) || !/Z$/.test(args.startAt)) throw Error("Explicit UTC virtual time required");
    return runner.run(args, host.signal);
  });
  register("evidence.read", "Read a recorded scenario, retaining its verified scope and candidate identity.", object({ evidenceId: string }), anyObject, ({ evidenceId }) => runner.read(evidenceId));
  register("evidence.compare", "Compare runs only when pinned scenario inputs and adapter versions match.", object({ baselineId: string, candidateId: string }), anyObject, ({ baselineId, candidateId }) => runner.compare(baselineId, candidateId));
  register("capability.search", "Discover additional granted tool definitions for compilation, candidate editing, evidence or external reads.", object({ query: string }), anyObject, ({ query }, host) => {
    const terms = query.toLowerCase().match(/[a-z0-9_]+/g) ?? [];
    const ids = broker.catalog(host.grant).filter(d => d.id !== "capability.search" && terms.some(t => `${d.id} ${d.description}`.toLowerCase().includes(t))).slice(0, 6).map(d => d.id.replaceAll(".", "_"));
    return { tools: broker.tools(host.grant).filter(t => ids.includes(t.name)) };
  });
  let operation = 0;
  const manualGrant = { taskId: "manual", capabilities: broker.catalog().map(d => d.id) };
  return {
    version: VERSION, candidate, broker, context, runner, journal,
    invoke: (id, args, signal) => broker.invoke(id, args, { grant: { ...manualGrant, capabilities: broker.catalog().map(d => d.id) }, invocationId: `manual-${globalThis.crypto.randomUUID()}`, signal }),
    taskGrant(taskId, writable = false) { return { taskId, capabilities: broker.catalog().filter(d => writable || d.effect === "read").map(d => d.id) }; },
    export: () => ({ revision: ++operation, format: 1, baselineDigest: initialPackage.digest, candidate: candidate.export(), journal: structuredClone(journal), evidence: runner.export() }),
  };
}
