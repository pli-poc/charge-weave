"""All-class synthetic integration fixture. Never production/customer data."""
from runtime import *
import json
from rdflib import RDF,Literal,XSD,URIRef
catalog=json.loads((P/'model/catalog.json').read_text());g=Graph();g.bind('cd',C);g.bind('ex',E)
def node(c):return E[c] if c!='Record' else E.ChargingSession
def setv(c,p,v):g.set((node(c),C[p],v))
def add(c,p,o):g.add((node(c),C[p],node(o)))
def code(c,p,v):setv(c,p,C[p+'_'+v])
def dec(c,p,v):setv(c,p,Literal(str(v),datatype=XSD.decimal))
def dt(c,p,v):setv(c,p,Literal('2026-09-25T'+v+':00:00Z',datatype=XSD.dateTime))
for c,info in catalog.items():
 if c=='Record':continue
 n=node(c);g.add((n,RDF.type,C[c]));fields=[];i=info
 while i:
  fields+=i['fields'];i=catalog.get(i['parent'])
 for f in fields:
  if f['cardinality'] not in '!+':continue
  p=f['property'];r=f['range']
  if f['type']=='object':v=node(r)
  elif f['type']=='enum':v=C[p+'_'+f['values'][0]]
  elif f['type']=='iri':v=XSD.string if 'Datatype' in p or p=='fieldDatatype' else URIRef('https://example.org/value/'+p)
  elif r=='dateTime':
   hr='10' if p in ['validFrom','startsAt','periodStart'] else '14' if p in ['validUntil','endsAt','expiresAt','periodEnd','dueAt'] else '12';v=Literal('2026-09-25T'+hr+':00:00Z',datatype=XSD.dateTime)
  elif r=='date':v=Literal('2026-09-25',datatype=XSD.string)
  elif r=='time':v=Literal('09:00:00' if p=='localStart' else '17:00:00',datatype=XSD.string)
  elif r=='boolean':v=Literal(False)
  elif r in ['integer','nonNegativeInteger','positiveInteger']:v=Literal(1,datatype=XSD[r])
  elif r=='decimal':v=Literal('1' if p in ['billingStep','conversionRate','shareFraction','availabilityFraction','voltageV','eligibleSeconds','moduleSizeKW','totalCabinetPowerKW','allocatedPowerKW'] else '0',datatype=XSD.decimal)
  elif r=='langString':v=Literal(c+' example',lang='en')
  elif r=='anyURI':v=Literal('https://example.org/evidence/'+c,datatype=XSD.anyURI)
  else:
   value=c+'-'+p
   if p in ['countryCode','bankCountryCode']:value='GB'
   elif p=='currencyCode':value='GBP'
   elif p=='contentDigest':value='sha256:'+'0'*64
   elif p in ['defaultLanguage','supportedLanguage']:value='en'
   elif p=='timezoneName':value='Europe/London'
   elif p in ['policyVersion','versionTag']:value='1'
   v=Literal(value,datatype=XSD.string)
  g.add((n,C[p],v))
code('ChargingStation','stationUse','Personal');add('ChargingStation','ownerAccount','CustomerAccount');add('ChargingStation','protocolEndpoint','ProtocolEndpoint');add('ChargingStation','electricitySchedule','ElectricityPriceSchedule')
add('PaymentTerminal','station','ChargingStation')
code('AuthorizationRequest','authorizationMethod','LocalFree');code('AuthorizationDecision','decision','Accepted')
code('ChargingSession','sessionState','Completed');dt('ChargingSession','endedAt','13');add('ChargingSession','endEvidence','SessionEndEvidence');add('ChargingSession','selectedTariff','TariffVersion')
add('ChargeDetailRecord','session','ChargingSession')
add('ActionApproval','approvedCommand','RemoteCommand');add('AssistantRecommendation','proposedCommand','RemoteCommand')
add('TariffVersion','priceComponent','PriceComponent');add('ElectricityPriceInterval','interval','TimeWindow')
code('ReimbursementPolicy','reimbursementRateSource','Station')
code('EnergyCouponTemplate','validityMode','DaysAfterRedemption');setv('EnergyCouponTemplate','validityDays',Literal(30,datatype=XSD.positiveInteger))
add('FirmwareRelease','compatibleModel','EquipmentModel')
setv('StateTransition','stateProperty',C.sessionState);setv('StateTransition','previousState',C.sessionState_Active);setv('StateTransition','nextState',C.sessionState_Ending)
o=ontology();setv('RemoteCommand','commandKind',min(o.subjects(RDF.type,C.CommandKind),key=str));setv('EventSubscription','eventType',min(o.subjects(RDF.type,C.EventKind),key=str))
setv('CustomFieldValue','valueDatatype',XSD.string);setv('CustomFieldDefinition','fieldDatatype',XSD.string)
# Reviewed positive fixtures for the independent business-domain extension.
add('ChargingSession','customer','CustomerAccount')
add('ChargeDetailRecord','billingReadiness','BillingReadinessAssessment')
code('BillingReadinessAssessment','readinessState','Ready')
for prop in ['usageComplete','priceResolved','taxResolved','authorizationResolved','responsibilityResolved']:
 setv('BillingReadinessAssessment',prop,Literal(True))
setv('BillingReadinessAssessment','openBlockingIssueCount',Literal(0,datatype=XSD.nonNegativeInteger))
add('BillingReadinessAssessment','readinessEvidence','EvidenceDocument')
code('MeterDelta','deltaBasis','Estimated');add('MeterDelta','deltaEvidence','EvidenceDocument')
dt('CommercialOffer','expiresAt','14')
setv('RecordCorrection','originalRecord',node('ChargeDetailRecord'))
corrected=E.CorrectedChargeDetailRecord
for pred,obj in list(g.predicate_objects(node('ChargeDetailRecord'))):g.add((corrected,pred,obj))
g.set((corrected,C.canonicalId,Literal('corrected-charge-record',datatype=XSD.string)))
g.set((corrected,C.correctionOf,node('ChargeDetailRecord')))
setv('RecordCorrection','correctingRecord',corrected)
setv('ReconciliationCase','expectedIdentifier',Literal('missing-external-record',datatype=XSD.string))
setv('LifecycleSnapshot','targetRecord',node('CustomerAccount'));setv('LifecycleSnapshot','stateProperty',C.accountState);setv('LifecycleSnapshot','stateValue',C.accountState_Pending)
code('AccessDecision','accessDecision','Deny')
interval=E.SessionTimeWindow
for pred,obj in list(g.predicate_objects(E.TimeWindow)):g.add((interval,pred,obj))
g.set((interval,C.canonicalId,Literal('session-time-window',datatype=XSD.string)))
g.set((interval,C.startsAt,g.value(E.ChargingSession,C.startedAt)))
g.set((interval,C.endsAt,g.value(E.ChargingSession,C.endedAt)))
setv('ChargingInterval','interval',interval)
code('TemporalSlice','sliceState','Retracted')
setv('TemporalCommit','schemaDigest',Literal('sha256:'+'0'*64,datatype=XSD.string))
setv('TemporalCommit','commitSequence',Literal(1,datatype=XSD.positiveInteger))
code('ProjectionWatermark','watermarkState','Complete')
code('TemporalSnapshotSelection','selectionState','Retracted')
setv('TemporalSnapshotSelection','selectedCommit',E.TemporalCommit)
setv('TemporalSnapshotSelection','selectedSlice',E.TemporalSlice)
from temporal_integrity import stamp_digests
stamp_digests(g)
temp=P/'examples/reference.ttl.tmp';temp.write_text(g.serialize(format='turtle'));temp.replace(P/'examples/reference.ttl');print(len(g),'example triples',len(catalog)-1,'explicit domain instances')
