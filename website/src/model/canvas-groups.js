// Groups are presentation metadata. Frame only members currently displayed;
// nodes that are hidden or outside the current projection are not invented.
export function canvasGroupFrames(groups, nodes) {
  const byName = new Map(nodes.map(node => [node.id, node]));
  return groups.flatMap((group, index) => {
    if (!group || typeof group.name !== 'string' || !Array.isArray(group.members)) return [];
    const members = [...new Set(group.members)].map(name => byName.get(name)).filter(node => node && Number.isFinite(node.position?.x) && Number.isFinite(node.position?.y));
    if (!members.length) return [];
    const left = Math.min(...members.map(node => node.position.x)) - 24;
    const top = Math.min(...members.map(node => node.position.y)) - 38;
    const right = Math.max(...members.map(node => node.position.x + (node.measured?.width || node.width || 220))) + 24;
    const bottom = Math.max(...members.map(node => node.position.y + (node.measured?.height || node.height || 128))) + 24;
    return [{ index, name: group.name, left, top, width: right - left, height: bottom - top, visibleCount: members.length, totalCount: new Set(group.members).size }];
  });
}
