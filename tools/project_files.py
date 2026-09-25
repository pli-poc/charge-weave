"""Allowlisted project files: excludes environments, Git internals and run reports."""
from pathlib import Path

DIRECTORIES = ('benchmark', 'docs', 'evidence', 'examples', 'model', 'ontology',
               'queries', 'requirements', 'tests', 'tools', 'validation', '.github')
ROOT_FILES = ('README.md', 'AGENTS.md', 'WORK_STATUS.md', 'CONTRIBUTING.md', 'CHANGELOG.md',
              'Makefile', 'requirements.txt', 'requirements-ci.txt',
              '.gitignore', '.gitattributes')


def project_files(root: Path):
    files = [root / name for name in ROOT_FILES if (root / name).is_file()]
    for name in DIRECTORIES:
        files.extend(p for p in (root / name).rglob('*')
                     if p.is_file() and not p.is_symlink()
                     and '__pycache__' not in p.parts
                     and p.suffix not in {'.pyc', '.pyo'})
    return sorted(files)
