const samePoint = (left, right) => Boolean(left && right && left.x === right.x && left.y === right.y);

export function positionChange(before, after, names, label) {
  const changes = [...new Set(names)].filter(name => before[name] && after[name] && !samePoint(before[name], after[name])).map(name => ({ name, before: { ...before[name] }, after: { ...after[name] } }));
  return changes.length ? { label, changes } : null;
}

export function samePositionMaps(left, right) {
  const names = Object.keys(left);
  return names.length === Object.keys(right).length && names.every(name => samePoint(left[name], right[name]));
}

export function undoPositionChange(current, entry) {
  if (!entry.changes.every(change => samePoint(current[change.name], change.after))) throw new Error('Layout has changed since this action');
  const next = { ...current };
  for (const change of entry.changes) next[change.name] = { ...change.before };
  return next;
}

export function redoPositionChange(current, entry) {
  if (!entry.changes.every(change => samePoint(current[change.name], change.before))) throw new Error('Layout has changed since undo');
  const next = { ...current };
  for (const change of entry.changes) next[change.name] = { ...change.after };
  return next;
}
