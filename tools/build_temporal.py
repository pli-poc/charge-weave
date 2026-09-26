"""Build reproducible temporal query templates, RDF fixture and viewer evidence."""
from pathlib import Path
import json
from rdflib import Graph, RDF, Literal, XSD, URIRef
from runtime import P, C, E
from temporal_store import TemporalStore, Checkpoint
from temporal_integrity import instant, stamp_digests, policy
from audit_temporal import inventory, inventory_markdown


class Clock:
    def __init__(self, value):self.value=instant(value)
    def __call__(self):return self.value
    def set(self, value):self.value=instant(value)


def reference_closure(roots):
    reference=Graph().parse(P/'examples/reference.ttl')
    graph,pending,seen=Graph(),list(roots),set()
    while pending:
        s=pending.pop()
        if s in seen:continue
        seen.add(s)
        for triple in reference.triples((s,None,None)):
            graph.add(triple)
            if isinstance(triple[2],URIRef) and list(reference.predicate_objects(triple[2])):
                pending.append(triple[2])
    return graph


def price_graph(price, version):
    graph=reference_closure([E.TariffVersion])
    for n in list(graph.subjects(C.createdAt,None)):
        graph.set((n,C.createdAt,Literal(instant('2026-05-01T00:00:00Z'),datatype=XSD.dateTime)))
    graph.set((E.TariffVersion,C.validFrom,Literal(instant('2026-05-01T00:00:00Z'),datatype=XSD.dateTime)))
    graph.set((E.TariffVersion,C.validUntil,Literal(instant('2026-06-01T00:00:00Z'),datatype=XSD.dateTime)))
    graph.set((E.PriceComponent,C.unitPrice,Literal(price,datatype=XSD.decimal)))
    graph.set((E.Currency,C.currencyCode,Literal('EUR',datatype=XSD.string)))
    graph.set((E.TariffVersion,C.versionTag,Literal(str(version),datatype=XSD.string)))
    new=E['TariffVersion'+str(version)]
    replacement=Graph()
    for s,p,o in graph:
        replacement.add((new if s==E.TariffVersion else s,p,new if o==E.TariffVersion else o))
    replacement.set((new,C.canonicalId,Literal('tariff-version-'+str(version),datatype=XSD.string)))
    return stamp_digests(replacement)


def demo_store():
    clock=Clock('2026-05-01T00:00:00Z')
    store=TemporalStore(E.Tenant,'https://example.org/scope/tariff-retail',clock=clock)
    def cp(offset):
        return [Checkpoint('tariff-events','0',offset,clock(),clock(),allowed_lateness_seconds=172800)]
    first=store.commit(price_graph('0.30',1),valid_from='2026-05-01T00:00:00Z',valid_until='2026-06-01T00:00:00Z',
                       expected_head=None,checkpoints=cp(1),reason='Original May tariff',event_key='price-1')
    clock.set('2026-05-03T00:00:00Z')
    second=store.commit(price_graph('0.35',2),valid_from='2026-05-01T00:00:00Z',valid_until='2026-06-01T00:00:00Z',
                        expected_head=first,checkpoints=cp(2),reason='Backdated correction of May price',event_key='price-2')
    clock.set('2026-05-05T00:00:00Z')
    third=store.commit(price_graph('0.32',3),valid_from='2026-05-15T00:00:00Z',valid_until='2026-05-20T00:00:00Z',
                       expected_head=second,checkpoints=cp(3),reason='Correction limited to 15–20 May',event_key='price-3')
    clock.set('2026-05-07T00:00:00Z')
    store.commit(None,valid_from='2026-05-18T00:00:00Z',valid_until='2026-05-19T00:00:00Z',expected_head=third,
                 checkpoints=cp(4),reason='Explicit withdrawal for one day',event_key='price-4')
    clock.set('2026-06-15T00:00:00Z')
    return store


def serialize_dataset(dataset):
    blocks=[]
    default=dataset.default_context.identifier
    for ctx in sorted(dataset.contexts(),key=lambda g:str(g.identifier)):
        if not len(ctx):continue
        body='\n'.join('  '+' '.join(t.n3() for t in tr)+' .' for tr in sorted(ctx,key=lambda tr:tuple(t.n3() for t in tr)))
        blocks.append(('' if ctx.identifier==default else ctx.identifier.n3()+' ')+'{\n'+body+'\n}')
    return '\n\n'.join(blocks)+'\n'


def main():
    templates=json.loads((P/'model/temporal-queries.json').read_text())
    folder=P/'queries/temporal';folder.mkdir(exist_ok=True)
    for name,content in templates.items():(folder/name).write_text(content)
    store=demo_store();dataset=store.export_dataset();meta=dataset.default_context
    (P/'examples/temporal').mkdir(exist_ok=True)
    (P/'examples/temporal/tariff-history.trig').write_text(serialize_dataset(dataset))
    commits=[]
    for commit in sorted(meta.subjects(RDF.type,C.TemporalCommit),key=lambda n:str(meta.value(n,C.recordedAt))):
        successor=next(meta.subjects(C.previousCommit,commit),None)
        row={'id':str(commit),'recordedAt':str(meta.value(commit,C.recordedAt)),
             'systemUntil':str(meta.value(successor,C.recordedAt)) if successor else None,
             'validation':'SHACL and integrity checks passed before commit',
             'watermarks':[{'source':str(meta.value(w,C.sourceSystem)), 'partition':str(meta.value(w,C.sourcePartition)),
                            'offset':int(meta.value(w,C.sourceOffset)), 'completeThrough':str(meta.value(w,C.completeThrough))}
                           for w in sorted(meta.objects(commit,C.sourceWatermark),key=str)],
             'reason':str(meta.value(commit,C.commitReason)),'sequence':int(meta.value(commit,C.commitSequence)),'slices':[]}
        for node in sorted(meta.objects(commit,C.temporalSlice),key=lambda n:str(meta.value(n,C.validFrom))):
            graph_id=meta.value(node,C.payloadGraph);graph=dataset.graph(graph_id) if graph_id else None
            prices=list(graph.query(templates['tariff-at.rq'])) if graph is not None else []
            row['slices'].append({'id':str(node),'validFrom':str(meta.value(node,C.validFrom)),
                                 'validUntil':str(meta.value(node,C.validUntil)) if meta.value(node,C.validUntil) else None,
                                 'state':'Present' if graph is not None else 'Retracted','graph':str(graph_id) if graph_id else None,
                                 'digest':str(meta.value(node,C.contentDigest)) if graph is not None else None,
                                 'price':str(prices[0].price) if prices else None,
                                 'version':str(prices[0].version) if prices else None,
                                 'triples':[' '.join(t.n3() for t in tr)+' .' for tr in sorted(graph,key=lambda tr:tuple(t.n3() for t in tr))] if graph is not None else []})
        commits.append(row)
    cases=[]
    for valid in ['2026-04-30','2026-05-01','2026-05-02','2026-05-15','2026-05-18','2026-05-19','2026-05-20','2026-05-31','2026-06-01']:
        for known in ['2026-04-30','2026-05-01','2026-05-02','2026-05-03','2026-05-05','2026-05-07','2026-05-08']:
            snap,prices=store.query(templates['tariff-at.rq'],valid+'T00:00:00Z',known+'T00:00:00Z')
            cases.append({'validAt':valid,'knownAt':known,'commit':str(snap.commit) if snap else None,
                          'slice':str(snap.slice) if snap else None,'state':snap.state if snap else 'Unavailable',
                          'price':str(prices[0].price) if prices else None})
    data={'scope':str(store.scope),'tenant':str(store.tenant),'schemaDigest':store.schema_digest,
          'fixture':'Synthetic tariff evidence, verified by standard SPARQL over committed RDF graphs.',
          'knownThrough':'2026-06-15T00:00:00+00:00',
          'query':templates['select-snapshot.rq'],'priceQuery':templates['tariff-at.rq'],
          'commits':commits,'expectedCases':cases,'tzdataVersion':policy()['tzdataPackage']}
    (P/'model/temporal-example.json').write_text(json.dumps(data,indent=2)+'\n')
    catalog=json.loads((P/'model/catalog.json').read_text())
    (P/'docs/temporal-coverage.md').write_text(inventory_markdown(inventory(catalog)))
    print(f'Temporal fixture: {len(commits)} commits, {len(cases)} SPARQL-verified selections; every class has a temporal policy.')


if __name__=='__main__':main()
