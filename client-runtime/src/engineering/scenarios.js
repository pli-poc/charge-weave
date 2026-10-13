import { clone, sha256, stable } from "./contracts.js";
export function createScenarioRunner({ identity, adapters, crypto = globalThis.crypto }) {
  const runs = new Map();
  return {
    list: () => adapters.flatMap(a => a.scenarios.map(s => ({ ...s, adapter: a.id, version: a.version }))),
    async run(inputs, signal) {
      const adapter = adapters.find(a => a.scenarios.some(s => s.id === inputs.scenarioId));
      if (!adapter) throw Error("Unknown scenario");
      if (signal?.aborted) throw Error("Cancelled");
      const pinned = clone(identity());
      const result = await adapter.run(clone(inputs), { signal });
      if (stable(identity()) !== stable(pinned)) throw Error("Candidate changed during scenario");
      if (!Array.isArray(result.assertions) || result.assertions.some(a => typeof a.passed !== "boolean" || !a.id)) throw Error("Invalid scenario assertions");
      const envelope = { format: 1, ...pinned, replay: { ...inputs, adapterId: adapter.id, adapterVersion: adapter.version }, ...result, unsupported: result.unsupported ?? [] };
      const digest = await sha256(envelope, crypto);
      const run = { ...envelope, id: digest, evidenceRefs: [digest], verifiedScope: "browser-contracts", unsupported: result.unsupported ?? [] };
      runs.set(digest, clone(run)); return clone(run);
    },
    read(id) { if (!runs.has(id)) throw Error("Evidence not found"); return clone(runs.get(id)); },
    compare(a, b) {
      const left = runs.get(a), right = runs.get(b);
      if (!left || !right) throw Error("Evidence not found");
      if (stable(left.replay) !== stable(right.replay)) throw Error("Comparison requires the same replay inputs and adapter");
      return { sameBehavior: stable({ assertions: left.assertions, output: left.output }) === stable({ assertions: right.assertions, output: right.output }), baselineDigest: left.candidateDigest, candidateDigest: right.candidateDigest, differences: right.assertions.filter(v => stable(v) !== stable(left.assertions.find(x => x.id === v.id))) };
    },
    export: () => [...runs.values()].map(clone),
    async import(entries) {
      for (const entry of entries) {
        const { id, evidenceRefs, verifiedScope, ...body } = entry;
        if (await sha256(body, crypto) !== id) throw Error("Damaged evidence");
        runs.set(id, clone(entry));
      }
    },
  };
}
