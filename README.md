# ChargeWeave

[![Ontology CI](https://github.com/pli-poc/charge-weave/actions/workflows/ontology-ci.yml/badge.svg)](https://github.com/pli-poc/charge-weave/actions/workflows/ontology-ci.yml)

A modular business ontology for charging management: CPO and eMSP services, public and ad hoc charging, fleet/workplace and home charging, roaming, payments, settlement, energy control and governance.

Version **1.2.0** contains **285 classes in 18 modules, 1,216 properties, 213 controlled code schemes and 218 SHACL-SPARQL business rules**. Its declared semantic completion baseline reviews **137 requirements, 28 actor roles and 20 journeys**, with a field-level review for every concept. All business rules have valid and invalid focused evidence: **438 acceptance decisions**, plus **65 new complete interaction scenarios**, the original 26 journey graphs and 14 earlier adversarial cases. Independent decimal and timezone oracles add 1,023 checks. Read the [completion review](docs/completion-review.md) and [migration guide](docs/migration-to-v1.2.md).

Each journey covers contracting, onboarding, operation, change, suspension and termination, with accountability, financial ownership and exceptions. Requirements link to concepts, relationships, structural constraints, business rules and acceptance scenarios. This is a finite, declared CPMS business profile; passing model tests does not establish an implemented or certified production service.

## Start here

| Purpose | File |
|---|---|
| Current checkpoint and next review stage | [Work status](WORK_STATUS.md) |
| Current completion criteria and evidence | [Completion review](docs/completion-review.md) |
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

Exit status 0 means conforming and 1 means rejected. Validation includes structural contracts, controlled vocabularies, business invariants, declared lifecycle policies and the pinned IANA timezone check. Exported SHACL alone does not perform the additional timezone-database validation. Full verification takes several minutes. `make verify` runs every gate; GitHub Actions runs the gates in parallel and packages only after all pass, retaining fresh reports and commit/hash provenance.

The build uses committed sources and does not fetch moving documentation. It never manufactures passing test reports. All complete journey/interaction graphs and other fixtures are synthetic; they execute semantic validation, not chargers, payment services or legal processes.

## Scope and provenance

The independent denominator is in `requirements/`, not a vendor endpoint list. A separate historical catalogue crosswalk remains for compatibility work, with redacted provenance URNs and clearly historical evidence. The former platform name has been removed from current paths and content. Existing commit history is preserved.

The development namespace remains `https://example.org/charge-domain#`. It is a placeholder, not a registered production namespace. Select an owned IRI before first production publication, migrate consistently and rerun verification. Keep published term identities stable afterwards.

Canonical repository: [pli-poc/charge-weave](https://github.com/pli-poc/charge-weave). Contributions, generators, model sources, tests, evidence and releases are maintained here.
