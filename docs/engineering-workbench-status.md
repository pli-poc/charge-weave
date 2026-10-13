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

## Verification and limits

Runtime contract tests exercise actual services, negative cases, stale source rejection, deterministic replay, damaged evidence, isolated persistence, interrupted streams, opaque continuation and credential separation. Browser tests exercise the assembled workbench in desktop/mobile projects. The existing deployment workflow runs these gates, including relay tests.

The live relay must be deployed with service credentials and allowed model/features before live AI can be tested. No live paid request or remote deployment is claimed. Optional decisions, embeddings, hosted execution and WebSocket optimizations remain measurement-gated upgrades. External full-semantic verification, MCP adapters and the complete neutral application are the next implementation increments. CI status belongs to the actual pushed commit, not this document.

See the original E1–E6 plan, C1–C6 context increments and OA1–OA7 OpenAI integration sequence for acceptance boundaries. Browser assertions cannot promote a candidate to released status.
