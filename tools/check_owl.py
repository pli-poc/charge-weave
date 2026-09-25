"""OWL 2 DL classification and satisfiability check, including the integration fixture."""
from runtime import *
import json,sys,time
from owlready2 import World,sync_reasoner
started=time.monotonic();results=[]
for mode in ['schema','schema-and-example']:
 g=ontology()
 if mode.endswith('example'):g+=Graph().parse(P/'examples/reference.ttl')
 p=P/'reports'/('reasoner-input-'+mode+'.owl');g.serialize(p,format='xml');w=World();o=w.get_ontology(p.as_uri()).load()
 try:
  with o:sync_reasoner(w,debug=0)
  bad=[str(x) for x in w.inconsistent_classes() if x.name!='Nothing'];r={'scope':mode,'consistent':True,'unsatisfiableClasses':bad}
 except Exception as e:r={'scope':mode,'consistent':False,'error':str(e)}
 results.append(r);p.unlink();print(r,flush=True)
result={'reasoner':'HermiT via Owlready2','runs':results,'elapsedSeconds':round(time.monotonic()-started,2)}
(P/'reports/owl-consistency.json').write_text(json.dumps(result,indent=2));sys.exit(0 if all(r['consistent'] and not r.get('unsatisfiableClasses') for r in results) else 1)
