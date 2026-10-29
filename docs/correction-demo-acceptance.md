# Correction demo: acceptance evidence and boundaries

The scenario is synthetic. Its starting point is a loaded completed CPO session and original CDR, not a live charger session or a driver invoice. The pinned readings yield 10.600 kWh and 9.100 kWh, with a tax-inclusive illustrative EUR 0.32/kWh tariff and no separate fees. Independent expected amounts are EUR 3.39 and EUR 2.91, a EUR -0.48 net adjustment. Simulated role switches are not authentication.

| Case | Evidence or current boundary |
| --- | --- |
| C01 | Approval restore scenario and GraphQL command tests cover waiting, approval and linked effects. |
| C02 | Missing-billing harness scenario and runtime tests cover the named wait, restore and supplementation. The normal console fixture has complete billing inputs. |
| C03 | Harness scenarios cover invalid declared signature and wrong register epoch. These are fixture outcomes, not live trust validation. |
| C04 | Reversed reading validation and harness scenario. |
| C05–C06 | Independent harness cases cover no-change and below-threshold automatic correction. |
| C07–C09 | Decision, timeout and idempotency tests; browser scenarios cover rejection and deadline restore. |
| C10 | Browser-checkpoint compare-and-swap two-client test; stale command tests. |
| C11 | Actor and approval restore, package digest and browser reload tests. |
| C12 | Partner acknowledgment adapter is not implemented. Delivery is labelled unavailable; delay, rejection and retry are unsupported. |
| C13 | Checkpoint integrity and package mismatch tests. |
| C14 | Required evaluator failure is tested on both preparation and approval. |
| C15 | The single case uses the shared operational aggregator. Unit coverage checks distinct multiple cases, tasks and adjustments against independently specified counts and amounts. |
| C16 | Operational projection and historical network analytics use different sources; full browser parity still requires review. |
| C17 | Operations cards filter the queue, open the same case and preserve the filter on return; a browser journey is provided for exact-commit verification. |
| C18 | Unit coverage checks deduplication, multiple tasks, signed exact adjustment, empty states and mixed-currency rejection. |
| C19 | Projection is derived after workspace restore; saved layout is not used as business state. |
| C20 | Shared chart/table captions accept subject count metadata and retain the historical site-day default. Existing network tests run independently; visual review remains outstanding. |

The engineering harness records scenario ID, seed, clock, package identity, assertions and unsupported capabilities. Existing partner delivery is not settlement, and the separate full-year network population does not change when this single case changes. Browser and visual acceptance must be evaluated against the exact protected commit; this document does not assert a passing release.
