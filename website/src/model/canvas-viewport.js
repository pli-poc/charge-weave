export const canvasViewportKey = (workspaceId, viewId, root) => `chargeweave.canvas-viewport.v1.${workspaceId}.${encodeURIComponent(viewId)}.${encodeURIComponent(root)}`;
export const MIN_CANVAS_ZOOM = 0.01;

function validViewport(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value)
    && Number.isFinite(value.x) && Math.abs(value.x) < 1000000
    && Number.isFinite(value.y) && Math.abs(value.y) < 1000000
    && Number.isFinite(value.zoom) && value.zoom >= MIN_CANVAS_ZOOM && value.zoom <= 2);
}

export function readCanvasViewport(storage, workspaceId, viewId, root) {
  try {
    const raw = storage.getItem(canvasViewportKey(workspaceId, viewId, root));
    if (raw === null) return null;
    const value = JSON.parse(raw);
    return validViewport(value) ? { x: value.x, y: value.y, zoom: value.zoom } : null;
  } catch { return null; }
}

export function writeCanvasViewport(storage, workspaceId, viewId, root, viewport) {
  if (!validViewport(viewport)) throw new Error('Invalid local viewport');
  storage.setItem(canvasViewportKey(workspaceId, viewId, root), JSON.stringify({ x: viewport.x, y: viewport.y, zoom: viewport.zoom }));
}
