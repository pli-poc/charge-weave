from pathlib import Path
from rdflib import Graph,Namespace,RDF,RDFS,OWL,Literal,BNode
from pyshacl import validate
P=Path(__file__).resolve().parents[1]
(P/'reports').mkdir(exist_ok=True)
C=Namespace('https://example.org/charge-domain#');E=Namespace('https://example.org/reference/');SH=Namespace('http://www.w3.org/ns/shacl#')
def ontology():
 g=Graph()
 for f in ['charge-domain.ttl','actions-events.ttl','transitions.ttl']:g.parse(P/'ontology'/f)
 return g
def shapes():
 g=Graph()
 for f in sorted((P/'validation').glob('*.shacl.ttl')):g.parse(f)
 return g
def schema_injection(data):
 """Keep submitted instance data from changing the trusted validation vocabulary."""
 reserved_types={OWL.Class,OWL.Ontology,OWL.ObjectProperty,OWL.DatatypeProperty,OWL.AnnotationProperty,OWL.Restriction,SH.NodeShape,SH.PropertyShape,C.TransitionRule,C.CommandKind,C.EventKind}
 reserved_predicates={RDFS.subClassOf,RDFS.subPropertyOf,RDFS.domain,RDFS.range,C.transitionProperty,C.fromState,C.toState,C.sameTenant,C.operationTarget,C.abstract}
 errors=[]
 for s,p,o in data:
  if str(s).startswith(str(C)) or p in reserved_predicates or str(p).startswith(str(OWL)) or str(p).startswith(str(SH)) or (p==RDF.type and (o in reserved_types or (str(o).startswith(str(C)) and str(o).endswith('Code')))):
   errors.append((s,p))
 return errors
def check(data,meta=False):
 import json
 domain={C[c] for c in json.loads((P/'model/catalog.json').read_text())}
 if not any(o in domain for o in data.objects(None,RDF.type)):
  report=Graph();root=BNode();report.add((root,RDF.type,SH.ValidationReport));report.add((root,SH.conforms,Literal(False)))
  report.add((root,SH.resultMessage,Literal('No typed canonical domain instances were submitted.')))
  return False,report,'Conforms: false\nNo typed canonical domain instances were submitted.\n'
 errors=schema_injection(data)
 if errors:
  report=Graph();root=BNode();report.add((root,RDF.type,SH.ValidationReport));report.add((root,SH.conforms,Literal(False)))
  for node,path in errors:
   result=BNode();report.add((root,SH.result,result));report.add((result,RDF.type,SH.ValidationResult));report.add((result,SH.resultSeverity,SH.Violation));report.add((result,SH.focusNode,node));report.add((result,SH.resultPath,path));report.add((result,SH.resultMessage,Literal('Instance data cannot redefine trusted ontology, code or transition metadata.')))
  return False,report,'Conforms: false\nInstance data contains trusted-schema redefinitions.\n'
 # Include the controlled individuals and transition table, not just schema inoculation.
 merged=ontology()+data
 conforms,report,detail=validate(merged,shacl_graph=shapes(),inference='none',advanced=True,meta_shacl=meta,allow_warnings=False)
 from time_resolution import graph_errors
 errors=list(graph_errors(data,C))
 if errors:
  root=next(report.subjects(RDF.type,SH.ValidationReport))
  report.set((root,SH.conforms,Literal(False)))
  for node,message in errors:
   result=BNode();report.add((root,SH.result,result));report.add((result,RDF.type,SH.ValidationResult))
   report.add((result,SH.resultSeverity,SH.Violation));report.add((result,SH.focusNode,node))
   report.add((result,SH.sourceShape,C.IanaTimeResolutionConstraint));report.add((result,SH.resultPath,C.sourceLocalTime))
   report.add((result,SH.sourceConstraintComponent,C.IanaTimeResolutionConstraint))
   report.add((result,SH.resultMessage,Literal(message)))
  detail='Conforms: false\nSupplemental IANA timezone validation failed:\n'+'\n'.join(str(n)+': '+m for n,m in errors)+'\n'+detail.replace('Conforms: True','SHACL-only conforms: True')
 return bool(conforms) and not errors,report,detail
