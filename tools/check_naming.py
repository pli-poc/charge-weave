"""Prevent the removed third-party name from reappearing in current source files."""
from pathlib import Path
import hashlib, json, re, sys
from project_files import project_files
P = Path(__file__).resolve().parents[1]
REMOVED_FINGERPRINT = "09d5045b73814d2e10f21fd2e7701b3dd68eba6a70cd952febe7f2dbd8477394"
rows = []
for path in project_files(P):
    relative = str(path.relative_to(P))
    words = set(re.findall(rb'[a-z]+', relative.lower().encode() + b' ' + path.read_bytes().lower()))
    found = any(hashlib.sha256(word[i:i+6]).hexdigest() == REMOVED_FINGERPRINT
                for word in words for i in range(len(word)-5))
    rows.append({'file':relative,'passed':not found})
result = {'passed':sum(r['passed'] for r in rows),'total':len(rows),'checks':rows}
(P/'reports').mkdir(exist_ok=True)
(P/'reports/naming-checks.json').write_text(json.dumps(result,indent=2))
print({k:v for k,v in result.items() if k != 'checks'})
for row in rows:
    if not row['passed']:print(row)
sys.exit(0 if all(r['passed'] for r in rows) else 1)
