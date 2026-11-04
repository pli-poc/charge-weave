"""Check portable text comparison without hiding semantic changes."""
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from check_generated import read_generated_text
import temporal_integrity


class GeneratedTextTests(unittest.TestCase):
    def test_platform_newlines_are_normalized_but_content_changes_remain(self):
        with tempfile.TemporaryDirectory() as directory:
            left, right = Path(directory) / 'left', Path(directory) / 'right'
            left.write_bytes(b'first\nsecond\n')
            right.write_bytes(b'first\r\nsecond\r\n')
            self.assertEqual(read_generated_text(left), read_generated_text(right))
            right.write_bytes(b'first\r\nchanged\r\n')
            self.assertNotEqual(read_generated_text(left), read_generated_text(right))

    def test_temporal_contract_includes_parser_and_normalizes_newlines(self):
        names = ['model/domain.schema', 'model/audit-rules.json', 'model/lifecycle-policies.json',
                 'model/temporal-policy.json', 'model/temporal-queries.json', 'tools/build.py',
                 'tools/domain_schema.py', 'tools/build_rules.py', 'tools/temporal_integrity.py',
                 'tools/temporal_store.py', 'tools/runtime.py', 'requirements.txt']
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for name in names:
                path = root / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(b'one\ntwo\n')
            with patch.object(temporal_integrity, 'P', root):
                original = temporal_integrity.contract_digest()
                (root / 'tools/domain_schema.py').write_bytes(b'one\r\ntwo\r\n')
                self.assertEqual(original, temporal_integrity.contract_digest())
                (root / 'tools/domain_schema.py').write_bytes(b'changed\n')
                self.assertNotEqual(original, temporal_integrity.contract_digest())


if __name__ == '__main__':
    unittest.main()
