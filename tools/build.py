"""Compile the reviewed declarative domain model to OWL, SHACL and a data dictionary."""
from pathlib import Path
import re,json
from collections import defaultdict
from rdflib import Graph,Namespace,URIRef,Literal,BNode,RDF,RDFS,OWL,XSD
from rdflib.collection import Collection
P=Path(__file__).resolve().parents[1]
BASE='https://example.org/charge-domain#'
C=Namespace(BASE); SH=Namespace('http://www.w3.org/ns/shacl#'); SKOS=Namespace('http://www.w3.org/2004/02/skos/core#'); DCT=Namespace('http://purl.org/dc/terms/')
DT={'string':XSD.string,'langString':RDF.langString,'integer':XSD.integer,'nonNegativeInteger':XSD.nonNegativeInteger,'positiveInteger':XSD.positiveInteger,'decimal':XSD.decimal,'boolean':XSD.boolean,'dateTime':XSD.dateTime,'date':XSD.string,'time':XSD.string,'anyURI':XSD.anyURI}
def graph():
 g=Graph()
 for k,n in [('cd',C),('sh',SH),('owl',OWL),('rdfs',RDFS),('xsd',XSD),('skos',SKOS),('dct',DCT)]:g.bind(k,n)
 return g
def snake_label(s):return re.sub(r'(?<=[a-z0-9])(?=[A-Z])',' ',s)
def lst(g,x):
 b=BNode();Collection(g,b,x);return b
classes={}; enum=defaultdict(set); prop_types=defaultdict(set); prop_users=defaultdict(set); module=None
for no,line in enumerate((P/'model/domain.schema').read_text().splitlines(),1):
 if not line or line.startswith('#'):continue
 if line.startswith('MODULE|'):module=line.split('|')[1];continue
 c,parent,definition,fields=line.split('|');assert c not in classes,c
 fs=[]
 for token in fields.split():
  key,t=token.split(':',1); card=t[-1]; t=t[:-1];assert card in '!?+*',(no,token)
  vals=None
  if t.startswith('{'):
   vals=t[1:-1].split(',');enum[key].update(vals);typ='enum';r=key[0].upper()+key[1:]+'Code'
  else:typ='datatype' if t in DT else ('iri' if t=='IRI' else 'object');r=t
  fs.append(dict(property=key,type=typ,range=r,cardinality=card,values=vals));prop_types[key].add((typ,r));prop_users[key].add(c)
 classes[c]=dict(module=module,parent='Record' if parent=='-' else (None if parent=='root' else parent),definition=definition,fields=fs)
for c,info in classes.items():
 for f in info['fields']:
  if f['type']=='object':assert f['range'] in classes,(c,f)
for k,ts in prop_types.items():
 assert len({t[0] for t in ts})==1,(k,ts)
ont=graph(); shapes=graph(); concepts=graph();mods={m:graph() for m in sorted({i['module'] for i in classes.values()})}
root=URIRef('https://example.org/charge-domain')
ont.add((root,RDF.type,OWL.Ontology));ont.add((root,OWL.versionIRI,URIRef('https://example.org/charge-domain/1.0.0')));ont.add((root,OWL.versionInfo,Literal('1.0.0')));ont.add((root,DCT.title,Literal('Charge Domain Ontology',lang='en')))
for ap in ['module','definitionStatus','abstract','sameTenant','benchmarkSource','operationTarget','sourcePath']:
 ont.add((C[ap],RDF.type,OWL.AnnotationProperty))
for c,i in classes.items():
 g=mods[i['module']];n=C[c]
 for tr in [(n,RDF.type,OWL.Class),(n,RDFS.label,Literal(snake_label(c),lang='en')),(n,RDFS.comment,Literal(i['definition'],lang='en')),(n,C.module,Literal(i['module'])),(n,C.definitionStatus,Literal('Defined'))]:g.add(tr)
 if i['parent']:g.add((n,RDFS.subClassOf,C[i['parent']]))
 if c=='Record':g.add((n,C.abstract,Literal(True)))
 sn=C[c+'Shape'];shapes.add((sn,RDF.type,SH.NodeShape));shapes.add((sn,SH.targetClass,n));shapes.add((sn,SH.nodeKind,SH.IRI));shapes.add((sn,SH.description,Literal(i['definition'])))
 for f in i['fields']:
  k=f['property'];p=C[k];ps=C[c+'_'+k+'Shape'];shapes.add((sn,SH.property,ps));shapes.add((ps,RDF.type,SH.PropertyShape));shapes.add((ps,SH.path,p));shapes.add((ps,SH.name,Literal(snake_label(k))));shapes.add((ps,SH.message,Literal(c+'.'+k+' violates its domain contract.')))
  card=f['cardinality'];minimum=1 if card in '!+' else 0
  if minimum:shapes.add((ps,SH.minCount,Literal(1)))
  if card in '!?':shapes.add((ps,SH.maxCount,Literal(1)))
  if f['type']=='datatype':
   shapes.add((ps,SH.datatype,DT[f['range']]))
   if f['range']=='positiveInteger':shapes.add((ps,SH.minInclusive,Literal(1)))
   if f['range']=='nonNegativeInteger':shapes.add((ps,SH.minInclusive,Literal(0)))
   if f['range'] in ['string','langString']:shapes.add((ps,SH.minLength,Literal(1)))
   if f['range']=='langString':shapes.add((ps,SH.uniqueLang,Literal(True)))
   if f['range']=='dateTime':shapes.add((ps,SH.pattern,Literal(r'(Z|[+-][0-9]{2}:[0-9]{2})$')))
   if f['range']=='date':shapes.add((ps,SH.pattern,Literal(r'^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$')))
   if f['range']=='time':shapes.add((ps,SH.pattern,Literal(r'^([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$')))
  elif f['type']=='object':shapes.add((ps,SH['class'],C[f['range']]));shapes.add((ps,SH.nodeKind,SH.IRI))
  elif f['type']=='enum':
   shapes.add((ps,SH['class'],C[f['range']]));shapes.add((ps,SH['in'],lst(shapes,[C[k+'_'+v] for v in f['values']])));shapes.add((ps,SH.nodeKind,SH.IRI))
  else:shapes.add((ps,SH.nodeKind,SH.IRI))
  # OWL allValuesFrom is a semantic restriction, not a missing-field validator.
  if f['type'] not in ['iri']:
   rr=DT[f['range']] if f['type']=='datatype' else C[f['range']]
   b=BNode();g.add((b,RDF.type,OWL.Restriction));g.add((b,OWL.onProperty,p));g.add((b,OWL.allValuesFrom,rr));g.add((n,RDFS.subClassOf,b))
# Properties may be reused by classes. Use explicit range union rather than intersecting global ranges.
for k,ts in sorted(prop_types.items()):
 p=C[k];typ=next(iter(ts))[0]; ont.add((p,RDF.type,OWL.DatatypeProperty if typ=='datatype' else OWL.ObjectProperty));ont.add((p,RDFS.label,Literal(snake_label(k),lang='en')))
 users=sorted(prop_users[k]);ont.add((p,RDFS.comment,Literal('Domain relation or value '+snake_label(k)+'; per-class meaning, range and cardinality are specified in the linked class contracts. Used by '+', '.join(users)+'.',lang='en')))
 if typ=='datatype':
  rs={DT[t[1]] for t in ts};assert len(rs)==1,(k,ts);ont.add((p,RDFS.range,next(iter(rs))))
 elif typ!='iri':
  rs=[C[t[1]] for t in sorted(ts)]
  if len(rs)==1:ont.add((p,RDFS.range,rs[0]))
  else:
   b=BNode();ont.add((b,RDF.type,OWL.Class));ont.add((b,OWL.unionOf,lst(ont,rs)));ont.add((p,RDFS.range,b))
  if typ=='object' and k!='tenant':ont.add((p,C.sameTenant,Literal(True)))
for k,values in sorted(enum.items()):
 cls=C[k[0].upper()+k[1:]+'Code'];scheme=C[k+'Scheme'];concepts.add((cls,RDF.type,OWL.Class));concepts.add((cls,RDFS.subClassOf,SKOS.Concept));concepts.add((cls,RDFS.label,Literal(snake_label(k)+' code',lang='en')));concepts.add((scheme,RDF.type,SKOS.ConceptScheme));concepts.add((scheme,SKOS.prefLabel,Literal(snake_label(k),lang='en')))
 vals=[C[k+'_'+v] for v in sorted(values)];concepts.add((cls,OWL.equivalentClass,BNode('enum'+k)));concepts.add((BNode('enum'+k),RDF.type,OWL.Class));concepts.add((BNode('enum'+k),OWL.oneOf,lst(concepts,vals)))
 for v,n in zip(sorted(values),vals):
  concepts.add((n,RDF.type,OWL.NamedIndividual));concepts.add((n,RDF.type,cls));concepts.add((n,RDF.type,SKOS.Concept));concepts.add((n,SKOS.inScheme,scheme));concepts.add((n,SKOS.prefLabel,Literal(snake_label(v),lang='en')))
 b=BNode();concepts.add((b,RDF.type,OWL.AllDifferent));concepts.add((b,OWL.distinctMembers,lst(concepts,vals)))
# Precisely different core concepts. Avoid globally disjoint all-classes rules that preclude extensions.
for group in [['ChargingStation','ChargingUnit','Connector','ParkingSpace'],['ChargingSession','ProtocolTransaction','PaymentIntent','ChargeDetailRecord','Invoice'],['LegalEntity','PartyRole','OperatorService','Tenant'],['ElectricalCircuit','LoadControlGroup'],['EnergyCoupon','Voucher','Wallet']]:
 b=BNode();ont.add((b,RDF.type,OWL.AllDisjointClasses));ont.add((b,OWL.members,lst(ont,[C[x] for x in group])))
# Universally applicable numeric and code constraints.
nonnegative=['maximumPowerKW','minimumCurrentA','maximumCurrentA','ratedVoltageV','ratedCurrentA','ratedPowerKW','batteryCapacityKWh','maximumChargePowerKW','capacityKWh','importedEnergyKWh','exportedEnergyKWh','energyAllowanceKWh','consumedEnergyKWh','reimbursableEnergyKWh','importLimitKW','exportLimitKW','offlineReserveCurrentA','eligibleSeconds','unavailableSeconds','requiredEnergyKWh','authorizedAmount','capturedAmount','refundAmount','disputedAmount','requestedAmount','purchaseAmount','creditAmount','faceValue','redeemedAmount','sponsorAmount','driverAmount','creditAmount','reimbursementAmount','reimbursementRate','minimumQuantity','maximumQuantity','graceQuantity','consumedValue','allowanceValue','ratedCurrentA']
fractions=['shareFraction','allocationFraction','availabilityFraction']; percents=['stateOfChargePercent','targetStateOfChargePercent','minimumStateOfChargePercent','maximumStateOfChargePercent']
for c,i in classes.items():
 for f in i['fields']:
  k=f['property'];ps=C[c+'_'+k+'Shape']
  if k in nonnegative+fractions+percents:shapes.add((ps,SH.minInclusive,Literal(0)))
  if k in fractions:shapes.add((ps,SH.maxInclusive,Literal(1)))
  if k in percents:shapes.add((ps,SH.maxInclusive,Literal(100)))
  if k in ['conversionRate','billingStep','voltageV']:shapes.add((ps,SH.minExclusive,Literal(0)))
  if k=='latitude':shapes.add((ps,SH.minInclusive,Literal(-90)));shapes.add((ps,SH.maxInclusive,Literal(90)))
  if k=='longitude':shapes.add((ps,SH.minInclusive,Literal(-180)));shapes.add((ps,SH.maxInclusive,Literal(180)))
  if k=='weekday':shapes.add((ps,SH.maxInclusive,Literal(6)))
  if k=='countryCode':shapes.add((ps,SH.pattern,Literal('^[A-Z]{2}$')))
  if k=='currencyCode':shapes.add((ps,SH.pattern,Literal('^[A-Z]{3}$')))
  if k=='contentDigest':shapes.add((ps,SH.pattern,Literal('^sha256:[a-f0-9]{64}$')))
  if k=='numberOfPhases':shapes.add((ps,SH.maxInclusive,Literal(3)))
for m,g in mods.items():
 g.serialize(P/f'ontology/modules/{m}.ttl',format='turtle');ont+=g
concepts.serialize(P/'ontology/codes.ttl',format='turtle');ont+=concepts
ont.serialize(P/'ontology/charge-domain.ttl',format='turtle');ont.serialize(P/'ontology/charge-domain.owl',format='xml');ont.serialize(P/'ontology/charge-domain.jsonld',format='json-ld',auto_compact=True)
shapes.serialize(P/'validation/structure.shacl.ttl',format='turtle')
(P/'model/catalog.json').write_text(json.dumps(classes,indent=2))
(P/'model/property-types.json').write_text(json.dumps({k:sorted(v) for k,v in prop_types.items()},indent=2))
d=['# Domain dictionary','', 'Cardinalities: `!` exactly one, `?` zero or one, `+` one or more, `*` any number. Every Record subclass also inherits the Record properties. OWL has open-world semantics; mandatory fields are enforced by SHACL.','']
for m in mods:
 d+=['## '+m,'']
 for c,i in classes.items():
  if i['module']!=m:continue
  d+=['### '+c,'',i['definition'],'',f'Parent: {i["parent"] or "root"}. Shape: `{c}Shape`.','', '| Property | Range | Cardinality |','|---|---|---|']
  for f in i['fields']:d+=['| '+f['property']+' | '+(', '.join(f['values']) if f['values'] else f['range'])+' | '+f['cardinality']+' |']
  d+=['']
(P/'docs/domain-dictionary.md').write_text('\n'.join(d))
print(json.dumps(dict(classes=len(classes),modules=len(mods),properties=len(prop_types),codeSchemes=len(enum),ontologyTriples=len(ont),structureTriples=len(shapes))))
