# ChargeWeave product site and ontology explorer

React + Vite presentation site using the Midnight Network direction. The landing page remains an overview; dedicated pages describe the planned capabilities, architecture and roadmap. A read-only ontology explorer makes the published repository definitions inspectable. This is not the operational charging platform.

## Pages

| Route under `/charge-weave/` | Content                                                                                             |
| ---------------------------- | --------------------------------------------------------------------------------------------------- |
| `/`                          | Original product overview and use-case presentation                                                 |
| `capabilities/`              | Six capability areas, scenarios, boundaries and linked model definitions                            |
| `ontology/`                  | Searchable classes, directed relationships, fields, OWL/SHACL triples, rules and temporal inspector |
| `architecture/`              | Proposed runtime, service boundaries, validation and temporal query design                          |
| `roadmap/`                   | Current foundation, product exploration and planned implementation stages                           |

Each page has a real static `index.html` entry and page-specific metadata, so direct links and refreshes work on GitHub Pages. Class selection is shareable, for example `ontology/?class=TariffVersion`. The concept image is available from a disclosure at the bottom of the explorer; it is a visual study, not the source of model facts.

## Develop and verify

Use Node.js 24 and npm:

```sh
cd website
npm ci
npm run dev
npm run build
npx playwright install chromium
npm test
```

The prebuild/predev task runs `scripts/build-model.mjs`. It reads the existing `model/catalog.json`, `model/rules.json`, `model/domain.schema`, the complete ontology Turtle, and the structural/vocabulary SHACL. It does not modify ontology sources or their generated artifacts. N3 parses the actual RDF; no graph edges are fabricated from an image. Source model updates are handled by the repository's existing generators before the website build.

The generated class catalog is loaded only by the explorer. Schema triples are fetched separately when needed, keeping the marketing pages independent of the full RDF data. A content-hashed data filename keeps cached triples aligned with the generated class snapshot. Generated web data and build output are ignored and regenerated on every build. The inspector displays the source model version and schema digest.

## Explorer semantics

- Graph arrows summarize object-property **class contracts**, not instance assertions. They retain property direction and per-class cardinality; pagination keeps large neighborhoods readable. An accessible relationship list offers the same inspection actions.
- Selecting an edge inspects the property on the declaring class. Following a node changes the focused class. Fields can include inherited contracts, and rules include targets on the selected class and its ancestors.
- The triples view displays real source-backed OWL and structural/vocabulary SHACL, with referenced blank-node closure. Filter by subject, predicate, object or source; export the current filtered set as N-Triples. Blank-node display aliases do not change exported identities.
- The temporal inspector lists declared date/time fields and record provenance. `createdAt` and `revision` are explicitly distinguished from a complete system-time history.
- The correction controls are a **synthetic design illustration** of effective-time/known-time selection, not live queries and not an implemented bitemporal store.
- Rules are inspectable SPARQL definitions. This viewer does not execute validation, reasoning, arbitrary SPARQL, GraphQL or operational commands. No claim of business completeness follows from viewing the definitions.

## Deployment and checks

`.github/workflows/website-pages.yml` installs locked dependencies, builds, checks the production artifact with desktop and mobile Chromium, and deploys to GitHub Pages on `main`. Relevant model and RDF changes also trigger the website workflow. Pull requests run checks without deploying. Screenshots and reports are retained as workflow artifacts.

Checks cover existing landing interactions, direct page loads, responsive overflow, navigation, class search, edge inspection, inheritance, source RDF export, rule inspection, temporal examples and class deep links.

GitHub Pages must use **Settings → Pages → Source → GitHub Actions**. The deployment job requires `pages: write` and `id-token: write`; the build has read-only repository access.

Public URL: https://pli-poc.github.io/charge-weave/

For a custom domain or renamed repository, update the Vite `base` and page metadata origins together. There are no accounts, analytics, forms or live customer data. Manrope is served locally. The campus image and explorer concept were generated for this presentation; they do not depict an operating ChargeWeave installation. Both are committed as compressed WebP assets.
