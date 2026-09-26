# Temporal field inventory

Generated from every class contract by `python tools/audit_temporal.py --write-inventory`.
Includes inherited fields. A date, event timestamp, interval link or revision is not evidence of complete bitemporal support.
This table inventories structural coverage, not business completeness. See [the temporal contract](temporal-contract.md) for the shared history semantics and closure evidence.

| Module | Classes | Business date/time fields present | Linked time definitions present |
|---|---:|---:|---:|
| assets | 14 | 6 | 0 |
| billing-tax | 13 | 8 | 0 |
| commands-booking | 6 | 3 | 2 |
| device-management | 10 | 7 | 0 |
| energy | 24 | 14 | 8 |
| foundation | 20 | 11 | 1 |
| identity | 16 | 7 | 0 |
| integration-experience | 21 | 7 | 1 |
| operations | 13 | 7 | 4 |
| partners-settlement | 21 | 11 | 3 |
| payments-ledger | 24 | 16 | 0 |
| places | 9 | 5 | 2 |
| pricing | 26 | 8 | 2 |
| roaming | 11 | 5 | 0 |
| security-governance | 15 | 13 | 0 |
| sessions-metering | 16 | 12 | 3 |
| subscriptions-benefits | 11 | 6 | 1 |
| vehicles-authorization | 12 | 8 | 0 |

| Class | Module | Temporal policy | Business date/time fields | Linked intervals / recurrences | Record metadata |
|---|---|---|---|---|---|
| AssetLifecycleEvent | assets | snapshot-versioned | effectiveAt | — | createdAt, revision |
| CalibrationRecord | assets | snapshot-versioned | validFrom, validUntil | — | createdAt, revision |
| ChargingStation | assets | snapshot-versioned | commissionedAt, manufacturedAt | — | createdAt, revision |
| ChargingUnit | assets | snapshot-versioned | — | — | createdAt, revision |
| Connector | assets | snapshot-versioned | — | — | createdAt, revision |
| ConnectorCompatibility | assets | snapshot-versioned | assessedAt | — | createdAt, revision |
| DeviceCapability | assets | snapshot-versioned | — | — | createdAt, revision |
| ElectricalCircuit | assets | snapshot-versioned | — | — | createdAt, revision |
| ElectricalConnection | assets | snapshot-versioned | — | — | createdAt, revision |
| ElectricityMeter | assets | snapshot-versioned | — | — | createdAt, revision |
| EquipmentModel | assets | snapshot-versioned | — | — | createdAt, revision |
| Manufacturer | assets | snapshot-versioned | — | — | createdAt, revision |
| OperationalAcceptance | assets | snapshot-versioned | acceptedAt | — | createdAt, revision |
| OwnershipTransfer | assets | snapshot-versioned | effectiveAt | — | createdAt, revision |
| BillingProfile | billing-tax | snapshot-versioned | — | — | createdAt, revision |
| CreditNote | billing-tax | snapshot-versioned | issuedAt | — | createdAt, revision |
| CustomFee | billing-tax | snapshot-versioned | assessedAt | — | createdAt, revision |
| DocumentNumberSequence | billing-tax | snapshot-versioned | — | — | createdAt, revision |
| FiscalizationAttempt | billing-tax | snapshot-versioned | attemptedAt | — | createdAt, revision |
| Invoice | billing-tax | immutable-aggregate | issuedAt, dueAt | — | createdAt, revision |
| InvoiceLine | billing-tax | snapshot-versioned | — | — | createdAt, revision |
| RatedLine | billing-tax | snapshot-versioned | — | — | createdAt, revision |
| RatingCalculation | billing-tax | immutable-aggregate | calculatedAt | — | createdAt, revision |
| Receipt | billing-tax | snapshot-versioned | issuedAt | — | createdAt, revision |
| TaxDetermination | billing-tax | snapshot-versioned | determinedAt | — | createdAt, revision |
| TaxIdentifier | billing-tax | snapshot-versioned | — | — | createdAt, revision |
| TaxRule | billing-tax | snapshot-versioned | validFrom, validUntil | — | createdAt, revision |
| Booking | commands-booking | snapshot-versioned | — | bookingWindow → TimeWindow | createdAt, revision |
| BookingRequest | commands-booking | snapshot-versioned | — | requestedWindow → TimeWindow | createdAt, revision |
| CommandOutcome | commands-booking | snapshot-versioned | reportedAt | — | createdAt, revision |
| CommandParameter | commands-booking | snapshot-versioned | — | — | createdAt, revision |
| RemoteCommand | commands-booking | snapshot-versioned | requestedAt, expiresAt | — | createdAt, revision |
| Reservation | commands-booking | snapshot-versioned | reservedAt, expiresAt | — | createdAt, revision |
| ConfigurationTemplate | device-management | snapshot-versioned | — | — | createdAt, revision |
| ConfigurationTemplateEntry | device-management | snapshot-versioned | — | — | createdAt, revision |
| ConfigurationVariable | device-management | snapshot-versioned | observedAt | — | createdAt, revision |
| ConnectionObservation | device-management | snapshot-versioned | observedAt, lastHeartbeatAt | — | createdAt, revision |
| DiagnosticArtifact | device-management | snapshot-versioned | requestedAt | — | createdAt, revision |
| FirmwareDeployment | device-management | snapshot-versioned | requestedAt, completedAt | — | createdAt, revision |
| FirmwareRelease | device-management | snapshot-versioned | releaseDate | — | createdAt, revision |
| HardwareStatusObservation | device-management | snapshot-versioned | observedAt | — | createdAt, revision |
| ProtocolEndpoint | device-management | snapshot-versioned | — | — | createdAt, revision |
| TemplateApplication | device-management | snapshot-versioned | requestedAt | — | createdAt, revision |
| ChargingProfile | energy | snapshot-versioned | relativeAnchor | — | createdAt, revision |
| ChargingSchedule | energy | snapshot-versioned | validFrom, validUntil | — | createdAt, revision |
| ControlDecision | energy | snapshot-versioned | — | interval → TimeWindow | createdAt, revision |
| ControlGroupMembership | energy | snapshot-versioned | validFrom, validUntil | — | createdAt, revision |
| DemandResponseProgram | energy | snapshot-versioned | — | — | createdAt, revision |
| DistributedEnergyAsset | energy | snapshot-versioned | — | — | createdAt, revision |
| EnergyForecast | energy | snapshot-versioned | issuedAt | horizon → TimeWindow | createdAt, revision |
| ExportAgreement | energy | snapshot-versioned | validFrom, validUntil | — | createdAt, revision |
| FlexibilityActivation | energy | snapshot-versioned | requestedAt | interval → TimeWindow | createdAt, revision |
| FlexibilityAsset | energy | snapshot-versioned | validUntil | — | createdAt, revision |
| FlexibilityDelivery | energy | snapshot-versioned | verifiedAt | — | createdAt, revision |
| ForecastPoint | energy | snapshot-versioned | — | interval → TimeWindow | createdAt, revision |
| GridConnection | energy | snapshot-versioned | — | effectiveWindow → TimeWindow | createdAt, revision |
| LoadControlGroup | energy | snapshot-versioned | — | — | createdAt, revision |
| OverrideAuthorization | energy | snapshot-versioned | validFrom, validUntil | — | createdAt, revision |
| PhaseCurrentConstraint | energy | snapshot-versioned | — | interval → TimeWindow | createdAt, revision |
| PowerCabinet | energy | snapshot-versioned | — | — | createdAt, revision |
| PowerConstraint | energy | snapshot-versioned | — | interval → TimeWindow | createdAt, revision |
| PowerModuleAllocation | energy | snapshot-versioned | — | interval → TimeWindow | createdAt, revision |
| PriorityRule | energy | snapshot-versioned | boostUntil | — | createdAt, revision |
| ScheduleApplication | energy | snapshot-versioned | appliedAt | — | createdAt, revision |
| SchedulePeriod | energy | snapshot-versioned | periodStart, periodEnd | — | createdAt, revision |
| SmartChargingPreference | energy | snapshot-versioned | departureAt | — | createdAt, revision |
| UnmanagedLoadObservation | energy | snapshot-versioned | observedAt | — | createdAt, revision |
| Address | foundation | snapshot-versioned | — | — | createdAt, revision |
| Annotation | foundation | snapshot-versioned | notedAt | — | createdAt, revision |
| Currency | foundation | snapshot-versioned | — | — | createdAt, revision |
| CustomFieldDefinition | foundation | snapshot-versioned | — | — | createdAt, revision |
| CustomFieldValue | foundation | snapshot-versioned | — | — | createdAt, revision |
| EvidenceDocument | foundation | immutable-aggregate | capturedAt | — | createdAt, revision |
| ExchangeRate | foundation | snapshot-versioned | quotedAt | — | createdAt, revision |
| ExternalIdentifier | foundation | snapshot-versioned | validFrom, validUntil | — | createdAt, revision |
| GeoPosition | foundation | snapshot-versioned | — | — | createdAt, revision |
| ProjectionWatermark | foundation | history-metadata | watermarkAt, completeThrough | — | createdAt, revision |
| Quantity | foundation | snapshot-versioned | — | — | createdAt, revision |
| Record | foundation | abstract | — | — | createdAt, revision |
| RecurringWindow | foundation | snapshot-versioned | localStart, localEnd | exceptionWindow → TimeWindow | createdAt, revision |
| StateTransition | foundation | snapshot-versioned | transitionedAt | — | createdAt, revision |
| TemporalCommit | foundation | history-metadata | recordedAt | — | createdAt, revision |
| TemporalSlice | foundation | history-metadata | validFrom, validUntil | — | createdAt, revision |
| TemporalSnapshotSelection | foundation | history-metadata | validAt, knownAt | — | createdAt, revision |
| TemporalStreamPolicy | foundation | history-metadata | — | — | createdAt, revision |
| Tenant | foundation | tenant-context | — | — | — |
| TimeWindow | foundation | snapshot-versioned | startsAt, endsAt | — | createdAt, revision |
| AccessGrant | identity | snapshot-versioned | validFrom, validUntil | — | createdAt, revision |
| AccountClosure | identity | snapshot-versioned | requestedAt, completedAt | — | createdAt, revision |
| ContactProfile | identity | snapshot-versioned | — | — | createdAt, revision |
| CustomerAccount | identity | snapshot-versioned | — | — | createdAt, revision |
| CustomerGroup | identity | snapshot-versioned | — | — | createdAt, revision |
| GroupMembership | identity | snapshot-versioned | validFrom, validUntil | — | createdAt, revision |
| LegalEntity | identity | snapshot-versioned | — | — | createdAt, revision |
| ManagementDelegation | identity | snapshot-versioned | validFrom, validUntil | — | createdAt, revision |
| OperatorService | identity | snapshot-versioned | — | — | createdAt, revision |
| PartyRole | identity | snapshot-versioned | validFrom, validUntil | — | createdAt, revision |
| Permission | identity | snapshot-versioned | — | — | createdAt, revision |
| Person | identity | snapshot-versioned | — | — | createdAt, revision |
| Principal | identity | snapshot-versioned | — | — | createdAt, revision |
| SecurityRole | identity | snapshot-versioned | — | — | createdAt, revision |
| ServiceEntitlement | identity | snapshot-versioned | validFrom, validUntil | — | createdAt, revision |
| UserDevice | identity | snapshot-versioned | lastSeenAt | — | createdAt, revision |
| ActionApproval | integration-experience | snapshot-versioned | decidedAt | — | createdAt, revision |
| ApiClient | integration-experience | snapshot-versioned | — | — | createdAt, revision |
| ApplicationInstallation | integration-experience | snapshot-versioned | — | — | createdAt, revision |
| AssistantRecommendation | integration-experience | snapshot-versioned | generatedAt | — | createdAt, revision |
| BrandProfile | integration-experience | snapshot-versioned | — | — | createdAt, revision |
| CommunicationLog | integration-experience | snapshot-versioned | — | — | createdAt, revision |
| ContentTemplate | integration-experience | snapshot-versioned | — | — | createdAt, revision |
| CustomerNotification | integration-experience | snapshot-versioned | requestedAt | — | createdAt, revision |
| EventDelivery | integration-experience | snapshot-versioned | attemptedAt, nextRetryAt | — | createdAt, revision |
| EventSubscription | integration-experience | snapshot-versioned | — | — | createdAt, revision |
| ExperienceChannel | integration-experience | snapshot-versioned | — | — | createdAt, revision |
| HelpArticle | integration-experience | snapshot-versioned | — | — | createdAt, revision |
| IntegrationConnection | integration-experience | snapshot-versioned | — | — | createdAt, revision |
| LifecycleSnapshot | integration-experience | snapshot-versioned | effectiveAt | — | createdAt, revision |
| MetricDefinition | integration-experience | snapshot-versioned | — | — | createdAt, revision |
| MetricObservation | integration-experience | snapshot-versioned | calculatedAt | interval → TimeWindow | createdAt, revision |
| MigrationBatch | integration-experience | snapshot-versioned | — | — | createdAt, revision |
| PlatformSetting | integration-experience | snapshot-versioned | effectiveAt | — | createdAt, revision |
| ProcessExecution | integration-experience | snapshot-versioned | — | — | createdAt, revision |
| ProcessStep | integration-experience | snapshot-versioned | — | — | createdAt, revision |
| ProtocolProfile | integration-experience | snapshot-versioned | — | — | createdAt, revision |
| AvailabilityPolicy | operations | snapshot-versioned | — | — | createdAt, revision |
| AvailabilityResult | operations | snapshot-versioned | calculatedAt | interval → TimeWindow | createdAt, revision |
| DowntimePeriod | operations | snapshot-versioned | — | interval → TimeWindow | createdAt, revision |
| InstallationJob | operations | snapshot-versioned | scheduledAt, completedAt | — | createdAt, revision |
| Issue | operations | snapshot-versioned | openedAt, resolvedAt | — | createdAt, revision |
| OperationalPeriod | operations | snapshot-versioned | — | interval → TimeWindow | createdAt, revision |
| RecoveryAttempt | operations | snapshot-versioned | attemptedAt | — | createdAt, revision |
| RecoveryExercise | operations | snapshot-versioned | exercisedAt | — | createdAt, revision |
| RecoveryPolicy | operations | snapshot-versioned | — | — | createdAt, revision |
| ServiceLevelBreach | operations | snapshot-versioned | detectedAt | — | createdAt, revision |
| ServiceLevelCommitment | operations | snapshot-versioned | — | measurementWindow → TimeWindow | createdAt, revision |
| VendorFaultDefinition | operations | snapshot-versioned | — | — | createdAt, revision |
| WorkOrder | operations | snapshot-versioned | dueAt, completedAt | — | createdAt, revision |
| AgreementLifecycleEvent | partners-settlement | snapshot-versioned | effectiveAt, settlementCutoff | — | createdAt, revision |
| ContractObligation | partners-settlement | snapshot-versioned | dueAt | — | createdAt, revision |
| CorporateBillingPolicy | partners-settlement | snapshot-versioned | — | — | createdAt, revision |
| CorporateBillingSnapshot | partners-settlement | immutable-aggregate | capturedAt | — | createdAt, revision |
| CorporateChargerRule | partners-settlement | snapshot-versioned | — | — | createdAt, revision |
| CorporateCostAllocation | partners-settlement | snapshot-versioned | — | — | createdAt, revision |
| CostAllocationRule | partners-settlement | snapshot-versioned | — | — | createdAt, revision |
| ObligationAssessment | partners-settlement | snapshot-versioned | assessedAt | — | createdAt, revision |
| PartnerInvitation | partners-settlement | snapshot-versioned | expiresAt | — | createdAt, revision |
| ReconciliationCase | partners-settlement | snapshot-versioned | openedAt, resolvedAt | — | createdAt, revision |
| ReimbursementApproval | partners-settlement | snapshot-versioned | approvedAt | — | createdAt, revision |
| ReimbursementPolicy | partners-settlement | snapshot-versioned | validFromDate, validUntilDate | — | createdAt, revision |
| ReimbursementRecord | partners-settlement | snapshot-versioned | calculatedAt | — | createdAt, revision |
| ReimbursementReport | partners-settlement | snapshot-versioned | — | period → TimeWindow | createdAt, revision |
| ReimbursementTaxCalculation | partners-settlement | snapshot-versioned | — | — | createdAt, revision |
| RevenueShareRule | partners-settlement | snapshot-versioned | — | — | createdAt, revision |
| ServiceAgreement | partners-settlement | snapshot-versioned | validFrom, validUntil | — | createdAt, revision |
| SettlementApproval | partners-settlement | snapshot-versioned | approvedAt | — | createdAt, revision |
| SettlementBatch | partners-settlement | snapshot-versioned | — | period → TimeWindow | createdAt, revision |
| SettlementItem | partners-settlement | snapshot-versioned | — | — | createdAt, revision |
| SettlementOverride | partners-settlement | snapshot-versioned | — | interval → TimeWindow | createdAt, revision |
| Chargeback | payments-ledger | snapshot-versioned | responseDueAt | — | createdAt, revision |
| DunningAction | payments-ledger | snapshot-versioned | actionAt | — | createdAt, revision |
| FinancialAccountReference | payments-ledger | snapshot-versioned | — | — | createdAt, revision |
| FinancialPosition | payments-ledger | snapshot-versioned | — | — | createdAt, revision |
| Journal | payments-ledger | immutable-aggregate | postedAt | — | createdAt, revision |
| JournalLine | payments-ledger | snapshot-versioned | — | — | createdAt, revision |
| LedgerAccount | payments-ledger | snapshot-versioned | — | — | createdAt, revision |
| PaymentAllocation | payments-ledger | snapshot-versioned | allocatedAt | — | createdAt, revision |
| PaymentAuthorization | payments-ledger | snapshot-versioned | authorizedAt, expiresAt | — | createdAt, revision |
| PaymentCapture | payments-ledger | snapshot-versioned | capturedAt | — | createdAt, revision |
| PaymentInstrument | payments-ledger | snapshot-versioned | — | — | createdAt, revision |
| PaymentIntent | payments-ledger | snapshot-versioned | — | — | createdAt, revision |
| PaymentRouting | payments-ledger | snapshot-versioned | — | — | createdAt, revision |
| PaymentTerminal | payments-ledger | snapshot-versioned | — | — | createdAt, revision |
| Payout | payments-ledger | snapshot-versioned | scheduledAt, confirmedAt | — | createdAt, revision |
| PayoutBatch | payments-ledger | snapshot-versioned | scheduledAt | — | createdAt, revision |
| ReconciliationResolution | payments-ledger | snapshot-versioned | resolvedAt | — | createdAt, revision |
| Refund | payments-ledger | snapshot-versioned | requestedAt | — | createdAt, revision |
| ServiceDispute | payments-ledger | snapshot-versioned | openedAt, responseDueAt | — | createdAt, revision |
| TopUpOffer | payments-ledger | snapshot-versioned | validFrom, validUntil | — | createdAt, revision |
| Voucher | payments-ledger | snapshot-versioned | validFrom, validUntil | — | createdAt, revision |
| VoucherRedemption | payments-ledger | snapshot-versioned | redeemedAt | — | createdAt, revision |
| Wallet | payments-ledger | snapshot-versioned | balanceAsOf | — | createdAt, revision |
| WalletEntry | payments-ledger | snapshot-versioned | recordedAt | — | createdAt, revision |
| ChargingArea | places | snapshot-versioned | — | — | createdAt, revision |
| ChargingSite | places | snapshot-versioned | — | openingWindow → RecurringWindow | createdAt, revision |
| MediaAsset | places | snapshot-versioned | — | — | createdAt, revision |
| ParkingSpace | places | snapshot-versioned | occupancyObservedAt | — | createdAt, revision |
| PublicListing | places | snapshot-versioned | publishedAt | — | createdAt, revision |
| ServiceNotice | places | snapshot-versioned | validFrom, validUntil | — | createdAt, revision |
| SharingAgreement | places | snapshot-versioned | validFrom, validUntil | — | createdAt, revision |
| SharingInvitation | places | snapshot-versioned | expiresAt | — | createdAt, revision |
| SiteAccessPolicy | places | snapshot-versioned | — | openingWindow → RecurringWindow | createdAt, revision |
| CommercialOffer | pricing | immutable-aggregate | issuedAt, expiresAt | — | createdAt, revision |
| CommercialResponsibility | pricing | snapshot-versioned | validFrom, validUntil | — | createdAt, revision |
| DiscountRule | pricing | snapshot-versioned | — | — | createdAt, revision |
| DynamicPriceFormula | pricing | snapshot-versioned | — | — | createdAt, revision |
| ElectricityPriceInterval | pricing | snapshot-versioned | quotedAt | interval → TimeWindow, recurringWindow → RecurringWindow | createdAt, revision |
| ElectricityPriceSchedule | pricing | snapshot-versioned | — | — | createdAt, revision |
| EnergyMix | pricing | snapshot-versioned | — | reportingPeriod → TimeWindow | createdAt, revision |
| EnergySourceShare | pricing | snapshot-versioned | — | — | createdAt, revision |
| FeeBounds | pricing | snapshot-versioned | — | — | createdAt, revision |
| OfferAcceptance | pricing | snapshot-versioned | acceptedAt | — | createdAt, revision |
| PreauthorizationPolicy | pricing | snapshot-versioned | — | — | createdAt, revision |
| PriceComponent | pricing | snapshot-versioned | — | — | createdAt, revision |
| PriceDisplay | pricing | snapshot-versioned | effectiveAt | — | createdAt, revision |
| PriceFreezePolicy | pricing | snapshot-versioned | — | — | createdAt, revision |
| PriceTier | pricing | snapshot-versioned | — | — | createdAt, revision |
| PricingCondition | pricing | snapshot-versioned | — | — | createdAt, revision |
| RoundingPolicy | pricing | snapshot-versioned | — | — | createdAt, revision |
| ScheduledTariffChange | pricing | snapshot-versioned | effectiveAt | — | createdAt, revision |
| SessionLimitPolicy | pricing | snapshot-versioned | — | — | createdAt, revision |
| SessionPricingPolicy | pricing | snapshot-versioned | — | — | createdAt, revision |
| SubsidyRule | pricing | snapshot-versioned | — | — | createdAt, revision |
| Tariff | pricing | snapshot-versioned | — | — | createdAt, revision |
| TariffAssignment | pricing | snapshot-versioned | — | — | createdAt, revision |
| TariffResolution | pricing | snapshot-versioned | resolvedAt | — | createdAt, revision |
| TariffSet | pricing | snapshot-versioned | — | — | createdAt, revision |
| TariffVersion | pricing | immutable-aggregate | validFrom, validUntil | — | createdAt, revision |
| PublicDataPublication | roaming | snapshot-versioned | publishedAt, validUntil | — | createdAt, revision |
| RoamingBehaviorPolicy | roaming | snapshot-versioned | — | — | createdAt, revision |
| RoamingCommand | roaming | snapshot-versioned | receivedAt | — | createdAt, revision |
| RoamingConnection | roaming | snapshot-versioned | — | — | createdAt, revision |
| RoamingExchange | roaming | snapshot-versioned | acknowledgedAt | — | createdAt, revision |
| RoamingModuleAgreement | roaming | snapshot-versioned | — | — | createdAt, revision |
| RoamingNetwork | roaming | snapshot-versioned | — | — | createdAt, revision |
| RoamingParty | roaming | snapshot-versioned | — | — | createdAt, revision |
| RoamingTariffFilter | roaming | snapshot-versioned | — | — | createdAt, revision |
| RoamingTariffMapping | roaming | snapshot-versioned | importedAt | — | createdAt, revision |
| SynchronizationCursor | roaming | snapshot-versioned | lastSuccessfulAt, watermarkAt | — | createdAt, revision |
| AccessDecision | security-governance | immutable-aggregate | decidedAt | — | createdAt, revision |
| AccessTokenLease | security-governance | snapshot-versioned | issuedAt, expiresAt, revokedAt | — | createdAt, revision |
| AuditEntry | security-governance | snapshot-versioned | eventAt | — | createdAt, revision |
| CertificateLifecycleEvent | security-governance | snapshot-versioned | eventAt | — | createdAt, revision |
| CertificateRecord | security-governance | snapshot-versioned | validFrom, validUntil | — | createdAt, revision |
| ComplianceAssessment | security-governance | snapshot-versioned | assessedAt | — | createdAt, revision |
| ConsentDecision | security-governance | immutable-aggregate | decidedAt | — | createdAt, revision |
| DataDisposition | security-governance | snapshot-versioned | requestedAt, completedAt | — | createdAt, revision |
| DataSubjectRequest | security-governance | snapshot-versioned | receivedAt, responseDueAt, completedAt | — | createdAt, revision |
| EvidenceVerification | security-governance | snapshot-versioned | checkedAt | — | createdAt, revision |
| LegalHold | security-governance | snapshot-versioned | validFrom, reviewAt, releasedAt | — | createdAt, revision |
| PolicyDocument | security-governance | snapshot-versioned | validFrom, validUntil | — | createdAt, revision |
| ProcessingPurpose | security-governance | snapshot-versioned | — | — | createdAt, revision |
| RetentionPolicy | security-governance | snapshot-versioned | — | — | createdAt, revision |
| SecurityEvent | security-governance | snapshot-versioned | eventAt | — | createdAt, revision |
| BillingReadinessAssessment | sessions-metering | snapshot-versioned | assessedAt | — | createdAt, revision |
| ChargeDetailRecord | sessions-metering | immutable-aggregate | receivedAt | period → TimeWindow | createdAt, revision |
| ChargingInterval | sessions-metering | snapshot-versioned | — | interval → TimeWindow | createdAt, revision |
| ChargingSession | sessions-metering | snapshot-versioned | startedAt, endedAt | — | createdAt, revision |
| ClockAssessment | sessions-metering | snapshot-versioned | assessedAt | — | createdAt, revision |
| EventProcessingOutcome | sessions-metering | snapshot-versioned | processedAt | — | createdAt, revision |
| MeterDelta | sessions-metering | snapshot-versioned | — | — | createdAt, revision |
| MeterObservation | sessions-metering | snapshot-versioned | observedAt | — | createdAt, revision |
| MeterRegisterEpoch | sessions-metering | snapshot-versioned | validFrom, validUntil | — | createdAt, revision |
| ProtocolTransaction | sessions-metering | snapshot-versioned | startedAt, endedAt | — | createdAt, revision |
| RecordCorrection | sessions-metering | immutable-aggregate | issuedAt | — | createdAt, revision |
| SessionEndEvidence | sessions-metering | snapshot-versioned | finalizedAt | — | createdAt, revision |
| SessionEvent | sessions-metering | snapshot-versioned | — | — | createdAt, revision |
| SignedMeterEvidence | sessions-metering | snapshot-versioned | verifiedAt | — | createdAt, revision |
| SourceEvent | sessions-metering | immutable-aggregate | occurredAt, receivedAt | — | createdAt, revision |
| UsageAggregate | sessions-metering | snapshot-versioned | — | interval → TimeWindow | createdAt, revision |
| AllowanceBalance | subscriptions-benefits | snapshot-versioned | — | — | createdAt, revision |
| AllowanceConsumption | subscriptions-benefits | snapshot-versioned | recordedAt | — | createdAt, revision |
| BenefitAllowance | subscriptions-benefits | snapshot-versioned | — | — | createdAt, revision |
| BenefitReservation | subscriptions-benefits | snapshot-versioned | expiresAt | — | createdAt, revision |
| BillingPeriod | subscriptions-benefits | snapshot-versioned | — | period → TimeWindow | createdAt, revision |
| CouponConsumption | subscriptions-benefits | snapshot-versioned | consumedAt | — | createdAt, revision |
| EnergyCoupon | subscriptions-benefits | snapshot-versioned | validFrom, validUntil | — | createdAt, revision |
| EnergyCouponTemplate | subscriptions-benefits | snapshot-versioned | validFrom, validUntil | — | createdAt, revision |
| Subscription | subscriptions-benefits | snapshot-versioned | startsAt, endsAt, cancelledAt | — | createdAt, revision |
| SubscriptionBillingPolicy | subscriptions-benefits | snapshot-versioned | — | — | createdAt, revision |
| SubscriptionPlan | subscriptions-benefits | snapshot-versioned | — | — | createdAt, revision |
| AuthorizationDecision | vehicles-authorization | immutable-aggregate | decidedAt, expiresAt | — | createdAt, revision |
| AuthorizationRequest | vehicles-authorization | snapshot-versioned | requestedAt | — | createdAt, revision |
| ChargingCredential | vehicles-authorization | snapshot-versioned | validFrom, validUntil | — | createdAt, revision |
| CredentialAssignment | vehicles-authorization | snapshot-versioned | validFrom, validUntil | — | createdAt, revision |
| LocalAuthorizationEntry | vehicles-authorization | snapshot-versioned | validUntil | — | createdAt, revision |
| LocalAuthorizationList | vehicles-authorization | snapshot-versioned | generatedAt | — | createdAt, revision |
| OfflineAuthorizationAssessment | vehicles-authorization | snapshot-versioned | — | — | createdAt, revision |
| PlugAndChargeEnrollment | vehicles-authorization | snapshot-versioned | — | — | createdAt, revision |
| ProvisioningCertificate | vehicles-authorization | snapshot-versioned | — | — | createdAt, revision |
| Vehicle | vehicles-authorization | snapshot-versioned | — | — | createdAt, revision |
| VehicleAssignment | vehicles-authorization | snapshot-versioned | validFrom, validUntil | — | createdAt, revision |
| VehicleTelemetry | vehicles-authorization | snapshot-versioned | observedAt | — | createdAt, revision |
