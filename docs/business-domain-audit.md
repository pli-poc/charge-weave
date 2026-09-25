# Independent business-domain completeness audit — pending

The imported ontology has public AMPECO resource/operation traceability and tested
technical constraints. It has **not** yet passed a systematic independent audit of
the complete CPMS business domain. Passing CI does not close this gap.

The next audit must define business requirements independently of any vendor API,
review every existing concept against them, and implement missing concepts and
validation rather than merely adding broad class labels.

## Required traceability

Every requirement needs a stable ID, actor, business outcome, preconditions,
contractual/financial responsibility, normal path, lifecycle changes, failure and
correction paths, relevant sources, ontology terms, validation rules, acceptance
scenarios, evidence and an explicit disposition. Distinguish represented,
partially represented, missing, external runtime responsibility, and excluded
with a stated reason. Do not use endpoint counts as the denominator.

## Audit dimensions

| Dimension | Required review |
|---|---|
| Actors and accountability | Driver, account holder, fleet, employer, property owner, installer, maintainer, CPO, eMSP, roaming intermediary, grid/energy party, payment provider, finance and platform administrator |
| Commercial lifecycle | Offer, contract, onboarding, amendments, entitlements, suspension, termination, retention and transfer |
| Charging journey | Provision, discover, quote, reserve, authorize, start, meter, stop, rate, record, bill, settle, reconcile and support |
| Operational exceptions | Offline operation, duplicates, retries, late/out-of-order data, failed starts/stops, meter resets, recovery, maintenance and replacement |
| Financial exceptions | Holds, refunds, disputes, chargebacks, credits, corrections, tax evidence, rounding, currencies and allocation/reconciliation |
| Energy and responsibility | Site constraints, dispatch/control evidence, forecasts, overrides, grid events, reimbursement and service accountability |
| Security and information lifecycle | Tenant isolation, delegated authority, consent, audit evidence, identity changes, data retention/deletion and portability |
| Integration contracts | Versioned protocol mappings, commands and callbacks, idempotency, reconciliation and cross-system ownership |

Completion requires reviewed normal and exceptional journeys linked through
**requirement → ontology → constraints → acceptance scenarios → evidence**.
Runtime obligations need corresponding integration/system gates as those services
are implemented. A requirement whose implementation is external still needs an
explicit boundary contract and owner. Regulatory conclusions need current primary
sources and must not be inferred from this checklist.

This document records the gap and audit method; it is not the completed audit.
