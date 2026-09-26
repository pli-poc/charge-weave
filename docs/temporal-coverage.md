# Temporal field inventory

Generated from every class contract by `python tools/audit_temporal.py --write-inventory`.
Includes inherited fields. A date, event timestamp, interval link or revision is not evidence of complete bitemporal support.
This table inventories structural coverage, not business completeness. See [the temporal review](temporal-model-review.md) for interpretation.

| Module | Classes | Business date/time fields present | Linked time definitions present |
|---|---:|---:|---:|
| assets | 14 | 6 | 0 |
| billing-tax | 13 | 8 | 0 |
| commands-booking | 6 | 3 | 2 |
| device-management | 10 | 7 | 0 |
| energy | 24 | 14 | 8 |
| foundation | 15 | 7 | 1 |
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

| Class | Module | Business date/time fields | Linked intervals / recurrences | Record metadata |
|---|---|---|---|---|
| AssetLifecycleEvent | assets | effectiveAt | — | createdAt, revision |
| CalibrationRecord | assets | validFrom, validUntil | — | createdAt, revision |
| ChargingStation | assets | commissionedAt, manufacturedAt | — | createdAt, revision |
| ChargingUnit | assets | — | — | createdAt, revision |
| Connector | assets | — | — | createdAt, revision |
| ConnectorCompatibility | assets | assessedAt | — | createdAt, revision |
| DeviceCapability | assets | — | — | createdAt, revision |
| ElectricalCircuit | assets | — | — | createdAt, revision |
| ElectricalConnection | assets | — | — | createdAt, revision |
| ElectricityMeter | assets | — | — | createdAt, revision |
| EquipmentModel | assets | — | — | createdAt, revision |
| Manufacturer | assets | — | — | createdAt, revision |
| OperationalAcceptance | assets | acceptedAt | — | createdAt, revision |
| OwnershipTransfer | assets | effectiveAt | — | createdAt, revision |
| BillingProfile | billing-tax | — | — | createdAt, revision |
| CreditNote | billing-tax | issuedAt | — | createdAt, revision |
| CustomFee | billing-tax | assessedAt | — | createdAt, revision |
| DocumentNumberSequence | billing-tax | — | — | createdAt, revision |
| FiscalizationAttempt | billing-tax | attemptedAt | — | createdAt, revision |
| Invoice | billing-tax | issuedAt, dueAt | — | createdAt, revision |
| InvoiceLine | billing-tax | — | — | createdAt, revision |
| RatedLine | billing-tax | — | — | createdAt, revision |
| RatingCalculation | billing-tax | calculatedAt | — | createdAt, revision |
| Receipt | billing-tax | issuedAt | — | createdAt, revision |
| TaxDetermination | billing-tax | determinedAt | — | createdAt, revision |
| TaxIdentifier | billing-tax | — | — | createdAt, revision |
| TaxRule | billing-tax | validFrom, validUntil | — | createdAt, revision |
| Booking | commands-booking | — | bookingWindow → TimeWindow | createdAt, revision |
| BookingRequest | commands-booking | — | requestedWindow → TimeWindow | createdAt, revision |
| CommandOutcome | commands-booking | reportedAt | — | createdAt, revision |
| CommandParameter | commands-booking | — | — | createdAt, revision |
| RemoteCommand | commands-booking | requestedAt, expiresAt | — | createdAt, revision |
| Reservation | commands-booking | reservedAt, expiresAt | — | createdAt, revision |
| ConfigurationTemplate | device-management | — | — | createdAt, revision |
| ConfigurationTemplateEntry | device-management | — | — | createdAt, revision |
| ConfigurationVariable | device-management | observedAt | — | createdAt, revision |
| ConnectionObservation | device-management | observedAt, lastHeartbeatAt | — | createdAt, revision |
| DiagnosticArtifact | device-management | requestedAt | — | createdAt, revision |
| FirmwareDeployment | device-management | requestedAt, completedAt | — | createdAt, revision |
| FirmwareRelease | device-management | releaseDate | — | createdAt, revision |
| HardwareStatusObservation | device-management | observedAt | — | createdAt, revision |
| ProtocolEndpoint | device-management | — | — | createdAt, revision |
| TemplateApplication | device-management | requestedAt | — | createdAt, revision |
| ChargingProfile | energy | relativeAnchor | — | createdAt, revision |
| ChargingSchedule | energy | validFrom, validUntil | — | createdAt, revision |
| ControlDecision | energy | — | interval → TimeWindow | createdAt, revision |
| ControlGroupMembership | energy | validFrom, validUntil | — | createdAt, revision |
| DemandResponseProgram | energy | — | — | createdAt, revision |
| DistributedEnergyAsset | energy | — | — | createdAt, revision |
| EnergyForecast | energy | issuedAt | horizon → TimeWindow | createdAt, revision |
| ExportAgreement | energy | validFrom, validUntil | — | createdAt, revision |
| FlexibilityActivation | energy | requestedAt | interval → TimeWindow | createdAt, revision |
| FlexibilityAsset | energy | validUntil | — | createdAt, revision |
| FlexibilityDelivery | energy | verifiedAt | — | createdAt, revision |
| ForecastPoint | energy | — | interval → TimeWindow | createdAt, revision |
| GridConnection | energy | — | effectiveWindow → TimeWindow | createdAt, revision |
| LoadControlGroup | energy | — | — | createdAt, revision |
| OverrideAuthorization | energy | validFrom, validUntil | — | createdAt, revision |
| PhaseCurrentConstraint | energy | — | interval → TimeWindow | createdAt, revision |
| PowerCabinet | energy | — | — | createdAt, revision |
| PowerConstraint | energy | — | interval → TimeWindow | createdAt, revision |
| PowerModuleAllocation | energy | — | interval → TimeWindow | createdAt, revision |
| PriorityRule | energy | boostUntil | — | createdAt, revision |
| ScheduleApplication | energy | appliedAt | — | createdAt, revision |
| SchedulePeriod | energy | periodStart, periodEnd | — | createdAt, revision |
| SmartChargingPreference | energy | departureAt | — | createdAt, revision |
| UnmanagedLoadObservation | energy | observedAt | — | createdAt, revision |
| Address | foundation | — | — | createdAt, revision |
| Annotation | foundation | notedAt | — | createdAt, revision |
| Currency | foundation | — | — | createdAt, revision |
| CustomFieldDefinition | foundation | — | — | createdAt, revision |
| CustomFieldValue | foundation | — | — | createdAt, revision |
| EvidenceDocument | foundation | capturedAt | — | createdAt, revision |
| ExchangeRate | foundation | quotedAt | — | createdAt, revision |
| ExternalIdentifier | foundation | validFrom, validUntil | — | createdAt, revision |
| GeoPosition | foundation | — | — | createdAt, revision |
| Quantity | foundation | — | — | createdAt, revision |
| Record | foundation | — | — | createdAt, revision |
| RecurringWindow | foundation | localStart, localEnd | exceptionWindow → TimeWindow | createdAt, revision |
| StateTransition | foundation | transitionedAt | — | createdAt, revision |
| Tenant | foundation | — | — | — |
| TimeWindow | foundation | startsAt, endsAt | — | createdAt, revision |
| AccessGrant | identity | validFrom, validUntil | — | createdAt, revision |
| AccountClosure | identity | requestedAt, completedAt | — | createdAt, revision |
| ContactProfile | identity | — | — | createdAt, revision |
| CustomerAccount | identity | — | — | createdAt, revision |
| CustomerGroup | identity | — | — | createdAt, revision |
| GroupMembership | identity | validFrom, validUntil | — | createdAt, revision |
| LegalEntity | identity | — | — | createdAt, revision |
| ManagementDelegation | identity | validFrom, validUntil | — | createdAt, revision |
| OperatorService | identity | — | — | createdAt, revision |
| PartyRole | identity | validFrom, validUntil | — | createdAt, revision |
| Permission | identity | — | — | createdAt, revision |
| Person | identity | — | — | createdAt, revision |
| Principal | identity | — | — | createdAt, revision |
| SecurityRole | identity | — | — | createdAt, revision |
| ServiceEntitlement | identity | validFrom, validUntil | — | createdAt, revision |
| UserDevice | identity | lastSeenAt | — | createdAt, revision |
| ActionApproval | integration-experience | decidedAt | — | createdAt, revision |
| ApiClient | integration-experience | — | — | createdAt, revision |
| ApplicationInstallation | integration-experience | — | — | createdAt, revision |
| AssistantRecommendation | integration-experience | generatedAt | — | createdAt, revision |
| BrandProfile | integration-experience | — | — | createdAt, revision |
| CommunicationLog | integration-experience | — | — | createdAt, revision |
| ContentTemplate | integration-experience | — | — | createdAt, revision |
| CustomerNotification | integration-experience | requestedAt | — | createdAt, revision |
| EventDelivery | integration-experience | attemptedAt, nextRetryAt | — | createdAt, revision |
| EventSubscription | integration-experience | — | — | createdAt, revision |
| ExperienceChannel | integration-experience | — | — | createdAt, revision |
| HelpArticle | integration-experience | — | — | createdAt, revision |
| IntegrationConnection | integration-experience | — | — | createdAt, revision |
| LifecycleSnapshot | integration-experience | effectiveAt | — | createdAt, revision |
| MetricDefinition | integration-experience | — | — | createdAt, revision |
| MetricObservation | integration-experience | calculatedAt | interval → TimeWindow | createdAt, revision |
| MigrationBatch | integration-experience | — | — | createdAt, revision |
| PlatformSetting | integration-experience | effectiveAt | — | createdAt, revision |
| ProcessExecution | integration-experience | — | — | createdAt, revision |
| ProcessStep | integration-experience | — | — | createdAt, revision |
| ProtocolProfile | integration-experience | — | — | createdAt, revision |
| AvailabilityPolicy | operations | — | — | createdAt, revision |
| AvailabilityResult | operations | calculatedAt | interval → TimeWindow | createdAt, revision |
| DowntimePeriod | operations | — | interval → TimeWindow | createdAt, revision |
| InstallationJob | operations | scheduledAt, completedAt | — | createdAt, revision |
| Issue | operations | openedAt, resolvedAt | — | createdAt, revision |
| OperationalPeriod | operations | — | interval → TimeWindow | createdAt, revision |
| RecoveryAttempt | operations | attemptedAt | — | createdAt, revision |
| RecoveryExercise | operations | exercisedAt | — | createdAt, revision |
| RecoveryPolicy | operations | — | — | createdAt, revision |
| ServiceLevelBreach | operations | detectedAt | — | createdAt, revision |
| ServiceLevelCommitment | operations | — | measurementWindow → TimeWindow | createdAt, revision |
| VendorFaultDefinition | operations | — | — | createdAt, revision |
| WorkOrder | operations | dueAt, completedAt | — | createdAt, revision |
| AgreementLifecycleEvent | partners-settlement | effectiveAt, settlementCutoff | — | createdAt, revision |
| ContractObligation | partners-settlement | dueAt | — | createdAt, revision |
| CorporateBillingPolicy | partners-settlement | — | — | createdAt, revision |
| CorporateBillingSnapshot | partners-settlement | capturedAt | — | createdAt, revision |
| CorporateChargerRule | partners-settlement | — | — | createdAt, revision |
| CorporateCostAllocation | partners-settlement | — | — | createdAt, revision |
| CostAllocationRule | partners-settlement | — | — | createdAt, revision |
| ObligationAssessment | partners-settlement | assessedAt | — | createdAt, revision |
| PartnerInvitation | partners-settlement | expiresAt | — | createdAt, revision |
| ReconciliationCase | partners-settlement | openedAt, resolvedAt | — | createdAt, revision |
| ReimbursementApproval | partners-settlement | approvedAt | — | createdAt, revision |
| ReimbursementPolicy | partners-settlement | validFromDate, validUntilDate | — | createdAt, revision |
| ReimbursementRecord | partners-settlement | calculatedAt | — | createdAt, revision |
| ReimbursementReport | partners-settlement | — | period → TimeWindow | createdAt, revision |
| ReimbursementTaxCalculation | partners-settlement | — | — | createdAt, revision |
| RevenueShareRule | partners-settlement | — | — | createdAt, revision |
| ServiceAgreement | partners-settlement | validFrom, validUntil | — | createdAt, revision |
| SettlementApproval | partners-settlement | approvedAt | — | createdAt, revision |
| SettlementBatch | partners-settlement | — | period → TimeWindow | createdAt, revision |
| SettlementItem | partners-settlement | — | — | createdAt, revision |
| SettlementOverride | partners-settlement | — | interval → TimeWindow | createdAt, revision |
| Chargeback | payments-ledger | responseDueAt | — | createdAt, revision |
| DunningAction | payments-ledger | actionAt | — | createdAt, revision |
| FinancialAccountReference | payments-ledger | — | — | createdAt, revision |
| FinancialPosition | payments-ledger | — | — | createdAt, revision |
| Journal | payments-ledger | postedAt | — | createdAt, revision |
| JournalLine | payments-ledger | — | — | createdAt, revision |
| LedgerAccount | payments-ledger | — | — | createdAt, revision |
| PaymentAllocation | payments-ledger | allocatedAt | — | createdAt, revision |
| PaymentAuthorization | payments-ledger | authorizedAt, expiresAt | — | createdAt, revision |
| PaymentCapture | payments-ledger | capturedAt | — | createdAt, revision |
| PaymentInstrument | payments-ledger | — | — | createdAt, revision |
| PaymentIntent | payments-ledger | — | — | createdAt, revision |
| PaymentRouting | payments-ledger | — | — | createdAt, revision |
| PaymentTerminal | payments-ledger | — | — | createdAt, revision |
| Payout | payments-ledger | scheduledAt, confirmedAt | — | createdAt, revision |
| PayoutBatch | payments-ledger | scheduledAt | — | createdAt, revision |
| ReconciliationResolution | payments-ledger | resolvedAt | — | createdAt, revision |
| Refund | payments-ledger | requestedAt | — | createdAt, revision |
| ServiceDispute | payments-ledger | openedAt, responseDueAt | — | createdAt, revision |
| TopUpOffer | payments-ledger | validFrom, validUntil | — | createdAt, revision |
| Voucher | payments-ledger | validFrom, validUntil | — | createdAt, revision |
| VoucherRedemption | payments-ledger | redeemedAt | — | createdAt, revision |
| Wallet | payments-ledger | balanceAsOf | — | createdAt, revision |
| WalletEntry | payments-ledger | recordedAt | — | createdAt, revision |
| ChargingArea | places | — | — | createdAt, revision |
| ChargingSite | places | — | openingWindow → RecurringWindow | createdAt, revision |
| MediaAsset | places | — | — | createdAt, revision |
| ParkingSpace | places | occupancyObservedAt | — | createdAt, revision |
| PublicListing | places | publishedAt | — | createdAt, revision |
| ServiceNotice | places | validFrom, validUntil | — | createdAt, revision |
| SharingAgreement | places | validFrom, validUntil | — | createdAt, revision |
| SharingInvitation | places | expiresAt | — | createdAt, revision |
| SiteAccessPolicy | places | — | openingWindow → RecurringWindow | createdAt, revision |
| CommercialOffer | pricing | issuedAt, expiresAt | — | createdAt, revision |
| CommercialResponsibility | pricing | validFrom, validUntil | — | createdAt, revision |
| DiscountRule | pricing | — | — | createdAt, revision |
| DynamicPriceFormula | pricing | — | — | createdAt, revision |
| ElectricityPriceInterval | pricing | quotedAt | interval → TimeWindow, recurringWindow → RecurringWindow | createdAt, revision |
| ElectricityPriceSchedule | pricing | — | — | createdAt, revision |
| EnergyMix | pricing | — | reportingPeriod → TimeWindow | createdAt, revision |
| EnergySourceShare | pricing | — | — | createdAt, revision |
| FeeBounds | pricing | — | — | createdAt, revision |
| OfferAcceptance | pricing | acceptedAt | — | createdAt, revision |
| PreauthorizationPolicy | pricing | — | — | createdAt, revision |
| PriceComponent | pricing | — | — | createdAt, revision |
| PriceDisplay | pricing | effectiveAt | — | createdAt, revision |
| PriceFreezePolicy | pricing | — | — | createdAt, revision |
| PriceTier | pricing | — | — | createdAt, revision |
| PricingCondition | pricing | — | — | createdAt, revision |
| RoundingPolicy | pricing | — | — | createdAt, revision |
| ScheduledTariffChange | pricing | effectiveAt | — | createdAt, revision |
| SessionLimitPolicy | pricing | — | — | createdAt, revision |
| SessionPricingPolicy | pricing | — | — | createdAt, revision |
| SubsidyRule | pricing | — | — | createdAt, revision |
| Tariff | pricing | — | — | createdAt, revision |
| TariffAssignment | pricing | — | — | createdAt, revision |
| TariffResolution | pricing | resolvedAt | — | createdAt, revision |
| TariffSet | pricing | — | — | createdAt, revision |
| TariffVersion | pricing | validFrom, validUntil | — | createdAt, revision |
| PublicDataPublication | roaming | publishedAt, validUntil | — | createdAt, revision |
| RoamingBehaviorPolicy | roaming | — | — | createdAt, revision |
| RoamingCommand | roaming | receivedAt | — | createdAt, revision |
| RoamingConnection | roaming | — | — | createdAt, revision |
| RoamingExchange | roaming | acknowledgedAt | — | createdAt, revision |
| RoamingModuleAgreement | roaming | — | — | createdAt, revision |
| RoamingNetwork | roaming | — | — | createdAt, revision |
| RoamingParty | roaming | — | — | createdAt, revision |
| RoamingTariffFilter | roaming | — | — | createdAt, revision |
| RoamingTariffMapping | roaming | importedAt | — | createdAt, revision |
| SynchronizationCursor | roaming | lastSuccessfulAt, watermarkAt | — | createdAt, revision |
| AccessDecision | security-governance | decidedAt | — | createdAt, revision |
| AccessTokenLease | security-governance | issuedAt, expiresAt, revokedAt | — | createdAt, revision |
| AuditEntry | security-governance | eventAt | — | createdAt, revision |
| CertificateLifecycleEvent | security-governance | eventAt | — | createdAt, revision |
| CertificateRecord | security-governance | validFrom, validUntil | — | createdAt, revision |
| ComplianceAssessment | security-governance | assessedAt | — | createdAt, revision |
| ConsentDecision | security-governance | decidedAt | — | createdAt, revision |
| DataDisposition | security-governance | requestedAt, completedAt | — | createdAt, revision |
| DataSubjectRequest | security-governance | receivedAt, responseDueAt, completedAt | — | createdAt, revision |
| EvidenceVerification | security-governance | checkedAt | — | createdAt, revision |
| LegalHold | security-governance | validFrom, reviewAt, releasedAt | — | createdAt, revision |
| PolicyDocument | security-governance | validFrom, validUntil | — | createdAt, revision |
| ProcessingPurpose | security-governance | — | — | createdAt, revision |
| RetentionPolicy | security-governance | — | — | createdAt, revision |
| SecurityEvent | security-governance | eventAt | — | createdAt, revision |
| BillingReadinessAssessment | sessions-metering | assessedAt | — | createdAt, revision |
| ChargeDetailRecord | sessions-metering | receivedAt | period → TimeWindow | createdAt, revision |
| ChargingInterval | sessions-metering | — | interval → TimeWindow | createdAt, revision |
| ChargingSession | sessions-metering | startedAt, endedAt | — | createdAt, revision |
| ClockAssessment | sessions-metering | assessedAt | — | createdAt, revision |
| EventProcessingOutcome | sessions-metering | processedAt | — | createdAt, revision |
| MeterDelta | sessions-metering | — | — | createdAt, revision |
| MeterObservation | sessions-metering | observedAt | — | createdAt, revision |
| MeterRegisterEpoch | sessions-metering | validFrom, validUntil | — | createdAt, revision |
| ProtocolTransaction | sessions-metering | startedAt, endedAt | — | createdAt, revision |
| RecordCorrection | sessions-metering | issuedAt | — | createdAt, revision |
| SessionEndEvidence | sessions-metering | finalizedAt | — | createdAt, revision |
| SessionEvent | sessions-metering | — | — | createdAt, revision |
| SignedMeterEvidence | sessions-metering | verifiedAt | — | createdAt, revision |
| SourceEvent | sessions-metering | occurredAt, receivedAt | — | createdAt, revision |
| UsageAggregate | sessions-metering | — | interval → TimeWindow | createdAt, revision |
| AllowanceBalance | subscriptions-benefits | — | — | createdAt, revision |
| AllowanceConsumption | subscriptions-benefits | recordedAt | — | createdAt, revision |
| BenefitAllowance | subscriptions-benefits | — | — | createdAt, revision |
| BenefitReservation | subscriptions-benefits | expiresAt | — | createdAt, revision |
| BillingPeriod | subscriptions-benefits | — | period → TimeWindow | createdAt, revision |
| CouponConsumption | subscriptions-benefits | consumedAt | — | createdAt, revision |
| EnergyCoupon | subscriptions-benefits | validFrom, validUntil | — | createdAt, revision |
| EnergyCouponTemplate | subscriptions-benefits | validFrom, validUntil | — | createdAt, revision |
| Subscription | subscriptions-benefits | startsAt, endsAt, cancelledAt | — | createdAt, revision |
| SubscriptionBillingPolicy | subscriptions-benefits | — | — | createdAt, revision |
| SubscriptionPlan | subscriptions-benefits | — | — | createdAt, revision |
| AuthorizationDecision | vehicles-authorization | decidedAt, expiresAt | — | createdAt, revision |
| AuthorizationRequest | vehicles-authorization | requestedAt | — | createdAt, revision |
| ChargingCredential | vehicles-authorization | validFrom, validUntil | — | createdAt, revision |
| CredentialAssignment | vehicles-authorization | validFrom, validUntil | — | createdAt, revision |
| LocalAuthorizationEntry | vehicles-authorization | validUntil | — | createdAt, revision |
| LocalAuthorizationList | vehicles-authorization | generatedAt | — | createdAt, revision |
| OfflineAuthorizationAssessment | vehicles-authorization | — | — | createdAt, revision |
| PlugAndChargeEnrollment | vehicles-authorization | — | — | createdAt, revision |
| ProvisioningCertificate | vehicles-authorization | — | — | createdAt, revision |
| Vehicle | vehicles-authorization | — | — | createdAt, revision |
| VehicleAssignment | vehicles-authorization | validFrom, validUntil | — | createdAt, revision |
| VehicleTelemetry | vehicles-authorization | observedAt | — | createdAt, revision |
