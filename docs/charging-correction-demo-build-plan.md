# ChargeWeave: charging correction demo — software build plan

This standalone plan covers software implementation, dashboard components, workflow visualization, testing and deployment. Use the existing ChargeWeave application, shared XFlow/FormX harness and synthetic data. The separate article and publication assets are outside this plan.

Execute the phases in order. Do not treat an individual milestone as completion of the whole demo. GitHub Actions and the deployed build are the shared verification authority.

## 1. The demonstration we want people to see


The experience has two connected perspectives:

- **Business workspace:** session context, evidence, task inbox, correction form, responsible parties and linked result.
- **Process workspace:** the same process instance rendered with meaningful XFlow shapes, its actual waiting reason, selected routes and execution evidence.


The story can begin with a previously completed synthetic session. Simulating a complete charger connection, authorization and charging lifecycle is not necessary for the first correction release. That preceding context must be visibly identified as loaded fixture history. A later full-lifecycle mode requires the existing protocol simulator to be deliberately connected through adapters; switching tabs between unrelated fixtures does not establish integration.

### Success criteria

1. A business reader can explain the problem and outcome after a three-minute walkthrough.
2. A viewer can distinguish automated work, a decision, waiting for an event, waiting for a person, a deadline and completion from the diagram.
4. A reviewer can inspect original versus corrected energy and price, responsibility, evidence and time.
5. Reloading at a supported wait restores the same instance and permitted action.
6. Failures, rejected evidence and unsupported capabilities remain explicit.

## 2. What we already have and will reuse

These observations come from source and implementation documents at the inspected revision. They are not a fresh live-browser or CI acceptance result.

| Existing foundation | Source | Reuse and implication |
| --- | --- | --- |
| Shared client execution | `client-runtime/` | Keep the generated local GraphQL interface, shared application services, revision checks and package identity. |
| Executable correction flow | `xflow/charge-correction.profile.json`, `client-runtime/src/flow/`, `client-runtime/src/profiles/chargeweave/correction-workflow.js` | Reuse EventWait, ServiceTask, Decision, HumanTask and End semantics and XState execution. |
| Generic form/task system, referred to here as FormX/task forms | `model/client-task-profile.json`, `console-app/src/task-form-renderer.js`, `website/src/task-forms/engine.js` | Use versioned descriptors, supported widgets, constraints and outcomes. Verify the project's current naming rather than inventing a second FormX engine. |
| Operator inbox and correction workspace | `console-app/src/app.js`, `work-model.js`, `local-client.js` | Build on My work and its shared local correction service. |
| Workflow studio | `website/src/WorkflowStudio.jsx`, `workflows.css` | Retain inspection/editing/run controls; improve the graph and bind product navigation to actual instance identity. |
| Browser engineering harness | `docs/engineering-workbench-status.md` and its implementation references | Reuse scenario execution, pinned inputs, evidence, replay, capability reports and exact-commit verification. |
| History, analytics and persistence | `docs/client-runtime-status.md`, temporal and analytical contracts | Preserve scope boundaries; current yearly analytics and correction history are not automatically one population. |
| Shared verification and publication | `.github/workflows/website-pages.yml`, `ontology-ci.yml` | Commit canonical sources; generate the public application through the existing pipeline. |

### Confirmed integration gaps to address

- The operator correction slice currently maps the accepted operator decision to approval and commits at a stable terminal outcome. It does not expose a separately persistable approval wait.
- Workflow studio can demonstrate waiting actors and virtual deadlines, but that is not yet proof that the operator workspace resumes the same waiting task after reload.
- Other console journeys and the site-to-revenue demonstration have not all migrated to the shared runtime.
- The existing studio uses fixed graph coordinates, common 220 × 84 node bounds and mostly common button contents. Distinct kind labels already exist, but the silhouette and runtime indicators need stronger meaning.
- Existing edge highlighting is based on the active source node. That must not imply that every outgoing route has been taken.
- Exact correction arithmetic exists in the connected client slice. Legacy simulator/studio numbers and synthetic analytics must not be assumed to use that same calculation implementation.
- Existing form-engine documentation contains historical scope statements; resolve them against current implementation and update them as part of delivery.
- A signature/identity check in synthetic mode is a fixture outcome, not validation against a real meter trust service.

## 3. Canonical scenario and business contract

### Main case: a late correction after an initial charge record

Use one synthetic public charging session and explicit CPO/eMSP/roaming roles. Define which party owns each record and task. Do not equate a CPO charge-detail record with the driver's final invoice.

Proposed simple pricing fixture:

| Item | Initial record | Corrected record |
| --- | --- | --- |
| Energy | 10.600 kWh | 9.100 kWh |
| Demonstration unit price | EUR 0.32/kWh | Same pinned price |
| Illustrative amount | EUR 3.39 | EUR 2.91 |
| Difference | — | EUR 0.48 lower |

These are proposed fixture values, not asserted current outputs. Pin meter start/end readings and register epoch so they independently reproduce the energy values. Define the EUR 0.32 as the demonstration's tax-inclusive unit price, with zero separate fees, and show that assumption. If the commercial model uses another tax basis, update both fixture and independent expected results before implementation. The tariff is illustrative, not a market quote.


### Required journey

1. Load the completed session and original issued record as identified fixture history.
2. Receive corrected evidence correlated to that session and party scope.
3. Check required evidence, meter ordering/epoch and declared source trust outcome.
4. Reconcile energy and assess billing readiness.
5. If inputs are absent, wait for the named evidence; do not calculate an accepted charge.
6. Calculate the corrected amount using the shared exact arithmetic service and pinned pricing inputs.
7. Evaluate the existing configured approval policy.
8. Create a real work item when approval is required; suspend at HumanTask.
9. Present the generated form with original evidence, proposed correction, difference, reason and allowed outcomes.
10. Approve or reject through the task service, with revision and idempotency checks.
11. On approval, record the supported linked financial effects and corrected record atomically.
12. Track a simulated partner acknowledgment if included in this release; until acknowledged show delivery pending, not completed settlement.
13. Inspect history and responsibility, save/reload and replay.

Approval is a separate domain action after evidence intake and rating. Splitting the current single-submit interaction must preserve existing service guarantees.

### Party boundaries

| Party | What the demo shows | Boundary |
| --- | --- | --- |
| Driver | Illustrative charge summary and adjustment explanation | No real personal data or payment. |
| CPO | Meter evidence, session reconciliation and CPO-owned records | Synthetic charger evidence. |
| eMSP | Received corrected record and downstream action status | Separate eMSP tariff/invoice behavior only if explicitly implemented. |
| Roaming intermediary | Correlation, delivery receipt or pending acknowledgment | Simulated exchange; no certification claim. |
| Billing operator/approver | Assigned task, decision and business reason | Role simulation; no production identity claim. |

Local role switches explain responsibility. They are not authenticated sessions for independent organizations.

## 4. Screen-by-screen specification

Use the current shell and design tokens. Navigation preserves scenario, session, case, task and process-instance identity. Provide a compact guided-demo entry and the full workspace.

| --- | --- | --- | --- |
| S01 | Session overview: headline summary, party strip, energy/amount cards and timeline | Load fixture; inspect original record; show current case status and time basis | Establish that one session crosses multiple responsibilities. |
| S02 | Evidence and discrepancy: original/proposed values side by side; evidence drawer | Inject late evidence; validate; show accepted/rejected checks and exact difference | Explain why a correction needs more than overwriting a field. |
| S03 | Live process: readable graph, current-step summary and optional inspector | Follow the actual instance; show event wait, automated checks, decisions and human task; open the related task | Make automation and waiting visible. |
| S04 | My work and correction task: compact inbox plus case context and generated form | Review evidence; required reason/outcome; field validation; submit once; stale task rejected | Show reusable FormX/task behavior and accountable human judgment. |
| S05 | Correction result: original, reversal/adjustment and replacement; party delivery statuses | Render receipts and records from service results; drill into links; no duplicate effects on retry | Explain the financial outcome and who still needs to act. |
| S06 | History and evidence: business timeline, before/after comparison, time selector | Show recorded revisions and what was known at each checkpoint; distinguish source event time from arrival time | Explain traceability. Do not claim a complete temporal writer. |
| S07 | Optional technical drawer/workbench handoff | Package/profile identity, rule support, scenario inputs and exact verification evidence | Support technical reviewers without crowding business screens. |

### Layout rules

- Desktop: business context across the top, primary work area in the center, secondary evidence/details in a collapsible side panel.
- Flow focus: graph gets the main width; avoid permanently squeezing it between two large panels.
- Phone: summary and current action first, readable ordered process list, optional pan/zoom graph. No miniature full graph used as the only navigation.
- Persistent labels: Synthetic demonstration, current scenario, relevant business state and waiting reason.
- “Guided demo” advances to the next meaningful action, not an artificial success screen.
- Form validation retains values, associates errors with fields, moves focus appropriately and keeps evidence visible.
- Completed/rejected/expired tasks become read-only with a clear outcome and next available action.

## 5. XFlow visual language: BPMN-inspired, still XFlow

Preserve XFlow as the editable/executable contract and XState as the runtime. Improve visual semantics using familiar process symbols. This is a documented XFlow visual vocabulary, not a claim of BPMN conformance, interchange or full execution support.

Reference for visual inspiration: [OMG BPMN 2.0.2](https://www.omg.org/spec/BPMN/2.0.2). Exact mappings below are ChargeWeave design decisions.

### Node vocabulary

| Existing XFlow type | Proposed silhouette and marker | Meaning visible to the viewer |
| --- | --- | --- |
| EventWait | Double-ring circle, event marker and external text label | Waiting for a correlated external/business event. Use an envelope only for a declared message trigger. |
| ServiceTask | Rounded rectangle, fixed gear marker | Automated work executed by a registered service. |
| Decision | Diamond with a simple decision marker; label outside if necessary | Evaluate supported guard routes. Label the actual conditions/default; do not imply unsupported parallel/inclusive gateways. |
| HumanTask | Rounded rectangle, fixed person marker; task/role line | A person must supply input or a decision through the bound form. |
| End | Circle with heavy outer border, explicit outcome text | This process instance ended; outcome may be completed, no change, declined or quarantined. |

Keep the type marker visible even when the node is active or visited. The current active/check icon must not replace the only indicator of node meaning. Put execution status in a separate badge/border.

A visual initial-entry cue may identify the first step but must not introduce an executable start node into the flow definition. Do not draw a completed start event before its trigger has occurred.

### Waiting states and deadlines

The active step summary must answer: **What are we waiting for? Who or what can unblock it? What action is available? Is there a deadline?**

Examples:

- Waiting for corrected meter evidence — source: simulated CPO adapter; expected event: corrected evidence.
- Waiting for billing evidence — missing commercial/tax input identified by the readiness result.
- Awaiting approval — Billing Approver; bound task and form version; due time.
- Awaiting partner acknowledgment — only if a real simulated receive/acknowledgment step is implemented.

Show a clock badge attached to a task only when that task has a configured runtime deadline. Its timeout edge is labelled “Deadline expired → Manual review”. This is a visualization of existing XFlow deadline metadata, not newly implemented BPMN boundary-event semantics.

The current `evidenceReceived` step is an EventWait holding for an explicit validation request. Label it “Waiting for validation request” and expose the permitted action; do not render it as a HumanTask unless the source contract is intentionally migrated.

### Execution status independent of type

Support not reached, running, waiting, completed, failed and terminal outcome. Selection and hover are UI state, not execution status. A previous visit is not proof of successful completion.

Record transitions that actually occurred. Highlight only the taken route and its observed outcome. Keep evaluated-but-not-taken branches neutral; show failed guard evidence in the inspector if available. Instant service tasks remain inspectable through their trace; a presentation replay must not add artificial business delays.

Use text/icons plus color: teal for current work, amber for waiting, green for successful outcomes, red for failures and gray for unreached elements, adjusted to the existing themes. Check contrast and reduced-motion behavior.

### Connections, grouping and canvas

- Derive edges from normalized executable transitions; one rendered edge per transition identity.
- Use shape-specific connection ports and orthogonal paths; arrows meet the circle/diamond boundary, not a rectangular bounding box.
- Label routes in business language while retaining raw event/guard IDs in the inspector.
- Identify default, rejection, service failure and deadline routes explicitly.
- Keep recovery loops visible and avoid lines through nodes, label overlaps and long undifferentiated bottom-lane routes.
- Derive deterministic layout from the graph using a small layout adapter; assess an existing compatible open-source layout library before adding dependencies. A graph projection with stable stored positions is acceptable if arbitrary source changes cannot hide nodes.
- Prefer a vertical main path with short side branches. Overview collapses supported detail groups; technical mode exposes all existing steps.
- Responsibility bands group supported work ownership. They are visual groups, not BPMN collaboration pools or remote execution guarantees.
- Label role ownership as simulated where appropriate. A lane containing an acknowledgment does not mean a live partner was contacted.
- Provide fit-to-view, zoom, pan, reset view, focus-current, keyboard selection and a readable transition list.
- Retain edit-flow behavior and definition validation. Editing is disabled while an instance runs; re-layout must preserve node IDs, selected node and edit binding.

### Source ownership

Derive base shapes from existing `kind`. Add optional, versioned presentation metadata only for labels, event marker, owner group and detail grouping where necessary. Missing optional metadata falls back to a truthful generic marker.



## 6. Platform and runtime work packages

### P0 — Baseline and acceptance map

Read current task, workflow, service, persistence and editorial sources; inspect the deployed desktop/mobile application. Map each S01–S07 state to existing routes/components and identify missing connections. Record scenario IDs, input fixture, seed, virtual clock and version/package identifiers. Verify current CI before attributing a failure to new work.

**Exit:** A source-backed reuse/gap matrix, named screen entry points and explicit service-level acceptance cases. No new generic engine.

### P1 — Shared process presentation

Extract a reusable graph projection, node vocabulary, ports/edges, status model and accessible list. Replace the studio's common silhouette/fixed-coordinate rendering through this adapter. Reuse it in the business process view with a simpler inspector.

**Exit:** All existing correction nodes/routes remain visible, editable and executable; semantic type remains identifiable in every runtime state.

### P2 — Persistent waits and generated work

Separate evidence intake, validation/rating and approval commands where required. Materialize work items from actual HumanTask descriptors. Persist stable waiting actors, business state, task revisions, deadlines and pending acknowledgments coherently through the shared checkpoint coordinator.

On restore, reconcile virtual time explicitly. Browser closure is not an unattended execution service. A real-time mode, if later added, needs persisted deadline reconciliation and a documented clock policy.

**Exit:** Save/reload at evidence wait and approval wait; exactly one task/outcome/effect; stale approval and package mismatch rejected; explicit timeout escalates through the existing branch.

### P3 — Connected business screens

Connect S01–S06 to the same services, IDs and instance; implement before/after records, responsibilities, task navigation and result receipts. Add S07 only where it helps inspection. Reuse existing components and tokens.

If partner acknowledgment is included, implement a synthetic adapter and explicit pending/accepted/rejected states. If deferred, scope the story to local correction completion and label the partner handoff accordingly.

**Exit:** A viewer completes the main journey without developer tools; every visible amount and business status is backed by shared state.

### P4 — Scenario harness and trustworthy evidence

Register the new journey in the existing harness. Preserve seed/clock, package identity, expected outcomes, branch evidence, task actions, state checkpoints and artifact identity. Pin independent expected financial results; do not compute test expectations using the same calculation function under test.

**Exit:** All required cases below run reproducibly, produce inspectable evidence and distinguish failed/unsupported/not-run.

### P5 — Product polish and screen capture

Review desktop/mobile, both themes where supported, labels, diagram routing, forms and keyboard paths. Add reproducible capture steps using the assembled protected build. Capture real states after assertions; attach state/scenario provenance to CI artifacts.



## 7. Required scenario matrix

| ID | Scenario | Observable expectation |
| --- | --- | --- |
| C01 | Valid correction requiring approval | Wait → generated task → approved correction with expected linked records and exact amounts. |
| C02 | Missing billing evidence | No accepted financial effect; named event wait; supplementation resumes same instance. |
| C03 | Invalid evidence or wrong epoch | Explicit rejection/quarantine; no rating acceptance, credit or replacement. |
| C04 | Reversed meter readings | Validation failure/manual handling; original remains intact. |
| C05 | No material price change | Supported no-change terminal outcome; no financial adjustment. |
| C06 | Below approval threshold | Existing guard policy selects the permitted automatic route; no fabricated task. |
| C07 | Operator rejects | Declined outcome and reason; no approval effects. |
| C08 | Approval deadline expires | Manual-review escalation; subsequent stale approval cannot revive the expired task. |
| C09 | Duplicate input/decision | Idempotent receipt or explicit conflict; never a second financial effect. |
| C10 | Stale revision / two tabs | Conflict visible; no lost update or overwritten checkpoint. |
| C11 | Reload while waiting | Same package, instance, task and due-time semantics restored. |
| C12 | Simulated partner delay/rejection | Local result distinguished from pending/failed delivery; controlled retry if supported. |
| C13 | Damaged checkpoint / incompatible package | Import/restore rejected with supported recovery. |
| C14 | Required evaluator unavailable | Command blocked with capability gap; no green completion. |


## 8. Verification and release discipline

Use existing GitHub Actions as the release authority and inspect results for the exact pushed commit.

- Runtime tests: command boundaries, exact arithmetic, guards, revision/idempotency, stable waits, deadline races, coherent commits and restore.
- Graph tests: kind mapping, supported transition coverage, shape ports, default/error/deadline labels and actual-route highlighting. A visual change must not alter execution.
- Form integration: generated inputs/outcomes, validation, read-only context, task expiry and repeat submission.
- Meaningful browser journeys: complete C01, missing evidence, rejected evidence, reject/timeout, waiting restore and narrow viewport navigation against the assembled protected build.
- Visual review: readable text, no clipped labels, legible shapes, unobstructed edges, light/dark tokens, focus behavior and reduced motion.
- Semantic/generation checks: run relevant generated-artifact and canonical rule gates if model/profiles change. Do not weaken existing gates to pass the demo.

Implementation should be batched into coherent, fully described commits after relevant checks, avoiding repeated cosmetic micro-deployments. Each commit body states problem, behavior, validation and limitations. Canonical source is `pli-poc/charge-weave`; `charge-weave-app` remains generated deployment output.

This plan-only commit needs document/source-link review and inspection of any triggered workflows. It does not justify running product tests as if implementation had changed.


## 14. Dashboard components and the connected operational overview

**Plan extension, 29 October 2026:** Include the dashboard as the entry and closing screen for the demonstration. This extends P0–P5; it is not a separate dashboard project or permission to start product implementation.

### 14.1 Reuse the existing dashboard foundation

Source inspection confirms:

- `console-app/src/components/analytics-panes.js` already supplies `renderKpi`, `renderChart`, `renderResultTable` and `renderPane`.
- `console-app/src/analytics/dashboard.js` assembles profile-defined KPI/pane descriptors, filters, chart/table selection, drill-down and pane preferences.
- `model/analytics-profile.json` defines the current site/day subject, approved measures/dimensions and overview composition.
- `docs/analytics-contract.md` defines weighted aggregation, revision selection, knowledge cutoff, scope, unavailable values and calculation evidence.
- Existing analytical results and operational custom panes intentionally have different source populations.

Preserve those components and the analytical contract. Generalize the assumptions that prevent their reuse for a correction/case/task subject. For example, table/KPI captions currently say “site-days”, drill targets are hard-coded to site/country/setting, and some custom renderers are callbacks with no typed data/evidence contract. Those assumptions must move into supported subject/result metadata, not be copied into another dashboard.

### 14.2 Three coherent dashboard presets

| Preset | Main audience and question | Components |
| --- | --- | --- |
| Operations | What is blocked and who should act? | Case counts, waiting-state distribution, actionable work queue, aging and process activity. |
| Billing and corrections | What changed financially and what remains pending? | Approved adjustment summary, original/replacement comparison, approval queue and simulated delivery status. |
| Network performance | How is the synthetic owned network performing over time? | Existing energy, completed sessions, estimated net value, weighted availability and trends. |

The first two use a declared shared operational projection over the connected scenario records. Network performance retains its existing historical subject until a separately verified projection connects that population. Switching preset must display its scope clearly; the correction must not change an unrelated full-year chart.

Role-oriented presets are presentation choices over simulated roles. Real authorization remains a service responsibility.

### 14.3 S00 — Dashboard entry and closing view

Extend the screen sequence in section 4 with **S00: Operations dashboard**.

**Layout:**

- Top bar: preset, declared population, time/virtual-clock context and scenario/reset controls.
- First row: at most four meaningful KPI cards.
- Main row: waiting-state breakdown beside an actionable work queue.
- Lower row: aging or state-history chart and recent business activity; financial result pane on the corrections preset.
- Expandable source/calculation evidence and a compact “Open current case” action.

Start at the initial dashboard, open the case, execute S01–S06 and return to the same dashboard. On return, show the accepted case/task/status and financial changes actually recorded. Preserve filters and navigation context. A single scenario may have only one case; that is valid and must not be disguised as a large network.


### 14.4 Metric definitions before visual design

| Metric | Definition and source | Presentation rule |
| --- | --- | --- |
| Open correction cases | Distinct case IDs in the selected scope with a declared nonterminal status at the selected checkpoint | Snapshot stock; do not sum daily backlog snapshots. |
| Awaiting operator action | Distinct open work items currently actionable by the selected simulated role | Distinguish tasks from cases; one case can have multiple tasks over its lifetime. |
| Waiting for external evidence | Distinct cases whose actual active state is the declared evidence wait | Do not infer waiting from a label or combine it with active human approval. |
| Oldest open wait | Selected virtual time minus the start of the current waiting interval among open waits | Show duration and case link; no eligible case means unavailable, not zero. |
| Approved net adjustment | Sum of accepted, deduplicated correction differences for the chosen currency and declared document basis | Exact minor units/decimal strings; distinguish net change, full credit and replacement value. |
| Pending partner delivery | Distinct supported handoffs lacking a successful simulated acknowledgment | Only available when the acknowledgment adapter is implemented; unavailable is not “0 pending”. |
| Completed corrections | Distinct cases reaching the declared successful outcome in the selected half-open interval | Do not count every event, retry or historical revision as another completion. |


Every KPI must disclose subject, grain, unit/currency, aggregation, time basis, source scope and empty/unavailable policy. Define whether comparisons are between reporting intervals, knowledge cutoffs or replay checkpoints. A “before/after scenario” comparison is not automatically a supported previous-period query; add a supported projection/adapter and acceptance evidence before exposing it.

Avoid a decorative success-rate gauge. If a rate is later useful, define the numerator, denominator, cohort/window and unavailable conditions first.

### 14.5 Reusable components to extend

| Component | Planned behavior |
| --- | --- |
| KPI card | Label, value/unit, supported comparison, source caption and declared drill target; no hard-coded site/day wording. |
| Pane shell | Shared title, scope/status line, chart/table toggle where applicable, evidence disclosure and optional allowed actions. |
| Category/status chart | Reuse the bar renderer for waiting/action/outcome distribution; exact result table accompanies it. |
| Trend/aging pane | Reuse line/bar primitives over supported buckets; distinguish duration distributions, event counts and snapshot backlog. |
| Work queue | Typed table with case/task identity, reason, owner, age/due state and “Open task/case”; same work-item contract as My work. |
| Activity timeline | Business events with time basis and case links; use accepted receipts, not invented animation events. |
| Correction comparison | Original, linked credit/adjustment, replacement and net change; exact financial formatting shared with S05. |
| Shared filter bar | Allowed filters per subject; explicit reset, active scope and filter chips; unsupported combinations rejected. |
| Empty/error state | Distinguish loading, no matches, unavailable, unsupported capability and source failure. |

The diagram itself can be a focus/preview pane through the shared P1 graph component. It must navigate to S03 for detailed inspection rather than duplicate its implementation.

Dashboard arrangement uses the existing reorder/show-hide preferences. Add explicit supported widths and reset-to-preset where needed; preserve accessible keyboard alternatives. Full arbitrary drag-resize authoring is not a prerequisite for this release.

### 14.6 Profile-driven composition and data contracts

Extend the current descriptor approach through versioned source profiles and a bounded renderer registry.

A pane descriptor identifies its stable ID, title, renderer key, subject/query binding, allowed size, supported filters, empty-state policy and named drill target. A query references approved measures/dimensions and a provider capability; it is not executable JavaScript or arbitrary GraphQL supplied by a layout file.

The shared result contract supplies typed values, row/group identities, units, total semantics, subject grain, calculation/source evidence and supported navigation keys. Custom operational panes receive validated results/services through the same host boundary rather than fetching unrelated fixtures inside their renderer.

Keep layout preference state separate from business checkpoints. Bind scenario, case and instance navigation to the current package. Unknown renderers, missing measures and incompatible versions produce a visible diagnostic rather than a blank panel.

Do not force every subject into the existing site/day fact schema. Extend profile validation and query dispatch to explicit supported subjects/adapters while preserving current historical behavior. If new canonical measures or concepts are necessary, add them through the existing model/generator ownership chain and reference checks.

### 14.7 Interaction and consistency contract

- Clicking a KPI applies its declared filter or opens its scoped queue; it must not silently change the population.
- Selecting a chart bucket filters the corresponding queue and shows removable filter chips.
- Opening a queue item navigates to S02/S04 with the same case/task/revision; returning restores dashboard state.
- Opening an active process selects the same instance in S03 and focuses the current step.
- Accepted commands invalidate/recompute the affected operational projection from committed state; no timer-based fake increments.
- Rejected commands and idempotent retries do not change dashboard totals.
- Save/reload restores business state first and then derives the dashboard; saved card numbers are not the source of truth.
- Corrections update historical network reporting only after an explicit subject mapping, grain policy and parity test exists.

### 14.8 Delivery and verification additions

Add these responsibilities to the existing phases:

| Phase | Dashboard addition |
| --- | --- |
| P0 | Inventory component reuse; define operational subjects, metric semantics, drill targets and baseline populations. |
| P1 | Make shared flow preview embeddable without another diagram engine. |
| P2 | Expose task/wait/deadline state required by the operational projection. |
| P3 | Implement S00, shared pane extensions, operational projection, preset composition and connected drill-through. |
| P4 | Verify aggregation, metric boundaries, retries, projection invalidation and save/reload parity. |
| P5 | Capture S00 before/after with identical filters and declared checkpoint/time differences; review desktop/mobile. |

Additional acceptance cases:

- **C15 — Reconciliation:** KPI totals equal independently enumerated cases/tasks and linked accepted records for the selected scope.
- **C16 — Population boundary:** Correcting the interactive case changes its operational projection while the unrelated yearly network population remains unchanged.
- **C17 — Drill-through:** Card → filtered queue → generated task → flow → return preserves case, instance and filters.
- **C18 — Counting and precision:** Duplicate events/retries, multi-task cases, signed financial changes, no-data states and mixed-currency rejection behave as defined.
- **C19 — Restore:** Dashboard values derived after reload match committed state and the saved virtual time; layout preference changes do not alter business records.
- **C20 — Presentation reuse:** Existing network panes continue working after subject generalization; narrow screens, keyboard operation and readable tables remain supported.

The final readiness checklist also requires S00, metric definitions, projection evidence, drill-through and C15–C20. No dashboard is called live unless its data is actually updated through the connected scenario services.


## 15. Professional visual quality and demonstration readiness


### 15.1 Art direction grounded in the existing product

Retain the ChargeWeave console's existing visual identity: deep navy surfaces, mint/teal accent, restrained blue/violet supporting colors and clear semantic amber/red/green states. Use the existing light theme coherently rather than styling each new screen independently.

The inspected `console-app/src/styles.css` already defines shared tokens. The new workspace must reuse and consolidate those tokens across dashboard, task, evidence and process screens. Avoid a second visual system in the workflow studio.


### 15.2 Proposed measurable presentation baseline

These are project design targets, to validate with real rendered screens; they are not claims of current conformance.

| Area | Quality target |
| --- | --- |
| Typography | Clear hierarchy: approximately 28–32 px page title, 18–20 px section title, 14–16 px body/important table content and at least 12 px secondary metadata at normal zoom. Avoid tiny 10–11 px labels for essential information. |
| Numbers | Tabular numerals for amounts, durations and counts; consistent decimal precision, currency basis, signed differences and right alignment. |
| Spacing | Shared 4/8 px spacing scale; consistent control heights, card padding, section gaps and aligned panel headings. |
| Density | First viewport identifies the case/problem, present status and next action. Secondary technical evidence is expandable. Do not shrink type to fit extra panels. |
| Surface treatment | Restrained borders, shadows and radius tokens; semantic emphasis follows task importance rather than decorating every card. |
| Controls | One clear primary action per task; predictable disabled/loading/completed behavior; no icons without an accessible name or explanation where meaning is ambiguous. |
| Charts | Readable axes/units, consistent comparison colors, meaningful scales, explicit missing values and exact-value access. No decorative geometry or invented trends. |
| Flow | Distinct silhouettes, readable labels, unobstructed arrows, stable status markers, no overlapping connectors/labels and a useful focus-current view. |
| Motion | Short purposeful transitions, no distracting perpetual glow/pulse; reduced-motion alternative. Never slow business execution solely to animate it. |
| Responsive behavior | Deliberately composed layouts at 1440 × 900, 1920 × 1080, 1024 × 768 and 390 × 844 CSS pixels. Also inspect 200% browser zoom on desktop. |
| Accessibility | Keyboard-complete main journey, visible focus, associated labels/errors, contrast review, understandable status announcements and no color-only meaning. |

Fit the first meaningful action at normal browser zoom; do not require the presenter to zoom out. Horizontal scrolling is reserved for intentionally navigable graphs and genuinely wide tables, with an accessible alternative. Avoid full-page overflow.

### 15.3 Design checkpoint before expanding implementation

During P0/P1, produce and render three representative compositions using real components and the pinned synthetic case:

1. **S00 dashboard:** the attention state, compact KPI row, actionable queue and waiting-state pane.
2. **S03 process:** the same instance waiting for approval, meaningful node shapes and a focused inspector.
3. **S04 task:** the generated form, evidence comparison and clear approval/rejection actions.

Inspect these together at desktop and mobile sizes before rolling the styling across S01–S07. Iterate internally until their typography, spacing, density and interactions form a consistent product. This is a working design checkpoint, not an additional mandatory permission round.


### 15.4 Interaction and presentation completeness

The main demo needs a reliable presentation mode:

- A clear entry point, short explanation of the scenario and “Start demonstration” action.
- A reproducible reset that restores all connected case/task/process/projection state.
- Optional guidance that identifies the next meaningful action without covering the content.
- Stable navigation and a visible path back to the case/dashboard.
- Informative pending, empty, error, conflict, expired and success states.
- Immediate feedback when an action begins; bounded failure handling and recovery instead of endless spinners.
- No dead buttons, broken links, inaccessible drawers or controls with silently unsupported behavior in the featured journey.
- No layout jump when a value changes, a chart loads or a validation message appears.
- Package/schema/trace details available on demand, while ordinary screens retain business language.


### 15.5 Visual review matrix and release blockers


Required review questions:

- Does the same product identity carry through dashboard, forms, records and flow?
- Can a first-time viewer identify what happened and what to do without technical narration?
- Are every important label, amount, unit, deadline and route readable at normal zoom?
- Do the process, task and dashboard agree on the current state?
- Is evidence legible without taking the viewer out of the journey?


Use visual regression captures to detect unintended changes, and human visual inspection to judge composition and clarity. A pixel comparison alone cannot establish professional design. Fix release blockers and record any remaining minor issues honestly.


## Completion criteria

- The dashboard, case, generated task, process and result show the same synthetic correction instance.
- Waiting approvals survive supported save/reload; decisions enforce revision and idempotency and produce traceable results.
- Existing analytics, flow editing and console journeys continue to work.
- Required C01–C20 scenarios pass, with unsupported cases explicitly reported.
- Review desktop and mobile layouts, accessible controls, real execution status and clear error states.
- Commit all changes to the canonical GitHub repository; inspect exact-commit CI and deployment before claiming completion.
