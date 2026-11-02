# Ontology modelling IDE execution ledger

Plan: [ontology modelling IDE UX](ontology-modelling-ide-ux-plan.md). The redesign is in progress; the existing control-heavy studio is not the completed IDE.

## Baseline

- Implementation branch baseline: `c2d5104`, with the MCP studio and the UX plan committed.
- Existing browser coverage is in `website/tests/modelling.spec.js`; it uses isolated synthetic workspaces and includes two-client synchronization, editing, validation, views and review.
- The canvas displays a bounded neighbourhood using React Flow and an ELK worker. Search remains bounded; the explorer supports revision-pinned pages and module filtering. Incoming references can be expanded within a bound, while hierarchical explorer navigation remains to be implemented.
- Existing local workspace and unrelated modified files must be preserved; do not restart the user's service or reuse its live SQLite database in tests.
- UX acceptance and a real studio-initiated GitHub publication are not yet established.

## Progress

| Phase | State | Evidence and remaining work |
|---|---|---|
| U0 Baseline | Started | Source and browser tests inspected; capture before screenshots and complete feature inventory. |
| U1 Shell | Started | Dedicated header, status bar, resizable panes, narrow-desktop inspector overlay, compact one-surface navigation and locally selectable system/light/dark appearance exist. Graph-control contrast and 320px navigation have focused browser checks. Complete responsive behavior, contrast across all controls and human visual review remain. |
| U2 Explorer | Started | Revision-pinned pagination, module groups, on-demand declared and inherited members, bounded requirement search and linking, saved-view opening, view tabs, a command palette and stale-search protection exist. Complete requirement enumeration, richer filtering and controller extraction remain. |
| U3 Canvas | Started | Initial framing targets the selected concept; cards show a module and field preview. Bounded incoming and outgoing expansion, view-local positions, neighbourhood history, explicit visible-node layout, presentation-only multi-selection and alignment, relationship inspection and a legend exist; additional modelling controls remain. |
| U4 Editing | Started | Field editing, origin filtering and explicit linked requirements are in the inspector; definition and field conflicts and some unsaved navigation are guarded. Other forms, richer controls and perspectives need further work. |
| U5 Checks and AI | Started | The primary Check action selects an existing validation profile, and a results dock offers Problems, Checks, Activity and Output. The inspector can preview and copy selected-concept context with revision identity, explicit requirement links and displayed check status; it does not send requests or include check output. The requirement lookup is bounded and reports its total. Validation details, recent activity and historical comparisons are available. A separate Changes editor groups before/after details and marks old comparisons out of date. Fuller change navigation and AI collaboration remain. |
| U6-U8 | Not complete | A dedicated Review editor groups the guide, review gates, decisions and publication controls, separate from the diagram and Changes documents. Validation changes from another client invalidate the last inspection. A complete staged review experience, accessibility, performance, full feature parity and human acceptance remain. |

## Local integration check

On implementation commit `e35a13bdf493458219cbdecb38aec74f1e71b690`, the full desktop and mobile `website/tests/modelling.spec.js` suite completed with **68 passed and six project-specific skips**. These tests used isolated synthetic workspaces; the publication scenario was simulated.

On compact-workbench commit `3bacd1ce64c3173afec15affc81391e5cbdd2ec3`, the full modelling browser suite completed locally with **80 passed and eight project-specific skips**. The focused modelling matrix succeeded on GitHub; ontology CI, ontology authoring, and the website workflow were still queued or running when inspected. These results do not establish real publication or independent usability acceptance. Subsequent changes require their own exact-commit verification.

The integrated appearance, canvas, requirement-inspector and correction-workflow changes were checked locally with **117 browser tests passed and 11 project-specific skips**, across the modelling, canvas-layout, studio-theme and client-runtime suites. The correction uses a synthetic case. GitHub verification and independent human usability acceptance remain separate.

The subsequent requirement explorer, alignment and keyboard/contrast integration was checked locally with **120 browser tests passed and 18 project-specific skips** across the modelling, canvas and theme suites. These automated results do not replace a human walkthrough or establish full accessibility.

The next integration adds view-local canvas pins that protect positions during automatic layout, short-viewport reflow, and restoration and monitoring of the latest validation job after reconnecting. Its local modelling, canvas and theme suite completed with **128 passed and 22 project-specific skips**; workspace and pin-storage tests added **24 passes**. The reflow test uses a small CSS viewport and is not evidence of a real browser zoom or screen-reader audit. GitHub verification and human usability acceptance remain separate.

The following integration adds a locally persisted comfortable/compact density choice and a separate, in-memory undo history for canvas layout changes. Its local modelling, canvas and theme suite completed with **135 passed and 25 project-specific skips**. An earlier run had one mobile explorer timing failure; that scenario subsequently passed three repeated runs and the full rerun. Generated outputs matched **311/311** with UTF-8 enabled. These results do not establish a human usability or accessibility audit.

The next integration updates validation status when another client runs a check, adds a canvas zoom indicator and reset, and increases touch control targets. Its local modelling, canvas and theme suite completed with **140 passed and 28 project-specific skips**, and 22 workspace tests passed. Touch checks cover 320 and 390 CSS pixel mobile viewports; tablet layout, real browser zoom, screen-reader review and human usability acceptance remain unverified.

The following integration restores local diagram pan and zoom by workspace, view and root, improves card text, and adds the supported controlled-value narrowing editor with stale-revision protection. Local verification completed with **147 browser tests passed and 31 project-specific skips**, plus six layout preference tests. A 1024×768 emulated touch viewport also kept its expanded results and status visible. Multi-badge card clipping, real browser zoom, screen-reader and human usability reviews remain to be addressed.
