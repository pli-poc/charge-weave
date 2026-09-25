# Research sources and method

Checked on 25 September 2026. Public primary sources were preferred. No private AMPECO tenant, commercial contract, internal database or source implementation was inspected.

## Primary register

| Source | What it supports | Evidence boundary |
|---|---|---|
| [AMPECO platform](https://www.ampeco.com/ev-charging-platform/) | Product scope extends across operations, customer experience, energy, commercial services and integrations | Vendor product positioning; not independent performance verification |
| [API functional components](https://developers.ampeco.com/docs/main-players) | Vendor actors and resource context | Used as a benchmark, not copied as canonical naming |
| [Models relationship](https://developers.ampeco.com/docs/models-relationship) | Relationships in the public resource model | Canonical design further separates identity, versions and evidence |
| [API reference](https://developers.ampeco.com/reference/authorization-1) | Full browser-visible navigation, displayed v3.253.0 | Raw navigation facts retained; one linked OAuth heading excluded from operation count |
| [Public OpenAPI specification](https://developers.ampeco.com/openapi/public-api.yaml) | Current header version and authentication contract | Read through web retrieval; complete raw-schema download was not obtained |
| [Official API exploration description](https://developers.ampeco.com/reference/api-ai-skill) | Identifies AMPECO's official public schema tooling | Used as documentation, not installed or executed |
| [Official schema index](https://github.com/ampeco/claude-code-ampeco-public-api-skill/blob/main/reference/schemas-index.md) | 971 named schema entries and property inventories, v3.251.8 | Older version than live navigation; generic schema names cannot be treated as self-explanatory business classes |
| [Official endpoint index](https://github.com/ampeco/claude-code-ampeco-public-api-skill/blob/main/reference/endpoints-index.md) | 651 operations, including OAuth paths, v3.251.8 | Equal counts do not establish equality of versioned endpoint sets |
| [Tariff create](https://developers.ampeco.com/reference/tariffcreate) | Detailed pricing and discount structures | All inspected fields have semantic dispositions; numeric equivalence to AMPECO calculations is not proven |
| [Charge point update](https://developers.ampeco.com/reference/chargepointupdate) | Personal/commercial distinctions, rate dependencies and separate monitoring/recovery controls | Deprecated and experimental behavior requires adapter version pinning |
| [Circuit create](https://developers.ampeco.com/reference/circuitcreate) | Multilevel load-management restrictions and electrical context | Some restrictions are vendor compatibility policy rather than universal electrical ontology truths |
| [Notifications subscribe](https://developers.ampeco.com/reference/notificationssubscribe) | Event subscription concepts and observed callback identifiers | Captured callback list is versioned, not presumed permanent |
| [OCA protocol overview](https://openchargealliance.org/protocols/open-charge-point-protocol/) | OCPP version distinctions and capability families | No protocol certification or exhaustive OCPP message ontology claimed |
| [EVRoaming OCPI overview](https://evroaming.org/ocpi/) | CPO/eMSP roles, roaming, OCPI 2.3.0 and optional modules | No wire adapter implementation claimed |
| [OWL 2 overview](https://www.w3.org/TR/owl2-overview/) | Ontology semantics, serialization and reasoning distinction | Formal semantics, not application completeness |
| [SHACL Recommendation](https://www.w3.org/TR/shacl/) | Structural validation and SPARQL constraint execution | Validation needs a correctly scoped, sufficiently complete graph |
| [PROV-O](https://www.w3.org/TR/prov-o/), [SOSA/SSN](https://www.w3.org/TR/vocab-ssn/), [OWL-Time](https://www.w3.org/TR/owl-time/), [QUDT](https://www.qudt.org/) | Candidate semantic alignment conventions | Alignment directions are documented; no unverified exact equivalence assertions |

The resource crosswalk contains the individual URLs and evidence levels for all 83 families. Some family pages were visible in navigation but their detailed bodies could not be retrieved. Their mappings rely on the catalogue, related pages and the official index; this weaker evidence remains marked.

## Method

1. Inventory the complete observed resource/action/log/subscription navigation, preserving source titles and paths.
2. Remove navigation headings from operation counts and distinguish deprecated aliases from new domain concepts.
3. Inspect representative endpoint bodies, relationship guides and the official schema/property inventory.
4. Build independent business concepts around identity, responsibility, time, immutable evidence and financial meaning.
5. Trace every observed resource and operation to concrete canonical classes. Audit complex pricing fields separately.
6. Compile machine-readable OWL and SHACL from the declarative source, then test inference, valid data, deliberate violations and allowed boundaries.
7. Separate demonstrated catalogue coverage from unverified payload parity and executable-product acceptance.

## Research conclusions

AMPECO is a useful breadth benchmark, but an independent semantic model should not mirror HTTP resources mechanically. A single vendor resource can combine physical hardware, a service role, a financial obligation and a mutable configuration. Conversely, create/read/update variants of one API schema do not necessarily justify separate ontology classes.

Product parity cannot be inferred from class counts, ontology consistency or a navigation crosswalk. In particular, price precedence, experimental corporate billing, provider-specific terminals, configuration variants, private feature flags and protocol interoperability need explicit contracts and executable tests during implementation. The delivered model makes those responsibilities visible and traceable without claiming unavailable evidence.
