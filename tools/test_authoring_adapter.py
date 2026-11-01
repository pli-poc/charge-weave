"""Tests for bounded, source-preserving schema commands."""
import unittest

from authoring_adapter import apply_commands


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


if __name__ == '__main__':
    unittest.main()
