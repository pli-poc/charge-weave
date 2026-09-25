# Independent audit sources

Reviewed 25 September 2026. Product-policy inferences are identified separately from externally specified behavior. Legal applicability is an explicit assessment, not inferred from a passing ontology test.

| ID | Primary source | Use and limitation |
|---|---|---|
| OCA-CORE | [Open Charge Alliance: OCPP protocol scope](https://openchargealliance.org/protocols/open-charge-point-protocol/) | Versioned station/control capabilities; bidirectional extensions are distinct capabilities, not assumed support. |
| OCA-CERT | [Open Charge Alliance: OCPP 2.0.1 certification profiles](https://openchargealliance.org/certificationocpp/certification-ocpp-2-0-1/) | Core, security and feature profiles inform explicit capability evidence; ontology checks do not certify protocol conformance. |
| OCA-UPTIME | [Open Charge Alliance: Improving Uptime Monitoring with OCPP](https://openchargealliance.org/wp-content/uploads/2024/08/improving_uptime_with_ocpp_v1_2.pdf) | Offline observations and authorization policy affect recovery and availability evidence. |
| OCPI-CDR | [EVRoaming Foundation: OCPI 2.3.0 CDR module](https://github.com/ocpi/ocpi/blob/2.3.0/release/core/mod_cdrs.asciidoc) | Immutable billing records, credit lineage, party boundaries and recovery after missed deliveries. |
| OCPI-TARIFF | [EVRoaming Foundation: OCPI 2.3.0 tariff module](https://github.com/ocpi/ocpi/blob/2.3.0/release/core/mod_tariffs.asciidoc) | Component restrictions and precedence are distinguished from jurisdictional rounding and tax decisions. |
| OCPI-CREDENTIALS | [EVRoaming Foundation: OCPI 2.3.0 credential lifecycle](https://github.com/ocpi/ocpi/blob/2.3.0/release/core/credentials.asciidoc) | Registration, version and role negotiation and removal belong to the partner lifecycle. |
| PSP-EVENTS | [Payment provider: asynchronous event handling](https://docs.stripe.com/webhooks) | Duplicates and unordered arrival motivate canonical idempotency/effect evidence. Provider-specific retry durations are not universal domain rules. |
| PSP-REFUND | [Payment provider: refunds](https://docs.stripe.com/refunds) | Refunds have asynchronous outcomes and must preserve original collection and currency references. |
| PSP-DISPUTE | [Payment provider: dispute process](https://docs.stripe.com/disputes/how-disputes-work) | Network disputes, response evidence and financial effects are distinct from service complaints. |
| EC-AFIR | [European Commission: alternative-fuels infrastructure Q&A](https://transport.ec.europa.eu/transport-themes/clean-transport/alternative-fuels-sustainable-mobility-europe/alternative-fuels-infrastructure/questions-and-answers-regulation-deployment-alternative-fuels-infrastructure-eu-20231804_en) | Ad hoc purchase and advance price disclosure inform the offer model. Actual legal applicability depends on jurisdiction and infrastructure context. |
| EDPB-RIGHTS | [European Data Protection Board: data subject rights](https://www.edpb.europa.eu/topics/key-gdpr-concepts/data-subject-rights_en) | Rights requests, purpose and justified retention are modeled separately from account closure. Conditions and legal assessments remain explicit. |
| W3C-SHACL | [W3C: Shapes Constraint Language](https://www.w3.org/TR/shacl/) | Structural and SPARQL constraints validate a supplied graph; they do not establish factual truth or runtime enforcement. |
| CW-POLICY | [ChargeWeave canonical business policy](docs/business-policy-decisions.md) | Responsibilities, readiness, arithmetic, lifecycle tables and evidence gates are product policies unless a more specific source is cited. |

The direct consolidated legal-text endpoints could not be retrieved in this session; regulatory context uses the linked Commission and regulator guidance. This audit does not claim a country-by-country legal certification.

Legacy catalogue references use `urn:chargeweave:legacy-api` / `urn:chargeweave:legacy-site` identifiers after requested current-tree debranding. They are redacted provenance identifiers, not working web links, and are not evidence for the independent requirement audit.
