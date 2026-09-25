"""Validate complete business interaction scenarios with all production constraints."""
from runtime import *
import argparse,json,sys

parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--family',required=True);args=parser.parse_args()
cases=[c for c in json.loads((P/'tests/completion-scenarios.json').read_text()) if c['family']==args.family]
if not cases:parser.error('Unknown completion family')
prefix='PREFIX cd: <https://example.org/charge-domain#> PREFIX ex: <https://example.org/reference/> '
rows=[]
for case in cases:
 data=Graph().parse(P/case['file'])
 try:
  conforms,report,detail=check(data)
  asserted=not case['assertion'] or bool(data.query(prefix+case['assertion']))
  targeted=not case['expectedRule'] or (None,SH.sourceShape,C[case['expectedRule']]) in report
  passed=conforms==case['expectedConformance'] and asserted and targeted
  row=dict(scenario=case['id'],passed=bool(passed),conforms=conforms,assertion=bool(asserted),expectedRuleReported=bool(targeted))
  if not passed:print(detail,flush=True)
 except Exception as exc:row=dict(scenario=case['id'],passed=False,error=str(exc))
 rows.append(row);print(row,flush=True)
result=dict(passed=sum(r['passed'] for r in rows),total=len(rows),tests=rows)
(P/'reports'/('completion-'+args.family+'.json')).write_text(json.dumps(result,indent=2)+'\n')
sys.exit(0 if all(r['passed'] for r in rows) else 1)
