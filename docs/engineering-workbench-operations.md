# Running the engineering workbench

Open `/developer/workbench/` in the deployed application. Select ChargeWeave or Document review, choose a scenario, seed and supported virtual clock, then run checks. Each run starts with synthetic state and records replay inputs, candidate identity, assertions, output and trace.

The model view edits supported JSON contracts in an overlay. Apply, compile and rerun. A required unknown handler/rule blocks compilation or execution. Undo restores the pinned baseline. Ontology/Python builds and arbitrary generated JavaScript require an external build provider; the workbench does not evaluate them in the browser.

The context view shows the curated catalogue and selected source hashes. The AI view's scripted adapter retrieves sources and executes the selected scenario through the same broker. Plans, findings, provider continuation and unrun checks remain inspectable. Use explicit draft saving; assisted turns checkpoint stable boundaries automatically. An interrupted candidate write must be inspected before retrying. Different runtime packages require export/reset rather than a silent upgrade.

## Live AI connection

The Node relay can run with Node 24 or from the supplied Dockerfile. Copy the configuration example into an untracked local environment and supply the service OpenAI key, a strong workbench access token, allowed origins and allowed model names. Run `node --env-file=ai-relay/.env ai-relay/server.mjs`, or inject those values into the container environment. Put a deployed relay behind an HTTPS gateway; configure gateway identity and distributed quotas when scaling to multiple replicas. Its built-in quotas are per process and its token is a deployment access credential, not multi-user identity.

In Providers, enter the relay's `/ai` base URL, enabled model and session access token. Check connection, then select OpenAI in the AI view. Session credentials stay in component memory and are absent from draft storage and evidence exports. The relay forwards only enabled function-tool requests to its fixed OpenAI destination. Extra selected MCP function names must be explicitly enabled through `WORKBENCH_EXTRA_FUNCTIONS`.

Provider caching and compaction default off at the relay. Enable only after confirming the deployed model's feature access. The adapter negotiates those flags and uses them only when supported. Compaction replaces the provider continuation window; the readable task journal, source constraints, actual evidence and candidate revision checks remain separate. Cache misses use ordinary requests. Optional Decisions and semantic retrieval are not required by the baseline.

## External reads and independent verification

Discover a compatible MCP endpoint, inspect its pinned catalogue, then register only selected read tools permitted by the endpoint's grant. This revision uses request-scoped metadata rather than the old initialize/session flow. Unsupported protocol/schema combinations fail visibly. Authorization stays in memory; reconnect after reload. This is a bounded adapter profile, not complete MCP conformance.

Check deployed commit retrieves the verification record emitted after successful CI gates. It must match the source repository, commit and selected package digest. Local overlays normally differ from the deployed digest and cannot borrow its passing evidence. Full semantic/reference checks remain on the established Python/SHACL pipeline or a separately configured provider.

CI regenerates contracts, tests runtime and relay behavior, evaluates curated source recall, builds and protects both applications, runs desktop/mobile acceptance, and emits the exact-commit record. Inspect the GitHub workflow on each actual source commit before calling a milestone released.
