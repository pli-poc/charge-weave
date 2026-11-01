import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Background, Controls, ReactFlow, applyNodeChanges } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const keyFor = workspaceId => `chargeweave.canvas.v1.${workspaceId}`;
function loadPositions(workspaceId) {
  try {
    const data = JSON.parse(sessionStorage.getItem(keyFor(workspaceId)) || '{}');
    const result = Object.create(null);
    for (const [name, value] of Object.entries(data).slice(0, 500)) if (/^[A-Za-z][A-Za-z0-9]*$/.test(name) && Number.isFinite(value?.x) && Number.isFinite(value?.y) && Math.abs(value.x) < 100000 && Math.abs(value.y) < 100000) result[name] = { x: value.x, y: value.y };
    return result;
  } catch { return Object.create(null); }
}

export default function ModellingCanvas({ graph, onSelect, onManualInteraction }) {
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
    const next = graph.nodes.map((node, index) => ({ id: node.name, position: positions.current[node.name] ?? { x: index ? 340 : 0, y: index ? (index - 1) * 90 : 0 }, sourcePosition: 'right', targetPosition: 'left', data: { label: node.label }, className: `studio-flow-node studio-flow-${node.changeStatus}`, selected: node.name === graph.root }));
    setNodes(next);
    const changedRoot = lastRoot.current !== graph.root;
    lastRoot.current = graph.root;
    if (changedRoot && positions.current[graph.root] && instance.current && fitted.current) {
      const point = positions.current[graph.root];
      void instance.current.setCenter(point.x + 95, point.y + 32, { zoom: 1, duration: 250 });
    }
    const requestId = ++sequence.current;
    if (!worker.current) return;
    if (!newNames.size) { setLayoutState('ready'); return; }
    setLayoutState('pending');
    worker.current.onmessage = event => {
      if (event.data.requestId !== sequence.current) return;
      if (event.data.error) { setLayoutState('unavailable'); setLayoutNotice(event.data.error); return; }
      const layout = new Map(event.data.positions.map(point => [point.id, point]));
      const occupied = Object.values(positions.current), placed = new Map();
      for (const node of graph.nodes) {
        if (!newNames.has(node.name) || positions.current[node.name] || !layout.has(node.name)) continue;
        const point = layout.get(node.name), position = { x: point.x, y: point.y };
        while (occupied.some(other => Math.abs(other.x - position.x) < 210 && Math.abs(other.y - position.y) < 84)) position.y += 90;
        occupied.push(position); positions.current[node.name] = position; placed.set(node.name, position);
      }
      setNodes(current => current.map(node => placed.has(node.id) ? { ...node, position: placed.get(node.id) } : node));
      setLayoutState('ready');
      if (!fitted.current && instance.current) { fitted.current = true; requestAnimationFrame(() => instance.current?.fitView({ padding: 0.2, duration: 200 })); }
    };
    worker.current.postMessage({ requestId, nodes: graph.nodes.map(node => node.name), edges: graph.edges.map(edge => ({ id: edge.id, source: edge.source, target: edge.target })) });
  }, [graph]);
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
  return <div className="studio-flow" role="region" aria-label={`Relationships for ${graph.root}`} data-layout={layoutState}
    onKeyDownCapture={event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const node = event.target.closest?.('.react-flow__node[data-id]');
      if (!node) return;
      event.preventDefault(); event.stopPropagation(); onManualInteraction(); selectNode({ id: node.dataset.id });
    }}>
    {layoutNotice && <p role="status">{layoutNotice}</p>}
    <ReactFlow nodes={nodes} edges={graph.edges.map(edge => ({ id: edge.id, source: edge.source, target: edge.target, label: edge.predicate, className: `studio-flow-edge-${edge.changeStatus}` }))}
      onInit={value => { instance.current = value; }} onNodesChange={onNodesChange} onNodeDragStop={onNodeDragStop} onNodeDragStart={onManualInteraction} onMoveStart={event => { if (event?.isTrusted) onManualInteraction(); }} onNodeClick={(_event, node) => { onManualInteraction(); selectNode(node); }}
      nodesConnectable={false} deleteKeyCode={null} fitView minZoom={0.15} maxZoom={2} aria-label="Interactive concept graph">
      <Background /><Controls showInteractive={false} />
    </ReactFlow>
  </div>;
}
