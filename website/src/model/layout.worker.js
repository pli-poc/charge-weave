import ELK from 'elkjs/lib/elk.bundled.js';

const elk = new ELK();
self.onmessage = async event => {
  const { requestId, nodes, edges } = event.data;
  try {
    const result = await elk.layout({
      id: 'workspace',
      layoutOptions: { 'elk.algorithm': 'layered', 'elk.direction': 'RIGHT', 'elk.spacing.nodeNode': '40', 'elk.layered.spacing.nodeNodeBetweenLayers': '100' },
      children: nodes.map(id => ({ id, width: 190, height: 64 })),
      edges: edges.map(edge => ({ id: edge.id, sources: [edge.source], targets: [edge.target] })),
    });
    self.postMessage({ requestId, positions: result.children.map(node => ({ id: node.id, x: node.x, y: node.y })) });
  } catch { self.postMessage({ requestId, error: 'Automatic layout is unavailable.' }); }
};
