"""Check independently selected business lifecycle decisions against actual SHACL."""
from runtime import *
import json, sys

cases = json.loads((P/'tests/lifecycle-acceptance.json').read_text())
business = Graph().parse(P/'validation/business.shacl.ttl')
sg = Graph()
sg.add((C.B074,RDF.type,SH.NodeShape))
sg.add((C.B074,SH.targetNode,E.transition))
for constraint in business.objects(C.B074,SH.sparql):
    sg.add((C.B074,SH.sparql,constraint))
    for triple in business.triples((constraint,None,None)):sg.add(triple)
base = ontology()
rows = []
for case in cases:
    g = Graph()
    for prop,value in [('stateProperty',C[case['property']]),
                       ('previousState',C[case['property']+'_'+case['from']]),
                       ('nextState',C[case['property']+'_'+case['to']])]:
        g.add((E.transition,C[prop],value))
    conforms,report,_ = validate(base+g,shacl_graph=sg,inference='none',advanced=True)
    passed = conforms == case['expectedConformance'] and (
        conforms or (None,SH.sourceShape,C.B074) in report)
    rows.append({'scenario':case['id'],'passed':bool(passed),'conforms':conforms})
result = {'passed':sum(r['passed'] for r in rows),'total':len(rows),'tests':rows}
(P/'reports/lifecycle-tests.json').write_text(json.dumps(result,indent=2))
print({k:v for k,v in result.items() if k!='tests'})
for row in rows:
    if not row['passed']:print(row)
sys.exit(0 if all(r['passed'] for r in rows) else 1)
