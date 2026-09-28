# ChargeWeave Semantic Modeler — Architecture and Roadmap

Status: planned build phase

## Principle

**Model once, project many views.**

ChargeWeave does not introduce a second manually maintained enterprise-architecture model. OWL, SHACL, temporal semantics, workflow bindings and graph facts remain the semantic source of truth. The modeler creates purpose-specific graphical projections over that truth.

A diagram is therefore a **view definition plus a generated graph**, not an independent copy of business meaning.

## Client-only architecture

The first implementation is browser-native:

```text
ChargeWeave ontology / generated browser model
                    |
             viewpoint manifest
                    |
       SPARQL / projection selection
                    |
        normalized view graph
                    |
         mapping / notation profile
                    |
              ELK.js layout
                    |
 React Flow + ChargeWeave SVG renderer
                    |
          Explore / Design modes
```

No GLSP server and no modelling backend are required for the prototype.

### Planned libraries

- **React Flow**: canvas interaction, nodes, edges, selection, zoom, pan and custom node rendering.
- **ELK.js**: deterministic automatic graph layout in the browser.
- **ChargeWeave SVG notation layer**: project-owned rendering of standardized ArchiMate-style concepts.
- Existing ChargeWeave semantic artifacts remain authoritative.

Dependencies are intentionally not added until the implementation phase starts.

## Notation policy

The modeler may represent standardized architecture concepts such as Business Actor, Business Role, Business Process, Business Service, Application Component, Application Service, Data Object, Interface, Capability, Value Stream, Stakeholder and their relationships.

ChargeWeave will implement its own SVG rendering and visual design. It will not depend on Bizzdesign, copy Bizzdesign artwork/CSS/assets, or require Bizzdesign models.

## Projection model

A viewpoint definition declares:

1. semantic root or selection query;
2. included concept classes;
3. included relationship predicates;
4. depth and traversal rules;
5. notation mapping;
6. labels and semantic metadata;
7. layout hints;
8. optional filters;
9. permitted interaction mode.

Example conceptual mapping:

| ChargeWeave semantic concept | Architecture projection |
| --- | --- |
| Organization / CPO / eMSP | Business Actor |
| Operational responsibility | Business Role |
| Reconciliation | Business Process |
| Charging / settlement service | Business Service |
| CDR / Contract / Tariff | Business Object or Data Object |
| CPMS capability | Application Component / Service |
| performs / assignedTo | Assignment |
| uses / reads / writes | Access |
| precedes / emits | Triggering |
| serves | Serving |

Mappings are explicit and versioned. They are not inferred from visual placement.

## Generated viewpoints

Initial viewpoint families:

- **Business** — actors, roles, capabilities, services and processes.
- **Process** — events, decisions, workflow stages, human tasks and outcomes.
- **Application** — components, application services, interfaces and responsibilities.
- **Information** — business/data objects, provenance and semantic relationships.
- **Stakeholder** — participation, ownership, decisions, recipients and affected parties.
- **Journey** — process projection aligned with XFlow and the Me View.

The same semantic entity can appear in several viewpoints without being duplicated in the ontology.

## Interaction modes

### Explore

Read-only semantic projection. Users can pan, zoom, filter, inspect provenance, follow relationships, change viewpoints and drill into related entities or journeys.

### Design

Users can reposition nodes, create visual groups, hide detail, add annotations and save layout preferences. These actions update a **view definition**, not ontology semantics.

### Governed semantic edit — later phase

Semantic changes must be explicit. An edit is translated into semantic commands, shows a graph-delta preview, runs ontology and SHACL validation, and only then becomes a model change. Diagram manipulation must never silently rewrite semantic truth.

## Saved view definition

A saved view should contain presentation intent, for example:

```json
{
  "id": "reconciliation-business-v1",
  "viewpoint": "business",
  "root": "cw:Reconciliation",
  "projectionProfile": "business-core-v1",
  "layout": "layered",
  "positions": {},
  "groups": [],
  "hidden": [],
  "annotations": []
}
```

Semantic identifiers are references into the ChargeWeave model; the view does not copy their meaning.

## Build phases

### Phase 1 — Projection contract
Define viewpoint manifests, ontology-to-notation mappings, relationship rules, normalized view-graph schema, stable IDs, filtering and projection tests.

### Phase 2 — Browser renderer
Add React Flow and ELK.js. Implement ChargeWeave SVG nodes/edges and deterministic automatic layout. Keep rendering independent from semantic querying.

### Phase 3 — Explore mode
Generate real views from ChargeWeave data. Add zoom, pan, selection, inspector, semantic source/provenance, relationship tracing, filters and viewpoint switching.

### Phase 4 — Design mode
Persist layout, grouping, annotations, hidden elements and viewpoint preferences. Verify that presentation edits do not alter ontology facts.

### Phase 5 — Governed semantic editing
Add explicit model-edit commands, graph-delta preview, SHACL validation, ontology checks and auditable accepted changes.

### Phase 6 — Interchange and scale
Evaluate ArchiMate exchange interoperability, saved/shared viewpoints, large-graph virtualization, image/vector export, deep links and cross-view navigation.

## First usable release — acceptance criteria

The first release is complete when:

- a reconciliation architecture view is generated from ontology-backed data rather than hard-coded diagram objects;
- rendering and automatic layout run entirely in the browser;
- Business, Process and Information viewpoints can be switched over the same semantic source;
- every rendered semantic object can be traced to its source identifier;
- relationships are generated from model predicates/mapping rules;
- a user can save a presentation-only view;
- changing layout does not change ontology facts;
- projection output is deterministic for a fixed model, viewpoint and mapping version;
- tests cover projection mappings and semantic/presentation separation.

## Relationship with XFlow and Me View

XFlow remains the executable workflow contract. The Modeler can project workflow-related concepts into Process or Journey views. The Me View remains a user-centric explanation of where a person is in a live journey. These are different projections over connected semantic and runtime facts rather than competing process models.

## Architectural guardrail

> Ontology owns meaning. The modeler owns presentation. Runtime owns execution.

Crossing those boundaries must always be explicit and validated.
