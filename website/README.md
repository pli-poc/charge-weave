# ChargeWeave product site, operations console, and ontology explorer

React + Vite presentation site using the Midnight Network direction. The landing page remains an overview; dedicated pages describe the planned capabilities, architecture, roadmap and an executable browser-only synthetic runtime. The isolated `console-app/` package builds a ChargeWeave operations-console concept into `/app/` on the same GitHub Pages site. Its demonstration data covers owned charge points and parking locations in the Netherlands and Belgium, plus Europe-wide Chargecard roaming, all in EUR. It has no production data connections.

## Pages

| Route under `/charge-weave/` | Content                                                                                             |
| ---------------------------- | --------------------------------------------------------------------------------------------------- |
| `/`                          | Original product overview and use-case presentation                                                 |
| `capabilities/`              | Six capability areas, scenarios, boundaries and linked model definitions                            |
| `ontology/`                  | Searchable classes, directed relationships, fields, OWL/SHACL triples, rules and temporal inspector |
| `architecture/`              | Proposed runtime, service boundaries, validation and temporal query design                          |
| `roadmap/`                   | Current foundation, product exploration and planned implementation stages                           |
| `developer/`                 | Browser-hosted synthetic runtime and the principles behind its replaceable boundaries                |
| `developer/simulator/`       | Run seeded journeys and inspect protocol fixtures, process state and simulated stores                |
| `developer/protocols/`       | Versioned protocol-shaped simulation for OCPP, OCPI and selected vehicle-to-equipment journeys        |
| `developer/switchboard/`     | Independent virtual, observe, hybrid and live adapter modes                                           |
| `developer/storage/`         | Simulated semantic, operational, temporal, telemetry and evidence stores                               |
| `developer/replay/`          | Seeded data generation, virtual time, fault injection and reproducible run records                     |
| `app/`                       | Isolated operations console concept for owned NL/BE sites, European Chargecard roaming, energy, finance and data views |

Each page has a real static `index.html` entry and page-specific metadata, so direct links and refreshes work on GitHub Pages. Class selection is shareable, for example `ontology/?class=TariffVersion`. The concept image is available from a disclosure at the bottom of the explorer; it is a visual study, not the source of model facts.

## Develop and verify

Use Node.js 24 and npm. The website and operations console have separate npm projects and lockfiles:

```sh
cd website
npm ci
npm run dev
npm run build
npx playwright install chromium
npm test
```

```sh
cd console-app
npm ci
npm run dev
npm test
npm run build
```

The deployment workflow builds `console-app/` independently, then copies its static output into `website/dist/app/`. The console uses only browser-side synthetic fixtures. Its geographic view uses Leaflet with interactive OpenStreetMap tiles, so that view requires internet access and shows OpenStreetMap attribution. Its demo source module is a replaceable data-provider boundary; it does not call OCPP, OCPI, payments, roaming hubs, or production storage.

The prebuild/predev task runs `scripts/build-model.mjs`. It reads the existing `model/catalog.json`, `model/rules.json`, `model/domain.schema`, the complete ontology Turtle, and the structural/vocabulary SHACL. It does not modify ontology sources or their generated artifacts. N3 parses the actual RDF; no graph edges are fabricated from an image. Source model updates are handled by the repository's existing generators before the website build.

The generated class catalog is loaded only by the explorer. Schema triples are fetched separately when needed, keeping the marketing pages independent of the full RDF data. A content-hashed data filename keeps cached triples aligned with the generated class snapshot. Generated web data and build output are ignored and regenerated on every build. The inspector displays the source model version and schema digest.

## Explorer semantics

- Graph arrows summarize object-property **class contracts**, not instance assertions. They retain property direction and per-class cardinality; pagination keeps large neighborhoods readable. An accessible relationship list offers the same inspection actions.
- Selecting an edge inspects the property on the declaring class. Following a node changes the focused class. Fields can include inherited contracts, and rules include targets on the selected class and its ancestors.
- The triples view displays real source-backed OWL and structural/vocabulary SHACL, with referenced blank-node closure. Filter by subject, predicate, object or source; export the current filtered set as N-Triples. Blank-node display aliases do not change exported identities.
- The temporal inspector lists declared date/time fields, their roles, linked interval/recurrence definitions and record provenance. It identifies the relationship source/target context and shows each class policy and links to the implemented temporal contract. `createdAt` and `revision` are explicitly distinguished from a complete system-time history.
- The correction controls read **committed synthetic RDF evidence** from the executable reference writer. Two-axis history, selected payload triples, digests, schema identity, checkpoints and SPARQL source are inspectable. Prebuild compares 63 browser selections against actual reference SPARQL results. No live endpoint is connected.
- Rules are inspectable SPARQL definitions. This viewer does not execute validation, reasoning, arbitrary SPARQL, GraphQL or operational commands. No claim of business completeness follows from viewing the definitions.

## Deployment and checks

`.github/workflows/website-pages.yml` installs locked dependencies, builds, checks the production artifact with desktop and mobile Chromium, and deploys to GitHub Pages on `main`. Relevant model and RDF changes also trigger the website workflow. Pull requests run checks without deploying. Screenshots and reports are retained as workflow artifacts.

Checks cover existing landing interactions, direct page loads, responsive overflow, navigation, class search, edge inspection, inheritance, source RDF export, rule inspection, temporal examples and class deep links. Runtime tests also cover seeded replay, OCPP/OCPI fixture envelopes, authorization rejection, duplicate delivery, late readings, CDR credit lineage and independent adapter selection.

The developer guide includes a frontend-only synthetic runtime. It runs seeded roaming-charge journeys and simulates OCPP 2.1 Edition 1 and OCPI 2.3.0 Core exchange subsets entirely in browser memory. It does not add protocol endpoints, connect to live charging equipment or claim protocol certification. Store and input adapters are replaceable through the runtime factory; no live adapters are registered.

GitHub Pages must use **Settings → Pages → Source → GitHub Actions**. The deployment job requires `pages: write` and `id-token: write`; the build has read-only repository access.

Public URL: https://pli-poc.github.io/charge-weave/

For a custom domain or renamed repository, update the Vite `base` and page metadata origins together. There are no accounts, analytics, forms or live customer data. Manrope is served locally. The campus image and explorer concept were generated for this presentation; they do not depict an operating ChargeWeave installation. Both are committed as compressed WebP assets.
