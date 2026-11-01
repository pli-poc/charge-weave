"""Regression tests for the reusable domain schema parser."""
import json
import unittest
from pathlib import Path

from domain_schema import parse_schema

ROOT = Path(__file__).resolve().parents[1]
DATATYPES = {'string', 'langString', 'integer', 'nonNegativeInteger', 'positiveInteger', 'decimal', 'boolean', 'dateTime', 'date', 'time', 'anyURI'}


class DomainSchemaTests(unittest.TestCase):
    def test_real_schema_matches_generated_catalogue(self):
        classes, _, _, _ = parse_schema((ROOT / 'model/domain.schema').read_text(encoding='utf8'), DATATYPES)
        self.assertEqual(classes, json.loads((ROOT / 'model/catalog.json').read_text(encoding='utf8')))

    def test_duplicate_and_unknown_target_are_rejected(self):
        with self.assertRaises(AssertionError):
            parse_schema('MODULE|m\nRecord|root|A.|\nRecord|root|B.|\n', DATATYPES)
        with self.assertRaises(AssertionError):
            parse_schema('MODULE|m\nRecord|root|A.|target:Missing!\n', DATATYPES)

    def test_descriptions_must_reference_a_unique_declared_field(self):
        schema = 'MODULE|m\nRecord|root|A.|target:Record?\n# FIELD-DESCRIPTION|Record|target|An explicit relation.\n'
        classes, _, _, _ = parse_schema(schema, DATATYPES)
        self.assertEqual(classes['Record']['fields'][0]['description'], 'An explicit relation.')
        with self.assertRaises(AssertionError):
            parse_schema(schema + '# FIELD-DESCRIPTION|Record|target|Duplicate.\n', DATATYPES)
        with self.assertRaises(AssertionError):
            parse_schema(schema.replace('|target|An explicit', '|missing|An explicit'), DATATYPES)


if __name__ == '__main__':
    unittest.main()
