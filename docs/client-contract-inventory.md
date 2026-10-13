# Client contract inventory

Baseline: `d335489c3828f11d660c31752b4a6b95374426a5` (2026-10-13 inspection).

## Existing consumers

| Consumer | Current boundary | Migration scope |
|---|---|---|
| Sites, sessions, roaming, activity, entities, finance | console provider synthetic reads | Local typed site/session reads first; other reads retained |
| Analytics panes | queryAnalytics / analytical profile / year fixture | Preserve provider results and expose typed query/result contract |
| Work correction | work-model descriptors and direct app.js writes | Generate descriptors, shared command validation and XFlow projection |
| Site-to-revenue journey | app.js data-cpo-submit handlers | Remains an explicitly separate synthetic demonstration |
| Developer simulation | correction-workflow + flow-engine | Reuse compiler and existing correction definition |
| Historical tariff fixture | selectFixture + generated temporal fixture | Read-only bounded validAt/knownAt adapter |
| Theme, panes | localStorage preferences | Not business checkpoints |

## Supported execution and exclusions

XFlow supports eventWait, serviceTask, decision, humanTask and end. Registries use own-property allowlists; named deadline events are host-delivered. Existing tests cover restoration. No parallel/join/compensation or arbitrary expression execution is introduced.

Analytical filters are Equal/In, with explicit pre/post aggregation semantics, ratio-of-sums, knowledge cutoffs, completeness checks and stable ranking. Financial analytics retains its existing Number-based representation; no new exact-financial-analytics claim is made. Exact decimal arithmetic is required for the migrated correction calculation.

Temporal tariff fixture selection remains read-only and checked against Python/SPARQL reference outputs. Operational correction records and yearly analytical facts are separate populations: a correction does not mutate unrelated dashboard totals.

## Task binding decisions

The old `ChargingSession.meterEndReading` and `RecordCorrection.reason/sourceEvidenceReference/operatorNote` strings are illustrative, not canonical properties. Meter end and evidence locator are explicitly command inputs; reason/note use canonical RecordCorrection.correctionReason metadata where applicable. No ontology terms are invented. Evidence acceptance requires the known synthetic evidence reference and fixture verification flags, rather than accepting arbitrary text as verified evidence.

## Contract scenarios

Preserve existing console tests and flow-engine/task-form tests as baseline evidence. Add end-to-end command scenarios: valid correction, malformed input, missing evidence, stale revision, duplicate retry, reused key with changed payload, denied principal, workflow rejection/timeout, stable checkpoint restore, package mismatch and storage conflict. Unsupported required rules must block mutation. Small document-review fixture proves core independence.

## Browser capability scope

Structural field validation and explicit registered command rules only. Python SHACL remains the full reference validator; browser execution does not claim full SHACL or OWL reasoning. Auth is simulated, storage is local, no live protocols or financial writes.
