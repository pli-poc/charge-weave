"""Tests for bounded, source-preserving schema commands."""
import unittest

from authoring_adapter import apply_commands, inspect_entity


class AuthoringAdapterTests(unittest.TestCase):
    def setUp(self):
        self.schema = '# retained comment\nMODULE|foundation\nRecord|root|A record.|\n'

    def test_group_adds_class_and_controlled_field(self):
        commands = [
            {'type': 'class.add', 'name': 'Example', 'module': 'foundation', 'parent': 'Record', 'definition': 'An example.'},
            {'type': 'property.add', 'owner': 'Example', 'name': 'exampleState', 'range': '{Draft,Final}', 'cardinality': '!'},
        ]
        candidate = apply_commands(self.schema, commands)
        self.assertIn('# retained comment\nMODULE|foundation\nRecord|root|A record.|\n', candidate)
        self.assertIn('Example|Record|An example.|exampleState:{Draft,Final}!', candidate)

    def test_invalid_group_does_not_return_a_partial_candidate(self):
        commands = [
            {'type': 'class.add', 'name': 'Example', 'module': 'foundation', 'parent': 'Record', 'definition': 'An example.'},
            {'type': 'relationship.add', 'owner': 'Example', 'name': 'target', 'range': 'Missing', 'cardinality': '!'},
        ]
        with self.assertRaisesRegex(ValueError, 'Invalid property.add'):
            apply_commands(self.schema, commands)
        self.assertNotIn('Example', self.schema)

    def test_inspection_reports_declared_and_inherited_source(self):
        schema = 'MODULE|foundation\nRecord|root|A record.|recordName:string!\nExample|Record|An example.|count:integer?\n'
        entity = inspect_entity(schema, 'Example')
        self.assertEqual(entity['source'], {'path': 'model/domain.schema', 'line': 3})
        self.assertEqual([(field['property'], field['owner'], field['inherited']) for field in entity['fields']], [('count', 'Example', False), ('recordName', 'Record', True)])
        self.assertEqual(entity['iri'], 'https://example.org/charge-domain#Example')

    def test_inspection_rejects_inheritance_cycles(self):
        schema = 'MODULE|foundation\nFirst|Second|First.|\nSecond|First|Second.|\n'
        with self.assertRaisesRegex(ValueError, 'Invalid inheritance chain'):
            inspect_entity(schema, 'First')


if __name__ == '__main__':
    unittest.main()
