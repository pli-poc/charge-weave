"""Package committed artifacts only after all fresh CI/local gate reports pass."""
from datetime import datetime, timezone
from pathlib import Path
import hashlib
import importlib.metadata
import json
import os
import platform
import subprocess
import sys
import zipfile

from rdflib import Graph, Literal, Namespace, RDF
from project_files import project_files

ROOT = Path(__file__).resolve().parents[1]
COUNTED_REPORTS = ('generated-checks.json', 'business-tests.json', 'boundary-tests.json',
                   'trust-boundary-tests.json', 'release-checks.json',
                   'business-acceptance.json', 'business-traceability.json',
                   'lifecycle-tests.json', 'naming-checks.json') + tuple(
    'journey-' + family + '.json' for family in
    ('closure', 'charge', 'credit', 'offline', 'reimbursement', 'privacy', 'energy',
     'migration', 'asset', 'allowance', 'access', 'settlement', 'process'))
COUNTED_REPORTS += tuple('adversarial-' + family + '.json' for family in
                         ('access','credit','allowance','dunning','history','hold'))
REPORTS = COUNTED_REPORTS + ('owl-consistency.json', 'validation.ttl', 'validation.txt')


def check_reports(directory):
    for name in REPORTS:
        if not (directory / name).is_file():
            raise ValueError(f'Missing gate report: {name}; run all verification gates first.')
    for name in COUNTED_REPORTS:
        result = json.loads((directory / name).read_text())
        rows = result.get('tests', result.get('checks', []))
        if not (result['total'] > 0 and result['passed'] == result['total']
                and len(rows) == result['total'] and all(r['passed'] is True for r in rows)):
            raise ValueError(f'Failed or incomplete gate report: {name}')
    owl = json.loads((directory / 'owl-consistency.json').read_text())
    runs = owl['runs']
    if (len(runs) != 2 or {r['scope'] for r in runs} != {'schema', 'schema-and-example'}
            or not all(r['consistent'] is True and r.get('unsatisfiableClasses') == [] for r in runs)):
        raise ValueError('OWL consistency/satisfiability gates did not both pass')
    sh = Namespace('http://www.w3.org/ns/shacl#')
    graph = Graph().parse(directory / 'validation.ttl')
    nodes = list(graph.subjects(RDF.type, sh.ValidationReport))
    if len(nodes) != 1 or set(graph.objects(nodes[0], sh.conforms)) != {Literal(True)}:
        raise ValueError('Full reference graph did not conform to SHACL')


def main():
    check_reports(ROOT / 'reports')
    commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    dirty = subprocess.check_output(['git', 'status', '--porcelain'], cwd=ROOT, text=True).strip()
    if dirty:
        raise ValueError('Commit all source/generated changes before packaging')
    if os.environ.get('GITHUB_SHA') and commit != os.environ['GITHUB_SHA']:
        raise ValueError('Checkout does not match the GitHub Actions commit')
    files = project_files(ROOT) + [ROOT / 'reports' / name for name in REPORTS]
    manifest = {
        'product': 'ChargeWeave', 'ontologyVersion': '1.1.1', 'commit': commit,
        'createdAt': datetime.now(timezone.utc).isoformat(),
        'workflowRun': os.environ.get('GITHUB_RUN_ID'),
        'workflowAttempt': os.environ.get('GITHUB_RUN_ATTEMPT'),
        'python': platform.python_version(),
        'dependencies': {name: importlib.metadata.version(name)
                         for name in ('rdflib', 'pyshacl', 'owlready2')},
        'evidenceBoundary': 'Declared CPMS business profile has traceable semantic contracts and model-level acceptance evidence; runtime integration, operational behavior and jurisdiction-specific certification are separate gates.',
        'files': {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest()
                  for p in files},
    }
    (ROOT / 'dist').mkdir(exist_ok=True)
    destination = ROOT / 'dist' / f'ChargeWeave-{commit[:12]}.zip'
    with zipfile.ZipFile(destination, 'w', zipfile.ZIP_DEFLATED) as archive:
        for path in files:
            archive.write(path, str(path.relative_to(ROOT)))
        archive.writestr('reports/build-provenance.json', json.dumps(manifest, indent=2))
    digest = hashlib.sha256(destination.read_bytes()).hexdigest()
    destination.with_suffix('.zip.sha256').write_text(f'{digest}  {destination.name}\n')
    print(f'Packaged {len(files)} files: {destination.name}')


if __name__ == '__main__':
    try:
        main()
    except (ValueError, KeyError) as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)
