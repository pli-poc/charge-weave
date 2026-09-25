# Validation and verification

## Graph contract

Validate a complete authorized snapshot for the selected tenant, including referenced records needed by the checks. A JSON PATCH payload or a page of API results is not a complete snapshot. First apply a proposed change to the persisted state in a transaction or isolated validation view; then validate. Do not treat absent query results on an incomplete graph as evidence of correctness.

The reference runner loads the complete local ontology and controlled individuals into the validation graph. It does not depend on a triplestore's unspecified inference defaults. Structural shapes include class membership, property counts, datatype, enum membership, numeric ranges, patterns, language tags and IRI requirements. Business constraints are standard SHACL-SPARQL SELECT constraints. `queries/B*.rq` contains standalone diagnostic SELECT queries: returned rows are violations.

The SHACL targets include subclass instances according to SHACL class-target semantics. No OWL reasoning is needed to create missing business facts during validation. Do not use a reasoner to fill in absent mandatory fields and then mistake inferred existence for submitted data.

## Tests

1. The reference graph explicitly instantiates every non-abstract domain class, with inherited contracts. It is synthetic integration data, not realistic production activity or a volume benchmark.
2. `test_business.py` has one deliberate adverse fixture for each of the 109 business rules. Each is run through SHACL-SPARQL and must report its specific source shape. Structural shapes are excluded from these isolated tests so an unrelated missing field cannot hide a broken business rule.
3. `test_boundaries.py` checks meaningful allowed boundary cases and deliberately malformed structural values, including exact monetary equality, aggregate refunds, cross-currency journals, adjacent schedule periods, coupon reversals and inclusive/exclusive dates.
4. `check_owl.py` uses HermiT through Owlready2 on the schema and on schema plus reference data. Consistency and unsatisfiable-class results are retained.
5. `check_release.py` checks exact RDF serialization equivalence, coverage references, structural-shape coverage, query syntax and example competency queries. Diagnostic queries are executed with each applicable focus node bound; this avoids a costly unbound scan in the reference RDFLib engine.

See the current GitHub Actions report artifacts (or locally generated `reports/`) for actual outcomes. Historical pre-import results are kept in `evidence/baseline-v1.0/`. A passed isolated adverse test proves its designed fault is detected, not that every permutation of that rule has been exhaustively proved. The all-class positive graph prevents a ruleset that rejects everything from appearing successful.

## Operational limits

SPARQL checks validate a graph snapshot. They do not provide transaction isolation, lock a wallet, prevent concurrent over-refunds or stop two simultaneous reservation writes. Enforce uniqueness and idempotency in the write store, run financial operations in serializable transactions where required, and revalidate the committed result.

The runner does not perform charger hardware tests, external tax calculation, meter-signature verification, bank settlement confirmation, TLS validation, physical power-flow calculations or timezone database validation. A field such as `signatureVerification_Valid` records the verifier's conclusion; the verifier must actually exist and retain evidence.

Business rules are canonical product policies. Some are deliberately stricter than a permissive vendor API. Vendor payload schemas, deprecation behavior and enum translations require a separately versioned adapter contract. Do not send the canonical graph to an AMPECO endpoint unchanged.

## Change process

Change the source model or rule builder, regenerate, and test. Add a negative test for every new business rule. For business meaning changes, add a non-vacuous allowed boundary test and a migration decision. Publish stable term IRIs, version the ontology document, and preserve historical policy/tariff records. Do not silently repurpose an existing term.

If a constraint requires information not yet available during a lifecycle phase, model that phase explicitly and use conditional rules. Do not relax a finalized-record requirement just to accept partially ingested data.

## Trusted vocabulary boundary

The reference runner rejects instance graphs that redefine controlled terms, command kinds, ontology axioms, SHACL shapes or permitted transitions. Submit only instance data to the validator. Ontology extensions must enter through a reviewed trusted-vocabulary release, not through a customer payload. `test_trust_boundary.py` checks four attempted schema redefinitions, empty and untyped inputs, and confirms that the reference data remains admissible. This guard protects validation meaning; it does not replace application authentication or data-store authorization.
