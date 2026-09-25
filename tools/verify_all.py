"""Run every release gate; stop immediately if any gate fails."""
from pathlib import Path
import subprocess,sys
P=Path(__file__).resolve().parent
for args in [['validate.py','--meta'],['test_business.py'],['test_boundaries.py'],['test_trust_boundary.py'],['check_owl.py'],['check_release.py']]:
 subprocess.run([sys.executable,str(P/args[0]),*args[1:]],check=True)
print('All release gates passed.')
