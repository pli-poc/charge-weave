"""Reproduce the release from committed model and benchmark inputs, offline."""
from pathlib import Path
import subprocess,sys
P=Path(__file__).resolve().parent
for script in ['extend_model.py','build.py','build_rules.py','build_benchmark.py','build_pricing_audit.py','build_examples.py','build_journey_snapshots.py','build_completion_scenarios.py','build_queries.py','build_audit_docs.py','build_completion_docs.py','build_release.py']:
 subprocess.run([sys.executable,str(P/script)],check=True)
