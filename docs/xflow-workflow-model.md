# XFlow workflow model and XState runtime

**Status:** Generic model and browser runtime implemented as a demonstrator; backend host remains future work
**Scope:** User-configurable business workflows, browser simulation and a later backend host

## Decision

Use XState v5 as the statechart and actor runtime. Keep the editable workflow definition in a small, versioned XFlow contract, validate it against a separate generic XFlow ontology and SHACL shapes, then compile the validated definition to an XState machine.

XFlow is a cross-cutting process-definition layer. It is not part of the CPO/CSMS vocabulary. A ChargeWeave workflow profile binds generic steps to existing business concepts, roles and rules. The existing ChargeWeave process records remain the canonical business and audit record.

The first browser demo and a later backend host use the same workflow definition, compiler, machine logic and typed ports. They select different adapters and persistence implementations.

The implemented source is `xflow/ontology.ttl`, `xflow/shapes.ttl` and `xflow/charge-correction.profile.json`. The profile is JSON-LD and is normalized by `website/src/simulation/correction-workflow.js` to the generic compiler contract in `website/src/simulation/flow-engine.js`. The `/developer/flows/` Studio route runs that definition in the browser. The namespace under `example.org` is a development/demo IRI, not a production namespace registration.

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

This is the target metamodel. The `0.1.0-demo` vocabulary implements the versioned definition and core step/transition/domain-binding terms used by the J07/J08 profile. A version is currently a property on its definition resource. Schedule triggers, bounded parallel/join, retry/compensation policies, and migration/publication metadata are not implemented in this first slice.

A workflow definition is an RDF graph and the committed example is written as JSON-LD. SHACL validates the profile in CI; the browser compiler also checks graph structure and registry references before creating an actor. The Studio renders connected workflow nodes and transitions. Its constrained draft editor can rename steps, edit descriptions and change transition targets; the compiler validates the edited definition before the next run. These edits exist only in browser memory. Adding and removing arbitrary step types, reviewing persisted drafts and immutable publication remain future capabilities. The compiler accepts only a defined subset of the vocabulary.

A definition names capabilities; it does not contain arbitrary JavaScript, SQL, SPARQL or executable expressions. For example, an operation reference such as meter.verifySignedEvidence resolves to a reviewed implementation registered by the application. This keeps authoring data portable and lets the adapter factory switch from deterministic simulation to a real integration.

### Implemented compiler contract

The first compiler accepts a versioned graph with an initial step, JSON initial context, domain/process-record bindings and typed steps. Step kinds map as follows:

| XFlow step | Runtime behavior | Demo use |
|---|---|---|
| EventWait | Wait for a named external or user event | Corrected meter evidence, validation request and missing billing evidence |
| ServiceTask | Invoke one registered asynchronous activity; route success or failure explicitly | Signature check, meter reconciliation, rating, credit and corrected CDR |
| Decision | Evaluate ordered named guards, then a declared default branch | Readiness, material change and approval policy |
| HumanTask | Wait for named task events and an optional named host deadline | Billing approval and exception review |
| EndStep | Mark a terminal outcome | Completed, no-change, quarantined or declined |

The engine validates JSON-only definitions and resolves all activity, guard, action and timer IDs through own, callable host-registry entries. It rejects embedded functions, inherited or unresolved capabilities, and targets outside the graph. The Studio lets developers inspect the linked graph and outputs, change approval threshold and timeout, and test a locally edited graph definition through the same runtime. It does not yet persist drafts or publish immutable workflow versions.

`createFlowRuntime(registry).compile(definition)` creates an XState v5 machine; `createActor(definition, { context, snapshot, clock })` creates an actor in a selected host. `resolveDelay(name, context)` resolves a named delay using that host's registered policy. The machine handles the declared timeout event; the host schedules the deadline and delivers the event. The browser Studio advances its virtual clock and sends the event from the workflow definition. A backend scheduler persists the UTC due time and sends that same event after restoring the pinned actor. This keeps durable scheduling outside the statechart and avoids treating a restarted in-process timer as the persisted deadline. The same JavaScript module is browser-safe and Node-compatible. The simulator's ordinary charging-session lifecycle is also compiled through this runtime, while the richer J07/J08 profile demonstrates service tasks, decision guards, human approval, a deadline, domain bindings and resumable waiting.

`python tools/test_xflow.py` validates the committed JSON-LD profile against the standalone SHACL shapes and checks required graph boundaries. `website/src/simulation/flow-engine.test.js` exercises compilation, capability allowlisting, checkpoint restore, virtual timer advancement, missing evidence, and linked correction outputs.

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

The implemented profile supports service tasks, human tasks, event waits, named timers, decisions and terminal states. Call-workflow, bounded parallel/join, richer mapping expressions, and authoring/publishing controls are future extensions. No user-supplied code is evaluated.

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

The browser prototype currently combines visual authoring and a single test run on one Studio page:

- **Design:** connected graph canvas, step inspector, local draft edits for labels, descriptions and route targets, plus validation before execution.
- **Run:** current business step, pending task or timer, synthetic evidence and outputs, virtual event timeline, and snapshot save/restore.

A scenario run uses the virtual clock and deterministic adapters. Adding or removing step types, persistent draft review and publication remain future Studio capabilities. Publishing should require valid shapes, resolvable domain/rule references, all paths ending or waiting explicitly, and scenario evidence for success, failure, timeout and duplicate delivery.

The existing Finance and Data Explorer views remain linked destinations for financial records and canonical evidence. An exception/approval inbox can be added when the demo needs multiple concurrent human tasks; it does not require a new top-level page for every ontology class.

## Human task forms and controlled changes

**Status: reusable browser engine and renderer implemented; production host remains future work.** The shared task-form package compiles and validates version-pinned profiles against any supported XFlow `HumanTask`, then a reusable React renderer presents the compiled controls and outcomes. The J07/J08 correction profile is the first consumer. A browser-only adapter exercises role/revision/idempotency checks and resumes its XState actor through a neutral `taskSubmission` event envelope. This does not provide a durable work queue, production authorization, backend writes or general editing of canonical business records.

The reusable implementation is split by responsibility: `website/src/task-forms/engine.js` contains profile compilation, control inference, constraint validation, outcome-scoped value projection, initial-value creation and safe display masking; `website/src/components/task-forms/TaskFormRenderer.jsx` renders the compiled field and outcome contract; the in-memory adapter is isolated in `website/src/simulation/simulated-task-host.js`. A new workflow supplies its own versioned profile, ontology bindings, task constraints, references, labels and outcome event names, while its XState actions decide how to consume the neutral submission envelope. Rendering does not imply production authorization or persistence.

See the [reusable task-form engine guide](task-form-engine.md) for the renderer API, supported controls, validation contract and steps for adding another task profile.

The platform should render a form from a task contract, not turn every ontology class into a CRUD screen. Keep four responsibilities distinct:

1. **Business ontology:** defines the meaning and relationships of fields such as sessions, meter evidence, tariffs, CDRs, parties and correction records.
2. **Validation contract:** XFlow SHACL shapes and deterministic domain rules define valid payload structure, values, references and cross-record constraints. OWL alone does not define required form fields.
3. **HumanTask contract:** the pinned workflow version declares the assignee role, form-profile id/version, read-only context, editable input bindings, allowed outcomes and named commands, input/output shape references, deadline, escalation and completion events.
4. **Presentation profile:** separately versioned UI metadata supplies labels, help text, grouping and widget hints. The UI renderer must not infer authorization or business validity from a widget choice.

The renderer derives appropriate controls from declared datatypes and shape constraints: text and numeric inputs, temporal controls, controlled-value selectors, ontology-class reference pickers, evidence references, exact-decimal money controls and masked display values. It only renders fields and outcomes selected by the current HumanTask. Required state comes from the task shape rather than OWL cardinality. All other canonical values remain read-only. Arbitrary JavaScript, raw SPARQL and unrestricted RDF mutation are out of scope.

Submitting a task is a guarded command that produces a correlated workflow event. The host must re-check the current task and pinned workflow/shape versions, principal, tenant and assigned role; validate the input shape, references, temporal context and deterministic business rules; and enforce expected-version and idempotency checks. Client-side validation is for feedback only. The host records the submitted values, selected outcome, reason, evidence references, rule/shape versions, actor identity and valid-time/recorded-time audit before sending the declared event to XState.

A permitted data correction must not silently overwrite its source. It invokes a named domain operation that creates a linked correction or new assertion with provenance, reason and evidence. Financial effects such as crediting an original CDR remain explicit registered capabilities with their own idempotency and business rules.

**Implemented first slice:** on the J07/J08 correction journey, show the original CDR, corrected meter reading, rating result and masked payment reference as read-only context. Let the synthetic billing approver submit the declared approval or rejection, a correction kind, structured reason, task-scoped evidence reference and bounded proposed adjustment. The amount is retained with the task decision but does not override the rating service or posted record. Unit coverage exercises wrong-role, stale-task, invalid-shape, duplicate-submit, undeclared-field, amount-bound and successful workflow-resume cases. Browser coverage exercises both outcomes and the visible validation path.

The browser implementation is a renderer for versioned task contracts and this one reconciliation task, not a general drag-and-drop form builder. Next platform work is a trusted service host with durable tasks, reference resolution, audit persistence and domain transactions. A form-authoring studio can follow after those service boundaries are proven. Running tasks keep the exact workflow and presentation versions with which they were created.

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

The prototype implements the generic XFlow vocabulary and shapes, an executable JSON-LD profile, a constrained XState v5 compiler, and a browser Studio demo for the J07/J08 charge-correction journey. It proves selected paths for evidence validation, missing inputs, approval, timeout, credit lineage and snapshot restore. It does not implement a production backend host, durable timers, database-backed snapshots/event log/outbox, tenant authorization, full Studio editing/publishing, live adapters, or every CPO/CSMS business arrangement and jurisdiction-specific policy. The existing business-domain audit remains the independent coverage baseline; production acceptance still needs real adapter, persistence, authorization, recovery and financial golden-case tests.

The browser prototype does not establish production host-side authorization, SHACL execution, live reference resolution, durable task state, audit persistence or transactional domain writes. A production service must independently enforce those boundaries; client checks are only feedback and a demonstrator.

## References

- [ChargeWeave runtime architecture](runtime-architecture.md)
- [ChargeWeave source model](../model/domain.schema)
- [Actor journeys J07/J08](actor-journeys.md)
- [Business-domain audit and completion boundary](business-domain-audit.md)
- [XState persistence documentation](https://stately.ai/docs/persistence)
- [XState overview](https://stately.ai/docs/xstate)
- [XState MIT license](https://github.com/statelyai/xstate/blob/main/LICENSE)
