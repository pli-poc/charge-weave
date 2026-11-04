"""Run every release gate; stop immediately if any gate fails."""
from pathlib import Path
import json,subprocess,sys
P=Path(__file__).resolve().parent

def release_gates():
 gates=[['validate.py','--meta'],['test_business.py'],['test_boundaries.py'],['test_trust_boundary.py'],['check_owl.py'],['check_release.py'],['test_analytics.py'],['check_audit.py'],['test_business_acceptance.py'],['test_lifecycle.py'],['check_naming.py'],['audit_temporal.py'],['test_temporal.py'],['test_xflow.py']]
 gates += [['test_journey_snapshots.py','--family',family] for family in ('closure','charge','credit','offline','reimbursement','privacy','energy','migration','asset','allowance','access','settlement','process')]
 gates += [['test_adversarial.py','--family',family] for family in ('access','credit','allowance','dunning','history','hold')]
 return gates

if __name__ == '__main__':
 if sys.argv[1:] == ['--list-json']:
  print(json.dumps(release_gates()))
 elif sys.argv[1:]:
  raise SystemExit('Unsupported arguments')
 else:
  for args in release_gates():subprocess.run([sys.executable,str(P/args[0]),*args[1:]],check=True)
  print('All release gates passed.')
