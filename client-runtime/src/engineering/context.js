import { clone, sha256, stable } from "./contracts.js";
export function createContextEngine({ sources, identity, maxBytes = 24000 }) {
  let cache = new Map(), hits = 0, misses = 0;
  const catalog = () => sources().map(({ text, ...s }) => clone(s));
  function read(id, expectedHash) {
    const source = sources().find(s => s.id === id);
    if (!source || source.hash !== expectedHash) throw Error("Missing or stale source");
    return clone(source);
  }
  function related(id) {
    const selected = catalog().find(s => s.id === id);
    if (!selected) throw Error("Unknown source");
    return catalog().filter(s => selected.dependencies.includes(s.id) || s.dependencies.includes(id));
  }
  async function search(query, limit = 8) {
    if (typeof query !== "string" || !query.trim() || query.length > 2000 || !Number.isInteger(limit) || limit < 1 || limit > 20) throw Error("Invalid context query");
    const current = sources(), key = stable({ query, limit, identity: identity(), hashes: current.map(s => [s.id, s.hash]) });
    if (cache.has(key)) { hits++; return clone(cache.get(key)); }
    misses++;
    const words = query.toLowerCase().match(/[a-z0-9_.-]+/g) ?? [];
    const ranked = current.map(s => ({ source: s, score: words.reduce((n, w) => n + (s.id.toLowerCase().includes(w) ? 12 : 0) + (s.text.toLowerCase().includes(w) ? 1 : 0), 0) })).filter(s => s.score > 0).sort((a, b) => b.score - a.score || a.source.id.localeCompare(b.source.id));
    const selected = ranked.slice(0, limit).map(({ source, score }) => ({ ...source, score, reason: "exact/lexical" }));
    for (const s of [...selected]) for (const r of related(s.id)) {
      if (selected.length < limit && !selected.some(x => x.id === r.id)) selected.push({ ...read(r.id, r.hash), score: 0, reason: `dependency:${s.id}` });
    }
    cache.set(key, clone(selected)); if (cache.size > 40) cache.delete(cache.keys().next().value);
    return clone(selected);
  }
  return {
    catalog, read, related, search,
    async assemble({ goal, taskId, constraints = [], journal = [] }) {
      const selected = await search(goal), evidence = [], gaps = [];
      let bytes = 0;
      for (const source of selected) {
        const size = new TextEncoder().encode(source.text).length;
        if (bytes + size > maxBytes) { gaps.push(`Context budget excluded ${source.id}`); continue; }
        bytes += size; evidence.push(source);
      }
      if (!evidence.length) gaps.push("No matching source in the curated catalogue");
      const packet = { version: "1.0.0", identity: { taskId, ...identity() }, intent: { goal }, constraints: clone(constraints), evidence, memory: clone(journal.slice(-12)), gaps, indexScope: "curated-engineering-contracts", bytes };
      return { ...packet, digest: await sha256(packet) };
    },
    metrics: () => ({ hits, misses, entries: cache.size }),
    invalidate() { cache = new Map(); },
  };
}
