// Keep the outermost selected card origins fixed while spacing the others.
export function distributePositions(positions, names, axis) {
  const ordered = [...new Set(names)].filter(name => Number.isFinite(positions[name]?.[axis])).sort((a, b) => positions[a][axis] - positions[b][axis] || a.localeCompare(b));
  if (ordered.length < 3) return { ...positions };
  const start = positions[ordered[0]][axis], end = positions[ordered.at(-1)][axis];
  const next = { ...positions };
  ordered.slice(1, -1).forEach((name, index) => { next[name] = { ...positions[name], [axis]: start + (end - start) * (index + 1) / (ordered.length - 1) }; });
  return next;
}
