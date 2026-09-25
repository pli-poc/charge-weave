"""Render the independently authored requirement register; do not infer requirements from the ontology."""
from pathlib import Path
import json

P = Path(__file__).resolve().parents[1]
def read(name):
    return json.loads((P / 'requirements' / name).read_text())

requirements = read('business-requirements.json')
journeys = read('journeys.json')
sources = read('sources.json')
actors = read('actors.json')
scope = read('scope.json')
text = ['# Independent business requirements and traceability', '',
        'Scope: ' + scope['profile'], '',
        'This register was defined from actor outcomes, lifecycles and failure responsibilities. The historical external catalogue is not its denominator.', '',
        'Validation boundary: model-level decisions over complete authorized snapshots. Runtime obligations below require real service and adapter tests before deployment.', '',
        '| Requirement | Outcome / invariant | Journey | Concepts | Rules | Acceptance scenarios |',
        '|---|---|---|---|---|---|']
for r in requirements:
    text.append('| ' + ' | '.join([r['id'], r['statement'], r['journey'], ', '.join(r['classes']), ', '.join(r['rules']), ', '.join(r['scenarios'])]) + ' |')
for r in requirements:
    text += ['', '## ' + r['id'] + ' — ' + r['statement'], '',
             '- Accountable: ' + r['accountableParty'] + '.',
             '- Financial ownership: ' + r['financialOwner'] + '.',
             '- Actors: ' + ', '.join(r['actors']) + '.',
             '- Preconditions: ' + r['preconditions'],
             '- Normal outcome: ' + r['normalOutcome'],
             '- Exception outcome: ' + r['exceptionOutcome'],
             '- Review finding: ' + r['finding'],
             '- Disposition: ' + r['disposition'] + '.',
             '- Sources: ' + ', '.join(r['sources']) + '.',
             '- Associated full-graph journey snapshots: ' + ', '.join(r['journeyScenarios']) + '. These exercise the journey; focused scenarios above isolate this requirement.',
             '- Structural contracts: ' + ', '.join(r['structuralShapes']) + '.',
             '- Runtime acceptance: ' + r['runtimeObligation'], '',
             '| Concept | Reviewed relationship/value paths |', '|---|---|']
    for rel in r['relationships']:
        text.append('| ' + rel['class'] + ' | ' + ', '.join(rel['properties']) + ' |')
(P / 'docs/business-requirements.md').write_text('\n'.join(text) + '\n')
text = ['# Actors, business journeys and lifecycle responsibilities', '',
        '| Actor | Required business outcome | Journeys |', '|---|---|---|']
for a in actors:
    text.append('| ' + ' | '.join([a['id'], a['businessNeed'], ', '.join(a['journeys'])]) + ' |')
for j in journeys:
    text += ['', '## ' + j['id'] + ' — ' + j['title'], '',
             'Lead: ' + j['leadActor'] + '. Accountable: ' + j['accountableParty'] +
             '. Financial owner: ' + j['financialOwner'] + '.', '',
             '| Lifecycle phase | Required treatment |', '|---|---|']
    text += ['| ' + phase + ' | ' + treatment + ' |' for phase, treatment in j['lifecycle'].items()]
    text += ['', 'Concrete domain concepts: ' + ', '.join(j['classes']) + '.', '',
             'Requirements: ' + ', '.join(r['id'] for r in requirements if r['journey'] == j['id']) + '.', '',
             'Runtime acceptance: ' + j['runtimeAcceptance']]
(P / 'docs/actor-journeys.md').write_text('\n'.join(text) + '\n')
text = ['# Independent audit sources', '',
        'Reviewed 25 September 2026. Product-policy inferences are identified separately from externally specified behavior. Legal applicability is an explicit assessment, not inferred from a passing ontology test.', '',
        '| ID | Primary source | Use and limitation |', '|---|---|---|']
for s in sources:
    text.append('| ' + s['id'] + ' | [' + s['title'] + '](' + s['url'] + ') | ' + s['use'] + ' |')
text += ['', 'The direct consolidated legal-text endpoints could not be retrieved in this session; regulatory context uses the linked Commission and regulator guidance. This audit does not claim a country-by-country legal certification.', '',
         'Legacy catalogue references use `urn:chargeweave:legacy-api` / `urn:chargeweave:legacy-site` identifiers after requested current-tree debranding. They are redacted provenance identifiers, not working web links, and are not evidence for the independent requirement audit.']
(P / 'docs/business-research-sources.md').write_text('\n'.join(text) + '\n')
print(f'Rendered {len(requirements)} requirements, {len(journeys)} journeys and {len(actors)} actor roles.')
