"""Reject unreviewed scope/contract changes and missing positive/negative evidence.

This is a traceability gate. Separate CI jobs execute every referenced test suite.
It does not infer new business requirements from a green schema.
"""
from pathlib import Path
import hashlib,json,sys
P=Path(__file__).resolve().parents[1]
read=lambda path:json.loads((P/path).read_text())
catalog=read('model/catalog.json');rules={r['id']:r for r in read('model/rules.json')}
requirements={r['id']:r for r in read('requirements/business-requirements.json')}
journeys={j['id']:j for j in read('requirements/journeys.json')}
concepts=read('requirements/concept-review.json');criteria=read('requirements/completion-criteria.json')
cases=read('tests/business-acceptance.json');full=read('tests/completion-scenarios.json');baseline=read('tests/journey-snapshots.json')
rows=[]
def result(name,ok):rows.append(dict(check=name,passed=bool(ok)))
result('scope-version',criteria['profileVersion']==read('requirements/scope.json')['version'])
result('every-concept-reviewed-once',len(concepts)==len(catalog) and {c['concept'] for c in concepts}==set(catalog))
for review in concepts:
 name=review['concept'];contract=catalog.get(name,{})
 digest=hashlib.sha256(json.dumps(contract,sort_keys=True,separators=(',',':')).encode()).hexdigest()
 result(name+':contract-review-current',review['contractFingerprint']==digest)
 result(name+':fields-reviewed',set(review['reviewedFields'])=={f['property'] for f in contract.get('fields',[])})
 result(name+':ownership',review['primaryJourney'] in journeys and review['accountableParty'] and review['financialOwner'])
 result(name+':requirements',bool(review['requirements']) and all(r in requirements and name in requirements[r]['classes'] for r in review['requirements']))
 result(name+':direct-rule-coverage',set(review['directRules'])=={r['id'] for r in rules.values() if r['target']==name})
 result(name+':review-disposition',review['status']=='reviewed' and review['validationMode'] in ('structural-data-contract','structural-and-business') and review['assessment'])
result('all-modules-reviewed',{c['module'] for c in concepts}=={c['module'] for c in catalog.values()})
result('all-journeys-reviewed-once',len(criteria['journeys'])==len(journeys) and {c['journey'] for c in criteria['journeys']}==set(journeys))
for criterion in criteria['journeys']:
 key=criterion['journey'];journey=journeys[key]
 result(key+':outcomes-and-responsibility',all(criterion.get(k) for k in ('normalOutcome','changeAndTermination','exceptionOutcome','accountableParty','financialOwner')))
 result(key+':lifecycle-review',criterion['lifecycleTreatments']==journey['lifecycle'])
 result(key+':requirements',set(criterion['requirements'])=={r['id'] for r in requirements.values() if r['journey']==key})
 result(key+':complete-graph-outcomes',{c['expectedConformance'] for c in baseline if key in c['journeys']}=={True,False})
for key,rule in rules.items():
 selected=[c for c in cases if c['rule']==key]
 result(key+':positive-and-negative-decisions',{c['expectedConformance'] for c in selected}=={True,False})
 result(key+':nonempty-distinct-facts',all(c['given'].strip() for c in selected) and len({c['given'] for c in selected})>=2)
 result(key+':actual-rule-target',all(c['focusClass']==rule['target'] for c in selected))
 if int(key[1:])>=173:
  selected=[c for c in full if 'BR-'+key[1:] in c['requirements']]
  result(key+':full-graph-integration',any(c['expectedConformance'] and c['assertion'] for c in selected) and any(c['expectedRule']==key for c in selected))
for case in full:
 result(case['id']+':source-and-requirements',(P/case['file']).is_file() and all(r in requirements for r in case['requirements']))
 result(case['id']+':exact-rejection',case['expectedConformance'] or case['expectedRule'] in rules or case['expectedRule']=='IanaTimeResolutionConstraint')
for req in requirements.values():
 if int(req['id'].split('-')[1])>=173:
  result(req['id']+':integration-links',set(req.get('completionScenarios',[]))=={c['id'] for c in full if req['id'] in c['requirements']})
result('unique-acceptance-ids',len(cases)==len({c['id'] for c in cases}))
result('unique-complete-scenario-ids',len(full)==len({c['id'] for c in full}))
report=dict(passed=sum(r['passed'] for r in rows),total=len(rows),checks=rows,
 scope='Finite declared semantic baseline: reviewed contracts and resolvable evidence. Executed outcomes are independently required by CI packaging.')
(P/'reports/completeness.json').write_text(json.dumps(report,indent=2)+'\n')
print({k:v for k,v in report.items() if k!='checks'})
for row in rows:
 if not row['passed']:print(row)
sys.exit(0 if all(r['passed'] for r in rows) else 1)
