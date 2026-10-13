# Engineering workbench implementation ledger

The source implementation now provides a browser engineering workspace at `/developer/workbench/`. The canonical implementation remains in ChargeWeave while the generic contracts are proved against a second application.

## Delivered source scope

- Versioned capability descriptors, bounded schema validation, explicit grants, serialized execution, invocation receipts and a journal.
- Curated, content-hashed source catalogue; exact/lexical/dependency retrieval; source reads, context inspection and cache invalidation.
- Reversible JSON candidate overlays with revision/hash checks, a pure browser-compatible compiler, supported-preview generation and blocked unsupported rules.
- Scenario adapters around the real correction service and existing protocol simulator: accepted, bad-evidence, reversed-meter, stale-revision, duplicate and stable-checkpoint cases plus five protocol cases.
- Replayable SHA-256 evidence, comparable pinned inputs and independent browser-contract scope. Protocol simulation retains its existing fixed clock, explicitly labelled in the scenario selector.
- Six browser views, a separate IndexedDB engineering store, explicit save/restore and multi-tab conflicts. Stored provider continuation and task decisions are separate from business checkpoints. Access tokens stay in memory.
- XState task coordinator, bounded steps/calls/tokens/time, cancellation, scripted end-to-end tool loop and streaming Responses adapter with strict function tools and structured final results.
- Credential-holding Node relay, origin/identity checks, model/tool allowlists, request/concurrency quotas, fixed upstream destinations and output limits. Docker image and configuration example are supplied; CI uses mocked upstream responses and requires no secret.
- A complete synthetic document-review application manifest with its own namespace, four generated task descriptors and commands, submit/review/request-changes/resubmission, simulated role checks, exact revisions, idempotent receipts and waiting-task checkpoints. The same generic host, compiler, GraphQL and workbench contracts run both packs. The host fixture is independent of the eventual Syntriq UI.
- Selected MCP reads through a bounded, pinned 2026-07-28 Streamable HTTP adapter: request metadata, JSON/SSE responses, schema validation, catalogue-change rejection and explicit tool selection. Legacy sessions, unsupported schemas, elicitation and durable tasks are not silently emulated.
- Exact-commit verification from the deployed CI evidence endpoint, with package identities for both applications. Wrong repository/commit/digest is rejected; skipped checks remain missing. This is deployment evidence, not a cryptographic signature or full production certification.
- Small initial AI tool menu with local capability discovery, deterministic context-cache keys, optional provider prompt caching and threshold-triggered compaction. Usage and cached-token fields retain actual provider values. A five-query source-retrieval evaluation reports required-source recall and cold/warm timings without claiming live-model acceleration.

## Verification and limits

Runtime contract tests exercise actual services, negative cases, stale source rejection, deterministic replay, damaged evidence, isolated persistence, interrupted streams, opaque continuation and credential separation. Browser tests exercise the assembled workbench in desktop/mobile projects. The existing deployment workflow runs these gates, including relay tests.

The live relay must be deployed with service credentials and allowed model/features before live AI can be tested. No live paid request or remote relay deployment is claimed. Optional decisions, embeddings, hosted execution and WebSocket optimizations remain measurement-gated upgrades. Full Python/SHACL reference/build providers need a compatible authorized endpoint; the MCP adapter is tested against fixtures, not a claimed connected service. Adopting the generic host in the actual Syntriq UI and migrating the other ChargeWeave console journeys remain separate implementation work. CI status belongs to the actual pushed commit, not this document.

The first workbench commit's CI run passed 54/56 browser checks; two new selectors timed out because the Scenario label included option text. Explicit accessible selector labels correct that failure. Existing correction and the new candidate/assisted journeys passed on desktop and mobile. The neutral journey and the corrected selector are checked by the next commit's pipeline.

The second milestone passed 56/58 browser checks, including both neutral application journeys and studio replay/storage. The remaining test assumed that the task profile was the first editor source; it now explicitly selects that profile, matching the intended user action. Subsequent release evidence records the final commit's actual results.

See the original E1–E6 plan, C1–C6 context increments and OA1–OA7 OpenAI integration sequence for acceptance boundaries. Browser assertions cannot promote a candidate to released status.
