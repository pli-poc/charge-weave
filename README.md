# ChargeWeave

[![Ontology CI](https://github.com/pli-poc/charge-weave/actions/workflows/ontology-ci.yml/badge.svg)](https://github.com/pli-poc/charge-weave/actions/workflows/ontology-ci.yml)

A modular business ontology for charging management: CPO and eMSP services, public and ad hoc charging, fleet/workplace and home charging, roaming, payments, settlement, energy control and governance.

Version **1.2.0** includes **282 classes in 18 modules, 1,189 properties, 211 controlled code schemes and 184 SHACL-SPARQL business rules**. The independent business review defines **92 requirements, 28 actor roles and 20 journeys**. It closes identified semantic gaps with 42 additional concepts and 63 additional rules. Read the [audit findings and evidence boundary](docs/business-domain-audit.md). A subsequent [adversarial review](docs/adversarial-review.md) found and fixed six cross-record gaps, with 14 additional full-graph regression cases.

Each journey covers contracting, onboarding, operation, change, suspension and termination, with accountability, financial ownership and exceptions. Requirements link to concepts, relationships, structural constraints, business rules and acceptance scenarios. This is a finite, declared CPMS business profile; passing model tests does not establish an implemented or certified production service.

## Temporal modelling status

The [bitemporal contract](docs/temporal-contract.md) defines immutable scoped snapshots, `validAt` / `knownAt` selection, correction/retraction, aggregate integrity, source checkpoints and calendar/stream policies. An executable reference writer and standard SPARQL queries prove the behavior. The viewer exposes the committed fixture and its evidence. Every class has an explicit policy in the [inventory](docs/temporal-coverage.md).

The strict temporal regression gate rejects the demonstrated faults from the [original review](docs/temporal-model-review.md). Production database integration and a native SPARQL-T facade remain separate implementation work.

## Product presentation website

The React product site lives in [`website/`](website/README.md), with a landing overview and dedicated capability, architecture and roadmap pages. Its [ontology explorer](https://pli-poc.github.io/charge-weave/ontology/) exposes the published classes, relationships, OWL/SHACL triples, business rules and temporal definitions without requiring a local ontology tool. The [website workflow](https://github.com/pli-poc/charge-weave/actions/workflows/website-pages.yml) builds and checks desktop/mobile behavior before deploying to GitHub Pages. The website describes the product direction, not a production service.

## Start here

| Purpose | File |
|---|---|
| Audit scope, findings and limitations | [Business-domain audit](docs/business-domain-audit.md) |
| Requirement-to-validation traceability | [Business requirements](docs/business-requirements.md) |
| Actors, journeys and lifecycles | [Actor journeys](docs/actor-journeys.md) |
| Primary sources and design decisions | [Sources](docs/business-research-sources.md), [policies](docs/business-policy-decisions.md) |
| Open in Protégé | `ontology/charge-domain-complete.owl` |
| Load RDF | `ontology/charge-domain-complete.ttl`, `ontology/charge-domain-complete.jsonld` |
| All class contracts | [Domain dictionary](docs/domain-dictionary.md) |
| Business invariants | [Validation rules](docs/validation-rules.md) |
| Semantic and runtime boundaries | [Semantic design](docs/semantic-design.md), [runtime architecture](docs/runtime-architecture.md) |
| Validation and reproducibility | [Validation guide](docs/validation-guide.md), [development](docs/development.md) |
| Current reports and verified package | [GitHub Actions](https://github.com/pli-poc/charge-weave/actions/workflows/ontology-ci.yml) |

## Build and verify

Use Python 3.12 and Java 17:

```bash
python -m pip install -r requirements-ci.txt
python tools/build_all.py
make verify
```

To validate a complete authorized business snapshot:

```bash
python tools/validate.py /absolute/path/to/tenant-snapshot.ttl
```

Exit status 0 means conforming and 1 means rejected. Validation includes structural contracts, controlled vocabularies, business invariants and declared lifecycle policies. Full verification takes several minutes. `make verify` runs every gate; GitHub Actions runs the gates in parallel and packages only after all pass, retaining fresh reports and commit/hash provenance.

The build uses committed sources and does not fetch moving documentation. It never manufactures passing test reports. The 26 full-graph journey snapshots and all other fixtures are synthetic; they execute semantic validation, not chargers, payment services or legal processes.

## Scope and provenance

The independent denominator is in `requirements/`, not a vendor endpoint list. A separate historical catalogue crosswalk remains for compatibility work, with redacted provenance URNs and clearly historical evidence. The former platform name has been removed from current paths and content. Existing commit history is preserved.

The development namespace remains `https://example.org/charge-domain#`. It is a placeholder, not a registered production namespace. Select an owned IRI before first production publication, migrate consistently and rerun verification. Keep published term identities stable afterwards.

Canonical repository: [pli-poc/charge-weave](https://github.com/pli-poc/charge-weave). Contributions, generators, model sources, tests, evidence and releases are maintained here.
