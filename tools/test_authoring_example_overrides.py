"""Check synthetic all-class fixture overrides and their boundaries."""
import unittest
import json
import subprocess
import sys
import tempfile
from pathlib import Path
from shutil import copytree, ignore_patterns

from rdflib import Graph, Literal, Namespace, RDF, XSD

from authoring_example_overrides import apply_overrides


class ExampleOverridesTests(unittest.TestCase):
    def setUp(self):
        self.cd = Namespace('https://example.org/charge-domain#')
        self.ex = Namespace('https://example.org/test/')
        self.catalog = {
            'Record': {'parent': None, 'fields': []},
            'Window': {'parent': 'Record', 'fields': [{'property': 'startsAt', 'range': 'dateTime'}, {'property': 'name', 'range': 'string'}]},
            'ChildWindow': {'parent': 'Window', 'fields': []},
        }
        self.node = lambda name: self.ex[name]

    def test_applies_to_owner_and_subclass_without_changing_others(self):
        graph = Graph()
        apply_overrides(graph, self.catalog, {'Window': {'startsAt': '2026-09-25T10:00:00Z'}}, self.cd, self.node)
        expected = Literal('2026-09-25T10:00:00Z', datatype=XSD.dateTime)
        self.assertEqual(graph.value(self.ex.Window, self.cd.startsAt), expected)
        self.assertEqual(graph.value(self.ex.ChildWindow, self.cd.startsAt), expected)
        self.assertIsNone(graph.value(self.ex.Record, self.cd.startsAt))

    def test_rejects_unknown_fields_bad_dates_and_conflicting_inheritance(self):
        for data in [
            {'Missing': {'startsAt': '2026-09-25T10:00:00Z'}},
            {'Window': {'name': '2026-09-25T10:00:00Z'}},
            {'Window': {'startsAt': '2026-02-30T10:00:00Z'}},
            {'Window': {'startsAt': '2026-09-25T10:00:00+00:00'}},
            {'Window': {'startsAt': '2026-09-25T10:00:00Z'}, 'ChildWindow': {'startsAt': '2026-09-25T11:00:00Z'}},
        ]:
            with self.subTest(data=data), self.assertRaises(ValueError):
                apply_overrides(Graph(), self.catalog, data, self.cd, self.node)

    def test_real_example_generator_applies_override_and_keeps_all_classes(self):
        repository = Path(__file__).resolve().parents[1]
        with tempfile.TemporaryDirectory(prefix='chargeweave-example-override-') as temporary:
            root = Path(temporary)
            for name in ['tools', 'model', 'ontology']:
                copytree(repository / name, root / name, ignore=ignore_patterns('__pycache__', '*.pyc'))
            (root / 'examples').mkdir()
            override = {'TimeWindow': {'startsAt': '2026-09-25T10:30:00Z'}}
            (root / 'model/authoring-example-overrides.json').write_text(json.dumps(override), encoding='utf8')
            process = subprocess.run([sys.executable, str(root / 'tools/build_examples.py')], capture_output=True, text=True)
            self.assertEqual(process.returncode, 0, process.stderr)
            result = Graph().parse(root / 'examples/reference.ttl')
            reference = Namespace('https://example.org/reference/')
            self.assertEqual(result.value(reference.TimeWindow, self.cd.startsAt), Literal('2026-09-25T10:30:00Z', datatype=XSD.dateTime))
            catalog = json.loads((root / 'model/catalog.json').read_text(encoding='utf8'))
            missing = [name for name in catalog if name != 'Record' and (reference[name], RDF.type, self.cd[name]) not in result]
            self.assertEqual(missing, [])


if __name__ == '__main__':
    unittest.main()
