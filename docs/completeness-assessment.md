# Completeness assessment against AMPECO

> Repository import clarification: this assessment concerns the captured public catalogue. An independent actor/journey/lifecycle/exception completeness audit has not been completed. See [the pending audit](business-domain-audit.md).

Assessment date: **25 September 2026**. The canonical design is independent of AMPECO's naming and internal implementation.

## Finding

AMPECO is appropriately understood as a charging-management business platform. Its public product navigation covers white-label customer experiences, charging operations, payments, tariff plans, partner management, roaming, energy management, maintenance and home charging. The benchmark therefore needs more than charger connectivity and session tracking. [AMPECO platform](https://www.ampeco.com/ev-charging-platform/)

This release provides a broad semantic model for that scope and accounts for every family and operation page in the captured public reference navigation. It also adds supporting accounting, provenance, identity, power-allocation and governance concepts that should be explicit in an independent CPMS.

## Evidence levels and denominators

| Claim | Result | Boundary |
|---|---|---|
| Captured resource families have canonical classes and shapes | 83 of 83 | Resource-family coverage, including deprecated families |
| Captured operation pages have a domain mapping | 651 of 651 | 652 candidate sidebar entries, minus one linked OAuth section heading |
| Authentication operations checked in detail | 2 of the 651 operations | OAuth exchange and revocation map to client identity and token-lease metadata |
| Observed callback identifiers catalogued | 45 | Does not assert that all private or future callback types are known |
| Canonical action kinds | 93 | Action intents, not implemented API calls or parameter serializers |
| Inspected pricing and discount properties mapped | 62 of 62 | 55 pricing properties plus 7 discount-settings properties |
| Domain classes have structural contracts | 235 of 235 | Includes abstract Record and root Tenant |
| Non-abstract classes represented in example | 234 of 234 | Synthetic integration fixture, not a workload benchmark |
| Business rules have adverse fixtures | 109 of 109 | One specific counterexample per rule, plus selected positive boundaries |
| All public API fields and vendor business rules reproduced | Not established | No full field-by-field parity or adapter certification claim |
| Private tenant behavior, scale and reliability reproduced | Not established | Requires access, executable services and deployment tests |

The live reference reported version **v3.253.0**. AMPECO's official GitHub-generated schema and endpoint indexes reported **v3.251.8**, with 971 schema definitions and 651 operations. These are distinct snapshots, not interchangeable counts. The live OpenAPI header was independently read. Raw full-spec acquisition was unavailable through the direct download route, so this release does not pretend to have run an exhaustive latest-version OpenAPI schema diff. Selected endpoint bodies and the full tariff-create schema supplied deeper evidence. The resource crosswalk records weaker evidence for pages whose bodies could not be retrieved.

## Domain coverage

| Domain | Classes | Included responsibilities |
|---|---:|---|
| Foundation | 15 | Tenancy, identity metadata, external IDs, evidence, time, quantities and lifecycle records |
| Identity | 14 | Legal parties, people, service operators, principals, roles, grants, accounts and groups |
| Places | 9 | Sites, areas, parking, map publication, access, notices and sharing |
| Assets | 11 | Stations, EVSEs, connectors, meters, equipment capabilities, wiring and ownership |
| Device management | 10 | Protocol endpoints, device variables, templates, firmware, diagnostics and observations |
| Vehicles and authorization | 11 | Vehicles, telemetry, credentials, decisions, local lists and Plug & Charge enrollment |
| Commands and booking | 6 | Commands, acknowledgements, outcomes, future bookings and immediate reservations |
| Sessions and metering | 11 | Source envelopes, canonical sessions, wire transactions, measured values, CDRs and clock assessment |
| Pricing | 23 | Immutable tariffs, components, tiers, discounts, bounds, dynamic feeds, subsidies and hold policies |
| Billing and tax | 13 | Rating, tax determination, invoice lines, credit notes, receipts and fiscal evidence |
| Payments and ledger | 19 | Payment instruments, holds, captures, refunds, disputes, wallets, journals and payouts |
| Subscriptions and benefits | 9 | Plans, billing cycles, allowances, energy coupons and consumption reversals |
| Partners and settlement | 16 | Contracts, revenue/cost allocation, settlements, corporate coverage and home reimbursement |
| Roaming | 11 | Parties, hubs, negotiated modules, commands, exchanges, publication and boundary policies |
| Energy | 21 | Grid connections, control groups, schedules, constraints, forecasts, flexibility, DER and DC sharing |
| Operations | 10 | Faults, incidents, recovery, work orders, installation and measured availability |
| Security and governance | 10 | Certificates, security/audit events, consent, retention, compliance evidence and token leases |
| Integration and experience | 16 | API clients, event delivery, white-label channels, templates, applications, metrics and assisted actions |

The class dictionary is the exact contract; these summaries do not add undeclared model terms.

## Difficult distinctions that are now explicit

Physical wiring and control allocation differ. A charging unit can offer alternative connectors. A protocol transaction is not a payment. A payment hold is not captured money. A CDR can be external and have no local session. Reimbursement rates and corporate payer splits must retain the policy version used. Coupon reversals adjust consumption, while credit notes correct billing documents. Unknown payment availability is different from a known empty set. A successful command requires completion evidence beyond acceptance. These distinctions reduce ambiguity in downstream implementation.

## Product capability versus executable system

| Capability family | Semantic representation | Required runtime evidence |
|---|---|---|
| Hardware independence | EquipmentModel, DeviceCapability, ProtocolEndpoint, ConfigurationVariable | Interoperability tests with actual firmware and protocol versions |
| Remote control and recovery | RemoteCommand, CommandOutcome, RecoveryPolicy, RecoveryAttempt | Correlation, retry, timeout and fault-injection tests |
| Energy optimization | LoadControlGroup, PowerConstraint, ChargingSchedule, FlexibilityActivation | Capacity safety, stale meter handling, offline fallback and optimizer tests |
| Charging commerce | TariffVersion, RatingCalculation, Invoice, PaymentCapture, Journal | Golden pricing calculations, PSP certification, ledger reconciliation |
| Corporate and home charging | CorporateBillingSnapshot, CorporateCostAllocation, ReimbursementRecord | Historical-policy replay, eligibility and payout reconciliation |
| Roaming | RoamingConnection, RoamingModuleAgreement, RoamingExchange, ChargeDetailRecord | Partner contract tests and protocol conformance |
| White-label experiences | BrandProfile, ExperienceChannel, ContentTemplate, CustomerNotification | Accessible operator/driver interfaces, localization and channel delivery |
| Integrations and assistance | ApiClient, EventSubscription, ApplicationInstallation, AssistantRecommendation | Authorization enforcement, webhook signatures, retries and approved command execution |
| Reliability and governance | AvailabilityResult, AuditEntry, RetentionPolicy, ComplianceAssessment | Measured SLOs, recovery exercises, access isolation and jurisdiction-specific review |

## Acceptance gates before calling the product a complete CPMS

1. Freeze launch markets and business modes, then assign each feature to an executable service and an acceptance test.
2. Pin exact device, roaming and payment protocol versions. Complete field-level adapter mappings from the actual deployed API contracts, including experimental surfaces and deprecated aliases.
3. Replay public, private, home, corporate, subscription, roaming and free-charge journeys through authentication, measured usage, rating, capture, invoice, settlement and corrections.
4. Prove recovery under duplicate/out-of-order messages, charger reboot, missing stop, meter reset, connectivity loss, PSP timeout and partial roaming delivery.
5. Validate measured performance, tenant isolation, backup/restore, operational observability and accessibility. Select jurisdiction-specific legal and metrology requirements with qualified reviewers.

The ontology is a substantial domain contract for building that product. It does not execute those acceptance gates by virtue of existing.
