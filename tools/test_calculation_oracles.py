"""Challenge committed SPARQL with an independent Decimal oracle and IANA cases."""
from pathlib import Path
from decimal import Decimal, ROUND_HALF_UP, ROUND_HALF_EVEN, ROUND_DOWN, ROUND_UP
from rdflib import Graph,Namespace,Literal,XSD,RDF
from rdflib.plugins.sparql import prepareQuery
from time_resolution import time_resolution_error
import json,sys

P=Path(__file__).resolve().parents[1];C=Namespace('https://example.org/charge-domain#');T=Namespace('https://example.org/oracle/')
query=prepareQuery((P/'queries/B181.rq').read_text());rows=[]
def result(name,passed):rows.append(dict(check=name,passed=bool(passed)))
modes={'HalfUp':ROUND_HALF_UP,'HalfEven':ROUND_HALF_EVEN,'Down':ROUND_DOWN,'Up':ROUND_UP}
# Include both signs, ties with odd/even preceding digits, just above/below ties,
# exact zero, and values beyond binary floating point's exact integer range.
for places in range(7):
 quantum=Decimal(1).scaleb(-places)
 for mode,oracle in modes.items():
  for scaled in ('0','0.1','0.5','1.5','2.5','2.4999','2.5001','999.9999','1234567890123456.5'):
   for sign in (1,-1):
    raw=Decimal(scaled)*quantum*sign;expected=raw.quantize(quantum,rounding=oracle)
    graph=Graph()
    graph.add((T.this,RDF.type,C.AmountRounding))
    for prop,value in [('rawAmount',Literal(raw,datatype=XSD.decimal)),('roundingPolicy',T.policy)]:graph.add((T.this,C[prop],value))
    graph.add((T.policy,C.roundingMode,C['roundingMode_'+mode]));graph.add((T.policy,C.decimalPlaces,Literal(places,datatype=XSD.nonNegativeInteger)))
    for correct in (True,False):
     graph.set((T.this,C.roundedAmount,Literal(expected if correct else expected+quantum,datatype=XSD.decimal)))
     rejected=bool(list(graph.query(query,initBindings={'this':T.this})))
     result(f'round:{mode}:{places}:{raw}:{"correct" if correct else "one-quantum-error"}',rejected!=correct)

cases=json.loads((P/'tests/timezone-cases.json').read_text())
for case in cases:
 error=time_resolution_error(case['local'],case['utc'],case['zone'],case['policy'])
 result('timezone:'+case['id'],(error is None)==case['valid'])
report=dict(passed=sum(r['passed'] for r in rows),total=len(rows),checks=rows)
(P/'reports/calculation-oracles.json').write_text(json.dumps(report,indent=2)+'\n')
print({k:v for k,v in report.items() if k!='checks'})
for row in rows:
 if not row['passed']:print(row)
sys.exit(0 if all(r['passed'] for r in rows) else 1)
