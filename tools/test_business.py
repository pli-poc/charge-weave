"""One deliberately failing fixture per business rule, checked through SHACL-SPARQL."""
from runtime import *
import json,time,sys
from rdflib import RDF,Literal
from pyshacl import validate
started=time.monotonic();rules=json.loads((P/'model/rules.json').read_text());cases=json.loads((P/'tests/negative-cases.json').read_text());o=ontology();bs=Graph().parse(P/'validation/business.shacl.ttl');rows=[]
pre='@prefix cd: <https://example.org/charge-domain#> . @prefix ex: <https://example.org/test/> . @prefix xsd: <http://www.w3.org/2001/XMLSchema#> . '
T=Namespace('https://example.org/test/')
assert {r['id'] for r in rules}==set(cases),'Every rule needs a negative fixture.'
for r in rules:
 k=r['id'];data=Graph().parse(data=pre+cases[k],format='turtle');data.add((T.this,RDF.type,C[r['target']]))
 for tr in data:o.add(tr)
 sg=Graph();sg.add((C[k],RDF.type,SH.NodeShape));sg.add((C[k],SH.targetNode,T.this))
 for sp in bs.objects(C[k],SH.sparql):
  sg.add((C[k],SH.sparql,sp))
  for tr in bs.triples((sp,None,None)):sg.add(tr)
 try:
  ok,report,txt=validate(o,shacl_graph=sg,inference='none',advanced=True)
  found=(None,SH.sourceShape,C[k]) in report
  passed=not ok and found;row={'rule':k,'passed':passed,'reportedExpectedShape':found}
 except Exception as e:row={'rule':k,'passed':False,'error':str(e)}
 rows.append(row)
 for tr in data:o.remove(tr)
 if not row['passed']:print(row,flush=True)
result={'scope':'Isolated adverse fixture for every SHACL-SPARQL business rule; structural shapes excluded in these unit tests.','passed':sum(x['passed'] for x in rows),'total':len(rows),'elapsedSeconds':round(time.monotonic()-started,2),'tests':rows}
(P/'reports/business-tests.json').write_text(json.dumps(result,indent=2));print({k:v for k,v in result.items() if k!='tests'},flush=True);sys.exit(0 if all(x['passed'] for x in rows) else 1)
