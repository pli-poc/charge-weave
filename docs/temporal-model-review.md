# Temporal model and ontology viewer review

Review date: 26 September 2026. Baseline: `1106a5eb083b3f1df0446905550e9074fcb844bc`, ontology 1.1.1.

**Historical baseline — closure update:** Version 1.2.0 implements the model/reference/viewer closure described in [the temporal contract](temporal-contract.md). Findings and observations below describe the reviewed 1.1.1 baseline. The current audit requires rejection of the five fault classes; its tariff probe explicitly places both versions in one live selection pool.

**Baseline verdict: temporal foundations are present, but the model does not yet define a complete bitemporal CPMS.** The ontology viewer displays source definitions and a synthetic correction example; it is not a temporal query engine. This review leaves the product proposition and database selection for a later step.

## What was reviewed

All 277 class contracts in all 18 modules; 1,165 distinct declared properties; an inventory of 172 business rules with detailed inspection of temporal rules, and all 24 competency queries; source DSL and generated OWL/SHACL; lifecycle/correction policies; reference and adversarial test strategy; website data generation, relationships, triples and temporal inspector; both GitHub Actions workflows.

The [all-class inventory](temporal-coverage.md) enumerates every class, its business timestamps and interval/recurrence relationships, including inherited record metadata. Counts describe structural coverage, not a percentage of completeness. Not every class needs an individual time interval: immutable value objects can inherit historical identity from a versioned aggregate. That aggregate boundary still needs to be specified and enforced.

The dynamic probes use complete synthetic graphs with all existing structural and business SHACL checks. They are independent of the existing negative tests, which predominantly exercise the rules already written. This review is comprehensive as a temporal inventory, but its finite probes do not prove the absence of every other business defect.

## Terminology and query language

- **Valid time:** when a fact applies in the business world. `TariffVersion.validFrom/validUntil` is one existing example.
- **System time:** when a particular assertion/version was recorded as known by the authoritative system, including when it ceased to be the recorded assertion. There is no shared pair of system-time endpoints or snapshot-selection contract in this model.
- **Event time:** when a reported event occurred, e.g. `SourceEvent.occurredAt`.
- **Receipt/processing time:** when a message arrived or was processed. `receivedAt` and `processedAt` are useful provenance but do not establish system-time history for every derived fact.
- **Forecast horizon:** when a prediction concerns the world; its issue time and knowledge cutoff are separate.

The repository uses **standard SPARQL 1.1** queries. It has no SPARQL-T parser, query compiler, endpoint or engine integration. SPARQL-T/SPARQLᵀ names refer to particular temporal-language proposals, not a capability obtained by adding timestamps to OWL. The earlier architecture direction was explicit temporal modelling with standard SPARQL, with a possible temporal facade later. No literal SPARQL-T engine was selected.

SPARQL 1.1 provides graph patterns, named graphs, filters and date/time comparisons; an application must give its temporal vocabulary and selection rules meaning. OWL-Time supplies instant/interval vocabulary and temporal relations; it does not create stored version history. OWL-Time is currently only an alignment direction in `docs/semantic-design.md`, not a normative imported or mapped ontology.

Primary references:

- [W3C SPARQL 1.1 Query Language](https://www.w3.org/TR/sparql11-query/), especially datasets and date/time expressions.
- [W3C Time Ontology in OWL](https://www.w3.org/TR/owl-time/), vocabulary scope and interval relationships.
- [User-friendly temporal queries on historical knowledge bases](https://muhaochen.github.io/ref/i_and_c.pdf), the authors' SPARQLᵀ proposal and RDF-TX implementation.

## Findings ordered by impact

| ID | Priority | Finding and evidence | Required closure |
|---|---|---|---|
| T01 | Critical | `Record` supplies `createdAt` and `revision`, but no stable-entity/version separation, system-time interval, temporal assertion or graph-snapshot contract. No `validAt` plus `knownAt` competency query exists. | Specify version identity, assertion scope, authoritative recording time and snapshot construction; prove corrections preserve prior answers. |
| T02 | Critical | Historical joins are not defined. B157 evaluates an earlier `AccessDecision` against current `Principal.principalState` and `AccessGrant.grantState`; B114 likewise references current agreement state. These are current-snapshot checks, not valid historical replay. | Select every joined record at one explicit temporal context before validation. Separate historical decision evidence from authorization to act now; do not relax current access controls to make history pass. |
| T03 | High | Immutable tariffs, policies, calculations and CDRs are described, but the write transition and the immutable closure of their linked records are not enforced. A nested component can change under the same tariff IRI, version tag and digest. A digest string alone is not recomputed evidence. | Define versioned aggregate membership, canonical digest inputs, immutable references, append-only write checks and optimistic-concurrency rules. |
| T04 | High | Correction lineage exists (`RecordCorrection`, CDR/reimbursement corrections, journal reversals), but it does not state when a replacement became known, which valid-time portion it replaces, or how to distinguish successive corrections from conflicting branches. | Model retraction, replacement, splitting, late/backdated correction and compensating finance separately; preserve original evidence and the originally issued bill. |
| T05 | High | Interval rules are uneven. B075/B076/B077 and selected point-in-time/containment rules exist, but a `ChargingInterval` can lie outside its parent session. B114 validates an entitlement's start inside an agreement, not its full duration. | Add class-specific containment and endpoint rules. Define whether agreement termination truncates, rejects or requires renewal of entitlements. |
| T06 | High | Multiple effective tariff versions can coexist for one tariff identity. Explicit session references remove some ambiguity, but there is no general time-slice selection or conflict policy. Comparable questions apply to credentials, ownership, membership, tax and concurrent allocations. | Define uniqueness/overlap policy per business key and knowledge slice. Do not impose a global no-overlap rule: forecasts, parallel offers and different scopes may legitimately overlap. |
| T07 | High | Full-graph validation operates on a merged graph; no historical graph/projection watermark contract specifies what complete, consistently joined data was validated. Prose mentions watermarks but there is no executable snapshot manifest. | Define tenant, source offsets/revisions, schema version, temporal cutoffs, projection completeness and validation closure; prevent mixed-age joins and historical double counting. |
| T08 | Medium | Calendar dates are strings. Format checks accept impossible dates; semantic-design explicitly delegates calendar validity to ingestion, which is not implemented. Recurrences record a timezone name but lack a tested DST fold/gap expansion policy and timezone-database version. | Calendar-valid ingestion and tests; documented timezone, half-open instant and inclusive date semantics; replayable DST rules. |
| T09 | Medium | Telemetry has event/receipt times and some clock/epoch safeguards; there is no complete lateness, out-of-order, retraction, coalescing or retention/replay contract. Forecast issue time exists, but historical forecast selection and calibration/re-rating cutoffs are not executable. | Model stream/window semantics and snapshot cutoffs; keep observed, corrected and forecast values distinguishable. |
| T10 | Viewer | The original time detector only examined date/time literals and omitted linked `TimeWindow`/`RecurringWindow` definitions. The selected relationship's target timestamps could be mistaken for the history of the relationship itself. | Corrected in this review: linked intervals, time roles, explicit source/target context and the absent system-time contract are shown. |

## Cross-domain review

Every row inherits T01/T02/T07 where mutable history or historical joins are involved. This table records domain-specific consequences rather than assuming that every class needs the same four timestamps.

| Module | Present | Missing or incomplete temporal contract |
|---|---|---|
| foundation | Record metadata, external-ID validity, half-open windows, recurrence fields, transition time/lineage | Stable identity versus versioned assertion; knowledge intervals; DST/calendar validation; schema-version history and selection |
| identity | Time-qualified party roles, grants, delegations, group membership and entitlements | Historical principal/account/role contents; grant revocation history; permission changes; per-scope overlap policy |
| places | Time-qualified sharing/notices, recurring access windows, occupancy time | Site/listing/access-policy history and effective topology; point observations versus sustained occupancy; recurrence expansion |
| assets | Ownership/lifecycle events, calibration periods, register context elsewhere | Time-qualified site/circuit/connector relations, owner history, replacement identity and versioned capabilities |
| device-management | Status/connection observations, template/firmware versions, rollout dates | Desired versus observed configuration histories, capability valid-time, late status selection and staleness policy |
| vehicles-authorization | Credential/assignment validity, decisions, local-cache versions, source evidence | Conflicting assignments, revocation-as-known, historically selected policies and offline-cache cutoff lineage |
| commands-booking | Command/request expiry; booking/request windows; reservation expiry | Booking amendments and cancellation history, resource collision policy, linked-window containment and replayable outcome ordering |
| sessions-metering | Event and receipt times, session boundaries, metering epochs, correction references | Session segment containment, systematic late-event correction, versioned aggregate closure and an explicit historical billability snapshot |
| pricing | Stable tariff identity, versions, validity, quoted prices, offer acceptance, freeze policy | System-time selection, version conflicts, immutable nested components, effective assignment history and re-rating cutoff |
| billing-tax | Tax validity, calculation versions, issue/due times, credits | Historically frozen billing-party/tax/rounding inputs, knowledge cutoff, immutable invoice aggregate and replay of original versus corrected charge |
| payments-ledger | Payment times, authorization expiry, journal reversals, wallet as-of timestamp | Effective versus recorded posting time, reconstructible balance snapshots, historical state selection and cutoff-aware aggregations |
| subscriptions-benefits | Subscription bounds, periods, coupon validity, reservations and period balances | Plan/benefit amendment history, prorating/reset calendar policy, historical balance cutoffs and expired/consumed reservations as-of |
| partners-settlement | Agreement versions/validity, lifecycle events, policy snapshots, settlement periods and reimbursement dates | Full entitlement containment, historical settlement rules/parties, date-valid ingestion, retroactive amendments and knowledge-aware liability |
| roaming | Negotiated versions, import/receipt/publication times and synchronization watermarks | Partner effective time versus local knowledge, correction/import lineage, deletion/tombstone history and coherent imported snapshots |
| energy | Constraint/allocation intervals, forecast issue/horizon, schedules, period non-overlap and export validity | Coincident aggregate resource constraints, historical forecasts/constraints, schedule supersession and point/window lateness semantics |
| operations | Downtime/operational windows, versioned availability policy, calculation time | Reproducible denominator union/intersection and overlap handling, late incident corrections, maintenance/status history and result knowledge cutoff |
| security-governance | Certificate/policy validity, consent decisions, audit events, access decisions, hold dates | As-of consent/grants/policies, revocation ordering, valid/system retention distinctions and preservation/deletion of version history |
| integration-experience | Event delivery, settings effective time, metric windows, lifecycle snapshots, process order | Projection snapshot manifest, history-preserving migration, schema/mapping version selection and process-event timestamps needed for duration/replay |

## Reproducible observations

Run `python tools/audit_temporal.py`. Its fresh `reports/temporal-audit.json` contains the current commit, schema hash, full class inventory, control results and probe outcomes. GitHub Actions uploads the report and includes it in the verified package. **Passing this audit gate means its controls and inventory succeeded, not that its gap probes were rejected.** Probe outcomes are observations so a later fix does not require a test to keep accepting an error.

The controls establish that the all-class fixture conforms, an inverted interval triggers B076, B027 includes the start and excludes the end, and an equivalent timezone offset denotes the same instant. The inventory must exactly match the current catalog.

The probes inspect: a segment outside its session, entitlement end beyond the backing agreement, an impossible calendar date, nested tariff-price mutation without a new version/digest, and two concurrently effective versions of one tariff. See the current report for actual results; unrelated validation failures must be resolved before claiming a probe demonstrates a gap.

Snapshot conformance cannot establish immutability across writes: the tariff probe deliberately compares the unchanged conforming reference with a separately conforming changed graph. These are synthetic observations, not historical production records.

## Viewer status after this review

The schema explorer now exposes linked intervals and recurrences, labels event/receipt/validity fields, identifies a relationship's declaring and target classes, and states the absence of a shared system-time history. The tariff correction remains explicitly synthetic and independent of the selected class. OWL/SHACL triples remain source-backed schema triples, not time-qualified instance assertions.

Remaining viewer work depends on the temporal model: an assertion/version inspector with valid and system intervals; correction lineage and temporal edge evidence; a two-axis timeline; selectable consistent snapshots; temporal SPARQL queries with exact expected results; and validation results attached to the selected snapshot. A visual date selector alone cannot supply these semantics.

## Implementation order and acceptance gate

1. **Specify the shared history contract.** Choose record-version, qualified-assertion or graph-snapshot representation and versioned aggregate boundaries. Keep stable entity identity distinct from assertion/version identity. Define open ends, half-open boundaries, instant precision, source authority and immutable system time.
2. **Apply it across all 18 modules.** Explicitly classify records as immutable facts/value objects, versioned aggregates, time-qualified relationships, events or projections. Close the demonstrated domain invariants; do not add generic timestamps without class-level meaning.
3. **Define temporal querying and validation.** Provide standard SPARQL queries for point snapshots (`validAt`, `knownAt`), history, overlap, before/after and changes between snapshots. Select every joined version consistently; pin tenant, schema and projection watermark. A later SPARQL-T facade must compile into this tested contract or target an explicitly chosen engine.
4. **Prove correction and replay.** Test late and backdated facts; valid-interval splitting; multiple corrections/retractions; adjacent/open intervals; same-instant ties; timezone/DST boundaries; referential closure; stale projections; original and corrected billing; consent revocation; contract termination; history retention. Include generated OWL/SHACL consistency and full-graph adverse cases in CI.
5. **Bind the viewer to executable evidence.** Drive timeline, triple/assertion inspector and query examples from committed temporal fixtures and their tested outputs. Then implement the selected storage/projection architecture and test transaction, concurrency and scale behavior separately.

Completion requires model contracts, executable temporal queries, full-graph acceptance scenarios, historical join rules, correction semantics and a viewer that displays that evidence. It cannot be inferred from a class count or a passing snapshot-validation suite.
