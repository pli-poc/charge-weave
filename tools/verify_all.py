"""Run every release gate; stop immediately if any gate fails."""
from pathlib import Path
import subprocess,sys
P=Path(__file__).resolve().parent
for args in [['validate.py','--meta'],['test_business.py'],['test_boundaries.py'],['test_trust_boundary.py'],['check_owl.py'],['check_release.py'],['check_audit.py'],['test_business_acceptance.py'],['test_lifecycle.py'],['check_naming.py'],['audit_temporal.py']]:
 subprocess.run([sys.executable,str(P/args[0]),*args[1:]],check=True)
for family in ('closure','charge','credit','offline','reimbursement','privacy','energy','migration','asset','allowance','access','settlement','process'):
 subprocess.run([sys.executable,str(P/'test_journey_snapshots.py'),'--family',family],check=True)
for family in ('access','credit','allowance','dunning','history','hold'):
 subprocess.run([sys.executable,str(P/'test_adversarial.py'),'--family',family],check=True)
print('All release gates passed.')
