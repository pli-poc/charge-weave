# Ontology modelling IDE execution ledger

Plan: [ontology modelling IDE UX](ontology-modelling-ide-ux-plan.md). The redesign is in progress; the existing control-heavy studio is not the completed IDE.

## Baseline

- Implementation branch baseline: `c2d5104`, with the MCP studio and the UX plan committed.
- Existing browser coverage is in `website/tests/modelling.spec.js`; it uses isolated synthetic workspaces and includes two-client synchronization, editing, validation, views and review.
- The current canvas displays a bounded outgoing neighbourhood using React Flow and an ELK worker. Search is bounded and does not yet provide a complete module explorer or incoming references.
- Existing local workspace and unrelated modified files must be preserved; do not restart the user's service or reuse its live SQLite database in tests.
- UX acceptance and a real studio-initiated GitHub publication are not yet established.

## Progress

| Phase | State | Evidence and remaining work |
|---|---|---|
| U0 Baseline | Started | Source and browser tests inspected; capture before screenshots and complete feature inventory. |
| U1 Shell | Not started | Full-height application shell, panels, theme and responsive layout remain. |
| U2 Explorer | Not started | Complete navigation and revision-pinned reads remain. |
| U3 Canvas | Started | Initial framing now targets the selected concept at readable scale; custom cards, expansion and view-local state remain. |
| U4-U8 | Not started | Contextual editing, review, accessibility, performance and human acceptance remain. |
