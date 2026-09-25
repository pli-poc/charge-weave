# Independent business requirements and traceability

Scope: Multi-tenant conductive EV charging management with CPO/eMSP commerce, public/ad hoc, workplace/fleet, home reimbursement, roaming and energy orchestration.

This register was defined from actor outcomes, lifecycles and failure responsibilities. The historical external catalogue is not its denominator.

Validation boundary: model-level decisions over complete authorized snapshots. Runtime obligations below require real service and adapter tests before deployment.

| Requirement | Outcome / invariant | Journey | Concepts | Rules | Acceptance scenarios |
|---|---|---|---|---|---|
| BR-001 | Tenant identity and isolation | J17 | Record, Tenant, ExternalIdentifier | B001, B002, B003, B004 | UNIT-B001-REJECT, UNIT-B002-REJECT, UNIT-B003-REJECT, UNIT-B004-REJECT, REF-PASS |
| BR-002 | Typed extensibility | J19 | CustomFieldDefinition, CustomFieldValue | B005 | UNIT-B005-REJECT, REF-PASS |
| BR-003 | Service and physical topology | J03 | OperatorService, ChargingStation, ChargingArea, ChargingSite, ParkingSpace, ElectricalCircuit, LoadControlGroup, PaymentTerminal | B006, B007, B008, B009, B010, B011, B012, B013, B014, B015, B016, B017, B018 | UNIT-B006-REJECT, UNIT-B007-REJECT, UNIT-B008-REJECT, UNIT-B009-REJECT, UNIT-B010-REJECT, UNIT-B011-REJECT, UNIT-B012-REJECT, UNIT-B013-REJECT, UNIT-B014-REJECT, UNIT-B015-REJECT, UNIT-B016-REJECT, UNIT-B017-REJECT, UNIT-B018-REJECT, REF-PASS |
| BR-004 | Electrical capability and cabinet sharing | J15 | ChargingUnit, PowerCabinet, PowerModuleAllocation | B019, B097, B098, B108 | UNIT-B019-REJECT, UNIT-B097-REJECT, UNIT-B098-REJECT, UNIT-B108-REJECT, REF-PASS |
| BR-005 | Public access and payment information | J04 | PublicListing | B020 | UNIT-B020-REJECT, REF-PASS |
| BR-006 | Authorization identity and target | J05 | AuthorizationRequest, AuthorizationDecision, ChargingSession | B021, B022, B026, B028 | UNIT-B021-REJECT, UNIT-B022-REJECT, UNIT-B026-REJECT, UNIT-B028-REJECT, REF-PASS |
| BR-007 | Charging lifecycle and termination evidence | J06 | ChargingSession, SessionEndEvidence, StateTransition | B023, B024, B025, B074 | UNIT-B023-REJECT, UNIT-B024-REJECT, UNIT-B025-REJECT, UNIT-B074-REJECT, REF-PASS |
| BR-008 | Versioned tariff selection and pricing bounds | J08 | TariffVersion, TariffSet, DynamicPriceFormula, DiscountRule, FeeBounds, PriceTier, SessionPricingPolicy, RatingCalculation | B027, B034, B035, B036, B037, B038, B041, B084, B091, B092, B093, B094, B102, B107, B109 | UNIT-B027-REJECT, UNIT-B034-REJECT, UNIT-B035-REJECT, UNIT-B036-REJECT, UNIT-B037-REJECT, UNIT-B038-REJECT, UNIT-B041-REJECT, UNIT-B084-REJECT, UNIT-B091-REJECT, UNIT-B092-REJECT, UNIT-B093-REJECT, UNIT-B094-REJECT, UNIT-B102-REJECT, UNIT-B107-REJECT, UNIT-B109-REJECT, REF-PASS |
| BR-009 | Clock and signed meter evidence | J07 | SourceEvent, SignedMeterEvidence, ClockAssessment | B029, B030 | UNIT-B029-REJECT, UNIT-B030-REJECT, REF-PASS |
| BR-010 | Charge record identity and lineage | J08 | ChargeDetailRecord | B031, B032, B033 | UNIT-B031-REJECT, UNIT-B032-REJECT, UNIT-B033-REJECT, REF-PASS |
| BR-011 | Schedules, forecasts and charging profiles | J15 | ChargingSchedule, ForecastPoint, ChargingProfile | B062, B063, B064, B099 | UNIT-B062-REJECT, UNIT-B063-REJECT, UNIT-B064-REJECT, UNIT-B099-REJECT, REF-PASS |
| BR-012 | Energy intervals and recurring time | J15 | ElectricityPriceInterval, EnergyMix, TimeWindow, SchedulePeriod, RecurringWindow | B039, B040, B075, B076, B077, B082 | UNIT-B039-REJECT, UNIT-B040-REJECT, UNIT-B075-REJECT, UNIT-B076-REJECT, UNIT-B077-REJECT, UNIT-B082-REJECT, REF-PASS |
| BR-013 | Invoice arithmetic and due dates | J09 | Invoice, InvoiceLine, RatedLine, TaxDetermination | B042, B043, B044, B080 | UNIT-B042-REJECT, UNIT-B043-REJECT, UNIT-B044-REJECT, UNIT-B080-REJECT, REF-PASS |
| BR-014 | Collection, refunds, holds and payouts | J09 | PaymentAuthorization, PaymentCapture, Refund, PaymentIntent, Payout, PayoutBatch, PreauthorizationPolicy | B045, B046, B047, B048, B049, B083, B095, B096, B103, B106 | UNIT-B045-REJECT, UNIT-B046-REJECT, UNIT-B047-REJECT, UNIT-B048-REJECT, UNIT-B049-REJECT, UNIT-B083-REJECT, UNIT-B095-REJECT, UNIT-B096-REJECT, UNIT-B103-REJECT, UNIT-B106-REJECT, REF-PASS |
| BR-015 | Double-entry currency balance | J09 | Journal, JournalLine, LedgerAccount | B050, B051 | UNIT-B050-REJECT, UNIT-B051-REJECT, REF-PASS |
| BR-016 | Corporate cost and reimbursement policy | J13 | CorporateCostAllocation, CorporateBillingSnapshot, ReimbursementPolicy, ReimbursementRecord, CorporateChargerRule | B052, B053, B054, B055, B056, B057, B086, B089, B090, B104 | UNIT-B052-REJECT, UNIT-B053-REJECT, UNIT-B054-REJECT, UNIT-B055-REJECT, UNIT-B056-REJECT, UNIT-B057-REJECT, UNIT-B086-REJECT, UNIT-B089-REJECT, UNIT-B090-REJECT, UNIT-B104-REJECT, REF-PASS |
| BR-017 | Coupons, vouchers and reversals | J14 | EnergyCouponTemplate, EnergyCoupon, CouponConsumption, VoucherRedemption, Wallet | B058, B059, B060, B061, B087, B105 | UNIT-B058-REJECT, UNIT-B059-REJECT, UNIT-B060-REJECT, UNIT-B061-REJECT, UNIT-B087-REJECT, UNIT-B105-REJECT, REF-PASS |
| BR-018 | Availability measurement | J18 | AvailabilityPolicy, AvailabilityResult | B065, B066 | UNIT-B065-REJECT, UNIT-B066-REJECT, REF-PASS |
| BR-019 | Maintenance, installation and firmware | J18 | WorkOrder, InstallationJob, FirmwareDeployment | B067, B068, B088 | UNIT-B067-REJECT, UNIT-B068-REJECT, UNIT-B088-REJECT, REF-PASS |
| BR-020 | Fiscal evidence | J09 | FiscalizationAttempt | B069 | UNIT-B069-REJECT, REF-PASS |
| BR-021 | Localization and experience configuration | J04 | BrandProfile, ExperienceChannel, ContentTemplate, HelpArticle, CustomerNotification | B070 | UNIT-B070-REJECT, REF-PASS |
| BR-022 | Human approval of generated actions | J17 | ActionApproval, AssistantRecommendation | B071 | UNIT-B071-REJECT, REF-PASS |
| BR-023 | Callback delivery and retry termination | J19 | EventDelivery, EventSubscription | B072 | UNIT-B072-REJECT, REF-PASS |
| BR-024 | Command acknowledgment versus completion | J06 | RemoteCommand, CommandOutcome | B073, B078 | UNIT-B073-REJECT, UNIT-B078-REJECT, REF-PASS |
| BR-025 | Reimbursement date boundaries | J13 | ReimbursementPolicy | B079 | UNIT-B079-REJECT, REF-PASS |
| BR-026 | Reservation expiry | J04 | Reservation, Booking | B081 | UNIT-B081-REJECT, REF-PASS |
| BR-027 | Settlement agreement and currency identity | J12 | SettlementBatch, SettlementItem | B085 | UNIT-B085-REJECT, REF-PASS |
| BR-028 | API token revocation and expiry | J17 | AccessTokenLease | B100, B101 | UNIT-B100-REJECT, UNIT-B101-REJECT, REF-PASS |
| BR-110 | An active agreement has evidence of acceptance and at least one allocated contractual obligation. | J01 | ServiceAgreement | B110 | BR-110-PASS, BR-110-REJECT |
| BR-111 | Fulfilled duties retain a satisfied assessment; waived duties retain a waiver assessment. | J01 | ContractObligation | B111 | BR-111-PASS, BR-111-REJECT |
| BR-112 | Amendment and renewal create a distinct successor version retaining the contract identity. | J01 | AgreementLifecycleEvent | B112 | BR-112-PASS, BR-112-REJECT |
| BR-113 | Termination identifies who retains residual liability and the settlement cutoff. | J01 | AgreementLifecycleEvent | B113 | BR-113-PASS, BR-113-REJECT |
| BR-114 | An active entitlement is backed by an active agreement and begins inside its effective period. | J02 | ServiceEntitlement | B114 | BR-114-PASS, BR-114-REJECT |
| BR-115 | Completed closure revokes active access and preserves ownership of any nonzero liability. | J02 | AccountClosure | B115 | BR-115-PASS, BR-115-REJECT |
| BR-116 | An operating station has an accepted operational handover for that same asset. | J03 | ChargingStation | B116 | BR-116-PASS, BR-116-REJECT |
| BR-117 | Accepted handover requires successful safety, protocol and metering assessments and evidence. | J03 | OperationalAcceptance | B117 | BR-117-PASS, BR-117-REJECT |
| BR-118 | Replacement and retirement cannot abandon open charging sessions or replace an asset with itself. | J03 | AssetLifecycleEvent | B118 | BR-118-PASS, BR-118-REJECT |
| BR-119 | A compatible offer requires agreement of physical connector, voltage and current type. | J04 | ConnectorCompatibility | B119 | BR-119-PASS, BR-119-REJECT |
| BR-120 | Ad hoc offers do not require account registration. | J04 | CommercialOffer | B120 | BR-120-PASS, BR-120-REJECT |
| BR-121 | Disclosed currency, tariff currency and offer currency agree and offer expiry follows issue. | J04 | CommercialOffer | B121 | BR-121-PASS, BR-121-REJECT |
| BR-122 | Offer acceptance occurs during the disclosed offer validity window. | J04 | OfferAcceptance | B122 | BR-122-PASS, BR-122-REJECT |
| BR-123 | Acceptance is bound to the same customer and selected tariff as the charging session. | J04 | OfferAcceptance | B123 | BR-123-PASS, BR-123-REJECT |
| BR-124 | The commercial supplier matches the supplier of the governing service agreement. | J01 | CommercialResponsibility | B124 | BR-124-PASS, BR-124-REJECT |
| BR-125 | Offline admission obeys credential revocation, cache age, unknown-token policy and financial exposure limits. | J05 | OfflineAuthorizationAssessment | B125 | BR-125-PASS, BR-125-REJECT |
| BR-126 | Duplicate delivery refers to an already applied event with matching producer, key, scope and payload and has no new effects. | J06 | EventProcessingOutcome | B126 | BR-126-PASS, BR-126-REJECT |
| BR-127 | A producer/key/scope combination has at most one applied business-effect outcome in a tenant. | J06 | EventProcessingOutcome | B127 | BR-127-PASS, BR-127-REJECT |
| BR-128 | Quarantined events retain a reason and produce no accepted business effects. | J06 | EventProcessingOutcome | B128 | BR-128-PASS, BR-128-REJECT |
| BR-129 | Measured usage compares cumulative readings of the same register meter, unit and direction within its epoch. | J07 | MeterDelta | B129 | BR-129-PASS, BR-129-REJECT |
| BR-130 | Measured deltas preserve ordering, multiplier and reset boundaries; estimated deltas require evidence. | J07 | MeterDelta | B130 | BR-130-PASS, BR-130-REJECT |
| BR-131 | Billing readiness requires completed charging and resolved usage, authorization, price, tax, commercial responsibility and blocking issues. | J08 | BillingReadinessAssessment | B131 | BR-131-PASS, BR-131-REJECT |
| BR-132 | A local debit CDR carries a ready billing decision for the same completed session. | J08 | ChargeDetailRecord | B132 | BR-132-PASS, BR-132-REJECT |
| BR-133 | Credit CDRs identify the original, preserve parties and currency, and exactly reverse its monetary totals. | J08 | ChargeDetailRecord | B133 | BR-133-PASS, BR-133-REJECT |
| BR-134 | Corrections form an acyclic lineage and cannot replace a record with itself. | J08 | RecordCorrection | B134 | BR-134-PASS, BR-134-REJECT |
| BR-135 | Outstanding liability reconciles original charges, credits, collected money and authorized write-offs. | J09 | FinancialPosition | B135 | BR-135-PASS, BR-135-REJECT |
| BR-136 | A settled position has no residual liability; a written-off position records the write-off. | J09 | FinancialPosition | B136 | BR-136-PASS, BR-136-REJECT |
| BR-137 | Posted allocations use confirmed collections, positive amounts and matching currencies. | J09 | PaymentAllocation | B137 | BR-137-PASS, BR-137-REJECT |
| BR-138 | Total posted allocations never spend a collection more than once. | J09 | PaymentCapture | B138 | BR-138-PASS, BR-138-REJECT |
| BR-139 | Missing-record cases allow an absent side with a locator; comparison cases require both actual records. | J10 | ReconciliationCase | B139 | BR-139-PASS, BR-139-REJECT |
| BR-140 | Resolved reconciliation retains a resolution for the same case, a timestamp and explanation. | J10 | ReconciliationCase | B140 | BR-140-PASS, BR-140-REJECT |
| BR-141 | A corrected reconciliation identifies its immutable correction case. | J10 | ReconciliationResolution | B141 | BR-141-PASS, BR-141-REJECT |
| BR-142 | Disputes preserve response deadlines, reasoned closure and an explicit remedy when remedied. | J11 | ServiceDispute | B142 | BR-142-PASS, BR-142-REJECT |
| BR-143 | Collection escalation pauses while the position or linked service dispute is unresolved. | J11 | DunningAction | B143 | BR-143-PASS, BR-143-REJECT |
| BR-144 | Approval cannot release a partner settlement with unresolved differences or missing approval evidence. | J12 | SettlementApproval | B144 | BR-144-PASS, BR-144-REJECT |
| BR-145 | Partner settlement totals reconcile their items and released batches retain an approved release decision. | J12 | SettlementBatch | B145 | BR-145-PASS, BR-145-REJECT, BR-145-RELEASE-PASS, BR-145-RELEASE-REJECT |
| BR-146 | Approved reimbursement matches claimant, currency, amount, rate and eligible measured energy of the claim. | J13 | ReimbursementApproval | B146 | BR-146-PASS, BR-146-REJECT |
| BR-147 | Paid reimbursements identify an approved claim and a confirmed payout with matching amount and currency. | J13 | ReimbursementRecord | B147 | BR-147-PASS, BR-147-REJECT |
| BR-148 | Consumed reservations reference consumption for the same allowance, billing period and session within the reserved amount. | J14 | BenefitReservation | B148 | BR-148-PASS, BR-148-REJECT |
| BR-149 | A power decision stays within safety and contract limits even when optimization preferences are overridden. | J15 | ControlDecision | B149 | BR-149-PASS, BR-149-REJECT |
| BR-150 | An accepted export decision requires an export agreement valid throughout the control interval at the same site. | J15 | ControlDecision | B150 | BR-150-PASS, BR-150-REJECT |
| BR-151 | An override is authorized for this unit and covers the entire control interval. | J15 | ControlDecision | B151 | BR-151-PASS, BR-151-REJECT |
| BR-152 | Fulfilled rights requests require verified identity, completion time and retained response evidence. | J16 | DataSubjectRequest | B152 | BR-152-PASS, BR-152-REJECT |
| BR-153 | Refusal of a rights request retains a reason and a communicated response. | J16 | DataSubjectRequest | B153 | BR-153-PASS, BR-153-REJECT |
| BR-154 | Completed disposition records evidence and cannot claim erasure over a still-active scoped hold. | J16 | DataDisposition | B154 | BR-154-PASS, BR-154-REJECT |
| BR-155 | Holds have a future review relative to inception and explicit release evidence in time. | J16 | LegalHold | B155 | BR-155-PASS, BR-155-REJECT |
| BR-156 | International personal-data transfers retain an explicit safeguards assessment. | J16 | ProcessingPurpose | B156 | BR-156-PASS, BR-156-REJECT |
| BR-157 | Permission decisions require an active time-valid grant to the same principal and explicit record scope. | J17 | AccessDecision | B157 | BR-157-PASS, BR-157-REJECT |
| BR-158 | Valid artifact verification retains a matching computed digest and verification evidence. | J17 | EvidenceVerification | B158 | BR-158-PASS, BR-158-REJECT |
| BR-159 | Availability commitments use a proportion between zero and one. | J18 | ServiceLevelCommitment | B159 | BR-159-PASS, BR-159-REJECT |
| BR-160 | Closed service breaches retain completed remediation or a contractual remedy. | J18 | ServiceLevelBreach | B160 | BR-160-PASS, BR-160-REJECT |
| BR-161 | A passed recovery rehearsal meets both time and data-loss objectives. | J18 | RecoveryExercise | B161 | BR-161-PASS, BR-161-REJECT |
| BR-162 | Completed migration reconciles all expected records without rejects and revokes obsolete source credentials. | J19 | MigrationBatch | B162 | BR-162-PASS, BR-162-REJECT |
| BR-163 | Current lifecycle snapshots agree with the current subject state and any cited transition. | J20 | LifecycleSnapshot | B163 | BR-163-PASS, BR-163-REJECT |
| BR-164 | Chained transitions preserve record, property, state continuity and nondecreasing event time. | J20 | StateTransition | B164 | BR-164-PASS, BR-164-REJECT |
| BR-165 | An adapter cannot declare a feature both supported and unsupported. | J19 | ProtocolProfile | B165 | BR-165-PASS, BR-165-REJECT |
| BR-166 | Completed business journeys retain evidence and only successfully completed, compensated or explicitly skipped steps. | J20 | ProcessExecution | B166 | BR-166-PASS, BR-166-REJECT |
| BR-167 | Successful steps have output and evidence; compensated steps identify their compensating record. | J20 | ProcessStep | B167 | BR-167-PASS, BR-167-REJECT |
| BR-168 | Step sequence numbers are unique within a business journey. | J20 | ProcessExecution | B168 | BR-168-PASS, BR-168-REJECT |
| BR-169 | Credit-note currency and issuer match the original invoice and cumulative credits stay within its gross amount. | J09 | CreditNote | B169 | BR-169-PASS, BR-169-REJECT |
| BR-170 | Remaining allowance reconciles opening rollover, grants, consumption, reservations and expired value without a negative balance. | J14 | AllowanceBalance | B170 | BR-170-PASS, BR-170-REJECT |
| BR-171 | Stored usage and reservations reconcile actual consumptions and active reservations for the same allowance and billing period. | J14 | AllowanceBalance | B171 | BR-171-PASS, BR-171-REJECT |
| BR-172 | Money-denominated allowances identify a currency instead of being treated as energy credits. | J14 | AllowanceBalance | B172 | BR-172-PASS, BR-172-REJECT |

## BR-001 — Tenant identity and isolation

- Accountable: Platform controller.
- Financial ownership: Accountable organization.
- Actors: SecurityAdmin, PlatformOperator, Auditor, OEM, DataProcessor.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Sources: W3C-SHACL.
- Associated full-graph journey snapshots: JOURNEY-PRIVACY-PASS, JOURNEY-PRIVACY-REJECT, JOURNEY-ACCESS-PASS, JOURNEY-ACCESS-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: RecordShape, TenantShape, ExternalIdentifierShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| Record | tenant, canonicalId, createdAt, revision, label, externalIdentifier, evidence, customValue, annotation |
| Tenant | tenantName, tenantKey |
| ExternalIdentifier | identifierValue, identifierScheme, assigningAuthority, validFrom, validUntil |

## BR-002 — Typed extensibility

- Accountable: Platform operator.
- Financial ownership: Contract residual owner.
- Actors: CPO, eMSP, RoamingHub, OEM, PlatformOperator, DataProcessor.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-MIGRATION-PASS, JOURNEY-MIGRATION-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: CustomFieldDefinitionShape, CustomFieldValueShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| CustomFieldDefinition | fieldKey, fieldDatatype, applicableClass, requiredField, definitionVersion |
| CustomFieldValue | fieldDefinition, lexicalValue, valueDatatype |

## BR-003 — Service and physical topology

- Accountable: CPO.
- Financial ownership: Asset owner.
- Actors: AssetOwner, Installer, Maintainer, OEM, SiteHost, CPO.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Sources: OCA-CORE.
- Associated full-graph journey snapshots: JOURNEY-ASSET-PASS, JOURNEY-ASSET-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: OperatorServiceShape, ChargingStationShape, ChargingAreaShape, ChargingSiteShape, ParkingSpaceShape, ElectricalCircuitShape, LoadControlGroupShape, PaymentTerminalShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| OperatorService | serviceProvider, serviceName, serviceRole, parentService, brand, defaultCurrency |
| ChargingStation | operatorService, stationName, equipmentModel, site, area, stationUse, communicationMode, gatewayStation, protocolEndpoint, ownerAccount, assetOwner, administrationState, monitoringEnabled, recoveryEnabled, electricitySchedule, reimbursementPolicy, maintenanceProvider, commissionedAt, manufacturedAt, sharingSecretReference, nationalStationIdentifier, powerCabinet, chargingProfile, assetLifecycle, operationalAcceptance |
| ChargingArea | site, areaName, parkingSpace, terminal |
| ChargingSite | siteName, address, position, timezoneName, siteHost, openingWindow, serviceNotice, siteAccessPolicy |
| ParkingSpace | site, area, bayReference, accessibleBay, servesUnit, occupancy, occupancyObservedAt |
| ElectricalCircuit | site, parentCircuit, phaseSystem, ratedCurrentA, phaseRotation, protectiveDeviceReference |
| LoadControlGroup | groupName, site, parentControlGroup, phaseSystem, phaseRotation, controlStrategy, offlineReserveCurrentA, externalControlIntegration |
| PaymentTerminal | terminalName, terminalSerial, terminalType, integration, station, area, preauthorizationAmount, currency, supportedLanguage, displayTemplate |

## BR-004 — Electrical capability and cabinet sharing

- Accountable: Site energy responsible party.
- Financial ownership: Import payer or export beneficiary.
- Actors: GridOperator, EnergySupplier, Aggregator, SiteHost, Driver, FleetManager.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-ENERGY-PASS, JOURNEY-ENERGY-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ChargingUnitShape, PowerCabinetShape, PowerModuleAllocationShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ChargingUnit | station, physicalReference, currentKind, maximumPowerKW, minimumCurrentA, maximumCurrentA, tariffSet, reservable, bookable, calibration, electricalConnection |
| PowerCabinet | site, totalCabinetPowerKW, moduleSizeKW, sharingMode, servedUnit |
| PowerModuleAllocation | powerCabinet, chargingUnit, allocatedModules, allocatedPowerKW, interval |

## BR-005 — Public access and payment information

- Accountable: Selling operator.
- Financial ownership: Merchant of record.
- Actors: Driver, CPO, eMSP, PaymentProvider, AccessibilityUser.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Sources: EC-AFIR.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: PublicListingShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| PublicListing | site, operatorService, listingState, publicName, accessibility, parkingCategory, facilityCode, paymentOptionCode, paymentOptionsKnowledge, paymentBrandCode, media, publishedAt |

## BR-006 — Authorization identity and target

- Accountable: CPO or delegated eMSP.
- Financial ownership: Offline exposure owner.
- Actors: Driver, CPO, eMSP, FleetManager, OEM.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Sources: OCA-CORE.
- Associated full-graph journey snapshots: JOURNEY-OFFLINE-PASS, JOURNEY-OFFLINE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: AuthorizationRequestShape, AuthorizationDecisionShape, ChargingSessionShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| AuthorizationRequest | credential, customer, chargingUnit, requestedAt, authorizationMethod, sourceEvent |
| AuthorizationDecision | authorizationRequest, decision, reasonCode, decidedAt, decisionSource, appliedPolicy, expiresAt |
| ChargingSession | chargingUnit, customer, vehicle, authorizationDecision, sessionState, startedAt, endedAt, importedEnergyKWh, exportedEnergyKWh, commercialMode, selectedTariff, endEvidence, reservation, commercialResponsibility, billingReadiness |

## BR-007 — Charging lifecycle and termination evidence

- Accountable: CPO.
- Financial ownership: Commercial service supplier.
- Actors: Driver, CPO, PlatformOperator, OEM.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Sources: OCA-CORE.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT, JOURNEY-OFFLINE-PASS, JOURNEY-OFFLINE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ChargingSessionShape, SessionEndEvidenceShape, StateTransitionShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ChargingSession | chargingUnit, customer, vehicle, authorizationDecision, sessionState, startedAt, endedAt, importedEnergyKWh, exportedEnergyKWh, commercialMode, selectedTariff, endEvidence, reservation, commercialResponsibility, billingReadiness |
| SessionEndEvidence | session, finalizationBasis, finalizedAt, completeness, sourceEvent, finalMeterObservation |
| StateTransition | targetRecord, stateProperty, previousState, nextState, transitionedAt, sourceEvent, previousTransition, transitionSequence, responsibleParty |

## BR-008 — Versioned tariff selection and pricing bounds

- Accountable: Billing supplier.
- Financial ownership: Merchant of record.
- Actors: CPO, eMSP, Finance, Driver, TaxAuthority.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Sources: OCPI-TARIFF.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT, JOURNEY-CREDIT-PASS, JOURNEY-CREDIT-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: TariffVersionShape, TariffSetShape, DynamicPriceFormulaShape, DiscountRuleShape, FeeBoundsShape, PriceTierShape, SessionPricingPolicyShape, RatingCalculationShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| TariffVersion | tariff, versionTag, validFrom, validUntil, currency, tariffMode, priceComponent, pricingCondition, baseTariffVersion, dynamicPriceFormula, priceDisplay, roundingPolicy, snapshotDigest, discountRule, sessionPricingPolicy, preauthorizationPolicy, subsidyRule, baseTariffSelection |
| TariffSet | operatorService, setName, defaultTariff, offlineTariff, tariffAssignment, selectionStrategy |
| DynamicPriceFormula | formulaExpression, formulaLanguage, electricitySchedule, fallbackUnitPrice, minimumUnitPrice, maximumUnitPrice, calculationVersion, fixedMarkup, percentageMarkup, fallbackSchedule |
| DiscountRule | discountBasis, discountMagnitude, affectedDimension, discountOrder, pricingCondition |
| FeeBounds | minimumCharge, maximumCharge, maximumBillableQuantity, currency |
| PriceTier | tierLowerBound, tierUpperBound, tierUnitPrice, tierMode, pricingCondition |
| SessionPricingPolicy | currency, minimumSessionCharge, maximumSessionCharge, minimumConnectionDurationSeconds, minimumConnectionEnergyKWh, optimizedPriceThreshold, optimizedUnitPrice, optimizedLabel, evaluationVersion |
| RatingCalculation | session, selectedTariff, ratingVersion, calculatedAt, ratedLine, currency, netAmount, taxAmount, grossAmount, evidence, tariffResolution |

## BR-009 — Clock and signed meter evidence

- Accountable: Metering responsible party.
- Financial ownership: Billing supplier.
- Actors: MetrologyProvider, CPO, AssetOwner, Driver.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Sources: OCA-UPTIME.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: SourceEventShape, SignedMeterEvidenceShape, ClockAssessmentShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| SourceEvent | eventKey, sourceSystem, occurredAt, receivedAt, schemaVersion, payloadEvidence, sequenceNumber, correlationId, clockAssessment |
| SignedMeterEvidence | artifact, signingCertificate, signatureAlgorithm, signatureVerification, verifiedAt |
| ClockAssessment | offsetSeconds, correctionMethod, assessedAt, evidence |

## BR-010 — Charge record identity and lineage

- Accountable: Billing supplier.
- Financial ownership: Merchant of record.
- Actors: CPO, eMSP, Finance, Driver, TaxAuthority.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Sources: OCPI-CDR.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT, JOURNEY-CREDIT-PASS, JOURNEY-CREDIT-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ChargeDetailRecordShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ChargeDetailRecord | session, issuer, recipient, recordOrigin, externalIdentifier, recordVersion, period, importedEnergyKWh, exportedEnergyKWh, currency, netAmount, taxAmount, grossAmount, selectedTariff, correctionOf, receivedAt, artifact, recordKind, originalChargeRecord, billingReadiness |

## BR-011 — Schedules, forecasts and charging profiles

- Accountable: Site energy responsible party.
- Financial ownership: Import payer or export beneficiary.
- Actors: GridOperator, EnergySupplier, Aggregator, SiteHost, Driver, FleetManager.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Sources: OCA-CORE.
- Associated full-graph journey snapshots: JOURNEY-ENERGY-PASS, JOURNEY-ENERGY-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ChargingScheduleShape, ForecastPointShape, ChargingProfileShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ChargingSchedule | controlledAsset, schedulePurpose, scheduleKind, scheduleUnit, schedulePeriod, validFrom, validUntil, stackLevel, session |
| ForecastPoint | interval, predictedValue, lowerBound, upperBound |
| ChargingProfile | profilePurpose, profileKind, stackLevel, chargingSchedule, recurrenceKind, protocolTransaction, relativeAnchor |

## BR-012 — Energy intervals and recurring time

- Accountable: Site energy responsible party.
- Financial ownership: Import payer or export beneficiary.
- Actors: GridOperator, EnergySupplier, Aggregator, SiteHost, Driver, FleetManager.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Sources: OCPI-TARIFF.
- Associated full-graph journey snapshots: JOURNEY-ENERGY-PASS, JOURNEY-ENERGY-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ElectricityPriceIntervalShape, EnergyMixShape, TimeWindowShape, SchedulePeriodShape, RecurringWindowShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ElectricityPriceInterval | interval, recurringWindow, unitPrice, unitIri, quotedAt |
| EnergyMix | mixName, sourceShare, reportingPeriod, evidence |
| TimeWindow | startsAt, endsAt |
| SchedulePeriod | periodStart, periodEnd, limitValue, numberOfPhases, energyDirection |
| RecurringWindow | timezoneName, weekday, localStart, localEnd, spansMidnight, exceptionWindow |

## BR-013 — Invoice arithmetic and due dates

- Accountable: Issuer and collector.
- Financial ownership: Creditor.
- Actors: Finance, Driver, PaymentProvider, TaxAuthority.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: InvoiceShape, InvoiceLineShape, RatedLineShape, TaxDeterminationShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| Invoice | issuer, billingProfile, invoiceNumber, issuedAt, dueAt, invoiceState, currency, invoiceLine, netAmount, taxAmount, grossAmount, numberSequence, financialOwner, commercialResponsibility |
| InvoiceLine | lineDescription, quantityValue, unitPrice, netAmount, taxAmount, grossAmount, currency, ratedLine, chargeRecord, serviceAgreement |
| RatedLine | priceComponent, quantityValue, unitPrice, netAmount, taxAmount, grossAmount, currency, roundingPolicy, taxDetermination, chargingInterval |
| TaxDetermination | supplier, customerParty, taxRule, taxBasisAmount, taxAmount, currency, determinationReason, determinedAt |

## BR-014 — Collection, refunds, holds and payouts

- Accountable: Issuer and collector.
- Financial ownership: Creditor.
- Actors: Finance, Driver, PaymentProvider, TaxAuthority.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Sources: PSP-REFUND.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: PaymentAuthorizationShape, PaymentCaptureShape, RefundShape, PaymentIntentShape, PayoutShape, PayoutBatchShape, PreauthorizationPolicyShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| PaymentAuthorization | paymentIntent, authorizedAmount, currency, authorizedAt, expiresAt, providerReference, authorizationState |
| PaymentCapture | paymentIntent, paymentAuthorization, capturedAmount, currency, capturedAt, captureState, providerReference, idempotencyKey, paymentAllocation |
| Refund | paymentCapture, refundAmount, currency, refundReason, refundState, requestedAt, providerReference |
| PaymentIntent | customer, session, invoice, paymentInstrument, currency, requestedAmount, paymentState, idempotencyKey, providerOrderReference, paymentRouting |
| Payout | beneficiary, financialAccount, currency, payoutAmount, payoutState, payoutReference, scheduledAt, confirmedAt, settlementBatch, reimbursementRecord |
| PayoutBatch | fundingParty, currency, payout, batchTotal, scheduledAt |
| PreauthorizationPolicy | currency, initialHoldAmount, incrementalHoldAmount, holdTimeoutSeconds, failureAction |

## BR-015 — Double-entry currency balance

- Accountable: Issuer and collector.
- Financial ownership: Creditor.
- Actors: Finance, Driver, PaymentProvider, TaxAuthority.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: JournalShape, JournalLineShape, LedgerAccountShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| Journal | postedAt, journalState, journalLine, postingReference, reversalOf |
| JournalLine | ledgerAccount, signedAmount, currency, lineDescription |
| LedgerAccount | accountCode, accountCategory, currency, ownerParty |

## BR-016 — Corporate cost and reimbursement policy

- Accountable: Employer.
- Financial ownership: Employer or mandated payer.
- Actors: Employer, Employee, FleetManager, PaymentProvider, Finance.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-REIMBURSEMENT-PASS, JOURNEY-REIMBURSEMENT-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: CorporateCostAllocationShape, CorporateBillingSnapshotShape, ReimbursementPolicyShape, ReimbursementRecordShape, CorporateChargerRuleShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| CorporateCostAllocation | session, corporateSnapshot, currency, totalAmount, sponsorAmount, driverAmount, calculationVersion |
| CorporateBillingSnapshot | corporateBillingPolicy, policyVersion, snapshotDigest, session, capturedAt |
| ReimbursementPolicy | policyName, reimbursementRateSource, electricitySchedule, validFromDate, validUntilDate, partner, serviceAgreement |
| ReimbursementRecord | session, reimbursementPolicy, beneficiaryAccount, currency, reimbursableEnergyKWh, reimbursementRate, reimbursementAmount, reimbursementState, calculatedAt, correctionOf, reimbursementTaxCalculation, payout, reimbursementApproval |
| CorporateChargerRule | currentKind, coverageMode, costCapPerKWh, maximumEnergyUnitPrice, maximumIdleUnitPrice, maximumFlatFee |

## BR-017 — Coupons, vouchers and reversals

- Accountable: Service provider.
- Financial ownership: Benefit funder.
- Actors: Driver, FleetManager, Employer, Sponsor, Finance.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-REIMBURSEMENT-PASS, JOURNEY-REIMBURSEMENT-REJECT, JOURNEY-ALLOWANCE-PASS, JOURNEY-ALLOWANCE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: EnergyCouponTemplateShape, EnergyCouponShape, CouponConsumptionShape, VoucherRedemptionShape, WalletShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| EnergyCouponTemplate | templateName, energyAllowanceKWh, maximumRedemptions, validityMode, validFrom, validUntil, validityDays, eligibleGroup |
| EnergyCoupon | customer, energyAllowanceKWh, validFrom, validUntil, couponState, couponTemplate, currentKind |
| CouponConsumption | energyCoupon, session, consumedEnergyKWh, consumedAt, reversalOf |
| VoucherRedemption | voucher, wallet, redeemedAmount, redeemedAt, idempotencyKey, walletEntry |
| Wallet | customer, currency, balanceAmount, balanceAsOf, walletState |

## BR-018 — Availability measurement

- Accountable: Maintenance/service provider.
- Financial ownership: SLA remedy owner.
- Actors: Maintainer, Installer, CPO, SupportAgent, PlatformOperator, AssetOwner.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Sources: OCA-UPTIME.
- Associated full-graph journey snapshots: JOURNEY-MIGRATION-PASS, JOURNEY-MIGRATION-REJECT, JOURNEY-ASSET-PASS, JOURNEY-ASSET-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: AvailabilityPolicyShape, AvailabilityResultShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| AvailabilityPolicy | policyName, policyVersion, includePlannedDowntime, staleAfterSeconds, calculationExpression |
| AvailabilityResult | observedAsset, interval, availabilityPolicy, eligibleSeconds, unavailableSeconds, availabilityFraction, calculatedAt |

## BR-019 — Maintenance, installation and firmware

- Accountable: Maintenance/service provider.
- Financial ownership: SLA remedy owner.
- Actors: Maintainer, Installer, CPO, SupportAgent, PlatformOperator, AssetOwner.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Sources: OCA-CERT.
- Associated full-graph journey snapshots: JOURNEY-MIGRATION-PASS, JOURNEY-MIGRATION-REJECT, JOURNEY-ASSET-PASS, JOURNEY-ASSET-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: WorkOrderShape, InstallationJobShape, FirmwareDeploymentShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| WorkOrder | maintenanceProvider, affectedRecord, issue, assignedPrincipal, workState, dueAt, completedAt, completionEvidence |
| InstallationJob | installationCompany, site, station, assignedPrincipal, jobState, scheduledAt, completedAt, commissioningEvidence |
| FirmwareDeployment | firmware, station, requestedAt, deploymentState, completedAt, rollbackFirmware, command |

## BR-020 — Fiscal evidence

- Accountable: Issuer and collector.
- Financial ownership: Creditor.
- Actors: Finance, Driver, PaymentProvider, TaxAuthority.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: FiscalizationAttemptShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| FiscalizationAttempt | invoice, integration, attemptedAt, attemptNumber, fiscalizationState, authorityReference, fiscalDocument, failureCode |

## BR-021 — Localization and experience configuration

- Accountable: Selling operator.
- Financial ownership: Merchant of record.
- Actors: Driver, CPO, eMSP, PaymentProvider, AccessibilityUser.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: BrandProfileShape, ExperienceChannelShape, ContentTemplateShape, HelpArticleShape, CustomerNotificationShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| BrandProfile | brandName, supportedLanguage, defaultLanguage, logo, primaryColour, supportContact |
| ExperienceChannel | brand, channelKind, channelUrl, operatorService, policyDocument |
| ContentTemplate | templateKey, templateVersion, templateBody, placeholderName, channelKind |
| HelpArticle | question, answer, displayOrder, contentState |
| CustomerNotification | customer, contentTemplate, requestedAt, notificationChannel, notificationState, sourceEvent |

## BR-022 — Human approval of generated actions

- Accountable: Platform controller.
- Financial ownership: Accountable organization.
- Actors: SecurityAdmin, PlatformOperator, Auditor, OEM, DataProcessor.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-PRIVACY-PASS, JOURNEY-PRIVACY-REJECT, JOURNEY-ACCESS-PASS, JOURNEY-ACCESS-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ActionApprovalShape, AssistantRecommendationShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ActionApproval | recommendation, approver, approvalDecision, decidedAt, approvedCommand |
| AssistantRecommendation | requestedBy, affectedRecord, generatedAt, recommendationText, modelReference, evidence, proposedCommand |

## BR-023 — Callback delivery and retry termination

- Accountable: Platform operator.
- Financial ownership: Contract residual owner.
- Actors: CPO, eMSP, RoamingHub, OEM, PlatformOperator, DataProcessor.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Sources: PSP-EVENTS.
- Associated full-graph journey snapshots: JOURNEY-MIGRATION-PASS, JOURNEY-MIGRATION-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: EventDeliveryShape, EventSubscriptionShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| EventDelivery | eventSubscription, sourceEvent, attemptNumber, attemptedAt, deliveryState, responseCode, nextRetryAt, idempotencyKey |
| EventSubscription | subscriber, eventType, deliveryTransport, destinationReference, signingKeyReference, includeTimestampInSignature, suppressOwnEvents, includeRoamingAssets, maximumAttempts |

## BR-024 — Command acknowledgment versus completion

- Accountable: CPO.
- Financial ownership: Commercial service supplier.
- Actors: Driver, CPO, PlatformOperator, OEM.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Sources: OCA-CORE.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT, JOURNEY-OFFLINE-PASS, JOURNEY-OFFLINE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: RemoteCommandShape, CommandOutcomeShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| RemoteCommand | commandKind, targetRecord, requestedBy, requestedAt, expiresAt, correlationId, idempotencyKey, commandState, sourceEvent, commandParameter |
| CommandOutcome | command, outcomeKind, outcomeState, reasonCode, reportedAt, evidence |

## BR-025 — Reimbursement date boundaries

- Accountable: Employer.
- Financial ownership: Employer or mandated payer.
- Actors: Employer, Employee, FleetManager, PaymentProvider, Finance.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-REIMBURSEMENT-PASS, JOURNEY-REIMBURSEMENT-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ReimbursementPolicyShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ReimbursementPolicy | policyName, reimbursementRateSource, electricitySchedule, validFromDate, validUntilDate, partner, serviceAgreement |

## BR-026 — Reservation expiry

- Accountable: Selling operator.
- Financial ownership: Merchant of record.
- Actors: Driver, CPO, eMSP, PaymentProvider, AccessibilityUser.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Sources: OCA-CORE.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ReservationShape, BookingShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| Reservation | chargingUnit, customer, reservedAt, expiresAt, reservationState, booking, session |
| Booking | bookingRequest, bookingWindow, chargingUnit, parkingSpace, bookingState |

## BR-027 — Settlement agreement and currency identity

- Accountable: Contract supplier.
- Financial ownership: Named settlement owner.
- Actors: CPO, eMSP, SiteHost, AssetOwner, RoamingHub, Finance.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT, JOURNEY-SETTLEMENT-PASS, JOURNEY-SETTLEMENT-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: SettlementBatchShape, SettlementItemShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| SettlementBatch | serviceAgreement, period, currency, settlementItem, netAmount, taxAmount, grossAmount, settlementState, invoice |
| SettlementItem | serviceAgreement, chargeRecord, adjustmentReason, currency, netAmount, taxAmount, grossAmount, beneficiary |

## BR-028 — API token revocation and expiry

- Accountable: Platform controller.
- Financial ownership: Accountable organization.
- Actors: SecurityAdmin, PlatformOperator, Auditor, OEM, DataProcessor.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-PRIVACY-PASS, JOURNEY-PRIVACY-REJECT, JOURNEY-ACCESS-PASS, JOURNEY-ACCESS-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: AccessTokenLeaseShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| AccessTokenLease | apiClient, issuedAt, expiresAt, tokenFingerprint, accessTokenState, permission, revokedAt |

## BR-110 — An active agreement has evidence of acceptance and at least one allocated contractual obligation.

- Accountable: Contract supplier.
- Financial ownership: Contract financial owner.
- Actors: CPO, eMSP, SiteHost, AssetOwner, Finance.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: An active agreement has evidence of acceptance and at least one allocated contractual obligation.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B110.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CLOSURE-PASS, JOURNEY-CLOSURE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ServiceAgreementShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ServiceAgreement | supplier, counterparty, agreementReference, agreementVersion, validFrom, validUntil, coveredRecord, revenueShareRule, costAllocationRule, agreementEvidence, autoRenewal, platformFee, agreementState, financialOwner, governingPolicyVersion |

## BR-111 — Fulfilled duties retain a satisfied assessment; waived duties retain a waiver assessment.

- Accountable: Contract supplier.
- Financial ownership: Contract financial owner.
- Actors: CPO, eMSP, SiteHost, AssetOwner, Finance.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Fulfilled duties retain a satisfied assessment; waived duties retain a waiver assessment.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B111.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CLOSURE-PASS, JOURNEY-CLOSURE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ContractObligationShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ContractObligation | serviceAgreement, obligatedParty, entitledParty, obligationScope, obligationKind, dueAt, obligationState, obligationPolicyVersion, financialOwner |

## BR-112 — Amendment and renewal create a distinct successor version retaining the contract identity.

- Accountable: Contract supplier.
- Financial ownership: Contract financial owner.
- Actors: CPO, eMSP, SiteHost, AssetOwner, Finance.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Amendment and renewal create a distinct successor version retaining the contract identity.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B112.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CLOSURE-PASS, JOURNEY-CLOSURE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: AgreementLifecycleEventShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| AgreementLifecycleEvent | serviceAgreement, agreementAction, effectiveAt, accountableParty, decisionEvidence, successorAgreement, residualLiabilityOwner, settlementCutoff |

## BR-113 — Termination identifies who retains residual liability and the settlement cutoff.

- Accountable: Contract supplier.
- Financial ownership: Contract financial owner.
- Actors: CPO, eMSP, SiteHost, AssetOwner, Finance.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Termination identifies who retains residual liability and the settlement cutoff.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B113.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CLOSURE-PASS, JOURNEY-CLOSURE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: AgreementLifecycleEventShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| AgreementLifecycleEvent | serviceAgreement, agreementAction, effectiveAt, accountableParty, decisionEvidence, successorAgreement, residualLiabilityOwner, settlementCutoff |

## BR-114 — An active entitlement is backed by an active agreement and begins inside its effective period.

- Accountable: Service provider.
- Financial ownership: Creditor or designated successor.
- Actors: Driver, FleetManager, Employer, PrivacyController.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: An active entitlement is backed by an active agreement and begins inside its effective period.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B114.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CLOSURE-PASS, JOURNEY-CLOSURE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ServiceEntitlementShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ServiceEntitlement | customer, serviceAgreement, scopeRecord, entitlementState, validFrom, validUntil, accountableParty |

## BR-115 — Completed closure revokes active access and preserves ownership of any nonzero liability.

- Accountable: Service provider.
- Financial ownership: Creditor or designated successor.
- Actors: Driver, FleetManager, Employer, PrivacyController.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Completed closure revokes active access and preserves ownership of any nonzero liability.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B115.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CLOSURE-PASS, JOURNEY-CLOSURE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: AccountClosureShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| AccountClosure | customer, closureState, requestedAt, completedAt, openLiabilityAmount, currency, residualLiabilityOwner, revokedGrantCount, activeGrantCount, closureEvidence |

## BR-116 — An operating station has an accepted operational handover for that same asset.

- Accountable: CPO.
- Financial ownership: Asset owner.
- Actors: AssetOwner, Installer, Maintainer, OEM, SiteHost, CPO.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: An operating station has an accepted operational handover for that same asset.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B116.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-ASSET-PASS, JOURNEY-ASSET-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ChargingStationShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ChargingStation | operatorService, stationName, equipmentModel, site, area, stationUse, communicationMode, gatewayStation, protocolEndpoint, ownerAccount, assetOwner, administrationState, monitoringEnabled, recoveryEnabled, electricitySchedule, reimbursementPolicy, maintenanceProvider, commissionedAt, manufacturedAt, sharingSecretReference, nationalStationIdentifier, powerCabinet, chargingProfile, assetLifecycle, operationalAcceptance |

## BR-117 — Accepted handover requires successful safety, protocol and metering assessments and evidence.

- Accountable: CPO.
- Financial ownership: Asset owner.
- Actors: AssetOwner, Installer, Maintainer, OEM, SiteHost, CPO.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Accepted handover requires successful safety, protocol and metering assessments and evidence.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B117.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: OCA-CERT.
- Associated full-graph journey snapshots: JOURNEY-ASSET-PASS, JOURNEY-ASSET-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: OperationalAcceptanceShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| OperationalAcceptance | station, acceptanceState, safetyAccepted, protocolAccepted, meteringAccepted, maintenanceProvider, acceptedAt, acceptanceEvidence |

## BR-118 — Replacement and retirement cannot abandon open charging sessions or replace an asset with itself.

- Accountable: CPO.
- Financial ownership: Asset owner.
- Actors: AssetOwner, Installer, Maintainer, OEM, SiteHost, CPO.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Replacement and retirement cannot abandon open charging sessions or replace an asset with itself.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B118.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-ASSET-PASS, JOURNEY-ASSET-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: AssetLifecycleEventShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| AssetLifecycleEvent | station, assetAction, effectiveAt, accountableParty, assetEventEvidence, replacementStation, openSessionCount |

## BR-119 — A compatible offer requires agreement of physical connector, voltage and current type.

- Accountable: Selling operator.
- Financial ownership: Merchant of record.
- Actors: Driver, CPO, eMSP, PaymentProvider, AccessibilityUser.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: A compatible offer requires agreement of physical connector, voltage and current type.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B119.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ConnectorCompatibilityShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ConnectorCompatibility | connector, vehicle, compatibilityState, currentTypeMatch, voltageMatch, connectorTypeMatch, assessedAt |

## BR-120 — Ad hoc offers do not require account registration.

- Accountable: Selling operator.
- Financial ownership: Merchant of record.
- Actors: Driver, CPO, eMSP, PaymentProvider, AccessibilityUser.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Ad hoc offers do not require account registration.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B120.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: EC-AFIR.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: CommercialOfferShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| CommercialOffer | offeredBy, offeredTo, selectedTariff, priceDisplay, issuedAt, expiresAt, currency, offerMode, registrationRequired, offerEvidence |

## BR-121 — Disclosed currency, tariff currency and offer currency agree and offer expiry follows issue.

- Accountable: Selling operator.
- Financial ownership: Merchant of record.
- Actors: Driver, CPO, eMSP, PaymentProvider, AccessibilityUser.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Disclosed currency, tariff currency and offer currency agree and offer expiry follows issue.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B121.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: OCPI-TARIFF.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: CommercialOfferShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| CommercialOffer | offeredBy, offeredTo, selectedTariff, priceDisplay, issuedAt, expiresAt, currency, offerMode, registrationRequired, offerEvidence |

## BR-122 — Offer acceptance occurs during the disclosed offer validity window.

- Accountable: Selling operator.
- Financial ownership: Merchant of record.
- Actors: Driver, CPO, eMSP, PaymentProvider, AccessibilityUser.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Offer acceptance occurs during the disclosed offer validity window.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B122.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: OfferAcceptanceShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| OfferAcceptance | commercialOffer, customer, acceptedAt, acceptanceEvidence, session |

## BR-123 — Acceptance is bound to the same customer and selected tariff as the charging session.

- Accountable: Selling operator.
- Financial ownership: Merchant of record.
- Actors: Driver, CPO, eMSP, PaymentProvider, AccessibilityUser.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Acceptance is bound to the same customer and selected tariff as the charging session.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B123.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: OfferAcceptanceShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| OfferAcceptance | commercialOffer, customer, acceptedAt, acceptanceEvidence, session |

## BR-124 — The commercial supplier matches the supplier of the governing service agreement.

- Accountable: Contract supplier.
- Financial ownership: Contract financial owner.
- Actors: CPO, eMSP, SiteHost, AssetOwner, Finance.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: The commercial supplier matches the supplier of the governing service agreement.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B124.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CLOSURE-PASS, JOURNEY-CLOSURE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: CommercialResponsibilityShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| CommercialResponsibility | serviceAgreement, serviceSupplier, merchantOfRecord, taxLiableParty, payer, collectingParty, beneficiary, responsibilityScope, validFrom, validUntil, responsibilityEvidence |

## BR-125 — Offline admission obeys credential revocation, cache age, unknown-token policy and financial exposure limits.

- Accountable: CPO or delegated eMSP.
- Financial ownership: Offline exposure owner.
- Actors: Driver, CPO, eMSP, FleetManager, OEM.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Offline admission obeys credential revocation, cache age, unknown-token policy and financial exposure limits.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B125.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: OCA-UPTIME.
- Associated full-graph journey snapshots: JOURNEY-OFFLINE-PASS, JOURNEY-OFFLINE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: OfflineAuthorizationAssessmentShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| OfflineAuthorizationAssessment | authorizationDecision, cacheAgeSeconds, maximumCacheAgeSeconds, credentialRevoked, unknownCredential, permitUnknownCredential, exposureAmount, maximumExposureAmount, currency, accountableParty, offlineDecision, policyVersion |

## BR-126 — Duplicate delivery refers to an already applied event with matching producer, key, scope and payload and has no new effects.

- Accountable: CPO.
- Financial ownership: Commercial service supplier.
- Actors: Driver, CPO, PlatformOperator, OEM.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Duplicate delivery refers to an already applied event with matching producer, key, scope and payload and has no new effects.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B126.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: PSP-EVENTS.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT, JOURNEY-OFFLINE-PASS, JOURNEY-OFFLINE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: EventProcessingOutcomeShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| EventProcessingOutcome | sourceEvent, processingContextKey, idempotencyKey, processingState, payloadDigest, businessEffect, duplicateOf, processedAt, accountableParty, quarantineReason |

## BR-127 — A producer/key/scope combination has at most one applied business-effect outcome in a tenant.

- Accountable: CPO.
- Financial ownership: Commercial service supplier.
- Actors: Driver, CPO, PlatformOperator, OEM.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: A producer/key/scope combination has at most one applied business-effect outcome in a tenant.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B127.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: PSP-EVENTS.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT, JOURNEY-OFFLINE-PASS, JOURNEY-OFFLINE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: EventProcessingOutcomeShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| EventProcessingOutcome | sourceEvent, processingContextKey, idempotencyKey, processingState, payloadDigest, businessEffect, duplicateOf, processedAt, accountableParty, quarantineReason |

## BR-128 — Quarantined events retain a reason and produce no accepted business effects.

- Accountable: CPO.
- Financial ownership: Commercial service supplier.
- Actors: Driver, CPO, PlatformOperator, OEM.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Quarantined events retain a reason and produce no accepted business effects.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B128.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: PSP-EVENTS.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT, JOURNEY-OFFLINE-PASS, JOURNEY-OFFLINE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: EventProcessingOutcomeShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| EventProcessingOutcome | sourceEvent, processingContextKey, idempotencyKey, processingState, payloadDigest, businessEffect, duplicateOf, processedAt, accountableParty, quarantineReason |

## BR-129 — Measured usage compares cumulative readings of the same register meter, unit and direction within its epoch.

- Accountable: Metering responsible party.
- Financial ownership: Billing supplier.
- Actors: MetrologyProvider, CPO, AssetOwner, Driver.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Measured usage compares cumulative readings of the same register meter, unit and direction within its epoch.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B129.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: OCA-UPTIME.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: MeterDeltaShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| MeterDelta | registerEpoch, startReading, endReading, deltaValue, deltaBasis, resetDetected, deltaEvidence, session |

## BR-130 — Measured deltas preserve ordering, multiplier and reset boundaries; estimated deltas require evidence.

- Accountable: Metering responsible party.
- Financial ownership: Billing supplier.
- Actors: MetrologyProvider, CPO, AssetOwner, Driver.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Measured deltas preserve ordering, multiplier and reset boundaries; estimated deltas require evidence.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B130.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: OCA-UPTIME.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: MeterDeltaShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| MeterDelta | registerEpoch, startReading, endReading, deltaValue, deltaBasis, resetDetected, deltaEvidence, session |

## BR-131 — Billing readiness requires completed charging and resolved usage, authorization, price, tax, commercial responsibility and blocking issues.

- Accountable: Billing supplier.
- Financial ownership: Merchant of record.
- Actors: CPO, eMSP, Finance, Driver, TaxAuthority.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Billing readiness requires completed charging and resolved usage, authorization, price, tax, commercial responsibility and blocking issues.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B131.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT, JOURNEY-CREDIT-PASS, JOURNEY-CREDIT-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: BillingReadinessAssessmentShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| BillingReadinessAssessment | session, readinessState, usageComplete, priceResolved, taxResolved, authorizationResolved, responsibilityResolved, openBlockingIssueCount, assessedAt, accountableParty, readinessEvidence |

## BR-132 — A local debit CDR carries a ready billing decision for the same completed session.

- Accountable: Billing supplier.
- Financial ownership: Merchant of record.
- Actors: CPO, eMSP, Finance, Driver, TaxAuthority.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: A local debit CDR carries a ready billing decision for the same completed session.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B132.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: OCPI-CDR.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT, JOURNEY-CREDIT-PASS, JOURNEY-CREDIT-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ChargeDetailRecordShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ChargeDetailRecord | session, issuer, recipient, recordOrigin, externalIdentifier, recordVersion, period, importedEnergyKWh, exportedEnergyKWh, currency, netAmount, taxAmount, grossAmount, selectedTariff, correctionOf, receivedAt, artifact, recordKind, originalChargeRecord, billingReadiness |

## BR-133 — Credit CDRs identify the original, preserve parties and currency, and exactly reverse its monetary totals.

- Accountable: Billing supplier.
- Financial ownership: Merchant of record.
- Actors: CPO, eMSP, Finance, Driver, TaxAuthority.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Credit CDRs identify the original, preserve parties and currency, and exactly reverse its monetary totals.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B133.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: OCPI-CDR.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT, JOURNEY-CREDIT-PASS, JOURNEY-CREDIT-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ChargeDetailRecordShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ChargeDetailRecord | session, issuer, recipient, recordOrigin, externalIdentifier, recordVersion, period, importedEnergyKWh, exportedEnergyKWh, currency, netAmount, taxAmount, grossAmount, selectedTariff, correctionOf, receivedAt, artifact, recordKind, originalChargeRecord, billingReadiness |

## BR-134 — Corrections form an acyclic lineage and cannot replace a record with itself.

- Accountable: Billing supplier.
- Financial ownership: Merchant of record.
- Actors: CPO, eMSP, Finance, Driver, TaxAuthority.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Corrections form an acyclic lineage and cannot replace a record with itself.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B134.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: OCPI-CDR.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT, JOURNEY-CREDIT-PASS, JOURNEY-CREDIT-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: RecordCorrectionShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| RecordCorrection | originalRecord, correctingRecord, correctionReason, correctionKind, approvedBy, issuedAt, correctionEvidence, notifiedParty |

## BR-135 — Outstanding liability reconciles original charges, credits, collected money and authorized write-offs.

- Accountable: Issuer and collector.
- Financial ownership: Creditor.
- Actors: Finance, Driver, PaymentProvider, TaxAuthority.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Outstanding liability reconciles original charges, credits, collected money and authorized write-offs.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B135.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: FinancialPositionShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| FinancialPosition | financialOwner, debtor, creditor, currency, originalAmount, creditedAmount, collectedAmount, writtenOffAmount, outstandingAmount, positionState, sourceRecord |

## BR-136 — A settled position has no residual liability; a written-off position records the write-off.

- Accountable: Issuer and collector.
- Financial ownership: Creditor.
- Actors: Finance, Driver, PaymentProvider, TaxAuthority.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: A settled position has no residual liability; a written-off position records the write-off.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B136.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: FinancialPositionShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| FinancialPosition | financialOwner, debtor, creditor, currency, originalAmount, creditedAmount, collectedAmount, writtenOffAmount, outstandingAmount, positionState, sourceRecord |

## BR-137 — Posted allocations use confirmed collections, positive amounts and matching currencies.

- Accountable: Issuer and collector.
- Financial ownership: Creditor.
- Actors: Finance, Driver, PaymentProvider, TaxAuthority.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Posted allocations use confirmed collections, positive amounts and matching currencies.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B137.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: PSP-REFUND.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: PaymentAllocationShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| PaymentAllocation | paymentCapture, financialPosition, allocatedAmount, currency, allocationState, allocatedAt, allocationEvidence |

## BR-138 — Total posted allocations never spend a collection more than once.

- Accountable: Issuer and collector.
- Financial ownership: Creditor.
- Actors: Finance, Driver, PaymentProvider, TaxAuthority.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Total posted allocations never spend a collection more than once.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B138.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: PaymentCaptureShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| PaymentCapture | paymentIntent, paymentAuthorization, capturedAmount, currency, capturedAt, captureState, providerReference, idempotencyKey, paymentAllocation |

## BR-139 — Missing-record cases allow an absent side with a locator; comparison cases require both actual records.

- Accountable: Local roaming party.
- Financial ownership: Contract financial owner.
- Actors: CPO, eMSP, RoamingHub, Finance.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Missing-record cases allow an absent side with a locator; comparison cases require both actual records.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B139.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: OCPI-CDR.
- Associated full-graph journey snapshots: JOURNEY-CREDIT-PASS, JOURNEY-CREDIT-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ReconciliationCaseShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ReconciliationCase | expectedRecord, observedRecord, mismatchKind, caseState, openedAt, resolutionNote, resolvedAt, expectedIdentifier, accountableParty, reconciliationResolution |

## BR-140 — Resolved reconciliation retains a resolution for the same case, a timestamp and explanation.

- Accountable: Local roaming party.
- Financial ownership: Contract financial owner.
- Actors: CPO, eMSP, RoamingHub, Finance.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Resolved reconciliation retains a resolution for the same case, a timestamp and explanation.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B140.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CREDIT-PASS, JOURNEY-CREDIT-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ReconciliationCaseShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ReconciliationCase | expectedRecord, observedRecord, mismatchKind, caseState, openedAt, resolutionNote, resolvedAt, expectedIdentifier, accountableParty, reconciliationResolution |

## BR-141 — A corrected reconciliation identifies its immutable correction case.

- Accountable: Local roaming party.
- Financial ownership: Contract financial owner.
- Actors: CPO, eMSP, RoamingHub, Finance.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: A corrected reconciliation identifies its immutable correction case.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B141.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CREDIT-PASS, JOURNEY-CREDIT-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ReconciliationResolutionShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ReconciliationResolution | reconciliationCase, resolutionKind, resolvedAt, resolutionEvidence, financialOwner, correction |

## BR-142 — Disputes preserve response deadlines, reasoned closure and an explicit remedy when remedied.

- Accountable: Accountable service provider.
- Financial ownership: Named financial owner.
- Actors: Driver, Partner, SupportAgent, Finance, PaymentProvider.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Disputes preserve response deadlines, reasoned closure and an explicit remedy when remedied.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B142.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: PSP-DISPUTE.
- Associated full-graph journey snapshots: JOURNEY-CREDIT-PASS, JOURNEY-CREDIT-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ServiceDisputeShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ServiceDispute | disputedRecord, claimant, accountableParty, disputeCaseState, openedAt, responseDueAt, resolutionEvidence, remedyRecord, financialOwner |

## BR-143 — Collection escalation pauses while the position or linked service dispute is unresolved.

- Accountable: Accountable service provider.
- Financial ownership: Named financial owner.
- Actors: Driver, Partner, SupportAgent, Finance, PaymentProvider.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Collection escalation pauses while the position or linked service dispute is unresolved.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B143.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CREDIT-PASS, JOURNEY-CREDIT-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: DunningActionShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| DunningAction | financialPosition, actionKind, actionAt, serviceDispute, approvedBy, actionEvidence |

## BR-144 — Approval cannot release a partner settlement with unresolved differences or missing approval evidence.

- Accountable: Contract supplier.
- Financial ownership: Named settlement owner.
- Actors: CPO, eMSP, SiteHost, AssetOwner, RoamingHub, Finance.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Approval cannot release a partner settlement with unresolved differences or missing approval evidence.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B144.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT, JOURNEY-SETTLEMENT-PASS, JOURNEY-SETTLEMENT-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: SettlementApprovalShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| SettlementApproval | settlementBatch, approvalState, approvedBy, accountableParty, approvedAt, openDifferenceCount, approvalEvidence |

## BR-145 — Partner settlement totals reconcile their items and released batches retain an approved release decision.

- Accountable: Contract supplier.
- Financial ownership: Named settlement owner.
- Actors: CPO, eMSP, SiteHost, AssetOwner, RoamingHub, Finance.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Partner settlement totals equal the sum of its items.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B145.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT, JOURNEY-SETTLEMENT-PASS, JOURNEY-SETTLEMENT-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: SettlementBatchShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| SettlementBatch | serviceAgreement, period, currency, settlementItem, netAmount, taxAmount, grossAmount, settlementState, invoice |

## BR-146 — Approved reimbursement matches claimant, currency, amount, rate and eligible measured energy of the claim.

- Accountable: Employer.
- Financial ownership: Employer or mandated payer.
- Actors: Employer, Employee, FleetManager, PaymentProvider, Finance.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Approved reimbursement matches claimant, currency, amount, rate and eligible measured energy of the claim.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B146.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-REIMBURSEMENT-PASS, JOURNEY-REIMBURSEMENT-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ReimbursementApprovalShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ReimbursementApproval | reimbursementRecord, employer, entitledAccount, approvalState, approvedAt, approvalEvidence, approvedEnergyKWh, approvedRate, approvedAmount, currency |

## BR-147 — Paid reimbursements identify an approved claim and a confirmed payout with matching amount and currency.

- Accountable: Employer.
- Financial ownership: Employer or mandated payer.
- Actors: Employer, Employee, FleetManager, PaymentProvider, Finance.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Paid reimbursements identify an approved claim and a confirmed payout with matching amount and currency.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B147.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-REIMBURSEMENT-PASS, JOURNEY-REIMBURSEMENT-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ReimbursementRecordShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ReimbursementRecord | session, reimbursementPolicy, beneficiaryAccount, currency, reimbursableEnergyKWh, reimbursementRate, reimbursementAmount, reimbursementState, calculatedAt, correctionOf, reimbursementTaxCalculation, payout, reimbursementApproval |

## BR-148 — Consumed reservations reference consumption for the same allowance, billing period and session within the reserved amount.

- Accountable: Service provider.
- Financial ownership: Benefit funder.
- Actors: Driver, FleetManager, Employer, Sponsor, Finance.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Consumed reservations reference consumption for the same allowance, billing period and session within the reserved amount.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B148.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-REIMBURSEMENT-PASS, JOURNEY-REIMBURSEMENT-REJECT, JOURNEY-ALLOWANCE-PASS, JOURNEY-ALLOWANCE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: BenefitReservationShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| BenefitReservation | allowance, billingPeriod, session, reservedValue, reservationState, expiresAt, consumption, allowanceBalance |

## BR-149 — A power decision stays within safety and contract limits even when optimization preferences are overridden.

- Accountable: Site energy responsible party.
- Financial ownership: Import payer or export beneficiary.
- Actors: GridOperator, EnergySupplier, Aggregator, SiteHost, Driver, FleetManager.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: A power decision stays within safety and contract limits even when optimization preferences are overridden.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B149.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: OCA-CORE.
- Associated full-graph journey snapshots: JOURNEY-ENERGY-PASS, JOURNEY-ENERGY-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ControlDecisionShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ControlDecision | chargingUnit, interval, requestedPowerKW, feasiblePowerKW, safetyLimitKW, contractualLimitKW, controlDecision, energyDirection, accountableParty, overrideAuthorization, exportAgreement, controlEvidence |

## BR-150 — An accepted export decision requires an export agreement valid throughout the control interval at the same site.

- Accountable: Site energy responsible party.
- Financial ownership: Import payer or export beneficiary.
- Actors: GridOperator, EnergySupplier, Aggregator, SiteHost, Driver, FleetManager.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: An accepted export decision requires an export agreement valid throughout the control interval at the same site.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B150.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: OCA-CORE.
- Associated full-graph journey snapshots: JOURNEY-ENERGY-PASS, JOURNEY-ENERGY-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ControlDecisionShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ControlDecision | chargingUnit, interval, requestedPowerKW, feasiblePowerKW, safetyLimitKW, contractualLimitKW, controlDecision, energyDirection, accountableParty, overrideAuthorization, exportAgreement, controlEvidence |

## BR-151 — An override is authorized for this unit and covers the entire control interval.

- Accountable: Site energy responsible party.
- Financial ownership: Import payer or export beneficiary.
- Actors: GridOperator, EnergySupplier, Aggregator, SiteHost, Driver, FleetManager.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: An override is authorized for this unit and covers the entire control interval.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B151.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-ENERGY-PASS, JOURNEY-ENERGY-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ControlDecisionShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ControlDecision | chargingUnit, interval, requestedPowerKW, feasiblePowerKW, safetyLimitKW, contractualLimitKW, controlDecision, energyDirection, accountableParty, overrideAuthorization, exportAgreement, controlEvidence |

## BR-152 — Fulfilled rights requests require verified identity, completion time and retained response evidence.

- Accountable: Data controller.
- Financial ownership: Contractually allocated data liability owner.
- Actors: Driver, Employee, PrivacyController, DataProcessor, Auditor.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Fulfilled rights requests require verified identity, completion time and retained response evidence.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B152.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: EDPB-RIGHTS.
- Associated full-graph journey snapshots: JOURNEY-PRIVACY-PASS, JOURNEY-PRIVACY-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: DataSubjectRequestShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| DataSubjectRequest | subjectAccount, requestKind, requestState, receivedAt, responseDueAt, identityVerified, legalBasisAssessment, responsibleController, responseEvidence, refusalReason, completedAt |

## BR-153 — Refusal of a rights request retains a reason and a communicated response.

- Accountable: Data controller.
- Financial ownership: Contractually allocated data liability owner.
- Actors: Driver, Employee, PrivacyController, DataProcessor, Auditor.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Refusal of a rights request retains a reason and a communicated response.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B153.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: EDPB-RIGHTS.
- Associated full-graph journey snapshots: JOURNEY-PRIVACY-PASS, JOURNEY-PRIVACY-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: DataSubjectRequestShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| DataSubjectRequest | subjectAccount, requestKind, requestState, receivedAt, responseDueAt, identityVerified, legalBasisAssessment, responsibleController, responseEvidence, refusalReason, completedAt |

## BR-154 — Completed disposition records evidence and cannot claim erasure over a still-active scoped hold.

- Accountable: Data controller.
- Financial ownership: Contractually allocated data liability owner.
- Actors: Driver, Employee, PrivacyController, DataProcessor, Auditor.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Completed disposition records evidence and cannot claim erasure over a still-active scoped hold.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B154.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: EDPB-RIGHTS.
- Associated full-graph journey snapshots: JOURNEY-PRIVACY-PASS, JOURNEY-PRIVACY-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: DataDispositionShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| DataDisposition | subjectAccount, retentionPolicy, requestedAt, dispositionState, completedAt, dispositionEvidence, legalHold |

## BR-155 — Holds have a future review relative to inception and explicit release evidence in time.

- Accountable: Data controller.
- Financial ownership: Contractually allocated data liability owner.
- Actors: Driver, Employee, PrivacyController, DataProcessor, Auditor.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Holds have a future review relative to inception and explicit release evidence in time.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B155.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: EDPB-RIGHTS.
- Associated full-graph journey snapshots: JOURNEY-PRIVACY-PASS, JOURNEY-PRIVACY-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: LegalHoldShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| LegalHold | heldRecord, holdingParty, legalBasis, validFrom, reviewAt, holdState, releasedAt, holdEvidence |

## BR-156 — International personal-data transfers retain an explicit safeguards assessment.

- Accountable: Data controller.
- Financial ownership: Contractually allocated data liability owner.
- Actors: Driver, Employee, PrivacyController, DataProcessor, Auditor.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: International personal-data transfers retain an explicit safeguards assessment.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B156.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: EDPB-RIGHTS.
- Associated full-graph journey snapshots: JOURNEY-PRIVACY-PASS, JOURNEY-PRIVACY-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ProcessingPurposeShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ProcessingPurpose | controller, processor, purposeDescription, lawfulBasis, dataCategory, retentionPolicy, processingScope, internationalTransfer, transferSafeguardEvidence |

## BR-157 — Permission decisions require an active time-valid grant to the same principal and explicit record scope.

- Accountable: Platform controller.
- Financial ownership: Accountable organization.
- Actors: SecurityAdmin, PlatformOperator, Auditor, OEM, DataProcessor.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Permission decisions require an active time-valid grant to the same principal and explicit record scope.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B157.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-PRIVACY-PASS, JOURNEY-PRIVACY-REJECT, JOURNEY-ACCESS-PASS, JOURNEY-ACCESS-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: AccessDecisionShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| AccessDecision | grantee, scopeRecord, permission, accessDecision, decidedAt, accessGrant, decisionEvidence |

## BR-158 — Valid artifact verification retains a matching computed digest and verification evidence.

- Accountable: Platform controller.
- Financial ownership: Accountable organization.
- Actors: SecurityAdmin, PlatformOperator, Auditor, OEM, DataProcessor.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Valid artifact verification retains a matching computed digest and verification evidence.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B158.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-PRIVACY-PASS, JOURNEY-PRIVACY-REJECT, JOURNEY-ACCESS-PASS, JOURNEY-ACCESS-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: EvidenceVerificationShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| EvidenceVerification | artifact, verificationState, checkedAt, computedDigest, verifier, verificationEvidence |

## BR-159 — Availability commitments use a proportion between zero and one.

- Accountable: Maintenance/service provider.
- Financial ownership: SLA remedy owner.
- Actors: Maintainer, Installer, CPO, SupportAgent, PlatformOperator, AssetOwner.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Availability commitments use a proportion between zero and one.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B159.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: OCA-UPTIME.
- Associated full-graph journey snapshots: JOURNEY-MIGRATION-PASS, JOURNEY-MIGRATION-REJECT, JOURNEY-ASSET-PASS, JOURNEY-ASSET-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ServiceLevelCommitmentShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ServiceLevelCommitment | serviceAgreement, scopeRecord, availabilityPolicy, targetFraction, measurementWindow, accountableParty, exclusionPolicyVersion |

## BR-160 — Closed service breaches retain completed remediation or a contractual remedy.

- Accountable: Maintenance/service provider.
- Financial ownership: SLA remedy owner.
- Actors: Maintainer, Installer, CPO, SupportAgent, PlatformOperator, AssetOwner.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Closed service breaches retain completed remediation or a contractual remedy.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B160.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-MIGRATION-PASS, JOURNEY-MIGRATION-REJECT, JOURNEY-ASSET-PASS, JOURNEY-ASSET-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ServiceLevelBreachShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ServiceLevelBreach | serviceLevelCommitment, availabilityResult, breachState, detectedAt, workOrder, remedyRecord, breachEvidence |

## BR-161 — A passed recovery rehearsal meets both time and data-loss objectives.

- Accountable: Maintenance/service provider.
- Financial ownership: SLA remedy owner.
- Actors: Maintainer, Installer, CPO, SupportAgent, PlatformOperator, AssetOwner.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: A passed recovery rehearsal meets both time and data-loss objectives.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B161.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-MIGRATION-PASS, JOURNEY-MIGRATION-REJECT, JOURNEY-ASSET-PASS, JOURNEY-ASSET-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: RecoveryExerciseShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| RecoveryExercise | scopeRecord, recoveryTimeObjectiveSeconds, recoveryPointObjectiveSeconds, achievedRecoverySeconds, achievedDataLossSeconds, recoveryResult, exercisedAt, accountableParty, recoveryEvidence |

## BR-162 — Completed migration reconciles all expected records without rejects and revokes obsolete source credentials.

- Accountable: Platform operator.
- Financial ownership: Contract residual owner.
- Actors: CPO, eMSP, RoamingHub, OEM, PlatformOperator, DataProcessor.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Completed migration reconciles all expected records without rejects and revokes obsolete source credentials.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B162.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-MIGRATION-PASS, JOURNEY-MIGRATION-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: MigrationBatchShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| MigrationBatch | sourceSystem, targetSystem, expectedRecordCount, migratedRecordCount, rejectedRecordCount, migrationState, responsibleParty, reconciliationEvidence, sourceCredentialsRevoked |

## BR-163 — Current lifecycle snapshots agree with the current subject state and any cited transition.

- Accountable: Named accountable party.
- Financial ownership: Named financial owner.
- Actors: AllActors, Finance, Auditor, PlatformOperator.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Current lifecycle snapshots agree with the current subject state and any cited transition.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B163.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CLOSURE-PASS, JOURNEY-CLOSURE-REJECT, JOURNEY-PROCESS-PASS, JOURNEY-PROCESS-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: LifecycleSnapshotShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| LifecycleSnapshot | targetRecord, stateProperty, stateValue, effectiveAt, snapshotKind, basisTransition |

## BR-164 — Chained transitions preserve record, property, state continuity and nondecreasing event time.

- Accountable: Named accountable party.
- Financial ownership: Named financial owner.
- Actors: AllActors, Finance, Auditor, PlatformOperator.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Chained transitions preserve record, property, state continuity and nondecreasing event time.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B164.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CLOSURE-PASS, JOURNEY-CLOSURE-REJECT, JOURNEY-PROCESS-PASS, JOURNEY-PROCESS-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: StateTransitionShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| StateTransition | targetRecord, stateProperty, previousState, nextState, transitionedAt, sourceEvent, previousTransition, transitionSequence, responsibleParty |

## BR-165 — An adapter cannot declare a feature both supported and unsupported.

- Accountable: Platform operator.
- Financial ownership: Contract residual owner.
- Actors: CPO, eMSP, RoamingHub, OEM, PlatformOperator, DataProcessor.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: An adapter cannot declare a feature both supported and unsupported.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B165.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: OCA-CERT.
- Associated full-graph journey snapshots: JOURNEY-MIGRATION-PASS, JOURNEY-MIGRATION-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ProtocolProfileShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ProtocolProfile | protocolName, protocolVersion, supportedFeature, unsupportedFeature, adapterVersion, protocolRole, mappingEvidence, unknownFieldPolicy |

## BR-166 — Completed business journeys retain evidence and only successfully completed, compensated or explicitly skipped steps.

- Accountable: Named accountable party.
- Financial ownership: Named financial owner.
- Actors: AllActors, Finance, Auditor, PlatformOperator.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Completed business journeys retain evidence and only successfully completed, compensated or explicitly skipped steps.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B166.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CLOSURE-PASS, JOURNEY-CLOSURE-REJECT, JOURNEY-PROCESS-PASS, JOURNEY-PROCESS-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ProcessExecutionShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ProcessExecution | processKind, processState, accountableParty, financialOwner, subjectRecord, processStep, serviceAgreement, processEvidence |

## BR-167 — Successful steps have output and evidence; compensated steps identify their compensating record.

- Accountable: Named accountable party.
- Financial ownership: Named financial owner.
- Actors: AllActors, Finance, Auditor, PlatformOperator.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Successful steps have output and evidence; compensated steps identify their compensating record.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B167.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CLOSURE-PASS, JOURNEY-CLOSURE-REJECT, JOURNEY-PROCESS-PASS, JOURNEY-PROCESS-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ProcessStepShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ProcessStep | stepSequence, stepKind, responsibleParty, stepState, inputRecord, outputRecord, contractObligation, compensationRecord, stepEvidence, previousStep |

## BR-168 — Step sequence numbers are unique within a business journey.

- Accountable: Named accountable party.
- Financial ownership: Named financial owner.
- Actors: AllActors, Finance, Auditor, PlatformOperator.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Step sequence numbers are unique within a business journey.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B168.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CLOSURE-PASS, JOURNEY-CLOSURE-REJECT, JOURNEY-PROCESS-PASS, JOURNEY-PROCESS-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ProcessExecutionShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ProcessExecution | processKind, processState, accountableParty, financialOwner, subjectRecord, processStep, serviceAgreement, processEvidence |

## BR-169 — Credit-note currency and issuer match the original invoice and cumulative credits stay within its gross amount.

- Accountable: Issuer and collector.
- Financial ownership: Creditor.
- Actors: Finance, Driver, PaymentProvider, TaxAuthority.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Credit-note currency and issuer match the original invoice and cumulative credits stay within its gross amount.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B169.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: CreditNoteShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| CreditNote | originalInvoice, creditNumber, issuedAt, creditReason, currency, creditAmount, issuer, artifact |

## BR-170 — Remaining allowance reconciles opening rollover, grants, consumption, reservations and expired value without a negative balance.

- Accountable: Service provider.
- Financial ownership: Benefit funder.
- Actors: Driver, FleetManager, Employer, Sponsor, Finance.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Remaining allowance reconciles opening rollover, grants, consumption, reservations and expired value without a negative balance.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B170.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-REIMBURSEMENT-PASS, JOURNEY-REIMBURSEMENT-REJECT, JOURNEY-ALLOWANCE-PASS, JOURNEY-ALLOWANCE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: AllowanceBalanceShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| AllowanceBalance | customer, allowance, billingPeriod, openingValue, grantedValue, consumedValue, reservedValue, expiredValue, closingValue, currency, unitIri |

## BR-171 — Stored usage and reservations reconcile actual consumptions and active reservations for the same allowance and billing period.

- Accountable: Service provider.
- Financial ownership: Benefit funder.
- Actors: Driver, FleetManager, Employer, Sponsor, Finance.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Stored usage and reservations reconcile actual consumptions and active reservations for the same allowance and billing period.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B171.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-REIMBURSEMENT-PASS, JOURNEY-REIMBURSEMENT-REJECT, JOURNEY-ALLOWANCE-PASS, JOURNEY-ALLOWANCE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: AllowanceBalanceShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| AllowanceBalance | customer, allowance, billingPeriod, openingValue, grantedValue, consumedValue, reservedValue, expiredValue, closingValue, currency, unitIri |

## BR-172 — Money-denominated allowances identify a currency instead of being treated as energy credits.

- Accountable: Service provider.
- Financial ownership: Benefit funder.
- Actors: Driver, FleetManager, Employer, Sponsor, Finance.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Money-denominated allowances identify a currency instead of being treated as energy credits.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B172.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-REIMBURSEMENT-PASS, JOURNEY-REIMBURSEMENT-REJECT, JOURNEY-ALLOWANCE-PASS, JOURNEY-ALLOWANCE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: AllowanceBalanceShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| AllowanceBalance | customer, allowance, billingPeriod, openingValue, grantedValue, consumedValue, reservedValue, expiredValue, closingValue, currency, unitIri |
