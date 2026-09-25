# Release verification — 1.0.0

Completed 25 September 2026.

| Gate | Result |
|---|---|
| Full reference graph and SHACL meta-validation | Conforms |
| Deliberate business-rule violations | 109 / 109 passed |
| Allowed boundaries and malformed structural values | 50 / 50 passed |
| Trusted vocabulary and input guards | 7 / 7 passed |
| Coverage, examples, formats and query checks | 608 / 608 passed |
| HermiT: schema | Consistent; no unsatisfiable named classes |
| HermiT: schema plus reference graph | Consistent; no unsatisfiable named classes |
| Turtle, RDF/XML and JSON-LD | Exact RDF graph equivalence verified |

There are 166 targeted tests in addition to the 608 release checks. The reference graph contains 2,306 triples and explicitly instantiates all 234 non-abstract domain classes. The 24 competency queries return results on it. All 109 diagnostic queries produce no violations when evaluated for their applicable focus nodes.

The final model contains 235 domain classes, 937 domain properties, 172 controlled code schemes and 18 modules. The AMPECO audit maps 83 resource families and 651 distinct operation pages. The raw navigation had 652 candidate entries; one was a linked OAuth heading. All 62 inspected pricing/discount fields have semantic mappings.

These results establish the tested ontology and snapshot contracts. They do not certify field-level AMPECO parity, protocol interoperability, pricing-equation equivalence, private vendor features, load performance or an executable production CPMS. Consult the completeness assessment and validation guide for exact boundaries.
