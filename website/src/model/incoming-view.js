// Merge explicit incoming references into a revision-pinned information view.
export function mergeIncoming(view, incoming, filter = '') {
  if (incoming.workspaceId !== view.workspaceId || incoming.revision !== view.revision || incoming.sourceDigest !== view.sourceDigest || incoming.root !== view.root) throw new Error('Incoming references do not match the current view');
  const prefix = 'https://example.org/charge-domain#';
  const term = filter.trim().toLowerCase();
  const references = incoming.results.filter(item => !term || `${item.source} ${item.predicate} ${item.target}`.toLowerCase().includes(term));
  const names = new Set(references.map(item => item.source));
  const existingNodes = new Set(view.nodes.map(item => item.name));
  const nodes = incoming.nodes.filter(item => names.has(item.name) && !existingNodes.has(item.name)).map(item => ({ ...item, id: prefix + item.name, iri: prefix + item.name, label: item.name, kind: 'class', changeStatus: 'context' }));
  const existingEdges = new Set(view.edges.map(edge => edge.id));
  const edges = references.map(item => {
    const predicateIri = item.predicate === 'subClassOf' ? 'http://www.w3.org/2000/01/rdf-schema#subClassOf' : prefix + item.predicate;
    return { ...item, id: JSON.stringify([prefix + item.source, predicateIri, prefix + item.target]), predicateIri, sourcePath: item.sourceRef.path, mappingVersion: 'chargeweave-authoring-v1', changeStatus: 'context' };
  }).filter(edge => !existingEdges.has(edge.id));
  return { ...view, nodes: [...view.nodes, ...nodes], edges: [...view.edges, ...edges], incomingOmitted: Math.max(0, incoming.total - incoming.results.length), incomingFiltered: incoming.results.length - references.length };
}
