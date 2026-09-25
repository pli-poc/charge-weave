# Continue ChargeWeave here

Canonical repository: https://github.com/pli-poc/charge-weave

The objective is a complete, independently defined CPMS business ontology, with OWL, SHACL/SPARQL, business requirements and all verification in GitHub Actions. Work is now organized into reviewable stages. Commit and push each completed stage; preserve history and the current-tree naming guard. Read `AGENTS.md` before editing.

## Current checkpoint: semantic baseline 1.2.0

The interrupted 1.2 candidate has been recovered. Its sources and generated artifacts are retained together. Treat this checkpoint as verified only when all 40 verification jobs and the package job pass for its exact GitHub commit; earlier reports and the 1.1.1 run are not evidence for this candidate.

Implemented in this checkpoint:

- 285 concepts across 18 modules; 1,216 properties and 218 business invariants.
- 137 requirements, 28 actors and 20 journeys with six lifecycle treatments each.
- Field-level concept review with contract fingerprints, responsibility and requirement links.
- Valid and invalid focused evidence for every business rule: 438 decisions.
- 65 additional complete interaction scenarios covering historical authority, sponsored benefits, money and period reconciliation, rounding/time, settlement, privacy and operational closure.
- 1,023 independent decimal/timezone checks; pinned IANA database validation integrated into the runtime validator.
- 40 GitHub Actions verification jobs; packaging is gated on every job. The original journey, lifecycle, adversarial, OWL, schema and naming checks remain required.

Read `docs/completion-review.md`, `requirements/completion-criteria.json`, `requirements/concept-review.json` and `docs/migration-to-v1.2.md` for the concrete scope and changes. Earlier audit evidence is preserved in `docs/business-domain-audit.md` and `docs/adversarial-review.md`.

## Resume procedure

1. Inspect the current branch and the Actions run for its exact commit. Finish or repair any failing gate before advancing. A configured check is not a passing check; a passing count is not proof of universal business completeness.
2. Review the explicit scope and each journey's completion criteria. Validate the normal, exception, change and termination paths against independently stated business expectations. Concentrate on interactions and ordered histories that can remain hidden in individually conforming snapshots.
3. Record each finding with a concrete accepted or rejected counterexample. Close it in source contracts/rules, focused tests and complete scenarios, preserving legitimate historical and boundary cases. Update review fingerprints only after inspecting the changed contract.
4. Regenerate, commit and inspect all Actions again. Continue in bounded stages with a clear list of findings closed and any findings still open.

The next stage is a journey-by-journey adversarial review of the declared baseline, including ordered lifecycle/financial interactions and responsibility transfers. This checkpoint is substantial semantic progress; do not describe it as an exhaustively complete or implemented production CPMS.

## Bounded continuation stages

| Stage | Scope | Required result before advancing |
|---|---|---|
| 1 — Finish this checkpoint | Recover and verify the existing 1.2 candidate | Commit the sources and generated outputs; all 40 verification jobs plus packaging pass on that commit |
| 2 — Contract to operational asset | J01–J03: agreements, customer onboarding/closure, asset acceptance and ownership transfer | Challenge validity boundaries, responsibility transfers and retained liabilities with ordered histories and concrete counterexamples |
| 3 — Offer to billable usage | J04–J08: disclosure, authorization, charging, metering, rating and corrections | Verify historical decisions, duplicate/reordered events and billing exceptions across journey boundaries |
| 4 — Money and benefits | J09–J14: collection, roaming, disputes, settlement, reimbursement and subscriptions | Reconcile funds, obligations, corrections and commercial ownership across parties and time |
| 5 — Control and governance | J15–J20: energy control, privacy, security, operations, migration and process execution | Challenge concurrent obligations, authority changes, closure evidence and responsibility handovers |
| 6 — Scope acceptance | Revisit the independent requirement denominator and all review findings | Document unresolved scope questions and external acceptance; report exactly what has and has not been demonstrated |

These are planned reviews, not completed findings. For each stage, state the business expectation before writing a test, preserve the observed baseline result, fix demonstrated gaps in source, and rerun required gates. Commit a review record with the closed findings and next stage so work can resume without relying on chat history.

## Sources and commands

- Source contracts: `model/domain.schema`.
- Business rules: `tools/build_rules.py`, `model/audit-rules.json`.
- Requirements and reviewed scope: `requirements/`.
- Focused cases: `tests/business-acceptance.json`, `tests/negative-cases.json`.
- Complete scenarios: `tools/build_completion_scenarios.py`; generated registry in `tests/completion-scenarios.json`.
- Build: `python tools/build_all.py`.
- All gates: `make verify`.
- Authoritative shared results: `.github/workflows/ontology-ci.yml` and the Actions artifacts for the exact commit.

Actual charger/protocol execution, payment transfers, jurisdictional tax decisions, atomic persistence, physical safety and actual privacy operations remain external runtime acceptance, with owners recorded in `requirements/scope.json`. Do not count these as implemented by the ontology.
