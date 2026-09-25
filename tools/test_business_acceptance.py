"""Execute independently authored valid and invalid business decisions via SHACL."""
from runtime import *
import json
import sys
from pyshacl import validate

prefix = '@prefix cd: <https://example.org/charge-domain#> . @prefix ex: <https://example.org/test/> . @prefix xsd: <http://www.w3.org/2001/XMLSchema#> . '
T = Namespace('https://example.org/test/')
cases = json.loads((P / 'tests/business-acceptance.json').read_text())
base = ontology()
business = Graph().parse(P / 'validation/business.shacl.ttl')
rows = []
for case in cases:
    data = Graph().parse(data=prefix + case['given'], format='turtle')
    data.add((T.this, RDF.type, C[case['focusClass']]))
    shape = Graph()
    rule = C[case['rule']]
    shape.add((rule, RDF.type, SH.NodeShape))
    shape.add((rule, SH.targetNode, T.this))
    for constraint in business.objects(rule, SH.sparql):
        shape.add((rule, SH.sparql, constraint))
        for triple in business.triples((constraint, None, None)):
            shape.add(triple)
    try:
        conforms, report, _ = validate(base + data, shacl_graph=shape, inference='none', advanced=True)
        expected = case['expectedConformance']
        passed = conforms == expected and (expected or (None, SH.sourceShape, rule) in report)
        rows.append({'scenario': case['id'], 'requirement': case['requirement'],
                     'rule': case['rule'], 'expectedConformance': expected,
                     'actualConformance': conforms, 'passed': bool(passed)})
    except Exception as exc:
        rows.append({'scenario': case['id'], 'passed': False, 'error': str(exc)})
    if not rows[-1]['passed']:
        print(rows[-1], flush=True)
result = {'passed': sum(r['passed'] for r in rows), 'total': len(rows), 'tests': rows}
(P / 'reports/business-acceptance.json').write_text(json.dumps(result, indent=2))
print({k: v for k, v in result.items() if k != 'tests'}, flush=True)
sys.exit(0 if rows and all(r['passed'] for r in rows) else 1)
