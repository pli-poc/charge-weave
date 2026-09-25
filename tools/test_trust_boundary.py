from runtime import *
import json,sys
prefix='@prefix cd: <https://example.org/charge-domain#> . @prefix ex: <https://example.org/test/> . @prefix owl: <http://www.w3.org/2002/07/owl#> . '
cases={
'invent-controlled-property':'cd:typo a owl:DatatypeProperty.',
'invent-transition':'ex:rule cd:transitionProperty cd:sessionState; cd:fromState cd:sessionState_Pending; cd:toState cd:sessionState_Completed.',
'invent-command-kind':'ex:unsafe a cd:CommandKind.',
'change-controlled-individual':'cd:sessionState_Active a cd:Record.'}
rows=[]
for name,ttl in cases.items():
 g=Graph().parse(data=prefix+ttl+' ex:tenant a cd:Tenant; cd:tenantKey "test"; cd:tenantName "Test".',format='turtle');ok,report,txt=check(g);rows.append({'test':name,'passed':not ok and bool(schema_injection(g)) and 'redefinitions' in txt})
rows.append({'test':'reference-does-not-redefine-schema','passed':not schema_injection(Graph().parse(P/'examples/reference.ttl'))})
rows.append({'test':'empty-graph-rejected','passed':not check(Graph())[0]})
rows.append({'test':'untyped-payload-rejected','passed':not check(Graph().parse(data=prefix+'ex:x cd:canonicalId "orphan".',format='turtle'))[0]})
r={'passed':sum(x['passed'] for x in rows),'total':len(rows),'tests':rows};(P/'reports/trust-boundary-tests.json').write_text(json.dumps(r,indent=2));print(r);sys.exit(0 if all(x['passed'] for x in rows) else 1)
