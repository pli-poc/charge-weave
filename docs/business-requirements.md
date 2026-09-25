# Independent business requirements and traceability

Scope: Multi-tenant conductive EV charging management with CPO/eMSP commerce, public/ad hoc, workplace/fleet, home reimbursement, roaming and energy orchestration.

This register was defined from actor outcomes, lifecycles and failure responsibilities. The historical external catalogue is not its denominator.

Validation boundary: model-level decisions over complete authorized snapshots. Runtime obligations below require real service and adapter tests before deployment.

| Requirement | Outcome / invariant | Journey | Concepts | Rules | Acceptance scenarios |
|---|---|---|---|---|---|
| BR-001 | Tenant identity and isolation | J17 | Record, Tenant, ExternalIdentifier, Address, GeoPosition, Quantity, Annotation | B001, B002, B003, B004 | UNIT-B001-REJECT, UNIT-B002-REJECT, UNIT-B003-REJECT, UNIT-B004-REJECT, REF-PASS, CORE-B001-PASS, CORE-B001-REJECT, CORE-B002-PASS, CORE-B002-REJECT, CORE-B003-PASS, CORE-B003-REJECT, CORE-B004-PASS, CORE-B004-REJECT |
| BR-002 | Typed extensibility | J19 | CustomFieldDefinition, CustomFieldValue | B005 | UNIT-B005-REJECT, REF-PASS, CORE-B005-PASS, CORE-B005-REJECT |
| BR-003 | Service and physical topology | J03 | OperatorService, ChargingStation, ChargingArea, ChargingSite, ParkingSpace, ElectricalCircuit, LoadControlGroup, PaymentTerminal, Manufacturer, EquipmentModel, DeviceCapability, ChargingUnit, Connector, ElectricalConnection, OwnershipTransfer, AssetLifecycleEvent, OperationalAcceptance, ConnectorCompatibility | B006, B007, B008, B009, B010, B011, B012, B013, B014, B015, B016, B017, B018 | UNIT-B006-REJECT, UNIT-B007-REJECT, UNIT-B008-REJECT, UNIT-B009-REJECT, UNIT-B010-REJECT, UNIT-B011-REJECT, UNIT-B012-REJECT, UNIT-B013-REJECT, UNIT-B014-REJECT, UNIT-B015-REJECT, UNIT-B016-REJECT, UNIT-B017-REJECT, UNIT-B018-REJECT, REF-PASS, CORE-B006-PASS, CORE-B006-REJECT, CORE-B007-PASS, CORE-B007-REJECT, CORE-B008-PASS, CORE-B008-REJECT, CORE-B009-PASS, CORE-B009-REJECT, CORE-B010-PASS, CORE-B010-REJECT, CORE-B011-PASS, CORE-B011-REJECT, CORE-B012-PASS, CORE-B012-REJECT, CORE-B013-PASS, CORE-B013-REJECT, CORE-B014-PASS, CORE-B014-REJECT, CORE-B015-PASS, CORE-B015-REJECT, CORE-B016-PASS, CORE-B016-REJECT, CORE-B017-PASS, CORE-B017-REJECT, CORE-B018-PASS, CORE-B018-REJECT |
| BR-004 | Electrical capability and cabinet sharing | J15 | ChargingUnit, PowerCabinet, PowerModuleAllocation | B019, B097, B098, B108 | UNIT-B019-REJECT, UNIT-B097-REJECT, UNIT-B098-REJECT, UNIT-B108-REJECT, REF-PASS, CORE-B019-PASS, CORE-B019-REJECT, CORE-B097-PASS, CORE-B097-REJECT, CORE-B098-PASS, CORE-B098-REJECT, CORE-B108-PASS, CORE-B108-REJECT |
| BR-005 | Public access and payment information | J04 | PublicListing, ChargingSite, ChargingArea, ParkingSpace, SiteAccessPolicy, ServiceNotice, SharingAgreement, SharingInvitation | B020 | UNIT-B020-REJECT, REF-PASS, CORE-B020-PASS, CORE-B020-REJECT |
| BR-006 | Authorization identity and target | J05 | AuthorizationRequest, AuthorizationDecision, ChargingSession, Vehicle, VehicleAssignment, VehicleTelemetry, ChargingCredential, CredentialAssignment, LocalAuthorizationList, LocalAuthorizationEntry, PlugAndChargeEnrollment, ProvisioningCertificate, OfflineAuthorizationAssessment | B021, B022, B026, B028 | UNIT-B021-REJECT, UNIT-B022-REJECT, UNIT-B026-REJECT, UNIT-B028-REJECT, REF-PASS, CORE-B021-PASS, CORE-B021-REJECT, CORE-B022-PASS, CORE-B022-REJECT, CORE-B026-PASS, CORE-B026-REJECT, CORE-B028-PASS, CORE-B028-REJECT |
| BR-007 | Charging lifecycle and termination evidence | J06 | ChargingSession, SessionEndEvidence, StateTransition, ProtocolTransaction, ChargingInterval, UsageAggregate | B023, B024, B025, B074 | UNIT-B023-REJECT, UNIT-B024-REJECT, UNIT-B025-REJECT, UNIT-B074-REJECT, REF-PASS, CORE-B023-PASS, CORE-B023-REJECT, CORE-B024-PASS, CORE-B024-REJECT, CORE-B025-PASS, CORE-B025-REJECT, CORE-B074-PASS, CORE-B074-REJECT |
| BR-008 | Versioned tariff selection and pricing bounds | J08 | TariffVersion, TariffSet, DynamicPriceFormula, DiscountRule, FeeBounds, PriceTier, SessionPricingPolicy, RatingCalculation, Tariff, PriceComponent, PricingCondition, TariffAssignment, TariffResolution, ScheduledTariffChange, ElectricityPriceSchedule, ElectricityPriceInterval, EnergyMix, EnergySourceShare, SessionLimitPolicy, PriceFreezePolicy, PreauthorizationPolicy, SubsidyRule | B027, B034, B035, B036, B037, B038, B041, B084, B091, B092, B093, B094, B102, B107, B109 | UNIT-B027-REJECT, UNIT-B034-REJECT, UNIT-B035-REJECT, UNIT-B036-REJECT, UNIT-B037-REJECT, UNIT-B038-REJECT, UNIT-B041-REJECT, UNIT-B084-REJECT, UNIT-B091-REJECT, UNIT-B092-REJECT, UNIT-B093-REJECT, UNIT-B094-REJECT, UNIT-B102-REJECT, UNIT-B107-REJECT, UNIT-B109-REJECT, REF-PASS, CORE-B027-PASS, CORE-B027-REJECT, CORE-B034-PASS, CORE-B034-REJECT, CORE-B035-PASS, CORE-B035-REJECT, CORE-B036-PASS, CORE-B036-REJECT, CORE-B037-PASS, CORE-B037-REJECT, CORE-B038-PASS, CORE-B038-REJECT, CORE-B041-PASS, CORE-B041-REJECT, CORE-B084-PASS, CORE-B084-REJECT, CORE-B091-PASS, CORE-B091-REJECT, CORE-B092-PASS, CORE-B092-REJECT, CORE-B093-PASS, CORE-B093-REJECT, CORE-B094-PASS, CORE-B094-REJECT, CORE-B102-PASS, CORE-B102-REJECT, CORE-B107-PASS, CORE-B107-REJECT, CORE-B109-PASS, CORE-B109-REJECT |
| BR-009 | Clock and signed meter evidence | J07 | SourceEvent, SignedMeterEvidence, ClockAssessment | B029, B030 | UNIT-B029-REJECT, UNIT-B030-REJECT, REF-PASS, CORE-B029-PASS, CORE-B029-REJECT, CORE-B030-PASS, CORE-B030-REJECT |
| BR-010 | Charge record identity and lineage | J08 | ChargeDetailRecord, RecordCorrection | B031, B032, B033 | UNIT-B031-REJECT, UNIT-B032-REJECT, UNIT-B033-REJECT, REF-PASS, CORE-B031-PASS, CORE-B031-REJECT, CORE-B032-PASS, CORE-B032-REJECT, CORE-B033-PASS, CORE-B033-REJECT |
| BR-011 | Schedules, forecasts and charging profiles | J15 | ChargingSchedule, ForecastPoint, ChargingProfile, GridConnection, LoadControlGroup, ControlGroupMembership, PowerConstraint, PhaseCurrentConstraint, PriorityRule, SmartChargingPreference, SchedulePeriod, ScheduleApplication, UnmanagedLoadObservation, EnergyForecast, DemandResponseProgram, FlexibilityAsset, FlexibilityActivation, DistributedEnergyAsset, ControlDecision | B062, B063, B064, B099 | UNIT-B062-REJECT, UNIT-B063-REJECT, UNIT-B064-REJECT, UNIT-B099-REJECT, REF-PASS, CORE-B062-PASS, CORE-B062-REJECT, CORE-B063-PASS, CORE-B063-REJECT, CORE-B064-PASS, CORE-B064-REJECT, CORE-B099-PASS, CORE-B099-REJECT |
| BR-012 | Energy intervals and recurring time | J15 | ElectricityPriceInterval, EnergyMix, TimeWindow, SchedulePeriod, RecurringWindow | B039, B040, B075, B076, B077, B082 | UNIT-B039-REJECT, UNIT-B040-REJECT, UNIT-B075-REJECT, UNIT-B076-REJECT, UNIT-B077-REJECT, UNIT-B082-REJECT, REF-PASS, CORE-B039-PASS, CORE-B039-REJECT, CORE-B040-PASS, CORE-B040-REJECT, CORE-B075-PASS, CORE-B075-REJECT, CORE-B076-PASS, CORE-B076-REJECT, CORE-B077-PASS, CORE-B077-REJECT, CORE-B082-PASS, CORE-B082-REJECT |
| BR-013 | Invoice arithmetic and due dates | J09 | Invoice, InvoiceLine, RatedLine, TaxDetermination, BillingProfile, TaxIdentifier, TaxRule, RatingCalculation, CreditNote, Receipt, DocumentNumberSequence, FiscalizationAttempt, CustomFee | B042, B043, B044, B080 | UNIT-B042-REJECT, UNIT-B043-REJECT, UNIT-B044-REJECT, UNIT-B080-REJECT, REF-PASS, CORE-B042-PASS, CORE-B042-REJECT, CORE-B043-PASS, CORE-B043-REJECT, CORE-B044-PASS, CORE-B044-REJECT, CORE-B080-PASS, CORE-B080-REJECT |
| BR-014 | Collection, refunds, holds and payouts | J09 | PaymentAuthorization, PaymentCapture, Refund, PaymentIntent, Payout, PayoutBatch, PreauthorizationPolicy, Currency, ExchangeRate, PaymentInstrument, Chargeback, TopUpOffer, Voucher, VoucherRedemption, PaymentTerminal, FinancialAccountReference, PaymentRouting, PaymentAllocation, ReconciliationResolution | B045, B046, B047, B048, B049, B083, B095, B096, B103, B106 | UNIT-B045-REJECT, UNIT-B046-REJECT, UNIT-B047-REJECT, UNIT-B048-REJECT, UNIT-B049-REJECT, UNIT-B083-REJECT, UNIT-B095-REJECT, UNIT-B096-REJECT, UNIT-B103-REJECT, UNIT-B106-REJECT, REF-PASS, CORE-B045-PASS, CORE-B045-REJECT, CORE-B046-PASS, CORE-B046-REJECT, CORE-B047-PASS, CORE-B047-REJECT, CORE-B048-PASS, CORE-B048-REJECT, CORE-B049-PASS, CORE-B049-REJECT, CORE-B083-PASS, CORE-B083-REJECT, CORE-B095-PASS, CORE-B095-REJECT, CORE-B096-PASS, CORE-B096-REJECT, CORE-B103-PASS, CORE-B103-REJECT, CORE-B106-PASS, CORE-B106-REJECT |
| BR-015 | Double-entry currency balance | J09 | Journal, JournalLine, LedgerAccount | B050, B051 | UNIT-B050-REJECT, UNIT-B051-REJECT, REF-PASS, CORE-B050-PASS, CORE-B050-REJECT, CORE-B051-PASS, CORE-B051-REJECT |
| BR-016 | Corporate cost and reimbursement policy | J13 | CorporateCostAllocation, CorporateBillingSnapshot, ReimbursementPolicy, ReimbursementRecord, CorporateChargerRule, CorporateBillingPolicy, ReimbursementReport, ReimbursementTaxCalculation | B052, B053, B054, B055, B056, B057, B086, B089, B090, B104 | UNIT-B052-REJECT, UNIT-B053-REJECT, UNIT-B054-REJECT, UNIT-B055-REJECT, UNIT-B056-REJECT, UNIT-B057-REJECT, UNIT-B086-REJECT, UNIT-B089-REJECT, UNIT-B090-REJECT, UNIT-B104-REJECT, REF-PASS, CORE-B052-PASS, CORE-B052-REJECT, CORE-B053-PASS, CORE-B053-REJECT, CORE-B054-PASS, CORE-B054-REJECT, CORE-B055-PASS, CORE-B055-REJECT, CORE-B056-PASS, CORE-B056-REJECT, CORE-B057-PASS, CORE-B057-REJECT, CORE-B086-PASS, CORE-B086-REJECT, CORE-B089-PASS, CORE-B089-REJECT, CORE-B090-PASS, CORE-B090-REJECT, CORE-B104-PASS, CORE-B104-REJECT |
| BR-017 | Coupons, vouchers and reversals | J14 | EnergyCouponTemplate, EnergyCoupon, CouponConsumption, VoucherRedemption, Wallet | B058, B059, B060, B061, B087, B105 | UNIT-B058-REJECT, UNIT-B059-REJECT, UNIT-B060-REJECT, UNIT-B061-REJECT, UNIT-B087-REJECT, UNIT-B105-REJECT, REF-PASS, CORE-B058-PASS, CORE-B058-REJECT, CORE-B059-PASS, CORE-B059-REJECT, CORE-B060-PASS, CORE-B060-REJECT, CORE-B061-PASS, CORE-B061-REJECT, CORE-B087-PASS, CORE-B087-REJECT, CORE-B105-PASS, CORE-B105-REJECT |
| BR-018 | Availability measurement | J18 | AvailabilityPolicy, AvailabilityResult, OperationalPeriod, DowntimePeriod, MetricDefinition, MetricObservation | B065, B066 | UNIT-B065-REJECT, UNIT-B066-REJECT, REF-PASS, CORE-B065-PASS, CORE-B065-REJECT, CORE-B066-PASS, CORE-B066-REJECT |
| BR-019 | Maintenance, installation and firmware | J18 | WorkOrder, InstallationJob, FirmwareDeployment, ConfigurationVariable, ConfigurationTemplate, ConfigurationTemplateEntry, TemplateApplication, FirmwareRelease, HardwareStatusObservation, ConnectionObservation, DiagnosticArtifact, VendorFaultDefinition, Issue, RecoveryPolicy, RecoveryAttempt, AvailabilityPolicy, AvailabilityResult, ServiceLevelCommitment, ServiceLevelBreach, RecoveryExercise | B067, B068, B088 | UNIT-B067-REJECT, UNIT-B068-REJECT, UNIT-B088-REJECT, REF-PASS, CORE-B067-PASS, CORE-B067-REJECT, CORE-B068-PASS, CORE-B068-REJECT, CORE-B088-PASS, CORE-B088-REJECT |
| BR-020 | Fiscal evidence | J09 | FiscalizationAttempt | B069 | UNIT-B069-REJECT, REF-PASS, CORE-B069-PASS, CORE-B069-REJECT |
| BR-021 | Localization and experience configuration | J04 | BrandProfile, ExperienceChannel, ContentTemplate, HelpArticle, CustomerNotification, UserDevice, MediaAsset, ApplicationInstallation | B070 | UNIT-B070-REJECT, REF-PASS, CORE-B070-PASS, CORE-B070-REJECT |
| BR-022 | Human approval of generated actions | J17 | ActionApproval, AssistantRecommendation | B071 | UNIT-B071-REJECT, REF-PASS, CORE-B071-PASS, CORE-B071-REJECT |
| BR-023 | Callback delivery and retry termination | J19 | EventDelivery, EventSubscription | B072 | UNIT-B072-REJECT, REF-PASS, CORE-B072-PASS, CORE-B072-REJECT |
| BR-024 | Command acknowledgment versus completion | J06 | RemoteCommand, CommandOutcome, CommandParameter | B073, B078 | UNIT-B073-REJECT, UNIT-B078-REJECT, REF-PASS, CORE-B073-PASS, CORE-B073-REJECT, CORE-B078-PASS, CORE-B078-REJECT |
| BR-025 | Reimbursement date boundaries | J13 | ReimbursementPolicy | B079 | UNIT-B079-REJECT, REF-PASS, CORE-B079-PASS, CORE-B079-REJECT |
| BR-026 | Reservation expiry | J04 | Reservation, Booking, BookingRequest | B081 | UNIT-B081-REJECT, REF-PASS, CORE-B081-PASS, CORE-B081-REJECT |
| BR-027 | Settlement agreement and currency identity | J12 | SettlementBatch, SettlementItem, SettlementLeg, RevenueShareRule, CostAllocationRule, SettlementOverride, ReconciliationCase, AgreementLifecycleEvent, SettlementApproval, ReimbursementApproval | B085 | UNIT-B085-REJECT, REF-PASS, CORE-B085-PASS, CORE-B085-REJECT |
| BR-028 | API token revocation and expiry | J17 | AccessTokenLease | B100, B101 | UNIT-B100-REJECT, UNIT-B101-REJECT, REF-PASS, CORE-B100-PASS, CORE-B100-REJECT, CORE-B101-PASS, CORE-B101-REJECT |
| BR-110 | An active agreement has evidence of acceptance and at least one allocated contractual obligation. | J01 | ServiceAgreement, PartnerInvitation | B110 | BR-110-PASS, BR-110-REJECT |
| BR-111 | Fulfilled duties retain a satisfied assessment; waived duties retain a waiver assessment. | J01 | ContractObligation, ObligationAssessment | B111 | BR-111-PASS, BR-111-REJECT |
| BR-112 | Amendment and renewal create a distinct successor version retaining the contract identity. | J01 | AgreementLifecycleEvent | B112 | BR-112-PASS, BR-112-REJECT |
| BR-113 | Termination identifies who retains residual liability and the settlement cutoff. | J01 | AgreementLifecycleEvent | B113 | BR-113-PASS, BR-113-REJECT |
| BR-114 | An active entitlement is backed by an active agreement and begins inside its effective period. | J02 | ServiceEntitlement, Person, ContactProfile, OperatorService, CustomerAccount, CustomerGroup, GroupMembership, AccountClosure | B114 | BR-114-PASS, BR-114-REJECT |
| BR-115 | Completed closure revokes active access and preserves ownership of any nonzero liability. | J02 | AccountClosure | B115 | BR-115-PASS, BR-115-REJECT |
| BR-116 | An operating station has an accepted operational handover for that same asset. | J03 | ChargingStation | B116 | BR-116-PASS, BR-116-REJECT |
| BR-117 | Accepted handover requires successful safety, protocol and metering assessments and evidence. | J03 | OperationalAcceptance | B117 | BR-117-PASS, BR-117-REJECT |
| BR-118 | Replacement and retirement cannot abandon open charging sessions or replace an asset with itself. | J03 | AssetLifecycleEvent | B118 | BR-118-PASS, BR-118-REJECT |
| BR-119 | A compatible offer requires agreement of physical connector, voltage and current type. | J04 | ConnectorCompatibility | B119 | BR-119-PASS, BR-119-REJECT |
| BR-120 | Ad hoc offers do not require account registration. | J04 | CommercialOffer, PriceDisplay | B120 | BR-120-PASS, BR-120-REJECT |
| BR-121 | Disclosed currency, tariff currency and offer currency agree and offer expiry follows issue. | J04 | CommercialOffer | B121 | BR-121-PASS, BR-121-REJECT |
| BR-122 | Offer acceptance occurs during the disclosed offer validity window. | J04 | OfferAcceptance | B122 | BR-122-PASS, BR-122-REJECT |
| BR-123 | Acceptance is bound to the same customer and selected tariff as the charging session. | J04 | OfferAcceptance | B123 | BR-123-PASS, BR-123-REJECT |
| BR-124 | The commercial supplier matches the supplier of the governing service agreement. | J01 | CommercialResponsibility, LegalEntity, PartyRole, ManagementDelegation | B124 | BR-124-PASS, BR-124-REJECT |
| BR-125 | Offline admission obeys credential revocation, cache age, unknown-token policy and financial exposure limits. | J05 | OfflineAuthorizationAssessment | B125 | BR-125-PASS, BR-125-REJECT |
| BR-126 | Duplicate delivery refers to an already applied event with matching producer, key, scope and payload and has no new effects. | J06 | EventProcessingOutcome, SourceEvent, SessionEvent | B126 | BR-126-PASS, BR-126-REJECT |
| BR-127 | A producer/key/scope combination has at most one applied business-effect outcome in a tenant. | J06 | EventProcessingOutcome | B127 | BR-127-PASS, BR-127-REJECT |
| BR-128 | Quarantined events retain a reason and produce no accepted business effects. | J06 | EventProcessingOutcome | B128 | BR-128-PASS, BR-128-REJECT |
| BR-129 | Measured usage compares cumulative readings of the same register meter, unit and direction within its epoch. | J07 | MeterDelta, ElectricityMeter, CalibrationRecord, MeterObservation, MeterRegisterEpoch | B129 | BR-129-PASS, BR-129-REJECT |
| BR-130 | Measured deltas preserve ordering, multiplier and reset boundaries; estimated deltas require evidence. | J07 | MeterDelta | B130 | BR-130-PASS, BR-130-REJECT |
| BR-131 | Billing readiness requires completed charging and resolved usage, authorization, price, tax, commercial responsibility and blocking issues. | J08 | BillingReadinessAssessment | B131 | BR-131-PASS, BR-131-REJECT |
| BR-132 | A local debit CDR carries a ready billing decision for the same completed session. | J08 | ChargeDetailRecord | B132 | BR-132-PASS, BR-132-REJECT |
| BR-133 | Credit CDRs preserve parties and currency, reverse the original totals and cannot credit the same debit more than once. | J08 | ChargeDetailRecord | B133 | BR-133-PASS, BR-133-REJECT, ADV-CREDIT-ALLOW, ADV-CREDIT-REJECT, ADV-CREDIT-DISTINCT-ORIGINALS |
| BR-134 | Corrections form an acyclic lineage and cannot replace a record with itself. | J08 | RecordCorrection | B134 | BR-134-PASS, BR-134-REJECT |
| BR-135 | Outstanding liability reconciles original charges, credits, collected money and authorized write-offs. | J09 | FinancialPosition | B135 | BR-135-PASS, BR-135-REJECT |
| BR-136 | A settled position has no residual liability; a written-off position records the write-off. | J09 | FinancialPosition | B136 | BR-136-PASS, BR-136-REJECT |
| BR-137 | Posted allocations use confirmed collections, positive amounts and matching currencies. | J09 | PaymentAllocation | B137 | BR-137-PASS, BR-137-REJECT |
| BR-138 | Total posted allocations never spend a collection more than once. | J09 | PaymentCapture | B138 | BR-138-PASS, BR-138-REJECT |
| BR-139 | Missing-record cases allow an absent side with a locator; comparison cases require both actual records. | J10 | ReconciliationCase, RoamingNetwork, RoamingParty, RoamingConnection, RoamingModuleAgreement, RoamingExchange, RoamingCommand, SynchronizationCursor, RoamingTariffMapping, RoamingTariffFilter, PublicDataPublication, RoamingBehaviorPolicy | B139 | BR-139-PASS, BR-139-REJECT |
| BR-140 | Resolved reconciliation retains a resolution for the same case, a timestamp and explanation. | J10 | ReconciliationCase | B140 | BR-140-PASS, BR-140-REJECT |
| BR-141 | A corrected reconciliation identifies its immutable correction case. | J10 | ReconciliationResolution | B141 | BR-141-PASS, BR-141-REJECT |
| BR-142 | Disputes preserve response deadlines, reasoned closure and an explicit remedy when remedied. | J11 | ServiceDispute | B142 | BR-142-PASS, BR-142-REJECT |
| BR-143 | Collection escalation pauses for unresolved disputes against the position or its source record even without an explicit dispute link. | J11 | DunningAction | B143 | BR-143-PASS, BR-143-REJECT, ADV-DUNNING-ALLOW, ADV-DUNNING-REJECT |
| BR-144 | Approval cannot release a partner settlement with unresolved differences or missing approval evidence. | J12 | SettlementApproval | B144 | BR-144-PASS, BR-144-REJECT |
| BR-145 | Partner settlement totals reconcile their items and released batches retain an approved release decision. | J12 | SettlementBatch | B145 | BR-145-PASS, BR-145-REJECT, BR-145-RELEASE-PASS, BR-145-RELEASE-REJECT |
| BR-146 | Approved reimbursement matches claimant, currency, amount, rate and eligible measured energy of the claim. | J13 | ReimbursementApproval | B146 | BR-146-PASS, BR-146-REJECT |
| BR-147 | Paid reimbursements identify an approved claim and a confirmed payout with matching amount and currency. | J13 | ReimbursementRecord | B147 | BR-147-PASS, BR-147-REJECT |
| BR-148 | Consumed reservations reference consumption for the same allowance, billing period and session within the reserved amount. | J14 | BenefitReservation, SubscriptionPlan, Subscription, BillingPeriod, BenefitAllowance, AllowanceConsumption, SubscriptionBillingPolicy | B148 | BR-148-PASS, BR-148-REJECT |
| BR-149 | A power decision stays within safety and contract limits even when optimization preferences are overridden. | J15 | ControlDecision | B149 | BR-149-PASS, BR-149-REJECT |
| BR-150 | An accepted export decision requires an export agreement valid throughout the control interval at the same site. | J15 | ControlDecision, ExportAgreement | B150 | BR-150-PASS, BR-150-REJECT |
| BR-151 | An override is authorized for this unit and covers the entire control interval. | J15 | ControlDecision, OverrideAuthorization | B151 | BR-151-PASS, BR-151-REJECT |
| BR-152 | Fulfilled rights requests require verified identity, completion time and retained response evidence. | J16 | DataSubjectRequest, PolicyDocument, ConsentDecision, ComplianceAssessment | B152 | BR-152-PASS, BR-152-REJECT |
| BR-153 | Refusal of a rights request retains a reason and a communicated response. | J16 | DataSubjectRequest | B153 | BR-153-PASS, BR-153-REJECT |
| BR-154 | Completed disposition retains evidence and respects explicit holds and independently recorded active account-wide holds. | J16 | DataDisposition, RetentionPolicy | B154 | BR-154-PASS, BR-154-REJECT, ADV-HOLD-ALLOW, ADV-HOLD-REJECT |
| BR-155 | Holds have a future review relative to inception and explicit release evidence in time. | J16 | LegalHold | B155 | BR-155-PASS, BR-155-REJECT |
| BR-156 | International personal-data transfers retain an explicit safeguards assessment. | J16 | ProcessingPurpose | B156 | BR-156-PASS, BR-156-REJECT |
| BR-157 | Current permission decisions require an enabled principal and an active time-valid exact scoped grant; historical permits use BR-173 snapshots. | J17 | AccessDecision, Principal, Permission, SecurityRole, AccessGrant, AuthorizationSnapshot, CertificateRecord, CertificateLifecycleEvent, SecurityEvent, AuditEntry | B157 | BR-157-PASS, BR-157-REJECT, ADV-ACCESS-ALLOW, ADV-ACCESS-REJECT, ADV-ACCESS-DISABLED-DENIED |
| BR-158 | Valid artifact verification retains a matching computed digest and verification evidence. | J17 | EvidenceVerification, EvidenceDocument | B158 | BR-158-PASS, BR-158-REJECT |
| BR-159 | Availability commitments use a proportion between zero and one. | J18 | ServiceLevelCommitment | B159 | BR-159-PASS, BR-159-REJECT |
| BR-160 | Closed service breaches retain completed remediation or a contractual remedy. | J18 | ServiceLevelBreach | B160 | BR-160-PASS, BR-160-REJECT |
| BR-161 | A passed recovery rehearsal meets both time and data-loss objectives. | J18 | RecoveryExercise | B161 | BR-161-PASS, BR-161-REJECT |
| BR-162 | Completed migration reconciles all expected records without rejects and revokes obsolete source credentials. | J19 | MigrationBatch | B162 | BR-162-PASS, BR-162-REJECT |
| BR-163 | Current lifecycle snapshots agree with the current subject state and any cited transition. | J20 | LifecycleSnapshot | B163 | BR-163-PASS, BR-163-REJECT |
| BR-164 | Chained transitions preserve record, property, state continuity and nondecreasing time without circular history. | J20 | StateTransition | B164 | BR-164-PASS, BR-164-REJECT, ADV-HISTORY-ALLOW, ADV-HISTORY-REJECT |
| BR-165 | An adapter cannot declare a feature both supported and unsupported. | J19 | ProtocolProfile, ProtocolEndpoint, IntegrationConnection, ApiClient, EventSubscription, EventDelivery, CommunicationLog, PlatformSetting | B165 | BR-165-PASS, BR-165-REJECT |
| BR-166 | Completed business journeys retain evidence and only successfully completed, compensated or explicitly skipped steps. | J20 | ProcessExecution, ProcessStep | B166 | BR-166-PASS, BR-166-REJECT |
| BR-167 | Successful steps have output and evidence; compensated steps identify their compensating record. | J20 | ProcessStep | B167 | BR-167-PASS, BR-167-REJECT |
| BR-168 | Step sequence numbers are unique within a business journey. | J20 | ProcessExecution | B168 | BR-168-PASS, BR-168-REJECT |
| BR-169 | Credit-note currency and issuer match the original invoice and cumulative credits stay within its gross amount. | J09 | CreditNote | B169 | BR-169-PASS, BR-169-REJECT |
| BR-170 | Remaining allowance reconciles opening rollover, grants, consumption, reservations and expired value without a negative balance. | J14 | AllowanceBalance | B170 | BR-170-PASS, BR-170-REJECT |
| BR-171 | Allowance totals reconcile actual usage and reservations for the same allowance, period and session customer. | J14 | AllowanceBalance | B171 | BR-171-PASS, BR-171-REJECT, ADV-ALLOWANCE-ALLOW, ADV-ALLOWANCE-REJECT |
| BR-172 | Money-denominated allowances identify a currency instead of being treated as energy credits. | J14 | AllowanceBalance | B172 | BR-172-PASS, BR-172-REJECT |
| BR-173 | Historical permits retain matching decision-time principal, grant, permission, scope and validity evidence. | J17 | AccessDecision, Principal, Permission, AccessGrant, EvidenceDocument, AuthorizationSnapshot | B173 | BR-173-PASS, BR-173-REJECT |
| BR-174 | Sponsored allowance validity is contained in the funding agreement period. | J14 | AllowanceSponsorship, CustomerAccount, ServiceAgreement, EvidenceDocument | B174 | BR-174-PASS, BR-174-REJECT |
| BR-175 | Collected balances reconcile to posted allocations or retain explicit external collection evidence. | J09 | FinancialPosition, LegalEntity, Currency, EvidenceDocument | B175 | BR-175-PASS, BR-175-REJECT |
| BR-176 | A write-off has attributable approval evidence. | J09 | FinancialPosition, LegalEntity, Currency, EvidenceDocument | B176 | BR-176-PASS, BR-176-REJECT |
| BR-177 | Wallet balance equals opening balance plus entries in its inclusive statement interval. | J09 | Wallet, CustomerAccount, Currency, WalletEntry | B177 | BR-177-PASS, BR-177-REJECT |
| BR-178 | A closed accounting period retains evidence and a close time no earlier than its end. | J09 | AccountingPeriod, TimeWindow, EvidenceDocument, LegalEntity | B178 | BR-178-PASS, BR-178-REJECT |
| BR-179 | Posted journal timestamps belong to their accounting period and do not follow its close time. | J09 | Journal, JournalLine, AccountingPeriod | B179 | BR-179-PASS, BR-179-REJECT |
| BR-180 | Late corrections preserve original usage responsibility and use a distinct period that was open at posting time. | J09 | PeriodAdjustment, AccountingPeriod, CommercialResponsibility, Currency, Principal, EvidenceDocument | B180 | BR-180-PASS, BR-180-REJECT |
| BR-181 | Monetary rounding reproduces the declared signed decimal mode and scale from zero through six places. | J08 | AmountRounding, RoundingPolicy, Currency | B181 | BR-181-PASS, BR-181-REJECT |
| BR-182 | Currency conversion preserves quote direction, positive rate, calculation time and rounded output evidence. | J12 | CurrencyConversion, ExchangeRate, Currency, AmountRounding, EvidenceDocument | B182 | BR-182-PASS, BR-182-REJECT |
| BR-183 | Rating totals sum every rated line in one declared currency. | J08 | RatingCalculation, ChargingSession, TariffVersion, RatedLine, Currency, EvidenceDocument, TariffResolution | B183 | BR-183-PASS, BR-183-REJECT |
| BR-184 | A rated line using rounding evidence agrees with its amount, currency and policy. | J08 | RatedLine, PriceComponent, Currency, RoundingPolicy, TaxDetermination, ChargingInterval, AmountRounding | B184 | BR-184-PASS, BR-184-REJECT |
| BR-185 | Tax rule validity is assessed at the taxable supply time, including later corrections. | J08 | TaxDetermination, LegalEntity, TaxRule, Currency | B185 | BR-185-PASS, BR-185-REJECT |
| BR-186 | An offset-bearing price instant and its UTC interpretation identify the same instant. | J08 | PricingTimeResolution, EvidenceDocument | B186 | BR-186-PASS, BR-186-REJECT |
| BR-187 | Posted settlement legs match their batch agreement and currency, balance amounts and name distinct liable and entitled parties. | J12 | SettlementLeg, SettlementBatch, ChargeDetailRecord, ServiceAgreement, LegalEntity, Currency, EvidenceDocument | B187 | BR-187-PASS, BR-187-REJECT |
| BR-188 | A posted economic leg has one reference within its tenant and settlement batch. | J12 | SettlementLeg, SettlementBatch, ChargeDetailRecord, ServiceAgreement, LegalEntity, Currency, EvidenceDocument | B188 | BR-188-PASS, BR-188-REJECT |
| BR-189 | Closing a rights request preserves fulfilment or refusal, identity checks where fulfilled, and a response with completion time. | J16 | DataSubjectRequest, CustomerAccount, LegalEntity, EvidenceDocument | B189 | BR-189-PASS, BR-189-REJECT |
| BR-190 | Deletion cannot omit an active hold on an explicitly disposed record. | J16 | DataDisposition, CustomerAccount, RetentionPolicy, EvidenceDocument, LegalHold | B190 | BR-190-PASS, BR-190-REJECT |
| BR-191 | A required business step cannot be skipped. | J20 | ProcessStep, LegalEntity, ContractObligation, EvidenceDocument | B191 | BR-191-PASS, BR-191-REJECT |
| BR-192 | Predecessors belong to the same process, have lower sequence numbers and finish before a dependent step succeeds. | J20 | ProcessStep, LegalEntity, ContractObligation, EvidenceDocument | B192 | BR-192-PASS, BR-192-REJECT |
| BR-193 | Billing readiness considers actual unresolved blocking issues against the session. | J07 | BillingReadinessAssessment, ChargingSession, LegalEntity, EvidenceDocument | B193 | BR-193-PASS, BR-193-REJECT |
| BR-194 | An entitlement cannot outlive its finite funding agreement. | J02 | ServiceEntitlement, CustomerAccount, ServiceAgreement, LegalEntity | B194 | BR-194-PASS, BR-194-REJECT |
| BR-195 | Completed closure agrees with the account state, chronology and actual scoped access grants. | J02 | AccountClosure, CustomerAccount, Currency, LegalEntity, EvidenceDocument | B195 | BR-195-PASS, BR-195-REJECT |
| BR-196 | Retirement or replacement cannot hide an unfinished session on the station. | J03 | AssetLifecycleEvent, ChargingStation, LegalEntity, EvidenceDocument | B196 | BR-196-PASS, BR-196-REJECT |
| BR-197 | An ownership transfer identifies different previous and succeeding owners. | J03 | OwnershipTransfer, ChargingStation, EvidenceDocument | B197 | BR-197-PASS, BR-197-REJECT |
| BR-198 | Applied and duplicate outcomes retain processing time no earlier than receipt. | J06 | EventProcessingOutcome, SourceEvent, LegalEntity | B198 | BR-198-PASS, BR-198-REJECT |
| BR-199 | The disclosed price currency and optional display tariff agree with the commercial offer. | J04 | CommercialOffer, LegalEntity, CustomerAccount, TariffVersion, PriceDisplay, Currency, EvidenceDocument | B199 | BR-199-PASS, BR-199-REJECT |
| BR-200 | Refunds have positive amounts and confirmation requires an originally confirmed capture. | J09 | Refund, PaymentCapture, Currency | B200 | BR-200-PASS, BR-200-REJECT |
| BR-201 | A chargeback disputes a positive amount no greater than its confirmed capture in the same currency. | J11 | Chargeback, PaymentCapture, Currency, EvidenceDocument | B201 | BR-201-PASS, BR-201-REJECT |
| BR-202 | A confirmed payout is positive, pays the account holder and retains a confirmation no earlier than scheduling. | J13 | Payout, LegalEntity, FinancialAccountReference, Currency, SettlementBatch, ReimbursementRecord | B202 | BR-202-PASS, BR-202-REJECT |
| BR-203 | Flexibility delivery records signed actual-minus-baseline energy; reduction is negative. | J15 | FlexibilityDelivery, FlexibilityActivation, EvidenceDocument | B203 | BR-203-PASS, BR-203-REJECT |
| BR-204 | Simultaneous module allocations cannot exceed shared cabinet capacity; touching half-open intervals do not overlap. | J15 | PowerCabinet, ChargingSite, ChargingUnit, PowerModuleAllocation | B204 | BR-204-PASS, BR-204-REJECT |
| BR-205 | Closed service-level breaches retain evidence of the accepted resolution. | J18 | ServiceLevelBreach, ServiceLevelCommitment, AvailabilityResult, WorkOrder, EvidenceDocument | B205 | BR-205-PASS, BR-205-REJECT |
| BR-206 | A synchronization watermark cannot be later than its successful synchronization time. | J19 | SynchronizationCursor, RoamingConnection | B206 | BR-206-PASS, BR-206-REJECT |
| BR-207 | Commercial responsibility is bounded by its agreement while remaining usable for historical usage. | J01 | CommercialResponsibility, ServiceAgreement, LegalEntity, EvidenceDocument | B207 | BR-207-PASS, BR-207-REJECT |
| BR-208 | Accepted session authorization precedes start and has not expired at start. | J05 | ChargingSession, ChargingUnit, CustomerAccount, Vehicle, AuthorizationDecision, TariffVersion, SessionEndEvidence, Reservation, CommercialResponsibility, BillingReadinessAssessment | B208 | BR-208-PASS, BR-208-REJECT |
| BR-209 | Payment state agrees with confirmed capture totals, including partial and fully refunded outcomes. | J09 | PaymentIntent, CustomerAccount, ChargingSession, Invoice, PaymentInstrument, Currency, PaymentRouting | B209 | BR-209-PASS, BR-209-REJECT |
| BR-210 | Confirmed capture records represent a positive collected amount. | J09 | PaymentCapture, PaymentIntent, PaymentAuthorization, Currency, PaymentAllocation | B210 | BR-210-PASS, BR-210-REJECT |
| BR-211 | Refund requests do not precede the original capture. | J09 | Refund, PaymentCapture, Currency | B211 | BR-211-PASS, BR-211-REJECT |
| BR-212 | Paid invoice status is backed by a settled same-currency position with collections and credits covering its gross amount. | J09 | Invoice, LegalEntity, BillingProfile, Currency, InvoiceLine, DocumentNumberSequence, CommercialResponsibility | B212 | BR-212-PASS, BR-212-REJECT |
| BR-213 | An invoice-specific collection cannot be allocated to a different source obligation. | J09 | PaymentAllocation, PaymentCapture, FinancialPosition, Currency, EvidenceDocument | B213 | BR-213-PASS, BR-213-REJECT |
| BR-214 | An invoice credit is a positive reduction; negative credits cannot offset cumulative credit limits. | J09 | CreditNote, Invoice, Currency, LegalEntity, EvidenceDocument | B214 | BR-214-PASS, BR-214-REJECT |
| BR-215 | Posted allocations cannot retain money already returned by confirmed refunds. | J09 | PaymentCapture, PaymentIntent, PaymentAuthorization, Currency, PaymentAllocation | B215 | BR-215-PASS, BR-215-REJECT |
| BR-216 | Cancelled subscriptions retain cancellation evidence time and disable renewal; ended periods have positive duration. | J14 | Subscription, CustomerAccount, SubscriptionPlan | B216 | BR-216-PASS, BR-216-REJECT |
| BR-217 | A billed subscription period retains a non-draft, non-void invoice in its currency. | J14 | BillingPeriod, Subscription, TimeWindow, Invoice, Currency | B217 | BR-217-PASS, BR-217-REJECT |
| BR-218 | Settlement approval cannot conceal unresolved reconciliation cases directly against the batch or its items. | J12 | SettlementApproval, SettlementBatch, Principal, LegalEntity, EvidenceDocument | B218 | BR-218-PASS, BR-218-REJECT |

## BR-001 — Tenant identity and isolation

- Accountable: Platform controller.
- Financial ownership: Accountable organization.
- Actors: SecurityAdmin, PlatformOperator, Auditor, OEM, DataProcessor.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: W3C-SHACL.
- Associated full-graph journey snapshots: JOURNEY-PRIVACY-PASS, JOURNEY-PRIVACY-REJECT, JOURNEY-ACCESS-PASS, JOURNEY-ACCESS-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: RecordShape, TenantShape, ExternalIdentifierShape, AddressShape, GeoPositionShape, QuantityShape, AnnotationShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| Record | tenant, canonicalId, createdAt, revision, label, externalIdentifier, evidence, customValue, annotation |
| Tenant | tenantName, tenantKey |
| ExternalIdentifier | identifierValue, identifierScheme, assigningAuthority, validFrom, validUntil |
| Address | countryCode, locality, postalCode, streetAddress, regionCode |
| GeoPosition | latitude, longitude, altitudeMetres |
| Quantity | numericValue, unitIri, quantityKind |
| Annotation | noteText, author, notedAt, visibility |

## BR-002 — Typed extensibility

- Accountable: Platform operator.
- Financial ownership: Contract residual owner.
- Actors: CPO, eMSP, RoamingHub, OEM, PlatformOperator, DataProcessor.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: OCA-CORE.
- Associated full-graph journey snapshots: JOURNEY-ASSET-PASS, JOURNEY-ASSET-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: OperatorServiceShape, ChargingStationShape, ChargingAreaShape, ChargingSiteShape, ParkingSpaceShape, ElectricalCircuitShape, LoadControlGroupShape, PaymentTerminalShape, ManufacturerShape, EquipmentModelShape, DeviceCapabilityShape, ChargingUnitShape, ConnectorShape, ElectricalConnectionShape, OwnershipTransferShape, AssetLifecycleEventShape, OperationalAcceptanceShape, ConnectorCompatibilityShape.
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
| Manufacturer | manufacturerParty, manufacturerName |
| EquipmentModel | manufacturer, modelCode, modelRevision, capability, manual |
| DeviceCapability | capabilityCode, protocolVersion, firmware, verificationState, evidence |
| ChargingUnit | station, physicalReference, currentKind, maximumPowerKW, minimumCurrentA, maximumCurrentA, tariffSet, reservable, bookable, calibration, electricalConnection |
| Connector | chargingUnit, connectorReference, connectorStandard, connectorFormat, ratedVoltageV, ratedCurrentA, maximumPowerKW |
| ElectricalConnection | circuit, connectedRecord, conductorCode, voltageV |
| OwnershipTransfer | transferredAsset, previousOwner, nextOwner, effectiveAt, transferEvidence |
| AssetLifecycleEvent | station, assetAction, effectiveAt, accountableParty, assetEventEvidence, replacementStation, openSessionCount |
| OperationalAcceptance | station, acceptanceState, safetyAccepted, protocolAccepted, meteringAccepted, maintenanceProvider, acceptedAt, acceptanceEvidence |
| ConnectorCompatibility | connector, vehicle, compatibilityState, currentTypeMatch, voltageMatch, connectorTypeMatch, assessedAt |

## BR-004 — Electrical capability and cabinet sharing

- Accountable: Site energy responsible party.
- Financial ownership: Import payer or export beneficiary.
- Actors: GridOperator, EnergySupplier, Aggregator, SiteHost, Driver, FleetManager.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: EC-AFIR.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: PublicListingShape, ChargingSiteShape, ChargingAreaShape, ParkingSpaceShape, SiteAccessPolicyShape, ServiceNoticeShape, SharingAgreementShape, SharingInvitationShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| PublicListing | site, operatorService, listingState, publicName, accessibility, parkingCategory, facilityCode, paymentOptionCode, paymentOptionsKnowledge, paymentBrandCode, media, publishedAt |
| ChargingSite | siteName, address, position, timezoneName, siteHost, openingWindow, serviceNotice, siteAccessPolicy |
| ChargingArea | site, areaName, parkingSpace, terminal |
| ParkingSpace | site, area, bayReference, accessibleBay, servesUnit, occupancy, occupancyObservedAt |
| SiteAccessPolicy | accessMode, eligibleGroup, credentialMethod, openingWindow, stopOutsideOpening |
| ServiceNotice | noticeText, noticeSeverity, validFrom, validUntil, affectedRecord |
| SharingAgreement | sharedRecord, sharingParty, beneficiary, accessGrant, validFrom, validUntil |
| SharingInvitation | sharedRecord, inviter, inviteeReference, invitationState, expiresAt, invitationSecretReference, sharingAgreement |

## BR-006 — Authorization identity and target

- Accountable: CPO or delegated eMSP.
- Financial ownership: Offline exposure owner.
- Actors: Driver, CPO, eMSP, FleetManager, OEM.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: OCA-CORE.
- Associated full-graph journey snapshots: JOURNEY-OFFLINE-PASS, JOURNEY-OFFLINE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: AuthorizationRequestShape, AuthorizationDecisionShape, ChargingSessionShape, VehicleShape, VehicleAssignmentShape, VehicleTelemetryShape, ChargingCredentialShape, CredentialAssignmentShape, LocalAuthorizationListShape, LocalAuthorizationEntryShape, PlugAndChargeEnrollmentShape, ProvisioningCertificateShape, OfflineAuthorizationAssessmentShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| AuthorizationRequest | credential, customer, chargingUnit, requestedAt, authorizationMethod, sourceEvent |
| AuthorizationDecision | authorizationRequest, decision, reasonCode, decidedAt, decisionSource, appliedPolicy, expiresAt |
| ChargingSession | chargingUnit, customer, vehicle, authorizationDecision, sessionState, startedAt, endedAt, importedEnergyKWh, exportedEnergyKWh, commercialMode, selectedTariff, endEvidence, reservation, commercialResponsibility, billingReadiness |
| Vehicle | vehicleReference, vehicleCategory, batteryCapacityKWh, maximumChargePowerKW, vehicleIdentificationReference, telematicsIntegration |
| VehicleAssignment | vehicle, customer, assignmentRole, validFrom, validUntil |
| VehicleTelemetry | vehicle, observedAt, stateOfChargePercent, odometerKm, sourceEvent |
| ChargingCredential | credentialKind, credentialIdentifier, credentialState, customer, vehicle, paymentInstrument, validFrom, validUntil, homeOnly |
| CredentialAssignment | credential, customer, vehicle, validFrom, validUntil |
| LocalAuthorizationList | station, listVersion, localListEntry, generatedAt |
| LocalAuthorizationEntry | credential, credentialState, validUntil |
| PlugAndChargeEnrollment | customer, vehicle, provisioningCertificate, contractCertificate, emaid, enrollmentState |
| ProvisioningCertificate | provisioningIdentifier, customer, vehicle, certificate, provisioningState |
| OfflineAuthorizationAssessment | authorizationDecision, cacheAgeSeconds, maximumCacheAgeSeconds, credentialRevoked, unknownCredential, permitUnknownCredential, exposureAmount, maximumExposureAmount, currency, accountableParty, offlineDecision, policyVersion |

## BR-007 — Charging lifecycle and termination evidence

- Accountable: CPO.
- Financial ownership: Commercial service supplier.
- Actors: Driver, CPO, PlatformOperator, OEM.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: OCA-CORE.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT, JOURNEY-OFFLINE-PASS, JOURNEY-OFFLINE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ChargingSessionShape, SessionEndEvidenceShape, StateTransitionShape, ProtocolTransactionShape, ChargingIntervalShape, UsageAggregateShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ChargingSession | chargingUnit, customer, vehicle, authorizationDecision, sessionState, startedAt, endedAt, importedEnergyKWh, exportedEnergyKWh, commercialMode, selectedTariff, endEvidence, reservation, commercialResponsibility, billingReadiness |
| SessionEndEvidence | session, finalizationBasis, finalizedAt, completeness, sourceEvent, finalMeterObservation |
| StateTransition | targetRecord, stateProperty, previousState, nextState, transitionedAt, sourceEvent, previousTransition, transitionSequence, responsibleParty |
| ProtocolTransaction | session, endpoint, transactionIdentifier, bootEpoch, protocolVersion, startedAt, endedAt |
| ChargingInterval | session, interval, intervalKind, importedEnergyKWh, exportedEnergyKWh, averagePowerKW |
| UsageAggregate | scopeRecord, interval, importedEnergyKWh, exportedEnergyKWh, aggregationMethod, sourceEvent |

## BR-008 — Versioned tariff selection and pricing bounds

- Accountable: Billing supplier.
- Financial ownership: Merchant of record.
- Actors: CPO, eMSP, Finance, Driver, TaxAuthority.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: OCPI-TARIFF.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT, JOURNEY-CREDIT-PASS, JOURNEY-CREDIT-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: TariffVersionShape, TariffSetShape, DynamicPriceFormulaShape, DiscountRuleShape, FeeBoundsShape, PriceTierShape, SessionPricingPolicyShape, RatingCalculationShape, TariffShape, PriceComponentShape, PricingConditionShape, TariffAssignmentShape, TariffResolutionShape, ScheduledTariffChangeShape, ElectricityPriceScheduleShape, ElectricityPriceIntervalShape, EnergyMixShape, EnergySourceShareShape, SessionLimitPolicyShape, PriceFreezePolicyShape, PreauthorizationPolicyShape, SubsidyRuleShape.
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
| Tariff | operatorService, tariffName, tariffPurpose, tariffState |
| PriceComponent | priceDimension, unitPrice, unitIri, billingStep, taxRule, minimumQuantity, maximumQuantity, graceQuantity, pricingCondition, feeBounds, priceTier, priceFreezePolicy, graceMode, pricingTimeResolution |
| PricingCondition | conditionDimension, comparisonOperator, comparisonValue, comparisonDatatype, relatedRecord, priority, measurementAggregation, measurementWindowSeconds, unitIri |
| TariffAssignment | assignedTariff, priority, eligibleGroup, pricingCondition |
| TariffResolution | session, tariffSet, selectedTariff, resolvedAt, resolverVersion, decisionExplanation, resolvedBaseTariff |
| ScheduledTariffChange | tariff, nextTariffVersion, effectiveAt, changeState, requestedBy |
| ElectricityPriceSchedule | scheduleName, utilityParty, currency, pricingMode, defaultUnitPrice, priceInterval, energyMix, timezoneName |
| ElectricityPriceInterval | interval, recurringWindow, unitPrice, unitIri, quotedAt |
| EnergyMix | mixName, sourceShare, reportingPeriod, evidence |
| EnergySourceShare | energySource, shareFraction |
| SessionLimitPolicy | limitDimension, limitValue, unitIri, enforcement, applicableTariff |
| PriceFreezePolicy | freezeMoment, priceDimension |
| PreauthorizationPolicy | currency, initialHoldAmount, incrementalHoldAmount, holdTimeoutSeconds, failureAction |
| SubsidyRule | fundingParty, subsidyBasis, subsidyValue, subsidyPolicyVersion, integrationConnection, pricingCondition |

## BR-009 — Clock and signed meter evidence

- Accountable: Metering responsible party.
- Financial ownership: Billing supplier.
- Actors: MetrologyProvider, CPO, AssetOwner, Driver.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: OCPI-CDR.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT, JOURNEY-CREDIT-PASS, JOURNEY-CREDIT-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ChargeDetailRecordShape, RecordCorrectionShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ChargeDetailRecord | session, issuer, recipient, recordOrigin, externalIdentifier, recordVersion, period, importedEnergyKWh, exportedEnergyKWh, currency, netAmount, taxAmount, grossAmount, selectedTariff, correctionOf, receivedAt, artifact, recordKind, originalChargeRecord, billingReadiness, commercialResponsibility |
| RecordCorrection | originalRecord, correctingRecord, correctionReason, correctionKind, approvedBy, issuedAt, correctionEvidence, notifiedParty |

## BR-011 — Schedules, forecasts and charging profiles

- Accountable: Site energy responsible party.
- Financial ownership: Import payer or export beneficiary.
- Actors: GridOperator, EnergySupplier, Aggregator, SiteHost, Driver, FleetManager.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: OCA-CORE.
- Associated full-graph journey snapshots: JOURNEY-ENERGY-PASS, JOURNEY-ENERGY-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ChargingScheduleShape, ForecastPointShape, ChargingProfileShape, GridConnectionShape, LoadControlGroupShape, ControlGroupMembershipShape, PowerConstraintShape, PhaseCurrentConstraintShape, PriorityRuleShape, SmartChargingPreferenceShape, SchedulePeriodShape, ScheduleApplicationShape, UnmanagedLoadObservationShape, EnergyForecastShape, DemandResponseProgramShape, FlexibilityAssetShape, FlexibilityActivationShape, DistributedEnergyAssetShape, ControlDecisionShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ChargingSchedule | controlledAsset, schedulePurpose, scheduleKind, scheduleUnit, schedulePeriod, validFrom, validUntil, stackLevel, session |
| ForecastPoint | interval, predictedValue, lowerBound, upperBound |
| ChargingProfile | profilePurpose, profileKind, stackLevel, chargingSchedule, recurrenceKind, protocolTransaction, relativeAnchor |
| GridConnection | site, gridOperator, importLimitKW, exportLimitKW, effectiveWindow, connectionIdentifier |
| LoadControlGroup | groupName, site, parentControlGroup, phaseSystem, phaseRotation, controlStrategy, offlineReserveCurrentA, externalControlIntegration |
| ControlGroupMembership | controlGroup, controlledAsset, phaseRotation, validFrom, validUntil |
| PowerConstraint | controlGroup, interval, energyDirection, maximumPowerKW, constraintOrigin, priority |
| PhaseCurrentConstraint | controlGroup, interval, phaseCode, maximumCurrentA, constraintOrigin |
| PriorityRule | controlGroup, priority, targetRecord, minimumStateOfChargePercent, maximumStateOfChargePercent, boostUntil |
| SmartChargingPreference | customer, station, strategy, departureAt, requiredEnergyKWh, targetStateOfChargePercent, randomizedDelaySeconds |
| SchedulePeriod | periodStart, periodEnd, limitValue, numberOfPhases, energyDirection |
| ScheduleApplication | chargingSchedule, command, applicationState, appliedAt, observedCompliance |
| UnmanagedLoadObservation | controlGroup, observedAt, powerKW, phaseCurrentA, phaseCode, quality, sourceEvent |
| EnergyForecast | forecastTarget, issuedAt, horizon, forecastMethod, forecastPoint, unitIri |
| DemandResponseProgram | programProvider, programReference, protocolName, settlementUnit, serviceAgreement |
| FlexibilityAsset | controlGroup, demandResponseProgram, integration, assetState, validUntil |
| FlexibilityActivation | flexibilityAsset, interval, requestedPowerKW, activationState, baseline, requestedAt |
| DistributedEnergyAsset | site, energyAssetKind, ratedPowerKW, capacityKWh, integration, bidirectional |
| ControlDecision | chargingUnit, interval, requestedPowerKW, feasiblePowerKW, safetyLimitKW, contractualLimitKW, controlDecision, energyDirection, accountableParty, overrideAuthorization, exportAgreement, controlEvidence |

## BR-012 — Energy intervals and recurring time

- Accountable: Site energy responsible party.
- Financial ownership: Import payer or export beneficiary.
- Actors: GridOperator, EnergySupplier, Aggregator, SiteHost, Driver, FleetManager.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: InvoiceShape, InvoiceLineShape, RatedLineShape, TaxDeterminationShape, BillingProfileShape, TaxIdentifierShape, TaxRuleShape, RatingCalculationShape, CreditNoteShape, ReceiptShape, DocumentNumberSequenceShape, FiscalizationAttemptShape, CustomFeeShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| Invoice | issuer, billingProfile, invoiceNumber, issuedAt, dueAt, invoiceState, currency, invoiceLine, netAmount, taxAmount, grossAmount, numberSequence, financialOwner, commercialResponsibility |
| InvoiceLine | lineDescription, quantityValue, unitPrice, netAmount, taxAmount, grossAmount, currency, ratedLine, chargeRecord, serviceAgreement |
| RatedLine | priceComponent, quantityValue, unitPrice, netAmount, taxAmount, grossAmount, currency, roundingPolicy, taxDetermination, chargingInterval, amountRounding |
| TaxDetermination | supplier, customerParty, taxRule, taxBasisAmount, taxAmount, currency, determinationReason, determinedAt, taxableAt |
| BillingProfile | billToName, billToAddress, taxIdentifier, receiptEmail, billingParty |
| TaxIdentifier | taxNumber, jurisdictionCode, taxIdentifierType, party, verificationState |
| TaxRule | taxName, jurisdictionCode, taxFraction, validFrom, validUntil, taxCategory, taxIdentifier |
| RatingCalculation | session, selectedTariff, ratingVersion, calculatedAt, ratedLine, currency, netAmount, taxAmount, grossAmount, evidence, tariffResolution |
| CreditNote | originalInvoice, creditNumber, issuedAt, creditReason, currency, creditAmount, issuer, artifact |
| Receipt | paymentCapture, receiptNumber, issuedAt, currency, receivedAmount, invoice, artifact |
| DocumentNumberSequence | issuer, documentKind, numberPrefix, nextSequence, numberWidth |
| FiscalizationAttempt | invoice, integration, attemptedAt, attemptNumber, fiscalizationState, authorityReference, fiscalDocument, failureCode |
| CustomFee | customer, feeReason, currency, netAmount, taxAmount, grossAmount, assessedAt, taxDetermination |

## BR-014 — Collection, refunds, holds and payouts

- Accountable: Issuer and collector.
- Financial ownership: Creditor.
- Actors: Finance, Driver, PaymentProvider, TaxAuthority.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: PSP-REFUND.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: PaymentAuthorizationShape, PaymentCaptureShape, RefundShape, PaymentIntentShape, PayoutShape, PayoutBatchShape, PreauthorizationPolicyShape, CurrencyShape, ExchangeRateShape, PaymentInstrumentShape, ChargebackShape, TopUpOfferShape, VoucherShape, VoucherRedemptionShape, PaymentTerminalShape, FinancialAccountReferenceShape, PaymentRoutingShape, PaymentAllocationShape, ReconciliationResolutionShape.
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
| Currency | currencyCode, minorUnitDigits |
| ExchangeRate | baseCurrency, quoteCurrency, conversionRate, quotedAt, rateProvider |
| PaymentInstrument | customer, instrumentKind, provider, providerInstrumentReference, instrumentState, expiryMonth |
| Chargeback | paymentCapture, disputedAmount, currency, reasonCode, responseDueAt, disputeState, evidence |
| TopUpOffer | offerName, currency, purchaseAmount, creditAmount, validFrom, validUntil |
| Voucher | voucherCodeReference, currency, faceValue, validFrom, validUntil, redemptionLimit, voucherState |
| VoucherRedemption | voucher, wallet, redeemedAmount, redeemedAt, idempotencyKey, walletEntry |
| PaymentTerminal | terminalName, terminalSerial, terminalType, integration, station, area, preauthorizationAmount, currency, supportedLanguage, displayTemplate |
| FinancialAccountReference | accountHolder, accountReference, accountScheme, maskedAccount, bankCountryCode, bankIdentifierCode |
| PaymentRouting | integrationConnection, merchantAccountReference, routePriority, pricingCondition |
| PaymentAllocation | paymentCapture, financialPosition, allocatedAmount, currency, allocationState, allocatedAt, allocationEvidence |
| ReconciliationResolution | reconciliationCase, resolutionKind, resolvedAt, resolutionEvidence, financialOwner, correction |

## BR-015 — Double-entry currency balance

- Accountable: Issuer and collector.
- Financial ownership: Creditor.
- Actors: Finance, Driver, PaymentProvider, TaxAuthority.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: JournalShape, JournalLineShape, LedgerAccountShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| Journal | postedAt, journalState, journalLine, postingReference, reversalOf, accountingPeriod |
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-REIMBURSEMENT-PASS, JOURNEY-REIMBURSEMENT-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: CorporateCostAllocationShape, CorporateBillingSnapshotShape, ReimbursementPolicyShape, ReimbursementRecordShape, CorporateChargerRuleShape, CorporateBillingPolicyShape, ReimbursementReportShape, ReimbursementTaxCalculationShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| CorporateCostAllocation | session, corporateSnapshot, currency, totalAmount, sponsorAmount, driverAmount, calculationVersion |
| CorporateBillingSnapshot | corporateBillingPolicy, policyVersion, snapshotDigest, session, capturedAt |
| ReimbursementPolicy | policyName, reimbursementRateSource, electricitySchedule, validFromDate, validUntilDate, partner, serviceAgreement |
| ReimbursementRecord | session, reimbursementPolicy, beneficiaryAccount, currency, reimbursableEnergyKWh, reimbursementRate, reimbursementAmount, reimbursementState, calculatedAt, correctionOf, reimbursementTaxCalculation, payout, reimbursementApproval |
| CorporateChargerRule | currentKind, coverageMode, costCapPerKWh, maximumEnergyUnitPrice, maximumIdleUnitPrice, maximumFlatFee |
| CorporateBillingPolicy | sponsor, policyName, policyVersion, coverageMode, individualPeriodLimit, currency, costCapPerKWh, eligibleGroup, pricingCondition, corporateChargerRule, policyState |
| ReimbursementReport | payer, period, currency, reimbursementRecord, totalAmount, reportState |
| ReimbursementTaxCalculation | taxBasis, taxRatePercent, netAmount, taxAmount, grossAmount, currency, taxDetermination |

## BR-017 — Coupons, vouchers and reversals

- Accountable: Service provider.
- Financial ownership: Benefit funder.
- Actors: Driver, FleetManager, Employer, Sponsor, Finance.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
| Wallet | customer, currency, balanceAmount, balanceAsOf, walletState, openingBalance, balanceFrom |

## BR-018 — Availability measurement

- Accountable: Maintenance/service provider.
- Financial ownership: SLA remedy owner.
- Actors: Maintainer, Installer, CPO, SupportAgent, PlatformOperator, AssetOwner.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: OCA-UPTIME.
- Associated full-graph journey snapshots: JOURNEY-MIGRATION-PASS, JOURNEY-MIGRATION-REJECT, JOURNEY-ASSET-PASS, JOURNEY-ASSET-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: AvailabilityPolicyShape, AvailabilityResultShape, OperationalPeriodShape, DowntimePeriodShape, MetricDefinitionShape, MetricObservationShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| AvailabilityPolicy | policyName, policyVersion, includePlannedDowntime, staleAfterSeconds, calculationExpression |
| AvailabilityResult | observedAsset, interval, availabilityPolicy, eligibleSeconds, unavailableSeconds, availabilityFraction, calculatedAt |
| OperationalPeriod | observedAsset, interval, availabilityPolicy |
| DowntimePeriod | observedAsset, interval, downtimeKind, reasonCode, serviceNotice, downtimeState |
| MetricDefinition | metricName, metricVersion, metricExpression, expressionLanguage, unitIri, scopeClass |
| MetricObservation | metricDefinition, scopeRecord, interval, numericValue, calculatedAt, evidence |

## BR-019 — Maintenance, installation and firmware

- Accountable: Maintenance/service provider.
- Financial ownership: SLA remedy owner.
- Actors: Maintainer, Installer, CPO, SupportAgent, PlatformOperator, AssetOwner.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: OCA-CERT.
- Associated full-graph journey snapshots: JOURNEY-MIGRATION-PASS, JOURNEY-MIGRATION-REJECT, JOURNEY-ASSET-PASS, JOURNEY-ASSET-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: WorkOrderShape, InstallationJobShape, FirmwareDeploymentShape, ConfigurationVariableShape, ConfigurationTemplateShape, ConfigurationTemplateEntryShape, TemplateApplicationShape, FirmwareReleaseShape, HardwareStatusObservationShape, ConnectionObservationShape, DiagnosticArtifactShape, VendorFaultDefinitionShape, IssueShape, RecoveryPolicyShape, RecoveryAttemptShape, AvailabilityPolicyShape, AvailabilityResultShape, ServiceLevelCommitmentShape, ServiceLevelBreachShape, RecoveryExerciseShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| WorkOrder | maintenanceProvider, affectedRecord, issue, assignedPrincipal, workState, dueAt, completedAt, completionEvidence |
| InstallationJob | installationCompany, site, station, assignedPrincipal, jobState, scheduledAt, completedAt, commissioningEvidence |
| FirmwareDeployment | firmware, station, requestedAt, deploymentState, completedAt, rollbackFirmware, command |
| ConfigurationVariable | station, componentName, variableName, attributeType, desiredValue, observedValue, valueDatatype, configurationState, observedAt |
| ConfigurationTemplate | templateName, templateVersion, templateEntry |
| ConfigurationTemplateEntry | componentName, variableName, attributeType, lexicalValue, valueDatatype |
| TemplateApplication | configurationTemplate, station, requestedAt, applicationState, command |
| FirmwareRelease | firmwareVersion, firmwareArtifact, compatibleModel, releaseDate, signatureVerified |
| HardwareStatusObservation | observedAsset, hardwareState, observedAt, sourceEvent, vendorFault |
| ConnectionObservation | station, connectionState, observedAt, lastHeartbeatAt |
| DiagnosticArtifact | station, command, artifact, diagnosticState, requestedAt |
| VendorFaultDefinition | manufacturer, faultCode, faultDescription, recommendedAction, faultSeverity |
| Issue | affectedRecord, issueKind, issueState, severity, openedAt, resolvedAt, vendorFault, resolutionNote, billingBlocking |
| RecoveryPolicy | policyName, triggeringFault, recoveryAction, maximumAttempts, cooldownSeconds, escalationRole |
| RecoveryAttempt | issue, recoveryPolicy, command, attemptNumber, attemptedAt, recoveryResult |
| AvailabilityPolicy | policyName, policyVersion, includePlannedDowntime, staleAfterSeconds, calculationExpression |
| AvailabilityResult | observedAsset, interval, availabilityPolicy, eligibleSeconds, unavailableSeconds, availabilityFraction, calculatedAt |
| ServiceLevelCommitment | serviceAgreement, scopeRecord, availabilityPolicy, targetFraction, measurementWindow, accountableParty, exclusionPolicyVersion |
| ServiceLevelBreach | serviceLevelCommitment, availabilityResult, breachState, detectedAt, workOrder, remedyRecord, breachEvidence, closureEvidence |
| RecoveryExercise | scopeRecord, recoveryTimeObjectiveSeconds, recoveryPointObjectiveSeconds, achievedRecoverySeconds, achievedDataLossSeconds, recoveryResult, exercisedAt, accountableParty, recoveryEvidence |

## BR-020 — Fiscal evidence

- Accountable: Issuer and collector.
- Financial ownership: Creditor.
- Actors: Finance, Driver, PaymentProvider, TaxAuthority.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: BrandProfileShape, ExperienceChannelShape, ContentTemplateShape, HelpArticleShape, CustomerNotificationShape, UserDeviceShape, MediaAssetShape, ApplicationInstallationShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| BrandProfile | brandName, supportedLanguage, defaultLanguage, logo, primaryColour, supportContact |
| ExperienceChannel | brand, channelKind, channelUrl, operatorService, policyDocument |
| ContentTemplate | templateKey, templateVersion, templateBody, placeholderName, channelKind |
| HelpArticle | question, answer, displayOrder, contentState |
| CustomerNotification | customer, contentTemplate, requestedAt, notificationChannel, notificationState, sourceEvent |
| UserDevice | customer, deviceReference, platformName, pushTokenReference, lastSeenAt |
| MediaAsset | mediaUrl, mediaType, altText, rightsStatement |
| ApplicationInstallation | applicationName, applicationVersion, provider, integration, accessGrant, installationState |

## BR-022 — Human approval of generated actions

- Accountable: Platform controller.
- Financial ownership: Accountable organization.
- Actors: SecurityAdmin, PlatformOperator, Auditor, OEM, DataProcessor.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: OCA-CORE.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT, JOURNEY-OFFLINE-PASS, JOURNEY-OFFLINE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: RemoteCommandShape, CommandOutcomeShape, CommandParameterShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| RemoteCommand | commandKind, targetRecord, requestedBy, requestedAt, expiresAt, correlationId, idempotencyKey, commandState, sourceEvent, commandParameter |
| CommandOutcome | command, outcomeKind, outcomeState, reasonCode, reportedAt, evidence |
| CommandParameter | parameterKey, lexicalValue, valueDatatype, referencedRecord |

## BR-025 — Reimbursement date boundaries

- Accountable: Employer.
- Financial ownership: Employer or mandated payer.
- Actors: Employer, Employee, FleetManager, PaymentProvider, Finance.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: OCA-CORE.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ReservationShape, BookingShape, BookingRequestShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| Reservation | chargingUnit, customer, reservedAt, expiresAt, reservationState, booking, session |
| Booking | bookingRequest, bookingWindow, chargingUnit, parkingSpace, bookingState |
| BookingRequest | customer, site, requestedWindow, requestKind, previousBooking, requestedEnergyKWh, requestState |

## BR-027 — Settlement agreement and currency identity

- Accountable: Contract supplier.
- Financial ownership: Named settlement owner.
- Actors: CPO, eMSP, SiteHost, AssetOwner, RoamingHub, Finance.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT, JOURNEY-SETTLEMENT-PASS, JOURNEY-SETTLEMENT-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: SettlementBatchShape, SettlementItemShape, SettlementLegShape, RevenueShareRuleShape, CostAllocationRuleShape, SettlementOverrideShape, ReconciliationCaseShape, AgreementLifecycleEventShape, SettlementApprovalShape, ReimbursementApprovalShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| SettlementBatch | serviceAgreement, period, currency, settlementItem, netAmount, taxAmount, grossAmount, settlementState, invoice |
| SettlementItem | serviceAgreement, chargeRecord, adjustmentReason, currency, netAmount, taxAmount, grossAmount, beneficiary |
| SettlementLeg | settlementBatch, chargeRecord, serviceAgreement, liableParty, entitledParty, legReference, legState, currency, netAmount, taxAmount, grossAmount, legEvidence |
| RevenueShareRule | beneficiary, shareFraction, revenueBasis, fixedAmount, currency, applicableTariff |
| CostAllocationRule | responsibleParty, costCategory, allocationFraction, fixedAmount, currency |
| SettlementOverride | serviceAgreement, interval, overrideReason, approvedBy, revenueShareRule, costAllocationRule |
| ReconciliationCase | expectedRecord, observedRecord, mismatchKind, caseState, openedAt, resolutionNote, resolvedAt, expectedIdentifier, accountableParty, reconciliationResolution |
| AgreementLifecycleEvent | serviceAgreement, agreementAction, effectiveAt, accountableParty, decisionEvidence, successorAgreement, residualLiabilityOwner, settlementCutoff |
| SettlementApproval | settlementBatch, approvalState, approvedBy, accountableParty, approvedAt, openDifferenceCount, approvalEvidence |
| ReimbursementApproval | reimbursementRecord, employer, entitledAccount, approvalState, approvedAt, approvalEvidence, approvedEnergyKWh, approvedRate, approvedAmount, currency |

## BR-028 — API token revocation and expiry

- Accountable: Platform controller.
- Financial ownership: Accountable organization.
- Actors: SecurityAdmin, PlatformOperator, Auditor, OEM, DataProcessor.
- Preconditions: A complete authorized tenant snapshot supplies the referenced records and source evidence.
- Normal outcome: The domain contracts hold and the applicable positive reference/journey snapshot conforms.
- Exception outcome: Reject the specified contradictions using the named constraint; retain an attributable case for runtime recovery.
- Review finding: Existing representation retained; reviewed against the independent journey and strengthened by the related new requirements.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CLOSURE-PASS, JOURNEY-CLOSURE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ServiceAgreementShape, PartnerInvitationShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ServiceAgreement | supplier, counterparty, agreementReference, agreementVersion, validFrom, validUntil, coveredRecord, revenueShareRule, costAllocationRule, agreementEvidence, autoRenewal, platformFee, agreementState, financialOwner, governingPolicyVersion |
| PartnerInvitation | partner, inviteeReference, invitationState, accessPolicy, corporateBillingPolicy, expiresAt |

## BR-111 — Fulfilled duties retain a satisfied assessment; waived duties retain a waiver assessment.

- Accountable: Contract supplier.
- Financial ownership: Contract financial owner.
- Actors: CPO, eMSP, SiteHost, AssetOwner, Finance.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Fulfilled duties retain a satisfied assessment; waived duties retain a waiver assessment.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B111.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CLOSURE-PASS, JOURNEY-CLOSURE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ContractObligationShape, ObligationAssessmentShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ContractObligation | serviceAgreement, obligatedParty, entitledParty, obligationScope, obligationKind, dueAt, obligationState, obligationPolicyVersion, financialOwner |
| ObligationAssessment | contractObligation, assessmentOutcome, assessedAt, accountableParty, decisionEvidence |

## BR-112 — Amendment and renewal create a distinct successor version retaining the contract identity.

- Accountable: Contract supplier.
- Financial ownership: Contract financial owner.
- Actors: CPO, eMSP, SiteHost, AssetOwner, Finance.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Amendment and renewal create a distinct successor version retaining the contract identity.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B112.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CLOSURE-PASS, JOURNEY-CLOSURE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ServiceEntitlementShape, PersonShape, ContactProfileShape, OperatorServiceShape, CustomerAccountShape, CustomerGroupShape, GroupMembershipShape, AccountClosureShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ServiceEntitlement | customer, serviceAgreement, scopeRecord, entitlementState, validFrom, validUntil, accountableParty |
| Person | personReference, preferredLanguage, contact |
| ContactProfile | contactPurpose, emailAddress, telephoneNumber, contactAddress, retentionPolicy |
| OperatorService | serviceProvider, serviceName, serviceRole, parentService, brand, defaultCurrency |
| CustomerAccount | operatorService, accountKind, accountState, person, organization, billingProfile, preferredLanguage, accountClosure |
| CustomerGroup | operatorService, groupName, groupingPurpose |
| GroupMembership | customer, customerGroup, validFrom, validUntil |
| AccountClosure | customer, closureState, requestedAt, completedAt, openLiabilityAmount, currency, residualLiabilityOwner, revokedGrantCount, activeGrantCount, closureEvidence |

## BR-115 — Completed closure revokes active access and preserves ownership of any nonzero liability.

- Accountable: Service provider.
- Financial ownership: Creditor or designated successor.
- Actors: Driver, FleetManager, Employer, PrivacyController.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Completed closure revokes active access and preserves ownership of any nonzero liability.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B115.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: EC-AFIR.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: CommercialOfferShape, PriceDisplayShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| CommercialOffer | offeredBy, offeredTo, selectedTariff, priceDisplay, issuedAt, expiresAt, currency, offerMode, registrationRequired, offerEvidence |
| PriceDisplay | displayText, displayCurrency, includesTax, disclosureChannel, effectiveAt, selectedTariff |

## BR-121 — Disclosed currency, tariff currency and offer currency agree and offer expiry follows issue.

- Accountable: Selling operator.
- Financial ownership: Merchant of record.
- Actors: Driver, CPO, eMSP, PaymentProvider, AccessibilityUser.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Disclosed currency, tariff currency and offer currency agree and offer expiry follows issue.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B121.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CLOSURE-PASS, JOURNEY-CLOSURE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: CommercialResponsibilityShape, LegalEntityShape, PartyRoleShape, ManagementDelegationShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| CommercialResponsibility | serviceAgreement, serviceSupplier, merchantOfRecord, taxLiableParty, payer, collectingParty, beneficiary, responsibilityScope, validFrom, validUntil, responsibilityEvidence |
| LegalEntity | legalName, registeredAddress, registrationNumber, taxIdentifier, contact, financialAccount |
| PartyRole | party, businessRole, operatorService, validFrom, validUntil |
| ManagementDelegation | delegator, delegate, scopeRecord, accessGrant, validFrom, validUntil |

## BR-125 — Offline admission obeys credential revocation, cache age, unknown-token policy and financial exposure limits.

- Accountable: CPO or delegated eMSP.
- Financial ownership: Offline exposure owner.
- Actors: Driver, CPO, eMSP, FleetManager, OEM.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Offline admission obeys credential revocation, cache age, unknown-token policy and financial exposure limits.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B125.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: PSP-EVENTS.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT, JOURNEY-OFFLINE-PASS, JOURNEY-OFFLINE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: EventProcessingOutcomeShape, SourceEventShape, SessionEventShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| EventProcessingOutcome | sourceEvent, processingContextKey, idempotencyKey, processingState, payloadDigest, businessEffect, duplicateOf, processedAt, accountableParty, quarantineReason |
| SourceEvent | eventKey, sourceSystem, occurredAt, receivedAt, schemaVersion, payloadEvidence, sequenceNumber, correlationId, clockAssessment |
| SessionEvent | session, sourceEvent, sessionEventKind, sequenceNumber |

## BR-127 — A producer/key/scope combination has at most one applied business-effect outcome in a tenant.

- Accountable: CPO.
- Financial ownership: Commercial service supplier.
- Actors: Driver, CPO, PlatformOperator, OEM.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: A producer/key/scope combination has at most one applied business-effect outcome in a tenant.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B127.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: OCA-UPTIME.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: MeterDeltaShape, ElectricityMeterShape, CalibrationRecordShape, MeterObservationShape, MeterRegisterEpochShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| MeterDelta | registerEpoch, startReading, endReading, deltaValue, deltaBasis, resetDetected, deltaEvidence, session |
| ElectricityMeter | meterSerial, measurandCode, unitIri, site, chargingUnit, calibration, integration |
| CalibrationRecord | meterSerial, jurisdictionCode, validFrom, validUntil, certificateEvidence, verificationState |
| MeterObservation | meter, session, observedAt, numericValue, unitIri, measurandCode, phaseCode, energyDirection, readingKind, quality, sourceEvent, signedEvidence |
| MeterRegisterEpoch | meter, registerIdentifier, validFrom, validUntil, unitIri, energyDirection, multiplier, epochEvidence |

## BR-130 — Measured deltas preserve ordering, multiplier and reset boundaries; estimated deltas require evidence.

- Accountable: Metering responsible party.
- Financial ownership: Billing supplier.
- Actors: MetrologyProvider, CPO, AssetOwner, Driver.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Measured deltas preserve ordering, multiplier and reset boundaries; estimated deltas require evidence.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B130.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: OCPI-CDR.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT, JOURNEY-CREDIT-PASS, JOURNEY-CREDIT-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ChargeDetailRecordShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ChargeDetailRecord | session, issuer, recipient, recordOrigin, externalIdentifier, recordVersion, period, importedEnergyKWh, exportedEnergyKWh, currency, netAmount, taxAmount, grossAmount, selectedTariff, correctionOf, receivedAt, artifact, recordKind, originalChargeRecord, billingReadiness, commercialResponsibility |

## BR-133 — Credit CDRs preserve parties and currency, reverse the original totals and cannot credit the same debit more than once.

- Accountable: Billing supplier.
- Financial ownership: Merchant of record.
- Actors: CPO, eMSP, Finance, Driver, TaxAuthority.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Credit CDRs identify the original, preserve parties and currency, and exactly reverse its monetary totals.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B133.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Historical adversarial review: The first v1.1 full-graph validation accepted the contradictory snapshot; strengthened the existing invariant and retained the baseline observation and regression pair.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: OCPI-CDR.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT, JOURNEY-CREDIT-PASS, JOURNEY-CREDIT-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ChargeDetailRecordShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ChargeDetailRecord | session, issuer, recipient, recordOrigin, externalIdentifier, recordVersion, period, importedEnergyKWh, exportedEnergyKWh, currency, netAmount, taxAmount, grossAmount, selectedTariff, correctionOf, receivedAt, artifact, recordKind, originalChargeRecord, billingReadiness, commercialResponsibility |

## BR-134 — Corrections form an acyclic lineage and cannot replace a record with itself.

- Accountable: Billing supplier.
- Financial ownership: Merchant of record.
- Actors: CPO, eMSP, Finance, Driver, TaxAuthority.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Corrections form an acyclic lineage and cannot replace a record with itself.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B134.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: FinancialPositionShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| FinancialPosition | financialOwner, debtor, creditor, currency, originalAmount, creditedAmount, collectedAmount, writtenOffAmount, outstandingAmount, positionState, sourceRecord, collectionBasis, collectionEvidence, writeOffEvidence |

## BR-136 — A settled position has no residual liability; a written-off position records the write-off.

- Accountable: Issuer and collector.
- Financial ownership: Creditor.
- Actors: Finance, Driver, PaymentProvider, TaxAuthority.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: A settled position has no residual liability; a written-off position records the write-off.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B136.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: FinancialPositionShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| FinancialPosition | financialOwner, debtor, creditor, currency, originalAmount, creditedAmount, collectedAmount, writtenOffAmount, outstandingAmount, positionState, sourceRecord, collectionBasis, collectionEvidence, writeOffEvidence |

## BR-137 — Posted allocations use confirmed collections, positive amounts and matching currencies.

- Accountable: Issuer and collector.
- Financial ownership: Creditor.
- Actors: Finance, Driver, PaymentProvider, TaxAuthority.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Posted allocations use confirmed collections, positive amounts and matching currencies.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B137.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: OCPI-CDR.
- Associated full-graph journey snapshots: JOURNEY-CREDIT-PASS, JOURNEY-CREDIT-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ReconciliationCaseShape, RoamingNetworkShape, RoamingPartyShape, RoamingConnectionShape, RoamingModuleAgreementShape, RoamingExchangeShape, RoamingCommandShape, SynchronizationCursorShape, RoamingTariffMappingShape, RoamingTariffFilterShape, PublicDataPublicationShape, RoamingBehaviorPolicyShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ReconciliationCase | expectedRecord, observedRecord, mismatchKind, caseState, openedAt, resolutionNote, resolvedAt, expectedIdentifier, accountableParty, reconciliationResolution |
| RoamingNetwork | networkName, provider, protocolName, supportedVersion |
| RoamingParty | party, roamingRole, countryCode, partyCode, roamingNetwork, localPartner |
| RoamingConnection | localService, remoteParty, roamingNetwork, serviceAgreement, protocolName, protocolVersion, endpointUrl, credentialReference, connectionState, moduleAgreement, roamingBehaviorPolicy |
| RoamingModuleAgreement | moduleName, moduleVersion, localRole, endpointUrl |
| RoamingExchange | roamingConnection, exchangedRecord, exchangeDirection, exchangeState, externalIdentifier, attemptNumber, sourceEvent, acknowledgedAt |
| RoamingCommand | roamingConnection, command, remoteCommandReference, remoteCommandState, callbackUrl, receivedAt |
| SynchronizationCursor | roamingConnection, streamModuleName, cursorValue, lastSuccessfulAt, watermarkAt |
| RoamingTariffMapping | roamingConnection, remoteTariffIdentifier, importedTariff, retailTariff, sourceEvidence, importedAt |
| RoamingTariffFilter | remoteParty, priority, pricingCondition, resultingTariff, filterState |
| PublicDataPublication | listing, publicationSchema, schemaVersion, destinationUrl, publishedAt, validUntil, publicationEvidence |
| RoamingBehaviorPolicy | mappingMode, unknownUnitStatus, periodicMeterUpdates, phasePowerFormula, overrideExplicitTariff, policyVersion |

## BR-140 — Resolved reconciliation retains a resolution for the same case, a timestamp and explanation.

- Accountable: Local roaming party.
- Financial ownership: Contract financial owner.
- Actors: CPO, eMSP, RoamingHub, Finance.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Resolved reconciliation retains a resolution for the same case, a timestamp and explanation.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B140.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: PSP-DISPUTE.
- Associated full-graph journey snapshots: JOURNEY-CREDIT-PASS, JOURNEY-CREDIT-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ServiceDisputeShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ServiceDispute | disputedRecord, claimant, accountableParty, disputeCaseState, openedAt, responseDueAt, resolutionEvidence, remedyRecord, financialOwner |

## BR-143 — Collection escalation pauses for unresolved disputes against the position or its source record even without an explicit dispute link.

- Accountable: Accountable service provider.
- Financial ownership: Named financial owner.
- Actors: Driver, Partner, SupportAgent, Finance, PaymentProvider.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Collection escalation pauses while the position or linked service dispute is unresolved.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B143.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Historical adversarial review: The first v1.1 full-graph validation accepted the contradictory snapshot; strengthened the existing invariant and retained the baseline observation and regression pair.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-REIMBURSEMENT-PASS, JOURNEY-REIMBURSEMENT-REJECT, JOURNEY-ALLOWANCE-PASS, JOURNEY-ALLOWANCE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: BenefitReservationShape, SubscriptionPlanShape, SubscriptionShape, BillingPeriodShape, BenefitAllowanceShape, AllowanceConsumptionShape, SubscriptionBillingPolicyShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| BenefitReservation | allowance, billingPeriod, session, reservedValue, reservationState, expiresAt, consumption, allowanceBalance |
| SubscriptionPlan | planName, planVersion, billingMode, billingCycle, currency, baseFee, perHomeStationFee, freeInitialPeriods, benefit, visibilityPolicy, externalBilling, subscriptionBillingPolicy |
| Subscription | customer, subscriptionPlan, subscriptionState, startsAt, endsAt, renewAutomatically, cancelledAt |
| BillingPeriod | subscription, period, billingPeriodState, invoice, accruedAmount, currency |
| BenefitAllowance | allowanceDimension, allowanceValue, unitIri, resetRule, rolloverAllowed |
| AllowanceConsumption | allowance, billingPeriod, session, consumedValue, recordedAt, allowanceBalance |
| SubscriptionBillingPolicy | billingType, renewalIntervalMonths, freeRenewalPeriods, currency, baseFee, feePerPersonalStation, applyBaseFeePerStation, usageBillingThreshold, accumulateChargingCharges, replacementPlan |

## BR-149 — A power decision stays within safety and contract limits even when optimization preferences are overridden.

- Accountable: Site energy responsible party.
- Financial ownership: Import payer or export beneficiary.
- Actors: GridOperator, EnergySupplier, Aggregator, SiteHost, Driver, FleetManager.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: A power decision stays within safety and contract limits even when optimization preferences are overridden.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B149.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: OCA-CORE.
- Associated full-graph journey snapshots: JOURNEY-ENERGY-PASS, JOURNEY-ENERGY-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ControlDecisionShape, ExportAgreementShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ControlDecision | chargingUnit, interval, requestedPowerKW, feasiblePowerKW, safetyLimitKW, contractualLimitKW, controlDecision, energyDirection, accountableParty, overrideAuthorization, exportAgreement, controlEvidence |
| ExportAgreement | vehicle, site, gridOperator, energySupplier, serviceAgreement, exportPermitted, validFrom, validUntil, exportMeter, exportBeneficiary |

## BR-151 — An override is authorized for this unit and covers the entire control interval.

- Accountable: Site energy responsible party.
- Financial ownership: Import payer or export beneficiary.
- Actors: GridOperator, EnergySupplier, Aggregator, SiteHost, Driver, FleetManager.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: An override is authorized for this unit and covers the entire control interval.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B151.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-ENERGY-PASS, JOURNEY-ENERGY-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ControlDecisionShape, OverrideAuthorizationShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ControlDecision | chargingUnit, interval, requestedPowerKW, feasiblePowerKW, safetyLimitKW, contractualLimitKW, controlDecision, energyDirection, accountableParty, overrideAuthorization, exportAgreement, controlEvidence |
| OverrideAuthorization | authorizedBy, authorizedScope, validFrom, validUntil, overrideReason, overrideEvidence |

## BR-152 — Fulfilled rights requests require verified identity, completion time and retained response evidence.

- Accountable: Data controller.
- Financial ownership: Contractually allocated data liability owner.
- Actors: Driver, Employee, PrivacyController, DataProcessor, Auditor.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Fulfilled rights requests require verified identity, completion time and retained response evidence.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B152.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: EDPB-RIGHTS.
- Associated full-graph journey snapshots: JOURNEY-PRIVACY-PASS, JOURNEY-PRIVACY-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: DataSubjectRequestShape, PolicyDocumentShape, ConsentDecisionShape, ComplianceAssessmentShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| DataSubjectRequest | subjectAccount, requestKind, requestState, receivedAt, responseDueAt, identityVerified, legalBasisAssessment, responsibleController, responseEvidence, refusalReason, completedAt, requestOutcome |
| PolicyDocument | policyTitle, policyVersion, policyPurpose, validFrom, validUntil, policyArtifact |
| ConsentDecision | customer, policyDocument, consentPurpose, consentChoice, decidedAt, evidence |
| ComplianceAssessment | assessedRecord, jurisdictionCode, regulationReference, provisionReference, applicable, assessmentResult, assessedAt, assessor, evidence |

## BR-153 — Refusal of a rights request retains a reason and a communicated response.

- Accountable: Data controller.
- Financial ownership: Contractually allocated data liability owner.
- Actors: Driver, Employee, PrivacyController, DataProcessor, Auditor.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Refusal of a rights request retains a reason and a communicated response.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B153.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: EDPB-RIGHTS.
- Associated full-graph journey snapshots: JOURNEY-PRIVACY-PASS, JOURNEY-PRIVACY-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: DataSubjectRequestShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| DataSubjectRequest | subjectAccount, requestKind, requestState, receivedAt, responseDueAt, identityVerified, legalBasisAssessment, responsibleController, responseEvidence, refusalReason, completedAt, requestOutcome |

## BR-154 — Completed disposition retains evidence and respects explicit holds and independently recorded active account-wide holds.

- Accountable: Data controller.
- Financial ownership: Contractually allocated data liability owner.
- Actors: Driver, Employee, PrivacyController, DataProcessor, Auditor.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Completed disposition records evidence and cannot claim erasure over a still-active scoped hold.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B154.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Historical adversarial review: The first v1.1 full-graph validation accepted the contradictory snapshot; strengthened the existing invariant and retained the baseline observation and regression pair.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: EDPB-RIGHTS.
- Associated full-graph journey snapshots: JOURNEY-PRIVACY-PASS, JOURNEY-PRIVACY-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: DataDispositionShape, RetentionPolicyShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| DataDisposition | subjectAccount, retentionPolicy, requestedAt, dispositionState, completedAt, dispositionEvidence, legalHold, disposedRecord |
| RetentionPolicy | retentionPurpose, jurisdictionCode, retentionDays, disposition, legalBasis |

## BR-155 — Holds have a future review relative to inception and explicit release evidence in time.

- Accountable: Data controller.
- Financial ownership: Contractually allocated data liability owner.
- Actors: Driver, Employee, PrivacyController, DataProcessor, Auditor.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Holds have a future review relative to inception and explicit release evidence in time.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B155.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: EDPB-RIGHTS.
- Associated full-graph journey snapshots: JOURNEY-PRIVACY-PASS, JOURNEY-PRIVACY-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ProcessingPurposeShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ProcessingPurpose | controller, processor, purposeDescription, lawfulBasis, dataCategory, retentionPolicy, processingScope, internationalTransfer, transferSafeguardEvidence |

## BR-157 — Current permission decisions require an enabled principal and an active time-valid exact scoped grant; historical permits use BR-173 snapshots.

- Accountable: Platform controller.
- Financial ownership: Accountable organization.
- Actors: SecurityAdmin, PlatformOperator, Auditor, OEM, DataProcessor.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Permission decisions require an active time-valid grant to the same principal and explicit record scope.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B157.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Historical adversarial review: The first v1.1 full-graph validation accepted the contradictory snapshot; strengthened the existing invariant and retained the baseline observation and regression pair.
- Completion interaction scenarios: COMPLETE-HISTORICAL-PERMIT-PASS, COMPLETE-HISTORICAL-PERMIT-1, COMPLETE-HISTORICAL-PERMIT-2
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-PRIVACY-PASS, JOURNEY-PRIVACY-REJECT, JOURNEY-ACCESS-PASS, JOURNEY-ACCESS-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: AccessDecisionShape, PrincipalShape, PermissionShape, SecurityRoleShape, AccessGrantShape, AuthorizationSnapshotShape, CertificateRecordShape, CertificateLifecycleEventShape, SecurityEventShape, AuditEntryShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| AccessDecision | grantee, scopeRecord, permission, accessDecision, decidedAt, accessGrant, decisionEvidence, decisionContext, authorizationSnapshot |
| Principal | subjectReference, identityProvider, principalKind, principalState, person |
| Permission | permissionAction, resourceClass, descriptionText |
| SecurityRole | roleName, permission |
| AccessGrant | grantee, securityRole, scopeRecord, validFrom, validUntil, grantState |
| AuthorizationSnapshot | grantee, scopeRecord, permission, sourceGrant, principalEnabled, grantActive, validFrom, validUntil, capturedAt, snapshotEvidence |
| CertificateRecord | certificateFingerprint, certificatePurpose, issuerName, subjectName, validFrom, validUntil, certificateState, certificateArtifact, privateKeyReference |
| CertificateLifecycleEvent | certificate, certificateAction, eventAt, station, command, evidence |
| SecurityEvent | affectedRecord, eventAt, securityEventCode, severity, sourceEvent, issue |
| AuditEntry | actor, auditedRecord, actionCode, eventAt, auditResult, previousDigest, newDigest, sourceEvent |

## BR-158 — Valid artifact verification retains a matching computed digest and verification evidence.

- Accountable: Platform controller.
- Financial ownership: Accountable organization.
- Actors: SecurityAdmin, PlatformOperator, Auditor, OEM, DataProcessor.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Valid artifact verification retains a matching computed digest and verification evidence.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B158.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-PRIVACY-PASS, JOURNEY-PRIVACY-REJECT, JOURNEY-ACCESS-PASS, JOURNEY-ACCESS-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: EvidenceVerificationShape, EvidenceDocumentShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| EvidenceVerification | artifact, verificationState, checkedAt, computedDigest, verifier, verificationEvidence |
| EvidenceDocument | contentDigest, mediaType, storageReference, capturedAt, retentionPolicy |

## BR-159 — Availability commitments use a proportion between zero and one.

- Accountable: Maintenance/service provider.
- Financial ownership: SLA remedy owner.
- Actors: Maintainer, Installer, CPO, SupportAgent, PlatformOperator, AssetOwner.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Availability commitments use a proportion between zero and one.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B159.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-MIGRATION-PASS, JOURNEY-MIGRATION-REJECT, JOURNEY-ASSET-PASS, JOURNEY-ASSET-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ServiceLevelBreachShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ServiceLevelBreach | serviceLevelCommitment, availabilityResult, breachState, detectedAt, workOrder, remedyRecord, breachEvidence, closureEvidence |

## BR-161 — A passed recovery rehearsal meets both time and data-loss objectives.

- Accountable: Maintenance/service provider.
- Financial ownership: SLA remedy owner.
- Actors: Maintainer, Installer, CPO, SupportAgent, PlatformOperator, AssetOwner.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: A passed recovery rehearsal meets both time and data-loss objectives.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B161.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CLOSURE-PASS, JOURNEY-CLOSURE-REJECT, JOURNEY-PROCESS-PASS, JOURNEY-PROCESS-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: LifecycleSnapshotShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| LifecycleSnapshot | targetRecord, stateProperty, stateValue, effectiveAt, snapshotKind, basisTransition |

## BR-164 — Chained transitions preserve record, property, state continuity and nondecreasing time without circular history.

- Accountable: Named accountable party.
- Financial ownership: Named financial owner.
- Actors: AllActors, Finance, Auditor, PlatformOperator.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Chained transitions preserve record, property, state continuity and nondecreasing event time.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B164.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Historical adversarial review: The first v1.1 full-graph validation accepted the contradictory snapshot; strengthened the existing invariant and retained the baseline observation and regression pair.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: OCA-CERT.
- Associated full-graph journey snapshots: JOURNEY-MIGRATION-PASS, JOURNEY-MIGRATION-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ProtocolProfileShape, ProtocolEndpointShape, IntegrationConnectionShape, ApiClientShape, EventSubscriptionShape, EventDeliveryShape, CommunicationLogShape, PlatformSettingShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ProtocolProfile | protocolName, protocolVersion, supportedFeature, unsupportedFeature, adapterVersion, protocolRole, mappingEvidence, unknownFieldPolicy |
| ProtocolEndpoint | endpointIdentity, protocolName, protocolVersion, endpointUrl, credentialReference, securityProfile, protocolProfile |
| IntegrationConnection | integrationName, integrationKind, provider, endpointUrl, contractVersion, credentialReference, integrationState |
| ApiClient | principal, accessGrant, credentialReference, allowedNetwork, requestsPerMinute, requestsPerDay |
| EventSubscription | subscriber, eventType, deliveryTransport, destinationReference, signingKeyReference, includeTimestampInSignature, suppressOwnEvents, includeRoamingAssets, maximumAttempts |
| EventDelivery | eventSubscription, sourceEvent, attemptNumber, attemptedAt, deliveryState, responseCode, nextRetryAt, idempotencyKey |
| CommunicationLog | wireProtocol, integration, endpoint, sourceEvent, direction, messageType, correlationId, protocolResponseCode |
| PlatformSetting | settingKey, settingValue, valueDatatype, scopeRecord, effectiveAt |

## BR-166 — Completed business journeys retain evidence and only successfully completed, compensated or explicitly skipped steps.

- Accountable: Named accountable party.
- Financial ownership: Named financial owner.
- Actors: AllActors, Finance, Auditor, PlatformOperator.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Completed business journeys retain evidence and only successfully completed, compensated or explicitly skipped steps.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B166.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CLOSURE-PASS, JOURNEY-CLOSURE-REJECT, JOURNEY-PROCESS-PASS, JOURNEY-PROCESS-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ProcessExecutionShape, ProcessStepShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ProcessExecution | processKind, processState, accountableParty, financialOwner, subjectRecord, processStep, serviceAgreement, processEvidence |
| ProcessStep | stepSequence, stepKind, responsibleParty, stepState, inputRecord, outputRecord, contractObligation, compensationRecord, stepEvidence, previousStep, requiredStep |

## BR-167 — Successful steps have output and evidence; compensated steps identify their compensating record.

- Accountable: Named accountable party.
- Financial ownership: Named financial owner.
- Actors: AllActors, Finance, Auditor, PlatformOperator.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Successful steps have output and evidence; compensated steps identify their compensating record.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B167.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CLOSURE-PASS, JOURNEY-CLOSURE-REJECT, JOURNEY-PROCESS-PASS, JOURNEY-PROCESS-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ProcessStepShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ProcessStep | stepSequence, stepKind, responsibleParty, stepState, inputRecord, outputRecord, contractObligation, compensationRecord, stepEvidence, previousStep, requiredStep |

## BR-168 — Step sequence numbers are unique within a business journey.

- Accountable: Named accountable party.
- Financial ownership: Named financial owner.
- Actors: AllActors, Finance, Auditor, PlatformOperator.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Step sequence numbers are unique within a business journey.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B168.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
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
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-REIMBURSEMENT-PASS, JOURNEY-REIMBURSEMENT-REJECT, JOURNEY-ALLOWANCE-PASS, JOURNEY-ALLOWANCE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: AllowanceBalanceShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| AllowanceBalance | customer, allowance, billingPeriod, openingValue, grantedValue, consumedValue, reservedValue, expiredValue, closingValue, currency, unitIri, allowanceSponsorship |

## BR-171 — Allowance totals reconcile actual usage and reservations for the same allowance, period and session customer.

- Accountable: Service provider.
- Financial ownership: Benefit funder.
- Actors: Driver, FleetManager, Employer, Sponsor, Finance.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Stored usage and reservations reconcile actual consumptions and active reservations for the same allowance and billing period.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B171.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Historical adversarial review: The first v1.1 full-graph validation accepted the contradictory snapshot; strengthened the existing invariant and retained the baseline observation and regression pair.
- Completion interaction scenarios: COMPLETE-SPONSORED-ALLOWANCE-PASS, COMPLETE-SPONSORED-ALLOWANCE-1, COMPLETE-SPONSORED-ALLOWANCE-2
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-REIMBURSEMENT-PASS, JOURNEY-REIMBURSEMENT-REJECT, JOURNEY-ALLOWANCE-PASS, JOURNEY-ALLOWANCE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: AllowanceBalanceShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| AllowanceBalance | customer, allowance, billingPeriod, openingValue, grantedValue, consumedValue, reservedValue, expiredValue, closingValue, currency, unitIri, allowanceSponsorship |

## BR-172 — Money-denominated allowances identify a currency instead of being treated as energy credits.

- Accountable: Service provider.
- Financial ownership: Benefit funder.
- Actors: Driver, FleetManager, Employer, Sponsor, Finance.
- Preconditions: The described decision is evaluated over a complete authorized snapshot with explicit identities and evidence references.
- Normal outcome: Money-denominated allowances identify a currency instead of being treated as energy credits.
- Exception outcome: Reject the violating decision; the rejection scenario identifies B172.
- Review finding: No dedicated end-to-end contract for this decision existed in the imported model.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: Core focused decisions and associated journey snapshots.
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-REIMBURSEMENT-PASS, JOURNEY-REIMBURSEMENT-REJECT, JOURNEY-ALLOWANCE-PASS, JOURNEY-ALLOWANCE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: AllowanceBalanceShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| AllowanceBalance | customer, allowance, billingPeriod, openingValue, grantedValue, consumedValue, reservedValue, expiredValue, closingValue, currency, unitIri, allowanceSponsorship |

## BR-173 — Historical permits retain matching decision-time principal, grant, permission, scope and validity evidence.

- Accountable: Platform controller.
- Financial ownership: Accountable organization.
- Actors: SecurityAdmin, PlatformOperator, Auditor, OEM, DataProcessor.
- Preconditions: A complete authorized business snapshot provides the subject, referenced contracts, effective times and attributable evidence.
- Normal outcome: Historical permits retain matching decision-time principal, grant, permission, scope and validity evidence.
- Exception outcome: Reject the specified contradiction with B173 and retain an accountable correction or recovery path.
- Review finding: Cross-domain review identified this invariant or legitimate historical/boundary behavior as insufficiently explicit.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-HISTORICAL-PERMIT-PASS, COMPLETE-HISTORICAL-PERMIT-1, COMPLETE-HISTORICAL-PERMIT-2
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-PRIVACY-PASS, JOURNEY-PRIVACY-REJECT, JOURNEY-ACCESS-PASS, JOURNEY-ACCESS-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: AccessDecisionShape, PrincipalShape, PermissionShape, AccessGrantShape, EvidenceDocumentShape, AuthorizationSnapshotShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| AccessDecision | grantee, scopeRecord, permission, accessDecision, decidedAt, accessGrant, decisionEvidence, decisionContext, authorizationSnapshot |
| Principal | subjectReference, identityProvider, principalKind, principalState, person |
| Permission | permissionAction, resourceClass, descriptionText |
| AccessGrant | grantee, securityRole, scopeRecord, validFrom, validUntil, grantState |
| EvidenceDocument | contentDigest, mediaType, storageReference, capturedAt, retentionPolicy |
| AuthorizationSnapshot | grantee, scopeRecord, permission, sourceGrant, principalEnabled, grantActive, validFrom, validUntil, capturedAt, snapshotEvidence |

## BR-174 — Sponsored allowance validity is contained in the funding agreement period.

- Accountable: Service provider.
- Financial ownership: Benefit funder.
- Actors: Driver, FleetManager, Employer, Sponsor, Finance.
- Preconditions: A complete authorized business snapshot provides the subject, referenced contracts, effective times and attributable evidence.
- Normal outcome: Sponsored allowance validity is contained in the funding agreement period.
- Exception outcome: Reject the specified contradiction with B174 and retain an accountable correction or recovery path.
- Review finding: Cross-domain review identified this invariant or legitimate historical/boundary behavior as insufficiently explicit.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-SPONSORED-ALLOWANCE-PASS, COMPLETE-SPONSORED-ALLOWANCE-1, COMPLETE-SPONSORED-ALLOWANCE-2
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-REIMBURSEMENT-PASS, JOURNEY-REIMBURSEMENT-REJECT, JOURNEY-ALLOWANCE-PASS, JOURNEY-ALLOWANCE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: AllowanceSponsorshipShape, CustomerAccountShape, ServiceAgreementShape, EvidenceDocumentShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| AllowanceSponsorship | sponsoringCustomer, beneficiaryCustomer, serviceAgreement, scopeRecord, validFrom, validUntil, sponsorshipEvidence |
| CustomerAccount | operatorService, accountKind, accountState, person, organization, billingProfile, preferredLanguage, accountClosure |
| ServiceAgreement | supplier, counterparty, agreementReference, agreementVersion, validFrom, validUntil, coveredRecord, revenueShareRule, costAllocationRule, agreementEvidence, autoRenewal, platformFee, agreementState, financialOwner, governingPolicyVersion |
| EvidenceDocument | contentDigest, mediaType, storageReference, capturedAt, retentionPolicy |

## BR-175 — Collected balances reconcile to posted allocations or retain explicit external collection evidence.

- Accountable: Issuer and collector.
- Financial ownership: Creditor.
- Actors: Finance, Driver, PaymentProvider, TaxAuthority.
- Preconditions: A complete authorized business snapshot provides the subject, referenced contracts, effective times and attributable evidence.
- Normal outcome: Collected balances reconcile to posted allocations or retain explicit external collection evidence.
- Exception outcome: Reject the specified contradiction with B175 and retain an accountable correction or recovery path.
- Review finding: Cross-domain review identified this invariant or legitimate historical/boundary behavior as insufficiently explicit.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-MONEY-RECONCILIATION-PASS, COMPLETE-MONEY-RECONCILIATION-1, COMPLETE-MONEY-RECONCILIATION-2, COMPLETE-MONEY-RECONCILIATION-3
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: FinancialPositionShape, LegalEntityShape, CurrencyShape, EvidenceDocumentShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| FinancialPosition | financialOwner, debtor, creditor, currency, originalAmount, creditedAmount, collectedAmount, writtenOffAmount, outstandingAmount, positionState, sourceRecord, collectionBasis, collectionEvidence, writeOffEvidence |
| LegalEntity | legalName, registeredAddress, registrationNumber, taxIdentifier, contact, financialAccount |
| Currency | currencyCode, minorUnitDigits |
| EvidenceDocument | contentDigest, mediaType, storageReference, capturedAt, retentionPolicy |

## BR-176 — A write-off has attributable approval evidence.

- Accountable: Issuer and collector.
- Financial ownership: Creditor.
- Actors: Finance, Driver, PaymentProvider, TaxAuthority.
- Preconditions: A complete authorized business snapshot provides the subject, referenced contracts, effective times and attributable evidence.
- Normal outcome: A write-off has attributable approval evidence.
- Exception outcome: Reject the specified contradiction with B176 and retain an accountable correction or recovery path.
- Review finding: Cross-domain review identified this invariant or legitimate historical/boundary behavior as insufficiently explicit.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-MONEY-RECONCILIATION-PASS, COMPLETE-MONEY-RECONCILIATION-1, COMPLETE-MONEY-RECONCILIATION-2, COMPLETE-MONEY-RECONCILIATION-3
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: FinancialPositionShape, LegalEntityShape, CurrencyShape, EvidenceDocumentShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| FinancialPosition | financialOwner, debtor, creditor, currency, originalAmount, creditedAmount, collectedAmount, writtenOffAmount, outstandingAmount, positionState, sourceRecord, collectionBasis, collectionEvidence, writeOffEvidence |
| LegalEntity | legalName, registeredAddress, registrationNumber, taxIdentifier, contact, financialAccount |
| Currency | currencyCode, minorUnitDigits |
| EvidenceDocument | contentDigest, mediaType, storageReference, capturedAt, retentionPolicy |

## BR-177 — Wallet balance equals opening balance plus entries in its inclusive statement interval.

- Accountable: Issuer and collector.
- Financial ownership: Creditor.
- Actors: Finance, Driver, PaymentProvider, TaxAuthority.
- Preconditions: A complete authorized business snapshot provides the subject, referenced contracts, effective times and attributable evidence.
- Normal outcome: Wallet balance equals opening balance plus entries in its inclusive statement interval.
- Exception outcome: Reject the specified contradiction with B177 and retain an accountable correction or recovery path.
- Review finding: Cross-domain review identified this invariant or legitimate historical/boundary behavior as insufficiently explicit.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-MONEY-RECONCILIATION-PASS, COMPLETE-MONEY-RECONCILIATION-1, COMPLETE-MONEY-RECONCILIATION-2, COMPLETE-MONEY-RECONCILIATION-3
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: WalletShape, CustomerAccountShape, CurrencyShape, WalletEntryShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| Wallet | customer, currency, balanceAmount, balanceAsOf, walletState, openingBalance, balanceFrom |
| CustomerAccount | operatorService, accountKind, accountState, person, organization, billingProfile, preferredLanguage, accountClosure |
| Currency | currencyCode, minorUnitDigits |
| WalletEntry | wallet, signedAmount, recordedAt, entryReason, journal, idempotencyKey |

## BR-178 — A closed accounting period retains evidence and a close time no earlier than its end.

- Accountable: Issuer and collector.
- Financial ownership: Creditor.
- Actors: Finance, Driver, PaymentProvider, TaxAuthority.
- Preconditions: A complete authorized business snapshot provides the subject, referenced contracts, effective times and attributable evidence.
- Normal outcome: A closed accounting period retains evidence and a close time no earlier than its end.
- Exception outcome: Reject the specified contradiction with B178 and retain an accountable correction or recovery path.
- Review finding: Cross-domain review identified this invariant or legitimate historical/boundary behavior as insufficiently explicit.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-LATE-CORRECTION-PASS, COMPLETE-LATE-CORRECTION-1, COMPLETE-LATE-CORRECTION-2, COMPLETE-LATE-CORRECTION-3, COMPLETE-LATE-CORRECTION-4, COMPLETE-LATE-CORRECTION-5
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: AccountingPeriodShape, TimeWindowShape, EvidenceDocumentShape, LegalEntityShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| AccountingPeriod | period, periodReference, periodState, closedAt, closingEvidence, financialOwner |
| TimeWindow | startsAt, endsAt |
| EvidenceDocument | contentDigest, mediaType, storageReference, capturedAt, retentionPolicy |
| LegalEntity | legalName, registeredAddress, registrationNumber, taxIdentifier, contact, financialAccount |

## BR-179 — Posted journal timestamps belong to their accounting period and do not follow its close time.

- Accountable: Issuer and collector.
- Financial ownership: Creditor.
- Actors: Finance, Driver, PaymentProvider, TaxAuthority.
- Preconditions: A complete authorized business snapshot provides the subject, referenced contracts, effective times and attributable evidence.
- Normal outcome: Posted journal timestamps belong to their accounting period and do not follow its close time.
- Exception outcome: Reject the specified contradiction with B179 and retain an accountable correction or recovery path.
- Review finding: Cross-domain review identified this invariant or legitimate historical/boundary behavior as insufficiently explicit.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-LATE-CORRECTION-PASS, COMPLETE-LATE-CORRECTION-1, COMPLETE-LATE-CORRECTION-2, COMPLETE-LATE-CORRECTION-3, COMPLETE-LATE-CORRECTION-4, COMPLETE-LATE-CORRECTION-5
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: JournalShape, JournalLineShape, AccountingPeriodShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| Journal | postedAt, journalState, journalLine, postingReference, reversalOf, accountingPeriod |
| JournalLine | ledgerAccount, signedAmount, currency, lineDescription |
| AccountingPeriod | period, periodReference, periodState, closedAt, closingEvidence, financialOwner |

## BR-180 — Late corrections preserve original usage responsibility and use a distinct period that was open at posting time.

- Accountable: Issuer and collector.
- Financial ownership: Creditor.
- Actors: Finance, Driver, PaymentProvider, TaxAuthority.
- Preconditions: A complete authorized business snapshot provides the subject, referenced contracts, effective times and attributable evidence.
- Normal outcome: Late corrections preserve original usage responsibility and use a distinct period that was open at posting time.
- Exception outcome: Reject the specified contradiction with B180 and retain an accountable correction or recovery path.
- Review finding: Cross-domain review identified this invariant or legitimate historical/boundary behavior as insufficiently explicit.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-LATE-CORRECTION-PASS, COMPLETE-LATE-CORRECTION-1, COMPLETE-LATE-CORRECTION-2, COMPLETE-LATE-CORRECTION-3, COMPLETE-LATE-CORRECTION-4, COMPLETE-LATE-CORRECTION-5, COMPLETE-HISTORICAL-POSTING-PERIOD-PASS
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: PeriodAdjustmentShape, AccountingPeriodShape, CommercialResponsibilityShape, CurrencyShape, PrincipalShape, EvidenceDocumentShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| PeriodAdjustment | originalPeriod, postingPeriod, sourceRecord, correctingRecord, commercialResponsibility, effectiveUsageAt, postedAt, adjustmentState, adjustmentAmount, currency, approvedBy, adjustmentEvidence, correction |
| AccountingPeriod | period, periodReference, periodState, closedAt, closingEvidence, financialOwner |
| CommercialResponsibility | serviceAgreement, serviceSupplier, merchantOfRecord, taxLiableParty, payer, collectingParty, beneficiary, responsibilityScope, validFrom, validUntil, responsibilityEvidence |
| Currency | currencyCode, minorUnitDigits |
| Principal | subjectReference, identityProvider, principalKind, principalState, person |
| EvidenceDocument | contentDigest, mediaType, storageReference, capturedAt, retentionPolicy |

## BR-181 — Monetary rounding reproduces the declared signed decimal mode and scale from zero through six places.

- Accountable: Billing supplier.
- Financial ownership: Merchant of record.
- Actors: CPO, eMSP, Finance, Driver, TaxAuthority.
- Preconditions: A complete authorized business snapshot provides the subject, referenced contracts, effective times and attributable evidence.
- Normal outcome: Monetary rounding reproduces the declared signed decimal mode and scale from zero through six places.
- Exception outcome: Reject the specified contradiction with B181 and retain an accountable correction or recovery path.
- Review finding: Cross-domain review identified this invariant or legitimate historical/boundary behavior as insufficiently explicit.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-CONVERSION-AND-ROUNDING-PASS, COMPLETE-CONVERSION-AND-ROUNDING-1, COMPLETE-CONVERSION-AND-ROUNDING-2, COMPLETE-CONVERSION-AND-ROUNDING-3, COMPLETE-CONVERSION-AND-ROUNDING-4, COMPLETE-CONVERSION-AND-ROUNDING-5
- Sources: PY-DECIMAL.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT, JOURNEY-CREDIT-PASS, JOURNEY-CREDIT-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: AmountRoundingShape, RoundingPolicyShape, CurrencyShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| AmountRounding | rawAmount, roundedAmount, roundingPolicy, currency |
| RoundingPolicy | roundingMode, decimalPlaces, roundingStage |
| Currency | currencyCode, minorUnitDigits |

## BR-182 — Currency conversion preserves quote direction, positive rate, calculation time and rounded output evidence.

- Accountable: Contract supplier.
- Financial ownership: Named settlement owner.
- Actors: CPO, eMSP, SiteHost, AssetOwner, RoamingHub, Finance.
- Preconditions: A complete authorized business snapshot provides the subject, referenced contracts, effective times and attributable evidence.
- Normal outcome: Currency conversion preserves quote direction, positive rate, calculation time and rounded output evidence.
- Exception outcome: Reject the specified contradiction with B182 and retain an accountable correction or recovery path.
- Review finding: Cross-domain review identified this invariant or legitimate historical/boundary behavior as insufficiently explicit.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-CONVERSION-AND-ROUNDING-PASS, COMPLETE-CONVERSION-AND-ROUNDING-1, COMPLETE-CONVERSION-AND-ROUNDING-2, COMPLETE-CONVERSION-AND-ROUNDING-3, COMPLETE-CONVERSION-AND-ROUNDING-4, COMPLETE-CONVERSION-AND-ROUNDING-5
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT, JOURNEY-SETTLEMENT-PASS, JOURNEY-SETTLEMENT-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: CurrencyConversionShape, ExchangeRateShape, CurrencyShape, AmountRoundingShape, EvidenceDocumentShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| CurrencyConversion | exchangeRate, sourceCurrency, targetCurrency, sourceAmount, unroundedTargetAmount, targetAmount, amountRounding, convertedAt, conversionEvidence |
| ExchangeRate | baseCurrency, quoteCurrency, conversionRate, quotedAt, rateProvider |
| Currency | currencyCode, minorUnitDigits |
| AmountRounding | rawAmount, roundedAmount, roundingPolicy, currency |
| EvidenceDocument | contentDigest, mediaType, storageReference, capturedAt, retentionPolicy |

## BR-183 — Rating totals sum every rated line in one declared currency.

- Accountable: Billing supplier.
- Financial ownership: Merchant of record.
- Actors: CPO, eMSP, Finance, Driver, TaxAuthority.
- Preconditions: A complete authorized business snapshot provides the subject, referenced contracts, effective times and attributable evidence.
- Normal outcome: Rating totals sum every rated line in one declared currency.
- Exception outcome: Reject the specified contradiction with B183 and retain an accountable correction or recovery path.
- Review finding: Cross-domain review identified this invariant or legitimate historical/boundary behavior as insufficiently explicit.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-CONVERSION-AND-ROUNDING-PASS, COMPLETE-CONVERSION-AND-ROUNDING-1, COMPLETE-CONVERSION-AND-ROUNDING-2, COMPLETE-CONVERSION-AND-ROUNDING-3, COMPLETE-CONVERSION-AND-ROUNDING-4, COMPLETE-CONVERSION-AND-ROUNDING-5
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT, JOURNEY-CREDIT-PASS, JOURNEY-CREDIT-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: RatingCalculationShape, ChargingSessionShape, TariffVersionShape, RatedLineShape, CurrencyShape, EvidenceDocumentShape, TariffResolutionShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| RatingCalculation | session, selectedTariff, ratingVersion, calculatedAt, ratedLine, currency, netAmount, taxAmount, grossAmount, evidence, tariffResolution |
| ChargingSession | chargingUnit, customer, vehicle, authorizationDecision, sessionState, startedAt, endedAt, importedEnergyKWh, exportedEnergyKWh, commercialMode, selectedTariff, endEvidence, reservation, commercialResponsibility, billingReadiness |
| TariffVersion | tariff, versionTag, validFrom, validUntil, currency, tariffMode, priceComponent, pricingCondition, baseTariffVersion, dynamicPriceFormula, priceDisplay, roundingPolicy, snapshotDigest, discountRule, sessionPricingPolicy, preauthorizationPolicy, subsidyRule, baseTariffSelection |
| RatedLine | priceComponent, quantityValue, unitPrice, netAmount, taxAmount, grossAmount, currency, roundingPolicy, taxDetermination, chargingInterval, amountRounding |
| Currency | currencyCode, minorUnitDigits |
| EvidenceDocument | contentDigest, mediaType, storageReference, capturedAt, retentionPolicy |
| TariffResolution | session, tariffSet, selectedTariff, resolvedAt, resolverVersion, decisionExplanation, resolvedBaseTariff |

## BR-184 — A rated line using rounding evidence agrees with its amount, currency and policy.

- Accountable: Billing supplier.
- Financial ownership: Merchant of record.
- Actors: CPO, eMSP, Finance, Driver, TaxAuthority.
- Preconditions: A complete authorized business snapshot provides the subject, referenced contracts, effective times and attributable evidence.
- Normal outcome: A rated line using rounding evidence agrees with its amount, currency and policy.
- Exception outcome: Reject the specified contradiction with B184 and retain an accountable correction or recovery path.
- Review finding: Cross-domain review identified this invariant or legitimate historical/boundary behavior as insufficiently explicit.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-CONVERSION-AND-ROUNDING-PASS, COMPLETE-CONVERSION-AND-ROUNDING-1, COMPLETE-CONVERSION-AND-ROUNDING-2, COMPLETE-CONVERSION-AND-ROUNDING-3, COMPLETE-CONVERSION-AND-ROUNDING-4, COMPLETE-CONVERSION-AND-ROUNDING-5
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT, JOURNEY-CREDIT-PASS, JOURNEY-CREDIT-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: RatedLineShape, PriceComponentShape, CurrencyShape, RoundingPolicyShape, TaxDeterminationShape, ChargingIntervalShape, AmountRoundingShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| RatedLine | priceComponent, quantityValue, unitPrice, netAmount, taxAmount, grossAmount, currency, roundingPolicy, taxDetermination, chargingInterval, amountRounding |
| PriceComponent | priceDimension, unitPrice, unitIri, billingStep, taxRule, minimumQuantity, maximumQuantity, graceQuantity, pricingCondition, feeBounds, priceTier, priceFreezePolicy, graceMode, pricingTimeResolution |
| Currency | currencyCode, minorUnitDigits |
| RoundingPolicy | roundingMode, decimalPlaces, roundingStage |
| TaxDetermination | supplier, customerParty, taxRule, taxBasisAmount, taxAmount, currency, determinationReason, determinedAt, taxableAt |
| ChargingInterval | session, interval, intervalKind, importedEnergyKWh, exportedEnergyKWh, averagePowerKW |
| AmountRounding | rawAmount, roundedAmount, roundingPolicy, currency |

## BR-185 — Tax rule validity is assessed at the taxable supply time, including later corrections.

- Accountable: Billing supplier.
- Financial ownership: Merchant of record.
- Actors: CPO, eMSP, Finance, Driver, TaxAuthority.
- Preconditions: A complete authorized business snapshot provides the subject, referenced contracts, effective times and attributable evidence.
- Normal outcome: Tax rule validity is assessed at the taxable supply time, including later corrections.
- Exception outcome: Reject the specified contradiction with B185 and retain an accountable correction or recovery path.
- Review finding: Cross-domain review identified this invariant or legitimate historical/boundary behavior as insufficiently explicit.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-CONVERSION-AND-ROUNDING-PASS, COMPLETE-CONVERSION-AND-ROUNDING-1, COMPLETE-CONVERSION-AND-ROUNDING-2, COMPLETE-CONVERSION-AND-ROUNDING-3, COMPLETE-CONVERSION-AND-ROUNDING-4, COMPLETE-CONVERSION-AND-ROUNDING-5
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT, JOURNEY-CREDIT-PASS, JOURNEY-CREDIT-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: TaxDeterminationShape, LegalEntityShape, TaxRuleShape, CurrencyShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| TaxDetermination | supplier, customerParty, taxRule, taxBasisAmount, taxAmount, currency, determinationReason, determinedAt, taxableAt |
| LegalEntity | legalName, registeredAddress, registrationNumber, taxIdentifier, contact, financialAccount |
| TaxRule | taxName, jurisdictionCode, taxFraction, validFrom, validUntil, taxCategory, taxIdentifier |
| Currency | currencyCode, minorUnitDigits |

## BR-186 — An offset-bearing price instant and its UTC interpretation identify the same instant.

- Accountable: Billing supplier.
- Financial ownership: Merchant of record.
- Actors: CPO, eMSP, Finance, Driver, TaxAuthority.
- Preconditions: A complete authorized business snapshot provides the subject, referenced contracts, effective times and attributable evidence.
- Normal outcome: An offset-bearing price instant and its UTC interpretation identify the same instant.
- Exception outcome: Reject the specified contradiction with B186 and retain an accountable correction or recovery path.
- Review finding: Cross-domain review identified this invariant or legitimate historical/boundary behavior as insufficiently explicit.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-REPEATED-LOCAL-HOUR-PASS, COMPLETE-REPEATED-LOCAL-HOUR-1, COMPLETE-REPEATED-LOCAL-HOUR-2
- Sources: PY-ZONEINFO.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT, JOURNEY-CREDIT-PASS, JOURNEY-CREDIT-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: PricingTimeResolutionShape, EvidenceDocumentShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| PricingTimeResolution | sourceLocalTime, resolvedUtcTime, timezoneName, repeatedHourPolicy, timeResolutionEvidence |
| EvidenceDocument | contentDigest, mediaType, storageReference, capturedAt, retentionPolicy |

## BR-187 — Posted settlement legs match their batch agreement and currency, balance amounts and name distinct liable and entitled parties.

- Accountable: Contract supplier.
- Financial ownership: Named settlement owner.
- Actors: CPO, eMSP, SiteHost, AssetOwner, RoamingHub, Finance.
- Preconditions: A complete authorized business snapshot provides the subject, referenced contracts, effective times and attributable evidence.
- Normal outcome: Posted settlement legs match their batch agreement and currency, balance amounts and name distinct liable and entitled parties.
- Exception outcome: Reject the specified contradiction with B187 and retain an accountable correction or recovery path.
- Review finding: Cross-domain review identified this invariant or legitimate historical/boundary behavior as insufficiently explicit.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-MULTI-PARTY-LEGS-PASS, COMPLETE-MULTI-PARTY-LEGS-1, COMPLETE-MULTI-PARTY-LEGS-2
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT, JOURNEY-SETTLEMENT-PASS, JOURNEY-SETTLEMENT-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: SettlementLegShape, SettlementBatchShape, ChargeDetailRecordShape, ServiceAgreementShape, LegalEntityShape, CurrencyShape, EvidenceDocumentShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| SettlementLeg | settlementBatch, chargeRecord, serviceAgreement, liableParty, entitledParty, legReference, legState, currency, netAmount, taxAmount, grossAmount, legEvidence |
| SettlementBatch | serviceAgreement, period, currency, settlementItem, netAmount, taxAmount, grossAmount, settlementState, invoice |
| ChargeDetailRecord | session, issuer, recipient, recordOrigin, externalIdentifier, recordVersion, period, importedEnergyKWh, exportedEnergyKWh, currency, netAmount, taxAmount, grossAmount, selectedTariff, correctionOf, receivedAt, artifact, recordKind, originalChargeRecord, billingReadiness, commercialResponsibility |
| ServiceAgreement | supplier, counterparty, agreementReference, agreementVersion, validFrom, validUntil, coveredRecord, revenueShareRule, costAllocationRule, agreementEvidence, autoRenewal, platformFee, agreementState, financialOwner, governingPolicyVersion |
| LegalEntity | legalName, registeredAddress, registrationNumber, taxIdentifier, contact, financialAccount |
| Currency | currencyCode, minorUnitDigits |
| EvidenceDocument | contentDigest, mediaType, storageReference, capturedAt, retentionPolicy |

## BR-188 — A posted economic leg has one reference within its tenant and settlement batch.

- Accountable: Contract supplier.
- Financial ownership: Named settlement owner.
- Actors: CPO, eMSP, SiteHost, AssetOwner, RoamingHub, Finance.
- Preconditions: A complete authorized business snapshot provides the subject, referenced contracts, effective times and attributable evidence.
- Normal outcome: A posted economic leg has one reference within its tenant and settlement batch.
- Exception outcome: Reject the specified contradiction with B188 and retain an accountable correction or recovery path.
- Review finding: Cross-domain review identified this invariant or legitimate historical/boundary behavior as insufficiently explicit.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-MULTI-PARTY-LEGS-PASS, COMPLETE-MULTI-PARTY-LEGS-1, COMPLETE-MULTI-PARTY-LEGS-2
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT, JOURNEY-SETTLEMENT-PASS, JOURNEY-SETTLEMENT-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: SettlementLegShape, SettlementBatchShape, ChargeDetailRecordShape, ServiceAgreementShape, LegalEntityShape, CurrencyShape, EvidenceDocumentShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| SettlementLeg | settlementBatch, chargeRecord, serviceAgreement, liableParty, entitledParty, legReference, legState, currency, netAmount, taxAmount, grossAmount, legEvidence |
| SettlementBatch | serviceAgreement, period, currency, settlementItem, netAmount, taxAmount, grossAmount, settlementState, invoice |
| ChargeDetailRecord | session, issuer, recipient, recordOrigin, externalIdentifier, recordVersion, period, importedEnergyKWh, exportedEnergyKWh, currency, netAmount, taxAmount, grossAmount, selectedTariff, correctionOf, receivedAt, artifact, recordKind, originalChargeRecord, billingReadiness, commercialResponsibility |
| ServiceAgreement | supplier, counterparty, agreementReference, agreementVersion, validFrom, validUntil, coveredRecord, revenueShareRule, costAllocationRule, agreementEvidence, autoRenewal, platformFee, agreementState, financialOwner, governingPolicyVersion |
| LegalEntity | legalName, registeredAddress, registrationNumber, taxIdentifier, contact, financialAccount |
| Currency | currencyCode, minorUnitDigits |
| EvidenceDocument | contentDigest, mediaType, storageReference, capturedAt, retentionPolicy |

## BR-189 — Closing a rights request preserves fulfilment or refusal, identity checks where fulfilled, and a response with completion time.

- Accountable: Data controller.
- Financial ownership: Contractually allocated data liability owner.
- Actors: Driver, Employee, PrivacyController, DataProcessor, Auditor.
- Preconditions: A complete authorized business snapshot provides the subject, referenced contracts, effective times and attributable evidence.
- Normal outcome: Closing a rights request preserves fulfilment or refusal, identity checks where fulfilled, and a response with completion time.
- Exception outcome: Reject the specified contradiction with B189 and retain an accountable correction or recovery path.
- Review finding: Cross-domain review identified this invariant or legitimate historical/boundary behavior as insufficiently explicit.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-CLOSED-RIGHTS-REQUEST-PASS, COMPLETE-CLOSED-RIGHTS-REQUEST-1, COMPLETE-CLOSED-RIGHTS-REQUEST-2
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-PRIVACY-PASS, JOURNEY-PRIVACY-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: DataSubjectRequestShape, CustomerAccountShape, LegalEntityShape, EvidenceDocumentShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| DataSubjectRequest | subjectAccount, requestKind, requestState, receivedAt, responseDueAt, identityVerified, legalBasisAssessment, responsibleController, responseEvidence, refusalReason, completedAt, requestOutcome |
| CustomerAccount | operatorService, accountKind, accountState, person, organization, billingProfile, preferredLanguage, accountClosure |
| LegalEntity | legalName, registeredAddress, registrationNumber, taxIdentifier, contact, financialAccount |
| EvidenceDocument | contentDigest, mediaType, storageReference, capturedAt, retentionPolicy |

## BR-190 — Deletion cannot omit an active hold on an explicitly disposed record.

- Accountable: Data controller.
- Financial ownership: Contractually allocated data liability owner.
- Actors: Driver, Employee, PrivacyController, DataProcessor, Auditor.
- Preconditions: A complete authorized business snapshot provides the subject, referenced contracts, effective times and attributable evidence.
- Normal outcome: Deletion cannot omit an active hold on an explicitly disposed record.
- Exception outcome: Reject the specified contradiction with B190 and retain an accountable correction or recovery path.
- Review finding: Cross-domain review identified this invariant or legitimate historical/boundary behavior as insufficiently explicit.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-CLOSED-RIGHTS-REQUEST-PASS, COMPLETE-CLOSED-RIGHTS-REQUEST-1, COMPLETE-CLOSED-RIGHTS-REQUEST-2
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-PRIVACY-PASS, JOURNEY-PRIVACY-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: DataDispositionShape, CustomerAccountShape, RetentionPolicyShape, EvidenceDocumentShape, LegalHoldShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| DataDisposition | subjectAccount, retentionPolicy, requestedAt, dispositionState, completedAt, dispositionEvidence, legalHold, disposedRecord |
| CustomerAccount | operatorService, accountKind, accountState, person, organization, billingProfile, preferredLanguage, accountClosure |
| RetentionPolicy | retentionPurpose, jurisdictionCode, retentionDays, disposition, legalBasis |
| EvidenceDocument | contentDigest, mediaType, storageReference, capturedAt, retentionPolicy |
| LegalHold | heldRecord, holdingParty, legalBasis, validFrom, reviewAt, holdState, releasedAt, holdEvidence |

## BR-191 — A required business step cannot be skipped.

- Accountable: Named accountable party.
- Financial ownership: Named financial owner.
- Actors: AllActors, Finance, Auditor, PlatformOperator.
- Preconditions: A complete authorized business snapshot provides the subject, referenced contracts, effective times and attributable evidence.
- Normal outcome: A required business step cannot be skipped.
- Exception outcome: Reject the specified contradiction with B191 and retain an accountable correction or recovery path.
- Review finding: Cross-domain review identified this invariant or legitimate historical/boundary behavior as insufficiently explicit.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-ORDERED-ACCOUNTABILITY-PASS, COMPLETE-ORDERED-ACCOUNTABILITY-1, COMPLETE-ORDERED-ACCOUNTABILITY-2
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CLOSURE-PASS, JOURNEY-CLOSURE-REJECT, JOURNEY-PROCESS-PASS, JOURNEY-PROCESS-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ProcessStepShape, LegalEntityShape, ContractObligationShape, EvidenceDocumentShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ProcessStep | stepSequence, stepKind, responsibleParty, stepState, inputRecord, outputRecord, contractObligation, compensationRecord, stepEvidence, previousStep, requiredStep |
| LegalEntity | legalName, registeredAddress, registrationNumber, taxIdentifier, contact, financialAccount |
| ContractObligation | serviceAgreement, obligatedParty, entitledParty, obligationScope, obligationKind, dueAt, obligationState, obligationPolicyVersion, financialOwner |
| EvidenceDocument | contentDigest, mediaType, storageReference, capturedAt, retentionPolicy |

## BR-192 — Predecessors belong to the same process, have lower sequence numbers and finish before a dependent step succeeds.

- Accountable: Named accountable party.
- Financial ownership: Named financial owner.
- Actors: AllActors, Finance, Auditor, PlatformOperator.
- Preconditions: A complete authorized business snapshot provides the subject, referenced contracts, effective times and attributable evidence.
- Normal outcome: Predecessors belong to the same process, have lower sequence numbers and finish before a dependent step succeeds.
- Exception outcome: Reject the specified contradiction with B192 and retain an accountable correction or recovery path.
- Review finding: Cross-domain review identified this invariant or legitimate historical/boundary behavior as insufficiently explicit.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-ORDERED-ACCOUNTABILITY-PASS, COMPLETE-ORDERED-ACCOUNTABILITY-1, COMPLETE-ORDERED-ACCOUNTABILITY-2
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CLOSURE-PASS, JOURNEY-CLOSURE-REJECT, JOURNEY-PROCESS-PASS, JOURNEY-PROCESS-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ProcessStepShape, LegalEntityShape, ContractObligationShape, EvidenceDocumentShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ProcessStep | stepSequence, stepKind, responsibleParty, stepState, inputRecord, outputRecord, contractObligation, compensationRecord, stepEvidence, previousStep, requiredStep |
| LegalEntity | legalName, registeredAddress, registrationNumber, taxIdentifier, contact, financialAccount |
| ContractObligation | serviceAgreement, obligatedParty, entitledParty, obligationScope, obligationKind, dueAt, obligationState, obligationPolicyVersion, financialOwner |
| EvidenceDocument | contentDigest, mediaType, storageReference, capturedAt, retentionPolicy |

## BR-193 — Billing readiness considers actual unresolved blocking issues against the session.

- Accountable: Metering responsible party.
- Financial ownership: Billing supplier.
- Actors: MetrologyProvider, CPO, AssetOwner, Driver.
- Preconditions: A complete authorized business snapshot provides the subject, referenced contracts, effective times and attributable evidence.
- Normal outcome: Billing readiness considers actual unresolved blocking issues against the session.
- Exception outcome: Reject the specified contradiction with B193 and retain an accountable correction or recovery path.
- Review finding: Cross-domain review identified this invariant or legitimate historical/boundary behavior as insufficiently explicit.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-CLOSURE-AND-EVIDENCE-PASS, COMPLETE-CLOSURE-AND-EVIDENCE-1, COMPLETE-CLOSURE-AND-EVIDENCE-2, COMPLETE-CLOSURE-AND-EVIDENCE-3, COMPLETE-CLOSURE-AND-EVIDENCE-4, COMPLETE-CLOSURE-AND-EVIDENCE-5, COMPLETE-CLOSURE-AND-EVIDENCE-6, COMPLETE-CLOSURE-AND-EVIDENCE-7
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: BillingReadinessAssessmentShape, ChargingSessionShape, LegalEntityShape, EvidenceDocumentShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| BillingReadinessAssessment | session, readinessState, usageComplete, priceResolved, taxResolved, authorizationResolved, responsibilityResolved, openBlockingIssueCount, assessedAt, accountableParty, readinessEvidence |
| ChargingSession | chargingUnit, customer, vehicle, authorizationDecision, sessionState, startedAt, endedAt, importedEnergyKWh, exportedEnergyKWh, commercialMode, selectedTariff, endEvidence, reservation, commercialResponsibility, billingReadiness |
| LegalEntity | legalName, registeredAddress, registrationNumber, taxIdentifier, contact, financialAccount |
| EvidenceDocument | contentDigest, mediaType, storageReference, capturedAt, retentionPolicy |

## BR-194 — An entitlement cannot outlive its finite funding agreement.

- Accountable: Service provider.
- Financial ownership: Creditor or designated successor.
- Actors: Driver, FleetManager, Employer, PrivacyController.
- Preconditions: A complete authorized business snapshot provides the subject, referenced contracts, effective times and attributable evidence.
- Normal outcome: An entitlement cannot outlive its finite funding agreement.
- Exception outcome: Reject the specified contradiction with B194 and retain an accountable correction or recovery path.
- Review finding: Cross-domain review identified this invariant or legitimate historical/boundary behavior as insufficiently explicit.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-CLOSURE-AND-EVIDENCE-PASS, COMPLETE-CLOSURE-AND-EVIDENCE-1, COMPLETE-CLOSURE-AND-EVIDENCE-2, COMPLETE-CLOSURE-AND-EVIDENCE-3, COMPLETE-CLOSURE-AND-EVIDENCE-4, COMPLETE-CLOSURE-AND-EVIDENCE-5, COMPLETE-CLOSURE-AND-EVIDENCE-6, COMPLETE-CLOSURE-AND-EVIDENCE-7
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CLOSURE-PASS, JOURNEY-CLOSURE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ServiceEntitlementShape, CustomerAccountShape, ServiceAgreementShape, LegalEntityShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ServiceEntitlement | customer, serviceAgreement, scopeRecord, entitlementState, validFrom, validUntil, accountableParty |
| CustomerAccount | operatorService, accountKind, accountState, person, organization, billingProfile, preferredLanguage, accountClosure |
| ServiceAgreement | supplier, counterparty, agreementReference, agreementVersion, validFrom, validUntil, coveredRecord, revenueShareRule, costAllocationRule, agreementEvidence, autoRenewal, platformFee, agreementState, financialOwner, governingPolicyVersion |
| LegalEntity | legalName, registeredAddress, registrationNumber, taxIdentifier, contact, financialAccount |

## BR-195 — Completed closure agrees with the account state, chronology and actual scoped access grants.

- Accountable: Service provider.
- Financial ownership: Creditor or designated successor.
- Actors: Driver, FleetManager, Employer, PrivacyController.
- Preconditions: A complete authorized business snapshot provides the subject, referenced contracts, effective times and attributable evidence.
- Normal outcome: Completed closure agrees with the account state, chronology and actual scoped access grants.
- Exception outcome: Reject the specified contradiction with B195 and retain an accountable correction or recovery path.
- Review finding: Cross-domain review identified this invariant or legitimate historical/boundary behavior as insufficiently explicit.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-CLOSURE-AND-EVIDENCE-PASS, COMPLETE-CLOSURE-AND-EVIDENCE-1, COMPLETE-CLOSURE-AND-EVIDENCE-2, COMPLETE-CLOSURE-AND-EVIDENCE-3, COMPLETE-CLOSURE-AND-EVIDENCE-4, COMPLETE-CLOSURE-AND-EVIDENCE-5, COMPLETE-CLOSURE-AND-EVIDENCE-6, COMPLETE-CLOSURE-AND-EVIDENCE-7
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CLOSURE-PASS, JOURNEY-CLOSURE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: AccountClosureShape, CustomerAccountShape, CurrencyShape, LegalEntityShape, EvidenceDocumentShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| AccountClosure | customer, closureState, requestedAt, completedAt, openLiabilityAmount, currency, residualLiabilityOwner, revokedGrantCount, activeGrantCount, closureEvidence |
| CustomerAccount | operatorService, accountKind, accountState, person, organization, billingProfile, preferredLanguage, accountClosure |
| Currency | currencyCode, minorUnitDigits |
| LegalEntity | legalName, registeredAddress, registrationNumber, taxIdentifier, contact, financialAccount |
| EvidenceDocument | contentDigest, mediaType, storageReference, capturedAt, retentionPolicy |

## BR-196 — Retirement or replacement cannot hide an unfinished session on the station.

- Accountable: CPO.
- Financial ownership: Asset owner.
- Actors: AssetOwner, Installer, Maintainer, OEM, SiteHost, CPO.
- Preconditions: A complete authorized business snapshot provides the subject, referenced contracts, effective times and attributable evidence.
- Normal outcome: Retirement or replacement cannot hide an unfinished session on the station.
- Exception outcome: Reject the specified contradiction with B196 and retain an accountable correction or recovery path.
- Review finding: Cross-domain review identified this invariant or legitimate historical/boundary behavior as insufficiently explicit.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-CLOSURE-AND-EVIDENCE-PASS, COMPLETE-CLOSURE-AND-EVIDENCE-1, COMPLETE-CLOSURE-AND-EVIDENCE-2, COMPLETE-CLOSURE-AND-EVIDENCE-3, COMPLETE-CLOSURE-AND-EVIDENCE-4, COMPLETE-CLOSURE-AND-EVIDENCE-5, COMPLETE-CLOSURE-AND-EVIDENCE-6, COMPLETE-CLOSURE-AND-EVIDENCE-7
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-ASSET-PASS, JOURNEY-ASSET-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: AssetLifecycleEventShape, ChargingStationShape, LegalEntityShape, EvidenceDocumentShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| AssetLifecycleEvent | station, assetAction, effectiveAt, accountableParty, assetEventEvidence, replacementStation, openSessionCount |
| ChargingStation | operatorService, stationName, equipmentModel, site, area, stationUse, communicationMode, gatewayStation, protocolEndpoint, ownerAccount, assetOwner, administrationState, monitoringEnabled, recoveryEnabled, electricitySchedule, reimbursementPolicy, maintenanceProvider, commissionedAt, manufacturedAt, sharingSecretReference, nationalStationIdentifier, powerCabinet, chargingProfile, assetLifecycle, operationalAcceptance |
| LegalEntity | legalName, registeredAddress, registrationNumber, taxIdentifier, contact, financialAccount |
| EvidenceDocument | contentDigest, mediaType, storageReference, capturedAt, retentionPolicy |

## BR-197 — An ownership transfer identifies different previous and succeeding owners.

- Accountable: CPO.
- Financial ownership: Asset owner.
- Actors: AssetOwner, Installer, Maintainer, OEM, SiteHost, CPO.
- Preconditions: A complete authorized business snapshot provides the subject, referenced contracts, effective times and attributable evidence.
- Normal outcome: An ownership transfer identifies different previous and succeeding owners.
- Exception outcome: Reject the specified contradiction with B197 and retain an accountable correction or recovery path.
- Review finding: Cross-domain review identified this invariant or legitimate historical/boundary behavior as insufficiently explicit.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-CLOSURE-AND-EVIDENCE-PASS, COMPLETE-CLOSURE-AND-EVIDENCE-1, COMPLETE-CLOSURE-AND-EVIDENCE-2, COMPLETE-CLOSURE-AND-EVIDENCE-3, COMPLETE-CLOSURE-AND-EVIDENCE-4, COMPLETE-CLOSURE-AND-EVIDENCE-5, COMPLETE-CLOSURE-AND-EVIDENCE-6, COMPLETE-CLOSURE-AND-EVIDENCE-7
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-ASSET-PASS, JOURNEY-ASSET-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: OwnershipTransferShape, ChargingStationShape, EvidenceDocumentShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| OwnershipTransfer | transferredAsset, previousOwner, nextOwner, effectiveAt, transferEvidence |
| ChargingStation | operatorService, stationName, equipmentModel, site, area, stationUse, communicationMode, gatewayStation, protocolEndpoint, ownerAccount, assetOwner, administrationState, monitoringEnabled, recoveryEnabled, electricitySchedule, reimbursementPolicy, maintenanceProvider, commissionedAt, manufacturedAt, sharingSecretReference, nationalStationIdentifier, powerCabinet, chargingProfile, assetLifecycle, operationalAcceptance |
| EvidenceDocument | contentDigest, mediaType, storageReference, capturedAt, retentionPolicy |

## BR-198 — Applied and duplicate outcomes retain processing time no earlier than receipt.

- Accountable: CPO.
- Financial ownership: Commercial service supplier.
- Actors: Driver, CPO, PlatformOperator, OEM.
- Preconditions: A complete authorized business snapshot provides the subject, referenced contracts, effective times and attributable evidence.
- Normal outcome: Applied and duplicate outcomes retain processing time no earlier than receipt.
- Exception outcome: Reject the specified contradiction with B198 and retain an accountable correction or recovery path.
- Review finding: Cross-domain review identified this invariant or legitimate historical/boundary behavior as insufficiently explicit.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-CLOSURE-AND-EVIDENCE-PASS, COMPLETE-CLOSURE-AND-EVIDENCE-1, COMPLETE-CLOSURE-AND-EVIDENCE-2, COMPLETE-CLOSURE-AND-EVIDENCE-3, COMPLETE-CLOSURE-AND-EVIDENCE-4, COMPLETE-CLOSURE-AND-EVIDENCE-5, COMPLETE-CLOSURE-AND-EVIDENCE-6, COMPLETE-CLOSURE-AND-EVIDENCE-7
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT, JOURNEY-OFFLINE-PASS, JOURNEY-OFFLINE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: EventProcessingOutcomeShape, SourceEventShape, LegalEntityShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| EventProcessingOutcome | sourceEvent, processingContextKey, idempotencyKey, processingState, payloadDigest, businessEffect, duplicateOf, processedAt, accountableParty, quarantineReason |
| SourceEvent | eventKey, sourceSystem, occurredAt, receivedAt, schemaVersion, payloadEvidence, sequenceNumber, correlationId, clockAssessment |
| LegalEntity | legalName, registeredAddress, registrationNumber, taxIdentifier, contact, financialAccount |

## BR-199 — The disclosed price currency and optional display tariff agree with the commercial offer.

- Accountable: Selling operator.
- Financial ownership: Merchant of record.
- Actors: Driver, CPO, eMSP, PaymentProvider, AccessibilityUser.
- Preconditions: A complete authorized business snapshot provides the subject, referenced contracts, effective times and attributable evidence.
- Normal outcome: The disclosed price currency and optional display tariff agree with the commercial offer.
- Exception outcome: Reject the specified contradiction with B199 and retain an accountable correction or recovery path.
- Review finding: Cross-domain review identified this invariant or legitimate historical/boundary behavior as insufficiently explicit.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-CLOSURE-AND-EVIDENCE-PASS, COMPLETE-CLOSURE-AND-EVIDENCE-1, COMPLETE-CLOSURE-AND-EVIDENCE-2, COMPLETE-CLOSURE-AND-EVIDENCE-3, COMPLETE-CLOSURE-AND-EVIDENCE-4, COMPLETE-CLOSURE-AND-EVIDENCE-5, COMPLETE-CLOSURE-AND-EVIDENCE-6, COMPLETE-CLOSURE-AND-EVIDENCE-7
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: CommercialOfferShape, LegalEntityShape, CustomerAccountShape, TariffVersionShape, PriceDisplayShape, CurrencyShape, EvidenceDocumentShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| CommercialOffer | offeredBy, offeredTo, selectedTariff, priceDisplay, issuedAt, expiresAt, currency, offerMode, registrationRequired, offerEvidence |
| LegalEntity | legalName, registeredAddress, registrationNumber, taxIdentifier, contact, financialAccount |
| CustomerAccount | operatorService, accountKind, accountState, person, organization, billingProfile, preferredLanguage, accountClosure |
| TariffVersion | tariff, versionTag, validFrom, validUntil, currency, tariffMode, priceComponent, pricingCondition, baseTariffVersion, dynamicPriceFormula, priceDisplay, roundingPolicy, snapshotDigest, discountRule, sessionPricingPolicy, preauthorizationPolicy, subsidyRule, baseTariffSelection |
| PriceDisplay | displayText, displayCurrency, includesTax, disclosureChannel, effectiveAt, selectedTariff |
| Currency | currencyCode, minorUnitDigits |
| EvidenceDocument | contentDigest, mediaType, storageReference, capturedAt, retentionPolicy |

## BR-200 — Refunds have positive amounts and confirmation requires an originally confirmed capture.

- Accountable: Issuer and collector.
- Financial ownership: Creditor.
- Actors: Finance, Driver, PaymentProvider, TaxAuthority.
- Preconditions: A complete authorized business snapshot provides the subject, referenced contracts, effective times and attributable evidence.
- Normal outcome: Refunds have positive amounts and confirmation requires an originally confirmed capture.
- Exception outcome: Reject the specified contradiction with B200 and retain an accountable correction or recovery path.
- Review finding: Cross-domain review identified this invariant or legitimate historical/boundary behavior as insufficiently explicit.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-PASS, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-1, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-2, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-3, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-4, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-5, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-6, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-7, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-8
- Sources: PSP-REFUND.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: RefundShape, PaymentCaptureShape, CurrencyShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| Refund | paymentCapture, refundAmount, currency, refundReason, refundState, requestedAt, providerReference |
| PaymentCapture | paymentIntent, paymentAuthorization, capturedAmount, currency, capturedAt, captureState, providerReference, idempotencyKey, paymentAllocation |
| Currency | currencyCode, minorUnitDigits |

## BR-201 — A chargeback disputes a positive amount no greater than its confirmed capture in the same currency.

- Accountable: Accountable service provider.
- Financial ownership: Named financial owner.
- Actors: Driver, Partner, SupportAgent, Finance, PaymentProvider.
- Preconditions: A complete authorized business snapshot provides the subject, referenced contracts, effective times and attributable evidence.
- Normal outcome: A chargeback disputes a positive amount no greater than its confirmed capture in the same currency.
- Exception outcome: Reject the specified contradiction with B201 and retain an accountable correction or recovery path.
- Review finding: Cross-domain review identified this invariant or legitimate historical/boundary behavior as insufficiently explicit.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-PASS, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-1, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-2, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-3, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-4, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-5, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-6, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-7, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-8
- Sources: PSP-DISPUTE.
- Associated full-graph journey snapshots: JOURNEY-CREDIT-PASS, JOURNEY-CREDIT-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ChargebackShape, PaymentCaptureShape, CurrencyShape, EvidenceDocumentShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| Chargeback | paymentCapture, disputedAmount, currency, reasonCode, responseDueAt, disputeState, evidence |
| PaymentCapture | paymentIntent, paymentAuthorization, capturedAmount, currency, capturedAt, captureState, providerReference, idempotencyKey, paymentAllocation |
| Currency | currencyCode, minorUnitDigits |
| EvidenceDocument | contentDigest, mediaType, storageReference, capturedAt, retentionPolicy |

## BR-202 — A confirmed payout is positive, pays the account holder and retains a confirmation no earlier than scheduling.

- Accountable: Employer.
- Financial ownership: Employer or mandated payer.
- Actors: Employer, Employee, FleetManager, PaymentProvider, Finance.
- Preconditions: A complete authorized business snapshot provides the subject, referenced contracts, effective times and attributable evidence.
- Normal outcome: A confirmed payout is positive, pays the account holder and retains a confirmation no earlier than scheduling.
- Exception outcome: Reject the specified contradiction with B202 and retain an accountable correction or recovery path.
- Review finding: Cross-domain review identified this invariant or legitimate historical/boundary behavior as insufficiently explicit.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-PASS, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-1, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-2, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-3, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-4, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-5, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-6, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-7, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-8
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-REIMBURSEMENT-PASS, JOURNEY-REIMBURSEMENT-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: PayoutShape, LegalEntityShape, FinancialAccountReferenceShape, CurrencyShape, SettlementBatchShape, ReimbursementRecordShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| Payout | beneficiary, financialAccount, currency, payoutAmount, payoutState, payoutReference, scheduledAt, confirmedAt, settlementBatch, reimbursementRecord |
| LegalEntity | legalName, registeredAddress, registrationNumber, taxIdentifier, contact, financialAccount |
| FinancialAccountReference | accountHolder, accountReference, accountScheme, maskedAccount, bankCountryCode, bankIdentifierCode |
| Currency | currencyCode, minorUnitDigits |
| SettlementBatch | serviceAgreement, period, currency, settlementItem, netAmount, taxAmount, grossAmount, settlementState, invoice |
| ReimbursementRecord | session, reimbursementPolicy, beneficiaryAccount, currency, reimbursableEnergyKWh, reimbursementRate, reimbursementAmount, reimbursementState, calculatedAt, correctionOf, reimbursementTaxCalculation, payout, reimbursementApproval |

## BR-203 — Flexibility delivery records signed actual-minus-baseline energy; reduction is negative.

- Accountable: Site energy responsible party.
- Financial ownership: Import payer or export beneficiary.
- Actors: GridOperator, EnergySupplier, Aggregator, SiteHost, Driver, FleetManager.
- Preconditions: A complete authorized business snapshot provides the subject, referenced contracts, effective times and attributable evidence.
- Normal outcome: Flexibility delivery records signed actual-minus-baseline energy; reduction is negative.
- Exception outcome: Reject the specified contradiction with B203 and retain an accountable correction or recovery path.
- Review finding: Cross-domain review identified this invariant or legitimate historical/boundary behavior as insufficiently explicit.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-PASS, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-1, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-2, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-3, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-4, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-5, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-6, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-7, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-8
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-ENERGY-PASS, JOURNEY-ENERGY-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: FlexibilityDeliveryShape, FlexibilityActivationShape, EvidenceDocumentShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| FlexibilityDelivery | flexibilityActivation, actualEnergyKWh, baselineEnergyKWh, deliveredAdjustmentKWh, verifiedAt, evidence |
| FlexibilityActivation | flexibilityAsset, interval, requestedPowerKW, activationState, baseline, requestedAt |
| EvidenceDocument | contentDigest, mediaType, storageReference, capturedAt, retentionPolicy |

## BR-204 — Simultaneous module allocations cannot exceed shared cabinet capacity; touching half-open intervals do not overlap.

- Accountable: Site energy responsible party.
- Financial ownership: Import payer or export beneficiary.
- Actors: GridOperator, EnergySupplier, Aggregator, SiteHost, Driver, FleetManager.
- Preconditions: A complete authorized business snapshot provides the subject, referenced contracts, effective times and attributable evidence.
- Normal outcome: Simultaneous module allocations cannot exceed shared cabinet capacity; touching half-open intervals do not overlap.
- Exception outcome: Reject the specified contradiction with B204 and retain an accountable correction or recovery path.
- Review finding: Cross-domain review identified this invariant or legitimate historical/boundary behavior as insufficiently explicit.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-PASS, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-1, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-2, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-3, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-4, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-5, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-6, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-7, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-8
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-ENERGY-PASS, JOURNEY-ENERGY-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: PowerCabinetShape, ChargingSiteShape, ChargingUnitShape, PowerModuleAllocationShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| PowerCabinet | site, totalCabinetPowerKW, moduleSizeKW, sharingMode, servedUnit |
| ChargingSite | siteName, address, position, timezoneName, siteHost, openingWindow, serviceNotice, siteAccessPolicy |
| ChargingUnit | station, physicalReference, currentKind, maximumPowerKW, minimumCurrentA, maximumCurrentA, tariffSet, reservable, bookable, calibration, electricalConnection |
| PowerModuleAllocation | powerCabinet, chargingUnit, allocatedModules, allocatedPowerKW, interval |

## BR-205 — Closed service-level breaches retain evidence of the accepted resolution.

- Accountable: Maintenance/service provider.
- Financial ownership: SLA remedy owner.
- Actors: Maintainer, Installer, CPO, SupportAgent, PlatformOperator, AssetOwner.
- Preconditions: A complete authorized business snapshot provides the subject, referenced contracts, effective times and attributable evidence.
- Normal outcome: Closed service-level breaches retain evidence of the accepted resolution.
- Exception outcome: Reject the specified contradiction with B205 and retain an accountable correction or recovery path.
- Review finding: Cross-domain review identified this invariant or legitimate historical/boundary behavior as insufficiently explicit.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-PASS, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-1, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-2, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-3, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-4, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-5, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-6, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-7, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-8
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-MIGRATION-PASS, JOURNEY-MIGRATION-REJECT, JOURNEY-ASSET-PASS, JOURNEY-ASSET-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ServiceLevelBreachShape, ServiceLevelCommitmentShape, AvailabilityResultShape, WorkOrderShape, EvidenceDocumentShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ServiceLevelBreach | serviceLevelCommitment, availabilityResult, breachState, detectedAt, workOrder, remedyRecord, breachEvidence, closureEvidence |
| ServiceLevelCommitment | serviceAgreement, scopeRecord, availabilityPolicy, targetFraction, measurementWindow, accountableParty, exclusionPolicyVersion |
| AvailabilityResult | observedAsset, interval, availabilityPolicy, eligibleSeconds, unavailableSeconds, availabilityFraction, calculatedAt |
| WorkOrder | maintenanceProvider, affectedRecord, issue, assignedPrincipal, workState, dueAt, completedAt, completionEvidence |
| EvidenceDocument | contentDigest, mediaType, storageReference, capturedAt, retentionPolicy |

## BR-206 — A synchronization watermark cannot be later than its successful synchronization time.

- Accountable: Platform operator.
- Financial ownership: Contract residual owner.
- Actors: CPO, eMSP, RoamingHub, OEM, PlatformOperator, DataProcessor.
- Preconditions: A complete authorized business snapshot provides the subject, referenced contracts, effective times and attributable evidence.
- Normal outcome: A synchronization watermark cannot be later than its successful synchronization time.
- Exception outcome: Reject the specified contradiction with B206 and retain an accountable correction or recovery path.
- Review finding: Cross-domain review identified this invariant or legitimate historical/boundary behavior as insufficiently explicit.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-PASS, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-1, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-2, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-3, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-4, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-5, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-6, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-7, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-8
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-MIGRATION-PASS, JOURNEY-MIGRATION-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: SynchronizationCursorShape, RoamingConnectionShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| SynchronizationCursor | roamingConnection, streamModuleName, cursorValue, lastSuccessfulAt, watermarkAt |
| RoamingConnection | localService, remoteParty, roamingNetwork, serviceAgreement, protocolName, protocolVersion, endpointUrl, credentialReference, connectionState, moduleAgreement, roamingBehaviorPolicy |

## BR-207 — Commercial responsibility is bounded by its agreement while remaining usable for historical usage.

- Accountable: Contract supplier.
- Financial ownership: Contract financial owner.
- Actors: CPO, eMSP, SiteHost, AssetOwner, Finance.
- Preconditions: A complete authorized business snapshot provides the subject, referenced contracts, effective times and attributable evidence.
- Normal outcome: Commercial responsibility is bounded by its agreement while remaining usable for historical usage.
- Exception outcome: Reject the specified contradiction with B207 and retain an accountable correction or recovery path.
- Review finding: Cross-domain review identified this invariant or legitimate historical/boundary behavior as insufficiently explicit.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-LATE-CORRECTION-PASS, COMPLETE-LATE-CORRECTION-1, COMPLETE-LATE-CORRECTION-2, COMPLETE-LATE-CORRECTION-3, COMPLETE-LATE-CORRECTION-4, COMPLETE-LATE-CORRECTION-5
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CLOSURE-PASS, JOURNEY-CLOSURE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: CommercialResponsibilityShape, ServiceAgreementShape, LegalEntityShape, EvidenceDocumentShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| CommercialResponsibility | serviceAgreement, serviceSupplier, merchantOfRecord, taxLiableParty, payer, collectingParty, beneficiary, responsibilityScope, validFrom, validUntil, responsibilityEvidence |
| ServiceAgreement | supplier, counterparty, agreementReference, agreementVersion, validFrom, validUntil, coveredRecord, revenueShareRule, costAllocationRule, agreementEvidence, autoRenewal, platformFee, agreementState, financialOwner, governingPolicyVersion |
| LegalEntity | legalName, registeredAddress, registrationNumber, taxIdentifier, contact, financialAccount |
| EvidenceDocument | contentDigest, mediaType, storageReference, capturedAt, retentionPolicy |

## BR-208 — Accepted session authorization precedes start and has not expired at start.

- Accountable: CPO or delegated eMSP.
- Financial ownership: Offline exposure owner.
- Actors: Driver, CPO, eMSP, FleetManager, OEM.
- Preconditions: A complete authorized business snapshot provides the subject, referenced contracts, effective times and attributable evidence.
- Normal outcome: Accepted session authorization precedes start and has not expired at start.
- Exception outcome: Reject the specified contradiction with B208 and retain an accountable correction or recovery path.
- Review finding: Cross-domain review identified this invariant or legitimate historical/boundary behavior as insufficiently explicit.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-PASS, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-1, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-2, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-3, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-4, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-5, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-6, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-7, COMPLETE-FINANCIAL-AND-ENERGY-BOUNDARIES-8
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-OFFLINE-PASS, JOURNEY-OFFLINE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: ChargingSessionShape, ChargingUnitShape, CustomerAccountShape, VehicleShape, AuthorizationDecisionShape, TariffVersionShape, SessionEndEvidenceShape, ReservationShape, CommercialResponsibilityShape, BillingReadinessAssessmentShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| ChargingSession | chargingUnit, customer, vehicle, authorizationDecision, sessionState, startedAt, endedAt, importedEnergyKWh, exportedEnergyKWh, commercialMode, selectedTariff, endEvidence, reservation, commercialResponsibility, billingReadiness |
| ChargingUnit | station, physicalReference, currentKind, maximumPowerKW, minimumCurrentA, maximumCurrentA, tariffSet, reservable, bookable, calibration, electricalConnection |
| CustomerAccount | operatorService, accountKind, accountState, person, organization, billingProfile, preferredLanguage, accountClosure |
| Vehicle | vehicleReference, vehicleCategory, batteryCapacityKWh, maximumChargePowerKW, vehicleIdentificationReference, telematicsIntegration |
| AuthorizationDecision | authorizationRequest, decision, reasonCode, decidedAt, decisionSource, appliedPolicy, expiresAt |
| TariffVersion | tariff, versionTag, validFrom, validUntil, currency, tariffMode, priceComponent, pricingCondition, baseTariffVersion, dynamicPriceFormula, priceDisplay, roundingPolicy, snapshotDigest, discountRule, sessionPricingPolicy, preauthorizationPolicy, subsidyRule, baseTariffSelection |
| SessionEndEvidence | session, finalizationBasis, finalizedAt, completeness, sourceEvent, finalMeterObservation |
| Reservation | chargingUnit, customer, reservedAt, expiresAt, reservationState, booking, session |
| CommercialResponsibility | serviceAgreement, serviceSupplier, merchantOfRecord, taxLiableParty, payer, collectingParty, beneficiary, responsibilityScope, validFrom, validUntil, responsibilityEvidence |
| BillingReadinessAssessment | session, readinessState, usageComplete, priceResolved, taxResolved, authorizationResolved, responsibilityResolved, openBlockingIssueCount, assessedAt, accountableParty, readinessEvidence |

## BR-209 — Payment state agrees with confirmed capture totals, including partial and fully refunded outcomes.

- Accountable: Issuer and collector.
- Financial ownership: Creditor.
- Actors: Finance, Driver, PaymentProvider, TaxAuthority.
- Preconditions: Complete evidence of the obligation, financial effects and lifecycle state is available.
- Normal outcome: Payment state agrees with confirmed capture totals, including partial and fully refunded outcomes.
- Exception outcome: Reject the contradictory financial or lifecycle state with B209.
- Review finding: The integration review identified a stated outcome that could contradict its underlying records.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-PASS, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-1, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-2, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-3, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-4, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-5, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-6, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-7
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: PaymentIntentShape, CustomerAccountShape, ChargingSessionShape, InvoiceShape, PaymentInstrumentShape, CurrencyShape, PaymentRoutingShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| PaymentIntent | customer, session, invoice, paymentInstrument, currency, requestedAmount, paymentState, idempotencyKey, providerOrderReference, paymentRouting |
| CustomerAccount | operatorService, accountKind, accountState, person, organization, billingProfile, preferredLanguage, accountClosure |
| ChargingSession | chargingUnit, customer, vehicle, authorizationDecision, sessionState, startedAt, endedAt, importedEnergyKWh, exportedEnergyKWh, commercialMode, selectedTariff, endEvidence, reservation, commercialResponsibility, billingReadiness |
| Invoice | issuer, billingProfile, invoiceNumber, issuedAt, dueAt, invoiceState, currency, invoiceLine, netAmount, taxAmount, grossAmount, numberSequence, financialOwner, commercialResponsibility |
| PaymentInstrument | customer, instrumentKind, provider, providerInstrumentReference, instrumentState, expiryMonth |
| Currency | currencyCode, minorUnitDigits |
| PaymentRouting | integrationConnection, merchantAccountReference, routePriority, pricingCondition |

## BR-210 — Confirmed capture records represent a positive collected amount.

- Accountable: Issuer and collector.
- Financial ownership: Creditor.
- Actors: Finance, Driver, PaymentProvider, TaxAuthority.
- Preconditions: Complete evidence of the obligation, financial effects and lifecycle state is available.
- Normal outcome: Confirmed capture records represent a positive collected amount.
- Exception outcome: Reject the contradictory financial or lifecycle state with B210.
- Review finding: The integration review identified a stated outcome that could contradict its underlying records.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-PASS, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-1, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-2, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-3, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-4, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-5, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-6, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-7
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: PaymentCaptureShape, PaymentIntentShape, PaymentAuthorizationShape, CurrencyShape, PaymentAllocationShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| PaymentCapture | paymentIntent, paymentAuthorization, capturedAmount, currency, capturedAt, captureState, providerReference, idempotencyKey, paymentAllocation |
| PaymentIntent | customer, session, invoice, paymentInstrument, currency, requestedAmount, paymentState, idempotencyKey, providerOrderReference, paymentRouting |
| PaymentAuthorization | paymentIntent, authorizedAmount, currency, authorizedAt, expiresAt, providerReference, authorizationState |
| Currency | currencyCode, minorUnitDigits |
| PaymentAllocation | paymentCapture, financialPosition, allocatedAmount, currency, allocationState, allocatedAt, allocationEvidence |

## BR-211 — Refund requests do not precede the original capture.

- Accountable: Issuer and collector.
- Financial ownership: Creditor.
- Actors: Finance, Driver, PaymentProvider, TaxAuthority.
- Preconditions: Complete evidence of the obligation, financial effects and lifecycle state is available.
- Normal outcome: Refund requests do not precede the original capture.
- Exception outcome: Reject the contradictory financial or lifecycle state with B211.
- Review finding: The integration review identified a stated outcome that could contradict its underlying records.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-PASS, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-1, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-2, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-3, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-4, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-5, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-6, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-7
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: RefundShape, PaymentCaptureShape, CurrencyShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| Refund | paymentCapture, refundAmount, currency, refundReason, refundState, requestedAt, providerReference |
| PaymentCapture | paymentIntent, paymentAuthorization, capturedAmount, currency, capturedAt, captureState, providerReference, idempotencyKey, paymentAllocation |
| Currency | currencyCode, minorUnitDigits |

## BR-212 — Paid invoice status is backed by a settled same-currency position with collections and credits covering its gross amount.

- Accountable: Issuer and collector.
- Financial ownership: Creditor.
- Actors: Finance, Driver, PaymentProvider, TaxAuthority.
- Preconditions: Complete evidence of the obligation, financial effects and lifecycle state is available.
- Normal outcome: Paid invoice status is backed by a settled same-currency position with collections and credits covering its gross amount.
- Exception outcome: Reject the contradictory financial or lifecycle state with B212.
- Review finding: The integration review identified a stated outcome that could contradict its underlying records.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-PASS, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-1, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-2, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-3, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-4, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-5, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-6, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-7
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: InvoiceShape, LegalEntityShape, BillingProfileShape, CurrencyShape, InvoiceLineShape, DocumentNumberSequenceShape, CommercialResponsibilityShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| Invoice | issuer, billingProfile, invoiceNumber, issuedAt, dueAt, invoiceState, currency, invoiceLine, netAmount, taxAmount, grossAmount, numberSequence, financialOwner, commercialResponsibility |
| LegalEntity | legalName, registeredAddress, registrationNumber, taxIdentifier, contact, financialAccount |
| BillingProfile | billToName, billToAddress, taxIdentifier, receiptEmail, billingParty |
| Currency | currencyCode, minorUnitDigits |
| InvoiceLine | lineDescription, quantityValue, unitPrice, netAmount, taxAmount, grossAmount, currency, ratedLine, chargeRecord, serviceAgreement |
| DocumentNumberSequence | issuer, documentKind, numberPrefix, nextSequence, numberWidth |
| CommercialResponsibility | serviceAgreement, serviceSupplier, merchantOfRecord, taxLiableParty, payer, collectingParty, beneficiary, responsibilityScope, validFrom, validUntil, responsibilityEvidence |

## BR-213 — An invoice-specific collection cannot be allocated to a different source obligation.

- Accountable: Issuer and collector.
- Financial ownership: Creditor.
- Actors: Finance, Driver, PaymentProvider, TaxAuthority.
- Preconditions: Complete evidence of the obligation, financial effects and lifecycle state is available.
- Normal outcome: An invoice-specific collection cannot be allocated to a different source obligation.
- Exception outcome: Reject the contradictory financial or lifecycle state with B213.
- Review finding: The integration review identified a stated outcome that could contradict its underlying records.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-PASS, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-1, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-2, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-3, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-4, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-5, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-6, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-7
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: PaymentAllocationShape, PaymentCaptureShape, FinancialPositionShape, CurrencyShape, EvidenceDocumentShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| PaymentAllocation | paymentCapture, financialPosition, allocatedAmount, currency, allocationState, allocatedAt, allocationEvidence |
| PaymentCapture | paymentIntent, paymentAuthorization, capturedAmount, currency, capturedAt, captureState, providerReference, idempotencyKey, paymentAllocation |
| FinancialPosition | financialOwner, debtor, creditor, currency, originalAmount, creditedAmount, collectedAmount, writtenOffAmount, outstandingAmount, positionState, sourceRecord, collectionBasis, collectionEvidence, writeOffEvidence |
| Currency | currencyCode, minorUnitDigits |
| EvidenceDocument | contentDigest, mediaType, storageReference, capturedAt, retentionPolicy |

## BR-214 — An invoice credit is a positive reduction; negative credits cannot offset cumulative credit limits.

- Accountable: Issuer and collector.
- Financial ownership: Creditor.
- Actors: Finance, Driver, PaymentProvider, TaxAuthority.
- Preconditions: Complete evidence of the obligation, financial effects and lifecycle state is available.
- Normal outcome: An invoice credit is a positive reduction; negative credits cannot offset cumulative credit limits.
- Exception outcome: Reject the contradictory financial or lifecycle state with B214.
- Review finding: The integration review identified a stated outcome that could contradict its underlying records.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-PASS, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-1, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-2, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-3, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-4, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-5, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-6, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-7
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: CreditNoteShape, InvoiceShape, CurrencyShape, LegalEntityShape, EvidenceDocumentShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| CreditNote | originalInvoice, creditNumber, issuedAt, creditReason, currency, creditAmount, issuer, artifact |
| Invoice | issuer, billingProfile, invoiceNumber, issuedAt, dueAt, invoiceState, currency, invoiceLine, netAmount, taxAmount, grossAmount, numberSequence, financialOwner, commercialResponsibility |
| Currency | currencyCode, minorUnitDigits |
| LegalEntity | legalName, registeredAddress, registrationNumber, taxIdentifier, contact, financialAccount |
| EvidenceDocument | contentDigest, mediaType, storageReference, capturedAt, retentionPolicy |

## BR-215 — Posted allocations cannot retain money already returned by confirmed refunds.

- Accountable: Issuer and collector.
- Financial ownership: Creditor.
- Actors: Finance, Driver, PaymentProvider, TaxAuthority.
- Preconditions: Complete evidence of the obligation, financial effects and lifecycle state is available.
- Normal outcome: Posted allocations cannot retain money already returned by confirmed refunds.
- Exception outcome: Reject the contradictory financial or lifecycle state with B215.
- Review finding: The integration review identified a stated outcome that could contradict its underlying records.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-PASS, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-1, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-2, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-3, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-4, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-5, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-6, COMPLETE-PARTIAL-REFUND-AND-PAID-INVOICE-7
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: PaymentCaptureShape, PaymentIntentShape, PaymentAuthorizationShape, CurrencyShape, PaymentAllocationShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| PaymentCapture | paymentIntent, paymentAuthorization, capturedAmount, currency, capturedAt, captureState, providerReference, idempotencyKey, paymentAllocation |
| PaymentIntent | customer, session, invoice, paymentInstrument, currency, requestedAmount, paymentState, idempotencyKey, providerOrderReference, paymentRouting |
| PaymentAuthorization | paymentIntent, authorizedAmount, currency, authorizedAt, expiresAt, providerReference, authorizationState |
| Currency | currencyCode, minorUnitDigits |
| PaymentAllocation | paymentCapture, financialPosition, allocatedAmount, currency, allocationState, allocatedAt, allocationEvidence |

## BR-216 — Cancelled subscriptions retain cancellation evidence time and disable renewal; ended periods have positive duration.

- Accountable: Service provider.
- Financial ownership: Benefit funder.
- Actors: Driver, FleetManager, Employer, Sponsor, Finance.
- Preconditions: Complete evidence of the obligation, financial effects and lifecycle state is available.
- Normal outcome: Cancelled subscriptions retain cancellation evidence time and disable renewal; ended periods have positive duration.
- Exception outcome: Reject the contradictory financial or lifecycle state with B216.
- Review finding: The integration review identified a stated outcome that could contradict its underlying records.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-SUBSCRIPTION-EXIT-PASS, COMPLETE-SUBSCRIPTION-EXIT-1, COMPLETE-SUBSCRIPTION-EXIT-2
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-REIMBURSEMENT-PASS, JOURNEY-REIMBURSEMENT-REJECT, JOURNEY-ALLOWANCE-PASS, JOURNEY-ALLOWANCE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: SubscriptionShape, CustomerAccountShape, SubscriptionPlanShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| Subscription | customer, subscriptionPlan, subscriptionState, startsAt, endsAt, renewAutomatically, cancelledAt |
| CustomerAccount | operatorService, accountKind, accountState, person, organization, billingProfile, preferredLanguage, accountClosure |
| SubscriptionPlan | planName, planVersion, billingMode, billingCycle, currency, baseFee, perHomeStationFee, freeInitialPeriods, benefit, visibilityPolicy, externalBilling, subscriptionBillingPolicy |

## BR-217 — A billed subscription period retains a non-draft, non-void invoice in its currency.

- Accountable: Service provider.
- Financial ownership: Benefit funder.
- Actors: Driver, FleetManager, Employer, Sponsor, Finance.
- Preconditions: Complete evidence of the obligation, financial effects and lifecycle state is available.
- Normal outcome: A billed subscription period retains a non-draft, non-void invoice in its currency.
- Exception outcome: Reject the contradictory financial or lifecycle state with B217.
- Review finding: The integration review identified a stated outcome that could contradict its underlying records.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-SUBSCRIPTION-EXIT-PASS, COMPLETE-SUBSCRIPTION-EXIT-1, COMPLETE-SUBSCRIPTION-EXIT-2
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-REIMBURSEMENT-PASS, JOURNEY-REIMBURSEMENT-REJECT, JOURNEY-ALLOWANCE-PASS, JOURNEY-ALLOWANCE-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: BillingPeriodShape, SubscriptionShape, TimeWindowShape, InvoiceShape, CurrencyShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| BillingPeriod | subscription, period, billingPeriodState, invoice, accruedAmount, currency |
| Subscription | customer, subscriptionPlan, subscriptionState, startsAt, endsAt, renewAutomatically, cancelledAt |
| TimeWindow | startsAt, endsAt |
| Invoice | issuer, billingProfile, invoiceNumber, issuedAt, dueAt, invoiceState, currency, invoiceLine, netAmount, taxAmount, grossAmount, numberSequence, financialOwner, commercialResponsibility |
| Currency | currencyCode, minorUnitDigits |

## BR-218 — Settlement approval cannot conceal unresolved reconciliation cases directly against the batch or its items.

- Accountable: Contract supplier.
- Financial ownership: Named settlement owner.
- Actors: CPO, eMSP, SiteHost, AssetOwner, RoamingHub, Finance.
- Preconditions: Complete evidence of the obligation, financial effects and lifecycle state is available.
- Normal outcome: Settlement approval cannot conceal unresolved reconciliation cases directly against the batch or its items.
- Exception outcome: Reject the contradictory financial or lifecycle state with B218.
- Review finding: The integration review identified a stated outcome that could contradict its underlying records.
- Disposition: semantic-contract-covered.
- Historical adversarial review: See the current completion review for wider cross-domain evidence.
- Completion interaction scenarios: COMPLETE-RECONCILED-SETTLEMENT-APPROVAL-PASS, COMPLETE-RECONCILED-SETTLEMENT-APPROVAL-1
- Sources: CW-POLICY.
- Associated full-graph journey snapshots: JOURNEY-CHARGE-PASS, JOURNEY-CHARGE-REJECT, JOURNEY-SETTLEMENT-PASS, JOURNEY-SETTLEMENT-REJECT. These exercise the journey; focused scenarios above isolate this requirement.
- Structural contracts: SettlementApprovalShape, SettlementBatchShape, PrincipalShape, LegalEntityShape, EvidenceDocumentShape.
- Runtime acceptance: Execute the same ordered journey against real adapters and durable services; verify authorization, atomicity, side effects, failure recovery and evidence retrieval.

| Concept | Reviewed relationship/value paths |
|---|---|
| SettlementApproval | settlementBatch, approvalState, approvedBy, accountableParty, approvedAt, openDifferenceCount, approvalEvidence |
| SettlementBatch | serviceAgreement, period, currency, settlementItem, netAmount, taxAmount, grossAmount, settlementState, invoice |
| Principal | subjectReference, identityProvider, principalKind, principalState, person |
| LegalEntity | legalName, registeredAddress, registrationNumber, taxIdentifier, contact, financialAccount |
| EvidenceDocument | contentDigest, mediaType, storageReference, capturedAt, retentionPolicy |
