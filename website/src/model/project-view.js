// Presentation projections only; every projected edge comes from an explicit contract.
export async function projectView(information, perspective, filter, readEntity) {
  const term = (filter || '').trim().toLowerCase();
  const matches = edge => !term || `${edge.predicate} ${edge.target} ${edge.label || ''}`.toLowerCase().includes(term);
  if (!perspective || perspective.viewpoint === 'information') {
    const edges = information.edges.filter(matches);
    const names = new Set([information.root, ...edges.map(edge => edge.target)]);
    return { ...information, edges, nodes: information.nodes.filter(node => names.has(node.name)), omitted: information.omitted + information.edges.length - edges.length };
  }
  const prefix = 'https://example.org/charge-domain#';
  const fields = perspective.viewpoint === 'responsibility' ? perspective.bindings : perspective.fields.filter(field => ['TimeWindow', 'RecurringWindow'].includes(field.range));
  const candidates = fields.map(field => ({
    id: JSON.stringify([prefix + information.root, prefix + field.property, prefix + field.range]), source: information.root, target: field.range,
    predicate: field.property, label: field.label, cardinality: field.cardinality, predicateIri: prefix + field.property,
    sourcePath: field.source.path, sourceRef: field.source, mappingVersion: field.mappingVersion ?? 'chargeweave-temporal-v1', changeStatus: information.edges.find(edge => edge.predicate === field.property && edge.target === field.range)?.changeStatus ?? 'context',
  }));
  const edges = candidates.filter(matches);
  const byName = new Map(information.nodes.map(node => [node.name, node]));
  for (const edge of edges) if (!byName.has(edge.target)) {
    const entity = await readEntity(edge.target);
    byName.set(edge.target, { ...entity, id: prefix + entity.name, iri: prefix + entity.name, label: entity.name, kind: 'class', sourceRef: entity.source, changeStatus: 'context' });
  }
  const names = [...new Set([information.root, ...edges.map(edge => edge.target)])];
  return { ...information, viewpoint: perspective.viewpoint, mappingVersion: perspective.mappingVersion ?? 'chargeweave-temporal-v1', edges, nodes: names.map(name => byName.get(name)), omitted: candidates.length - edges.length };
}
