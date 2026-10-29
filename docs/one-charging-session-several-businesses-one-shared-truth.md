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
