export const canvasHiddenKey = (workspaceId, viewId) => `chargeweave.canvas-hidden.v1.${workspaceId}.${encodeURIComponent(viewId)}`;

export function readCanvasHidden(storage, workspaceId, viewId) {
  const raw = storage.getItem(canvasHiddenKey(workspaceId, viewId));
  const value = JSON.parse(raw === null ? '[]' : raw);
  if (!Array.isArray(value) || value.length > 500 || value.some(name => typeof name !== 'string' || !/^[A-Za-z][A-Za-z0-9]{0,127}$/.test(name)) || new Set(value).size !== value.length) throw new Error('Invalid hidden-concept settings');
  return new Set(value);
}

export function writeCanvasHidden(storage, workspaceId, viewId, hidden) {
  const names = [...hidden];
  if (names.length > 500 || names.some(name => typeof name !== 'string' || !/^[A-Za-z][A-Za-z0-9]{0,127}$/.test(name))) throw new Error('Invalid hidden-concept settings');
  storage.setItem(canvasHiddenKey(workspaceId, viewId), JSON.stringify(names.sort()));
}
