import { clone, sha256, stable } from "./contracts.js";
export function createCandidateWorkspace({ bundle, compile, initialPackage, snapshot }) {
  const baseline = clone(bundle.sources);
  let overlay = snapshot?.overlay ? clone(snapshot.overlay) : {}, revision = snapshot?.revision ?? 0;
  let digest = initialPackage.digest, compiled = initialPackage, compiledRevision = revision;
  if (Object.keys(overlay).length) compiledRevision = -1;
  const sources = () => baseline.map(s => overlay[s.id] ?? s);
  async function rehash() { digest = await sha256(sources().map(s => [s.id, s.hash])); compiledRevision = -1; }
  return {
    identity: () => ({ candidateDigest: digest, workspaceRevision: revision }),
    sources,
    inspect: () => ({ baselineDigest: initialPackage.digest, candidateDigest: digest, workspaceRevision: revision, compiled: compiledRevision === revision, changes: Object.entries(overlay).map(([id, source]) => ({ id, beforeHash: baseline.find(s => s.id === id).hash, afterHash: source.hash, before: baseline.find(s => s.id === id).text, after: source.text })) }),
    async apply({ sourceId, expectedHash, expectedRevision, text }) {
      if (expectedRevision !== revision) throw Error("Stale candidate revision");
      const current = sources().find(s => s.id === sourceId);
      if (!current || current.hash !== expectedHash) throw Error("Stale source hash");
      if (!current.editable) throw Error("Source requires an external build provider");
      if (typeof text !== "string" || text.length > 100000) throw Error("Source budget exceeded");
      JSON.parse(text); // Candidate modelling accepts data contracts, never evals code.
      const next = { ...current, text, hash: await sha256(text) };
      if (text === baseline.find(s => s.id === sourceId).text) delete overlay[sourceId]; else overlay[sourceId] = next;
      revision++; await rehash(); return this.inspect();
    },
    async reset(expectedRevision) {
      if (expectedRevision !== revision) throw Error("Stale candidate revision");
      overlay = {}; revision++; digest = initialPackage.digest; compiled = initialPackage; compiledRevision = revision;
      return this.inspect();
    },
    async compile(expectedRevision) {
      if (expectedRevision !== revision) throw Error("Stale candidate revision");
      const before = stable(sources());
      const next = await compile(Object.fromEntries(sources().map(s => [s.id, s.text])));
      if (expectedRevision !== revision || before !== stable(sources())) throw Error("Candidate changed during compilation");
      compiled = next; digest = next.digest; compiledRevision = revision;
      return { candidateDigest: digest, schema: next.schema, capabilities: next.capabilities, unsupported: next.capabilities.unsupported ?? [] };
    },
    package() { if (compiledRevision !== revision) throw Error("Candidate needs compilation before execution"); return clone(compiled); },
    export: () => ({ overlay: clone(overlay), revision }),
    async restore() {
      for (const [id, source] of Object.entries(overlay)) {
        const base = baseline.find(s => s.id === id);
        if (!base?.editable || source.id !== id || source.hash !== await sha256(source.text) || stable({ ...source, text: base.text, hash: base.hash }) !== stable(base)) throw Error("Invalid candidate checkpoint");
      }
      if (Object.keys(overlay).length) await rehash();
    },
  };
}
