# Generic task forms and operator workspace

**Status:** Reusable browser renderer demonstrated in the operations console; durable work-item API and production authorization remain future work.
**Scope:** Business-facing human tasks emitted by workflow hosts across ChargeWeave capabilities.

## Design intent

Operators use the product workspace to review assigned work and complete interventions. They see business terms, case context, progress milestones, people and responsibilities, and the inputs allowed for the current task. The workspace does not expose XState state names, actor snapshots, or workflow graph internals.

The form renderer is generic. The task determines its field set and allowed outcomes; the ontology supplies domain meaning and semantic references; a versioned presentation profile supplies labels, grouping, help text and control hints. No screen is inferred directly from every property in OWL.

## Model responsibilities

| Model or service | Owns | Example |
|---|---|---|
| Domain ontology and shapes | Business concepts, relationships, value types and reusable data constraints | Meter reading belongs to a charging session and uses a decimal quantity |
| Workflow `HumanTask` | Role assignment, task inputs, read-only context, outcomes, deadline and correlation | Billing Operations may accept or reject this correction task |
| Task presentation profile | Field ordering, sections, labels, help, widget hints, units, masking and display rules | Present a decimal as a kWh quantity with three decimal places |
| Authorization policy | Principal, tenant, task assignment, field access and permitted outcome | The current operator may review this tenant's open task |
| Renderer | Accessible control components, layout, keyboard behavior and error display | Render decimal, select, masked-reference and multiline-note controls |
| Task host and domain capability | Reauthorization, authoritative validation, persistence and business effects | Record a linked correction and recalculate the charge |

The presentation profile is metadata, not executable code. A UI hint can choose a widget, but it cannot weaken a shape, grant access, or decide a business outcome. Unknown concepts, unsupported controls, unresolved references or invalid profile versions fail closed before the task is rendered.

## Runtime contract

The orchestration host suspends at a `HumanTask` and publishes a business-facing work item. An application adapter retrieves inbox summaries and task detail, then submits a command with task identity, expected revision, selected outcome, values and an idempotency key. A production API should expose operations equivalent to:

```text
listWorkItems(scope, filters)
getWorkItem(workItemId)
submitTaskOutcome(workItemId, expectedRevision, outcome, values, idempotencyKey)
```

The task payload includes a pinned workflow and task version; task and process identifiers; business-facing title, summary and stage; assignment and due-time information; authorized read-only context; form profile and resolved reference options; allowed outcomes; and a task revision. The UI treats it as a data contract. It does not import the workflow compiler or send XState events directly.

The operator workspace presents three related views:

1. **Inbox:** assigned and eligible tasks, priority, due time, subject and a plain-language reason for intervention.
2. **Case detail:** business context, involved roles, evidence and business milestones. Automation can be summarized as completed milestones; low-level runtime state stays in technical diagnostics.
3. **Task form:** only authorized inputs and outcomes for this task version, generated from its presentation profile and rendered with shared product components.

Progress is a business-facing projection supplied by the host or derived from declared milestone metadata. Internal state names, retries and timer bookkeeping remain in the runtime record. Each milestone can point to corresponding business process evidence without copying the workflow engine's internal state into the ontology.

## Field and widget mapping

Field descriptors bind an input ID to a domain concept or property and carry explicit constraints plus presentation metadata. A renderer can map supported pairs to shared controls:

| Contract type or hint | Rendered control | Key requirements |
|---|---|---|
| String, identifier | Text entry | Length, pattern, autocomplete and allowed character rules |
| Decimal quantity | Numeric/decimal entry with unit | Precision, lower/upper bounds and unit; do not silently round |
| Financial amount | Amount plus currency selection or fixed currency | Currency allowlist, scale, rounding rule and exact decimal arithmetic |
| Date/time | Date, time or zoned date-time control | Explicit timezone and valid-time semantics where applicable |
| Controlled vocabulary | Select or radio group | Choices resolved from the pinned vocabulary/profile and scoped to the user's authority |
| Entity reference | Searchable reference picker | Server-filtered candidates of allowed classes; no arbitrary IRI entry |
| Long text | Multiline entry | Required state and length limits; sanitize on output |
| Masked or sensitive value | Masked display or constrained formatted entry | Reveal only permitted characters; avoid placing hidden source values in the DOM or client payload |
| Boolean acceptance | Checkbox or explicit yes/no choice | Label names the specific assertion being accepted |

Control selection starts from explicit schema type and approved UI hints. Labels, groups and help text come from the presentation profile. Accessibility labels, focus order, responsive layout and error association are renderer responsibilities. A specialization such as a payment or financial control can extend the component registry while keeping the task schema format stable.

For production financial input, represent amounts as decimal strings or minor units with a declared currency and scale, then use decimal arithmetic in the trusted domain service. JavaScript floating-point arithmetic in the browser prototype is illustrative only.

## Submission and trust boundary

Client validation provides immediate feedback. The trusted task host repeats every security and business check:

1. Authenticate the principal and authorize tenant, task assignment, fields and requested outcome.
2. Confirm the pinned task version, open status and expected revision; reject stale or expired work.
3. Validate datatypes, required fields, value bounds, vocabulary membership, reference ownership, temporal context and relevant SHACL/domain rules.
4. Apply idempotency and correlation so retries cannot duplicate a decision or effect.
5. Persist the actor, values, outcome, evidence, model/profile and rule versions in an audit record.
6. Invoke the owning domain capability transactionally; only after its result is recorded should the host resume the workflow with the declared event.

The renderer never treats hidden fields or browser role names as authorization. A task host may be simulated in the browser during development, but moving that host behind an API must not change the task contract or the application interaction model.

## Current repository implementation

- `console-app/src/work-model.js` contains a synthetic work item, business milestones and a versioned meter-correction task form descriptor.
- `console-app/src/task-form-renderer.js` is a generic HTML control renderer for task descriptors. It supports text, quantities, money, date/time, select, checkbox, textarea and masked formatted inputs.
- `console-app/src/app.js` renders the inbox, business progress, case evidence, responsibilities and result in the operator workspace. The J07/J08 correction entry now opens this task in the app.
- `console-app/src/provider.js` remains the application data seam; the work fixture is browser-local in this prototype and is not a durable or authorized task service.
- `website/src/HumanTaskDesign.jsx` and `website/src/simulation/task-form-engine.js` document and exercise the separate developer prototype that compiles a HumanTask contract and simulates guarded workflow submission.

The inbox currently contains one deterministic example. It demonstrates a correction decision and generated controls but does not provide multiple tenants, concurrent assignments, durable storage, real identity, a production authorization service, real invoice changes or a live XState host in `console-app`. Those must be supplied behind the same work-item/task contract before this becomes operational software.

## Verification

```bash
cd console-app
npm test
npm run build
```

The console unit tests verify generic field generation, escaping and deterministic rating calculations. Website Playwright coverage opens the app inbox, inspects progress and context, completes the generated task, and checks the responsive layout.
