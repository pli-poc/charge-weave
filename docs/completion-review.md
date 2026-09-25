# Declared semantic completion baseline — 1.2.0

This release reviews the full declared CPMS domain against actor outcomes, changes, exceptions and ownership. The denominator is the independently stated journey scope, not the historical external catalogue. The review adds 8 concepts and 46 business invariants, strengthens current versus historical authorization and sponsored benefit use, and makes every original business rule distinguish a valid decision from a deliberate violation.

The baseline contains **285 reviewed concepts, 18 modules, 137 requirements, 20 journeys and 218 business rules**. There are **438 focused acceptance decisions** and **65 additional complete interaction scenarios**, alongside the 26 original journey graphs, 14 prior adversarial cases and 24 lifecycle decisions. The independent arithmetic/timezone gate has 1,023 checks. Counts describe evidence to execute; current pass/fail status comes from the Actions run for the exact commit.

## Completion criteria enforced in the repository

- Every declared journey has a normal outcome, exception outcome, change/termination treatment and assigned business and financial responsibility. All six lifecycle treatments are retained.
- Every concept has reviewed field paths, an accountable journey, associated requirements and a fingerprint of its reviewed source contract. A changed contract fails the gate until its review is updated.
- Every business invariant has concrete valid and invalid focused evidence; the all-class fixture, structural boundaries, OWL checks and trust-boundary tests remain separate gates.
- Every new invariant is exercised in complete interaction data, with a positive business assertion and a negative case naming the exact expected rule.
- Decimal rounding is compared with an independent Decimal oracle across four modes, seven scales, both signs, ties, neighboring values and large amounts. IANA time interpretation uses pinned tzdata 2026.3, including repeated and nonexistent local times.
- Generated outputs must reproduce from source. Packaging requires fresh reports from all 40 verification jobs, including coverage, focused tests, complete interactions and independent oracles.

`tools/check_completeness.py` checks the evidence contract; it does not replace executing the evidence. The 40 jobs must all succeed before a package exists. Supporting data concepts are explicitly identified as structural contracts where no class-specific business invariant is asserted. This prevents a class count from masquerading as implemented behavior.

## Substantive closures

| Area | Implemented contract | Rules |
|---|---|---|
| Historical authority and sponsorship | Immutable decision-time grant facts; separately funded beneficiary and usage-time scope | B173–174; strengthened B157, B171 |
| Financial reconciliation | Allocation-backed collection, write-off evidence, wallet statement interval, period close and original-responsibility late adjustments | B175–180 |
| Pricing and time | Signed rounding, directional conversion, line totals, supply-time tax validity and offset/UTC/IANA agreement | B181–186; supplemental IANA constraint |
| Settlement and privacy | Distinct economic legs, duplicate-leg identity, retained rights outcomes and record-scoped holds | B187–190 |
| Process and operational closure | Required steps, predecessor ordering, actual blocking issues/grants/sessions, ownership and processing chronology | B191–199 |
| Payment, energy and service evidence | Refund/chargeback limits, actual payout holder, signed flexibility, concurrent cabinet capacity, service closure and synchronization chronology | B200–208 |
| State-to-evidence reconciliation | Payment/capture state, refund chronology, paid invoice evidence, allocation source, positive credits, refunded-money availability, subscription exit and actual settlement differences | B209–218 |

## Journey acceptance baseline

| Journey | Normal outcome | Change / termination | Exception outcome |
|---|---|---|---|
| J01 | A versioned accepted agreement allocates supplier, obligations and financial ownership. | Amendment preserves prior terms; termination retains residual ownership and historical usage responsibility. | Reject missing acceptance, unsupported fulfilled duties and responsibility outside contract validity. |
| J02 | A customer can receive scoped entitlements, operate and close with remaining liability assigned. | Suspension or revocation stops current access; account closure agrees with actual scoped grants. | Reject entitlement beyond funding validity, retained active grants and unowned residual debt. |
| J03 | An identified station and topology have compatible equipment and evidence-backed operational acceptance. | Ownership transfer, replacement and retirement preserve identity and reconcile unfinished charging. | Reject missing acceptance, self-transfer, topology contradictions and concealed unfinished sessions. |
| J04 | A driver can discover a compatible offer, see a matching price/currency and accept it within validity. | Offer versions and reservation expiry preserve the exact accepted terms, including ad hoc purchase. | Reject mandatory ad hoc registration, wrong tariff/currency, expired acceptance and incompatible connectors. |
| J05 | Credential or free-access identity and unit scope produce time-valid charging authorization. | Offline policy bounds cache age, revocation, unknown credentials and economic exposure. | Reject wrong-unit, expired, revoked or over-exposure admission. |
| J06 | Charging state, commands and event processing distinguish acknowledged, completed, failed and recovered work. | Duplicate and quarantined deliveries retain original identity and produce no repeated business effect. | Reject premature success, illegal transitions, duplicate application and processing before receipt. |
| J07 | Measured or estimated usage retains meter epoch, unit, direction, multiplier, ordering and evidence. | Clock anomalies, resets and reconciliation remain explicit rather than silently inventing usage. | Reject mismatched epochs, invalid deltas and billability with unresolved blocking issues. |
| J08 | Immutable tariff selection, rated lines, tax, rounding and readiness support an attributable charge record. | Credits and corrections preserve lineage; taxable time and repeated local hours remain reconstructable. | Reject wrong totals/currency, invalid rounding, DST ambiguity, unresolved billing and duplicate or mismatched credits. |
| J09 | Invoices, confirmed collection allocations, wallet movements and journals reconcile within currencies. | Partial credit, refund, write-off and late adjustments retain original evidence and posting-period responsibility. | Reject overcollection, unsupported write-off, unbalanced journals, fictitious collected totals and closed-period posting. |
| J10 | Roaming parties, negotiated modules, exchanges and qualified identities support financial reconciliation. | A missing side remains genuinely absent with a locator; replay and correction retain source evidence. | Reject invented counterpart records, unresolved closure and corrections without immutable lineage. |
| J11 | A claimant can lodge a service dispute or payment-network chargeback with accountable response evidence. | Remedy and closure retain a decision; unresolved liability suspends collection escalation. | Reject escalation around an omitted dispute link, unsupported remedy and capture/currency contradictions. |
| J12 | Settlement batches and distinct economic legs identify parties, agreement, currency and item totals. | Multiple intermediaries and directional currency conversion preserve each economic obligation. | Reject wrong-party or duplicate legs, unbalanced batches and approval with unresolved differences. |
| J13 | Eligible home charging binds employee, personal station, measured energy, rate, amount and payout beneficiary. | Claim approval and correction preserve the exact entitlement; paid status needs confirmed disbursement. | Reject overclaimed energy, changed approval facts and payout to a different account holder. |
| J14 | Subscription and benefit contracts define dimension, billing period, balance, reservation and consumption. | Renewal, expiry and sponsorship preserve period and beneficiary scope while releasing or reconciling exposure. | Reject missing money currency, inconsistent balances, unbacked consumption and unauthorized sponsorship. |
| J15 | Energy topology, schedules and control decisions obey safety, contract, hardware and export constraints. | Override authorization is scoped and bounded; flexibility delivery records signed baseline difference. | Reject overlapping cabinet over-allocation, infeasible power, out-of-window controls and unauthorized export. |
| J16 | A controller can record verified rights fulfilment or reasoned refusal with purpose and retention evidence. | Closure preserves the outcome; account-scoped and explicitly record-scoped holds survive omitted direct links. | Reject unsupported completion, false identity verification and disposition under an active applicable hold. |
| J17 | Tenant-isolated principals, permissions, scopes, certificates and evidence support attributable authorization. | Revocation blocks current permits without rewriting valid historical decision-time snapshots. | Reject disabled-principal current permits, scope mismatch, forged schema metadata and unsupported historical permits. |
| J18 | Installation, maintenance and service-level measurements retain accepted work and accountable remedies. | Firmware compatibility, downtime treatment and restoration exercises preserve evidence of recovery. | Reject unsupported completed work, inaccurate availability, missing closure evidence and missed recovery objectives. |
| J19 | Versioned integrations declare supported features, identity mappings and successful synchronization state. | Migration reconciles expected records and revokes obsolete credentials while preserving source evidence. | Reject contradictory capabilities, impossible watermarks, unreconciled imports and unrevoked source access. |
| J20 | An accountable process links ordered required steps to concrete inputs, outputs, obligations and evidence. | Failures retain compensation and history; current snapshots agree with valid acyclic transitions. | Reject skipped required work, circular or foreign predecessors, duplicate sequences and unsupported completion. |

## Concept review inventory

Full field-level review records and contract fingerprints are committed in `requirements/concept-review.json`. Data-contract entries verify representation and link to their business use; they do not imply a separately implemented controller, adapter or commercial algorithm.

| Concept | Module | Accountable journey | Validation mode | Requirements |
|---|---|---|---|---|
| Tenant | foundation | J17 | structural-data-contract | BR-001 |
| Record | foundation | J17 | structural-and-business | BR-001 |
| ExternalIdentifier | foundation | J17 | structural-data-contract | BR-001 |
| EvidenceDocument | foundation | J17 | structural-data-contract | BR-158, BR-173, BR-174, BR-175, BR-176, BR-178, BR-180, BR-182, BR-183, BR-186, BR-187, BR-188, BR-189, BR-190, BR-191, BR-192, BR-193, BR-195, BR-196, BR-197, BR-199, BR-201, BR-203, BR-205, BR-207, BR-213, BR-214, BR-218 |
| TimeWindow | foundation | J15 | structural-and-business | BR-012, BR-178, BR-217 |
| RecurringWindow | foundation | J15 | structural-and-business | BR-012 |
| Address | foundation | J17 | structural-data-contract | BR-001 |
| GeoPosition | foundation | J17 | structural-data-contract | BR-001 |
| Currency | foundation | J09 | structural-data-contract | BR-014, BR-175, BR-176, BR-177, BR-180, BR-181, BR-182, BR-183, BR-184, BR-185, BR-187, BR-188, BR-195, BR-199, BR-200, BR-201, BR-202, BR-209, BR-210, BR-211, BR-212, BR-213, BR-214, BR-215, BR-217 |
| ExchangeRate | foundation | J09 | structural-data-contract | BR-014, BR-182 |
| Quantity | foundation | J17 | structural-data-contract | BR-001 |
| Annotation | foundation | J17 | structural-data-contract | BR-001 |
| CustomFieldDefinition | foundation | J19 | structural-data-contract | BR-002 |
| CustomFieldValue | foundation | J19 | structural-and-business | BR-002 |
| LegalEntity | identity | J01 | structural-data-contract | BR-124, BR-175, BR-176, BR-178, BR-185, BR-187, BR-188, BR-189, BR-191, BR-192, BR-193, BR-194, BR-195, BR-196, BR-198, BR-199, BR-202, BR-207, BR-212, BR-214, BR-218 |
| Person | identity | J02 | structural-data-contract | BR-114 |
| ContactProfile | identity | J02 | structural-data-contract | BR-114 |
| PartyRole | identity | J01 | structural-data-contract | BR-124 |
| OperatorService | identity | J02 | structural-and-business | BR-003, BR-114 |
| Principal | identity | J17 | structural-data-contract | BR-157, BR-173, BR-180, BR-218 |
| Permission | identity | J17 | structural-data-contract | BR-157, BR-173 |
| SecurityRole | identity | J17 | structural-data-contract | BR-157 |
| AccessGrant | identity | J17 | structural-data-contract | BR-157, BR-173 |
| ManagementDelegation | identity | J01 | structural-data-contract | BR-124 |
| CustomerAccount | identity | J02 | structural-data-contract | BR-114, BR-174, BR-177, BR-189, BR-190, BR-194, BR-195, BR-199, BR-208, BR-209, BR-216 |
| CustomerGroup | identity | J02 | structural-data-contract | BR-114 |
| GroupMembership | identity | J02 | structural-data-contract | BR-114 |
| UserDevice | identity | J04 | structural-data-contract | BR-021 |
| ChargingSite | places | J04 | structural-data-contract | BR-003, BR-005, BR-204 |
| ChargingArea | places | J04 | structural-data-contract | BR-003, BR-005 |
| ParkingSpace | places | J04 | structural-and-business | BR-003, BR-005 |
| PublicListing | places | J04 | structural-and-business | BR-005 |
| SiteAccessPolicy | places | J04 | structural-data-contract | BR-005 |
| ServiceNotice | places | J04 | structural-data-contract | BR-005 |
| MediaAsset | places | J04 | structural-data-contract | BR-021 |
| SharingAgreement | places | J04 | structural-data-contract | BR-005 |
| SharingInvitation | places | J04 | structural-data-contract | BR-005 |
| Manufacturer | assets | J03 | structural-data-contract | BR-003 |
| EquipmentModel | assets | J03 | structural-data-contract | BR-003 |
| DeviceCapability | assets | J03 | structural-data-contract | BR-003 |
| ChargingStation | assets | J03 | structural-and-business | BR-003, BR-116, BR-196, BR-197 |
| ChargingUnit | assets | J03 | structural-and-business | BR-003, BR-004, BR-204, BR-208 |
| Connector | assets | J03 | structural-data-contract | BR-003 |
| ElectricityMeter | assets | J07 | structural-data-contract | BR-129 |
| CalibrationRecord | assets | J07 | structural-data-contract | BR-129 |
| ElectricalCircuit | assets | J03 | structural-and-business | BR-003 |
| ElectricalConnection | assets | J03 | structural-data-contract | BR-003 |
| OwnershipTransfer | assets | J03 | structural-and-business | BR-003, BR-197 |
| ProtocolEndpoint | device-management | J19 | structural-data-contract | BR-165 |
| ConfigurationVariable | device-management | J18 | structural-data-contract | BR-019 |
| ConfigurationTemplate | device-management | J18 | structural-data-contract | BR-019 |
| ConfigurationTemplateEntry | device-management | J18 | structural-data-contract | BR-019 |
| TemplateApplication | device-management | J18 | structural-data-contract | BR-019 |
| FirmwareRelease | device-management | J18 | structural-data-contract | BR-019 |
| FirmwareDeployment | device-management | J18 | structural-and-business | BR-019 |
| HardwareStatusObservation | device-management | J18 | structural-data-contract | BR-019 |
| ConnectionObservation | device-management | J18 | structural-data-contract | BR-019 |
| DiagnosticArtifact | device-management | J18 | structural-data-contract | BR-019 |
| Vehicle | vehicles-authorization | J05 | structural-data-contract | BR-006, BR-208 |
| VehicleAssignment | vehicles-authorization | J05 | structural-data-contract | BR-006 |
| VehicleTelemetry | vehicles-authorization | J05 | structural-data-contract | BR-006 |
| ChargingCredential | vehicles-authorization | J05 | structural-data-contract | BR-006 |
| CredentialAssignment | vehicles-authorization | J05 | structural-data-contract | BR-006 |
| AuthorizationRequest | vehicles-authorization | J05 | structural-and-business | BR-006 |
| AuthorizationDecision | vehicles-authorization | J05 | structural-and-business | BR-006, BR-208 |
| LocalAuthorizationList | vehicles-authorization | J05 | structural-data-contract | BR-006 |
| LocalAuthorizationEntry | vehicles-authorization | J05 | structural-data-contract | BR-006 |
| PlugAndChargeEnrollment | vehicles-authorization | J05 | structural-data-contract | BR-006 |
| ProvisioningCertificate | vehicles-authorization | J05 | structural-data-contract | BR-006 |
| RemoteCommand | commands-booking | J06 | structural-and-business | BR-024 |
| CommandParameter | commands-booking | J06 | structural-data-contract | BR-024 |
| CommandOutcome | commands-booking | J06 | structural-data-contract | BR-024 |
| BookingRequest | commands-booking | J04 | structural-data-contract | BR-026 |
| Booking | commands-booking | J04 | structural-data-contract | BR-026 |
| Reservation | commands-booking | J04 | structural-and-business | BR-026, BR-208 |
| SourceEvent | sessions-metering | J06 | structural-and-business | BR-009, BR-126, BR-198 |
| ChargingSession | sessions-metering | J06 | structural-and-business | BR-006, BR-007, BR-183, BR-193, BR-208, BR-209 |
| ProtocolTransaction | sessions-metering | J06 | structural-data-contract | BR-007 |
| SessionEvent | sessions-metering | J06 | structural-data-contract | BR-126 |
| ChargingInterval | sessions-metering | J06 | structural-data-contract | BR-007, BR-184 |
| MeterObservation | sessions-metering | J07 | structural-data-contract | BR-129 |
| SignedMeterEvidence | sessions-metering | J07 | structural-and-business | BR-009 |
| SessionEndEvidence | sessions-metering | J06 | structural-data-contract | BR-007, BR-208 |
| UsageAggregate | sessions-metering | J06 | structural-data-contract | BR-007 |
| ChargeDetailRecord | sessions-metering | J08 | structural-and-business | BR-010, BR-132, BR-133, BR-187, BR-188 |
| AmountRounding | pricing | J08 | structural-and-business | BR-181, BR-182, BR-184 |
| PricingTimeResolution | pricing | J08 | structural-and-business | BR-186 |
| Tariff | pricing | J08 | structural-data-contract | BR-008 |
| TariffVersion | pricing | J08 | structural-and-business | BR-008, BR-183, BR-199, BR-208 |
| PriceComponent | pricing | J08 | structural-and-business | BR-008, BR-184 |
| PricingCondition | pricing | J08 | structural-data-contract | BR-008 |
| TariffSet | pricing | J08 | structural-and-business | BR-008 |
| TariffAssignment | pricing | J08 | structural-data-contract | BR-008 |
| TariffResolution | pricing | J08 | structural-data-contract | BR-008, BR-183 |
| ScheduledTariffChange | pricing | J08 | structural-data-contract | BR-008 |
| DynamicPriceFormula | pricing | J08 | structural-and-business | BR-008 |
| ElectricityPriceSchedule | pricing | J08 | structural-data-contract | BR-008 |
| ElectricityPriceInterval | pricing | J08 | structural-and-business | BR-008, BR-012 |
| EnergyMix | pricing | J08 | structural-and-business | BR-008, BR-012 |
| EnergySourceShare | pricing | J08 | structural-data-contract | BR-008 |
| PriceDisplay | pricing | J04 | structural-data-contract | BR-120, BR-199 |
| RoundingPolicy | pricing | J08 | structural-data-contract | BR-181, BR-184 |
| SessionLimitPolicy | pricing | J08 | structural-data-contract | BR-008 |
| BillingProfile | billing-tax | J09 | structural-data-contract | BR-013, BR-212 |
| TaxIdentifier | billing-tax | J09 | structural-data-contract | BR-013 |
| TaxRule | billing-tax | J09 | structural-data-contract | BR-013, BR-185 |
| TaxDetermination | billing-tax | J09 | structural-and-business | BR-013, BR-184, BR-185 |
| RatingCalculation | billing-tax | J09 | structural-and-business | BR-008, BR-013, BR-183 |
| RatedLine | billing-tax | J09 | structural-and-business | BR-013, BR-183, BR-184 |
| Invoice | billing-tax | J09 | structural-and-business | BR-013, BR-209, BR-212, BR-214, BR-217 |
| InvoiceLine | billing-tax | J09 | structural-data-contract | BR-013, BR-212 |
| CreditNote | billing-tax | J09 | structural-and-business | BR-013, BR-169, BR-214 |
| Receipt | billing-tax | J09 | structural-data-contract | BR-013 |
| DocumentNumberSequence | billing-tax | J09 | structural-data-contract | BR-013, BR-212 |
| FiscalizationAttempt | billing-tax | J09 | structural-and-business | BR-013, BR-020 |
| CustomFee | billing-tax | J09 | structural-data-contract | BR-013 |
| AccountingPeriod | payments-ledger | J09 | structural-and-business | BR-178, BR-179, BR-180 |
| PeriodAdjustment | payments-ledger | J09 | structural-and-business | BR-180 |
| CurrencyConversion | payments-ledger | J12 | structural-and-business | BR-182 |
| PaymentInstrument | payments-ledger | J09 | structural-data-contract | BR-014, BR-209 |
| PaymentIntent | payments-ledger | J09 | structural-and-business | BR-014, BR-209, BR-210, BR-215 |
| PaymentAuthorization | payments-ledger | J09 | structural-and-business | BR-014, BR-210, BR-215 |
| PaymentCapture | payments-ledger | J09 | structural-and-business | BR-014, BR-138, BR-200, BR-201, BR-210, BR-211, BR-213, BR-215 |
| Refund | payments-ledger | J09 | structural-and-business | BR-014, BR-200, BR-211 |
| Chargeback | payments-ledger | J09 | structural-and-business | BR-014, BR-201 |
| Wallet | payments-ledger | J09 | structural-and-business | BR-017, BR-177 |
| WalletEntry | payments-ledger | J09 | structural-data-contract | BR-177 |
| LedgerAccount | payments-ledger | J09 | structural-data-contract | BR-015 |
| Journal | payments-ledger | J09 | structural-and-business | BR-015, BR-179 |
| JournalLine | payments-ledger | J09 | structural-and-business | BR-015, BR-179 |
| TopUpOffer | payments-ledger | J09 | structural-data-contract | BR-014 |
| Voucher | payments-ledger | J09 | structural-data-contract | BR-014 |
| VoucherRedemption | payments-ledger | J09 | structural-and-business | BR-014, BR-017 |
| PaymentTerminal | payments-ledger | J09 | structural-and-business | BR-003, BR-014 |
| AllowanceSponsorship | subscriptions-benefits | J14 | structural-and-business | BR-174 |
| SubscriptionPlan | subscriptions-benefits | J14 | structural-data-contract | BR-148, BR-216 |
| Subscription | subscriptions-benefits | J14 | structural-and-business | BR-148, BR-216, BR-217 |
| BillingPeriod | subscriptions-benefits | J14 | structural-and-business | BR-148, BR-217 |
| BenefitAllowance | subscriptions-benefits | J14 | structural-data-contract | BR-148 |
| AllowanceConsumption | subscriptions-benefits | J14 | structural-data-contract | BR-148 |
| EnergyCouponTemplate | subscriptions-benefits | J14 | structural-and-business | BR-017 |
| EnergyCoupon | subscriptions-benefits | J14 | structural-and-business | BR-017 |
| CouponConsumption | subscriptions-benefits | J14 | structural-and-business | BR-017 |
| SettlementLeg | partners-settlement | J12 | structural-and-business | BR-027, BR-187, BR-188 |
| ServiceAgreement | partners-settlement | J01 | structural-and-business | BR-110, BR-174, BR-187, BR-188, BR-194, BR-207 |
| RevenueShareRule | partners-settlement | J12 | structural-data-contract | BR-027 |
| CostAllocationRule | partners-settlement | J12 | structural-data-contract | BR-027 |
| SettlementOverride | partners-settlement | J12 | structural-data-contract | BR-027 |
| SettlementBatch | partners-settlement | J12 | structural-and-business | BR-027, BR-145, BR-187, BR-188, BR-202, BR-218 |
| SettlementItem | partners-settlement | J12 | structural-data-contract | BR-027 |
| ReconciliationCase | partners-settlement | J12 | structural-and-business | BR-027, BR-139, BR-140 |
| PartnerInvitation | partners-settlement | J01 | structural-data-contract | BR-110 |
| CorporateBillingPolicy | partners-settlement | J13 | structural-data-contract | BR-016 |
| CorporateChargerRule | partners-settlement | J13 | structural-and-business | BR-016 |
| CorporateBillingSnapshot | partners-settlement | J13 | structural-and-business | BR-016 |
| CorporateCostAllocation | partners-settlement | J13 | structural-and-business | BR-016 |
| ReimbursementPolicy | partners-settlement | J13 | structural-and-business | BR-016, BR-025 |
| ReimbursementRecord | partners-settlement | J13 | structural-and-business | BR-016, BR-147, BR-202 |
| ReimbursementReport | partners-settlement | J13 | structural-data-contract | BR-016 |
| RoamingNetwork | roaming | J10 | structural-data-contract | BR-139 |
| RoamingParty | roaming | J10 | structural-data-contract | BR-139 |
| RoamingConnection | roaming | J10 | structural-data-contract | BR-139, BR-206 |
| RoamingModuleAgreement | roaming | J10 | structural-data-contract | BR-139 |
| RoamingExchange | roaming | J10 | structural-data-contract | BR-139 |
| RoamingCommand | roaming | J10 | structural-data-contract | BR-139 |
| SynchronizationCursor | roaming | J10 | structural-and-business | BR-139, BR-206 |
| RoamingTariffMapping | roaming | J10 | structural-data-contract | BR-139 |
| RoamingTariffFilter | roaming | J10 | structural-data-contract | BR-139 |
| PublicDataPublication | roaming | J10 | structural-data-contract | BR-139 |
| GridConnection | energy | J15 | structural-data-contract | BR-011 |
| LoadControlGroup | energy | J15 | structural-and-business | BR-003, BR-011 |
| ControlGroupMembership | energy | J15 | structural-data-contract | BR-011 |
| PowerConstraint | energy | J15 | structural-data-contract | BR-011 |
| PhaseCurrentConstraint | energy | J15 | structural-data-contract | BR-011 |
| PriorityRule | energy | J15 | structural-data-contract | BR-011 |
| SmartChargingPreference | energy | J15 | structural-data-contract | BR-011 |
| ChargingSchedule | energy | J15 | structural-and-business | BR-011 |
| SchedulePeriod | energy | J15 | structural-and-business | BR-011, BR-012 |
| ScheduleApplication | energy | J15 | structural-data-contract | BR-011 |
| UnmanagedLoadObservation | energy | J15 | structural-data-contract | BR-011 |
| EnergyForecast | energy | J15 | structural-data-contract | BR-011 |
| ForecastPoint | energy | J15 | structural-and-business | BR-011 |
| DemandResponseProgram | energy | J15 | structural-data-contract | BR-011 |
| FlexibilityAsset | energy | J15 | structural-data-contract | BR-011 |
| FlexibilityActivation | energy | J15 | structural-data-contract | BR-011, BR-203 |
| FlexibilityDelivery | energy | J15 | structural-and-business | BR-203 |
| DistributedEnergyAsset | energy | J15 | structural-data-contract | BR-011 |
| VendorFaultDefinition | operations | J18 | structural-data-contract | BR-019 |
| Issue | operations | J18 | structural-data-contract | BR-019 |
| RecoveryPolicy | operations | J18 | structural-data-contract | BR-019 |
| RecoveryAttempt | operations | J18 | structural-data-contract | BR-019 |
| WorkOrder | operations | J18 | structural-and-business | BR-019, BR-205 |
| InstallationJob | operations | J18 | structural-and-business | BR-019 |
| OperationalPeriod | operations | J18 | structural-data-contract | BR-018 |
| DowntimePeriod | operations | J18 | structural-data-contract | BR-018 |
| AvailabilityPolicy | operations | J18 | structural-data-contract | BR-018, BR-019 |
| AvailabilityResult | operations | J18 | structural-and-business | BR-018, BR-019, BR-205 |
| AuthorizationSnapshot | security-governance | J17 | structural-data-contract | BR-157, BR-173 |
| CertificateRecord | security-governance | J17 | structural-data-contract | BR-157 |
| CertificateLifecycleEvent | security-governance | J17 | structural-data-contract | BR-157 |
| SecurityEvent | security-governance | J17 | structural-data-contract | BR-157 |
| AuditEntry | security-governance | J17 | structural-data-contract | BR-157 |
| PolicyDocument | security-governance | J16 | structural-data-contract | BR-152 |
| ConsentDecision | security-governance | J16 | structural-data-contract | BR-152 |
| RetentionPolicy | security-governance | J16 | structural-data-contract | BR-154, BR-190 |
| DataDisposition | security-governance | J16 | structural-and-business | BR-154, BR-190 |
| ComplianceAssessment | security-governance | J16 | structural-data-contract | BR-152 |
| IntegrationConnection | integration-experience | J19 | structural-data-contract | BR-165 |
| ApiClient | integration-experience | J19 | structural-data-contract | BR-165 |
| EventSubscription | integration-experience | J19 | structural-data-contract | BR-023, BR-165 |
| EventDelivery | integration-experience | J19 | structural-and-business | BR-023, BR-165 |
| CommunicationLog | integration-experience | J19 | structural-data-contract | BR-165 |
| PlatformSetting | integration-experience | J19 | structural-data-contract | BR-165 |
| BrandProfile | integration-experience | J04 | structural-and-business | BR-021 |
| ExperienceChannel | integration-experience | J04 | structural-data-contract | BR-021 |
| ContentTemplate | integration-experience | J04 | structural-data-contract | BR-021 |
| HelpArticle | integration-experience | J04 | structural-data-contract | BR-021 |
| CustomerNotification | integration-experience | J04 | structural-data-contract | BR-021 |
| ApplicationInstallation | integration-experience | J04 | structural-data-contract | BR-021 |
| MetricDefinition | integration-experience | J18 | structural-data-contract | BR-018 |
| MetricObservation | integration-experience | J18 | structural-data-contract | BR-018 |
| AssistantRecommendation | integration-experience | J17 | structural-data-contract | BR-022 |
| ActionApproval | integration-experience | J17 | structural-and-business | BR-022 |
| StateTransition | foundation | J20 | structural-and-business | BR-007, BR-164 |
| DiscountRule | pricing | J08 | structural-and-business | BR-008 |
| FeeBounds | pricing | J08 | structural-and-business | BR-008 |
| PriceTier | pricing | J08 | structural-and-business | BR-008 |
| PriceFreezePolicy | pricing | J08 | structural-data-contract | BR-008 |
| SessionPricingPolicy | pricing | J08 | structural-and-business | BR-008 |
| PreauthorizationPolicy | pricing | J08 | structural-and-business | BR-008, BR-014 |
| SubsidyRule | pricing | J08 | structural-data-contract | BR-008 |
| FinancialAccountReference | payments-ledger | J09 | structural-data-contract | BR-014, BR-202 |
| PaymentRouting | payments-ledger | J09 | structural-data-contract | BR-014, BR-209 |
| Payout | payments-ledger | J09 | structural-and-business | BR-014, BR-202 |
| PayoutBatch | payments-ledger | J09 | structural-and-business | BR-014 |
| PowerCabinet | energy | J15 | structural-and-business | BR-004, BR-204 |
| PowerModuleAllocation | energy | J15 | structural-and-business | BR-004, BR-204 |
| ChargingProfile | energy | J15 | structural-and-business | BR-011 |
| RoamingBehaviorPolicy | roaming | J10 | structural-data-contract | BR-139 |
| AccessTokenLease | security-governance | J17 | structural-and-business | BR-028 |
| SubscriptionBillingPolicy | subscriptions-benefits | J14 | structural-data-contract | BR-148 |
| ReimbursementTaxCalculation | partners-settlement | J13 | structural-data-contract | BR-016 |
| ClockAssessment | sessions-metering | J07 | structural-data-contract | BR-009 |
| ContractObligation | partners-settlement | J01 | structural-and-business | BR-111, BR-191, BR-192 |
| ObligationAssessment | partners-settlement | J01 | structural-data-contract | BR-111 |
| AgreementLifecycleEvent | partners-settlement | J12 | structural-and-business | BR-027, BR-112, BR-113 |
| SettlementApproval | partners-settlement | J12 | structural-and-business | BR-027, BR-144, BR-218 |
| ReimbursementApproval | partners-settlement | J12 | structural-and-business | BR-027, BR-146 |
| ServiceEntitlement | identity | J02 | structural-and-business | BR-114, BR-194 |
| AccountClosure | identity | J02 | structural-and-business | BR-114, BR-115, BR-195 |
| AssetLifecycleEvent | assets | J03 | structural-and-business | BR-003, BR-118, BR-196 |
| OperationalAcceptance | assets | J03 | structural-and-business | BR-003, BR-117 |
| ConnectorCompatibility | assets | J03 | structural-and-business | BR-003, BR-119 |
| CommercialOffer | pricing | J04 | structural-and-business | BR-120, BR-121, BR-199 |
| OfferAcceptance | pricing | J04 | structural-and-business | BR-122, BR-123 |
| CommercialResponsibility | pricing | J01 | structural-and-business | BR-124, BR-180, BR-207, BR-208, BR-212 |
| OfflineAuthorizationAssessment | vehicles-authorization | J05 | structural-and-business | BR-006, BR-125 |
| EventProcessingOutcome | sessions-metering | J06 | structural-and-business | BR-126, BR-127, BR-128, BR-198 |
| MeterRegisterEpoch | sessions-metering | J07 | structural-data-contract | BR-129 |
| MeterDelta | sessions-metering | J07 | structural-and-business | BR-129, BR-130 |
| BillingReadinessAssessment | sessions-metering | J08 | structural-and-business | BR-131, BR-193, BR-208 |
| RecordCorrection | sessions-metering | J08 | structural-and-business | BR-010, BR-134 |
| FinancialPosition | payments-ledger | J09 | structural-and-business | BR-135, BR-136, BR-175, BR-176, BR-213 |
| PaymentAllocation | payments-ledger | J09 | structural-and-business | BR-014, BR-137, BR-210, BR-213, BR-215 |
| ReconciliationResolution | payments-ledger | J09 | structural-and-business | BR-014, BR-141 |
| ServiceDispute | payments-ledger | J11 | structural-and-business | BR-142 |
| DunningAction | payments-ledger | J11 | structural-and-business | BR-143 |
| BenefitReservation | subscriptions-benefits | J14 | structural-and-business | BR-148 |
| ControlDecision | energy | J15 | structural-and-business | BR-011, BR-149, BR-150, BR-151 |
| OverrideAuthorization | energy | J15 | structural-data-contract | BR-151 |
| ExportAgreement | energy | J15 | structural-data-contract | BR-150 |
| DataSubjectRequest | security-governance | J16 | structural-and-business | BR-152, BR-153, BR-189 |
| LegalHold | security-governance | J16 | structural-and-business | BR-155, BR-190 |
| ProcessingPurpose | security-governance | J16 | structural-and-business | BR-156 |
| AccessDecision | security-governance | J17 | structural-and-business | BR-157, BR-173 |
| EvidenceVerification | security-governance | J17 | structural-and-business | BR-158 |
| ServiceLevelCommitment | operations | J18 | structural-and-business | BR-019, BR-159, BR-205 |
| ServiceLevelBreach | operations | J18 | structural-and-business | BR-019, BR-160, BR-205 |
| RecoveryExercise | operations | J18 | structural-and-business | BR-019, BR-161 |
| ProtocolProfile | integration-experience | J19 | structural-and-business | BR-165 |
| MigrationBatch | integration-experience | J19 | structural-and-business | BR-162 |
| LifecycleSnapshot | integration-experience | J20 | structural-and-business | BR-163 |
| ProcessExecution | integration-experience | J20 | structural-and-business | BR-166, BR-168 |
| ProcessStep | integration-experience | J20 | structural-and-business | BR-166, BR-167, BR-191, BR-192 |
| AllowanceBalance | subscriptions-benefits | J14 | structural-and-business | BR-170, BR-171, BR-172 |

## Interpretation and remaining external acceptance

The result is a finite engineering baseline for the declared semantic model. No identified finding in this review is left as a documentation-only fix. It is not independent stakeholder sign-off, an exhaustive proof over every possible commercial arrangement, or a completed CPMS runtime. New market requirements require another explicit scope review.

The runtime obligations remain assigned in `requirements/scope.json`: actual charger/protocol behavior, atomic storage and authorization, payment execution, policy-complete pricing engines and jurisdictional tax decisions, physical safety, actual erasure, recovery/scale and user experience. The added rounding and time calculations close concrete semantic gaps; they do not implement every tariff algorithm or fiscal certification.

See [migration](migration-to-v1.2.md), [business policies](business-policy-decisions.md), [requirements](business-requirements.md) and [GitHub Actions](https://github.com/pli-poc/charge-weave/actions/workflows/ontology-ci.yml).
