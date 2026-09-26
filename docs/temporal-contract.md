# Bitemporal contract and temporal review closure

Version 1.2.0 closes the temporal review findings at the **model, executable reference implementation and ontology viewer** levels. It provides a tested contract for all 282 classes across 18 modules. The [original review](temporal-model-review.md) remains the historical baseline. The product proposition is unchanged.

The query implementation is standard SPARQL 1.1 over immutable RDF snapshots. A native SPARQL-T grammar, database engine and production service have not been selected or deployed. A later temporal-language facade must preserve the answers and rejection behavior specified here.

## Identity, scope and the two times

A stable business IRI identifies an entity across snapshots. Each `TemporalCommit` has a distinct immutable IRI, authoritative `recordedAt`, monotonic sequence, previous commit, schema/writer digest, mapping version, reason and source checkpoints. Its `TemporalSlice` records a half-open business interval and an immutable, content-addressed named payload graph, or an explicit retraction.

A commit stores a complete effective-time map for **one tenant and one authorized validation scope**. A scope is an adapter-defined business population with its complete dependency closure. Every mutable relationship and value is read from the same selected graph. `Record.createdAt`, event occurrence, receipt, invoice issue and forecast issue times retain their separate meanings. They never substitute for commit recording time.

Selection first chooses the latest commit with `recordedAt <= knownAt`, then its slice with `validFrom <= validAt < validUntil`. A missing end is unbounded. The system-time end is the next commit's recording time; earlier commits are never edited to populate it. A retracted interval returns `Retracted`; an uncovered interval or time before the first commit returns `Unavailable`. `TemporalSnapshotSelection` can express these outcomes and B184 validates its pointers, scope, times and state.

All instants require a timezone and at most microsecond precision. The adapter normalizes them to UTC, rejects excess precision instead of truncating it, rejects future knowledge requests and records writes using its trusted clock. Equal recording instants require retry; sequences do not secretly break an ambiguous time tie.

## Whole-model application

[`model/temporal-policy.json`](../model/temporal-policy.json) classifies every class, and the generated [class inventory](temporal-coverage.md) displays that policy alongside local time fields and interval links. CI requires exact catalog coverage and checks every owned-link name against its class contract.

| Policy | Meaning |
|---|---|
| abstract | A vocabulary superclass; concrete instances inherit the applicable contract |
| tenant-context | The tenant identity bounds history; business snapshots retain their own tenant details |
| snapshot-versioned | Scalar state, relationships, events and projections are retained inside immutable payload graphs |
| immutable-aggregate | In addition to immutable graph history, an existing aggregate IRI cannot acquire changed frozen content in a later write |
| history-metadata | Trusted commits, slices, selections, watermarks and stream policy are separate from submitted business payloads |

This representation applies equally to topology, ownership, membership, grants, consent, configuration, sessions, tax, benefits, ledger state, forecasts and process evidence. It does not require four timestamps on every value object. Domain validity fields still constrain applicability inside a selected slice; effective applicability is their intersection with the slice, not a replacement of domain bounds.

Snapshot conformance requires declared reference closure. Population completeness beyond those references is an explicit producer/adapter obligation, attested by checkpoints; SHACL cannot prove that an external source omitted no records. Scopes must include complete inverse populations used by aggregate rules, such as all coincident allocations. Exported history is privileged evidence. Applications must authorize tenant, scope and historical access before constructing the adapter or returning an export.

## Historical joins and immutable evidence

Validate each selected graph independently, never the union of every graph in the history dataset. All decision inputs in one evaluation share that graph. The access regression records a permit against its original enabled principal and active grant, then records a denial after revocation. Both historical snapshots remain valid. Mixing the old permit with today's disabled principal remains rejected by B157. Historical read permission does not authorize an action today.

The owned-link map specifies which dependencies form a frozen aggregate. Tariffs include price components, conditions, tax rules, tiers, recurrence exceptions, dynamic-price schedules, disclosures, currency and rounding. Corporate policy snapshots include their policy rules. CDRs include their usage interval and selected tariff. Rating includes its selected tariff, resolution and rated lines. Issued invoices include lines and captured billing details; posted journals include journal lines. Ordinary reference identities stay in the digest without recursively freezing unrelated live entities. Their historical contents are nevertheless retained in the complete immutable payload graph.

The writer recomputes every supplied `snapshotDigest`; it never repairs an invalid submitted digest. Frozen roots remain registered after removal or retraction. Changing a nested component while recomputing its claimed digest still fails under the existing root IRI. Replacement immutable versions need new IRIs. Issued invoices and posted journals may advance their explicitly exempt lifecycle metadata, but cannot be rewritten or reopened as drafts. Financial correction still uses the existing credit, replacement and reversal contracts; a temporal correction does not rewrite an originally issued bill.

The digest profile is SHA-256 over sorted RDFLib-canonical triples with blank-node canonicalization, plain-string normalization and exact decimal lexical normalization. It preserves decimal precision independently of the Python decimal arithmetic context. This is the pinned **ChargeWeave value-canonical profile**, not W3C RDFC-1.0. External evidence file hashes are declarations until an artifact adapter verifies the actual bytes.

## Corrections, concurrency and projection completeness

`tools/temporal_store.py` supplies an executable in-process writer. A successful commit atomically appends metadata and an immutable payload after validation and compare-and-swap against `expected_head`. A stale head, changed immutable root, conflicting duplicate, incomplete checkpoint or regressing recording time leaves the dataset unchanged. Repeating an identical event key returns its original commit; reusing that key with different content fails.

A replacement splits only the affected business interval, preserves unaffected left/right portions and coalesces adjacent identical payloads. Retraction inserts a tombstone slice. Subsequent corrections can replace it without deleting earlier evidence. The fixture includes an original May price, a whole-month backdated correction, a correction limited to 15–20 May, and a withdrawal for 18–19 May.

Each source partition has an offset, complete-through cutoff, observed watermark and lateness allowance. Partitions cannot disappear; offsets and complete-through values cannot regress; duplicate partitions and future observations fail. Reads can require minimum source offsets and a complete-through cutoff, rejecting stale projections. B178/B179 also validate chain and checkpoint relationships in exported metadata.

The semantic digest pins the DSL, business/lifecycle/temporal policies, query templates, generators, validator, integrity code, writer and dependency pins. A different semantic digest requires its original adapter for replay. New imports must state their mapping version; do not label a newly projected legacy snapshot as knowledge that existed before import.

## Domain interval and overlap rules

| Contract | Enforcement |
|---|---|
| Session segments | B173 contains every charging interval within its parent session |
| Entitlements | B114 requires the full active entitlement within its active agreement; a bounded agreement cannot back an open-ended entitlement |
| Tariff selection | B174 rejects overlapping versions of one tariff identity in the same online selection pool, including its default |
| Credentials | B181 prohibits overlapping assignments of one credential; adjacency is allowed |
| Resource reservations | B183 rejects overlapping confirmed bookings of one charging unit |
| Shared power | B182 sums all coincident allocations against cabinet capacity, counting a shared start instant only once |
| Calendar dates | B175 validates actual Gregorian dates, including leap-century rules |

Overlap policy follows the business key and selection context. Multiple tariff versions can remain in immutable financial evidence; that alone is not a live selection conflict. The original duplicate-tariff probe now explicitly puts both versions into one selection pool. Distinct tariffs, forecast series, parallel offers and separately scoped rules can legitimately overlap. Existing owner-share, membership, tariff priority, tax applicability and period rules continue to apply; no universal ban on overlapping records is introduced.

## Calendar, streams and forecasts

Date ranges use inclusive calendar endpoints; resolved UTC intervals are half-open. Recurrence weekdays are Monday=0 through Sunday=6. Expansion uses the pinned `tzdata==2026.4` package directly, independently of the host timezone database. The default fold policy selects the earlier occurrence; the default gap policy rejects nonexistent wall time. Explicit alternative policies are `later`/`reject` for folds and `skip` for gaps. Overnight windows and exclusion interval subtraction are tested across Amsterdam's spring and autumn transitions.

`TemporalStreamPolicy` distinguishes lateness allowance, replay horizon, late-event disposition and duplicate policy. `classify_event` returns acceptance, correction or quarantine. Clock-ahead events and events beyond the retained replay horizon are quarantined. A source clock assessment must resolve their timing before reprojection. A late correction is appended with its actual recording time. Interval union prevents double counting overlapping downtime or usage windows.

The forecast query binds the forecast target and a future horizon instant separately from `knownAt`. It selects only versions available in the chosen snapshot and excludes issue times beyond the knowledge cutoff. Tests retain different predictions for the same future target when queried at different knowledge times.

The reference writer retains all history and does not implement destructive retention. Deployment must preserve replay inputs, receipts, schema versions and timezone rules for its promised horizon, and apply the existing retention/legal-hold/disposition contracts to archived payloads and backups. If required evidence is unavailable, replay must report unavailability rather than reconstruct an invented original answer.

## Executable queries, viewer and acceptance evidence

```bash
python tools/build_all.py
python tools/test_temporal.py
python tools/audit_temporal.py
python tools/check_generated.py
```

The generated `queries/temporal/` directory contains point selection, history, overlap, a scoped tariff query and forecast selection. `TemporalStore.changes` computes added/removed triples between knowledge snapshots. Its query method binds `validAt` and `knownAt` to the selected context and prevents external datasets, history-graph joins and federation. It is a reference API for trusted application queries, not a public arbitrary-query sandbox.

`examples/temporal/tariff-history.trig` is a reproducible RDF dataset. `model/temporal-example.json` includes its commits, intervals, graph identities, exact payload triples, validation status, digests, checkpoints and 63 results computed by executing standard SPARQL. The viewer reads that fixture, displays both time axes and exposes the selected evidence. A separate JavaScript selector is checked against every SPARQL result during website build. Desktop/mobile browser tests exercise correction, partial correction, retraction, interval boundaries, query disclosure and evidence display.

| Review finding | Closure evidence |
|---|---|
| T01 shared temporal identity and queries | Five history classes; tests 01–04, 16, 21, 25, 28 |
| T02 historical joins | Historical access/current revocation test 15; selected-graph query boundary test 14 |
| T03 immutable content and writes | Digest/aggregate tests 05, 10–12, 22, 30; strict full-graph digest probe |
| T04 correction and retraction lineage | Tests 01–03, 06–07, 17, 24, 27 |
| T05 interval containment | B114/B173 positive reference, deliberate negative fixtures and strict full-graph probes |
| T06 selection and overlap | B174/B181/B182/B183 negative fixtures; boundary test 29 and the live selection-pool probe |
| T07 coherent projections | Tests 08–09, 13, 23, 25, 28; B178/B179 |
| T08 calendar and DST | Tests 04, 18–19, 22, 29; B175 and pinned timezone integrity |
| T09 streams and prediction | Tests 06, 17, 19–20, 26–27; checkpoint and stream policies |
| T10 viewer | Generated RDF-derived evidence, 63 cross-implementation comparisons and desktop/mobile browser checks |

The temporal audit now **fails unless all five original fault classes are rejected by the intended validator**. Its controls remain independent. The reference writer suite, full model gates, generated artifact consistency and browser checks are required in GitHub Actions. Verified packages require their fresh reports.

## Deployment boundary and migration

The reference adapter uses a process-local lock and memory. TriG export demonstrates persisted read/replay; it does not implement a durable writer restart, transactional database, multi-process compare-and-swap, receipt recovery, authorization service, stream connector or production retention. A deployed adapter must preserve these semantics and pass additional database transaction, concurrency, recovery and performance gates. Do not point production traffic at this reference implementation.

For 1.1.1 migration, recompute aggregate digests using the new explicit profile, correct impossible dates and interval violations, resolve conflicting live selections, and retain originals as evidence where a correction is required. Import each complete scope in a new commit with its real import time and source checkpoint. Never fabricate historical knowledge times. Existing business IRIs and the development namespace remain stable. A native SPARQL-T integration and the product proposition can be addressed after this contract.
