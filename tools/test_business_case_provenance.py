"""Ensure generated draft cases cannot satisfy independent acceptance coverage."""
import unittest

from business_case_provenance import has_independent_rule_coverage, independent_cases


class BusinessCaseProvenanceTests(unittest.TestCase):
    def test_template_cases_do_not_supply_independent_positive_or_negative_coverage(self):
        cases = [
            {'requirement': 'BR-1', 'rule': 'B900', 'expectedConformance': True, 'provenance': 'template-derived'},
            {'requirement': 'BR-1', 'rule': 'B900', 'expectedConformance': False, 'provenance': 'template-derived'},
            {'requirement': 'BR-2', 'rule': 'B900', 'expectedConformance': True},
        ]
        self.assertEqual(independent_cases(cases, 'BR-1'), [])
        self.assertFalse(has_independent_rule_coverage(cases, 'BR-1', 'B900'))
        cases.append({'requirement': 'BR-1', 'rule': 'B900', 'expectedConformance': True})
        self.assertEqual({case['expectedConformance'] for case in independent_cases(cases, 'BR-1')}, {True})
        cases.append({'requirement': 'BR-1', 'rule': 'B901', 'expectedConformance': False, 'provenance': 'independent'})
        cases.append({'requirement': 'BR-1', 'rule': 'B900', 'expectedConformance': 0, 'provenance': 'independent'})
        self.assertFalse(has_independent_rule_coverage(cases, 'BR-1', 'B900'))
        cases.append({'requirement': 'BR-1', 'rule': 'B900', 'expectedConformance': False, 'provenance': 'independent'})
        self.assertEqual({case['expectedConformance'] for case in independent_cases(cases, 'BR-1')}, {True, False})
        self.assertTrue(has_independent_rule_coverage(cases, 'BR-1', 'B900'))


if __name__ == '__main__':
    unittest.main()
