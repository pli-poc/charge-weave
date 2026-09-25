# Development and GitHub Actions

ChargeWeave uses GitHub as its canonical source and GitHub Actions as its shared
verification record. Version 1.2 includes the independent business requirement register, concept reviews and executable interaction evidence.

## Environment and commands

CI runs Python 3.12 and Java 17 on Ubuntu 24.04. Runtime and transitive Python
dependencies are pinned in `requirements.txt` and `requirements-ci.txt`.
Actions are pinned to verified commit SHAs. The ontology build itself is offline;
dependency installation uses package registries. No production credentials are used.

```bash
python -m venv .venv
# Linux/macOS: source .venv/bin/activate
# PowerShell: .venv\Scripts\Activate.ps1
python -m pip install -r requirements-ci.txt
python tools/build_all.py
python tools/check_generated.py
python tools/verify_all.py
```

The Makefile offers the same commands as `make build`, `make generated`,
`make validate`, `make tests`, `make reason`, `make release` and `make verify`.
Java must be on PATH for HermiT. Full verification can take several minutes.

## Source ownership

| Editable source | Generated outputs |
|---|---|
| `model/domain.schema`, reviewed additions in `tools/extend_model.py` | OWL class contracts, structural SHACL, catalogue, type index, dictionary |
| `tools/build_rules.py`, `model/audit-rules.json`, `model/lifecycle-policies.json` | Business SHACL, standalone B queries, lifecycle tables and rule documentation |
| Captured `benchmark/` inputs and mappings in `tools/build_benchmark.py` | External platform crosswalks, actions/events and vocabulary shapes |
| `tools/build_pricing_audit.py` | Detailed pricing crosswalk |
| `tools/build_examples.py`, `tools/build_journey_snapshots.py` | All-class reference graph and full journey snapshots |
| `requirements/*.json`, `tools/build_audit_docs.py` | Requirement, source and actor/journey documentation |
| `tools/build_queries.py` | Competency questions and CQ queries |
| `tests/negative-cases.json`, `tools/test_*.py` | Validation reports |

`tools/check_generated.py` builds in a clean temporary output tree using only
the committed source inputs. It compares the entire generated file inventory,
parses JSON, compares plain text exactly, and compares RDF by exact graph
isomorphism. Blank-node identifiers and statement ordering may change without
changing meaning. Schema source extensions must be idempotent. Missing or stale
outputs fail CI. The reference fixture selects controlled values deterministically.

## Workflow gates

| GitHub Actions job | What it establishes |
|---|---|
| Generated artifact consistency | Committed artifacts match a clean regeneration |
| SHACL and reference graph | Meta-SHACL validity and positive snapshot conformance |
| SPARQL business rules | Each business rule detects its deliberate adverse example |
| Structural boundary cases | Selected valid boundaries and invalid values behave as intended |
| Input trust boundaries | Empty/untyped inputs and trusted-vocabulary tampering are rejected |
| OWL consistency and satisfiability | HermiT accepts both the schema and schema plus reference graph |
| Coverage formats and competency queries | Declared classes, mappings, standalone queries and exports agree |
| Requirement traceability | Actors, sources, relationships, rules, lifecycles and acceptance links resolve |
| Business and lifecycle acceptance | Valid/invalid business decisions and selected allowed/forbidden transitions |
| Thirteen journey families | Complete conforming snapshots, cross-domain assertions and deliberate business faults |
| Six adversarial families | Previously accepted business contradictions are rejected while legitimate counterpart snapshots remain valid |
| Eight completion interaction families | New cross-domain invariants distinguish legitimate complete snapshots from specific contradictions |
| Calculation and timezone oracles | Decimal results and local-time interpretation agree with independently specified expected outcomes |
| Declared business completeness | Reviewed scope, contract fingerprints and positive/negative evidence references remain current |
| Current source naming | Removed platform name does not recur in current paths/content |
| Verified ontology package | All gates passed and the current commit can be packaged with its evidence |

Open [Actions](https://github.com/pli-poc/charge-weave/actions/workflows/ontology-ci.yml)
and select the run for the commit under review. Each verification gate uploads a
`reports-*` artifact. Only fresh reports from that same run are used for packaging.
The final artifact includes a ZIP, SHA-256 checksum, source and schemas, test reports,
and `reports/build-provenance.json` with the commit, dependency versions and file hashes.
Pull-request runs verify GitHub's merge commit; provenance records that exact commit.

## Report handling

`reports/` and `dist/` are runtime output directories and are ignored by Git.
The original v1.0 results are preserved separately in `evidence/baseline-v1.0/`;
they are historical evidence, not current-run results. The obsolete original manifest was removed after current-tree debranding changed archived file bytes. New package manifests describe the actual artifact.

For local packaging, run all gates on the current checkout, commit changes, then
run `python tools/package.py`. The local packaging guard checks report completeness
and a clean tree; it does not prove that locally retained reports are fresh. The
authoritative package is the Actions artifact, whose reports come from one run.

No workflow automatically updates the benchmark from a moving website or treats
technical success as independent business completeness. The completed semantic review has its own [findings and evidence boundary](business-domain-audit.md).

## Maintaining the completion baseline

The reviewed inputs are `requirements/completion-criteria.json` and `requirements/concept-review.json`. Do not automatically refresh contract fingerprints as part of generation: they require review of changed source fields, ownership and evidence. `tools/build_completion_scenarios.py` authors full interaction fixtures; `tools/build_completion_docs.py` renders the review inventory. Add a focused positive and negative case for every new rule and a complete interaction for each new cross-domain invariant. Include new execution reports in `verify_all.py`, the Actions matrix and `package.py`.
