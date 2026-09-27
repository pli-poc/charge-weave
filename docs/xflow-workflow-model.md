# XFlow workflow model and XState runtime

**Status:** Architecture proposal for the ChargeWeave demo and first runtime  
**Scope:** User-configurable business workflows, browser simulation and a later backend host

## Decision

Use XState v5 as the statechart and actor runtime. Keep the editable workflow definition in a small, versioned XFlow contract, validate it against a separate generic XFlow ontology and SHACL shapes, then compile the validated definition to an XState machine.

XFlow is a cross-cutting process-definition layer. It is not part of the CPO/CSMS vocabulary. A ChargeWeave workflow profile binds generic steps to existing business concepts, roles and rules. The existing ChargeWeave process records remain the canonical business and audit record.

The first browser demo and a later backend host use the same workflow definition, compiler, machine logic and typed ports. They select different adapters and persistence implementations.

~~~mermaid
flowchart TB
    X["Generic XFlow definition ontology"]
    D["ChargeWeave CPO/CSMS ontology"]
    P["ChargeWeave workflow profile<br/>J07/J08 bindings"]
    V["SHACL and schema validation"]
    C["Compiler and allowlisted registry"]
    R["XState actor host"]
    A["Virtual or real adapters"]
    S["Process store, event log and timer service"]

    X --> P
    D --> P
    P --> V
    V --> C
    C --> R
    R --> A
    R --> S
~~~

## Ontology placement

Use a separate XFlow namespace and ontology IRI. The exact production IRI must follow the repository's namespace policy; the prefix xflow below is illustrative.

The generic XFlow ontology describes workflow definitions:

| Definition concept | Meaning |
|---|---|
| WorkflowDefinition and WorkflowVersion | Stable identity, immutable published version, lifecycle status, digest and compatibility level |
| StepDefinition | A named step and its kind, input/output contract and semantic bindings |
| TransitionDefinition | Source and target steps, event or result, optional guard and priority |
| TriggerDefinition | Starting event, schedule or explicit user request, including correlation rules |
| ServiceTask | A named operation reference resolved through an allowlisted adapter registry |
| HumanTask | Responsible role, task data, completion events, deadline and escalation policy |
| WaitForEvent and Timer | Correlated event waits and durable deadlines |
| Decision | Pure named guard or rule reference; it cannot perform side effects |
| Parallel and Join | Bounded parallel work and the condition that allows the workflow to continue |
| RetryPolicy and CompensationPolicy | Retry limits and explicit domain recovery or correction behavior |
| DomainBinding | References to business concepts, roles, obligations, evidence and validation rules |

A workflow definition is an RDF graph and can be edited through a JSON-LD representation. Studio edits that graph, validates it, and publishes an immutable version. The compiler accepts only a defined subset of the vocabulary.

A definition names capabilities; it does not contain arbitrary JavaScript, SQL, SPARQL or executable expressions. For example, an operation reference such as meter.verifySignedEvidence resolves to a reviewed implementation registered by the application. This keeps authoring data portable and lets the adapter factory switch from deterministic simulation to a real integration.

The ChargeWeave profile imports or references both the generic XFlow vocabulary and ChargeWeave business vocabulary. The CPO/CSMS ontology does not import XState or depend on XFlow. A future namespace registration is a separate deliberate migration; the existing development IRIs remain unchanged.

## Relationship to the existing process model

The current source model already includes ProcessExecution, ProcessStep and StateTransition. They represent actual business execution, accountability, evidence and state changes. They are not versioned workflow definitions.

Map XFlow runs onto those records:

- One business workflow instance is linked to one ProcessExecution, with its accountable party, financial owner, subject record, service agreement and overall process state.
- A business-significant XFlow step produces or updates a ProcessStep with the responsible party, inputs, outputs, obligation and evidence.
- A business state change produces a StateTransition with its source event and responsible party.
- Internal runtime details such as actor scheduling, retry counters and snapshot bytes stay in the technical process store. They do not become ontology facts unless they carry business or audit meaning.
- The run record pins the workflow definition ID, version and digest used for execution. A small XFlow-to-ChargeWeave binding graph can carry this link without duplicating either ontology.

The workflow context carries canonical record IRIs and small typed values, not copies of entire ontology records or evidence files. Domain services load and validate canonical records through ports.

## Workflow definition contract

A published definition contains these groups:

1. **Identity:** workflow ID, semantic version, immutable content digest, status and compatibility level.
2. **Business scope:** process kind, journey references, subject type, accountable role, financial-owner role and applicable contract obligations.
3. **Input and context:** JSON-LD/JSON Schema contracts for inputs, events and context; context contains canonical IDs rather than copied records.
4. **Graph:** initial step, step definitions and explicit transitions.
5. **Effects:** allowlisted operation references, input/output mappings and idempotency-key rules.
6. **Policy:** timeouts, retry/backoff, deadlines, escalation, cancellation and compensation.
7. **Bindings:** referenced ontology concepts, shape/rule IDs, evidence types and task roles.
8. **Versioning:** author, review and publication evidence; published versions are immutable and every execution pins one version.

The first profile needs service tasks, human tasks, event waits, timers, decisions, call-workflow, bounded parallel/join and terminal states. Mapping expressions are constrained path lookups and typed transforms; no user-supplied code is evaluated.

## Runtime and durability

Each ProcessExecution has a stable XState actor ID. The host compiles the pinned definition, restores the actor snapshot, attaches the selected ports and starts or resumes processing.

The process store records:

- workflow ID, version and digest;
- tenant, ProcessExecution IRI, actor ID and canonical subject references;
- XState persisted snapshot and snapshot sequence;
- append-only event and business-step history;
- pending timer IDs and UTC deadlines;
- pending effect/outbox records and idempotency keys;
- runtime and adapter version metadata needed for support and replay.

XState supplies statecharts, actors, transition handling and actor snapshot persistence. The host supplies the durable database, event log, timer service, outbox, tenant authorization and operational monitoring. A browser timer or in-memory actor is not the backend durability mechanism.

On restore, XState does not rerun actions already recorded as executed, while invoked actors are restarted. Therefore every external operation must be idempotent and reconcile its result before retrying. Store an effect intent before delivery, pass a stable idempotency key to the adapter, and record the correlated result. Persist deadlines outside the browser process; on wake-up, restore the actor and send an explicit timer event. Use both snapshots and a business event history, and test compatibility when machine versions change.

A published workflow version is immutable. Existing executions continue on their pinned version. Migration to a new version is an explicit operation with a tested state mapping; never reinterpret a stored snapshot using an unreviewed definition.

## Browser and backend

| Concern | Browser demo | Backend host |
|---|---|---|
| XState machine | Same compiled machine | Same compiled machine |
| Clock | Deterministic virtual clock, seedable scenarios | Durable scheduler using persisted UTC deadlines |
| Process storage | Memory or IndexedDB for the demo | Durable process store, event history and outbox |
| Device/payment/domain adapters | Synthetic adapters with reproducible outcomes | Replaceable real or simulated adapters |
| Recovery | Reload and restore the actor snapshot | Restart workers, restore and resume actors |
| Evidence | Synthetic evidence references | Governed object storage and verified evidence references |

Adapters are selected by a factory at the composition root. The workflow definition never contains an environment-specific URL or credential. Switching one adapter from virtual to real does not change the statechart or business meaning.

## J07/J08 example: late meter evidence corrects a charge

The correction workflow starts from an existing immutable debit CDR and a new or corrected meter-evidence event correlated to the same session. It can wait for missing evidence or human approval for as long as the configured policy requires.

~~~mermaid
flowchart TD
    A["Wait for corrected meter evidence"] --> B["Verify signature and register epoch"]
    B -->|invalid| Q["Quarantine and request review"]
    B -->|valid| C["Reconcile usage"]
    C --> D["Assess billing readiness"]
    D -->|blocked| W["Wait for evidence or escalate"]
    D -->|ready| E["Re-rate and compare"]
    E -->|no material change| X["Record evidence and close"]
    E -->|correction required| F["Obtain policy-required approval"]
    F --> G["Credit original debit once"]
    G --> H["Issue corrected record"]
    H --> I["Propagate, notify and close"]
~~~

Illustrative step-to-model mapping:

| Step | Business binding and behavior |
|---|---|
| Verify signature and register epoch | SignedMeterEvidence, ElectricityMeter, MeterRegisterEpoch; quarantine invalid or unverifiable evidence |
| Reconcile usage | Create MeterDelta using ordered readings in the same epoch; preserve reset boundaries and evidence |
| Assess readiness | Create BillingReadinessAssessment; if blocked, wait for the missing input and resume from an external event |
| Re-rate and compare | Create RatingCalculation using the selected tariff version and explicit tax/rounding policy |
| Approve | Create a human task for the configured responsible role; deadline causes escalation, never silent approval |
| Credit and replace | Create a RecordCorrection, credit the original CDR at most once, and issue a distinct corrected record with acyclic lineage |
| Propagate and notify | Use idempotent outbox deliveries to invoice, settlement or roaming adapters; retries cannot duplicate financial records |

This workflow enforces the existing BR-131 through BR-134 constraints. It does not mutate or delete the original charge record. If the credit succeeds and a downstream step fails, the process resumes or reconciles the same correction; it does not invent an inverse transaction.

In XState, awaiting evidence and approval are explicit states that accept correlated events. A pure guard chooses a branch. A service actor invokes one registered capability. The compiler creates the XState machine from the validated definition; the ontology remains the contract for what those actions mean.

## Studio and operator screens

Studio has two modes in the XFlow area:

- **Design:** graph canvas, versioned definition, step inspector, role and ontology bindings, adapter operation selector, rule references, and draft validation.
- **Run:** selected execution, current business step, pending task or timer, evidence, rule results, event timeline and retry/compensation history.

A scenario runner in Design mode uses the virtual clock and deterministic adapters. Publishing requires valid shapes, resolvable domain/rule references, all paths ending or waiting explicitly, and scenario evidence for success, failure, timeout and duplicate delivery.

The existing Finance and Data Explorer views remain linked destinations for financial records and canonical evidence. An exception/approval inbox can be added when the demo needs multiple concurrent human tasks; it does not require a new top-level page for every ontology class.

AI may draft a workflow or suggest a missing branch, but publication is validated and a runtime transition is selected by the versioned machine, events and explicit guards. AI output cannot directly issue a credit, bypass an approval or mutate a published definition.

## Acceptance criteria

1. One definition validates and compiles in both browser and backend hosts.
2. A waiting actor survives reload/restart, restores with its pinned definition, and resumes on a correlated event.
3. Invalid meter signatures and cross-epoch readings never create a billable correction.
4. Duplicate corrected-evidence and approval events produce one correction only.
5. A blocked readiness decision remains waiting or escalates according to policy; it never emits a debit.
6. A successful correction preserves the original record and satisfies credit reversal, no-double-credit and acyclic-lineage rules.
7. Failure after a financial effect resumes through idempotent reconciliation without duplicate credits or CDRs.
8. A Studio edit creates a new draft/version; running instances keep their pinned version.
9. The workflow publishes the corresponding ProcessExecution, business ProcessStep and StateTransition evidence.
10. The same seeded scenario produces the same simulated outcomes under the virtual clock.

## Completion boundary

This design completes the proposed workflow-definition and XState-runtime architecture. It does not by itself prove that every CPO/CSMS business arrangement is modeled, that real integrations are production-ready, or that every jurisdiction-specific policy is covered. The existing business-domain audit remains the independent coverage baseline; production acceptance still needs real adapter, persistence, authorization, recovery and financial golden-case tests.

## References

- [ChargeWeave runtime architecture](runtime-architecture.md)
- [ChargeWeave source model](../model/domain.schema)
- [Actor journeys J07/J08](actor-journeys.md)
- [Business-domain audit and completion boundary](business-domain-audit.md)
- [XState persistence documentation](https://stately.ai/docs/persistence)
- [XState overview](https://stately.ai/docs/xstate)
- [XState MIT license](https://github.com/statelyai/xstate/blob/main/LICENSE)
