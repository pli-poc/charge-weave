from runtime import *
from rdflib import RDF,RDFS,OWL
from rdf_equal import equivalent
from rdflib.plugins.sparql import prepareQuery
import json,sys
catalog=json.loads((P/'model/catalog.json').read_text());o=ontology();s=shapes();data=Graph().parse(P/'examples/reference.ttl');merged=o+data;checks=[]
def result(name,ok,detail=None):checks.append({'check':name,'passed':bool(ok),'detail':detail})
for c,i in catalog.items():
 result('class-shape:'+c,(C[c+'Shape'],SH.targetClass,C[c]) in s)
 if c!='Record':result('class-example:'+c,(None,RDF.type,C[c]) in data)
for kind in ['resource','endpoint']:
 rows=json.loads((P/f'benchmark/{kind}-coverage.json').read_text());result(kind+'-all-mapped',all(r['classes'] and all(c in catalog for c in r['classes']) for r in rows),len(rows))
ops=json.loads((P/'benchmark/endpoint-coverage.json').read_text());result('operation-urls-unique',len(ops)==len({r['source'] for r in ops}))
for f,fmt in [('charge-domain-complete.ttl','turtle'),('charge-domain-complete.owl','xml'),('charge-domain-complete.jsonld','json-ld')]:
 result('serialization:'+f,equivalent(o,Graph().parse(P/'ontology'/f,format=fmt)));print('Checked',f,flush=True)
rule_targets={r['id']:C[r['target']] for r in json.loads((P/'model/rules.json').read_text())}
focus_by_type={}
for node,cls in data.subject_objects(RDF.type):
 for ancestor in {cls,*o.transitive_objects(cls,RDFS.subClassOf)}:focus_by_type.setdefault(ancestor,set()).add(node)
for f in sorted((P/'queries').glob('*.rq')):
 try:
  q=prepareQuery(f.read_text())
  if f.stem.startswith('CQ'):
   rows=list(merged.query(q));result('query:'+f.stem,len(rows)>0,len(rows))
  else:
   focus=focus_by_type.get(rule_targets[f.stem],set());violations=sum(len(list(merged.query(q,initBindings={'this':node}))) for node in focus)
   result('query:'+f.stem,bool(focus) and violations==0,{'focusNodes':len(focus),'violations':violations})
  if f.stem in ['B025','B050','B075','B109','CQ24']:print('Checked through',f.stem,flush=True)
 except Exception as e:result('query:'+f.stem,False,str(e))
result_data={'passed':sum(r['passed'] for r in checks),'total':len(checks),'checks':checks};(P/'reports/release-checks.json').write_text(json.dumps(result_data,indent=2));print({'passed':result_data['passed'],'total':len(checks),'failures':[r for r in checks if not r['passed']]});sys.exit(0 if all(r['passed'] for r in checks) else 1)
