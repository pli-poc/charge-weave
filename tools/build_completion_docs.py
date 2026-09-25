"""Render the reviewed scope denominator without manufacturing execution results."""
from pathlib import Path
import json
P=Path(__file__).resolve().parents[1]
read=lambda p:json.loads((P/p).read_text())
criteria=read('requirements/completion-criteria.json');concepts=read('requirements/concept-review.json')
cases=read('tests/business-acceptance.json');full=read('tests/completion-scenarios.json')
rules=read('model/rules.json');requirements=read('requirements/business-requirements.json')
text=['# Declared semantic completion baseline — 1.2.0','',
 'This release reviews the full declared CPMS domain against actor outcomes, changes, exceptions and ownership. The denominator is the independently stated journey scope, not the historical external catalogue. The review adds 8 concepts and 46 business invariants, strengthens current versus historical authorization and sponsored benefit use, and makes every original business rule distinguish a valid decision from a deliberate violation.','',
 f'The baseline contains **{len(concepts)} reviewed concepts, 18 modules, {len(requirements)} requirements, 20 journeys and {len(rules)} business rules**. There are **{len(cases)} focused acceptance decisions** and **{len(full)} additional complete interaction scenarios**, alongside the 26 original journey graphs, 14 prior adversarial cases and 24 lifecycle decisions. The independent arithmetic/timezone gate has 1,023 checks. Counts describe evidence to execute; current pass/fail status comes from the Actions run for the exact commit.','',
 '## Completion criteria enforced in the repository','',
 '- Every declared journey has a normal outcome, exception outcome, change/termination treatment and assigned business and financial responsibility. All six lifecycle treatments are retained.',
 '- Every concept has reviewed field paths, an accountable journey, associated requirements and a fingerprint of its reviewed source contract. A changed contract fails the gate until its review is updated.',
 '- Every business invariant has concrete valid and invalid focused evidence; the all-class fixture, structural boundaries, OWL checks and trust-boundary tests remain separate gates.',
 '- Every new invariant is exercised in complete interaction data, with a positive business assertion and a negative case naming the exact expected rule.',
 '- Decimal rounding is compared with an independent Decimal oracle across four modes, seven scales, both signs, ties, neighboring values and large amounts. IANA time interpretation uses pinned tzdata 2026.3, including repeated and nonexistent local times.',
 '- Generated outputs must reproduce from source. Packaging requires fresh reports from all 40 verification jobs, including coverage, focused tests, complete interactions and independent oracles.','',
 '`tools/check_completeness.py` checks the evidence contract; it does not replace executing the evidence. The 40 jobs must all succeed before a package exists. Supporting data concepts are explicitly identified as structural contracts where no class-specific business invariant is asserted. This prevents a class count from masquerading as implemented behavior.','',
 '## Substantive closures','',
 '| Area | Implemented contract | Rules |', '|---|---|---|',
 '| Historical authority and sponsorship | Immutable decision-time grant facts; separately funded beneficiary and usage-time scope | B173–174; strengthened B157, B171 |',
 '| Financial reconciliation | Allocation-backed collection, write-off evidence, wallet statement interval, period close and original-responsibility late adjustments | B175–180 |',
 '| Pricing and time | Signed rounding, directional conversion, line totals, supply-time tax validity and offset/UTC/IANA agreement | B181–186; supplemental IANA constraint |',
 '| Settlement and privacy | Distinct economic legs, duplicate-leg identity, retained rights outcomes and record-scoped holds | B187–190 |',
 '| Process and operational closure | Required steps, predecessor ordering, actual blocking issues/grants/sessions, ownership and processing chronology | B191–199 |',
 '| Payment, energy and service evidence | Refund/chargeback limits, actual payout holder, signed flexibility, concurrent cabinet capacity, service closure and synchronization chronology | B200–208 |',
 '| State-to-evidence reconciliation | Payment/capture state, refund chronology, paid invoice evidence, allocation source, positive credits, refunded-money availability, subscription exit and actual settlement differences | B209–218 |','',
 '## Journey acceptance baseline','',
 '| Journey | Normal outcome | Change / termination | Exception outcome |', '|---|---|---|---|']
for row in criteria['journeys']:text.append('| '+' | '.join(row[k] for k in ('journey','normalOutcome','changeAndTermination','exceptionOutcome'))+' |')
text += ['', '## Concept review inventory','',
 'Full field-level review records and contract fingerprints are committed in `requirements/concept-review.json`. Data-contract entries verify representation and link to their business use; they do not imply a separately implemented controller, adapter or commercial algorithm.','',
 '| Concept | Module | Accountable journey | Validation mode | Requirements |', '|---|---|---|---|---|']
for row in concepts:text.append('| '+' | '.join([row['concept'],row['module'],row['primaryJourney'],row['validationMode'],', '.join(row['requirements'])])+' |')
text += ['', '## Interpretation and remaining external acceptance','',
 'The result is a finite engineering baseline for the declared semantic model. No identified finding in this review is left as a documentation-only fix. It is not independent stakeholder sign-off, an exhaustive proof over every possible commercial arrangement, or a completed CPMS runtime. New market requirements require another explicit scope review.',
 '', 'The runtime obligations remain assigned in `requirements/scope.json`: actual charger/protocol behavior, atomic storage and authorization, payment execution, policy-complete pricing engines and jurisdictional tax decisions, physical safety, actual erasure, recovery/scale and user experience. The added rounding and time calculations close concrete semantic gaps; they do not implement every tariff algorithm or fiscal certification.',
 '', 'See [migration](migration-to-v1.2.md), [business policies](business-policy-decisions.md), [requirements](business-requirements.md) and [GitHub Actions](https://github.com/pli-poc/charge-weave/actions/workflows/ontology-ci.yml).']
(P/'docs/completion-review.md').write_text('\n'.join(text)+'\n')
