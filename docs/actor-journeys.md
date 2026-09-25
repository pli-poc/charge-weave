# Actors, business journeys and lifecycle responsibilities

| Actor | Required business outcome | Journeys |
|---|---|---|
| Driver | Discover, purchase, charge, receive evidence, dispute and exercise data rights. | J02, J04, J05, J06, J07, J08, J09, J11, J14, J15, J16, J20 |
| AccessibilityUser | Receive accessible discovery, purchase, support and price information; human/interface accessibility needs usability verification. | J04, J20 |
| Employee | Charge within employer rights, claim eligible home energy and separate personal data. | J13, J16, J20 |
| FleetManager | Assign vehicles, credentials, budgets and employee entitlements; suspend and offboard safely. | J02, J05, J13, J14, J15, J20 |
| Employer | Fund and approve eligible corporate and home charging while preserving payroll/tax accountability. | J02, J13, J14, J20 |
| Sponsor | Fund benefit allowances with a defined scope and financial liability. | J14, J20 |
| CPO | Commission and operate physical charging service, meter and issue reliable charge records. | J01, J03, J04, J05, J06, J07, J08, J10, J12, J18, J19, J20 |
| eMSP | Provide mobility service, customer prices, authorization, billing and roaming access. | J01, J04, J05, J08, J10, J12, J19, J20 |
| SiteHost | Provide site access, capacity and operating conditions under explicit agreements. | J01, J03, J12, J15, J20 |
| AssetOwner | Own asset investment, handover, transfer and retirement responsibilities. | J01, J03, J07, J12, J18, J20 |
| Installer | Install and evidence commissioning and operational handover. | J03, J18, J20 |
| Maintainer | Resolve faults and document safety, repair, firmware and recovery outcomes. | J03, J18, J20 |
| OEM | Supply hardware, protocol capabilities, firmware, certificate and diagnostic evidence. | J03, J05, J06, J17, J19, J20 |
| MetrologyProvider | Provide meter identity, calibration, signatures and reset/replacement evidence. | J07, J20 |
| GridOperator | Define grid import/export constraints and connection rights. | J15, J20 |
| EnergySupplier | Supply or purchase energy with explicit import/export and settlement terms. | J15, J20 |
| Aggregator | Coordinate flexibility and retain dispatch, baseline and delivery evidence. | J15, J20 |
| RoamingHub | Route party-owned data and commands under negotiated roles and versions. | J10, J12, J19, J20 |
| PaymentProvider | Authorize, capture, refund and confirm asynchronous financial outcomes. | J04, J09, J11, J13, J20 |
| Finance | Issue documents, reconcile balances, allocate collections, settle and control write-offs. | J01, J08, J09, J10, J11, J12, J13, J14, J20 |
| TaxAuthority | Receive fiscal evidence; country-specific obligations require a configured applicability assessment. | J08, J09, J20 |
| SupportAgent | Investigate service complaints and communicate traceable remedies. | J11, J18, J20 |
| PrivacyController | Determine purpose, retention and rights decisions and account for processors. | J02, J16, J20 |
| DataProcessor | Process data under documented purpose, safeguards and controller instructions. | J16, J17, J19, J20 |
| SecurityAdmin | Grant, rotate, revoke and audit scoped operational access. | J17, J20 |
| PlatformOperator | Maintain isolation, event durability, recovery and integration boundaries. | J06, J17, J18, J19, J20 |
| Auditor | Inspect responsibilities, evidence lineage, control results and unresolved exceptions. | J16, J17, J20 |
| Partner | Exercise contractual service and settlement rights without assuming corporate identity equals business role. | J11, J20 |

## J01 — Contract and partner lifecycle

Lead: Commercial manager. Accountable: Contract supplier. Financial owner: Contract financial owner.

| Lifecycle phase | Required treatment |
|---|---|
| contracting | Offer versioned scope and duties |
| onboarding | Capture acceptance and allocate obligations |
| operation | Assess fulfilment and liability |
| change | Issue successor terms without overwriting history |
| suspension | Suspend future entitlement while preserving existing claims |
| termination | Assign residual liability and final settlement cutoff |

Concrete domain concepts: ServiceAgreement, ContractObligation, AgreementLifecycleEvent, CommercialResponsibility.

Requirements: BR-110, BR-111, BR-112, BR-113, BR-124, BR-207.

Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

## J02 — Customer and fleet account lifecycle

Lead: Account administrator. Accountable: Service provider. Financial owner: Creditor or designated successor.

| Lifecycle phase | Required treatment |
|---|---|
| contracting | Disclose account terms and billing responsibility |
| onboarding | Verify account and establish entitlement |
| operation | Authorize within active entitlement |
| change | Amend vehicle, employer and billing assignments with dates |
| suspension | Revoke future access without erasing historical charges |
| termination | Close access, transfer residual liabilities and apply retention |

Concrete domain concepts: CustomerAccount, ServiceEntitlement, AccountClosure, AccessGrant.

Requirements: BR-114, BR-115, BR-194, BR-195.

Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

## J03 — Asset commissioning and retirement

Lead: Asset operator. Accountable: CPO. Financial owner: Asset owner.

| Lifecycle phase | Required treatment |
|---|---|
| contracting | Procure rated hardware and assign maintenance responsibility |
| onboarding | Verify safety, meter and protocol handover |
| operation | Operate accepted assets with current site topology |
| change | Relocate, replace or transfer with identity and metering boundaries |
| suspension | Disable service and reconcile active sessions |
| termination | Retire after final sessions, revoke access and retain evidence |

Concrete domain concepts: ChargingStation, OperationalAcceptance, AssetLifecycleEvent, OwnershipTransfer.

Requirements: BR-003, BR-116, BR-117, BR-118, BR-196, BR-197.

Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

## J04 — Discovery and ad hoc purchase

Lead: Driver. Accountable: Selling operator. Financial owner: Merchant of record.

| Lifecycle phase | Required treatment |
|---|---|
| contracting | Expose compatible connector, access conditions and complete offer |
| onboarding | Choose payment without mandatory registration for ad hoc use |
| operation | Accept the exact valid price and start the matching session |
| change | Issue a new offer when commercial terms change |
| suspension | Expire or withdraw an unusable offer without charging it |
| termination | Issue receipt or preserve a failure/remedy record |

Concrete domain concepts: PublicListing, ConnectorCompatibility, CommercialOffer, OfferAcceptance.

Requirements: BR-005, BR-021, BR-026, BR-119, BR-120, BR-121, BR-122, BR-123, BR-199.

Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

## J05 — Authorization and offline charging

Lead: Authorization service. Accountable: CPO or delegated eMSP. Financial owner: Offline exposure owner.

| Lifecycle phase | Required treatment |
|---|---|
| contracting | Define accepted credentials, cache freshness and exposure policy |
| onboarding | Provision and bind credentials or contract certificates |
| operation | Authorize the requested unit under active rights |
| change | Rotate or reassign credentials with explicit authority |
| suspension | Deny revoked, stale or over-limit offline admission |
| termination | Revoke rights and reconcile any offline usage |

Concrete domain concepts: ChargingCredential, AuthorizationDecision, OfflineAuthorizationAssessment, PlugAndChargeEnrollment.

Requirements: BR-006, BR-125, BR-208.

Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

## J06 — Session operation and event recovery

Lead: Station operations. Accountable: CPO. Financial owner: Commercial service supplier.

| Lifecycle phase | Required treatment |
|---|---|
| contracting | Agree start/stop, offline and recovery responsibilities |
| onboarding | Correlate request, endpoint, boot epoch and business session |
| operation | Apply metering and state events once despite delivery order |
| change | Resume or reconcile gaps without overwriting source evidence |
| suspension | Quarantine incompatible payloads and unknown completion |
| termination | Finalize with evidence or retain an unresolved case |

Concrete domain concepts: ChargingSession, ProtocolTransaction, SourceEvent, EventProcessingOutcome.

Requirements: BR-007, BR-024, BR-126, BR-127, BR-128, BR-198.

Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

## J07 — Metering and usage evidence

Lead: Metering operator. Accountable: Metering responsible party. Financial owner: Billing supplier.

| Lifecycle phase | Required treatment |
|---|---|
| contracting | Identify unit, direction, register and calibration responsibilities |
| onboarding | Establish register epoch and signed evidence capability |
| operation | Derive usage from ordered readings in one epoch |
| change | Start a new epoch for reset or replacement |
| suspension | Quarantine suspect values and disclose estimates |
| termination | Close usage evidence with final readings and retention |

Concrete domain concepts: ElectricityMeter, CalibrationRecord, MeterRegisterEpoch, MeterDelta, SignedMeterEvidence.

Requirements: BR-009, BR-129, BR-130, BR-193.

Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

## J08 — Rating and charge record correction

Lead: Billing service. Accountable: Billing supplier. Financial owner: Merchant of record.

| Lifecycle phase | Required treatment |
|---|---|
| contracting | Version price, tax, rounding and evidence policies |
| onboarding | Resolve selected terms and commercial responsibility |
| operation | Assess billability then rate and issue immutable debit records |
| change | Credit erroneous records and issue distinct corrected records |
| suspension | Block unresolved usage, tax, price or responsibility |
| termination | Retain correction lineage and communicate to affected parties |

Concrete domain concepts: BillingReadinessAssessment, RatingCalculation, ChargeDetailRecord, RecordCorrection.

Requirements: BR-008, BR-010, BR-131, BR-132, BR-133, BR-134, BR-181, BR-183, BR-184, BR-185, BR-186.

Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

## J09 — Invoice, collection and refund

Lead: Finance operator. Accountable: Issuer and collector. Financial owner: Creditor.

| Lifecycle phase | Required treatment |
|---|---|
| contracting | Define supplier, payer, collection routing and document policy |
| onboarding | Create invoice and collection references in one currency |
| operation | Reconcile charges, credits, captures and allocations |
| change | Issue credit note, partial refund or reversal with lineage |
| suspension | Stop disputed collection and expose residual balances |
| termination | Close zero balance or record an approved write-off |

Concrete domain concepts: Invoice, CreditNote, PaymentCapture, PaymentAllocation, FinancialPosition, Refund.

Requirements: BR-013, BR-014, BR-015, BR-020, BR-135, BR-136, BR-137, BR-138, BR-169, BR-175, BR-176, BR-177, BR-178, BR-179, BR-180, BR-200, BR-209, BR-210, BR-211, BR-212, BR-213, BR-214, BR-215.

Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

## J10 — Roaming and financial reconciliation

Lead: Reconciliation operator. Accountable: Local roaming party. Financial owner: Contract financial owner.

| Lifecycle phase | Required treatment |
|---|---|
| contracting | Agree versions, roles, modules and settlement scope |
| onboarding | Exchange credentials and synchronize party-owned data |
| operation | Match sessions, CDRs, invoices and payments by authority-qualified identity |
| change | Replay missed records or apply explicit credit/correction |
| suspension | Represent a genuinely missing side and isolate duplicates |
| termination | Close differences with disposition and residual owner |

Concrete domain concepts: RoamingConnection, RoamingExchange, ReconciliationCase, ReconciliationResolution.

Requirements: BR-139, BR-140, BR-141.

Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

## J11 — Complaint and debt dispute

Lead: Support case owner. Accountable: Accountable service provider. Financial owner: Named financial owner.

| Lifecycle phase | Required treatment |
|---|---|
| contracting | State support, response and dispute responsibilities |
| onboarding | Accept complaint with claimant and disputed record |
| operation | Investigate service facts separately from network chargebacks |
| change | Provide correction, refund or reasoned rejection |
| suspension | Pause escalation while liability is unresolved |
| termination | Record remedy, response evidence and closure |

Concrete domain concepts: ServiceDispute, Chargeback, DunningAction, RecordCorrection.

Requirements: BR-142, BR-143, BR-201.

Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

## J12 — Partner settlement

Lead: Settlement operator. Accountable: Contract supplier. Financial owner: Named settlement owner.

| Lifecycle phase | Required treatment |
|---|---|
| contracting | Set revenue, cost, tax and beneficiary allocation rules |
| onboarding | Bind partner, agreement, currency and period |
| operation | Calculate balanced itemized settlement and reconcile differences |
| change | Carry explicit adjustments with evidence |
| suspension | Withhold approval while blocking differences remain |
| termination | Approve, invoice and pay with traceable confirmation |

Concrete domain concepts: SettlementBatch, SettlementItem, SettlementApproval, Payout.

Requirements: BR-027, BR-144, BR-145, BR-182, BR-187, BR-188, BR-218.

Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

## J13 — Employer home reimbursement

Lead: Fleet finance. Accountable: Employer. Financial owner: Employer or mandated payer.

| Lifecycle phase | Required treatment |
|---|---|
| contracting | Agree home eligibility, rate source and tax treatment |
| onboarding | Bind employee, personal station, claim and beneficiary |
| operation | Validate measured energy and approved monetary amount |
| change | Correct rate or claim with preserved history |
| suspension | Hold disputed, duplicated or unsupported claims |
| termination | Pay the approved beneficiary with confirmed payout |

Concrete domain concepts: ReimbursementPolicy, ReimbursementRecord, ReimbursementApproval, Payout.

Requirements: BR-016, BR-025, BR-146, BR-147, BR-202.

Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

## J14 — Subscriptions and benefits

Lead: Subscription operator. Accountable: Service provider. Financial owner: Benefit funder.

| Lifecycle phase | Required treatment |
|---|---|
| contracting | Define allowance dimension, renewal, funding and rollover policy |
| onboarding | Activate plan and scoped benefit entitlement |
| operation | Reserve and consume energy, money, time or session benefits |
| change | Version renewal and plan replacement without changing prior periods |
| suspension | Suspend entitlement and release unconsumed reservations |
| termination | Expire or cancel plan and reconcile remaining value |

Concrete domain concepts: Subscription, BillingPeriod, BenefitAllowance, BenefitReservation, AllowanceConsumption, EnergyCoupon.

Requirements: BR-017, BR-148, BR-170, BR-171, BR-172, BR-174, BR-216, BR-217.

Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

## J15 — Energy control and export

Lead: Energy controller. Accountable: Site energy responsible party. Financial owner: Import payer or export beneficiary.

| Lifecycle phase | Required treatment |
|---|---|
| contracting | Specify grid, contractual, driver and export rights |
| onboarding | Bind physical topology, meter direction and adapter capabilities |
| operation | Apply feasible schedules within safety and contract limits |
| change | Reforecast and authorize bounded preference overrides |
| suspension | Reject infeasible control or unauthorized export |
| termination | Close dispatch evidence, delivery and energy settlement |

Concrete domain concepts: GridConnection, PowerConstraint, ControlDecision, OverrideAuthorization, ExportAgreement, FlexibilityDelivery.

Requirements: BR-004, BR-011, BR-012, BR-149, BR-150, BR-151, BR-203, BR-204.

Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

## J16 — Privacy and data lifecycle

Lead: Privacy controller. Accountable: Data controller. Financial owner: Contractually allocated data liability owner.

| Lifecycle phase | Required treatment |
|---|---|
| contracting | Document purpose, lawful basis, retention and transfer safeguards |
| onboarding | Bind verified subject and controller responsibilities |
| operation | Process scoped access, correction, portability or erasure request |
| change | Record changes and review scoped preservation holds |
| suspension | Restrict disclosure or erasure where justified |
| termination | Communicate fulfilment or refusal and retain scoped evidence |

Concrete domain concepts: DataSubjectRequest, ProcessingPurpose, LegalHold, DataDisposition.

Requirements: BR-152, BR-153, BR-154, BR-155, BR-156, BR-189, BR-190.

Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

## J17 — Security, identity and evidence assurance

Lead: Security administrator. Accountable: Platform controller. Financial owner: Accountable organization.

| Lifecycle phase | Required treatment |
|---|---|
| contracting | Define principal, permission, scope, secret and certificate policies |
| onboarding | Provision least-privilege grants and verified artifact sources |
| operation | Evaluate time-valid explicit authorization and log decisions |
| change | Rotate certificates, grants and API leases with evidence |
| suspension | Revoke compromised access and quarantine unverified evidence |
| termination | Remove operational access while preserving required audit records |

Concrete domain concepts: AccessDecision, AccessGrant, CertificateRecord, AccessTokenLease, EvidenceVerification.

Requirements: BR-001, BR-022, BR-028, BR-157, BR-158, BR-173.

Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

## J18 — Maintenance, service levels and recovery

Lead: Service operations. Accountable: Maintenance/service provider. Financial owner: SLA remedy owner.

| Lifecycle phase | Required treatment |
|---|---|
| contracting | Agree availability windows, exclusions, remedy and recovery objectives |
| onboarding | Assign maintenance capability and exercise restoration |
| operation | Measure downtime, identify faults and track repair work |
| change | Deploy compatible firmware with rollback and retest |
| suspension | Suspend unsafe operation and communicate disruption |
| termination | Close work/SLA remedy and retain recovery proof |

Concrete domain concepts: ServiceLevelCommitment, ServiceLevelBreach, WorkOrder, FirmwareDeployment, RecoveryExercise.

Requirements: BR-018, BR-019, BR-159, BR-160, BR-161, BR-205.

Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

## J19 — Integration and provider migration

Lead: Integration owner. Accountable: Platform operator. Financial owner: Contract residual owner.

| Lifecycle phase | Required treatment |
|---|---|
| contracting | Agree protocol version, ownership and supported features |
| onboarding | Negotiate credentials and prove adapter capability |
| operation | Synchronize with identity, cursor and evidence preservation |
| change | Version mappings or migrate source/target with counts |
| suspension | Quarantine unmapped fields or failed imports |
| termination | Reconcile migrated data and revoke obsolete credentials |

Concrete domain concepts: ProtocolProfile, IntegrationConnection, MigrationBatch, SynchronizationCursor.

Requirements: BR-002, BR-023, BR-162, BR-165, BR-206.

Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

## J20 — End-to-end accountability and process evidence

Lead: Business process owner. Accountable: Named accountable party. Financial owner: Named financial owner.

| Lifecycle phase | Required treatment |
|---|---|
| contracting | Allocate accountable party, obligations and financial ownership |
| onboarding | Instantiate ordered steps with responsible actors |
| operation | Link concrete domain inputs, outputs and evidence |
| change | Preserve valid state transitions and predecessor lineage |
| suspension | Record failure, compensation or explicit skip |
| termination | Close only terminal successful/compensated steps with evidence |

Concrete domain concepts: ProcessExecution, ProcessStep, LifecycleSnapshot, StateTransition.

Requirements: BR-163, BR-164, BR-166, BR-167, BR-168, BR-191, BR-192.

Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.
