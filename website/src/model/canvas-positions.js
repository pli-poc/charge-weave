export const canvasPositionKey = (workspaceId, viewId) => `chargeweave.canvas.v2.${workspaceId}.${encodeURIComponent(viewId)}`;

export function readCanvasPositions(storage, workspaceId, viewId, { strict = false } = {}) {
  try {
    let raw = storage.getItem(canvasPositionKey(workspaceId, viewId));
    // The old key did not identify a view. Preserve it only for the default view.
    if (raw === null && viewId === 'default') raw = storage.getItem(`chargeweave.canvas.v1.${workspaceId}`);
    const data = JSON.parse(raw === null ? '{}' : raw);
    const result = Object.create(null);
    if (!data || typeof data !== 'object' || Array.isArray(data) || (strict && Object.keys(data).length > 500)) {
      if (strict) throw new Error('Invalid canvas positions');
      return result;
    }
    for (const [name, value] of Object.entries(data).slice(0, 500)) {
      if (/^[A-Za-z][A-Za-z0-9]*$/.test(name) && Number.isFinite(value?.x) && Number.isFinite(value?.y) && Math.abs(value.x) < 100000 && Math.abs(value.y) < 100000) result[name] = { x: value.x, y: value.y };
      else if (strict) throw new Error('Invalid canvas position');
    }
    return result;
  } catch (error) {
    if (strict) throw new Error('Canvas positions could not be read. Reload the shared view before saving.', { cause: error });
    return Object.create(null);
  }
}

export function writeCanvasPositions(storage, workspaceId, viewId, positions) {
  storage.setItem(canvasPositionKey(workspaceId, viewId), JSON.stringify(positions));
}
