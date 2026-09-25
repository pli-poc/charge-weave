"""Non-vacuous boundary cases for domain policies and adverse structural contracts."""
from runtime import *
from rdflib import RDF,Literal,XSD,BNode
import json,sys,time
rules={r['id']:r for r in json.loads((P/'model/rules.json').read_text())};neg=json.loads((P/'tests/negative-cases.json').read_text());o=ontology();rows=[]
pre='@prefix cd: <https://example.org/charge-domain#> . @prefix ex: <https://example.org/test/> . @prefix xsd: <http://www.w3.org/2001/XMLSchema#> . '
T=Namespace('https://example.org/test/')
cases=[
('deferred-roaming-base-at-configuration','B035','ex:this cd:tariffMode cd:tariffMode_DiscountBased; cd:baseTariffSelection cd:baseTariffSelection_RoamingWholesale.'),
('resolved-base-at-rating','B109','ex:this cd:selectedTariff ex:a; cd:tariffResolution ex:r. ex:a cd:baseTariffSelection cd:baseTariffSelection_RoamingWholesale. ex:r cd:resolvedBaseTariff ex:b.'),
('same-tenant-reference','B001',neg['B001'].replace('ex:t2','ex:t1')),
('id-reuse-across-tenants','B002',neg['B002'].replace('ex:b cd:tenant ex:t;','ex:b cd:tenant ex:t2;')),
('terminal-area-only','B014','ex:this cd:area ex:a.'),
('equal-current-bound','B019',neg['B019'].replace('32.0','16.0')),
('local-free-no-credential','B021','ex:this cd:authorizationMethod cd:authorizationMethod_LocalFree.'),
('tariff-start-inclusive','B027',neg['B027'].replace('cd:startedAt "2026-09-25T12:00:00Z"','cd:startedAt "2026-09-25T10:00:00Z"')),
('clock-skew-assessed','B029',neg['B029']+' ex:this cd:clockAssessment ex:a.'),
('roaming-cdr-without-local-session','B031','ex:this cd:recordOrigin cd:recordOrigin_Roaming.'),
('free-tariff-no-components','B034','ex:this cd:tariffMode cd:tariffMode_Free.'),
('negative-wholesale-price','B041','ex:this cd:minimumUnitPrice -0.2; cd:maximumUnitPrice 0.1.'),
('decimal-monetary-equality','B042','ex:this cd:netAmount 0.1; cd:taxAmount 0.2; cd:grossAmount 0.3.'),
('aggregate-refund-at-cap','B048',neg['B048'].replace('6.0','5.0')),
('capture-at-authorized-intent','B049',neg['B049'].replace('11.0','10.0')),
('journal-balanced-same-currency','B050',neg['B050'].replace('ex:EUR','ex:GBP')),
('corporate-split-at-total','B052',neg['B052'].replace('4.0','3.0')),
('coupon-reversal-offset','B059',neg['B059']+' ex:b a cd:CouponConsumption; cd:energyCoupon ex:this; cd:consumedEnergyKWh 1.0; cd:reversalOf ex:a.'),
('coupon-start-inclusive','B060',neg['B060'].replace('cd:consumedAt "2026-09-25T12:00:00Z"','cd:consumedAt "2026-09-25T10:00:00Z"')),
('adjacent-schedule-periods','B063',neg['B063'].replace('2026-09-25T11:00:00Z','2026-09-25T12:00:00Z')),
('availability-exact-quarter','B066',neg['B066'].replace('0.9','0.75')),
('matching-approved-command','B071',neg['B071'].replace('ex:c','ex:b')),
('completion-proves-success','B073',neg['B073'].replace('outcomeKind_Acknowledgement','outcomeKind_Completion').replace('outcomeState_Accepted','outcomeState_Succeeded')),
('allowed-session-transition','B074',neg['B074'].replace('sessionState_Completed','sessionState_Starting')),
('inclusive-one-day-reimbursement','B079',neg['B079'].replace('2026-09-24','2026-09-25')),
('overnight-local-window','B082',neg['B082'].replace('false','true')),
('full-percentage-discount','B091',neg['B091'].replace('101.0','100.0')),
('exact-power-module-allocation','B098',neg['B098'].replace('30.0','40.0')),
('adjacent-price-tiers','B102',neg['B102'].replace('cd:tierLowerBound 5.0','cd:tierLowerBound 10.0')),
('zero-payment-hold','B103',neg['B103'].replace('-1.0','0.0'))]
for name,k,ttl in cases:
 data=Graph().parse(data=pre+ttl,format='turtle');g=o+data
 results=list(g.query(rules[k]['query'],initBindings={'this':T.this}))
 rows.append({'test':name,'kind':'business-boundary','rule':k,'passed':len(results)==0})
s=Graph().parse(P/'validation/structure.shacl.ttl')
structural=[
('missing-session-start','ChargingSession','startedAt',[]),
('multiple-session-states','ChargingSession','sessionState',[C.sessionState_Active,C.sessionState_Completed]),
('undefined-session-state','ChargingSession','sessionState',[C.sessionState_Mystery]),
('wrong-unit-class','ChargingSession','chargingUnit',[C.sessionState_Active]),
('datetime-without-timezone','ChargingSession','startedAt',[Literal('2026-09-25T12:00:00',datatype=XSD.dateTime)]),
('literal-object-reference','ChargingSession','chargingUnit',[Literal('unit-1')]),
('negative-import-energy','ChargingSession','importedEnergyKWh',[Literal('-1',datatype=XSD.decimal)]),
('float-money-rejected','Invoice','grossAmount',[Literal(10.5,datatype=XSD.double)]),
('invalid-currency-code','Currency','currencyCode',[Literal('gbp')]),
('invalid-country-code','Address','countryCode',[Literal('GBR')]),
('impossible-latitude','GeoPosition','latitude',[Literal('91',datatype=XSD.decimal)]),
('impossible-longitude','GeoPosition','longitude',[Literal('181',datatype=XSD.decimal)]),
('invalid-digest','EvidenceDocument','contentDigest',[Literal('md5:1234')]),
('untagged-translation','InvoiceLine','lineDescription',[Literal('text')]),
('zero-revision','Record','revision',[Literal(0,datatype=XSD.positiveInteger)]),
('zero-billing-step','PriceComponent','billingStep',[Literal('0',datatype=XSD.decimal)]),
('weekday-out-of-range','RecurringWindow','weekday',[Literal(7,datatype=XSD.nonNegativeInteger)]),
('fraction-above-one','EnergySourceShare','shareFraction',[Literal('1.1',datatype=XSD.decimal)]),
('malformed-calendar-date','ReimbursementPolicy','validFromDate',[Literal('25/09/2026')]),
('malformed-local-time','RecurringWindow','localStart',[Literal('24:30:00')])]
for name,c,p,vals in structural:
 shape=C[c+'_'+p+'Shape'];sg=Graph();sg.add((T.check,RDF.type,SH.NodeShape));sg.add((T.check,SH.targetNode,T.this));sg.add((T.check,SH.property,shape));pending=[shape];seen=set()
 while pending:
  n=pending.pop()
  if n in seen:continue
  seen.add(n)
  for tr in s.triples((n,None,None)):
   sg.add(tr)
   if isinstance(tr[2],BNode):pending.append(tr[2])
 data=Graph()
 for v in vals:data.add((T.this,C[p],v))
 ok,report,txt=validate(o+data,shacl_graph=sg,inference='none');rows.append({'test':name,'kind':'structural-adverse','passed':not ok and (None,SH.sourceShape,shape) in report})
result={'passed':sum(r['passed'] for r in rows),'total':len(rows),'tests':rows};(P/'reports/boundary-tests.json').write_text(json.dumps(result,indent=2));print({'passed':result['passed'],'total':result['total'],'failures':[r for r in rows if not r['passed']]});sys.exit(0 if all(r['passed'] for r in rows) else 1)
