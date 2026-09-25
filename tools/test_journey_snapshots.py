"""Validate complete end-to-end semantic snapshots, including deliberately broken variants."""
from runtime import *
import argparse
import json
import sys

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--family')
args = parser.parse_args()
cases = json.loads((P / 'tests/journey-snapshots.json').read_text())
if args.family:
    cases = [c for c in cases if c['family'] == args.family]
if not cases:
    parser.error('No journey scenarios selected')
prefix = 'PREFIX cd: <https://example.org/charge-domain#> PREFIX ex: <https://example.org/reference/> '
rows = []
for case in cases:
    data = Graph().parse(P / case['file'])
    try:
        conforms, report, details = check(data)
        assertion = True if not case['assertion'] else bool(data.query(prefix + case['assertion']))
        expected_rule = not case['expectedRule'] or (None, SH.sourceShape, C[case['expectedRule']]) in report
        passed = conforms == case['expectedConformance'] and assertion and expected_rule
        row = {'scenario':case['id'], 'passed':bool(passed), 'conforms':conforms,
               'journeyAssertion':assertion, 'expectedRuleReported':bool(expected_rule)}
        if not passed:
            print(details, flush=True)
    except Exception as exc:
        row = {'scenario':case['id'], 'passed':False, 'error':str(exc)}
    rows.append(row)
    print(row, flush=True)
result = {'passed':sum(r['passed'] for r in rows), 'total':len(rows), 'tests':rows}
name = 'journey-' + (args.family or 'all') + '.json'
(P / 'reports' / name).write_text(json.dumps(result, indent=2))
sys.exit(0 if all(r['passed'] for r in rows) else 1)
