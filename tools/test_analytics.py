"""Validate shared profile bindings and its generated RDF projection."""
import json
import sys
from rdflib import Graph
from runtime import P, check

profile = json.loads((P / 'model/analytics-profile.json').read_text())
catalog = json.loads((P / 'model/catalog.json').read_text())
tests = []
def result(name, passed): tests.append({'check': name, 'passed': bool(passed)})
def fields(cls):
    info = catalog[cls]
    return info['fields'] + (fields(info['parent']) if info['parent'] else [])

result('subject-class', profile['subject']['class'] in catalog)
result('unique-measures', len(profile['measures']) == len({m['id'] for m in profile['measures']}))
result('unique-dimensions', len(profile['dimensions']) == len({d['id'] for d in profile['dimensions']}))
for measure in profile['measures']:
    result(measure['id'] + ':canonical-property', any(f['property'] == measure['property'] for f in fields(measure['class'])))
    result(measure['id'] + ':additivity', (measure['aggregation'], measure['additivity']) in [('Sum', 'Additive'), ('RatioOfSums', 'Ratio'), ('Maximum', 'SemiAdditive')])
    result(measure['id'] + ':denominator', measure['aggregation'] != 'RatioOfSums' or bool(measure.get('denominator')))
for dimension in profile['dimensions']:
    result(dimension['id'] + ':class', dimension['class'] in catalog)
    result(dimension['id'] + ':parent', not dimension.get('parent') or any(d['id'] == dimension['parent'] for d in profile['dimensions']))
    seen = set(); item = dimension
    while item.get('parent') and item['id'] not in seen:
        seen.add(item['id']); item = next(d for d in profile['dimensions'] if d['id'] == item['parent'])
    result(dimension['id'] + ':acyclic', item['id'] not in seen)
for dashboard in profile['dashboards'].values():
    result('unique-pane-keys', len(dashboard['panes']) == len({p['id'] for p in dashboard['panes']}))
    for pane in dashboard['panes']:
        result(pane['id'] + ':approved-binding', bool(pane.get('renderer')) or
            (pane['kind'] in ['line', 'bar', 'table', 'kpi'] and pane['measure'] in {m['id'] for m in profile['measures']} and pane['dimension'] in {d['id'] for d in profile['dimensions']}))
graph = Graph().parse(P / 'examples/reference.ttl') + Graph().parse(P / 'examples/analytics-profile.ttl')
conforms, _, report = check(graph)
result('generated-analytical-profile-SHACL', conforms)
if not conforms: print(report)
(P / 'reports').mkdir(exist_ok=True)
(P / 'reports/analytics-checks.json').write_text(json.dumps({'passed': sum(t['passed'] for t in tests), 'total': len(tests), 'checks': tests}, indent=2))
print(f"Analytics contracts: {sum(t['passed'] for t in tests)}/{len(tests)}", flush=True)
sys.exit(0 if all(t['passed'] for t in tests) else 1)
