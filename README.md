# ChargeWeave

[![Ontology CI](https://github.com/pli-poc/charge-weave/actions/workflows/ontology-ci.yml/badge.svg)](https://github.com/pli-poc/charge-weave/actions/workflows/ontology-ci.yml)

Canonical repository: [pli-poc/charge-weave](https://github.com/pli-poc/charge-weave).

**Status:** CPMS ontology v1.0 baseline imported. The independent end-to-end business-domain completeness audit is **pending**; the existing vendor crosswalk and technical tests do not establish that completeness. See [the audit plan](docs/business-domain-audit.md).

GitHub Actions runs seven verification gates on every push and pull request, then produces a verified package with fresh reports and commit provenance. See [development and CI](docs/development.md) and [contribution instructions](CONTRIBUTING.md).

An independently named, modular ontology for a full charging-management business: CPO operations, eMSP services, energy control, commercial charging, roaming, home reimbursement, corporate charging and platform administration.

This release replaces the earlier small foundation. It contains **235 domain classes in 18 modules, 937 domain properties, 172 controlled code schemes and 109 SHACL-SPARQL business rules**. The public AMPECO benchmark accounts for **all 83 resource families and all 651 operation pages in the captured sidebar**, including deprecated entries. Actions have 93 canonical command kinds; 45 observed callback identifiers have event kinds. A separate audit maps all 55 fields in the inspected tariff pricing object and all 7 discount-settings fields.

## Start here

| Purpose | File |
|---|---|
| Open the entire ontology in Protégé | `ontology/charge-domain-complete.owl` |
| Read or load Turtle | `ontology/charge-domain-complete.ttl` |
| JSON-LD serialization | `ontology/charge-domain-complete.jsonld` |
| Search all class definitions and fields | `docs/domain-dictionary.md` |
| Understand naming, identity and semantics | `docs/semantic-design.md` |
| Evaluate completeness against AMPECO | `docs/completeness-assessment.md` |
| Inspect the 83 resource mappings | `docs/ampeco-resource-crosswalk.md` |
| Inspect every observed endpoint mapping | `docs/ampeco-endpoint-crosswalk.md` |
| Inspect detailed pricing mappings | `docs/pricing-field-crosswalk.md` |
| Read the 109 business invariants | `docs/validation-rules.md` |
| Understand validation and test limits | `docs/validation-guide.md` |
| Plan the executable CPMS | `docs/runtime-architecture.md` |
| Read evidence and research limitations | `docs/research-sources.md` |
| Current verification results | GitHub Actions `reports-*` artifacts |
| Historical v1.0 results | `evidence/baseline-v1.0/` |

## Run locally

CI uses Python 3.12 and Java 17. From this directory:

```bash
python -m pip install -r requirements-ci.txt
python tools/check_generated.py
python tools/validate.py --meta
python tools/test_business.py
python tools/test_boundaries.py
python tools/test_trust_boundary.py
python tools/check_owl.py
python tools/check_release.py
```

`validate.py` validates the supplied all-class example by default. Pass a Turtle file to validate your own complete, authorized snapshot. Exit status 0 means conforming; 1 means validation failure. It loads the ontology, code individuals, command/event kinds and permitted transitions together. The reference validator prioritizes reproducibility, and may take several minutes on the full fixture.

```bash
python tools/validate.py /absolute/path/to/tenant-snapshot.ttl
python tools/build_all.py
```

For all gates, use `make verify`, or run `python tools/check_generated.py` followed by `python tools/verify_all.py`.

The build uses committed declarative model and benchmark inputs; it does not fetch live vendor documentation. Regeneration deliberately does not manufacture new test results. Rerun the checks after changing the model. No live charger, PSP, private AMPECO tenant or production account was used.

## What “complete” means in this release

The **observed public resource catalogue is completely accounted for** at the semantic resource/operation level. The model includes the principal supporting entities and relationships needed across the charging business, rather than only a station/session/connector schema.

This is **not a verified field-for-field reproduction of AMPECO**, its private data model, every vendor implementation rule, or every configuration of a production CPMS. Endpoint mapping is not adapter implementation. The official API schema index also has a different version from the live sidebar; the benchmark preserves that distinction. The exact evidence boundary and runtime acceptance gates are documented rather than hidden in a blanket “100% complete” label.

An ontology describes and validates business data. A complete executable CPMS additionally needs protocol services, transaction processing, payment and roaming integrations, interfaces, security enforcement and operational testing. Those system responsibilities are mapped in the architecture document.

## Namespace and ownership

The development namespace is `https://example.org/charge-domain#`; the ontology IRI is `https://example.org/charge-domain`. These are explicit placeholders, not claimed public registrations. Select an IRI under your control before first production publication, replace it consistently in source and queries, regenerate, and rerun validation. After publication, preserve term IRIs and manage semantic changes through versioned releases.

The model and generated descriptions are original design work. AMPECO identifiers and public URLs are used for interoperability traceability. No vendor source code, credentials or private implementation was incorporated. Upstream documentation remains governed by its own terms.
