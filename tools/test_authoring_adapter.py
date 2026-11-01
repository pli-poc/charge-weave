"""Tests for bounded, source-preserving schema commands."""
import unittest
import subprocess
import sys
import tempfile
from pathlib import Path
from shutil import copy2

from rdflib import Graph, Namespace, RDF
from pyshacl import validate

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

    def test_update_requires_exact_declared_field_and_preserves_other_spacing(self):
        schema = 'MODULE|foundation\nRecord|root|A record.|name:string?  count:integer!\n'
        command = {'type': 'property.update', 'owner': 'Record', 'name': 'name', 'expectedRange': 'string', 'expectedCardinality': '?', 'range': 'string', 'cardinality': '!'}
        self.assertEqual(apply_commands(schema, [command]), schema.replace('name:string?', 'name:string!'))
        with self.assertRaisesRegex(ValueError, 'precondition'):
            apply_commands(schema, [{**command, 'expectedCardinality': '!'}])
        with self.assertRaisesRegex(ValueError, 'precondition'):
            apply_commands(schema, [{**command, 'name': 'missing'}])

    def test_update_rejects_incompatible_shared_property_ranges(self):
        schema = 'MODULE|foundation\nRecord|root|A record.|value:string?\nExample|Record|An example.|value:string!\n'
        command = {'type': 'property.update', 'owner': 'Example', 'name': 'value', 'expectedRange': 'string', 'expectedCardinality': '!', 'range': 'integer', 'cardinality': '!'}
        with self.assertRaisesRegex(ValueError, 'ranges must agree'):
            apply_commands(schema, [command])
        with self.assertRaisesRegex(ValueError, 'shared property contract'):
            apply_commands(schema, [{**command, 'range': 'Record'}])

    def test_update_can_change_object_range_and_rejects_ambiguous_fields(self):
        schema = 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|related:Record?\n'
        command = {'type': 'property.update', 'owner': 'Device', 'name': 'related', 'expectedRange': 'Record', 'expectedCardinality': '?', 'range': 'Device', 'cardinality': '*'}
        self.assertIn('related:Device*', apply_commands(schema, [command]))
        with self.assertRaisesRegex(ValueError, 'precondition'):
            apply_commands(schema.replace('related:Record?', 'related:Record? related:Device*'), [command])

    def test_templates_compile_to_non_vacuous_structural_checks(self):
        schema = 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|related:Record? state:{Draft,Final,Archived}?\n'
        commands = [
            {'type': 'constraint.add', 'template': 'required-relationship', 'owner': 'Device', 'name': 'related', 'expectedRange': 'Record', 'expectedCardinality': '?'},
            {'type': 'constraint.add', 'template': 'allowed-values', 'owner': 'Device', 'name': 'state', 'expectedRange': '{Draft,Final,Archived}', 'expectedCardinality': '?', 'values': ['Draft', 'Final']},
        ]
        candidate = apply_commands(schema, commands)
        self.assertIn('related:Record! state:{Draft,Final}?', candidate)
        with self.assertRaisesRegex(ValueError, 'Invalid allowed-values'):
            apply_commands(schema, [{**commands[1], 'values': ['Draft', 'Unknown']}])
        with self.assertRaisesRegex(ValueError, 'Invalid required-relationship'):
            apply_commands(schema, [{**commands[0], 'expectedRange': 'string'}])
        with tempfile.TemporaryDirectory(prefix='chargeweave-template-test-') as temporary:
            root = Path(temporary)
            for name in ['tools', 'model', 'ontology/modules', 'validation', 'docs']:
                (root / name).mkdir(parents=True, exist_ok=True)
            for name in ['build.py', 'domain_schema.py']:
                copy2(Path(__file__).parent / name, root / 'tools' / name)
            (root / 'model/domain.schema').write_text(candidate, encoding='utf8')
            subprocess.run([sys.executable, str(root / 'tools/build.py')], check=True, capture_output=True)
            shapes = Graph().parse(root / 'validation/structure.shacl.ttl')
            cd = Namespace('https://example.org/charge-domain#')
            ex = Namespace('https://example.org/test/')
            sh = Namespace('http://www.w3.org/ns/shacl#')
            valid = Graph()
            valid.add((ex.device, RDF.type, cd.Device)); valid.add((ex.target, RDF.type, cd.Record))
            valid.add((cd.state_Draft, RDF.type, cd.StateCode)); valid.add((cd.state_Archived, RDF.type, cd.StateCode))
            valid.add((ex.device, cd.related, ex.target)); valid.add((ex.device, cd.state, cd.state_Draft))
            self.assertTrue(validate(valid, shacl_graph=shapes)[0])
            missing = valid + Graph(); missing.remove((ex.device, cd.related, ex.target))
            conforms, report, _ = validate(missing, shacl_graph=shapes)
            self.assertFalse(conforms); self.assertIn(cd.Device_relatedShape, set(report.objects(None, sh.sourceShape)))
            disallowed = valid + Graph(); disallowed.set((ex.device, cd.state, cd.state_Archived))
            conforms, report, _ = validate(disallowed, shacl_graph=shapes)
            self.assertFalse(conforms); self.assertIn(cd.Device_stateShape, set(report.objects(None, sh.sourceShape)))


if __name__ == '__main__':
    unittest.main()
