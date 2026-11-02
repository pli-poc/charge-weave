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
| U1 Shell | Started | Dedicated header, status bar, resizable panes, narrow-desktop inspector overlay and compact one-surface navigation exist. Themes, complete responsive behavior and human visual review remain. |
| U2 Explorer | Started | Revision-pinned pagination, module groups, on-demand declared and inherited members, filtering, view tabs, a command palette and stale-search protection exist. Requirements/saved-view sections, richer filtering and controller extraction remain. |
| U3 Canvas | Started | Initial framing targets the selected concept; cards show a module and field preview. Bounded incoming and outgoing expansion, view-local positions, neighbourhood history and a legend exist; additional modelling controls remain. |
| U4 Editing | Started | Field editing and a field table are in the inspector; definition and field conflicts and some unsaved navigation are guarded. Other forms, richer controls and perspectives need further work. |
| U5 Checks and AI | Started | The primary Check action selects an existing validation profile, and a results dock offers Problems, Checks, Activity and Output. The inspector can preview and copy selected-concept context with revision identity and displayed check status; it does not send requests or include check output. Validation details, recent activity and historical comparisons are available. A separate Changes editor groups before/after details and marks old comparisons out of date. Fuller change navigation and AI collaboration remain. |
| U6-U8 | Not complete | A dedicated Review editor groups the guide, review gates, decisions and publication controls, separate from the diagram and Changes documents. Validation changes from another client invalidate the last inspection. A complete staged review experience, accessibility, performance, full feature parity and human acceptance remain. |

## Local integration check

On implementation commit `e35a13bdf493458219cbdecb38aec74f1e71b690`, the full desktop and mobile `website/tests/modelling.spec.js` suite completed with **68 passed and six project-specific skips**. These tests used isolated synthetic workspaces; the publication scenario was simulated.

On compact-workbench commit `3bacd1ce64c3173afec15affc81391e5cbdd2ec3`, the full modelling browser suite completed locally with **80 passed and eight project-specific skips**. The focused modelling matrix succeeded on GitHub; ontology CI, ontology authoring, and the website workflow were still queued or running when inspected. These results do not establish real publication or independent usability acceptance. Subsequent changes require their own exact-commit verification.
