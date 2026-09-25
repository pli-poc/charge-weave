"""Rebuild in isolation and compare all generated outputs, using RDF isomorphism."""
from pathlib import Path
import json
import os
import shutil
import subprocess
import sys
import tempfile

from rdflib import Graph
from rdf_equal import equivalent

ROOT = Path(__file__).resolve().parents[1]
GENERATED_DIRS = ('ontology', 'validation', 'queries', 'examples')
GENERATED_FILES = (
    'model/catalog.json', 'model/property-types.json', 'model/rules.json',
    'model/transitions.json', 'model/competency-questions.json',
    'benchmark/resource-coverage.json', 'benchmark/endpoint-coverage.json',
    'benchmark/event-catalog.json', 'benchmark/capture.json',
    'benchmark/pricing-field-crosswalk.json', 'docs/domain-dictionary.md',
    'docs/validation-rules.md', 'docs/external-platform-resource-crosswalk.md',
    'docs/external-platform-endpoint-crosswalk.md', 'docs/pricing-field-crosswalk.md',
    'docs/competency-questions.md', 'docs/business-requirements.md',
    'docs/actor-journeys.md', 'docs/business-research-sources.md', 'tests/journey-snapshots.json', 'tests/completion-scenarios.json', 'docs/completion-review.md',
)
FORMATS = {'.ttl': 'turtle', '.owl': 'xml', '.jsonld': 'json-ld'}


def generated_paths(root):
    return {str(p.relative_to(root)) for name in GENERATED_DIRS
            for p in (root / name).rglob('*') if p.is_file()} | set(GENERATED_FILES)


def main():
    results = []
    with tempfile.TemporaryDirectory(prefix='chargeweave-build-') as directory:
        rebuilt = Path(directory)
        # Only source inputs: stale generated files cannot survive in this build.
        for name in ('tools', 'model', 'benchmark', 'requirements', 'tests'):
            shutil.copytree(ROOT / name, rebuilt / name,
                            ignore=shutil.ignore_patterns('__pycache__', '*.pyc'))
        for name in GENERATED_DIRS + ('docs', 'reports'):
            (rebuilt / name).mkdir(parents=True, exist_ok=True)
        (rebuilt / 'ontology/modules').mkdir()
        for name in GENERATED_FILES:
            (rebuilt / name).unlink(missing_ok=True)
        env = dict(os.environ, PYTHONHASHSEED='1971')
        subprocess.run([sys.executable, str(rebuilt / 'tools/build_all.py')],
                       check=True, env=env)
        paths = sorted(generated_paths(ROOT) | generated_paths(rebuilt)
                       | {'model/domain.schema'})
        for relative in paths:
            original, generated = ROOT / relative, rebuilt / relative
            detail = None
            try:
                if not original.is_file() or not generated.is_file():
                    passed, detail = False, 'Missing committed or generated file'
                elif original.suffix in FORMATS:
                    fmt = FORMATS[original.suffix]
                    passed = equivalent(Graph().parse(original, format=fmt),
                                        Graph().parse(generated, format=fmt))
                elif original.suffix == '.json':
                    passed = json.loads(original.read_text()) == json.loads(generated.read_text())
                else:
                    passed = original.read_bytes() == generated.read_bytes()
            except Exception as exc:
                passed, detail = False, str(exc)
            results.append({'file': relative, 'passed': passed, 'detail': detail})
            if not passed:
                print('DRIFT:', relative, detail or 'content differs', flush=True)
    report = {'passed': sum(r['passed'] for r in results), 'total': len(results),
              'checks': results}
    (ROOT / 'reports').mkdir(exist_ok=True)
    (ROOT / 'reports/generated-checks.json').write_text(json.dumps(report, indent=2))
    print(f"Generated outputs: {report['passed']}/{report['total']} match", flush=True)
    return 0 if all(r['passed'] for r in results) else 1


if __name__ == '__main__':
    sys.exit(main())
