# Independent CPMS business-domain audit — v1.1

Reviewed 25 September 2026. The earlier import established catalogue traceability and technical consistency but did not establish independent business coverage. This review defines a finite CPMS business profile from actor outcomes, lifecycles, exceptions and ownership, then changes the model to close the findings below.

The reviewed baseline contains **91 requirements, 28 actor roles and 20 journeys**, with all six lifecycle phases described for every journey. It covers multi-tenant conductive charging, CPO/eMSP roles, public/ad hoc commerce, fleet/workplace and home charging, roaming and energy orchestration. The exact scope, runtime owners and reasoned exclusions are in [`requirements/scope.json`](../requirements/scope.json).

## Method and traceability

1. Define actors, outcomes and contractual/financial responsibilities independently of the historical external catalogue.
2. Describe contracting, onboarding, operation, change, suspension and termination, including failure, reconciliation and correction paths.
3. Compare each requirement with existing concepts and relationships. Record whether an existing contract covers it or additional semantics are needed.
4. Add explicit concepts, state policies, structural constraints and business invariants for identified gaps.
5. Author valid and invalid decisions, deliberate rule counterexamples and coherent cross-domain snapshots. Validate through the committed SHACL rules.
6. Check all links and generated artifacts in GitHub Actions; retain the reports for the exact commit.

The [requirement register](business-requirements.md) records preconditions, normal and exceptional outcomes, sources, concepts, actual property paths, shapes, business rules, scenario IDs, finding and disposition. The [journey register](actor-journeys.md) assigns accountability and financial ownership. [Primary sources](business-research-sources.md) are distinguished from [ChargeWeave policy decisions](business-policy-decisions.md). Requirements retained from the original model and new gap closures are identified separately.

## Findings closed in the semantic model

| Finding in the imported model | Implemented closure | Acceptance evidence |
|---|---|---|
| Agreements lacked explicit obligations, acceptance lifecycle and residual-liability treatment | Versioned obligations and assessments, agreement events, financial owners, service entitlements, account closure | BR-110–115; closure snapshots |
| Installed assets lacked evidence-backed operational handover and retirement ownership | Operational acceptance, asset events and connector compatibility | BR-116–119; asset snapshots |
| Discovery/charging did not bind offers, acceptance and commercial responsibility sufficiently | Commercial offer/acceptance/responsibility and ad hoc eligibility constraints | BR-120–124; focused decisions and charge snapshot |
| Offline and repeated events lacked explicit exposure and effect accounting | Offline authorization assessment and event processing outcomes with duplicate/quarantine rules | BR-125–128; offline snapshots |
| Meter reset, billing readiness and correction lineage were too implicit | Register epochs, measured/estimated deltas, readiness assessments, credit CDR and correction records | BR-129–134; charge and credit snapshots |
| Collections, reconciliation and service disputes lacked clear balances and resolution evidence | Financial positions, allocations, missing-side reconciliation, resolutions, disputes and dunning | BR-135–143; charge/credit snapshots and focused decisions |
| Settlement and home reimbursement could not state an auditable release decision | Settlement approval and item totals; reimbursement approval, rate/energy/currency agreement and confirmed payout | BR-144–147; settlement/reimbursement snapshots |
| Benefit use lacked reserved exposure and period balance accounting | Reservations and balances reconciling rollover, grant, consumption, expiry and money currency | BR-148, BR-170–172; allowance snapshots |
| Energy control lacked a decision separating requested and safe feasible power | Control decisions, export agreement and bounded override authorization | BR-149–151; energy snapshots |
| Information lifecycle lacked rights-request outcomes, legal holds and access/evidence decisions | Rights requests, holds, purposes, scoped access and digest verification records | BR-152–158; privacy/access snapshots |
| Operational accountability lacked measurable service/recovery evidence | SLA commitments/breaches and measured recovery exercises | BR-159–161; migration/asset snapshots |
| Provider exit, state history and cross-domain compensation were underspecified | Protocol profiles, migration batches, lifecycle snapshots/chains and process steps with compensation | BR-162–168; migration/process snapshots and lifecycle decisions |
| Invoice credit limits were insufficiently connected to original liability | Issuer/currency match and cumulative credit cap | BR-169; focused positive/rejection decisions |

The changes add **42 concepts and 63 business rules**. The resulting model has 277 classes, 1,165 properties and 172 business rules. This is a breaking semantic revision for importers that must now provide required agreement, asset, financial, CDR and allowance fields; see [migration guidance](migration-to-v1.1.md).

## Evidence and what each layer establishes

| Layer | Committed evidence | What passing establishes |
|---|---|---|
| Source/actor/requirement traceability | `requirements/`, `tools/check_audit.py` | References resolve, every rule is accounted for, actors/journeys/lifecycle phases are covered and scenarios exist |
| Structural and ontology contracts | Generated OWL/SHACL; full reference graph; HermiT | Cardinality/type contracts, consistency and satisfiability for the tested graph |
| Deliberate adverse rules | 172 counterexamples | Each business rule reports its intended violation |
| New business decisions | 128 valid/invalid focused cases | Added rules distinguish the authored acceptable and unacceptable decisions |
| Lifecycle decisions | 24 independently selected transitions | Examples of reversible suspension, terminal closure, approval and compensation policies behave as declared |
| Complete business snapshots | 26 graphs in 13 families, covering all 20 journeys | Full structural/business conformance plus cross-domain assertions, and rejection of a deliberate fault |
| Reproducibility and packaging | Isolated rebuild, format/query checks, current-name guard | The committed generated artifacts and packaged evidence correspond to source and the Actions commit |

Current pass/fail outcomes come from [the workflow run](https://github.com/pli-poc/charge-weave/actions/workflows/ontology-ci.yml), not from this document. The current-tree naming check includes historical evidence files. History was preserved as requested; existing older commits can still contain prior names.

## Subsequent adversarial review

The first v1.1 audit did not catch six cross-record loopholes. Version 1.1.1 records the full pre-fix observations and adds 14 regression cases with targeted rule fixes. Read [the adversarial findings](adversarial-review.md). This demonstrates why traceability and passing initial tests were insufficient to prove exhaustive completeness.

## Completion boundary and remaining system acceptance

All declared requirements have semantic-contract dispositions and executable model evidence. No finding in the table above is left as a documentation-only promise. This is an engineering review of the declared profile, not independent stakeholder sign-off or a proof that every future jurisdiction and commercial arrangement is covered.

A complete snapshot can state a false fact. SHACL cannot prove a signature was verified, an invoice was delivered, a charger was safe, a bank transferred funds or personal data was actually erased. These responsibilities have explicit runtime owners in the scope and journey registers. Full-graph snapshots are semantic end states, not executions of protocol handlers or payment workflows. Each requirement retains its corresponding runtime acceptance obligation.

Production completion therefore still requires real protocol and payment integration tests, pricing/tax golden calculations for adopted policies, atomic persistence and idempotency under concurrency, authorization/isolation enforcement, physical energy safety, recovery/scale measurements, accessible user journeys and market-specific regulatory review. These boundaries are intrinsic to an ontology deliverable; they are not counted as implemented runtime services.
