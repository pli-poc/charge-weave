import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Background, BaseEdge, ControlButton, Controls, Handle, MarkerType, Position, ReactFlow, applyNodeChanges, useReactFlow, useViewport } from '@xyflow/react';
import { parallelEdgeOffsets } from './model/parallel-edges.js';
import { readCanvasPositions, writeCanvasPositions } from './model/canvas-positions.js';
import { readCanvasPins, writeCanvasPins } from './model/canvas-pins.js';
import { positionChange, samePositionMaps, undoPositionChange } from './model/canvas-history.js';
import { readCanvasViewport, writeCanvasViewport } from './model/canvas-viewport.js';
import '@xyflow/react/dist/style.css';
import './canvas-layout-controls.css';

const motionDuration = duration => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : duration;
const ConceptNode = memo(function ConceptNode({ data }) {
  const fields = typeof data.fields === 'string' ? data.fields.split(/\s+/).filter(Boolean) : Array.isArray(data.fields) ? data.fields.map(field => `${field.property}:${field.range}${field.cardinality ?? ''}`) : [];
  return <>
    <Handle type="target" position={Position.Left} />
    <div className="studio-concept-card">
      <div className="studio-concept-heading"><span className="studio-concept-kind">CLASS</span><strong title={data.label}>{data.label}</strong></div>
      <div className="studio-concept-module">{data.module || 'Ontology concept'}</div>
      {['added', 'changed'].includes(data.changeStatus) && <div className="studio-concept-change">{data.changeStatus === 'added' ? 'Added in draft' : 'Changed in draft'}</div>}
      {data.layoutSelected && <span className="studio-concept-layout-selected">Selected for layout</span>}
      {data.layoutPinned && <span className="studio-concept-layout-pinned">Pinned</span>}
      {!data.overview && fields.length > 0 && <ul>{fields.slice(0, 3).map((field, index) => <li key={`${field}-${index}`} title={field}>{field}</li>)}</ul>}
      {!data.overview && fields.length > 3 && <span className="studio-concept-more">+{fields.length - 3} fields</span>}
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
function ZoomReadout({ onManualInteraction, onOverviewChange }) {
  const { zoom } = useViewport();
  const { zoomTo } = useReactFlow();
  useEffect(() => { onOverviewChange(zoom < 0.6); }, [zoom, onOverviewChange]);
  return <div className="studio-canvas-zoom" role="group" aria-label="Diagram zoom">
    <span aria-label="Diagram zoom level">{Math.round(zoom * 100)}%</span>
    <button type="button" aria-label="Reset zoom to 100%" onClick={() => { onManualInteraction(); void zoomTo(1, { duration: motionDuration(200) }); }}>100%</button>
  </div>;
}
export default function ModellingCanvas({ graph, viewId, selectedName, onSelect, onManualInteraction, onConnect, onLayoutChange }) {
  const [nodes, setNodes] = useState([]);
  const [selectedEdgeId, setSelectedEdgeId] = useState('');
  const [layoutSelection, setLayoutSelection] = useState(() => new Set());
  const [overview, setOverview] = useState(false);
  const [initialPins] = useState(() => {
    try { return { pins: readCanvasPins(sessionStorage, graph.workspaceId, viewId), writable: true }; }
    catch { return { pins: new Set(), writable: false }; }
  });
  const [layoutPins, setLayoutPins] = useState(initialPins.pins);
  const [pinRecoveryNeeded, setPinRecoveryNeeded] = useState(!initialPins.writable);
  const [pinNotice, setPinNotice] = useState('');
  const [layoutNotice, setLayoutNotice] = useState('');
  const [viewportNotice, setViewportNotice] = useState('');
  const [layoutHistory, setLayoutHistory] = useState([]);
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
    if (entry) setLayoutHistory(previous => [...previous.slice(-19), entry]);
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
    worker.current.onmessage = event => {
      if (event.data.requestId !== sequence.current) return;
      if (event.data.error) { setLayoutState('unavailable'); setLayoutNotice(event.data.error); return; }
      const layout = new Map(event.data.positions.map(point => [point.id, point]));
      const occupied = Object.values(positions.current), placed = new Map();
      for (const node of graph.nodes) {
        if (!newNames.has(node.name) || positions.current[node.name] || !layout.has(node.name)) continue;
        const point = layout.get(node.name), position = { x: point.x, y: point.y };
        while (occupied.some(other => Math.abs(other.x - position.x) < 240 && Math.abs(other.y - position.y) < 148)) position.y += 150;
        occupied.push(position); positions.current[node.name] = position; placed.set(node.name, position);
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
    worker.current.postMessage({ requestId, nodes: graph.nodes.map(node => node.name), edges: graph.edges.map(edge => ({ id: edge.id, source: edge.source, target: edge.target })) });
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
    setSelectedEdgeId(id => id && !graph.edges.some(edge => edge.id === id) ? '' : id);
  }, [graph.edges]);
  useEffect(() => {
    const visible = new Set(graph.nodes.map(node => node.name));
    setLayoutSelection(previous => {
      const retained = [...previous].filter(name => visible.has(name));
      return retained.length === previous.size ? previous : new Set(retained);
    });
  }, [graph.nodes]);
  const displayNodes = useMemo(() => nodes.map(node => ({ ...node, className: `${node.className}${layoutSelection.has(node.id) ? ' studio-layout-selected' : ''}`, data: { ...node.data, layoutSelected: layoutSelection.has(node.id), layoutPinned: layoutPins.has(node.id), overview } })), [nodes, layoutSelection, layoutPins, overview]);
  function toggleLayoutSelection(name) {
    if (!graph.nodes.some(node => node.name === name)) return;
    onManualInteraction();
    setLayoutSelection(previous => {
      const next = new Set(previous);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }
  function alignLayoutSelection(axis) {
    if (layoutState !== 'ready' || layoutSelection.size < 2 || !storageWritable.current || pinRecoveryNeeded || [...layoutSelection].some(name => layoutPins.has(name))) return;
    const names = [...layoutSelection].filter(name => graph.nodes.some(node => node.name === name) && positions.current[name]);
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
  function setSelectedPins(pinned) {
    if (layoutState !== 'ready' || pinRecoveryNeeded || !storageWritable.current || !layoutSelection.size) return;
    const names = [...layoutSelection].filter(name => graph.nodes.some(node => node.name === name) && positions.current[name]);
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
  const selectedEdge = graph.edges.find(edge => edge.id === selectedEdgeId) ?? null;
  function inspectEdge(id) {
    if (id && !graph.edges.some(edge => edge.id === id)) return;
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
  const offsets = parallelEdgeOffsets(graph.edges);
  function arrangeVisible() {
    if (!worker.current || layoutState !== 'ready') return;
    if (!storageWritable.current) { setLayoutNotice('Resolve unreadable local layout before arranging concepts.'); return; }
    if (pinRecoveryNeeded) { setLayoutNotice('Resolve unreadable pin settings before arranging concepts.'); return; }
    if (graph.nodes.every(node => layoutPins.has(node.name))) { setLayoutNotice('All visible concepts are pinned. Unpin one to arrange it.'); return; }
    const requestId = ++sequence.current;
    arranging.current = true;
    setLayoutState('pending');
    setLayoutNotice('Arranging visible concepts…');
    onManualInteraction();
    worker.current.onmessage = event => {
      if (event.data.requestId !== sequence.current) return;
      arranging.current = false;
      const points = event.data.positions;
      const names = new Set(graph.nodes.map(node => node.name));
      if (event.data.error || !Array.isArray(points) || points.length !== names.size || points.some(point => !names.has(point.id) || !Number.isFinite(point.x) || !Number.isFinite(point.y)) || new Set(points.map(point => point.id)).size !== names.size) {
        setLayoutState('unavailable'); setLayoutNotice('Could not arrange the diagram. Existing positions were kept.'); return;
      }
      const layout = new Map(), occupied = [...layoutPins].map(name => positions.current[name]).filter(Boolean);
      for (const point of points) {
        if (layoutPins.has(point.id) && positions.current[point.id]) continue;
        const position = { x: point.x, y: point.y };
        while (occupied.some(other => Math.abs(other.x - position.x) < 240 && Math.abs(other.y - position.y) < 148)) position.y += 150;
        if (Math.abs(position.x) >= 100000 || Math.abs(position.y) >= 100000) { setLayoutState('unavailable'); setLayoutNotice('Could not arrange the diagram without exceeding position limits. Existing positions were kept.'); return; }
        occupied.push(position); layout.set(point.id, position);
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
    try { worker.current.postMessage({ requestId, nodes: graph.nodes.map(node => node.name), edges: graph.edges.map(edge => ({ id: edge.id, source: edge.source, target: edge.target })) }); }
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
    onManualInteraction(); onLayoutChange();
    setLayoutNotice(`Undid the last layout ${entry.label}. Ontology and pin settings are unchanged.`);
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
      <button type="button" disabled={!layoutHistory.length || layoutState === 'pending' || draggingLayout || layoutRecoveryNeeded} onClick={undoLayout}>Undo last layout change</button>
      {layoutHistory.length > 0 && <p>Last {layoutHistory.at(-1).label}: {layoutHistory.at(-1).changes.slice(0, 5).map(change => change.name).join(', ')}{layoutHistory.at(-1).changes.length > 5 ? ` and ${layoutHistory.at(-1).changes.length - 5} more` : ''}. Undo restores positions even if pinned. It does not change the ontology or pin settings; history clears on reload.</p>}
      {layoutState === 'unavailable' && <button type="button" onClick={() => { setLayoutNotice('Retrying automatic layout...'); setLayoutState('pending'); setLayoutAttempt(value => value + 1); }}>Retry automatic layout</button>}
      <details>
        <summary>Align selected concepts</summary>
        <p>Select concepts below or use Shift+click or Shift+Enter on a card. Alignment changes only this view and may overlap cards. Unpin selected concepts before alignment.</p>
        <fieldset className="studio-layout-choices"><legend>Concepts for alignment</legend>{graph.nodes.map(node => <label className="studio-layout-choice" key={node.name}><input type="checkbox" checked={layoutSelection.has(node.name)} onChange={() => toggleLayoutSelection(node.name)} />{node.name}{layoutPins.has(node.name) ? ' (pinned)' : ''}</label>)}</fieldset>
        <p aria-live="polite">{layoutSelection.size} concepts selected for layout.</p>
        {layoutRecoveryNeeded && <p>Replace the unreadable local layout before aligning or pinning concepts.</p>}
        {pinNotice && <p aria-live="polite">{pinNotice}</p>}
        <div className="studio-canvas-edge-actions">
          <button type="button" disabled={layoutState !== 'ready' || layoutSelection.size < 2 || layoutRecoveryNeeded || pinRecoveryNeeded || [...layoutSelection].some(name => layoutPins.has(name))} onClick={() => alignLayoutSelection('x')}>Align left</button>
          <button type="button" disabled={layoutState !== 'ready' || layoutSelection.size < 2 || layoutRecoveryNeeded || pinRecoveryNeeded || [...layoutSelection].some(name => layoutPins.has(name))} onClick={() => alignLayoutSelection('y')}>Align top</button>
          <button type="button" disabled={layoutState !== 'ready' || !layoutSelection.size || layoutRecoveryNeeded || pinRecoveryNeeded || [...layoutSelection].every(name => layoutPins.has(name))} onClick={() => setSelectedPins(true)}>Pin selected</button>
          <button type="button" disabled={layoutState !== 'ready' || !layoutSelection.size || layoutRecoveryNeeded || pinRecoveryNeeded || [...layoutSelection].every(name => !layoutPins.has(name))} onClick={() => setSelectedPins(false)}>Unpin selected</button>
          <button type="button" disabled={!layoutSelection.size} onClick={() => setLayoutSelection(new Set())}>Clear layout selection</button>
        </div>
      </details>
    </details>
    <ReactFlow nodes={displayNodes} nodeTypes={nodeTypes} edgeTypes={edgeTypes} edges={graph.edges.map(edge => ({ id: edge.id, type: 'relationship', source: edge.source, target: edge.target, label: edge.cardinality ? `${edge.predicate} ${multiplicity[edge.cardinality] ?? edge.cardinality}` : edge.predicate, data: { offset: offsets.get(edge.id) }, selected: edge.id === selectedEdgeId, markerEnd: { type: MarkerType.ArrowClosed, color: '#506d69' }, className: `studio-flow-edge-${edge.changeStatus}` }))}
      onInit={value => { instance.current = value; if (!fitted.current && lastRoot.current) frameRoot(lastRoot.current); }} onNodesChange={onNodesChange} onNodeDragStop={onNodeDragStop} onNodeDragStart={startNodeDrag} onMoveStart={event => { if (event?.isTrusted) onManualInteraction(); }} onMoveEnd={(_event, viewport) => {
        if (!lastRoot.current) return;
        try { writeCanvasViewport(sessionStorage, graph.workspaceId, viewId, lastRoot.current, viewport); setViewportNotice(''); }
        catch { setViewportNotice('This browser tab could not remember the diagram position.'); }
      }} onNodeClick={(_event, node) => { onManualInteraction(); selectNode(node); }} onEdgeClick={(_event, edge) => inspectEdge(edge.id)}
      onConnect={connection => { onManualInteraction(); onConnect(connection); }}
      nodesConnectable deleteKeyCode={null} minZoom={0.15} maxZoom={2} aria-label="Interactive concept graph">
      <Background /><Controls showInteractive={false}><ControlButton className="studio-focus-control" aria-label="Focus selected concept" title="Focus selected concept" disabled={layoutState !== 'ready' || !graph.nodes.some(node => node.name === selectedName)} onClick={focusSelected}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7" /><path d="M12 2v4m0 12v4M2 12h4m12 0h4" /></svg></ControlButton></Controls><ZoomReadout onManualInteraction={onManualInteraction} onOverviewChange={setOverview} />
    </ReactFlow>
  </div>
    {viewportNotice && <p className="studio-canvas-viewport-notice" aria-live="polite">{viewportNotice}</p>}
    {graph.edges.length > 0 && <div className="studio-canvas-edge-picker"><label>Inspect relationship <select value={selectedEdge?.id ?? ''} onChange={event => inspectEdge(event.target.value)}><option value="">Choose a visible relationship</option>{graph.edges.map(edge => <option key={edge.id} value={edge.id}>{edge.source} — {edge.predicate} → {edge.target}</option>)}</select></label></div>}
    {selectedEdge && <section className="studio-canvas-edge-details" aria-label="Relationship details" aria-live="polite">
      <h3>{selectedEdge.predicate === 'subClassOf' ? 'Inheritance' : 'Relationship'}: {selectedEdge.predicate}</h3>
      <p><strong>Direction:</strong> {selectedEdge.source} → {selectedEdge.target}</p>
      <p><strong>Multiplicity:</strong> {selectedEdge.cardinality ? multiplicity[selectedEdge.cardinality] ?? selectedEdge.cardinality : selectedEdge.predicate === 'subClassOf' ? 'Not applicable' : 'Not recorded'}</p>
      {selectedEdge.label && <p><strong>Mapping:</strong> {selectedEdge.label}</p>}
      {selectedEdge.sourceRef?.path && <p><strong>Source:</strong> {selectedEdge.sourceRef.path}{selectedEdge.sourceRef.line != null ? `:${selectedEdge.sourceRef.line}` : ''}</p>}
      {selectedEdge.mappingVersion && <p><strong>Mapping version:</strong> {selectedEdge.mappingVersion}</p>}
      <p>Inspect a concept to review its supported field controls. Selecting this relationship does not change the model.</p>
      <div className="studio-canvas-edge-actions"><button type="button" disabled={!graph.nodes.some(node => node.name === selectedEdge.source)} onClick={() => inspectEndpoint(selectedEdge.source)}>Inspect source {selectedEdge.source}</button><button type="button" disabled={!graph.nodes.some(node => node.name === selectedEdge.target)} onClick={() => inspectEndpoint(selectedEdge.target)}>Inspect target {selectedEdge.target}</button><button type="button" onClick={() => inspectEdge('')}>Close relationship details</button></div>
    </section>}
  </>;
}
