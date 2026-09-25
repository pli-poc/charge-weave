"""Exact RDF graph isomorphism using joint color refinement and checked bijections.

The generic RDFLib canonicalizer is costly on repeated OWL RDF-list structures.
This comparator pins all non-blank RDF terms and individualizes only unresolved
blank-node color classes. The final check compares every mapped triple exactly.
"""
from rdflib import BNode
from collections import Counter,defaultdict

def equivalent(a,b):
 if len(a)!=len(b):return False
 def ground(g):return {t for t in g if not isinstance(t[0],BNode) and not isinstance(t[2],BNode)}
 if ground(a)!=ground(b):return False
 ns=[sorted({n for t in g for n in (t[0],t[2]) if isinstance(n,BNode)},key=str) for g in (a,b)]
 if len(ns[0])!=len(ns[1]):return False
 if not ns[0]:return True
 adj=[]
 for g,nodes in zip((a,b),ns):
  edges={n:[] for n in nodes}
  for s,p,o in g:
   if isinstance(s,BNode):edges[s].append(('out',p.n3(),o))
   if isinstance(o,BNode):edges[o].append(('in',p.n3(),s))
  adj.append(edges)
 def refine(colors):
  while True:
   signatures=[]
   for side in range(2):
    sig={}
    for n in ns[side]:
     neighbors=tuple(sorted((direction,p,('b',str(colors[side][v])) if isinstance(v,BNode) else ('v',v.n3())) for direction,p,v in adj[side][n]))
     sig[n]=(colors[side][n],neighbors)
    signatures.append(sig)
   palette={v:i for i,v in enumerate(sorted(set(signatures[0].values())|set(signatures[1].values())))}
   new=[{n:palette[v] for n,v in sig.items()} for sig in signatures]
   if Counter(new[0].values())!=Counter(new[1].values()):return None
   stable=len(set(new[0].values()))==len(set(colors[0].values()))
   colors=new
   if stable:return colors
 def match(colors):
  colors=refine(colors)
  if colors is None:return False
  groups=[]
  for side in range(2):
   group=defaultdict(list)
   for n,color in colors[side].items():group[color].append(n)
   groups.append(group)
  ambiguous=[c for c,v in groups[0].items() if len(v)>1]
  if not ambiguous:
   mapping={nodes[0]:groups[1][c][0] for c,nodes in groups[0].items()}
   mapped={(mapping.get(s,s),p,mapping.get(o,o)) for s,p,o in a}
   return mapped==set(b)
  chosen=min(ambiguous,key=lambda c:len(groups[0][c]));left=groups[0][chosen][0];fresh=max(colors[0].values())+1
  for right in groups[1][chosen]:
   trial=[dict(colors[0]),dict(colors[1])];trial[0][left]=fresh;trial[1][right]=fresh
   if match(trial):return True
  return False
 return match([{n:0 for n in nodes} for nodes in ns])
