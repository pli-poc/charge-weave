import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Background, BaseEdge, ControlButton, Controls, Handle, MarkerType, Position, ReactFlow, applyNodeChanges } from '@xyflow/react';
import { parallelEdgeOffsets } from './model/parallel-edges.js';
import '@xyflow/react/dist/style.css';

const keyFor = workspaceId => `chargeweave.canvas.v1.${workspaceId}`;
const motionDuration = duration => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : duration;
const ConceptNode = memo(function ConceptNode({ data }) {
  const fields = typeof data.fields === 'string' ? data.fields.split(/\s+/).filter(Boolean) : Array.isArray(data.fields) ? data.fields.map(field => `${field.property}:${field.range}${field.cardinality ?? ''}`) : [];
  return <>
    <Handle type="target" position={Position.Left} />
    <div className="studio-concept-card">
      <div className="studio-concept-heading"><span className="studio-concept-kind">CLASS</span><strong title={data.label}>{data.label}</strong></div>
      <div className="studio-concept-module">{data.module || 'Ontology concept'}</div>
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
function loadPositions(workspaceId) {
  try {
    const data = JSON.parse(sessionStorage.getItem(keyFor(workspaceId)) || '{}');
    const result = Object.create(null);
    for (const [name, value] of Object.entries(data).slice(0, 500)) if (/^[A-Za-z][A-Za-z0-9]*$/.test(name) && Number.isFinite(value?.x) && Number.isFinite(value?.y) && Math.abs(value.x) < 100000 && Math.abs(value.y) < 100000) result[name] = { x: value.x, y: value.y };
    return result;
  } catch { return Object.create(null); }
}

export default function ModellingCanvas({ graph, selectedName, onSelect, onManualInteraction, onConnect }) {
  const [nodes, setNodes] = useState([]);
  const [layoutNotice, setLayoutNotice] = useState('');
  const [layoutState, setLayoutState] = useState('pending');
  const positions = useRef(loadPositions(graph.workspaceId));
  const worker = useRef(null), sequence = useRef(0), instance = useRef(null), lastRoot = useRef(null), fitted = useRef(false);
  const byName = useRef(new Map());
  useEffect(() => {
    try {
      worker.current = new Worker(new URL('./model/layout.worker.js', import.meta.url), { type: 'module' });
      worker.current.onerror = () => { setLayoutState('unavailable'); setLayoutNotice('Automatic layout is unavailable; the list remains usable.'); };
    } catch { setLayoutState('unavailable'); setLayoutNotice('Automatic layout is unavailable; the list remains usable.'); }
    return () => worker.current?.terminate();
  }, []);
  useEffect(() => {
    byName.current = new Map(graph.nodes.map(node => [node.name, node]));
    const newNames = new Set(graph.nodes.filter(node => !positions.current[node.name]).map(node => node.name));
    const next = graph.nodes.map((node, index) => ({ id: node.name, type: 'concept', position: positions.current[node.name] ?? { x: index ? 340 : 0, y: index ? (index - 1) * 150 : 0 }, data: { label: node.label, module: node.module, fields: node.fields }, className: `studio-flow-node studio-flow-${node.changeStatus}`, selected: node.name === selectedName }));
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
      setLayoutState('ready');
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
  }, [graph, selectedName]);
  const onNodesChange = useCallback(changes => {
    let moved = false;
    for (const change of changes) if (change.type === 'position' && change.position) { positions.current[change.id] = change.position; if (!change.dragging) moved = true; }
    if (moved) try { sessionStorage.setItem(keyFor(graph.workspaceId), JSON.stringify(positions.current)); } catch { /* layout remains available for this session */ }
    setNodes(current => applyNodeChanges(changes.filter(change => change.type !== 'remove'), current));
  }, [graph.workspaceId]);
  const onNodeDragStop = useCallback((_event, node) => {
    positions.current[node.id] = { x: node.position.x, y: node.position.y };
    try { sessionStorage.setItem(keyFor(graph.workspaceId), JSON.stringify(positions.current)); } catch { /* layout remains available for this session */ }
  }, [graph.workspaceId]);
  const selectNode = useCallback(node => { const item = byName.current.get(node.id); if (item) onSelect(item); }, [onSelect]);
  const focusSelected = useCallback(() => {
    const point = positions.current[selectedName];
    if (!point || !byName.current.has(selectedName) || !instance.current) return;
    onManualInteraction();
    void instance.current.setCenter(point.x + 110, point.y + 64, { zoom: 1, duration: motionDuration(250) });
  }, [selectedName, onManualInteraction]);
  const offsets = parallelEdgeOffsets(graph.edges);
  return <div className="studio-flow" role="region" aria-label={`Relationships for ${graph.root}`} data-layout={layoutState}
    onKeyDownCapture={event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const node = event.target.closest?.('.react-flow__node[data-id]');
      if (!node) return;
      event.preventDefault(); event.stopPropagation(); onManualInteraction(); selectNode({ id: node.dataset.id });
    }}>
    {layoutNotice && <p role="status">{layoutNotice}</p>}
    <ReactFlow nodes={nodes} nodeTypes={nodeTypes} edgeTypes={edgeTypes} edges={graph.edges.map(edge => ({ id: edge.id, type: 'relationship', source: edge.source, target: edge.target, label: edge.cardinality ? `${edge.predicate} ${multiplicity[edge.cardinality] ?? edge.cardinality}` : edge.predicate, data: { offset: offsets.get(edge.id) }, markerEnd: { type: MarkerType.ArrowClosed, color: '#506d69' }, className: `studio-flow-edge-${edge.changeStatus}` }))}
      onInit={value => { instance.current = value; }} onNodesChange={onNodesChange} onNodeDragStop={onNodeDragStop} onNodeDragStart={onManualInteraction} onMoveStart={event => { if (event?.isTrusted) onManualInteraction(); }} onNodeClick={(_event, node) => { onManualInteraction(); selectNode(node); }}
      onConnect={connection => { onManualInteraction(); onConnect(connection); }}
      nodesConnectable deleteKeyCode={null} minZoom={0.15} maxZoom={2} aria-label="Interactive concept graph">
      <Background /><Controls showInteractive={false}><ControlButton className="studio-focus-control" aria-label="Focus selected concept" title="Focus selected concept" disabled={layoutState !== 'ready' || !graph.nodes.some(node => node.name === selectedName)} onClick={focusSelected}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7" /><path d="M12 2v4m0 12v4M2 12h4m12 0h4" /></svg></ControlButton></Controls>
    </ReactFlow>
  </div>;
}
