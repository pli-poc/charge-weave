"""Project the shared analytical presentation profile into canonical RDF contracts."""
import json
from rdflib import Graph, XSD, Literal, URIRef
from runtime import P, C, E

profile = json.loads((P / 'model/analytics-profile.json').read_text())
reference = Graph().parse(P / 'examples/reference.ttl')
g = Graph(); g.bind('cd', C); g.bind('ex', E)


def record(cls, key, **fields):
    node = E['analytics-' + key]
    for predicate, value in reference.predicate_objects(E[cls]):
        g.add((node, predicate, value))
    g.set((node, C.canonicalId, Literal('analytics-' + key, datatype=XSD.string)))
    for key, value in fields.items():
        g.set((node, C[key], value))
    return node


def text(value): return Literal(str(value), datatype=XSD.string)
def code(prop, value): return C[prop + '_' + value]
def time(value): return Literal(value, datatype=XSD.dateTime)


subject = record('AnalyticalSubject', 'subject', subjectKey=text(profile['subject']['id']),
    subjectClass=C[profile['subject']['class']], factGrain=text(profile['subject']['grain']),
    populationExpression=text(profile['subject']['population']), joinPolicy=text(profile['subject']['joinPolicy']))
dimensions = {}
for item in profile['dimensions']:
    dimensions[item['id']] = record('DimensionDefinition', 'dimension-' + item['id'],
        analyticalSubject=subject, dimensionKey=text(item['id']), dimensionClass=C[item['class']],
        dimensionExpression=text(item['field']), dimensionValueDatatype=XSD.string,
        joinCardinality=code('joinCardinality', 'ManyToOne'), historicalAssignment=code('historicalAssignment', 'AtEventTime'))
for item in profile['dimensions']:
    if item.get('parent'): g.set((dimensions[item['id']], C.parentDimension, dimensions[item['parent']]))
measures = {}
for item in profile['measures']:
    metric = record('MetricDefinition', 'metric-' + item['id'], metricName=text(item['label']),
        metricVersion=text(item['version']), metricExpression=text(item['description']),
        expressionLanguage=text('ChargeWeave analytical profile v1'), unitIri=URIRef(item['unitIri']), scopeClass=C.ChargingSite)
    fields = dict(metricDefinition=metric, analyticalSubject=subject, numeratorExpression=text(item['field']),
        aggregationPolicy=code('aggregationPolicy', item['aggregation']), additivity=code('additivity', item['additivity']),
        scaleFactor=Literal(str(item['scale']), datatype=XSD.decimal), missingValuePolicy=code('missingValuePolicy', 'Unavailable'),
        financialBasis=code('financialBasis', item.get('financialBasis', 'NotApplicable')))
    if item.get('denominator'): fields['denominatorExpression'] = text(item['denominator'])
    measures[item['id']] = record('MeasureDefinition', 'measure-' + item['id'], **fields)

period = profile['periods'][0]
window = record('TimeWindow', 'report-window', startsAt=time(period['start']), endsAt=time(period['end']))
baseline = record('TimeWindow', 'baseline-window', startsAt=time(period['reference']['start']), endsAt=time(period['reference']['end']))
context = record('AnalyticalTimeContext', 'time', reportWindow=window, knownAt=time(profile['knowledgeCutoffs'][0]['id']),
    timezoneName=text('UTC'), bucketGrain=code('bucketGrain', 'Day'))
comparison = record('AnalyticalComparison', 'comparison', comparisonKind=code('comparisonKind', 'PreviousPeriod'),
    referenceWindow=baseline, cohortPolicy=code('cohortPolicy', 'SamePopulation'), alignmentPolicy=code('alignmentPolicy', 'CalendarPeriod'))
dashboard = record('DashboardDefinition', 'overview', dashboardKey=text('overview'), definitionVersion=text(profile['version']))
g.remove((dashboard, C.paneDefinition, None))
for index, pane in enumerate(profile['dashboards']['overview']['panes']):
    fields = dict(paneKey=text(pane['id']), paneTitle=text(pane['title']), paneOrder=Literal(index, datatype=XSD.nonNegativeInteger))
    if pane.get('renderer'):
        fields.update(paneKind=code('paneKind', 'Custom'), rendererKey=text(pane['renderer']))
    else:
        ranking = record('AnalyticalRanking', 'ranking-' + pane['id'], rankBy=code('rankBy', 'Value'),
            rankDirection=code('rankDirection', pane.get('direction', 'Descending')),
            rankLimit=Literal(pane.get('limit', 0), datatype=XSD.nonNegativeInteger), tiePolicy=code('tiePolicy', 'StableKey'))
        query = record('AnalyticalQuery', 'query-' + pane['id'], analyticalSubject=subject,
            measureDefinition=measures[pane['measure']], dimensionDefinition=dimensions[pane['dimension']],
            analyticalOperator=code('analyticalOperator', 'Value'), timeContext=context,
            analyticalComparison=comparison, analyticalRanking=ranking, queryVersion=text(profile['version']))
        fields.update(paneKind=code('paneKind', pane['kind'].title()), analyticalQuery=query)
    node = record('DashboardPane', 'pane-' + pane['id'], **fields)
    if not pane.get('renderer'): g.remove((node, C.rendererKey, None))
    g.add((dashboard, C.paneDefinition, node))
(P / 'examples/analytics-profile.ttl').write_text(g.serialize(format='turtle'))
print(len(g), 'analytical profile triples')
