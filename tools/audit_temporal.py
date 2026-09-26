"""Inventory every class and capture temporal gaps without claiming completeness.

Controls and formerly accepted temporal faults must pass their expected rejection checks.
"""
from pathlib import Path
import argparse
import hashlib
import json
import subprocess
import sys
from rdflib import Graph, Literal, RDF, XSD
from runtime import P, C, E, SH, check, ontology


def inventory(catalog):
    def inherited(name):
        parent = catalog[name]['parent']
        return catalog[name]['fields'] + (inherited(parent) if parent else [])
    from temporal_integrity import policy
    policies = policy()['classPolicies']
    rows = []
    for name, info in sorted(catalog.items(), key=lambda kv: (kv[1]['module'], kv[0])):
        fields = inherited(name)
        rows.append({
            'class': name, 'module': info['module'], 'policy': policies[name],
            'timeFields': [f['property'] for f in fields if f['range'] in ('dateTime', 'date', 'time') and f['property'] != 'createdAt'],
            'intervalLinks': [f['property'] + ' → ' + f['range'] for f in fields if f['range'] in ('TimeWindow', 'RecurringWindow')],
            'recordProvenance': [f['property'] for f in fields if f['property'] in ('createdAt', 'revision')],
        })
    return rows


def inventory_markdown(rows):
    lines = ['# Temporal field inventory', '',
        'Generated from every class contract by `python tools/audit_temporal.py --write-inventory`.',
        'Includes inherited fields. A date, event timestamp, interval link or revision is not evidence of complete bitemporal support.',
        'This table inventories structural coverage, not business completeness. See [the temporal contract](temporal-contract.md) for the shared history semantics and closure evidence.', '',
        '| Module | Classes | Business date/time fields present | Linked time definitions present |',
        '|---|---:|---:|---:|']
    for module in sorted({r['module'] for r in rows}):
        subset = [r for r in rows if r['module'] == module]
        lines.append(f"| {module} | {len(subset)} | {sum(bool(r['timeFields']) for r in subset)} | {sum(bool(r['intervalLinks']) for r in subset)} |")
    lines += ['', '| Class | Module | Temporal policy | Business date/time fields | Linked intervals / recurrences | Record metadata |', '|---|---|---|---|---|---|']
    for r in rows:
        lines.append('| ' + ' | '.join([r['class'], r['module'], r['policy'], ', '.join(r['timeFields']) or '—', ', '.join(r['intervalLinks']) or '—', ', '.join(r['recordProvenance']) or '—']) + ' |')
    return '\n'.join(lines) + '\n'


def clone_record(graph, original, suffix):
    node = E[suffix]
    assert not list(graph.predicate_objects(node)), 'Probe identity collision'
    for p, o in list(graph.predicate_objects(original)):
        graph.add((node, p, o))
    graph.set((node, C.canonicalId, Literal(suffix, datatype=XSD.string)))
    return node


def instant(value):
    return Literal(value, datatype=XSD.dateTime)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write-inventory', action='store_true')
    args = parser.parse_args()
    catalog = json.loads((P / 'model/catalog.json').read_text())
    rows = inventory(catalog)
    expected = inventory_markdown(rows)
    inventory_path = P / 'docs/temporal-coverage.md'
    if args.write_inventory:
        inventory_path.write_text(expected)
    checks = [{'test': 'all-class-inventory-current', 'passed': inventory_path.read_text() == expected}]
    reference = Graph().parse(P / 'examples/reference.ttl')
    def observe(name, graph):
        conforms, report, _ = check(graph)
        result = {'scenario': name, 'conforms': bool(conforms),
                  'reportedShapes': sorted({str(s).removeprefix(str(C)) for s in report.objects(None, SH.sourceShape)})}
        print(json.dumps(result), flush=True)
        return result
    baseline = observe('all-class-reference', reference)
    checks.append({'test': 'full-reference-conforms', 'passed': baseline['conforms']})
    bad = reference + Graph()
    bad.set((E.TimeWindow, C.endsAt, instant('2026-09-25T09:00:00Z')))
    control = observe('reversed-window-control', bad)
    checks.append({'test': 'reversed-window-is-rejected-by-B076', 'passed': not control['conforms'] and 'B076' in control['reportedShapes']})
    # Boundary queries use the actual B027 body and immutable reference ontology.
    rule = next(r for r in json.loads((P / 'model/rules.json').read_text()) if r['id'] == 'B027')
    for name, time, rejected in [('start-inclusive', '2026-09-25T10:00:00Z', False),
                                 ('end-exclusive', '2026-09-25T11:00:00Z', True),
                                 ('equivalent-offset', '2026-09-25T12:00:00+02:00', False)]:
        g = ontology()
        g.add((E.test, C.selectedTariff, E.testTariff))
        g.add((E.test, C.startedAt, instant(time)))
        g.add((E.testTariff, C.validFrom, instant('2026-09-25T10:00:00Z')))
        g.add((E.testTariff, C.validUntil, instant('2026-09-25T11:00:00Z')))
        checks.append({'test': name, 'passed': bool(list(g.query(rule['query'], initBindings={'this': E.test}))) == rejected})
    observations = []
    g = reference + Graph()
    window = clone_record(g, E.TimeWindow, 'AuditOutsideSession')
    g.set((E.ChargingInterval, C.interval, window))
    g.set((window, C.startsAt, instant('2026-09-26T10:00:00Z')))
    g.set((window, C.endsAt, instant('2026-09-26T11:00:00Z')))
    observations.append(observe('charging-interval-outside-completed-session', g))
    g = reference + Graph()
    g.set((E.ServiceAgreement, C.agreementState, C.agreementState_Active))
    g.set((E.AgreementLifecycleEvent, C.agreementAction, C.agreementAction_Accept))
    g.set((E.ServiceAgreement, C.validUntil, instant('2026-09-26T00:00:00Z')))
    g.set((E.ServiceEntitlement, C.entitlementState, C.entitlementState_Active))
    g.set((E.ServiceEntitlement, C.validUntil, instant('2026-10-26T00:00:00Z')))
    observations.append(observe('entitlement-extends-beyond-agreement', g))
    g = reference + Graph()
    g.set((E.ReimbursementPolicy, C.validFromDate, Literal('2026-02-30', datatype=XSD.string)))
    observations.append(observe('impossible-calendar-date', g))
    g = reference + Graph()
    g.set((E.PriceComponent, C.unitPrice, Literal('0.41', datatype=XSD.decimal)))
    observations.append(observe('changed-nested-price-with-same-version-and-digest', g))
    g = reference + Graph()
    new = clone_record(g, E.TariffVersion, 'AuditSecondTariffVersion')
    component = clone_record(g, E.PriceComponent, 'AuditSecondComponent')
    g.set((new, C.versionTag, Literal('2', datatype=XSD.string)))
    g.set((new, C.priceComponent, component))
    g.set((component, C.unitPrice, Literal('0.45', datatype=XSD.decimal)))
    assignment = clone_record(g, E.TariffAssignment, 'AuditSecondAssignment')
    g.set((assignment, C.assignedTariff, new))
    g.set((assignment, C.priority, Literal(99, datatype=XSD.integer)))
    g.add((E.TariffSet, C.tariffAssignment, assignment))
    observations.append(observe('two-effective-versions-of-same-tariff', g))
    expected_shapes = ['B173','B114','B175','DigestIntegrity','B174']
    for observation,shape in zip(observations,expected_shapes):
        checks.append({'test':observation['scenario'], 'passed':not observation['conforms'] and shape in observation['reportedShapes'], 'expectedShape':shape})
    result = {
        'commit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=P, text=True).strip(),
        'schemaSHA256': hashlib.sha256((P / 'model/domain.schema').read_bytes()).hexdigest(),
        'scope': 'Structural inventory of all classes, five full-graph regression rejections and six inventory/boundary controls. Temporal writer behavior has its own acceptance gate.',
        'passed': sum(c['passed'] for c in checks), 'total': len(checks), 'checks': checks,
        'classCount': len(rows), 'moduleCount': len({r['module'] for r in rows}),
        'classesWithBusinessTimeFields': sum(bool(r['timeFields']) for r in rows),
        'classesWithLinkedTimeDefinitions': sum(bool(r['intervalLinks']) for r in rows),
        'observations': observations, 'inventory': rows,
    }
    (P / 'reports/temporal-audit.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({k: v for k, v in result.items() if k not in ('inventory', 'observations', 'checks')}))
    return 0 if all(c['passed'] for c in checks) else 1


if __name__ == '__main__':
    sys.exit(main())
