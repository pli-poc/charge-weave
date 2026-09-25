# Migration to 1.2.0

This semantic revision requires importer changes. Keep existing IRIs and canonical identities; regenerate the ontology and validators together. Do not fill new evidence fields with fabricated historical facts merely to pass validation.

| Existing concept | New required input | Meaning |
|---|---|---|
| AccessDecision | `decisionContext` | Current authorization uses current grants. A historical permit also needs a matching AuthorizationSnapshot and original AccessGrant reference. |
| FinancialPosition | `collectionBasis` | Choose Uncollected, PaymentAllocations or ExternalEvidence. External collections and nonzero write-offs require their specific evidence. |
| Wallet | `openingBalance`, `balanceFrom` | The opening balance precedes entries included from `balanceFrom` through `balanceAsOf`, both inclusive. The producer must not include a boundary entry in two consecutive statements. |
| Journal | `accountingPeriod` | Posted time belongs to the accounting period and cannot follow its close time. Later closing does not invalidate a legitimate historical posting. |
| TaxDetermination | `taxableAt` | Retain the taxable supply time separately from the later determination time. This is an assessed business fact, not an automatic legal tax-point decision. |
| Issue | `billingBlocking` | Explicitly distinguish an issue that prevents billing. Readiness cannot hide unresolved blockers by reporting a zero count. |
| DataSubjectRequest | `requestOutcome` | Pending, Fulfilled or Refused. Closed requests retain the terminal outcome, completion time and response evidence. |
| ProcessStep | `requiredStep` | Required work cannot be silently skipped. |

Eight new concepts cover decision-time authorization snapshots, accounting periods, late adjustments, currency conversion, monetary rounding, IANA pricing time resolution, sponsored allowances and multi-party settlement legs. A posted PeriodAdjustment links its RecordCorrection, original and posting periods, original usage time and CommercialResponsibility. A posting period that later closes remains valid when its close time follows the posting.

The model now rejects additional contradictions: fictitious collection totals, allocated money already refunded, paid invoices without settled evidence, nonpositive credits, invalid payment states, wrong payout holders, hidden open sessions/grants, and overlapping allocations that collectively exceed a power cabinet's capacity. Migrate contradictory records through explicit correction evidence.

For AmountRounding, the canonical calculation profile supports decimal places 0–6. HalfUp rounds ties away from zero; HalfEven selects the even neighbor; Down is toward zero; Up is away from zero. Other calculation profiles require an explicit extension. CurrencyConversion keeps the original quote direction and an AmountRounding record; it does not silently invert a quote.

PricingTimeResolution contains an offset-bearing source local timestamp, its UTC instant, IANA timezone and occurrence policy. First and Second identify chronological occurrences of a repeated local hour. Nonexistent local times are rejected. Install the pinned `tzdata==2026.3` dependency and use `tools/validate.py`: portable SPARQL checks instant equality, while the integrated Python constraint checks the IANA interpretation. Running only exported SHACL omits that additional timezone database check.

Update the reviewed source contracts in `requirements/concept-review.json` only after reviewing the changed fields, business owner and evidence. Run `python tools/build_all.py`, `make verify`, and the complete Actions workflow. Existing commit history remains intact.
