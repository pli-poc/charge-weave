"""Validate a complete authorized RDF snapshot; nonzero exit means nonconformance."""
from runtime import *
import argparse,sys
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('data',nargs='?',default=str(P/'examples/reference.ttl'));parser.add_argument('--meta',action='store_true');args=parser.parse_args()
data=Graph().parse(args.data);ok,report,report_text=check(data,args.meta)
(P/'reports/validation.ttl').write_text(report.serialize(format='turtle'));(P/'reports/validation.txt').write_text(report_text)
print(report_text if not ok else 'Conforms: true');sys.exit(0 if ok else 1)
