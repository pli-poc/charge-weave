# ChargeWeave platform design principles and high-level architecture

**Architecture level:** High-level design (HLD)

**Status:** Logical target architecture. The ontology, shapes, declared rules and browser demonstrations are available; production services, authorization, durable orchestration and live integrations remain proposed work.

This is the canonical HLD for platform-wide responsibilities and design principles. The website's [Architecture page](https://pli-poc.github.io/charge-weave/architecture/) presents the business-level overview. The [Developer guide](https://pli-poc.github.io/charge-weave/developer/) expands individual runtime boundaries without changing the HLD.

## Platform design principles

1. **Share business meaning across bounded capabilities.** Use stable identifiers, domain terms and relationships to connect service-owned records and partner exchanges. Keep each capability responsible for its own policy, transactions and operational decisions.
2. **Validate changes at the boundary that owns them.** Use SHACL for explicit graph and payload constraints, plus deterministic domain rules for business invariants. Validate against the affected records and required reference closure; keep full-tenant analysis off the real-time path.
3. **Let workflows orchestrate; let domain services own effects.** Versioned XFlow definitions describe process sequence and outcomes. The XState host selects transitions and invokes registered capabilities; business services authorize and perform the authoritative change.
4. **Preserve evidence and explain the history.** Retain source identity, correlation, event time, recorded time and provenance. Represent corrections as linked assertions or compensating records so prior decisions remain reconstructable.
5. **Make writes transactional and replay-safe.** Couple a committed business change with its outbox intent where possible. Use idempotency, expected revisions and reconciliation so retries and duplicate events do not repeat business effects.
6. **Enforce identity and tenant access at service boundaries.** API and data-store authorization controls each read or write. A tenant fact in RDF records ownership metadata; it does not grant permission. Keep credentials in a secret manager.
7. **Choose storage by workload and expose projection freshness.** Use stores with suitable transaction, history, evidence or measurement guarantees. Semantic and analytical projections carry source revisions and watermarks so consumers can distinguish a complete view from an in-flight one.
8. **Keep protocol and infrastructure edges replaceable.** Version external adapters and storage ports, map exchanges to canonical events, and switch one boundary at a time. Use deterministic synthetic journeys to prove behavior before enabling live systems.

## Logical platform architecture

Use the ontology as the shared semantic contract across services. Use explicit shapes and rules for validation. Do not require the real-time charger path to wait for global OWL classification or a whole-tenant SPARQL scan.

```mermaid
flowchart TD
    D[Chargers and meters] --> A[Protocol adapters]
    X[Roaming and payment partners] --> I[Integration adapters]
    A --> E[Durable event stream]
    I --> E
    E --> S[Session and authorization services]
    E --> O[Operations and energy control]
    S --> B[Rating, billing and settlement]
    B --> L[Transactional ledger]
    S --> G[Semantic graph projections]
    O --> G
    B --> G
    G --> V[SHACL validation and analytics]
    U[Operator and driver channels] --> Q[Authorized application APIs]
    Q --> S
    Q --> O
```

## Generic workflow subsystem

The workflow layer is generic orchestration infrastructure. XFlow defines versioned process definitions and step contracts; a ChargeWeave profile binds those steps to CPO/CSMS concepts, roles, obligations and rules. The business ontology remains independent of XFlow and XState.

```mermaid
flowchart LR
    A[Author XFlow definition] --> B[Validate definition and profile]
    D[ChargeWeave business ontology] --> B
    B --> C[Compile supported graph]
    C --> E[XState actor host]
    R[Allowlisted capability registry] --> C
    E --> F[Adapters and stores]
    F --> G[Business outcomes and evidence]
    E --> H[ProcessExecution, ProcessStep, StateTransition]
    G --> H
```

Validation has separate responsibilities. XFlow SHACL shapes check the workflow vocabulary and profile structure; profile bindings must resolve to the business terms used by that journey. OWL supplies domain meaning and relationships, while explicit SHACL and deterministic runtime rules check required structure and business constraints. Passing validation does not prove that every failure, duplicate, timeout or recovery case is covered.

Only supported, serializable workflow definitions compile. The definition names registered activities, guards, actions and delays; it does not contain executable JavaScript or infrastructure credentials. The host resolves those names through its allowlisted registry and supplies adapters, clocks, persistence, authorization and scheduling. The browser Studio is a deterministic simulation host; durable backend execution and scheduling remain future work.

## Service contracts

| Service | Writes | Essential behavior |
|---|---|---|
| Device gateway | SourceEvent, ProtocolTransaction, CommandOutcome, observations | Device identity, versioned protocol parsing, correlation, deduplication, offline replay |
| Asset registry | Sites, stations, units, connectors, topology and capabilities | Commissioning, ownership, configuration versioning and compatibility |
| Authorization | Requests, decisions, credentials, reservations | Explicit policy evaluation, local/offline decisions, bounded validity and audit |
| Session orchestrator | Sessions, intervals, event chronology, finalization evidence | Idempotent lifecycle transitions and reconciliation of incomplete sessions |
| Pricing/rating | Resolved tariff versions, rated lines and calculations | Deterministic replay, currency precision, pricing precedence, tiers and tax evidence |
| Payments | Intents, holds, captures, refunds, disputes | Provider idempotency, confirmed outcomes, retry reconciliation and tokenized instruments |
| Ledger/settlement | Journals, partner allocations, payouts and reports | Balanced postings, immutable history, corrections and financial reconciliation |
| Roaming | Module agreements, exchanges, publication and external CDRs | Contract negotiation, sync cursors, bounded retries and command-result correlation |
| Energy control | Constraints, schedules, applications and flexibility delivery | Physical safety envelopes, phase awareness, stale-data fallback and local limits |
| Operations | Issues, recovery attempts, work orders, uptime results | Alert policy, safe recovery, maintenance evidence and reproducible availability calculations |
| Customer/business services | Accounts, subscriptions, benefits, agreements and reimbursements | Historical policy selection, bounded entitlements and audited cost allocation |
| Platform services | Principals, access grants, integrations, events and consent | Tenant isolation, authorization on every write, secret management and delivery auditing |

## Storage choices and transaction boundaries

Keep immutable protocol/event envelopes and evidence artifacts in durable stores. Store financial journals and concurrent mutable write models in systems with appropriate transactional guarantees. Retain high-rate measurements in time-series storage when warranted; the graph can describe observation batches and retained evidence without duplicating every telemetry point.

Project canonical RDF records into tenant-scoped graphs for validation, knowledge queries and integration. The projection should include a watermark and source revisions so consumers can distinguish a complete snapshot from an in-flight update. Run local shape checks before accepting writes, and run affected-neighborhood business checks with the required reference closure. Batch full-tenant audits at explicit projection watermarks.

Grant access at the API and data-store boundaries. A `tenant` triple records ownership; it is not an authorization mechanism. Store references to secrets in the graph, with actual credentials controlled by a secret manager. Never place card numbers, bearer tokens or private keys in canonical identifiers or public RDF documents.

## Protocol mapping policy

Pin version-specific adapters. OCPP 1.6 and OCPP 2.0.1 are different wire contracts; OCPP 2.1 adds additional capabilities. Keep source connector/EVSE addressing and boot-scoped transaction identifiers in the adapter and external identifiers. Map them to canonical station/unit/connector identities without assuming an OCPP 1.6 connector ID is a globally unique EVSE identity. [OCA protocol overview](https://openchargealliance.org/protocols/open-charge-point-protocol/)

The EVRoaming Foundation identifies OCPI 2.3.0 as the current published version and includes optional booking and payment-terminal modules. Negotiate modules explicitly; an active connection does not imply support for every module. The model does not claim implementation or certification of OCPI, OICP, ISO 15118 or OpenADR. [OCPI overview](https://evroaming.org/ocpi/)

## Recovery sequence

For a missing stop event, retain the source gap, obtain subsequent meter or partner evidence, create reconciliation records, and finalize with an explicit basis and completeness classification. Do not invent device confirmation. Rating and settlement should reference the finalized evidence version, and later corrections should create a correction lineage with compensating financial records.

For a payment timeout, query or reconcile provider state using the original idempotency key before retrying collection. For a remote-command timeout, distinguish unknown physical outcome from an explicit rejection. For a stale energy meter, apply a defined local/edge fallback; a cloud schedule cannot guarantee electrical safety during loss of communication.

## Detailed design references

- [XFlow workflow model and XState runtime](xflow-workflow-model.md)
- [Semantic design and ontology boundaries](semantic-design.md)
- [Validation guide and trust boundaries](validation-guide.md)
- [Temporal data contract](temporal-contract.md)
- [Business-domain audit and implementation boundary](business-domain-audit.md)
