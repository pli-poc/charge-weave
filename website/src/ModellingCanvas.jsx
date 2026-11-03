import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Background, BaseEdge, ControlButton, Controls, Handle, MarkerType, MiniMap, Position, ReactFlow, ViewportPortal, applyNodeChanges, useReactFlow, useViewport } from '@xyflow/react';
import { parallelEdgeOffsets } from './model/parallel-edges.js';
import { readCanvasPositions, writeCanvasPositions } from './model/canvas-positions.js';
import { readCanvasPins, writeCanvasPins } from './model/canvas-pins.js';
import { readCanvasHidden, writeCanvasHidden } from './model/canvas-hidden.js';
import { positionChange, samePositionMaps, undoPositionChange, redoPositionChange } from './model/canvas-history.js';
import { MIN_CANVAS_ZOOM, readCanvasViewport, writeCanvasViewport } from './model/canvas-viewport.js';
import { canvasGroupFrames } from './model/canvas-groups.js';
import { distributePositions } from './model/canvas-distribute.js';
import '@xyflow/react/dist/style.css';
import './canvas-layout-controls.css';

const motionDuration = duration => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : duration;
const layoutNodes = (names, instance) => names.map(id => {
  const size = instance?.getNode(id)?.measured;
  return { id, width: Number.isFinite(size?.width) && size.width > 0 ? size.width : 220, height: Number.isFinite(size?.height) && size.height > 0 ? size.height : 128 };
});
const layoutBox = (point, size) => ({ ...point, width: size?.width ?? 220, height: size?.height ?? 128 });
const boxesOverlap = (a, b) => a.x < b.x + b.width + 20 && a.x + a.width + 20 > b.x && a.y < b.y + b.height + 20 && a.y + a.height + 20 > b.y;
const ConceptNode = memo(function ConceptNode({ data }) {
  const fields = typeof data.fields === 'string' ? data.fields.split(/\s+/).filter(Boolean) : Array.isArray(data.fields) ? data.fields.map(field => `${field.property}:${field.range}${field.cardinality ?? ''}`) : [];
  const changed = ['added', 'changed'].includes(data.changeStatus);
  const badgeCount = Number(changed) + Number(Boolean(data.layoutSelected)) + Number(Boolean(data.layoutPinned));
  // Reserve room for a second badge row and the overflow count in the fixed
  // 220 x 128 card used by the layout worker.
  const previewCount = badgeCount >= 2 ? 2 : 3;
  return <>
    <Handle type="target" position={Position.Left} />
    <div className="studio-concept-card">
      <div className="studio-concept-heading"><span className="studio-concept-kind">CLASS</span><strong title={data.label}>{data.label}</strong></div>
      <div className="studio-concept-module" title={data.module || 'Ontology concept'}>{data.module || 'Ontology concept'}</div>
      {badgeCount > 0 && <div className="studio-concept-badges">
        {changed && <span className="studio-concept-change">{data.changeStatus === 'added' ? 'Added in draft' : 'Changed in draft'}</span>}
        {data.layoutSelected && <span className="studio-concept-layout-selected">Selected for layout</span>}
        {data.layoutPinned && <span className="studio-concept-layout-pinned">Pinned</span>}
      </div>}
      {!data.overview && fields.length > 0 && <ul>{fields.slice(0, previewCount).map((field, index) => <li key={`${field}-${index}`} title={field}>{field}</li>)}</ul>}
      {!data.overview && fields.length > previewCount && <span className="studio-concept-more">+{fields.length - previewCount} fields</span>}
    </div>
    <Handle type="source" position={Position.Right} />
  </>;
});
const nodeTypes = { concept: ConceptNode };
const RelationshipEdge = memo(function RelationshipEdge({ id, sourceX, sourceY, targetX, targetY, markerEnd, label, data }) {
  const offset = data?.offset ?? 0;
  const bend = Math.max(70, Math.abs(targetX - sourceX) * .45) * (targetX >= sourceX ? 1 : -1);
  const path = `M ${sourceX},${sourceY} C ${sourceX + bend},${sourceY + offset} ${targetX - bend},${targetY + offset} ${targetX},${targetY}`;
  return <BaseEdge id={id} path={path} markerEnd={markerEnd} label={label} labelX={(sourceX + targetX) / 2} labelY={(sourceY + targetY) / 2 + offset * .75} labelShowBg />;
});
const edgeTypes = { relationship: RelationshipEdge };
const multiplicity = { '!': '1', '?': '0..1', '+': '1..*', '*': '0..*' };
function ZoomReadout({ onManualInteraction, onOverviewChange, onFocusSelected, onFocusRoot, canFocusSelected, canFocusRoot }) {
  const { zoom } = useViewport();
  const { zoomTo } = useReactFlow();
  const resetControl = useRef(null);
  function focusOverview(action) {
    action();
    requestAnimationFrame(() => resetControl.current?.focus());
  }
  useEffect(() => { onOverviewChange(zoom < 0.6); }, [zoom, onOverviewChange]);
  return <div className="studio-canvas-zoom" role="group" aria-label="Diagram zoom">
    {zoom < 0.15 && <><span className="studio-canvas-overview-hint">Overview: zoom in to read.</span>{canFocusSelected ? <button type="button" onClick={() => focusOverview(onFocusSelected)}>Focus selected</button> : <button type="button" disabled={!canFocusRoot} onClick={() => focusOverview(onFocusRoot)}>Focus view root</button>}</>}
    <span aria-label="Diagram zoom level">{Math.round(zoom * 100)}%</span>
    <button ref={resetControl} type="button" aria-label="Reset zoom to 100%" onClick={() => { onManualInteraction(); void zoomTo(1, { duration: motionDuration(200) }); }}>100%</button>
  </div>;
}
export default function ModellingCanvas({ graph, viewId, selectedName, onSelect, onManualInteraction, onConnect, onEditRelationship, pendingEdgeEdit, onLayoutChange, viewGroups = [], groupsEditable = false, onCreateGroup, onRemoveGroup, newGroupName, setNewGroupName }) {
  const [nodes, setNodes] = useState([]);
  const [selectedEdgeId, setSelectedEdgeId] = useState('');
  const [layoutSelection, setLayoutSelection] = useState(() => new Set());
  const [groupNotice, setGroupNotice] = useState('');
  const [overview, setOverview] = useState(false);
  const [showMinimap, setShowMinimap] = useState(false);
  const [initialPins] = useState(() => {
    try { return { pins: readCanvasPins(sessionStorage, graph.workspaceId, viewId), writable: true }; }
    catch { return { pins: new Set(), writable: false }; }
  });
  const [layoutPins, setLayoutPins] = useState(initialPins.pins);
  const [initialHidden] = useState(() => {
    try { return { names: readCanvasHidden(sessionStorage, graph.workspaceId, viewId), writable: true }; }
    catch { return { names: new Set(), writable: false }; }
  });
  const [hiddenNodes, setHiddenNodes] = useState(initialHidden.names);
  const [hiddenRecoveryNeeded, setHiddenRecoveryNeeded] = useState(!initialHidden.writable);
  const [hiddenNotice, setHiddenNotice] = useState('');
  const [pinRecoveryNeeded, setPinRecoveryNeeded] = useState(!initialPins.writable);
  const [pinNotice, setPinNotice] = useState('');
  const [layoutNotice, setLayoutNotice] = useState('');
  const [viewportNotice, setViewportNotice] = useState('');
  const [layoutHistory, setLayoutHistory] = useState([]);
  const [layoutRedo, setLayoutRedo] = useState([]);
  const [draggingLayout, setDraggingLayout] = useState(false);
  const [layoutState, setLayoutState] = useState('pending');
  const [layoutAttempt, setLayoutAttempt] = useState(0);
  const [initialLayout] = useState(() => {
    try { return { positions: readCanvasPositions(sessionStorage, graph.workspaceId, viewId, { strict: true }), writable: true }; }
    catch { return { positions: Object.create(null), writable: false }; }
  });
  const [missingPinnedPositions] = useState(() => [...initialPins.pins].some(name => !initialLayout.positions[name]));
  const positions = useRef(initialLayout.positions);
  const storageWritable = useRef(initialLayout.writable);
  const [layoutRecoveryNeeded, setLayoutRecoveryNeeded] = useState(!initialLayout.writable);
  const worker = useRef(null), sequence = useRef(0), instance = useRef(null), lastRoot = useRef(null), fitted = useRef(false);
  const arranging = useRef(false), layoutMenu = useRef(null);
  const dragBefore = useRef(null);
  const byName = useRef(new Map());
  const activeNodes = useMemo(() => graph.nodes.filter(node => !hiddenNodes.has(node.name) || node.name === graph.root || node.name === selectedName), [graph.nodes, graph.root, selectedName, hiddenNodes]);
  const visibleNames = useMemo(() => new Set(activeNodes.map(node => node.name)), [activeNodes]);
  const activeEdges = useMemo(() => graph.edges.filter(edge => visibleNames.has(edge.source) && visibleNames.has(edge.target)), [graph.edges, visibleNames]);
  const frameRoot = useCallback(root => {
    if (!instance.current || lastRoot.current !== root) return false;
    const saved = readCanvasViewport(sessionStorage, graph.workspaceId, viewId, root);
    if (saved) {
      fitted.current = true;
      void instance.current.setViewport(saved, { duration: 0 });
      return true;
    }
    const point = positions.current[root];
    if (!point) return false;
    fitted.current = true;
    void instance.current.setCenter(point.x + 110, point.y + 64, { zoom: 1, duration: motionDuration(200) });
    return true;
  }, [graph.workspaceId, viewId]);
  const recordLayoutChange = useCallback((before, after, names, label) => {
    const entry = positionChange(before, after, names, label);
    if (entry) { setLayoutHistory(previous => [...previous.slice(-19), entry]); setLayoutRedo([]); }
  }, []);
  useEffect(() => {
    if (!storageWritable.current) setLayoutNotice('Local layout could not be read. Diagram changes remain in memory; load a saved shared view to restore its layout before saving.');
  }, []);
  useEffect(() => {
    try {
      worker.current = new Worker(new URL('./model/layout.worker.js', import.meta.url), { type: 'module' });
      worker.current.onerror = () => { arranging.current = false; setLayoutState('unavailable'); setLayoutNotice('Automatic layout is unavailable; the list remains usable.'); };
    } catch { setLayoutState('unavailable'); setLayoutNotice('Automatic layout is unavailable; the list remains usable.'); }
    return () => { sequence.current += 1; worker.current?.terminate(); worker.current = null; };
  }, [layoutAttempt]);
  useEffect(() => {
    if (arranging.current) setLayoutNotice('Layout cancelled because the diagram changed.');
    arranging.current = false;
    byName.current = new Map(graph.nodes.map(node => [node.name, node]));
    const newNames = new Set(graph.nodes.filter(node => !positions.current[node.name]).map(node => node.name));
    const next = graph.nodes.map((node, index) => ({ id: node.name, type: 'concept', position: positions.current[node.name] ?? { x: index ? 340 : 0, y: index ? (index - 1) * 150 : 0 }, data: { label: node.label, module: node.module, fields: node.fields, changeStatus: node.changeStatus }, className: `studio-flow-node studio-flow-${node.changeStatus}`, selected: node.name === selectedName }));
    setNodes(next);
    const changedRoot = lastRoot.current !== graph.root;
    if (changedRoot) { lastRoot.current = graph.root; fitted.current = false; }
    if (!fitted.current && instance.current) frameRoot(graph.root);
    const requestId = ++sequence.current;
    if (!worker.current) return;
    if (!newNames.size) {
      setLayoutState('ready');
      if (layoutAttempt > 0 && storageWritable.current) setLayoutNotice('Automatic layout is ready.');
      if (!fitted.current && instance.current) requestAnimationFrame(() => frameRoot(graph.root));
      return;
    }
    setLayoutState('pending');
    const dimensions = layoutNodes(graph.nodes.map(node => node.name), instance.current);
    const sizes = new Map(dimensions.map(node => [node.id, node]));
    worker.current.onmessage = event => {
      if (event.data.requestId !== sequence.current) return;
      if (event.data.error) { setLayoutState('unavailable'); setLayoutNotice(event.data.error); return; }
      const layout = new Map(event.data.positions.map(point => [point.id, point]));
      const occupied = Object.entries(positions.current).map(([name, point]) => layoutBox(point, sizes.get(name))), placed = new Map();
      for (const node of graph.nodes) {
        if (!newNames.has(node.name) || positions.current[node.name] || !layout.has(node.name)) continue;
        const point = layout.get(node.name), position = { x: point.x, y: point.y };
        const size = sizes.get(node.name);
        while (occupied.some(other => boxesOverlap(other, layoutBox(position, size)))) position.y += (size?.height ?? 128) + 20;
        occupied.push(layoutBox(position, size)); positions.current[node.name] = position; placed.set(node.name, position);
      }
      setNodes(current => current.map(node => placed.has(node.id) ? { ...node, position: placed.get(node.id) } : node));
      if (storageWritable.current) try { writeCanvasPositions(sessionStorage, graph.workspaceId, viewId, positions.current); } catch { /* Layout remains available for this session. */ }
      setLayoutState('ready');
      if (layoutAttempt > 0 && storageWritable.current) setLayoutNotice('Automatic layout is ready.');
      // Start at a readable scale around the selected concept. Fitting every
      // neighbour on a dense graph can shrink all labels beyond recognition;
      // the built-in Fit View control remains available for an overview.
      if (!fitted.current && instance.current) {
        requestAnimationFrame(() => frameRoot(graph.root));
      }
    };
    worker.current.postMessage({ requestId, nodes: dimensions, edges: graph.edges.map(edge => ({ id: edge.id, source: edge.source, target: edge.target })) });
  }, [graph, selectedName, viewId, layoutAttempt, frameRoot]);
  const onNodesChange = useCallback(changes => {
    const before = { ...positions.current };
    let moved = false;
    for (const change of changes) if (change.type === 'position' && change.position) { positions.current[change.id] = change.position; if (!change.dragging) moved = true; }
    if (moved) onLayoutChange();
    if (moved && storageWritable.current) try { writeCanvasPositions(sessionStorage, graph.workspaceId, viewId, positions.current); } catch { /* layout remains available for this session */ }
    if (moved && !dragBefore.current) recordLayoutChange(before, positions.current, changes.filter(change => change.type === 'position' && change.position && !change.dragging).map(change => change.id), 'move');
    setNodes(current => applyNodeChanges(changes.filter(change => change.type !== 'remove'), current));
  }, [graph.workspaceId, viewId, onLayoutChange, recordLayoutChange]);
  const onNodeDragStop = useCallback((_event, node) => {
    positions.current[node.id] = { x: node.position.x, y: node.position.y };
    onLayoutChange();
    if (storageWritable.current) try { writeCanvasPositions(sessionStorage, graph.workspaceId, viewId, positions.current); } catch { /* layout remains available for this session */ }
    if (dragBefore.current) recordLayoutChange(dragBefore.current.before, positions.current, dragBefore.current.names, 'move');
    dragBefore.current = null; setDraggingLayout(false);
  }, [graph.workspaceId, viewId, onLayoutChange, recordLayoutChange]);
  const selectNode = useCallback(node => { const item = byName.current.get(node.id); if (item && onSelect(item) !== false) setSelectedEdgeId(''); }, [onSelect]);
  useEffect(() => {
    setSelectedEdgeId(id => id && !activeEdges.some(edge => edge.id === id) ? '' : id);
  }, [activeEdges]);
  useEffect(() => {
    setLayoutSelection(previous => {
      const retained = [...previous].filter(name => visibleNames.has(name));
      return retained.length === previous.size ? previous : new Set(retained);
    });
  }, [visibleNames]);
  const selectedEdge = activeEdges.find(edge => edge.id === selectedEdgeId) ?? null;
  const displayNodes = useMemo(() => nodes.filter(node => visibleNames.has(node.id)).map(node => ({ ...node, className: `${node.className}${layoutSelection.has(node.id) ? ' studio-layout-selected' : ''}${selectedEdge && (node.id === selectedEdge.source || node.id === selectedEdge.target) ? ' studio-relationship-endpoint' : ''}`, data: { ...node.data, layoutSelected: layoutSelection.has(node.id), layoutPinned: layoutPins.has(node.id), overview } })), [nodes, layoutSelection, layoutPins, overview, visibleNames, selectedEdge]);
  const groupFrames = useMemo(() => canvasGroupFrames(viewGroups, displayNodes), [viewGroups, displayNodes]);
  function toggleLayoutSelection(name) {
    if (!visibleNames.has(name)) return;
    onManualInteraction();
    setLayoutSelection(previous => {
      const next = new Set(previous);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }
  function selectConnectedConcepts() {
    const connected = new Set(visibleNames.has(selectedName) ? [selectedName] : []);
    for (const edge of activeEdges) {
      if (edge.source === selectedName) connected.add(edge.target);
      if (edge.target === selectedName) connected.add(edge.source);
    }
    setLayoutSelection(connected);
    onManualInteraction();
  }
  function focusLayoutSelection() {
    const names = [...layoutSelection].filter(name => visibleNames.has(name));
    if (!instance.current || !names.length || layoutState !== 'ready') return;
    onManualInteraction();
    void instance.current.fitView({ nodes: names.map(id => ({ id })), padding: 0.2, minZoom: MIN_CANVAS_ZOOM, maxZoom: 1, duration: motionDuration(200) });
  }
  function alignLayoutSelection(axis) {
    if (layoutState !== 'ready' || layoutSelection.size < 2 || !storageWritable.current || pinRecoveryNeeded || [...layoutSelection].some(name => layoutPins.has(name))) return;
    const names = [...layoutSelection].filter(name => visibleNames.has(name) && positions.current[name]);
    if (names.length < 2) return;
    const coordinate = Math.min(...names.map(name => positions.current[name][axis]));
    const next = { ...positions.current };
    let changed = false;
    for (const name of names) {
      const point = positions.current[name];
      if (point[axis] !== coordinate) { next[name] = { ...point, [axis]: coordinate }; changed = true; }
    }
    if (!changed) { setLayoutNotice(`Selected concepts are already aligned ${axis === 'x' ? 'left' : 'at the top'}.`); return; }
    try { writeCanvasPositions(sessionStorage, graph.workspaceId, viewId, next); }
    catch { setLayoutNotice('Could not store the alignment. No positions were changed.'); return; }
    recordLayoutChange(positions.current, next, names, 'alignment');
    positions.current = next;
    setNodes(current => current.map(node => names.includes(node.id) ? { ...node, position: next[node.id] } : node));
    onManualInteraction(); onLayoutChange();
    setLayoutNotice(`Aligned ${names.length} concepts locally. Save the shared view to share this layout.`);
  }
  function distributeLayoutSelection(axis) {
    if (layoutState !== 'ready' || layoutSelection.size < 3 || !storageWritable.current || pinRecoveryNeeded || [...layoutSelection].some(name => layoutPins.has(name))) return;
    const names = [...layoutSelection].filter(name => visibleNames.has(name) && positions.current[name]);
    if (names.length < 3) return;
    const next = distributePositions(positions.current, names, axis);
    if (!names.some(name => next[name][axis] !== positions.current[name][axis])) { setLayoutNotice('Selected concepts are already evenly spaced.'); return; }
    try { writeCanvasPositions(sessionStorage, graph.workspaceId, viewId, next); }
    catch { setLayoutNotice('Could not store the distribution. No positions were changed.'); return; }
    recordLayoutChange(positions.current, next, names, 'distribution');
    positions.current = next;
    setNodes(current => current.map(node => names.includes(node.id) ? { ...node, position: next[node.id] } : node));
    onManualInteraction(); onLayoutChange();
    setLayoutNotice(`Distributed ${names.length} concepts locally. Save the shared view to share this layout.`);
  }
  function createSelectedGroup(event) {
    event.preventDefault();
    const name = newGroupName.trim(), members = [...layoutSelection].filter(item => visibleNames.has(item)).sort();
    if (!groupsEditable || !onCreateGroup || layoutState === 'pending') { setGroupNotice('Load the current shared view before editing its groups.'); return; }
    if (!name || name.length > 100 || !members.length || members.length > 100 || viewGroups.length >= 50) { setGroupNotice('Enter a group name and select 1–100 visible concepts; a view supports up to 50 groups.'); return; }
    if (viewGroups.some(group => group.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase())) { setGroupNotice('A group with that name already exists in this view.'); return; }
    try {
      if (onCreateGroup({ name, members }) === false) { setGroupNotice('The view changed. Review it before adding a group.'); return; }
      setNewGroupName(''); setGroupNotice(`Added ${name} to this local view. Save the shared view to share it.`); onManualInteraction();
    } catch { setGroupNotice('Could not add the group. No group was added.'); }
  }
  function removeViewGroup(index, group) {
    if (!groupsEditable || !onRemoveGroup || layoutState === 'pending') { setGroupNotice('Load the current shared view before editing its groups.'); return; }
    try {
      if (onRemoveGroup(index, group) === false) { setGroupNotice('The view changed. Review it before removing the group.'); return; }
      setGroupNotice(`Removed ${group.name} from this local view. Save the shared view to share it.`); onManualInteraction();
    } catch { setGroupNotice('Could not remove the group. No group was removed.'); }
  }
  function setSelectedPins(pinned) {
    if (layoutState !== 'ready' || pinRecoveryNeeded || !storageWritable.current || !layoutSelection.size) return;
    const names = [...layoutSelection].filter(name => visibleNames.has(name) && positions.current[name]);
    if (!names.length) return;
    const next = new Set(layoutPins);
    for (const name of names) {
      if (pinned) next.add(name); else next.delete(name);
    }
    try { writeCanvasPins(sessionStorage, graph.workspaceId, viewId, next); }
    catch { setPinNotice('Could not save pin settings. They were not changed.'); return; }
    setLayoutPins(next);
    setPinNotice(pinned ? 'Selected concepts pinned in this browser tab.' : 'Selected concepts unpinned in this browser tab.');
    onManualInteraction();
  }
  function replaceUnreadablePins() {
    try {
      writeCanvasPins(sessionStorage, graph.workspaceId, viewId, new Set());
      setLayoutPins(new Set()); setPinRecoveryNeeded(false); setPinNotice('Local pin settings replaced.');
    } catch { setPinNotice('Could not replace local pin settings.'); }
  }
  function updateHidden(next, message) {
    if (hiddenRecoveryNeeded || layoutState === 'pending') return;
    try { writeCanvasHidden(sessionStorage, graph.workspaceId, viewId, next); }
    catch { setHiddenNotice('Could not save diagram visibility. Nothing was changed.'); return; }
    setHiddenNodes(next); setHiddenNotice(message);
    setLayoutSelection(previous => new Set([...previous].filter(name => !next.has(name) || name === graph.root || name === selectedName)));
    onManualInteraction();
  }
  function hideSelected() {
    const names = [...layoutSelection].filter(name => visibleNames.has(name) && name !== graph.root && name !== selectedName);
    if (!names.length) return;
    const next = new Set(hiddenNodes);
    for (const name of names) next.add(name);
    updateHidden(next, `Hidden ${names.length} ${names.length === 1 ? 'concept' : 'concepts'} in this diagram.`);
  }
  function restoreHidden(name) {
    const next = new Set(hiddenNodes);
    if (name) next.delete(name); else next.clear();
    updateHidden(next, name ? `Restored ${name} to this diagram.` : 'Restored hidden concepts to this diagram.');
  }
  function replaceUnreadableHidden() {
    try {
      writeCanvasHidden(sessionStorage, graph.workspaceId, viewId, new Set());
      setHiddenNodes(new Set()); setHiddenRecoveryNeeded(false); setHiddenNotice('Local visibility settings replaced.');
    } catch { setHiddenNotice('Could not replace local visibility settings.'); }
  }
  function inspectEdge(id) {
    if (id && !activeEdges.some(edge => edge.id === id)) return;
    onManualInteraction();
    setSelectedEdgeId(id);
  }
  function inspectEndpoint(name) {
    const item = byName.current.get(name);
    if (item) { onManualInteraction(); onSelect(item); }
  }
  const focusSelected = useCallback(() => {
    const point = positions.current[selectedName];
    if (!point || !byName.current.has(selectedName) || !instance.current) return;
    onManualInteraction();
    void instance.current.setCenter(point.x + 110, point.y + 64, { zoom: 1, duration: motionDuration(250) });
  }, [selectedName, onManualInteraction]);
  const focusRoot = useCallback(() => {
    const point = positions.current[graph.root];
    if (!point || !instance.current) return;
    onManualInteraction();
    void instance.current.setCenter(point.x + 110, point.y + 64, { zoom: 1, duration: motionDuration(250) });
  }, [graph.root, onManualInteraction]);
  function panDiagram(dx, dy) {
    if (!instance.current) return;
    const viewport = instance.current.getViewport();
    onManualInteraction();
    void instance.current.setViewport({ ...viewport, x: viewport.x + dx, y: viewport.y + dy }, { duration: 0 });
  }
  const offsets = parallelEdgeOffsets(activeEdges);
  function arrangeVisible() {
    if (!worker.current || layoutState !== 'ready') return;
    if (!storageWritable.current) { setLayoutNotice('Resolve unreadable local layout before arranging concepts.'); return; }
    if (pinRecoveryNeeded) { setLayoutNotice('Resolve unreadable pin settings before arranging concepts.'); return; }
    if (activeNodes.every(node => layoutPins.has(node.name))) { setLayoutNotice('All visible concepts are pinned. Unpin one to arrange it.'); return; }
    const requestId = ++sequence.current;
    const dimensions = layoutNodes(activeNodes.map(node => node.name), instance.current);
    const sizes = new Map(dimensions.map(node => [node.id, node]));
    arranging.current = true;
    setLayoutState('pending');
    setLayoutNotice('Arranging visible concepts…');
    onManualInteraction();
    worker.current.onmessage = event => {
      if (event.data.requestId !== sequence.current) return;
      arranging.current = false;
      const points = event.data.positions;
      const names = new Set(activeNodes.map(node => node.name));
      if (event.data.error || !Array.isArray(points) || points.length !== names.size || points.some(point => !names.has(point.id) || !Number.isFinite(point.x) || !Number.isFinite(point.y)) || new Set(points.map(point => point.id)).size !== names.size) {
        setLayoutState('unavailable'); setLayoutNotice('Could not arrange the diagram. Existing positions were kept.'); return;
      }
      const layout = new Map(), occupied = [...layoutPins].filter(name => positions.current[name]).map(name => layoutBox(positions.current[name], sizes.get(name)));
      for (const point of points) {
        if (layoutPins.has(point.id) && positions.current[point.id]) continue;
        const position = { x: point.x, y: point.y };
        const size = sizes.get(point.id);
        while (occupied.some(other => boxesOverlap(other, layoutBox(position, size)))) position.y += (size?.height ?? 128) + 20;
        if (Math.abs(position.x) >= 100000 || Math.abs(position.y) >= 100000) { setLayoutState('unavailable'); setLayoutNotice('Could not arrange the diagram without exceeding position limits. Existing positions were kept.'); return; }
        occupied.push(layoutBox(position, size)); layout.set(point.id, position);
      }
      let changed = false;
      for (const [name, point] of layout) {
        const before = positions.current[name];
        if (!before || before.x !== point.x || before.y !== point.y) changed = true;
      }
      if (changed) {
        const next = { ...positions.current };
        for (const [name, point] of layout) next[name] = point;
        try { writeCanvasPositions(sessionStorage, graph.workspaceId, viewId, next); }
        catch { setLayoutState('ready'); setLayoutNotice('Could not store the arrangement. No positions were changed.'); return; }
        recordLayoutChange(positions.current, next, [...layout.keys()], 'arrangement');
        positions.current = next;
        setNodes(current => current.map(node => layout.has(node.id) ? { ...node, position: layout.get(node.id) } : node));
        onLayoutChange();
      }
      setLayoutState('ready');
      setLayoutNotice(changed ? 'Visible concepts arranged locally. Save the shared view to share this layout.' : 'Visible concepts are already arranged.');
      if (layoutMenu.current) layoutMenu.current.open = false;
    };
    try { worker.current.postMessage({ requestId, nodes: dimensions, edges: activeEdges.map(edge => ({ id: edge.id, source: edge.source, target: edge.target })) }); }
    catch { arranging.current = false; setLayoutState('unavailable'); setLayoutNotice('Could not arrange the diagram. Existing positions were kept.'); }
  }
  function startNodeDrag(_event, node, draggedNodes) {
    const names = draggedNodes?.length ? draggedNodes.map(item => item.id) : [node.id];
    dragBefore.current = { before: { ...positions.current }, names };
    setDraggingLayout(true);
    if (arranging.current) {
      arranging.current = false;
      sequence.current += 1;
      setLayoutState('ready');
      setLayoutNotice('Layout cancelled because you moved a concept.');
    }
    onManualInteraction();
  }
  function undoLayout() {
    const entry = layoutHistory.at(-1);
    if (!entry || layoutState === 'pending' || draggingLayout || !storageWritable.current) return;
    let next;
    try {
      const stored = readCanvasPositions(sessionStorage, graph.workspaceId, viewId, { strict: true });
      if (!samePositionMaps(stored, positions.current)) throw new Error('Local layout changed outside this view');
      next = undoPositionChange(stored, entry);
      writeCanvasPositions(sessionStorage, graph.workspaceId, viewId, next);
    } catch { setLayoutNotice('Could not undo: the local layout changed or could not be stored. No positions were changed.'); return; }
    positions.current = next;
    const affected = new Set(entry.changes.map(change => change.name));
    setNodes(current => current.map(node => affected.has(node.id) ? { ...node, position: next[node.id] } : node));
    setLayoutHistory(previous => previous.slice(0, -1));
    setLayoutRedo(previous => [...previous.slice(-19), entry]);
    onManualInteraction(); onLayoutChange();
    setLayoutNotice(`Undid the last layout ${entry.label}. Ontology and pin settings are unchanged.`);
  }
  function redoLayout() {
    const entry = layoutRedo.at(-1);
    if (!entry || layoutState === 'pending' || draggingLayout || !storageWritable.current) return;
    let next;
    try {
      const stored = readCanvasPositions(sessionStorage, graph.workspaceId, viewId, { strict: true });
      if (!samePositionMaps(stored, positions.current)) throw new Error('Local layout changed outside this view');
      next = redoPositionChange(stored, entry);
      writeCanvasPositions(sessionStorage, graph.workspaceId, viewId, next);
    } catch { setLayoutNotice('Could not redo: the local layout changed or could not be stored. No positions were changed.'); return; }
    positions.current = next;
    const affected = new Set(entry.changes.map(change => change.name));
    setNodes(current => current.map(node => affected.has(node.id) ? { ...node, position: next[node.id] } : node));
    setLayoutRedo(previous => previous.slice(0, -1));
    setLayoutHistory(previous => [...previous.slice(-19), entry]);
    onManualInteraction(); onLayoutChange();
    setLayoutNotice(`Redid the last layout ${entry.label}. Ontology and pin settings are unchanged.`);
  }
  function replaceUnreadableLayout() {
    try {
      writeCanvasPositions(sessionStorage, graph.workspaceId, viewId, positions.current);
      storageWritable.current = true;
      setLayoutRecoveryNeeded(false);
      setLayoutNotice('Local layout replaced with the current diagram positions. Save the shared view to share it.');
    } catch { setLayoutNotice('Local layout could not be replaced. Check browser storage access and try again.'); }
  }
  return <><div className="studio-flow" role="region" aria-label={`Relationships for ${graph.root}`} data-layout={layoutState} data-detail={overview ? 'overview' : 'full'}
    onMouseDownCapture={event => {
      if (!event.shiftKey || event.button !== 0) return;
      const node = event.target.closest?.('.react-flow__node[data-id]');
      if (node) { event.preventDefault(); event.stopPropagation(); toggleLayoutSelection(node.dataset.id); }
    }}
    onClickCapture={event => {
      if (event.shiftKey && event.target.closest?.('.react-flow__node[data-id]')) { event.preventDefault(); event.stopPropagation(); }
    }}
    onKeyDownCapture={event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const node = event.target.closest?.('.react-flow__node[data-id]');
      if (node) { event.preventDefault(); event.stopPropagation(); if (event.shiftKey) toggleLayoutSelection(node.dataset.id); else { onManualInteraction(); selectNode({ id: node.dataset.id }); } return; }
      const edge = event.target.closest?.('.react-flow__edge[data-id]');
      if (edge) { event.preventDefault(); event.stopPropagation(); inspectEdge(edge.dataset.id); }
    }}>
    {layoutNotice && <div className="studio-layout-notice"><p role="status">{layoutNotice}</p>{layoutRecoveryNeeded && <button type="button" disabled={layoutState !== 'ready'} onClick={replaceUnreadableLayout}>Replace unreadable local layout</button>}</div>}
    <details ref={layoutMenu} className="studio-canvas-layout-menu">
      <summary>Layout</summary>
      <p>Arrange visible concepts automatically. Pinned concepts and hidden concepts are unchanged.</p>
      <p>Pins are local to this browser tab and view; they are not included in shared views.</p>
      <p>Dragging a pinned concept moves it explicitly and keeps it pinned.</p>
      {missingPinnedPositions && <p>Some previously pinned positions were unavailable. Check their positions before continuing.</p>}
      {pinRecoveryNeeded && <><p>Local pin settings could not be read. Replacing them removes the stored pins for this view.</p><button type="button" onClick={replaceUnreadablePins}>Replace unreadable pin settings</button></>}
      <button type="button" disabled={layoutState !== 'ready' || layoutRecoveryNeeded || pinRecoveryNeeded} onClick={arrangeVisible}>Arrange visible concepts</button>
      <label className="studio-canvas-minimap-toggle"><input type="checkbox" checked={showMinimap} onChange={event => setShowMinimap(event.target.checked)} /> Show diagram overview</label>
      {showMinimap && <p>Drag or scroll in the overview to navigate. Use Pan diagram or the zoom controls to navigate with the keyboard.</p>}
      <details>
        <summary>Pan diagram</summary>
        <p>Move the diagram in the indicated direction without moving individual concepts.</p>
        <div className="studio-canvas-edge-actions" role="group" aria-label="Pan diagram">
          <button type="button" onClick={() => panDiagram(-100, 0)}>Move diagram left</button>
          <button type="button" onClick={() => panDiagram(100, 0)}>Move diagram right</button>
          <button type="button" onClick={() => panDiagram(0, -100)}>Move diagram up</button>
          <button type="button" onClick={() => panDiagram(0, 100)}>Move diagram down</button>
        </div>
      </details>
      <button type="button" disabled={!layoutHistory.length || layoutState === 'pending' || draggingLayout || layoutRecoveryNeeded} onClick={undoLayout}>Undo last layout change</button>
      <button type="button" disabled={!layoutRedo.length || layoutState === 'pending' || draggingLayout || layoutRecoveryNeeded} onClick={redoLayout}>Redo last layout change</button>
      {layoutHistory.length > 0 && <p>Last {layoutHistory.at(-1).label}: {layoutHistory.at(-1).changes.slice(0, 5).map(change => change.name).join(', ')}{layoutHistory.at(-1).changes.length > 5 ? ` and ${layoutHistory.at(-1).changes.length - 5} more` : ''}. Undo restores positions even if pinned. It does not change the ontology or pin settings; history clears on reload.</p>}
      {layoutState === 'unavailable' && <button type="button" onClick={() => { setLayoutNotice('Retrying automatic layout...'); setLayoutState('pending'); setLayoutAttempt(value => value + 1); }}>Retry automatic layout</button>}
      <details>
        <summary>Align selected concepts</summary>
        <p>Select concepts below or use Shift+click or Shift+Enter on a card. Alignment and distribution change only this view and may overlap cards. Distribution spaces card positions evenly between the outermost selected cards. Unpin selected concepts before alignment. Distribution also requires unpinned concepts.</p>
        <div className="studio-canvas-edge-actions"><button type="button" disabled={!activeNodes.length} onClick={() => { setLayoutSelection(new Set(activeNodes.map(node => node.name))); onManualInteraction(); }}>Select all visible concepts</button><button type="button" disabled={!visibleNames.has(selectedName)} onClick={selectConnectedConcepts}>Select {selectedName} and visible neighbours</button></div>
        <fieldset className="studio-layout-choices"><legend>Concepts for alignment</legend>{activeNodes.map(node => <label className="studio-layout-choice" key={node.name}><input type="checkbox" checked={layoutSelection.has(node.name)} onChange={() => toggleLayoutSelection(node.name)} />{node.name}{layoutPins.has(node.name) ? ' (pinned)' : ''}</label>)}</fieldset>
        <p aria-live="polite">{layoutSelection.size} concepts selected for layout.</p>
        {layoutRecoveryNeeded && <p>Replace the unreadable local layout before aligning or pinning concepts.</p>}
        {pinNotice && <p aria-live="polite">{pinNotice}</p>}
        <div className="studio-canvas-edge-actions">
          <button type="button" disabled={layoutState !== 'ready' || !layoutSelection.size} onClick={focusLayoutSelection}>Focus selected layout concepts</button>
          <button type="button" disabled={layoutState !== 'ready' || layoutSelection.size < 2 || layoutRecoveryNeeded || pinRecoveryNeeded || [...layoutSelection].some(name => layoutPins.has(name))} onClick={() => alignLayoutSelection('x')}>Align left</button>
          <button type="button" disabled={layoutState !== 'ready' || layoutSelection.size < 2 || layoutRecoveryNeeded || pinRecoveryNeeded || [...layoutSelection].some(name => layoutPins.has(name))} onClick={() => alignLayoutSelection('y')}>Align top</button>
          <button type="button" disabled={layoutState !== 'ready' || layoutSelection.size < 3 || layoutRecoveryNeeded || pinRecoveryNeeded || [...layoutSelection].some(name => layoutPins.has(name))} onClick={() => distributeLayoutSelection('x')}>Distribute horizontally</button>
          <button type="button" disabled={layoutState !== 'ready' || layoutSelection.size < 3 || layoutRecoveryNeeded || pinRecoveryNeeded || [...layoutSelection].some(name => layoutPins.has(name))} onClick={() => distributeLayoutSelection('y')}>Distribute vertically</button>
          <button type="button" disabled={layoutState !== 'ready' || !layoutSelection.size || layoutRecoveryNeeded || pinRecoveryNeeded || [...layoutSelection].every(name => layoutPins.has(name))} onClick={() => setSelectedPins(true)}>Pin selected</button>
          <button type="button" disabled={layoutState !== 'ready' || !layoutSelection.size || layoutRecoveryNeeded || pinRecoveryNeeded || [...layoutSelection].every(name => !layoutPins.has(name))} onClick={() => setSelectedPins(false)}>Unpin selected</button>
          <button type="button" disabled={!layoutSelection.size} onClick={() => setLayoutSelection(new Set())}>Clear layout selection</button>
          <button type="button" disabled={layoutState === 'pending' || hiddenRecoveryNeeded || ![...layoutSelection].some(name => visibleNames.has(name) && name !== graph.root && name !== selectedName)} onClick={hideSelected}>Hide selected from diagram</button>
        </div>
        <form onSubmit={createSelectedGroup} className="studio-canvas-group-form">
          <label>New group name <input value={newGroupName} onChange={event => setNewGroupName(event.target.value)} maxLength={100} /></label>
          <button type="submit" disabled={!groupsEditable || !onCreateGroup || layoutState === 'pending' || !layoutSelection.size || !newGroupName.trim() || viewGroups.length >= 50}>Group selected concepts</button>
          <button type="button" disabled={!newGroupName} onClick={() => setNewGroupName('')}>Clear canvas group name</button>
        </form>
        <p>Grouping is presentation data for this view. Save the shared view to share it.</p>
        {!groupsEditable && <p>Load the current shared view before changing groups.</p>}
        {groupNotice && <p aria-live="polite">{groupNotice}</p>}
      </details>
      <details>
        <summary>Hidden concepts ({hiddenNodes.size})</summary>
        <p>Hiding applies only to this browser tab and view. It does not delete model data or change the shared view. The root and current selection are always shown.</p>
        {hiddenRecoveryNeeded ? <><p>Local visibility settings could not be read. Replacing them removes stored hidden concepts for this view.</p><button type="button" onClick={replaceUnreadableHidden}>Replace unreadable visibility settings</button></> : hiddenNodes.size ? <><button type="button" disabled={layoutState === 'pending'} onClick={() => restoreHidden(null)}>Restore all hidden concepts</button><ul>{[...hiddenNodes].sort().map(name => <li key={name}>{name}{visibleNames.has(name) ? ' (shown while root or selected)' : ''} <button type="button" disabled={layoutState === 'pending'} onClick={() => restoreHidden(name)}>Restore {name}</button></li>)}</ul></> : <p>No concepts are hidden in this view.</p>}
        {hiddenNotice && <p aria-live="polite">{hiddenNotice}</p>}
      </details>
    </details>
    <ReactFlow nodes={displayNodes} nodeTypes={nodeTypes} edgeTypes={edgeTypes} edges={activeEdges.map(edge => ({ id: edge.id, type: 'relationship', source: edge.source, target: edge.target, label: edge.cardinality ? `${edge.predicate} ${multiplicity[edge.cardinality] ?? edge.cardinality}` : edge.predicate, data: { offset: offsets.get(edge.id) }, selected: edge.id === selectedEdgeId, markerEnd: { type: MarkerType.ArrowClosed, color: '#506d69' }, className: `studio-flow-edge-${edge.changeStatus}${edge.predicate === 'subClassOf' ? ' studio-flow-inheritance' : ''}` }))}
      onInit={value => { instance.current = value; if (!fitted.current && lastRoot.current) frameRoot(lastRoot.current); }} onNodesChange={onNodesChange} onNodeDragStop={onNodeDragStop} onNodeDragStart={startNodeDrag} onMoveStart={event => { if (event?.isTrusted) onManualInteraction(); }} onMoveEnd={(_event, viewport) => {
        if (!lastRoot.current) return;
        try { writeCanvasViewport(sessionStorage, graph.workspaceId, viewId, lastRoot.current, viewport); setViewportNotice(''); }
        catch { setViewportNotice('This browser tab could not remember the diagram position.'); }
      }} onNodeClick={(_event, node) => { onManualInteraction(); selectNode(node); }} onEdgeClick={(_event, edge) => inspectEdge(edge.id)}
      onConnect={connection => { onManualInteraction(); onConnect(connection); }}
      nodesConnectable deleteKeyCode={null} minZoom={MIN_CANVAS_ZOOM} maxZoom={2} aria-label="Interactive concept graph">
      <ViewportPortal>{groupFrames.map(frame => <div key={frame.index} className="studio-canvas-group-frame" aria-hidden="true" style={{ left: frame.left, top: frame.top, width: frame.width, height: frame.height }}><span>{frame.name}</span></div>)}</ViewportPortal>
      {showMinimap && <MiniMap className="studio-canvas-minimap" position="top-left" style={{ width: 140, height: 90 }} ariaLabel="Diagram overview" nodeColor="#5c8580" maskColor="rgba(20, 42, 42, .25)" pannable zoomable onClick={onManualInteraction} />}
      <Background /><Controls showInteractive={false}><ControlButton className="studio-focus-control" aria-label="Focus selected concept" title="Focus selected concept" disabled={layoutState !== 'ready' || !visibleNames.has(selectedName)} onClick={focusSelected}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7" /><path d="M12 2v4m0 12v4M2 12h4m12 0h4" /></svg></ControlButton></Controls><ZoomReadout onManualInteraction={onManualInteraction} onOverviewChange={setOverview} onFocusSelected={focusSelected} onFocusRoot={focusRoot} canFocusSelected={layoutState === 'ready' && visibleNames.has(selectedName)} canFocusRoot={layoutState === 'ready' && visibleNames.has(graph.root)} />
    </ReactFlow>
  </div>
    {viewportNotice && <p className="studio-canvas-viewport-notice" aria-live="polite">{viewportNotice}</p>}
    {activeEdges.length > 0 && <div className="studio-canvas-line-legend" aria-label="Diagram relationship line styles"><span><i aria-hidden="true" /> Relationship</span><span><i className="studio-canvas-line-inheritance" aria-hidden="true" /> Inheritance (subClassOf)</span><span>Arrows point to the target.</span></div>}
    {viewGroups.length > 0 && <section className="studio-canvas-groups" aria-label="Diagram groups"><h3>Diagram groups</h3><p>Groups organize this view only; they do not add ontology relationships.</p><ul>{viewGroups.map((group, index) => <li key={`${index}-${group.name}`}><strong>{group.name}</strong> · {new Set(group.members.filter(name => visibleNames.has(name))).size} of {new Set(group.members).size} concepts shown<ul>{[...new Set(group.members)].map(name => <li key={name}>{name}{!visibleNames.has(name) ? ' — not shown' : ''}</li>)}</ul><button type="button" disabled={!groupsEditable || !onRemoveGroup || layoutState === 'pending'} onClick={() => removeViewGroup(index, group)}>Remove {group.name} from view</button></li>)}</ul></section>}
    {activeEdges.length > 0 && <div className="studio-canvas-edge-picker"><label>Inspect relationship <select value={selectedEdge?.id ?? ''} onChange={event => inspectEdge(event.target.value)}><option value="">Choose a visible relationship</option>{activeEdges.map(edge => <option key={edge.id} value={edge.id}>{edge.source} — {edge.predicate} → {edge.target}</option>)}</select></label></div>}
    {selectedEdge && <section className="studio-canvas-edge-details" aria-label="Relationship details" aria-live="polite">
      <h3>{selectedEdge.predicate === 'subClassOf' ? 'Inheritance' : 'Relationship'}: {selectedEdge.predicate}</h3>
      <p><strong>Direction:</strong> {selectedEdge.source} → {selectedEdge.target}</p>
      <p><strong>Multiplicity:</strong> {selectedEdge.cardinality ? multiplicity[selectedEdge.cardinality] ?? selectedEdge.cardinality : selectedEdge.predicate === 'subClassOf' ? 'Not applicable' : 'Not recorded'}</p>
      {selectedEdge.label && <p><strong>Mapping:</strong> {selectedEdge.label}</p>}
      {selectedEdge.sourceRef?.path && <p><strong>Source:</strong> {selectedEdge.sourceRef.path}{selectedEdge.sourceRef.line != null ? `:${selectedEdge.sourceRef.line}` : ''}</p>}
      {selectedEdge.mappingVersion && <p><strong>Mapping version:</strong> {selectedEdge.mappingVersion}</p>}
      <p>Inspect a concept to review its supported field controls. Selecting this relationship does not change the model.</p>
      {selectedEdge.predicate !== 'subClassOf' && <button type="button" disabled={Boolean(pendingEdgeEdit)} onClick={event => onEditRelationship(selectedEdge, event.currentTarget)}>Edit relationship {selectedEdge.predicate}</button>}
      <div className="studio-canvas-edge-actions"><button type="button" disabled={!graph.nodes.some(node => node.name === selectedEdge.source)} onClick={() => inspectEndpoint(selectedEdge.source)}>Inspect source {selectedEdge.source}</button><button type="button" disabled={!graph.nodes.some(node => node.name === selectedEdge.target)} onClick={() => inspectEndpoint(selectedEdge.target)}>Inspect target {selectedEdge.target}</button><button type="button" onClick={() => inspectEdge('')}>Close relationship details</button></div>
    </section>}
  </>;
}
