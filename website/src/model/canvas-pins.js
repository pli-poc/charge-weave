export const canvasPinsKey = (workspaceId, viewId) => `chargeweave.canvas-pins.v1.${workspaceId}.${encodeURIComponent(viewId)}`;

export function readCanvasPins(storage, workspaceId, viewId) {
  const raw = storage.getItem(canvasPinsKey(workspaceId, viewId));
  const value = JSON.parse(raw === null ? '[]' : raw);
  if (!Array.isArray(value) || value.length > 500 || value.some(name => typeof name !== 'string' || !/^[A-Za-z][A-Za-z0-9]{0,127}$/.test(name)) || new Set(value).size !== value.length) throw new Error('Invalid local pin settings');
  return new Set(value);
}

export function writeCanvasPins(storage, workspaceId, viewId, pins) {
  const names = [...pins];
  if (names.length > 500 || names.some(name => typeof name !== 'string' || !/^[A-Za-z][A-Za-z0-9]{0,127}$/.test(name))) throw new Error('Invalid local pin settings');
  storage.setItem(canvasPinsKey(workspaceId, viewId), JSON.stringify(names.sort()));
}
