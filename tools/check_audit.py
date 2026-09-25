"""Fail on broken requirement/source/actor/term/rule/scenario traceability."""
from runtime import *
import json
import hashlib
import sys

def read(path):
    return json.loads((P / path).read_text())
requirements = read('requirements/business-requirements.json')
actors = {a['id']:a for a in read('requirements/actors.json')}
journeys = {j['id']:j for j in read('requirements/journeys.json')}
sources = {s['id']:s for s in read('requirements/sources.json')}
catalog = read('model/catalog.json')
rules = {r['id']:r for r in read('model/rules.json')}
cases = read('tests/business-acceptance.json')
adversarial_cases = read('tests/adversarial-cases.json')
journey_cases = read('tests/journey-snapshots.json')
journey_ids = {c['id'] for c in journey_cases}
scenario_ids = {c['id'] for c in cases + adversarial_cases} | {'UNIT-'+k+'-REJECT' for k in read('tests/negative-cases.json')} | {'REF-PASS'}
rows = []
def result(name, passed, detail=None):
    rows.append({'check':name,'passed':bool(passed),'detail':detail})

result('unique-requirements', len(requirements) == len({r['id'] for r in requirements}))
for r in requirements:
    result(r['id']+':identity-and-responsibility', all(r.get(k) for k in ['statement','accountableParty','financialOwner','preconditions','normalOutcome','exceptionOutcome','runtimeObligation']))
    result(r['id']+':journey', r['journey'] in journeys)
    result(r['id']+':sources', bool(r['sources']) and all(x in sources for x in r['sources']))
    result(r['id']+':actors', bool(r['actors']) and all(a in actors or a == 'AllActors' for a in r['actors']))
    result(r['id']+':concepts', bool(r['classes']) and all(c in catalog for c in r['classes']))
    result(r['id']+':rules', bool(r['rules']) and all(k in rules for k in r['rules']))
    result(r['id']+':scenarios', bool(r['scenarios']) and all(s in scenario_ids for s in r['scenarios']))
    result(r['id']+':journey-scenarios', bool(r['journeyScenarios']) and all(s in journey_ids for s in r['journeyScenarios']))
    for relation in r['relationships']:
        cls = relation['class']
        actual = {f['property'] for f in catalog.get(cls, {}).get('fields', [])}
        result(r['id']+':paths:'+cls, set(relation['properties']) <= actual)
    if r['kind'] == 'audit-gap-closure':
        selected = [c for c in cases if c['requirement'] == r['id']]
        result(r['id']+':positive-and-negative', {c['expectedConformance'] for c in selected} == {True,False})
        result(r['id']+':scenario-rules', all(c['rule'] in r['rules'] for c in selected))
for case in adversarial_cases:
    requirement = next((r for r in requirements if r['id']==case['requirement']),None)
    result(case['id']+':requirement-traceability', requirement is not None and case['id'] in requirement['scenarios'])
    result(case['id']+':base-snapshot', (P/case['base']).is_file())
    result(case['id']+':rejection-rule', case['expectedConformance'] or case['expectedRule'] in rules)
for family in {c['family'] for c in adversarial_cases}:
    result(family+':adversarial-boundaries', {c['expectedConformance'] for c in adversarial_cases if c['family']==family}=={True,False})
used_rules = {rule for r in requirements for rule in r['rules']}
result('all-business-rules-accounted-for', set(rules) == used_rules, sorted(set(rules)-used_rules))
phases = set(read('requirements/scope.json')['lifecyclePhases'])
for key, journey in journeys.items():
    result(key+':six-lifecycle-phases', set(journey['lifecycle']) == phases and all(journey['lifecycle'].values()))
    result(key+':requirements', any(r['journey'] == key for r in requirements))
    result(key+':domain-terms', all(c in catalog for c in journey['classes']))
    selected = [c for c in journey_cases if key in c['journeys']]
    result(key+':full-graph-acceptance', {c['expectedConformance'] for c in selected} == {True,False})
for key, actor in actors.items():
    result(key+':journey-coverage', bool(actor['journeys']) and all(j in journeys for j in actor['journeys']))

o = ontology()
for transition in o.subjects(RDF.type, C.TransitionRule):
    prop = o.value(transition,C.transitionProperty)
    for predicate in (C.fromState,C.toState):
        value = o.value(transition,predicate)
        expected_class = C[str(prop).split('#')[-1][0].upper()+str(prop).split('#')[-1][1:]+'Code']
        result('lifecycle-code:'+str(transition).split('#')[-1]+':'+str(predicate).split('#')[-1], (value,RDF.type,expected_class) in o)
for entry in read('evidence/adversarial-v1.1/index.json'):
    directory = P/'evidence/adversarial-v1.1'
    baseline = json.loads((directory/entry['report']).read_text())
    digest = hashlib.sha256((directory/entry['cases']).read_bytes()).hexdigest()
    result('baseline-provenance:'+entry['report'], baseline['caseDigest']==digest
           and baseline['commit']=='d4348146fec3bc054a8a869c731f9d1c130d6a27'
           and baseline['baselineObservation'] is True and baseline['passed']==1 and baseline['total']==2)
report = {'requirements':len(requirements),'actors':len(actors),'journeys':len(journeys),
          'passed':sum(r['passed'] for r in rows),'total':len(rows),'checks':rows}
(P / 'reports/business-traceability.json').write_text(json.dumps(report,indent=2))
print({k:v for k,v in report.items() if k!='checks'})
for r in rows:
    if not r['passed']:print(r)
sys.exit(0 if all(r['passed'] for r in rows) else 1)
