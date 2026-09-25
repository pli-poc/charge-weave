"""Apply independently authored business contradictions to complete valid snapshots."""
from runtime import *
from rdflib.util import from_n3
import argparse, hashlib, json, subprocess, sys

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--family', required=True)
parser.add_argument('--capture-baseline', action='store_true', help='Record observations before fixes; never a release gate.')
args = parser.parse_args()
cases = [c for c in json.loads((P/'tests/adversarial-cases.json').read_text()) if c['family']==args.family]
if not cases:parser.error('Unknown adversarial family')
rows=[]
for case in cases:
    graph=Graph().parse(P/case['base'])
    graph.bind('cd',C);graph.bind('ex',E)
    for change in case['mutations']:
        if change['op']=='clone':
            target=E[change['target']]
            for p,o in list(graph.predicate_objects(E[change['source']])):graph.add((target,p,o))
            graph.set((target,C.canonicalId,Literal(change['target'],datatype=Namespace('http://www.w3.org/2001/XMLSchema#').string)))
        elif change['op']=='set':
            graph.set((E[change['subject']],C[change['predicate']],from_n3(change['object'],nsm=graph.namespace_manager)))
        elif change['op']=='remove':
            graph.remove((E[change['subject']],C[change['predicate']],None))
        else:raise ValueError('Unknown mutation')
    conforms,report,detail=check(graph)
    expected=case['expectedConformance']
    rule_reported=not case['expectedRule'] or (None,SH.sourceShape,C[case['expectedRule']]) in report
    row={'scenario':case['id'],'requirement':case['requirement'],'expectedConformance':expected,
         'actualConformance':bool(conforms),'expectedRuleReported':bool(rule_reported),
         'passed':conforms==expected and bool(rule_reported)}
    if not row['passed']:row['validationReport']=detail
    rows.append(row);print(row,flush=True)
result={'commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=P,text=True).strip(),
        'caseDigest':hashlib.sha256((P/'tests/adversarial-cases.json').read_bytes()).hexdigest(),
        'scope':'Full structural and business SHACL; synthetic snapshots, no external execution.',
        'baselineObservation':args.capture_baseline,'passed':sum(r['passed'] for r in rows),'total':len(rows),'tests':rows}
prefix='adversarial-baseline-' if args.capture_baseline else 'adversarial-'
(P/'reports'/(prefix+args.family+'.json')).write_text(json.dumps(result,indent=2)+'\n')
sys.exit(0 if args.capture_baseline or all(r['passed'] for r in rows) else 1)
