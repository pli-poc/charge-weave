"""Check synthetic maintenance-demo examples against generated constraints."""
import json
import sys

from rdflib import BNode, Graph, Literal, RDF, XSD
from pyshacl import validate

from runtime import C, E, P, SH, ontology


reference = Graph().parse(P / 'examples/reference.ttl')
structure = Graph().parse(P / 'validation/structure.shacl.ttl')
business = Graph().parse(P / 'validation/business.shacl.ttl')
model = ontology()
focus = E.PlannedMaintenanceWindow
interval = E.TimeWindow
rows = []


def property_shape(name):
    """Copy the generated property shape and its RDF-list dependencies."""
    source = C['PlannedMaintenanceWindow_' + name + 'Shape']
    graph = Graph()
    root = E.MaintenanceDemoShape
    graph.add((root, RDF.type, SH.NodeShape))
    graph.add((root, SH.targetNode, focus))
    graph.add((root, SH.property, source))
    pending, seen = [source], set()
    while pending:
        node = pending.pop()
        if node in seen:
            continue
        seen.add(node)
        for triple in structure.triples((node, None, None)):
            graph.add(triple)
            if isinstance(triple[2], BNode):
                pending.append(triple[2])
    if not list(graph.predicate_objects(source)):
        raise ValueError('Missing generated maintenance property shape: ' + name)
    return source, graph


def business_shape():
    rule = C.B076
    graph = Graph()
    graph.add((rule, RDF.type, SH.NodeShape))
    graph.add((rule, SH.targetNode, interval))
    constraints = list(business.objects(rule, SH.sparql))
    if not constraints:
        raise ValueError('Missing shared TimeWindow rule B076')
    for constraint in constraints:
        graph.add((rule, SH.sparql, constraint))
        for triple in business.triples((constraint, None, None)):
            graph.add(triple)
    return rule, graph


def check(name, data, shape, expected, expected_shape):
    conforms, report, _ = validate(model + data, shacl_graph=shape, inference='none', advanced=True)
    passed = conforms == expected and (expected or (None, SH.sourceShape, expected_shape) in report)
    rows.append({'case': name, 'expectedConformance': expected, 'actualConformance': bool(conforms), 'passed': bool(passed)})


if (focus, RDF.type, C.PlannedMaintenanceWindow) not in reference or (focus, C.maintenanceInterval, interval) not in reference:
    raise ValueError('Generated all-class example lacks the planned maintenance window or its shared TimeWindow')
for name in ['maintenanceStation', 'maintenanceInterval', 'maintenanceAccountableParty', 'maintenancePlanningState']:
    source, shape = property_shape(name)
    check('valid-' + name, reference, shape, True, source)
station_source, station_shape = property_shape('maintenanceStation')
missing_station = Graph() + reference
missing_station.remove((focus, C.maintenanceStation, None))
check('missing-station', missing_station, station_shape, False, station_source)
state_source, state_shape = property_shape('maintenancePlanningState')
invalid_state = Graph() + reference
invalid_state.set((focus, C.maintenancePlanningState, C.maintenancePlanningState_Mystery))
check('invalid-planning-state', invalid_state, state_shape, False, state_source)
rule, interval_shape = business_shape()
check('valid-shared-interval', reference, interval_shape, True, rule)
invalid_interval = Graph() + reference
invalid_interval.set((interval, C.endsAt, Literal('2026-09-25T09:00:00Z', datatype=XSD.dateTime)))
check('reversed-shared-interval', invalid_interval, interval_shape, False, rule)
result = {'scope': 'Synthetic maintenance examples; generated property shapes and existing TimeWindow rule B076.', 'passed': sum(row['passed'] for row in rows), 'total': len(rows), 'cases': rows}
(P / 'reports/authoring-maintenance-demo.json').write_text(json.dumps(result, indent=2), encoding='utf8')
print(json.dumps(result), flush=True)
sys.exit(0 if rows and all(row['passed'] for row in rows) else 1)
