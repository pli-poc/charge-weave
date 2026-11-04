# ChargeWeave ontology modelling IDE: UI and UX implementation plan

**Status:** Execution in progress on `implement/ontology-modelling-studio`. This document is the acceptance plan; implementation and evidence are tracked separately in the [execution ledger](ontology-modelling-ide-ux-status.md). It does not declare the existing studio usable.

**Requested outcome:** A professional modelling IDE with a clear visual workspace, rich contextual controls, and an intuitive workflow from discovery through editing, validation and review.

**Date:** 2026-11-02. **Inspected implementation:** [`087100b01442dbf93da4c1304ded934372c5797d`](https://github.com/pli-poc/charge-weave/tree/087100b01442dbf93da4c1304ded934372c5797d), branch `implement/ontology-modelling-studio`.

**Relationship to earlier work:** This is the next product-design and implementation plan after the [MCP modelling studio plan](ontology-mcp-modelling-studio-plan.md). It replaces that plan's screen-layout specification where they differ. Its source ownership, shared server authority, authorization, revision checks, validation and publication requirements remain in force. Reinspect the actual branch when execution starts.

## 1. Outcome and definition of done

The opening screen should make three things obvious: which model is open, what is selected, and what the user can do next. The centre is a readable model diagram. Discovery lives on the left; editing lives beside the selected object; checks and history occupy an expandable panel. Advanced actions appear when relevant.

Use familiar IDE conventions: activity navigation, an explorer, document tabs, a contextual inspector, a command palette, a bottom panel and a status bar. The [VS Code interface reference](https://code.visualstudio.com/docs/editing/getting-started/userinterface) is the layout reference. ChargeWeave's editor is a model, so graph navigation and semantic editing determine the details.

The redesign is complete only when:

- A first-time modeller can find a concept, understand its relationships, add a concept and relationship, correct a property, run checks and review the result without implementation guidance.
- The normal desktop screen fits the viewport. Canvas, tree, inspector and results scroll independently where appropriate; the whole application is not a long form.
- Every currently supported capability has a documented, working destination in the new interface.
- Visual design, interaction, accessibility, resilience and performance acceptance in section 14 are demonstrated against the actual application.
- Existing semantic and authorization guarantees remain intact, and relevant GitHub checks are recorded against the pushed implementation commit.
- A human walkthrough is recorded separately from automated verification. If it has not happened, report that limitation rather than claiming usability acceptance.

### Scope decisions

| In this execution plan | Outside this redesign |
|---|---|
| A complete desktop modelling workbench and a useful compact/mobile experience | A general-purpose code IDE, extension marketplace, debugger or operating-system shell |
| Custom concept cards, editable property tables, relationship tools, saved views and explicit perspectives | A new ontology engine, namespace migration, database replacement or backend language rewrite |
| Contextual constraint-template editing, requirement links and evidence inspection | A general business-rule engine or arbitrary expression language |
| Live AI activity, inspectable changes, context handoff to the installed Codex client | Embedded AI chat, voice or terminal execution without a separate real integration |
| Review and publication UX using existing permissions and exact-candidate checks | Automatic publication, silently elevated roles or automatic GitHub merge |
| Small server/read-contract additions needed for complete navigation and accurate controls | Assuming bounded search results represent the entire ontology |

These boundaries keep the requested IDE complete for the authoring operations that exist. Unsupported rename, delete, reparent and redo operations must not become decorative working-looking buttons. Section 12 identifies where a new contract is actually necessary.

## 2. What exists and what must change

| Inspected source | Existing foundation | UX work required |
|---|---|---|
| `website/src/main.jsx` | Modelling routes inside the public website header and container | Give modelling routes a full-height application shell; retain a clear route back to the website |
| `website/src/ModellingStudio.jsx` | Connection, search, edits, views, checks, review, history and publication in one component | Separate workspace/session logic from panels; replace the long sequence of forms with task-specific surfaces |
| `website/src/modelling-studio.css` | Scoped dark styling and responsive adjustments | Introduce consistent tokens, panel sizing, interaction states and light/dark themes |
| `website/src/ModellingCanvas.jsx` | React Flow selection, relationship gesture, dragging and locally retained positions | Custom cards/edges, readable initial framing, controlled expansion, view-local positions and navigation history |
| `website/src/model/layout.worker.js` | ELK layout in a worker; fixed node dimensions | Measure actual card sizes; preserve positioned nodes; make re-layout explicit and predictable |
| `website/src/PerspectivePanels.jsx` | Explicit responsibility and temporal inspection/editing | Integrate perspective selectors, inspector sections and focused diagrams |
| `website/src/ValidationIssues.jsx` | Job failures, recorded output, fixture detail and repair-instruction copying | Searchable/filterable Problems and Checks panels with honest scope and freshness |
| `website/src/model/event-cursor.js`, `project-view.js` | Event ordering and draft projection helpers | Preserve their behavior while extracting a shared workspace controller |
| `ontology-authoring/src/mcp.js`, `workspace.js` | Authenticated tools, SQLite workspace, command receipts, views, checks and review | Reuse; add bounded read capabilities only where the new UI needs data the service does not expose |
| `website/tests/modelling.spec.js` | Real-service browser scenarios including two clients, relationship gestures, checks and recovery | Retain behavioral coverage and add the new user journeys, visual checks and keyboard paths |

Specific weaknesses to fix:

1. Connection, modelling, administration and release controls have nearly equal visual prominence.
2. Search results do not function as a browsable model explorer.
3. Small generic graph nodes and automatic fit-to-all reduce readability.
4. Selecting a concept also changes the graph root; inspection and graph navigation need distinct behaviors.
5. Raw identifiers, revision metadata and technical choices occupy ordinary editing space.
6. Features exist, but the next action, saved state and validation scope are hard to understand.
7. Current search has a bounded result limit; graph reads expose a bounded outgoing neighbourhood. Neither provides a complete explorer or incoming-reference browser.

## 3. Information architecture and default screen

### Desktop composition

```text
+---------------------------------------------------------------------------------------+
| ChargeWeave  [Workspace v]   [Search concepts and commands...]   Check v  Review changes |
+----+----------------------+---------------------------------------+--------------------+
|    | MODEL EXPLORER       | Maintenance view x  | Station view x  | INSPECTOR          |
| M  | [Filter model...]    +---------------------------------------+--------------------+
| S  | v Operations        | Operations > Maintenance              | MaintenanceWindow  |
| C3 |   MaintenanceWindow | [Information v] [+ Add v] [Layout v] | Class / changed    |
| A  |   ChargingStation   +---------------------------------------+                    |
|    | > Foundation        |                                       | Definition         |
|    | > Requirements      |    +----------------------+           | [editable text]    |
|    | > Saved views       |    | MaintenanceWindow    |           |                    |
|    |                     |    | start    DateTime  1 |----+      | Properties         |
|    |                     |    | end      DateTime  1 |    |      | Name Type Required |
|    |                     |    +----------------------+    |      | ...                |
|    |                     |                      +---------v---+  |                    |
|    |                     |                      | Station     |  | [+ Add property]   |
|    |                     |                      +-------------+  |                    |
|    |                     | [Focus selected]     [- 100% + Fit]   | Apply   Cancel     |
|    |                     +---------------------------------------+--------------------+
|    |                     | Problems 2 | Checks | Activity | Output                    |
|    |                     | Error  Missing required station  -> select affected field   |
+----+----------------------+------------------------------------------------------------+
| Connected   Draft saved   View changed       Checks: out of date        Revision 12     |
+---------------------------------------------------------------------------------------+
```

This is a placement sketch; names and results are illustrative. It must not become mock evidence in a live workspace.

| Region | Responsibility and default |
|---|---|
| Application bar | Workspace switcher, search/commands entry, Check split button, Review changes with count; connection/account detail in menu |
| Activity rail | Model, Search, Changes and AI activity; Settings and Help at bottom; labelled tooltips and accessible names |
| Primary sidebar | Model explorer by default; rail switches its content without closing the current editor |
| Editor area | Named view tabs, breadcrumb, diagram/table toggle, compact toolbar, main canvas |
| Inspector | Details for the selected concept/relationship/annotation; empty selection shows view summary and useful actions |
| Bottom panel | Problems, Checks, Activity and Output; collapsed initially unless a failed check requires attention |
| Status bar | Connection, draft persistence, presentation save state, check freshness and concise revision identity; click for detail |

### Sizing and adaptive behavior

- Use `100dvh`, CSS grid and explicit `min-width: 0` / `min-height: 0` boundaries. Avoid nested full-page scroll traps and global marketing-container constraints.
- Starting dimensions: activity rail 44 px, application bar 44 px, tabs 34 px, status bar 24 px; explorer 240 px and inspector 320 px. Validate these in real screenshots rather than treating them as immutable.
- Support pointer and keyboard resizing. Explorer range 200-360 px; inspector 280-440 px; bottom panel 160-45% of available height. Keyboard splitters expose current/minimum/maximum values.
- Preserve a central editor width of at least 560 px in the default desktop layout. At constrained widths, move the inspector into a toggleable overlay before compressing the diagram below that width.
- At 1280 x 800: explorer 220 px; inspector as a drawer by default; diagram remains useful. At 1440 px and above: both side panels can remain open. At 1920 x 1080: retain readable density rather than scaling text or cards excessively.
- Below 900 px: show one work surface at a time with explicit Model, Diagram/List, Inspector and Results navigation. Dialogs become full-height sheets where needed.
- At 390 px and 320 CSS px: use the relationship/property list as the initial modelling view. Preserve supported editing and review through stacked forms; graph viewing is optional. Toolbars and text reflow without horizontal page scrolling.
- Provide Reset layout and Focus diagram commands. Save widths, collapsed state, density and theme as local preferences, versioned so a bad old setting cannot strand a panel off-screen.

## 4. Visual system and control inventory

### Design direction

Use a restrained, precise engineering workspace: neutral surfaces, fine separators, clear type hierarchy, consistent icons and one primary accent. Keep shadows for floating surfaces, animation brief, and the canvas visually quieter than selected content. Show real model information in the first screen.

Support a system-aware dark/light theme and a compact/comfortable density setting. Use the installed Manrope font for interface text and a system monospace stack for identifiers and source. Starting text sizes: 13-14 px controls, 14 px editing text, 15-16 px concept headings and 12 px secondary metadata. Essential text must remain legible at normal zoom.

Proposed token families: `--studio-bg`, `--studio-panel`, `--studio-panel-raised`, `--studio-border`, `--studio-text`, `--studio-muted`, `--studio-accent`, `--studio-focus`, `--studio-success`, `--studio-warning`, `--studio-error`, and spacing/radius/control-height tokens. Candidate dark surfaces are `#14181f`, `#1b212a` and `#252d38`; candidate light surfaces are `#f4f6f8`, `#ffffff` and `#eef2f6`. These are starting samples, not contrast certification. Check actual foreground/background combinations in both themes.

Model change and validation are separate visual channels: a change badge can say Added or Modified while a problem badge identifies an error. Do not label an unchanged class Valid merely because it has no displayed issue. Use text and icons alongside color.

### Required reusable controls

| Control | Required behavior |
|---|---|
| Searchable explorer tree | Expand/collapse, keyboard navigation, filtering, result counts, selected row, loading/error/empty states, reveal selected |
| Search/command palette | Grouped results, keyboard selection, shortcuts, recent commands, current-context actions and unavailable-action reasons |
| Editor tabs | Preview and pinned tabs, close/close others, overflow list, changed-view indicator, selection/viewport restoration |
| Toolbar and split buttons | One prominent Check action with profile menu; labelled Add menu; concise icon actions with tooltips |
| Searchable entity/type combobox | Match labels and identifiers; distinguish existing concepts from scalar types; loading and no-results feedback |
| Property table | Declared/inherited distinction, sort/filter, inline row editing, required/multiplicity controls, accessible row actions |
| Inspector sections | Overview, Properties, Relationships, Constraints, Requirements, Perspectives and Provenance; contextual counts and retained expansion |
| Context menu | Node, edge, explorer and empty-canvas actions; keyboard/visible-menu equivalent for every action |
| Dialog/sheet | Focus containment, initial focus, validation summary, Escape/cancel, focus return and dirty-draft handling |
| Resizable panels | Drag separator plus keyboard adjustment; collapse/restore and layout reset |
| Problems/checks table | Severity, concept/field, check, status/freshness, timestamp and evidence link; filter/sort and clear empty state |
| Diff viewer | Semantic summary plus source patch, unified/narrow layout, baseline/current identity and readable additions/removals |
| Status, notices and toasts | Brief success feedback; persistent actionable failure; job progress; no reliance on transient messages for important results |
| Changes tree and activity list | Actor, intent, affected entities and current/stale markers; details on demand, bounded loading |

Reuse `lucide-react` for icons and the existing React/React Flow/ELK stack. Evaluate accessible headless primitives during phase U1 for comboboxes, dialogs, menus and tabs; record the choice, license, bundle cost and supported React version before adding a dependency. Do not introduce a second full design framework just for cosmetic components. Behavioral reference: [WAI-ARIA Authoring Practices patterns](https://www.w3.org/WAI/ARIA/apg/patterns/).

## 5. Opening, navigation and discovery

### Connect and resume

1. On the local service, try the existing paired session and display a compact Connecting state.
2. If pairing is required, show one focused welcome card: local-service status, pairing code field, Connect action and short help. Endpoint, workspace UUID and bearer-token input belong under Advanced connection.
3. Treat pairing codes and bearer tokens as opaque credentials. Only workspace IDs receive UUID validation. Field-level errors name the field; never expose a raw Zod error array.
4. After connection, load authorized workspaces, last usable view and explorer. Show titles first, UUIDs only in details. Do not invent discovery endpoints or imply that a page can read local secret files.
5. Workspace creation uses the existing permitted capability. The ordinary path uses a verified baseline choice if available; otherwise explain the exact-commit input in the creation dialog. Do not silently choose a moving branch as a pinned baseline.
6. No open view: show a compact start surface with recent views, Find a concept, Browse model and Create concept. Use a neutral model overview, not a fabricated sample graph.
7. Switching workspaces preserves acknowledged server drafts. Warn only about unapplied form input or unsaved presentation changes, with Apply/Save, Discard and Stay choices as applicable.

### Explorer and search

- Default hierarchy: workspace -> modules -> concepts. Expand a concept for declared properties and relationships; show inherited members in a separate optional group. Module membership comes from the source, not a guessed label taxonomy.
- Include Requirements and Saved views sections with appropriate icons. They are different record types, not fake ontology classes.
- Filter by text, module, changed items and items with known problems. A Problems filter must use current issue evidence and show incomplete coverage honestly.
- Support stable paginated enumeration. Empty-query search capped at 100 records is not a complete tree. Implement the bounded explorer read described in section 12 before claiming full browsing.
- Search matches concept name/definition, with scope chips for Concepts, Properties, Requirements and Commands. Display the kind and parent context so similar results are distinguishable.
- Single click selects and inspects; Enter/double click opens or focuses a view. A separate Focus neighbourhood action changes the canvas root. Avoid rebuilding the view just because a user inspected a neighbour.
- Reveal in explorer, Find references, Copy identifier and Open source preview belong in contextual actions. Copy identifier is explicit and does not copy credentials.
- Provide Back/Forward navigation within the model, preserving selection, expanded neighbourhood and viewport for each editor document.

### Tabs and commands

A diagram tab represents a view, not every transient selection. Search can open a preview tab; pinning or an explicit Open in new tab retains it. Saved views open by stable view ID. Changes and historical comparisons are distinct read-only editor documents. Tab overflow uses a picker rather than shrinking titles until unreadable.

Provide an always-visible search/commands entry and advertise only shortcuts proven to work in supported browsers. Proposed defaults: `Ctrl/Cmd+K` for command search, `Ctrl/Cmd+Shift+F` for model search and Escape to close a transient surface. Scope handlers to the studio and do not override text editing, browser zoom or assistive technology interactions. Leave browser Print, Save page, Reload and tab switching alone. Make panel toggles and shortcuts discoverable in Help; support platform labels.

## 6. Canvas and visual modelling

### Concept cards and edges

- Card header: type icon, readable concept name, module, optional Added/Modified badge. Selected cards have a clear outline independent of validation state.
- Card body: a compact property preview with name, datatype/target and multiplicity; show a few declared fields initially and a count for more. Inherited members are visually distinct and collapsed by default.
- Card actions: inspect, expand connections and More. Add property and Add relationship are contextual actions, not a row of permanent buttons on every card.
- Relationship edges display predicate and multiplicity; inheritance uses a distinct arrow/line treatment and legend. Hover/selection highlights connected endpoints and reveals details without depending on hover for access.
- Parallel edges must remain distinguishable. Use label backgrounds, sufficient click targets and predictable edge routing; keep edge labels from covering card headings.
- A selected edge opens a relationship inspector: source, target, name, cardinality, description, declaration/inheritance, source and relevant checks.

### Readability and navigation

- Start with the selected concept and a small useful neighbourhood, approximately 8-15 cards. High-degree nodes show explicit collapsed-connection counts and expansion controls.
- Default framing prioritizes the root and readable card text. Do not auto-fit a dense graph to tiny text. Fit all is an explicit action; Focus selected restores a readable scale. At overview zoom hide property details before rendering them as illegible text.
- Visible controls: zoom in/out, percent/reset, Focus selected, Fit visible, optional minimap and Layout. Pan and zoom must work with mouse, trackpad and keyboard alternatives.
- Separate view root, selection and expanded-node set. Selection updates the inspector; expansion adds neighbourhoods; Focus neighbourhood intentionally changes context.
- Expansion supports incoming/outgoing and relationship-type filters through bounded data contracts. Show omitted counts and Load more. Never render the entire ontology by default.
- Preserve positions on selection, property edits, checks and live events. New nodes are placed near their source with collision avoidance. Existing nodes move only on deliberate dragging or Layout action.
- Layout passes measured card dimensions to the worker. Ignore superseded worker results by request/view/revision identity. Provide a usable list and a retry notice if layout fails.
- Allow multi-select, align/distribute, group, annotation and pin position as presentation actions. Group membership is selected visually, not entered as a comma-separated string.
- View-local undo can restore a layout movement. Semantic Undo remains a separate server operation with a preview of the affected command group.

### Authoring gestures

1. **Create concept:** Add -> Concept opens a compact form with module, parent search, identifier and definition. Suggest an identifier from a label only as editable assistance; show existing matches before creation. Submit creates one acknowledged command group and focuses the new card.
2. **Create relationship:** drag an explicit relationship handle or select Add relationship from a card/menu. Prefill source/target where known; require name, multiplicity and supported description. Show direction in plain text before Apply. Dragging alone never writes semantics.
3. **Edit relationship/property:** selecting the edge or row opens the same editor, regardless of entry point. Show the current contract and a meaningful compatibility warning for a narrowing type/cardinality change.
4. **Remove from view:** changes presentation only and is clearly named. It must not delete a class or relationship. Do not expose semantic Delete until there is a separately tested command contract.

All drag operations have button/keyboard equivalents. Maintain the relationship list as a full navigation and editing alternative.

## 7. Inspector, forms and semantic editing

### Selection-aware inspector

| Selection | Inspector content |
|---|---|
| None | Current view, visible counts, perspective, quick creation, recent selection |
| Concept | Definition, parent/module, properties, relationships, constraints, requirements, relevant perspectives and provenance |
| Relationship | Owner, predicate, range, multiplicity, description, inherited/read-only status, compatibility and source |
| Multiple concepts | Count, group/align/pin actions; no unsupported bulk semantic editing |
| Group or annotation | Presentation label, members/note, styling and remove-from-view action |
| Historical entity | Read-only identity and comparison; clear Return to current draft action |

The inspector prioritizes the current task. Overview and Properties are visible first; less common source/revision metadata is under Provenance. Parent/module/name remain read-only for existing concepts unless a supported mutation is added in a later scope.

### Property and constraint editing

- Property table columns: Name, Type/Target, Multiplicity, Origin and Status. Clicking a row opens an inline editor with Apply and Cancel. Long identifiers wrap or expose the full value on focus.
- Represent cardinalities as `Exactly one`, `Optional`, `One or more`, `Zero or more`, with `1`, `0..1`, `1..*`, `0..*` in compact views. Map these to the existing `!`, `?`, `+`, `*` contract at the boundary.
- Type selection distinguishes scalar types from class references. Requiredness and collection multiplicity cannot produce an invalid combination.
- Show inherited fields with their declaring owner and an Open owner action. Do not offer an edit that the server cannot apply to the selected declaration.
- Constraint editing uses the discovered supported template catalogue: required relationship, allowed values and valid interval. Each template explains its parameters, source ownership and checks.
- Allowed values use an accessible token/chip editor with duplicate detection; interval constraints use start/end property pickers and requirement/rule selectors. Link to the positive and deliberate negative cases needed for a business invariant.
- Requirement linking uses searchable existing requirements and explicit scope text. A link does not mean the requirement is satisfied.
- Responsibility and temporal sections show explicit mapping/policy data. Missing mapping means no mapping is recorded, not that no business responsibility or time behavior exists.

### Apply, cancel and stale input

Typing changes a local form draft. Apply validates fields and submits one server operation with expected revision and idempotency key. Show Applying, then Saved to draft only after acknowledgement. Preserve entered values on recoverable failures; focus the first invalid field.

Navigation with unapplied edits offers Apply changes, Discard input or Stay. Closing a tab must not silently lose a form. Routine selection and reversible view changes require no confirmation.

When another client edits the workspace, update clean fields but retain dirty input. Show that the draft changed elsewhere; provide Review latest with a field-level before/latest/entered comparison. Do not silently rebase a stale command or retry it with a new revision. The user can reapply a checked edit against the latest contract.

## 8. Checks, changes, review and publication

### Checks and Problems

The Check primary action runs fast checks on the current draft. Its menu exposes the existing deeper validation profiles using user-facing names with scope descriptions. Jobs appear in Checks with queued/running/passed/failed/cancelled/interrupted states, input revision/digest and output links. Cancel appears only where supported.

Problems is an actionable list: severity, message, affected object/field when known, check name, current/stale state and next action. Selecting a known location reveals the concept and field without losing the open view. Unmapped failures open recorded output and say that the affected object is unknown. Infrastructure failures must not become invented ontology defects.

Group repeated issues; filter by selected concept, severity and check. Keep model errors, validation execution failures and incomplete review evidence distinguishable. A check's success is scoped to that check. Empty Problems never implies complete business coverage. When the draft changes, older results stay inspectable and are labelled Out of date.

### Changes and history

- Changes sidebar groups added/modified entities and additional source owners. A summary states the current change-set intent and affected counts.
- Selecting an item opens a review editor with semantic Before/After and source patch tabs. Show baseline and candidate identity in collapsible details; source paths and line navigation stay available.
- Generated artifacts appear as derived evidence tied to their source digest. They are not editable sources.
- Impact results state their indexed scope and unknowns. Do not present a partial impact index as complete dependency analysis.
- Activity records actor, action, affected entities, time and rationale. Select an entry for its exact historical comparison. Preserve independent review cases, review decisions and publication history.
- Undo latest command group shows what and whose work will be reversed, including changes from another client. Only offer it when the server supports that current state. Do not simulate semantic redo using local React state.

### Review workspace and publication flow

Review changes opens a dedicated editor surface with a clear sequence:

1. **Inspect:** semantic/source diff, intent, requirement links and impact.
2. **Validate:** required checks for the exact candidate, missing evidence and reviewer-authored cases.
3. **Decide:** reviewer accepts, requests changes or rejects with a reason, according to available capabilities.
4. **Publish:** target preflight, prepared file manifest, described commit, push and draft PR creation through existing separate service actions.
5. **Verify:** exact pushed commit's workflows and required-check policy, with pending, failed, skipped and unavailable states kept distinct.

The UI may guide this sequence but must not collapse it into an unreviewed one-click publication. Preserve the journal and uncertain-outcome recovery: reconnect/retry inspects whether a commit/push/PR already happened before creating anything again. An advanced target, stale acceptance or changed candidate clearly explains why preparation/publication is unavailable.

Draft-only users can inspect relevant status without seeing a misleading active Accept/Publish action. Explain the needed role in context; capability availability comes from the service, and authorization is enforced there. The default editing screen contains a compact Review changes entry rather than all publication forms.

## 9. AI collaboration and perspectives

### AI activity panel

The installed Codex client remains the reasoning client. The IDE shows authenticated activity from the shared workspace: what changed, who changed it, rationale when supplied, affected concepts and evidence. Manual and AI changes use the same semantic pipeline.

- Show latest AI changes with Inspect changes, Focus affected concepts and Copy context actions.
- Follow AI view suggestions is opt-in. Manual selection, editing, pan or zoom pauses following. Resume applies a new explicit suggestion without replaying old navigation.
- Context handoff can assemble the selected concept, workspace revision, requirement links and recorded check failures into a previewable instruction to copy to the existing client. Do not include tokens or pretend that copying submits a request.
- Distinguish connected workspace/event feed from a known active AI session. Do not display AI online, typing or completion percentages without a real signal.
- A future integrated chat requires an actual client/runtime adapter, request cancellation, streamed response handling, authentication and the same draft/review boundary. It is a separately estimable extension; the initial AI panel must be useful without a fake message box.

### Perspectives and saved views

Information, Responsibility and Temporal are explicit perspective choices on the current view. Use selected concept context across perspectives, and clearly identify which mapping/version supports the diagram. Inapplicable or missing mapping has a helpful empty state.

Saved views include root, perspective, filter, positions, groups and notes using the existing presentation contract. Saving a view does not change ontology assertions or stale validation evidence. Unsaved presentation changes have their own indicator and Save view action. Export uses the real view manifest; do not label it an ontology export.

Store viewport, local pinning, editor tabs and navigation history as view-local preferences unless a new shared contract is explicitly implemented. Key positions by workspace and editor/view identity so two views of the same class cannot overwrite each other. Distinguish local preference restoration from a shared saved view; a shared-view revision conflict requires comparison/reload rather than silent overwrite.

## 10. State, recovery and accessibility

### State and recovery matrix

| Situation | What the user sees | Required behavior |
|---|---|---|
| First connection/loading | Focused loading state in the affected region | Do not flash empty forms or announce that no model exists before the read completes |
| No search results | Query and scope, clear filters/create action | Keep explorer and prior editor context available |
| Applying an edit | Local pending indicator and disabled duplicate submission | Retain operation identity; acknowledge only the committed result |
| Response lost | Outcome unknown, Checking result | Reconcile through existing receipt/idempotency behavior; never blindly duplicate the command |
| New server revision while typing | Draft changed elsewhere | Preserve input, fetch current data and require a reviewed reapply for conflicts |
| Event stream reconnecting | Persistent reconnect status with last observed revision | Keep the last model visible, disable semantic writes until resynchronized |
| Authorization expired | Reconnect required, model marked as previously loaded | Stop futile reconnect loops; preserve unapplied input in memory and do not persist credentials |
| Service unavailable | Local-service help and Retry | Distinguish server unreachable from rejected credentials and invalid fields |
| Check still running after reload | Recover job from server identity | Show actual server status rather than restarting the job |
| Old check/review after an edit | Out of date, linked to its original candidate | Never reuse stale evidence to enable acceptance/publication |
| Layout worker fails | Diagram/list fallback and Retry layout | Model navigation and semantic editing remain available |
| Saved view conflicts | Shared view updated elsewhere | Keep local layout for comparison; explicitly reload or save a separate view |
| Publication interrupted | Journal state and reconcile action | Inspect remote state before retrying a network write |
| Unsupported capability | Brief explanation and alternative route | Do not send known-invalid commands or create an inert enabled control |
| Missing source/issue mapping | Detail unavailable with recorded evidence | Do not invent source lines, affected entities or error causes |

Keep separate statuses for unapplied input, acknowledged semantic draft, unsaved presentation and published Git state. A single generic Saved label is insufficient. Surface detailed revision/digest identities on demand so ordinary editing stays readable.

### Accessibility and input

Target WCAG 2.2 AA for the delivered interface and record what was actually checked; automated checks alone do not establish conformance. Use semantic landmarks and a working skip link. Implement tree, tabs, menus, comboboxes and dialogs following their [APG patterns](https://www.w3.org/WAI/ARIA/apg/patterns/), including focus restoration and keyboard behavior.

- Complete core editing/review tasks without drag or mouse. Provide a selectable relationship list and keyboard-accessible property forms alongside the canvas.
- Keep focus visible in both themes; preserve it when live events arrive. Announce meaningful save/error/job changes through restrained live regions rather than every graph update.
- Use sufficient text and UI contrast, and convey status with words/icons as well as color. Test disabled, selected, hover and focused combinations.
- Aim for 28-32 px desktop control hit areas and 44 px touch controls. The standard's minimum target-size criterion is 24 by 24 CSS px with defined exceptions; verify the actual targets and spacing. See [WCAG target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
- Test 200% browser zoom and 320 CSS px reflow. The diagram can pan in two dimensions; surrounding controls and the equivalent list must reflow. See [WCAG reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).
- Honor reduced motion and high-contrast/forced-color preferences. Never make animation necessary to understand an update.
- Do not use placeholder-only labels, hover-only actions, unlabelled icon buttons or HTML tables with improvised grid keyboard behavior. Choose native tables or implement the complete interactive-grid pattern.

## 11. Implementation architecture

### Component boundaries

Keep the existing route entry thin. Suggested layout, with filenames adjustable during implementation:

```text
website/src/ModellingStudio.jsx              route/session composition
website/src/studio/
  StudioShell.jsx                          application regions and layout
  StudioToolbar.jsx                        workspace, commands, check/review actions
  ModelExplorer.jsx                        tree, search and reveal
  EditorTabs.jsx                           diagram/review/history documents
  ModelInspector.jsx                       selection-driven details
  PropertyEditor.jsx                       shared field/relationship editing
  ConstraintEditor.jsx                     discovered constraint templates
  ChangesView.jsx                          semantic/source comparison
  ReviewView.jsx                           evidence, decisions and publication
  BottomPanel.jsx                          Problems, Checks, Activity, Output
  AiActivityPanel.jsx                      event-derived AI collaboration
  ConnectionView.jsx                       pairing and workspace opening
  CommandPalette.jsx                       registry-backed actions
  controls/                                reusable accessible primitives
  state/                                   controller, documents, edit state
  studio-tokens.css                        visual tokens/themes
website/src/ModellingCanvas.jsx             React Flow integration/custom cards
website/src/model/layout.worker.js          measured-size layout worker
```

Reuse/refactor `ValidationIssues.jsx` and `PerspectivePanels.jsx` rather than duplicating their logic. Component names describe responsibilities; this is not a requirement to create a separate file for every small element.

### State ownership

| State | Owner and persistence |
|---|---|
| Sources, commands, draft revision, receipts, history, checks, reviews, publication | Existing authoring service and workspace database |
| Shared saved view definition/revision | Existing presentation tools and server records |
| Current selection, editor documents, expanded neighbourhood, viewport | Studio controller; local restore keyed by workspace/view, with schema version |
| Unapplied form values and validation | Editor draft state in memory; never overwritten by a background refresh |
| Theme, panel sizes, density, recent view IDs | Bounded local preferences with reset; no credentials or source contents |
| Derived graph/search/inspection data | Revision-keyed cache, invalidated by workspace identity and acknowledged events |
| Tool availability/permissions | Discovered service capabilities; backend authorization remains authoritative |

Extract MCP transport/session handling and event subscription before reorganizing every screen. Maintain one controller subscription per open studio, rather than one independent connection per panel. Key async reads by workspace, revision, view/perspective and query; cancel or ignore superseded results so a slow response cannot replace a newer selection.

Use a command registry for toolbar, palette and context-menu actions: stable ID, title, icon, applicable selection, capability, enabled/disabled reason and handler. All entry points invoke the same operation. Keep presentation commands distinct from semantic server commands and irreversible publication operations.

Use React reducer/context or an existing appropriate state facility where sufficient. Add a store library only if measured subscription/complexity needs justify it. Preserve the current JavaScript stack; a whole-project TypeScript migration is not a prerequisite for UX delivery. Document request/response types and boundary validators regardless of implementation language.

### Performance strategy

Memoize custom cards/edges and callbacks, subscribe panels to the data they actually use, collapse high-degree neighbourhoods and avoid expensive effects on every node movement. These techniques follow the [React Flow performance guidance](https://reactflow.dev/learn/advanced-use/performance). Measure DOM/render cost separately from ELK layout time.

Use a revision-keyed explorer index and bounded graph reads. Avoid one server inspection request for every card on each render. Cache declaration summaries or extend the read projection where needed. Virtualize large explorer/result lists only with correct keyboard/focus behavior; lazy branch loading alone may be sufficient for current data sizes. Use a worker for layout, and prevent a stale layout from moving a newer view.

## 12. Contract gaps and capability preservation

### Required bounded additions

These are planned contracts, not claims that endpoints already exist. Reuse existing tools where they can satisfy the complete behavior. Add MCP read tools through the same service/authorization boundary when needed; do not create a competing semantic-write API.

| Need | Inspected limitation | Planned resolution and acceptance |
|---|---|---|
| Complete explorer | `ontology_context_search` returns a limited subset without full enumeration | Add a revision-pinned explorer read: module/parent filter, stable ordered cursor, page limit, total/omitted information and lightweight entity summaries. Test more than one page and a revision change mid-pagination |
| Cross-kind search | Concept and requirement search exist; full property search does not | Add bounded indexed property/relationship search with declaring owner and kind, or extend discovery with a versioned kind filter. Test duplicate property names and inherited context |
| Incoming references and expansion | `ontology_view_get` returns up to 50 outgoing edges for one root | Add bounded incoming/outgoing neighbourhood reads with direction/type filters, explicit inheritance rules, stable edge IDs and omitted/cursor data. Merge expansions only at the same revision |
| Source preview | Entity source locations and diffs exist; arbitrary source reading is not a browser feature | Provide an allowlisted, bounded, read-only excerpt for the candidate/baseline and source reference if existing results are insufficient. Deny arbitrary filesystem paths and show revision identity |
| Durable results overview | Job/evidence tools read known IDs; panel restoration needs discoverable current jobs | Verify discoverability through readiness/history; add a bounded job/evidence listing only if needed, carrying profile, status, input identity and artifact references |
| Structured Problems | Some check failures are available only as recorded output | Normalize known reports into severity/message/location/check/identity; preserve unknown-location and infrastructure cases. Never infer an entity from an arbitrary log string and call it certain |
| Workflow capability state | Tool discovery is available; creation/review/publish depend on session configuration | Preserve discovered tool metadata in controller; use existing publication capabilities; show unknown/unavailable rather than guessing roles |

Presentation pinning, viewport and tab state initially stay local. Do not add strict-schema fields to `ontology_view_save` without a versioned compatibility plan. Existing manifests must still open. Shared groups/notes/positions use their existing contract. New graph reads can be added without changing the authoritative source model or database technology.

### Capability migration checklist

| Existing feature | Destination in redesigned IDE | Behavior evidence | Remaining acceptance |
|---|---|---|---|
| Pair/token connection, diagnostics, workspace list/create/switch | Welcome/connection surface; workspace menu; Settings -> Connection | [Connection and diagnostics](../website/tests/modelling.spec.js#L37), [workspace creation/switch](../website/tests/modelling.spec.js#L1353), [first-time journey](../website/tests/studio-first-time-journey.spec.js) | Complete first-run/resume journey and human timing; token/UUID entry must remain advanced. |
| Change-set intent and requirement context | Changes sidebar header and change-set details | [Requirement search/link](../website/tests/modelling.spec.js#L268), [first-time journey](../website/tests/studio-first-time-journey.spec.js) | Verify intent, links, status and saved-state comprehension end to end. |
| Concept search, entity inspection and property/source details | Explorer, Search and Inspector | [Bounded discovery and inspection](../website/tests/modelling.spec.js#L78), [source preview](../website/tests/studio-source-preview.spec.js) | Full feature parity, source-owner coverage and human discovery task. |
| Class/definition/property/relationship editing | Add menu, card/edge actions and contextual editors | [First-time journey](../website/tests/studio-first-time-journey.spec.js), [relationship authoring](../website/tests/modelling.spec.js#L2328), [definition conflict](../website/tests/modelling.spec.js#L1175), [field conflict](../website/tests/studio-field-conflict.spec.js) | Complete supported form inventory, boundary/error paths and task walkthrough. |
| Required/allowed-value/interval constraints | Constraints inspector and template editor | [Allowed values](../website/tests/studio-allowed-values.spec.js), [interval rule authoring](../website/tests/modelling.spec.js#L1402), [required relationship](../website/tests/studio-required-relationship.spec.js) | Exercise each template at desktop and compact widths; verify invalid and stale states in the journey matrix. |
| Requirement search/link and reviewer interval cases | Requirements inspector; Review -> Evidence/cases | [Requirement explorer and links](../website/tests/modelling.spec.js#L268), [paged links](../website/tests/modelling.spec.js#L1782), [interval cases](../website/tests/modelling.spec.js#L1402) | Confirm reviewer task clarity, missing links and large requirement sets in end-to-end review. |
| Responsibility mapping and temporal policy | Perspective toolbar and Inspector -> Perspectives | [Responsibility mapping](../website/tests/modelling.spec.js#L2587), [temporal policy](../website/tests/modelling.spec.js#L2665), [mapping draft recovery](../website/tests/studio-responsibility-draft.spec.js) | Combined journey, mapped/missing state explanation and independent modeller review. |
| Saved views, groups, notes and manifest export/import | Editor tabs, view menu, visual grouping and annotation tools | [Saved views and view identity](../website/tests/modelling.spec.js#L324), [visual groups](../website/tests/canvas-groups.spec.js), [manifest import](../website/tests/studio-view-manifest-import.spec.js), [note draft](../website/tests/studio-view-note-draft.spec.js) | Save/conflict/reopen parity matrix and confirmation that presentation edits remain separate from ontology changes. |
| Diff, change impact and generated comparisons | Changes review editor | [Semantic/source comparison](../website/tests/modelling.spec.js#L1692), [source preview](../website/tests/studio-source-preview.spec.js), [first-time journey](../website/tests/studio-first-time-journey.spec.js) | Validate all source owners, long patches, stale state and reviewer comprehension. |
| Validation start/cancel/retry, output and repair instruction | Check menu; Problems, Checks and Output panels | [Check output and repair journey](../website/tests/modelling.spec.js#L2845), [scrollable output](../website/tests/studio-scrollable-output.spec.js), [first-time synthetic check](../website/tests/studio-first-time-journey.spec.js) | Known/unknown failure taxonomy, actual authoring checks, compact detail reachability and end-to-end repair journey. |
| History, exact revision comparison and latest-group undo | Activity panel; history editor; explicit Undo command | [Latest-group undo](../website/tests/modelling.spec.js#L2173), [revision comparison and activity](../website/tests/modelling.spec.js#L2205) | Multi-actor journey and human understanding of undo scope and shared impact. |
| View suggestions/follow pause/resume | AI activity and view-follow status | [Suggestion activity](../website/tests/modelling.spec.js#L2205), [follow pause/resume](../website/tests/modelling.spec.js#L2249) | Verify no focus theft during a full edit/check journey; AI/client behavior remains simulated where noted. |
| Readiness, review decisions and reopen | Review editor and state-specific actions | [Review gates and cross-client invalidation](../website/tests/modelling.spec.js#L1935), [review workflow navigation](../website/tests/modelling.spec.js#L2118) | Complete accept/reject/reopen transition matrix and human review of evidence/role clarity. |
| Preflight, prepare, reserve, commit, push, draft PR and reconciliation | Publish stage of Review, backed by existing journal | [Target preflight](../website/tests/modelling.spec.js#L1489), [simulated draft PR](../website/tests/modelling.spec.js#L1564) | Full failure/recovery matrix; tests are simulated and do not prove a real studio publication. |
| Publication history, exact-SHA workflows and required-policy lookup | Review -> Publication history and Verify | [Publication history and journal](../website/tests/modelling.spec.js#L1489), [exact commit workflow lookup](../website/tests/modelling.spec.js#L1520) | Exact-SHA live service behavior, role limitations and actual deployment/branch-policy distinction. |

The links identify behavior coverage, not proof that every linked scenario passed on the current head or that the complete capability is accepted. Track current-SHA execution in the [UX status ledger](ontology-modelling-ide-ux-status.md). No row is complete merely because its old section was hidden; use the remaining-acceptance column to drive the J1-J14, feature-parity and human review work.

## 13. Execution phases and deliverables

Execute in this order, producing working vertical slices. All phases below are required for this plan; optional future integrated chat is excluded. The first convincing IDE screen should arrive in U1/U2, followed by complete workflow coverage. Do not spend the whole implementation building generic UI infrastructure before showing a real model.

### U0. Baseline, scenarios and evidence

- Reinspect branch, instructions, current capabilities and existing uncommitted work. Record baseline commit and exact local run instructions.
- Capture current desktop/compact screenshots and the real maintenance modelling journey. Use an isolated synthetic workspace; preserve the user's running service and draft database.
- Record existing coverage and map every feature in section 12 to its future destination.
- Choose an ordinary graph and a dense/high-degree example from the model; add synthetic scale data only for explicit stress measurements.
- Create an execution ledger with phase status, commit, local checks, GitHub checks, screenshots, known gaps and next step.

**Exit:** A reproducible baseline and feature inventory; no assumptions that a green test suite proves good UX. Suggested ledger: `docs/ontology-modelling-ide-ux-status.md` (create during execution).

### U1. Full-screen shell and visual foundation

- Isolate the modelling route from website chrome; retain correct base-path routing and the skip link.
- Introduce design tokens, two themes, accessible primitive controls, application bar, activity rail, panels and status bar.
- Implement resize/collapse/reset, width-based inspector drawer and compact navigation.
- Connect the real existing graph and selected-entity detail so the shell is functional immediately. Route legacy advanced functionality into temporary named task panels without dropping it.
- Review actual 1280 x 800 and 1920 x 1080 screenshots and fix density, contrast and clipping before progressing.

**Exit:** A real model visibly occupies an IDE workspace; no full-page control list, lost features or unusably compressed canvas. Theme, resize and keyboard panel navigation work.

### U2. Workspace controller, explorer and documents

- Extract transport, capabilities, event subscription, async-read guards and revision state from the monolithic component.
- Implement the required explorer/search reads, searchable tree, workspace welcome/switcher, view tabs, selection/root separation and navigation history.
- Add command registry/palette and consistent selection synchronization across explorer, graph and inspector.
- Restore only valid workspace/view preferences; retain dirty inputs during live updates.

**Exit:** Find a concept, open two views, navigate Back/Forward, refresh and switch workspaces without losing acknowledged work or showing another workspace's cached data. Enumeration covers beyond the previous result cap.

### U3. Professional canvas and saved views

- Implement custom cards, directional/cardinality edge labels, selected-edge inspection and measured-node layout.
- Add readable initial framing, progressive incoming/outgoing expansion, zoom/focus/minimap, filters and explicit layout actions.
- Implement multi-select, alignment, grouping, notes, local pinning, view-local positions and separate view-save state.
- Preserve keyboard/list equivalents and worker failure recovery; wire saved-view load/save/export and conflict handling.

**Exit:** A modeller can understand and navigate both ordinary and dense neighbourhoods without tiny default text or unexpected layout movement. Two views retain independent positions and restore correctly.

### U4. Contextual authoring and perspectives

- Implement creation forms, editable property rows, searchable types/targets, relationship gesture/form parity and multiplicity selectors.
- Add field-level validation, compatibility warnings, Apply/Cancel, unsaved-input navigation and stale-edit comparison.
- Integrate supported constraint templates, requirements, responsibility bindings and temporal policy into contextual sections.
- Show success only after acknowledgement; preserve operation IDs during uncertain outcomes.

**Exit:** Create a concept, relationship and supported constraint, correct a field and inspect its source through the new UI. A conflicting edit from the second client retains input and cannot overwrite silently.

### U5. Problems, changes and AI collaboration

- Add Check split button and job/results restoration, normalized problems where available, source/concept navigation and stale-evidence handling.
- Build semantic/source diff editors, scoped impact, exact historical comparison and safe latest-command undo.
- Add real event-derived AI activity, follow/pause/resume and previewable context/repair copying.
- Keep bounded activity/output lists usable and make infrastructure errors distinct from model errors.

**Exit:** A failed check can be understood, navigated, repaired and rerun from one workspace. AI/manual changes appear accurately without stealing focus or pretending there is an integrated chat runtime.

### U6. Review and publication UX

- Implement the Review editor with evidence, independent cases, decisions, reopen and stale-state transitions.
- Move publication operations into the guided Publish/Verify stages, preserving each backend guard and journal state.
- Explain missing role, baseline movement, stale checks and unavailable policy with a precise next action.
- Verify exact-commit workflows; keep skipped/pending/unknown distinct from passing.

**Exit:** Existing review/publication capabilities are reachable and understandable. Synthetic publication tests pass and are labelled synthetic; an actual GitHub publication is claimed only if performed and evidenced with the required authorization.

### U7. Accessibility, responsiveness and performance

- Finish keyboard paths, screen-reader names/focus announcements, contrast, touch targets, reduced motion and forced-color behavior.
- Exercise compact/mobile editing, error handling, dialog scrolling, long values and 200%/400% zoom layouts.
- Measure the real canvas/controller as well as worker time; address excessive renders, layout churn and unbounded reads.
- Check disconnected/expired sessions, page reload, two clients, delayed responses and all states in section 10.

**Exit:** The measurable criteria in section 14 pass or an explicit limitation prevents a completion claim. No regression in website routes or existing public-link protections.

### U8. End-to-end acceptance and handoff

- Run all required user journeys with screenshots/traces and the final feature-parity checklist.
- Conduct a human task walkthrough using task prompts rather than click instructions; record confusion and fix the resulting issues.
- Update developer/user documentation and the execution ledger with how to open, edit, check, recover and review.
- Commit/push described changes and inspect checks for the exact final SHA. Record pending checks honestly.

**Exit:** Every required phase and acceptance scenario has evidence. Report remaining gaps by name, including unavailable human or live-publication evidence. Do not equate visual polish, code completion or CI success with proven usability.

### Delivery and iteration rules

Each phase should end in a reviewable commit or small coherent series, with the app working locally. Run focused checks while iterating and broader relevant checks at integration boundaries; do not rerun the entire ontology suite for a spacing-only adjustment. GitHub remains the shared verification record after push. If a phase reveals a contract gap, update this plan and ledger before disguising it as a UI-only omission.

Phases U1-U4 deliver the main modelling experience; U5-U8 complete the daily workflow and acceptance. These are milestones, not equal percentages of effort. Produce a time estimate only after U0/U1 identify actual contract and component work, and revise it using delivered slices rather than promises about nominal completion percentages.

## 14. Acceptance scenarios and quality thresholds

### User journeys

| ID | Task | Required result |
|---|---|---|
| J1 | Open the local studio and resume work | Pairing/session flow leads to the right workspace; normal use does not require typing a UUID; saved view and clean state restore |
| J2 | Find a concept by name or browse its module | Explorer/search and inspector agree; parent, definition and related concepts are understandable |
| J3 | Open two modelling views and compare them | Selection, viewport and positions are independent; returning to a tab restores context |
| J4 | Create a maintenance concept and station relationship | Contextual forms and gesture alternative apply correct typed commands; diagram and inspector reflect acknowledged changes |
| J5 | Edit a property and supported constraint | Multiplicity/type/allowed values are clear; invalid values produce actionable field errors; inherited fields are not edited on the wrong owner |
| J6 | Navigate a dense concept neighbourhood | Start at readable scale, expand selectively, inspect incoming/outgoing relationships and reveal omitted counts |
| J7 | Make concurrent manual and AI/client edits | Both clients see committed changes, dirty input survives, stale edits require review and follow mode yields to manual work |
| J8 | Diagnose, fix and rerun a failed check | Problems opens the correct field when known, preserves unknown failures honestly and reports fresh results for the repaired revision |
| J9 | Inspect information, responsibility and temporal views | Shared context, explicit mappings, clear missing-mapping state and no invented assertions |
| J10 | Review an exact draft and inspect publication state | Semantic/source changes, evidence and roles are clear; stale or incomplete candidates cannot be accepted/published |
| J11 | Recover from a dropped connection or lost response | Visible recovery, no duplicate writes, acknowledgement/unknown states distinguished and draft retained |
| J12 | Complete core editing with keyboard and narrow screen | Search, select, add/edit, validate and inspect changes work without dragging or horizontal page scrolling |
| J13 | Save a view, change its layout and handle a conflicting save | Presentation and semantic states remain separate; no silent shared-view overwrite |
| J14 | Undo the latest shared command group | User sees actor and affected work; server performs supported reversal; newer events invalidate stale undo intent |

### Visual and usability acceptance

- Required screenshots: welcome, default connected view, selected concept, relationship editor, dense neighbourhood, Problems, Changes/Review and compact layout. Capture light and dark themes across 1280 x 800 and 1920 x 1080; include focused 390 px and 320 CSS px checks. Use deterministic synthetic data and scrub credentials.
- At desktop sizes, Check, Review changes, model search and Add are discoverable without page scrolling. At 1280 x 800 the initial diagram remains at least 560 px wide; panel drawers provide access without squeezing it into a strip.
- At normal graph scale, concept headings and primary relationship labels are readable. The selected concept is not obscured by a panel or floating toolbar. Long labels, empty models, inherited properties and high-degree nodes are represented in visual QA.
- No unexpected full-page horizontal scroll, clipped dialog actions, overlapping labels on the selected path or stale spinner after a terminal job state.
- Human walkthrough target: a modeller unfamiliar with the screen can locate/inspect a concept within 60 seconds, add a relationship within 3 minutes and find the cause of a mapped validation failure within 2 minutes, excluding service/check execution time. Treat these as targets to measure, not claimed results.
- Record assistance required, wrong turns, lost work and task outcome. Fix any severe issue involving lost input, ambiguous write target, accidental publication or inability to finish a core task. Automated screenshots cannot replace this observation.

### Responsiveness and performance budgets

Record browser, machine, dataset, cold/warm conditions and sample count. Initial targets on the available development machine:

| Interaction/workload | Target |
|---|---|
| Visible acknowledgement of click, selection or opening a local panel | Within 100 ms, with remote reads allowed to continue behind a loading state |
| Search input | Never blocked by layout; start search after approximately 150-250 ms debounce; ignore superseded results |
| Warm bounded search on current repository | p95 result display within 500 ms on local service; record backend time separately |
| Default local workspace/view load after authentication | Useful explorer and first bounded view within 2 seconds warm; record cold start separately |
| Typical graph of 50 visible cards and 100 edges | Smooth usable pan/drag, target at least 45 fps on the recorded machine; no layout work on the UI thread |
| Stress view of 150 nodes / approximately 200 edges | Respond to input while layout runs; finish or expose progress/fallback within 3 seconds; never auto-render all ontology entities |
| Large explorer/search fixture, at least 1,000 concepts | Bounded reads and controlled rendering; correct paging, selection and keyboard navigation |

Thresholds are product acceptance targets, not existing benchmark claims. Measure several runs, record p50/p95 where applicable and investigate regressions. The existing layout benchmark measures worker messaging/layout, not total UI performance; extend evidence accordingly. Do not loosen budgets solely to make a check green.

### Verification plan

1. Preserve and adapt the existing real-service Playwright scenarios; keep assertions about observable behavior and server state rather than exact component markup.
2. Add focused controller/contract tests for stale-response rejection, complete pagination, view identity, capability gating and command idempotency where new code changes those guarantees.
3. Run desktop and compact browser journeys against isolated synthetic workspaces, plus visual review of the actual build. Mock external publication where necessary and identify it as simulated.
4. Add automated accessibility scanning if a suitable dependency is chosen, and manually test keyboard/focus behavior and at least the primary Windows screen-reader path when available. Record untested assistive environments.
5. Run relevant existing checks using the repository's supported environment. Typical commands from the repository root are:

   ```powershell
   npm.cmd run build --prefix website
   npm.cmd run check:public-links --prefix website
   npm.cmd test --prefix ontology-authoring
   ```

   Browser checks from `website`:

   ```powershell
   npx.cmd playwright test tests/modelling.spec.js --project=desktop
   npx.cmd playwright test tests/modelling.spec.js --project=mobile
   npm.cmd run benchmark:layout
   ```

   Select relevant tests during individual phases; use the full applicable suite for final integration. Respect existing Python/Playwright environment setup in `ontology-authoring/README.md` and CI. Expand workflow triggers/test globs if new test files require it.
6. If source contracts or generators change, regenerate derived outputs and run `python tools/check_generated.py` plus the appropriate semantic checks. New business invariants need deliberate negative and positive/boundary evidence per `AGENTS.md`; UI-only work does not justify changing domain rules.
7. Inspect Ontology authoring, Ontology CI and Website/Public App workflows as applicable for the exact pushed SHA. Distinguish not triggered, queued, running, skipped, failed and passed; do not reuse an earlier commit's green result.

Store reproducible UX evidence under `evidence/ontology-studio/ide/` during execution, with a README recording commit, scenario, viewport, theme and limitations. Keep private tokens, local databases, customer data and machine-specific environment files out of Git.

## 15. Risks, rollout and next-session handoff

| Risk | Mitigation |
|---|---|
| A polished shell hides an incomplete modeller | Track feature parity and end-to-end tasks throughout; require working real data in the first visual slice |
| Refactoring the large component loses session/event behavior | Extract controller incrementally; keep two-client, reconnect and idempotency scenarios green |
| Dense graph remains unreadable | Bound the initial view, show expansion counts, measure actual card sizes and separate selection from root navigation |
| Rich controls introduce keyboard/focus defects | Use established primitives/patterns and verify complete tasks with keyboard at each phase |
| Unsupported writes appear in context menus | Drive commands from real capabilities; document unsupported operations; preserve server enforcement |
| New API reads return inconsistent snapshots | Revision-pin cursors/reads, reject stale pages and invalidate caches by workspace/revision |
| View migration destroys layouts | Version local preferences and shared-contract changes; retain existing manifest support and Reset layout |
| Changes disrupt the user's local session | Use isolated test databases/ports; coordinate any necessary live service restart and never replace the user's draft |
| Scope expands into chat, rules engine or a VS Code clone | Deliver the listed modelling workflows first; estimate additional runtime integrations separately |
| Completion is overstated again | Report implementation, automated verification, human UX acceptance and actual publication evidence separately |

Roll out on the implementation branch in coherent commits, keeping the modelling route usable after each phase. A temporary internal switch may be used during migration, but do not permanently maintain two semantic pipelines or two independent studios. Once parity and acceptance pass, remove temporary legacy panels and redundant styles. Keep a clear revert path through commits; avoid destructive workspace/schema migration for presentation changes.

### Execution checklist

- [ ] U0: Reinspect baseline, capture scenarios and create execution ledger.
- [ ] U1: Deliver functional full-screen IDE shell and visual system.
- [ ] U2: Deliver explorer, controller, search, commands and view documents.
- [ ] U3: Deliver readable interactive canvas and complete saved-view workflow.
- [ ] U4: Deliver contextual editing, constraints and perspectives.
- [ ] U5: Deliver Problems, changes/history and honest AI collaboration.
- [ ] U6: Deliver review/publication workflow with existing guarantees.
- [ ] U7: Meet accessibility, recovery, compact-layout and performance criteria.
- [ ] U8: Complete journeys, human walkthrough, evidence, docs and exact-commit CI review.

### Instruction for the future implementation session

> Execute `docs/ontology-modelling-ide-ux-plan.md` in phases U0-U8. Begin by inspecting the actual branch and preserving existing local changes and user workspaces. Use the existing React, React Flow, ELK and MCP authoring foundation. Deliver working vertical slices and record evidence in the execution ledger. Preserve all current capabilities, revision/authorization guarantees and source ownership. Do not substitute a CSS reskin, static mockup or fake AI panel for the specified workflows. Run relevant local checks, commit and push completed work, and inspect GitHub checks for each final delivery commit. Report technical completion, human usability verification and any live publication evidence separately. Do not claim the IDE finished while required acceptance work remains.
