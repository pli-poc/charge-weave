# Client runtime implementation and acceptance scope

Implemented 2026-10-13, starting from `d335489c3828f11d660c31752b4a6b95374426a5`.
First implementation commit: `cd6d1de7c4f0236096d1188b9da81331e395c550`. Acceptance/refinement commit: `83ec0470393868032c06f690c6afec4e30134009`. Its [protected-build browser and deployment run](https://github.com/pli-poc/charge-weave/actions/runs/38363769418) passed and published successfully. Subsequent integrity refinements are verified by their own commit-bound run.

## What is now connected

`model/client-*-profile.json` and the existing catalogue, rules, analytical profile and XFlow contract generate one application package. Its digest includes semantic inputs, runtime code, compiler and dependency lock. Both application builds generate this package before bundling. The shared private `client-runtime` package provides the existing XFlow compiler, profile normalizer, analytical evaluator, temporal selector, standard local GraphQL execution, validation helpers and browser checkpoint adapter. ChargeWeave command behavior lives under `src/profiles/chargeweave/`.

My work now renders generated task descriptors and submits its correction through local GraphQL and a shared application service. The service checks scope, field constraints, evidence reference, meter order, revision and retry identity. It sends the evidence and validation events into the existing correction workflow, preserving its verification/readiness/rating steps, then maps the operator's accepted decision to `approval.granted`. Only a successful stable terminal outcome commits the local records, history, receipt and actor snapshot. Failures do not partially commit. The developer local-workspace page restores and inspects the same saved instance.

The model/API projection is deliberately small: site and session reads, task metadata and submission, analytical query/results, and historical tariff selection. Other console screens remain on their existing providers; the site-to-revenue demo is explicitly not migrated.

## Persistence contract

Save workspace writes a complete stable checkpoint in one IndexedDB transaction with an expected storage revision. Save does not persist unsubmitted form drafts. A pending command blocks checkpoint capture. Imports verify package identity, checksums and business/process consistency before replacing in-memory state. Two tabs cannot overwrite each other's saved revision. Export/reset is available for incompatible packages. Cached old package metadata is retained in the checkpoint, but executing old JavaScript is not supported: a different runtime digest requires explicit export/reset or a future reviewed migration. No silent upgrade occurs.

The first slice checkpoints the initial task or a completed correction. It does not expose a persistable mid-activity/approval wait. The existing developer workflow tests continue to verify waiting-actor restoration and named deadline delivery; those capabilities are not claimed as continuous checkpoint recovery in My work. No browser timer is expected to run while closed.

## Rule support

No general-purpose rule engine was added. Named browser checks are registered and invoked once at the command boundary. Generated `rule-support.json` lists canonical B-rules as reference-only and identifies related browser checks without claiming full SHACL equivalence. Missing required evaluators block the command. The Python/SHACL pipeline remains authoritative for complete semantic reference validation.

## Numerical and temporal audit

The migrated meter calculation uses integer fixed-point arithmetic (0.001 kWh; tariff precision up to 0.00001 EUR/kWh; cent rounding, half away from zero). GraphQL Decimal inputs are strings. The existing financial analytics is unchanged Number-based fixture arithmetic and is explicitly labelled as such; Float results are not claimed to be fiscal-exact decimals. Ratio-of-sums, source population, unavailable results, ranking, knowledge cutoff and evidence survive the GraphQL projection unchanged.

The tariff reader is read-only and tested against all 63 committed Python/SPARQL reference selections. Its graph/slice identity remains in the result. The correction history is not a full temporal writer, and operational corrections do not modify the separate synthetic yearly analytics population.

The generator-produced `tests/client-contract/schema.graphql` is a review snapshot, never an editable semantic source. After reviewing an intended API change, regenerate it with `npm run generate --prefix client-runtime -- --update-schema-snapshot`. CI records the schema diff and rejects unreviewed drift.

## Verification

- Existing 23 console and 31 website/model contracts remain in use.
- New runtime contracts cover generated input changes, unresolved identities, weakened required fields, unknown rules/handlers, a neutral document-review package, typed GraphQL, revisions, duplicate commands, invalid evidence, exact rating, coherent restore, package mismatch, storage conflicts and analytic/temporal parity.
- Browser acceptance covers rejected evidence, accepted correction, explicit save, reload, desktop/mobile layout, absence of business network requests and shared developer inspection.
- The deployment workflow generates, checks and tests the runtime before both consumers and uploads package/schema/capability artifacts with browser evidence. The protected assembled build is the browser-test target.
- First GitHub browser run: new Work persistence cases passed in both viewports; analytics controls exposed ambiguous accessible names. Explicit filter labels were corrected; the next full browser run passed.

The separate ontology run exposed a pre-existing temporal fixture mismatch: removing writer-owned ProjectionWatermark records left AnalyticalExecution/AnalyticalResult records with broken mandatory references. The payload fixture now excludes that dependent execution evidence together with trusted metadata; analytical definitions and all business-module coverage remain. Full reference-graph validation is unchanged.

## Deliberate limits

Syntriq is unchanged. No backend, database engine, live protocols, production identity, generic OWL reasoner, arbitrary SPARQL executor, cross-device synchronization or multi-user service was introduced. The semantic modeler roadmap remains separate. This is the first connected client slice; it does not claim the entire application is converted.
