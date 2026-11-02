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
| U1 Shell | Started | Dedicated header, resizable panes, narrow-desktop inspector overlay and compact navigation exist. A full-height shell, themes and complete responsive behavior remain. |
| U2 Explorer | Started | Revision-pinned pagination, module filtering and stale-search protection exist. Hierarchical navigation, view tabs, command palette and controller extraction remain. |
| U3 Canvas | Started | Initial framing targets the selected concept; cards show a module and field preview. Bounded incoming and outgoing expansion and view-local positions exist; additional modelling controls remain. |
| U4 Editing | Started | Field editing is in the inspector; definition and field conflicts and some unsaved navigation are guarded. Other forms, richer controls and perspectives need further work. |
| U5 Checks and AI | Started | Check/review actions and a validation area with an initial empty state are available. Dedicated Problems, Changes and AI panels remain. |
| U6-U8 | Not complete | Guided review/publication, accessibility, performance, full feature parity and human acceptance remain. |

## Local integration check

On implementation commit `353e76620c6c9d1399f3977f217f005bea8b5f33`, the full desktop `website/tests/modelling.spec.js` suite completed with **24 passed and one mobile-only test skipped**. The mobile relationship/navigation scenario also passed separately during implementation. These tests used isolated synthetic workspaces; the publication scenario was simulated.

The three pull-request workflows for that exact commit were queued or pending when inspected. Local results do not establish GitHub verification, real publication or independent usability acceptance. Subsequent changes require their own verification.
