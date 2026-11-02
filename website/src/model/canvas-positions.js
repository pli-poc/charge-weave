export const canvasPositionKey = (workspaceId, viewId) => `chargeweave.canvas.v2.${workspaceId}.${encodeURIComponent(viewId)}`;

export function readCanvasPositions(storage, workspaceId, viewId) {
  try {
    let raw = storage.getItem(canvasPositionKey(workspaceId, viewId));
    // The old key did not identify a view. Preserve it only for the default view.
    if (raw === null && viewId === 'default') raw = storage.getItem(`chargeweave.canvas.v1.${workspaceId}`);
    const data = JSON.parse(raw || '{}');
    const result = Object.create(null);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return result;
    for (const [name, value] of Object.entries(data).slice(0, 500)) {
      if (/^[A-Za-z][A-Za-z0-9]*$/.test(name) && Number.isFinite(value?.x) && Number.isFinite(value?.y) && Math.abs(value.x) < 100000 && Math.abs(value.y) < 100000) result[name] = { x: value.x, y: value.y };
    }
    return result;
  } catch { return Object.create(null); }
}

export function writeCanvasPositions(storage, workspaceId, viewId, positions) {
  storage.setItem(canvasPositionKey(workspaceId, viewId), JSON.stringify(positions));
}
