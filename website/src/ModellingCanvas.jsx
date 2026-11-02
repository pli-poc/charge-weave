import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Background, BaseEdge, ControlButton, Controls, Handle, MarkerType, Position, ReactFlow, applyNodeChanges } from '@xyflow/react';
import { parallelEdgeOffsets } from './model/parallel-edges.js';
import { readCanvasPositions, writeCanvasPositions } from './model/canvas-positions.js';
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
      {fields.length > 0 && <ul>{fields.slice(0, 3).map((field, index) => <li key={`${field}-${index}`} title={field}>{field}</li>)}</ul>}
      {fields.length > 3 && <span className="studio-concept-more">+{fields.length - 3} fields</span>}
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
export default function ModellingCanvas({ graph, viewId, selectedName, onSelect, onManualInteraction, onConnect, onLayoutChange }) {
  const [nodes, setNodes] = useState([]);
  const [selectedEdgeId, setSelectedEdgeId] = useState('');
  const [layoutNotice, setLayoutNotice] = useState('');
  const [layoutState, setLayoutState] = useState('pending');
  const [layoutAttempt, setLayoutAttempt] = useState(0);
  const [initialLayout] = useState(() => {
    try { return { positions: readCanvasPositions(sessionStorage, graph.workspaceId, viewId, { strict: true }), writable: true }; }
    catch { return { positions: Object.create(null), writable: false }; }
  });
  const positions = useRef(initialLayout.positions);
  const storageWritable = useRef(initialLayout.writable);
  const [layoutRecoveryNeeded, setLayoutRecoveryNeeded] = useState(!initialLayout.writable);
  const worker = useRef(null), sequence = useRef(0), instance = useRef(null), lastRoot = useRef(null), fitted = useRef(false);
  const arranging = useRef(false), layoutMenu = useRef(null);
  const byName = useRef(new Map());
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
    lastRoot.current = graph.root;
    if (changedRoot && positions.current[graph.root] && instance.current && fitted.current) {
      const point = positions.current[graph.root];
      void instance.current.setCenter(point.x + 110, point.y + 64, { zoom: 1, duration: motionDuration(250) });
    }
    const requestId = ++sequence.current;
    if (!worker.current) return;
    if (!newNames.size) {
      setLayoutState('ready');
      if (layoutAttempt > 0 && storageWritable.current) setLayoutNotice('Automatic layout is ready.');
      const root = positions.current[graph.root];
      if (!fitted.current && instance.current && root) {
        fitted.current = true;
        requestAnimationFrame(() => instance.current?.setCenter(root.x + 110, root.y + 64, { zoom: 1, duration: motionDuration(200) }));
      }
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
        const root = positions.current[graph.root];
        if (root) {
          fitted.current = true;
          requestAnimationFrame(() => instance.current?.setCenter(root.x + 110, root.y + 64, { zoom: 1, duration: motionDuration(200) }));
        }
      }
    };
    worker.current.postMessage({ requestId, nodes: graph.nodes.map(node => node.name), edges: graph.edges.map(edge => ({ id: edge.id, source: edge.source, target: edge.target })) });
  }, [graph, selectedName, viewId, layoutAttempt]);
  const onNodesChange = useCallback(changes => {
    let moved = false;
    for (const change of changes) if (change.type === 'position' && change.position) { positions.current[change.id] = change.position; if (!change.dragging) moved = true; }
    if (moved) onLayoutChange();
    if (moved && storageWritable.current) try { writeCanvasPositions(sessionStorage, graph.workspaceId, viewId, positions.current); } catch { /* layout remains available for this session */ }
    setNodes(current => applyNodeChanges(changes.filter(change => change.type !== 'remove'), current));
  }, [graph.workspaceId, viewId, onLayoutChange]);
  const onNodeDragStop = useCallback((_event, node) => {
    positions.current[node.id] = { x: node.position.x, y: node.position.y };
    onLayoutChange();
    if (storageWritable.current) try { writeCanvasPositions(sessionStorage, graph.workspaceId, viewId, positions.current); } catch { /* layout remains available for this session */ }
  }, [graph.workspaceId, viewId, onLayoutChange]);
  const selectNode = useCallback(node => { const item = byName.current.get(node.id); if (item && onSelect(item) !== false) setSelectedEdgeId(''); }, [onSelect]);
  useEffect(() => {
    setSelectedEdgeId(id => id && !graph.edges.some(edge => edge.id === id) ? '' : id);
  }, [graph.edges]);
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
      const layout = new Map(points.map(point => [point.id, { x: point.x, y: point.y }]));
      let changed = false;
      for (const [name, point] of layout) {
        const before = positions.current[name];
        if (!before || before.x !== point.x || before.y !== point.y) changed = true;
      }
      if (changed) {
        for (const [name, point] of layout) positions.current[name] = point;
        setNodes(current => current.map(node => layout.has(node.id) ? { ...node, position: layout.get(node.id) } : node));
        if (storageWritable.current) try { writeCanvasPositions(sessionStorage, graph.workspaceId, viewId, positions.current); } catch { /* layout remains available for this session */ }
        onLayoutChange();
      }
      setLayoutState('ready');
      setLayoutNotice(changed ? 'Visible concepts arranged locally. Save the shared view to share this layout.' : 'Visible concepts are already arranged.');
      if (layoutMenu.current) layoutMenu.current.open = false;
    };
    try { worker.current.postMessage({ requestId, nodes: graph.nodes.map(node => node.name), edges: graph.edges.map(edge => ({ id: edge.id, source: edge.source, target: edge.target })) }); }
    catch { arranging.current = false; setLayoutState('unavailable'); setLayoutNotice('Could not arrange the diagram. Existing positions were kept.'); }
  }
  function startNodeDrag() {
    if (arranging.current) {
      arranging.current = false;
      sequence.current += 1;
      setLayoutState('ready');
      setLayoutNotice('Layout cancelled because you moved a concept.');
    }
    onManualInteraction();
  }
  function replaceUnreadableLayout() {
    try {
      writeCanvasPositions(sessionStorage, graph.workspaceId, viewId, positions.current);
      storageWritable.current = true;
      setLayoutRecoveryNeeded(false);
      setLayoutNotice('Local layout replaced with the current diagram positions. Save the shared view to share it.');
    } catch { setLayoutNotice('Local layout could not be replaced. Check browser storage access and try again.'); }
  }
  return <><div className="studio-flow" role="region" aria-label={`Relationships for ${graph.root}`} data-layout={layoutState}
    onKeyDownCapture={event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const node = event.target.closest?.('.react-flow__node[data-id]');
      if (node) { event.preventDefault(); event.stopPropagation(); onManualInteraction(); selectNode({ id: node.dataset.id }); return; }
      const edge = event.target.closest?.('.react-flow__edge[data-id]');
      if (edge) { event.preventDefault(); event.stopPropagation(); inspectEdge(edge.dataset.id); }
    }}>
    {layoutNotice && <div className="studio-layout-notice"><p role="status">{layoutNotice}</p>{layoutRecoveryNeeded && <button type="button" disabled={layoutState !== 'ready'} onClick={replaceUnreadableLayout}>Replace unreadable local layout</button>}</div>}
    <details ref={layoutMenu} className="studio-canvas-layout-menu"><summary>Layout</summary><p>Arrange the visible concepts automatically. Existing positions in this view will move; hidden concepts are unchanged.</p><button type="button" disabled={layoutState !== 'ready'} onClick={arrangeVisible}>Arrange visible concepts</button>{layoutState === 'unavailable' && <button type="button" onClick={() => { setLayoutNotice('Retrying automatic layout…'); setLayoutState('pending'); setLayoutAttempt(value => value + 1); }}>Retry automatic layout</button>}</details>
    <ReactFlow nodes={nodes} nodeTypes={nodeTypes} edgeTypes={edgeTypes} edges={graph.edges.map(edge => ({ id: edge.id, type: 'relationship', source: edge.source, target: edge.target, label: edge.cardinality ? `${edge.predicate} ${multiplicity[edge.cardinality] ?? edge.cardinality}` : edge.predicate, data: { offset: offsets.get(edge.id) }, selected: edge.id === selectedEdgeId, markerEnd: { type: MarkerType.ArrowClosed, color: '#506d69' }, className: `studio-flow-edge-${edge.changeStatus}` }))}
      onInit={value => {
        instance.current = value;
        const root = positions.current[graph.root];
        if (!fitted.current && root) {
          fitted.current = true;
          requestAnimationFrame(() => instance.current?.setCenter(root.x + 110, root.y + 64, { zoom: 1, duration: motionDuration(200) }));
        }
      }} onNodesChange={onNodesChange} onNodeDragStop={onNodeDragStop} onNodeDragStart={startNodeDrag} onMoveStart={event => { if (event?.isTrusted) onManualInteraction(); }} onNodeClick={(_event, node) => { onManualInteraction(); selectNode(node); }} onEdgeClick={(_event, edge) => inspectEdge(edge.id)}
      onConnect={connection => { onManualInteraction(); onConnect(connection); }}
      nodesConnectable deleteKeyCode={null} minZoom={0.15} maxZoom={2} aria-label="Interactive concept graph">
      <Background /><Controls showInteractive={false}><ControlButton className="studio-focus-control" aria-label="Focus selected concept" title="Focus selected concept" disabled={layoutState !== 'ready' || !graph.nodes.some(node => node.name === selectedName)} onClick={focusSelected}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7" /><path d="M12 2v4m0 12v4M2 12h4m12 0h4" /></svg></ControlButton></Controls>
    </ReactFlow>
  </div>
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
