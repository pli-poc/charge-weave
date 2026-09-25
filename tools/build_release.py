from runtime import *
from rdflib import RDF,OWL
import json,hashlib,importlib.metadata
g=ontology();g.serialize(P/'ontology/charge-domain-complete.ttl',format='turtle');g.serialize(P/'ontology/charge-domain-complete.owl',format='xml');g.serialize(P/'ontology/charge-domain-complete.jsonld',format='json-ld',auto_compact=True)
catalog=json.loads((P/'model/catalog.json').read_text());types=json.loads((P/'model/property-types.json').read_text());ops=json.loads((P/'benchmark/endpoint-coverage.json').read_text());families=json.loads((P/'benchmark/resource-coverage.json').read_text())
manifest={'release':'1.0.0','date':'2026-09-25','namespace':str(C),'counts':{'domainClasses':len(catalog),'domainProperties':len(types),'modules':len({x['module'] for x in catalog.values()}),'codeSchemes':sum(1 for x in g.subjects(RDF.type,Namespace('http://www.w3.org/2004/02/skos/core#').ConceptScheme)),'businessRules':len(json.loads((P/'model/rules.json').read_text())),'resourceFamilies':len(families),'operationPages':len(ops),'uniqueOperationURLs':len({x['source'] for x in ops}),'ontologyTriples':len(g),'competencyQueries':len(list((P/'queries').glob('CQ*.rq')))},'dependencies':{x:importlib.metadata.version(x) for x in ['rdflib','pyshacl','owlready2']},'evidenceBoundary':'Complete accounting of captured public resource families and operation pages. Not a full API-field parity or production CPMS certification.','files':{}}
from project_files import project_files
for f in project_files(P):
 manifest['files'][str(f.relative_to(P))]=hashlib.sha256(f.read_bytes()).hexdigest()
(P/'reports/release-manifest.json').write_text(json.dumps(manifest,indent=2));print(manifest['counts'])
