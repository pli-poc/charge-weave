// Assign stable, symmetric offsets to relationships sharing the same endpoints.
export function parallelEdgeOffsets(edges) {
  const groups = new Map();
  for (const edge of edges) {
    const key = JSON.stringify([edge.source, edge.target].sort());
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(edge.id);
  }
  const offsets = new Map();
  for (const ids of groups.values()) {
    ids.sort();
    ids.forEach((id, index) => offsets.set(id, (index - (ids.length - 1) / 2) * 32));
  }
  return offsets;
}
