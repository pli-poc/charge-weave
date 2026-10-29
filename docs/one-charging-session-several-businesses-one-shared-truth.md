# One charging session. Several businesses. One shared truth?

## Product demo, flow presentation and article delivery plan

**Date:** 29 October 2026  
**Canonical source:** `pli-poc/charge-weave`  
**Inspected source revision:** `eb6d6512041f2c80ed85e406d3616eeacfb96fcd`  
**Scope of this document:** Plan the complete demonstrable journey and its publication layouts before product implementation. This change creates documentation only. Proposed behavior below is acceptance scope, not a claim of current availability.

**Working article title:** One charging session. Several businesses. One shared truth?  
**Subtitle:** What an EV charging correction reveals about operations, roaming and billing.  
**Audience:** EV product leaders, charging operators, eMSPs, architects, engineering leaders and commercial stakeholders.  
**Product objective:** Demonstrate Sjef's EV domain knowledge, product judgment and engineering approach through a working, coherent ChargeWeave journey using the existing platform harness.

## 1. The demonstration we want people to see

Yes: this story must be shown with real product screens. A reader follows one synthetic charging session, sees a late meter correction, understands why work pauses, completes the generated task, and inspects the financial and historical consequences. The article uses captures of those actual states.

The experience has two connected perspectives:

- **Business workspace:** session context, evidence, task inbox, correction form, responsible parties and linked result.
- **Process workspace:** the same process instance rendered with meaningful XFlow shapes, its actual waiting reason, selected routes and execution evidence.

The same instance, package, services and records drive both perspectives. An editorial screenshot sequence is a presentation of the running application, not an independently scripted screen mockup.

The story can begin with a previously completed synthetic session. Simulating a complete charger connection, authorization and charging lifecycle is not necessary for the first correction release. That preceding context must be visibly identified as loaded fixture history. A later full-lifecycle mode requires the existing protocol simulator to be deliberately connected through adapters; switching tabs between unrelated fixtures does not establish integration.

### Success criteria

1. A business reader can explain the problem and outcome after a three-minute walkthrough.
2. A viewer can distinguish automated work, a decision, waiting for an event, waiting for a person, a deadline and completion from the diagram.
3. Submitting a task changes actual shared state and records; screenshots can be reproduced from a pinned seed and virtual clock.
4. A reviewer can inspect original versus corrected energy and price, responsibility, evidence and time.
5. Reloading at a supported wait restores the same instance and permitted action.
6. Failures, rejected evidence and unsupported capabilities remain explicit.
7. The article is understandable without knowing ontology, GraphQL, XState or BPMN.

## 2. What we already have and will reuse

These observations come from source and implementation documents at the inspected revision. They are not a fresh live-browser or CI acceptance result.

| Existing foundation | Source | Reuse and implication |
| --- | --- | --- |
| Domain model, rules and generated contracts | `model/domain.schema`, `tools/build_all.py`, `model/client-*-profile.json` | Extend the existing source/generator chain; never create a parallel article-only domain model. |
| Shared client execution | `client-runtime/` | Keep the generated local GraphQL interface, shared application services, revision checks and package identity. |
| Executable correction flow | `xflow/charge-correction.profile.json`, `client-runtime/src/flow/`, `client-runtime/src/profiles/chargeweave/correction-workflow.js` | Reuse EventWait, ServiceTask, Decision, HumanTask and End semantics and XState execution. |
| Generic form/task system, referred to here as FormX/task forms | `model/client-task-profile.json`, `console-app/src/task-form-renderer.js`, `website/src/task-forms/engine.js` | Use versioned descriptors, supported widgets, constraints and outcomes. Verify the project's current naming rather than inventing a second FormX engine. |
| Operator inbox and correction workspace | `console-app/src/app.js`, `work-model.js`, `local-client.js` | Build on My work and its shared local correction service. |
| Workflow studio | `website/src/WorkflowStudio.jsx`, `workflows.css` | Retain inspection/editing/run controls; improve the graph and bind product navigation to actual instance identity. |
| Browser engineering harness | `docs/engineering-workbench-status.md` and its implementation references | Reuse scenario execution, pinned inputs, evidence, replay, capability reports and exact-commit verification. |
| History, analytics and persistence | `docs/client-runtime-status.md`, temporal and analytical contracts | Preserve scope boundaries; current yearly analytics and correction history are not automatically one population. |
| Editorial system | `content/blog/`, `content/blog/assets/the-platform-as-a-harness/README.md` | Reuse article metadata, asset handling, site style and existing blog validation. |
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

Determine whether the original document is merely rated, issued or already settled. For the main article use an **issued illustrative charge record**, with a linked reversal/credit and replacement record if that is the existing service's supported correction policy. Explain net difference separately from the full reversal amount. Do not silently rewrite an issued original or imply an executed bank refund.

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

| ID | Screen and layout | Working behavior | Article evidence |
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
- Screenshot focus mode may hide navigation and debug panels, but cannot fabricate data or change the process state.
- Human task fields remain generated from versioned profiles; avoid a hard-coded approval page for this article.
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

Operational status and wait reason come from runtime/task services. Never infer waiting from label text or assign a different visual kind to make a screenshot attractive. If required semantics are missing, extend the canonical XFlow/profile/compiler contract and its tests; presentation metadata cannot invent execution behavior.

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

**Exit:** Readable actual screenshots S01–S06, plus optional S07, with no mismatched session or invented process state.

### P6 — Article, site layout and publication assets

Write the article against the verified screenshots and supported behavior. Integrate the layouts in sections 9–10 through the current blog system. Prepare LinkedIn text and separate images; do not post to LinkedIn automatically.

**Exit:** Blog content/build checks and responsive review pass. Article claims match tested implementation. Source publication follows the existing canonical/public pipeline.

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

C12 is required only if partner delivery is included in the published journey; otherwise state that boundary in the article and remove corresponding completion claims. Seeded fixtures should cover branch boundaries, not only attractive screenshots.

## 8. Verification and release discipline

Use existing GitHub Actions as the release authority and inspect results for the exact pushed commit.

- Runtime tests: command boundaries, exact arithmetic, guards, revision/idempotency, stable waits, deadline races, coherent commits and restore.
- Graph tests: kind mapping, supported transition coverage, shape ports, default/error/deadline labels and actual-route highlighting. A visual change must not alter execution.
- Form integration: generated inputs/outcomes, validation, read-only context, task expiry and repeat submission.
- Meaningful browser journeys: complete C01, missing evidence, rejected evidence, reject/timeout, waiting restore and narrow viewport navigation against the assembled protected build.
- Visual review: readable text, no clipped labels, legible shapes, unobstructed edges, light/dark tokens, focus behavior and reduced motion.
- Semantic/generation checks: run relevant generated-artifact and canonical rule gates if model/profiles change. Do not weaken existing gates to pass the demo.
- Evidence: scenario identity, package digest, source commit, actual check results and screenshot state. Document pending checks honestly.
- Editorial checks: existing blog validation, website/console builds, built article asset verification and site links.

Implementation should be batched into coherent, fully described commits after relevant checks, avoiding repeated cosmetic micro-deployments. Each commit body states problem, behavior, validation and limitations. Canonical source is `pli-poc/charge-weave`; `charge-weave-app` remains generated deployment output.

This plan-only commit needs document/source-link review and inspection of any triggered workflows. It does not justify running product tests as if implementation had changed.

## 9. Long-form article layout

Target 1,000–1,300 words, adjusted for readability. The article leads with a business problem and explains the implementation through screen evidence. Avoid presenting class counts as the central value proposition.

| Order | Section and approximate length | Visual placement | Purpose and caption direction |
| --- | --- | --- | --- |
| 1 | Title, subtitle and 100-word opening | Wide hero: one real case overview with a short editorial title | “The charging has finished. The information can still change.” |
| 2 | One session crosses several responsibilities — 130 words | S01 full-width after the first explanation | Identify driver, CPO, eMSP and record ownership in plain language. |
| 3 | A corrected meter value arrives — 140 words | S02 full-width; restrained numbered annotations | Show 10.600 → 9.100 kWh and the proposed difference with explicit pricing assumptions. |
| 4 | Why the process sometimes needs to wait — 160 words | S03 main-path crop plus small legend | Show event wait versus human task; explain evidence and approval dependencies. |
| 5 | The operator sees the decision that matters — 140 words | S04 task-focused capture | Show generated fields, business context, reason and allowed decision. |
| 6 | Correction without losing the original — 160 words | S05 followed by S06 | Explain original/reversal/replacement and time/evidence history. |
| 7 | What makes this reusable — 130 words | Optional conceptual platform illustration, separate from screenshots | Explain shared definitions, forms, flows, services and harness in accessible terms. |
| 8 | Demonstration boundary and invitation — 80 words | Demo CTA and short scope note | Personal project, synthetic data, browser execution, simulated roles and connections. |

### Proposed opening direction

“A charging session can finish before every system agrees on what happened. A meter correction may arrive later, after a charge record has already been issued. Who checks it, who approves the change, and how do the organizations involved keep a consistent history? I used that scenario to build a working demonstration in ChargeWeave.”

Treat this as provisional copy. Final wording and amounts follow implementation verification.

### Article claims tied to evidence

| Claim | Required proof |
| --- | --- |
| “The process waits for missing evidence.” | C02, actual EventWait and resumed instance. |
| “The task form is generated.” | Descriptor/profile linkage and browser form assertions. |
| “A person approves the correction.” | Persisted HumanTask, decision receipt and actor transition. |
| “Retry does not duplicate the adjustment.” | C09 and linked financial record counts. |
| “You can see what changed.” | Versioned local records and before/after history with declared temporal scope. |
| “The same harness can test exceptions.” | Scenario results for positive, negative, wait and timeout cases. |

No claim of production readiness, real payment execution, full BPMN support, certified OCPP/OCPI compatibility, fiscal compliance or autonomous live AI is introduced by this article. Explain only material boundaries in concise public wording.

## 10. Site and LinkedIn presentation layouts

### A. ChargeWeave site article

Reuse the current article shell and style guide. Title/subtitle, short lead, full-width hero, then alternating prose and large inline screen captures. Screenshots appear in the article body rather than only in cards or thumbnails.

- Desktop content width should make UI labels readable; provide in-page enlargement if the existing image component supports it.
- Mobile uses one column and purpose-cropped task/detail images. Do not shrink the entire desktop interface until the text disappears.
- Keep each figure adjacent to the paragraph it proves. Captions explain the business insight, not merely “Screenshot 3”.
- Use current navy/teal/green tokens and existing light/dark article handling. Preserve the real application theme inside captured screens.
- Add a “Try the correction journey” link to the actual deployed entry and scenario after it exists.
- No download-PNG buttons or GitHub links in the public article body.
- Product status belongs in honest scope wording, not visible implementation todo lists.

### B. LinkedIn long-form article

Same title and story, with a wide hero and four to six separately uploaded figures between sections. Use prose and short parallel lists rather than Markdown tables. Link to the public demonstration once near the end. Include a concise personal-project/synthetic-data note.

Prepare a 1200 × 627 hero variant and readable landscape screen images as export targets; verify LinkedIn's current upload behavior during publication preparation rather than treating these dimensions as platform requirements.

### C. LinkedIn feed introduction

Prepare 150–220 words: concrete correction problem, what the demo makes visible, personal learning/building perspective, one public article/demo link and a small relevant hashtag set. No generic “revolutionizing EV charging” claim. The full post is written only after product verification.

### D. Optional five-image 4:5 visual sequence

Separate 1600 × 2000 images, one insight per image:

1. One session, several responsibilities — S01 and role strip.
2. The evidence changes — S02 with readable before/after values.
3. Automation knows when to wait — S03 with the event/person/decision legend.
4. An accountable human decision — S04 with generated form context.
5. A traceable correction — S05/S06 and public demo invitation.

Place actual screenshot crops within an editorial frame. Label any conceptual illustration as explanatory; do not replace product evidence with AI-generated UI. Use no dense multi-screen collage or cropped labels.

## 11. Capture and asset specification

Proposed final content path: `content/blog/articles/one-charging-session-several-businesses-one-shared-truth.md`.  
Proposed assets: `content/blog/assets/one-charging-session-several-businesses-one-shared-truth/`.

These publication files are created in P6; this planning document lives under `docs/`.

Suggested capture files: `session-overview.png`, `late-meter-evidence.png`, `process-awaiting-approval.png`, `generated-correction-task.png`, `linked-correction-result.png`, `correction-history.png`, plus hero/social variants.

Record viewport, theme, scenario/seed, virtual timestamp, package identity, source commit and capture step alongside each asset. Prefer screenshots from reproducible browser automation; verify visual quality manually. Keep raw captures as CI evidence and commit only reviewed publication assets.

All visible identities are synthetic. Alt text describes the actual state and key relationship. Financial captions distinguish net change from credit amount. Screenshot annotations may point to existing UI but must not conceal errors, replace state badges or invent data.

## 12. Final readiness checklist

- [ ] Existing harness reused; no parallel FormX, flow, pricing or evidence engine.
- [ ] S01–S06 navigate the same real synthetic case and process.
- [ ] Distinct task/event/decision/end shapes remain identifiable while active.
- [ ] “Waiting for what/who” is explicit on canvas and in the current-step summary.
- [ ] Only actual routes taken appear traversed.
- [ ] Human task and relevant event waits survive supported save/reload.
- [ ] Financial effects and partner delivery boundaries are correctly described.
- [ ] Required branch, failure and persistence cases pass.
- [ ] Actual protected-build desktop/mobile screens reviewed.
- [ ] Exact-commit CI and generated deployment verified.
- [ ] Article figures reproduce working states and contain readable labels.
- [ ] Site and LinkedIn layouts prepared; no unrequested LinkedIn posting.
- [ ] Public article has inline visuals, concise scope wording and a working demo entry.

## 13. Source references and decisions to preserve

Repository sources: [client runtime status](client-runtime-status.md), [task forms](task-form-engine.md), [XFlow contract](xflow-workflow-model.md), [engineering workbench status](engineering-workbench-status.md), [client build plan](client-runtime-build-plan.md), [temporal contract](temporal-contract.md), [analytics contract](analytics-contract.md), and the source paths listed in section 2.

External notation reference: [OMG BPMN 2.0.2](https://www.omg.org/spec/BPMN/2.0.2), consulted 29 October 2026. It informs familiar visual shapes; this plan's mapping remains a limited XFlow design.

Preserved decisions: client-first synthetic product demo; XFlow/XState execution; generated task forms and shared services; explicit supported-capability limits; fixed-point correction amounts; independent reference verification; canonical GitHub source and existing pipeline; no Syntriq migration or production service dependency needed for this release.

**Next action after plan review:** Begin P0, verify the deployed baseline, then implement P1–P6 in order with the acceptance gates above.


## 14. Dashboard components and the connected operational overview

**Plan extension, 29 October 2026:** Include the dashboard as the entry and closing screen for the demonstration. This extends P0–P6; it is not a separate dashboard project or permission to start product implementation.

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

A separate small seeded multi-case population may demonstrate grouping, filtering and queues. Pin its case IDs, status distribution and clock, label it explicitly, and let one selected case be the interactive article journey. Reset restores the complete scenario projection consistently.

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

Use the existing network metric definitions for the historical preset. In particular, estimated net charging value is not accounting revenue and must not be combined with the article's illustrative tax-inclusive charge-record adjustment.

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
- Query/evidence versions and virtual time are pinned for reproducible screenshots.
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
| P6 | Include dashboard evidence and explanation in article layouts. |

Additional acceptance cases:

- **C15 — Reconciliation:** KPI totals equal independently enumerated cases/tasks and linked accepted records for the selected scope.
- **C16 — Population boundary:** Correcting the interactive case changes its operational projection while the unrelated yearly network population remains unchanged.
- **C17 — Drill-through:** Card → filtered queue → generated task → flow → return preserves case, instance and filters.
- **C18 — Counting and precision:** Duplicate events/retries, multi-task cases, signed financial changes, no-data states and mixed-currency rejection behave as defined.
- **C19 — Restore:** Dashboard values derived after reload match committed state and the saved virtual time; layout preference changes do not alter business records.
- **C20 — Presentation reuse:** Existing network panes continue working after subject generalization; narrow screens, keyboard operation and readable tables remain supported.

The final readiness checklist also requires S00, metric definitions, projection evidence, drill-through and C15–C20. No dashboard is called live unless its data is actually updated through the connected scenario services.

### 14.9 Article layout additions

Use the dashboard to make the product story tangible:

1. **Opening/hero:** S00 focused on “One correction needs attention”, with the real actionable queue visible.
2. **Middle:** S03/S04 show why it is waiting and how the generated task resolves it.
3. **Closing result:** return to S00, using the same filters, with the case outcome and supported financial effect; pair with S05/S06 for evidence.

For LinkedIn, keep one readable dashboard image in the main article. The optional five-image sequence can use S00 as the frame for the first and last images. Do not add every chart to the article; each figure must explain a business point.

Suggested paragraph theme: “A useful dashboard connects a number to the work behind it. From the outstanding correction, I can open the evidence, see why the process is waiting, complete the task and inspect the result.”

Final copy must reflect the implemented counts and outcomes. With one case, closing it may make open cases zero; with seeded background cases, the correct change is only the affected case. Never reset all visible counters to create a cleaner ending.


## 15. Professional visual quality and demonstration readiness

**Quality decision, 29 October 2026:** The domain and platform information is sufficient to proceed. Professional presentation is an explicit delivery requirement, and is not established by a plan, a successful build or a passing functional test alone. The product must pass a separate visual and interaction review before article assets or public claims are finalized.

### 15.1 Art direction grounded in the existing product

Retain the ChargeWeave console's existing visual identity: deep navy surfaces, mint/teal accent, restrained blue/violet supporting colors and clear semantic amber/red/green states. Use the existing light theme coherently rather than styling each new screen independently.

The inspected `console-app/src/styles.css` already defines shared tokens. The new workspace must reuse and consolidate those tokens across dashboard, task, evidence and process screens. Avoid a second visual system in the workflow studio.

The current font declaration resolves Manrope/Inter from the user's machine rather than guaranteeing the same font file everywhere. Before final layout approval, package an appropriately licensed font locally with pinned weights and a documented fallback, or choose a deterministic available bundled font. Test both loaded and fallback states. Do not base screenshot alignment on a font that exists only on the capture machine.

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

Screenshots of mockups cannot substitute for later captures of the implemented journey. Any exploratory visual must be identified as a design proposal.

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
- Clean opening, evidence arrival, approval wait, decision and closing scenes that can also be captured for the article.
- Package/schema/trace details available on demand, while ordinary screens retain business language.

Measure loading and key interaction timings on a documented browser/device profile during P5. Record cold and warm behavior; fix visible stalls and large main-thread blocking before release. Performance claims in the article require measurements rather than animation or a faster capture machine.

### 15.5 Visual review matrix and release blockers

Capture the assembled protected build, not only development components. Review S00–S06 in the chosen article theme, and verify the corresponding layouts in the other supported theme. Review the main path at the target viewport sizes and inspect the form's invalid/submitting/completed states.

Required review questions:

- Does the same product identity carry through dashboard, forms, records and flow?
- Can a first-time viewer identify what happened and what to do without technical narration?
- Are every important label, amount, unit, deadline and route readable at normal zoom?
- Do the process, task and dashboard agree on the current state?
- Is evidence legible without taking the viewer out of the journey?
- Are screen and article images clear at their final displayed size?

**Publication blockers:** clipped or overlapping content; unreadable essential text; broken main-path navigation/actions; contradictory case or financial information; incorrect flow status; missing recovery for a featured failure; article captures that do not match the published build.

Use visual regression captures to detect unintended changes, and human visual inspection to judge composition and clarity. A pixel comparison alone cannot establish professional design. Fix release blockers and record any remaining minor issues honestly.

### 15.6 Article asset quality

Choose the article's principal theme after reviewing actual screens. Keep that theme consistent through the captured journey. Use clean, high-resolution native captures and purpose-selected crops; never upscale illegible text and call it a high-resolution result.

Each figure should communicate one point with at most a few restrained annotations. Ensure captions, arrows and editorial frames follow the same typographic/palette system. Show real interfaces prominently; do not bury them in decorative device mockups.

The final acceptance extends section 12: passing functional/semantic CI, reviewed visual states, coherent interaction, readable article assets and verified deployment are all required. The goal is an exceptionally polished, convincing demonstration. “Perfect” must not be promised before the rendered product has been inspected and corrected.
