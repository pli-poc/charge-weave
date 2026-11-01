"""Keep template-derived cases distinct from independent business evidence."""


def provenance(case):
    return case.get('provenance', 'independent')


def independent_cases(cases, requirement_id):
    return [case for case in cases if case['requirement'] == requirement_id and provenance(case) == 'independent']


def has_independent_rule_coverage(cases, requirement_id, rule_id):
    return {case['expectedConformance'] for case in independent_cases(cases, requirement_id) if case['rule'] == rule_id and type(case.get('expectedConformance')) is bool} == {True, False}
