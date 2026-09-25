# Cross-domain business validation

These are canonical domain policies. Vendor-specific restrictions belong in the separate External platform compatibility profile. SELECT results are violations; absence of rows is meaningful only after structural validation over a complete authorized snapshot.

| Rule | Target | Invariant |
|---|---|---|
| B001 | Record | Tenant-owned object references must remain within the same tenant. |
| B002 | Record | Canonical IDs are unique across all records within a tenant. |
| B003 | Record | Record cannot instantiate explicitly disjoint domain classes. |
| B004 | Record | Unknown predicates in the controlled namespace are rejected. |
| B005 | CustomFieldValue | Extension value datatype must match its declared definition. |
| B006 | OperatorService | Operator service hierarchy must be acyclic. |
| B007 | ChargingStation | Gateway station chains must be acyclic. |
| B008 | ChargingStation | Direct communication requires a protocol endpoint. |
| B009 | ChargingStation | Gateway communication requires a gateway station. |
| B010 | ChargingStation | Commercial stations require a physical site. |
| B011 | ChargingStation | Personal stations require an owner account. |
| B012 | ChargingStation | Charging area and station site must agree. |
| B013 | ParkingSpace | Parking area and bay site must agree. |
| B014 | PaymentTerminal | A payment terminal must serve exactly one station or area. |
| B015 | ElectricalCircuit | Physical circuit hierarchy must be acyclic. |
| B016 | LoadControlGroup | Virtual control hierarchy must be acyclic. |
| B017 | ElectricalCircuit | Nested physical circuits must remain on the same site. |
| B018 | LoadControlGroup | Nested control groups must remain on the same site. |
| B019 | ChargingUnit | Minimum current cannot exceed maximum current. |
| B020 | PublicListing | Unknown payment availability cannot assert payment-option values. |
| B021 | AuthorizationRequest | Non-free authorization requires a credential or customer reference. |
| B022 | AuthorizationDecision | Authorization decision cannot predate its request. |
| B023 | ChargingSession | Completed sessions require end time and end evidence. |
| B024 | ChargingSession | Session end cannot precede session start. |
| B025 | ChargingSession | Finalization evidence must describe the same session. |
| B026 | ChargingSession | Active charging requires accepted authorization. |
| B027 | ChargingSession | Selected tariff must be effective at session start. |
| B028 | ChargingSession | Authorization target must match the charged unit. |
| B029 | SourceEvent | A source timestamp ahead of receipt time requires a documented clock assessment. |
| B030 | SignedMeterEvidence | A verified signature must have a verification timestamp. |
| B031 | ChargeDetailRecord | Local CDRs require a completed canonical session. |
| B032 | ChargeDetailRecord | Original local CDR import and export energy must agree with the canonical session. |
| B033 | ChargeDetailRecord | CDR correction lineage must be acyclic. |
| B034 | TariffVersion | Priced tariffs require at least one price component. |
| B035 | TariffVersion | Discount tariffs require an explicit base or a declared deferred base-selection policy. |
| B036 | TariffVersion | Dynamic tariffs require a formula. |
| B037 | TariffVersion | Tariff derivation must be acyclic. |
| B038 | TariffSet | Tariff assignment priorities within a set must be unique. |
| B039 | ElectricityPriceInterval | Price intervals require exactly one explicit or recurring window. |
| B040 | EnergyMix | Generation fractions must sum to one within decimal tolerance. |
| B041 | DynamicPriceFormula | Dynamic price lower bound cannot exceed upper bound. |
| B042 | Record | Stored gross amount must equal rounded net plus rounded tax. |
| B043 | Invoice | Invoice totals must agree with the sum of its lines. |
| B044 | Invoice | Invoice line currencies must match the document. |
| B045 | PaymentAuthorization | Authorization currency must match its payment intent. |
| B046 | PaymentCapture | Capture currency must match its payment intent. |
| B047 | Refund | Refund currency must match the original capture. |
| B048 | PaymentCapture | Confirmed refunds may not exceed the confirmed capture amount. |
| B049 | PaymentIntent | Confirmed captures may not exceed requested payment amount. |
| B050 | Journal | Posted journal must balance independently per currency. |
| B051 | JournalLine | Journal line currency must match its ledger account. |
| B052 | CorporateCostAllocation | Sponsor plus driver allocation must equal the total charge. |
| B053 | ReimbursementPolicy | Policy-sourced reimbursement requires an explicit electricity schedule. |
| B054 | ReimbursementPolicy | Station-sourced reimbursement must not embed a competing policy schedule. |
| B055 | ReimbursementPolicy | A contract-scoped reimbursement policy must identify its partner. |
| B056 | ReimbursementRecord | Reimbursement evidence must be for a personal station. |
| B057 | ReimbursementRecord | Station-derived reimbursement requires the station electricity schedule. |
| B058 | EnergyCouponTemplate | Relative coupon validity requires a duration; fixed validity requires both dates. |
| B059 | EnergyCoupon | Coupon consumption must not exceed its energy allowance; reversal records subtract. |
| B060 | CouponConsumption | Coupon use must occur within its validity interval. |
| B061 | CouponConsumption | Reversal must reference a consumption of the same coupon. |
| B062 | ChargingSchedule | Schedule periods must lie within schedule validity. |
| B063 | ChargingSchedule | Schedule periods in one schedule must not overlap. |
| B064 | ForecastPoint | Forecast bounds must contain the predicted value. |
| B065 | AvailabilityResult | Availability seconds must be positive and bounded. |
| B066 | AvailabilityResult | Availability fraction must agree with eligible and unavailable seconds. |
| B067 | WorkOrder | Completed work orders require timestamp and completion evidence. |
| B068 | InstallationJob | Completed installations require commissioning evidence. |
| B069 | FiscalizationAttempt | Accepted fiscalization requires an authority reference and fiscal evidence. |
| B070 | BrandProfile | The default language must be one of the supported languages. |
| B071 | ActionApproval | Approved assistant actions must reference the exact proposed command. |
| B072 | EventDelivery | Delivered events must not retain a retry timestamp. |
| B073 | RemoteCommand | Successful command state requires successful completion evidence, not acknowledgement alone. |
| B074 | StateTransition | Lifecycle transition must be permitted for the stated property and prior/next codes. |
| B075 | Record | Optional effective timestamps must define a positive half-open interval. |
| B076 | TimeWindow | Half-open interval must have positive duration. |
| B077 | SchedulePeriod | Schedule interval must have positive duration. |
| B078 | RemoteCommand | Command expiry must be after request time. |
| B079 | ReimbursementPolicy | Inclusive reimbursement end date cannot precede the start date. |
| B080 | Invoice | Due date cannot precede invoice issuance. |
| B081 | Reservation | Reservation expiry must be after reservation time. |
| B082 | RecurringWindow | Local time ordering must agree with the overnight flag. |
| B083 | PaymentAuthorization | Authorization expiry must be after authorization time. |
| B084 | ChargeDetailRecord | When a CDR has a tariff snapshot their currencies must agree. |
| B085 | SettlementBatch | Settlement items must have the batch currency and agreement. |
| B086 | CorporateBillingSnapshot | Snapshot policy version must identify the referenced immutable policy version. |
| B087 | VoucherRedemption | Voucher and wallet currencies must agree. |
| B088 | FirmwareDeployment | Firmware must list the station model as compatible. |
| B089 | ChargingStation | Station using personal reimbursement must be classified personal. |
| B090 | CorporateChargerRule | Corporate pricing limits cannot be negative. |
| B091 | DiscountRule | Percentage discounts are bounded between zero and one hundred. |
| B092 | FeeBounds | Component fee floor cannot exceed its ceiling. |
| B093 | PriceTier | Tier upper bound must exceed its inclusive lower bound. |
| B094 | SessionPricingPolicy | Session charge floor cannot exceed its ceiling. |
| B095 | Payout | Confirmed payouts require confirmation time. |
| B096 | PayoutBatch | Payout batch currency and total must agree with included payouts. |
| B097 | PowerCabinet | DC cabinet capacity must be positive and at least one module. |
| B098 | PowerModuleAllocation | Allocated power must agree with module count and not exceed cabinet capacity. |
| B099 | ChargingProfile | Recurring profiles require recurrence kind; transaction-specific profiles require a transaction. |
| B100 | AccessTokenLease | Access-token expiration must follow issuance. |
| B101 | AccessTokenLease | Revoked access tokens require a revocation timestamp. |
| B102 | PriceComponent | Pricing component tiers must not overlap. |
| B103 | PreauthorizationPolicy | Hold amounts must be nonnegative. |
| B104 | CorporateCostAllocation | Allocation snapshot must refer to the allocated session. |
| B105 | CouponConsumption | Coupon reversal must not reverse a reversal or exceed its original amount. |
| B106 | PaymentCapture | Confirmed captures require a provider confirmation reference. |
| B107 | TariffVersion | A discount-based tariff requires explicit discount rules. |
| B108 | PowerModuleAllocation | Allocated charging unit must be served by the cabinet. |
| B109 | RatingCalculation | Rating a deferred-base discount requires the resolved immutable base tariff. |
| B110 | ServiceAgreement | An active agreement has evidence of acceptance and at least one allocated contractual obligation. |
| B111 | ContractObligation | Fulfilled duties retain a satisfied assessment; waived duties retain a waiver assessment. |
| B112 | AgreementLifecycleEvent | Amendment and renewal create a distinct successor version retaining the contract identity. |
| B113 | AgreementLifecycleEvent | Termination identifies who retains residual liability and the settlement cutoff. |
| B114 | ServiceEntitlement | An active entitlement is backed by an active agreement and begins inside its effective period. |
| B115 | AccountClosure | Completed closure revokes active access and preserves ownership of any nonzero liability. |
| B116 | ChargingStation | An operating station has an accepted operational handover for that same asset. |
| B117 | OperationalAcceptance | Accepted handover requires successful safety, protocol and metering assessments and evidence. |
| B118 | AssetLifecycleEvent | Replacement and retirement cannot abandon open charging sessions or replace an asset with itself. |
| B119 | ConnectorCompatibility | A compatible offer requires agreement of physical connector, voltage and current type. |
| B120 | CommercialOffer | Ad hoc offers do not require account registration. |
| B121 | CommercialOffer | Disclosed currency, tariff currency and offer currency agree and offer expiry follows issue. |
| B122 | OfferAcceptance | Offer acceptance occurs during the disclosed offer validity window. |
| B123 | OfferAcceptance | Acceptance is bound to the same customer and selected tariff as the charging session. |
| B124 | CommercialResponsibility | The commercial supplier matches the supplier of the governing service agreement. |
| B125 | OfflineAuthorizationAssessment | Offline admission obeys credential revocation, cache age, unknown-token policy and financial exposure limits. |
| B126 | EventProcessingOutcome | Duplicate delivery refers to an already applied event with matching producer, key, scope and payload and has no new effects. |
| B127 | EventProcessingOutcome | A producer/key/scope combination has at most one applied business-effect outcome in a tenant. |
| B128 | EventProcessingOutcome | Quarantined events retain a reason and produce no accepted business effects. |
| B129 | MeterDelta | Measured usage compares cumulative readings of the same register meter, unit and direction within its epoch. |
| B130 | MeterDelta | Measured deltas preserve ordering, multiplier and reset boundaries; estimated deltas require evidence. |
| B131 | BillingReadinessAssessment | Billing readiness requires completed charging and resolved usage, authorization, price, tax, commercial responsibility and blocking issues. |
| B132 | ChargeDetailRecord | A local debit CDR carries a ready billing decision for the same completed session. |
| B133 | ChargeDetailRecord | Credit CDRs preserve parties and currency, reverse the original totals and cannot credit the same debit more than once. |
| B134 | RecordCorrection | Corrections form an acyclic lineage and cannot replace a record with itself. |
| B135 | FinancialPosition | Outstanding liability reconciles original charges, credits, collected money and authorized write-offs. |
| B136 | FinancialPosition | A settled position has no residual liability; a written-off position records the write-off. |
| B137 | PaymentAllocation | Posted allocations use confirmed collections, positive amounts and matching currencies. |
| B138 | PaymentCapture | Total posted allocations never spend a collection more than once. |
| B139 | ReconciliationCase | Missing-record cases allow an absent side with a locator; comparison cases require both actual records. |
| B140 | ReconciliationCase | Resolved reconciliation retains a resolution for the same case, a timestamp and explanation. |
| B141 | ReconciliationResolution | A corrected reconciliation identifies its immutable correction case. |
| B142 | ServiceDispute | Disputes preserve response deadlines, reasoned closure and an explicit remedy when remedied. |
| B143 | DunningAction | Collection escalation pauses for unresolved disputes against the position or its source record even without an explicit dispute link. |
| B144 | SettlementApproval | Approval cannot release a partner settlement with unresolved differences or missing approval evidence. |
| B145 | SettlementBatch | Partner settlement totals equal their items; released batches retain an approved release decision. |
| B146 | ReimbursementApproval | Approved reimbursement matches claimant, currency, amount, rate and eligible measured energy of the claim. |
| B147 | ReimbursementRecord | Paid reimbursements identify an approved claim and a confirmed payout with matching amount and currency. |
| B148 | BenefitReservation | Consumed reservations reference consumption for the same allowance, billing period and session within the reserved amount. |
| B149 | ControlDecision | A power decision stays within safety and contract limits even when optimization preferences are overridden. |
| B150 | ControlDecision | An accepted export decision requires an export agreement valid throughout the control interval at the same site. |
| B151 | ControlDecision | An override is authorized for this unit and covers the entire control interval. |
| B152 | DataSubjectRequest | Fulfilled rights requests require verified identity, completion time and retained response evidence. |
| B153 | DataSubjectRequest | Refusal of a rights request retains a reason and a communicated response. |
| B154 | DataDisposition | Completed disposition retains evidence and respects explicit holds and independently recorded active account-wide holds. |
| B155 | LegalHold | Holds have a future review relative to inception and explicit release evidence in time. |
| B156 | ProcessingPurpose | International personal-data transfers retain an explicit safeguards assessment. |
| B157 | AccessDecision | A current permit requires an enabled principal and an active, time-valid grant for the exact permission and scope. |
| B158 | EvidenceVerification | Valid artifact verification retains a matching computed digest and verification evidence. |
| B159 | ServiceLevelCommitment | Availability commitments use a proportion between zero and one. |
| B160 | ServiceLevelBreach | Closed service breaches retain completed remediation or a contractual remedy. |
| B161 | RecoveryExercise | A passed recovery rehearsal meets both time and data-loss objectives. |
| B162 | MigrationBatch | Completed migration reconciles all expected records without rejects and revokes obsolete source credentials. |
| B163 | LifecycleSnapshot | Current lifecycle snapshots agree with the current subject state and any cited transition. |
| B164 | StateTransition | Chained transitions preserve record, property, state continuity and nondecreasing time without circular history. |
| B165 | ProtocolProfile | An adapter cannot declare a feature both supported and unsupported. |
| B166 | ProcessExecution | Completed business journeys retain evidence and only successfully completed, compensated or explicitly skipped steps. |
| B167 | ProcessStep | Successful steps have output and evidence; compensated steps identify their compensating record. |
| B168 | ProcessExecution | Step sequence numbers are unique within a business journey. |
| B169 | CreditNote | Credit-note currency and issuer match the original invoice and cumulative credits stay within its gross amount. |
| B170 | AllowanceBalance | Remaining allowance reconciles opening rollover, grants, consumption, reservations and expired value without a negative balance. |
| B171 | AllowanceBalance | Allowance totals reconcile actual usage and reservations for the same allowance, period and session customer. |
| B172 | AllowanceBalance | Money-denominated allowances identify a currency instead of being treated as energy credits. |
| B173 | AccessDecision | Historical permits retain matching decision-time principal, grant, permission, scope and validity evidence. |
| B174 | AllowanceSponsorship | Sponsored allowance validity is contained in the funding agreement period. |
| B175 | FinancialPosition | Collected balances reconcile to posted allocations or retain explicit external collection evidence. |
| B176 | FinancialPosition | A write-off has attributable approval evidence. |
| B177 | Wallet | Wallet balance equals opening balance plus entries in its inclusive statement interval. |
| B178 | AccountingPeriod | A closed accounting period retains evidence and a close time no earlier than its end. |
| B179 | Journal | Posted journal timestamps belong to their accounting period and do not follow its close time. |
| B180 | PeriodAdjustment | Late corrections preserve original usage responsibility and use a distinct period that was open at posting time. |
| B181 | AmountRounding | Monetary rounding reproduces the declared signed decimal mode and scale from zero through six places. |
| B182 | CurrencyConversion | Currency conversion preserves quote direction, positive rate, calculation time and rounded output evidence. |
| B183 | RatingCalculation | Rating totals sum every rated line in one declared currency. |
| B184 | RatedLine | A rated line using rounding evidence agrees with its amount, currency and policy. |
| B185 | TaxDetermination | Tax rule validity is assessed at the taxable supply time, including later corrections. |
| B186 | PricingTimeResolution | An offset-bearing price instant and its UTC interpretation identify the same instant. |
| B187 | SettlementLeg | Posted settlement legs match their batch agreement and currency, balance amounts and name distinct liable and entitled parties. |
| B188 | SettlementLeg | A posted economic leg has one reference within its tenant and settlement batch. |
| B189 | DataSubjectRequest | Closing a rights request preserves fulfilment or refusal, identity checks where fulfilled, and a response with completion time. |
| B190 | DataDisposition | Deletion cannot omit an active hold on an explicitly disposed record. |
| B191 | ProcessStep | A required business step cannot be skipped. |
| B192 | ProcessStep | Predecessors belong to the same process, have lower sequence numbers and finish before a dependent step succeeds. |
| B193 | BillingReadinessAssessment | Billing readiness considers actual unresolved blocking issues against the session. |
| B194 | ServiceEntitlement | An entitlement cannot outlive its finite funding agreement. |
| B195 | AccountClosure | Completed closure agrees with the account state, chronology and actual scoped access grants. |
| B196 | AssetLifecycleEvent | Retirement or replacement cannot hide an unfinished session on the station. |
| B197 | OwnershipTransfer | An ownership transfer identifies different previous and succeeding owners. |
| B198 | EventProcessingOutcome | Applied and duplicate outcomes retain processing time no earlier than receipt. |
| B199 | CommercialOffer | The disclosed price currency and optional display tariff agree with the commercial offer. |
| B200 | Refund | Refunds have positive amounts and confirmation requires an originally confirmed capture. |
| B201 | Chargeback | A chargeback disputes a positive amount no greater than its confirmed capture in the same currency. |
| B202 | Payout | A confirmed payout is positive, pays the account holder and retains a confirmation no earlier than scheduling. |
| B203 | FlexibilityDelivery | Flexibility delivery records signed actual-minus-baseline energy; reduction is negative. |
| B204 | PowerCabinet | Simultaneous module allocations cannot exceed shared cabinet capacity; touching half-open intervals do not overlap. |
| B205 | ServiceLevelBreach | Closed service-level breaches retain evidence of the accepted resolution. |
| B206 | SynchronizationCursor | A synchronization watermark cannot be later than its successful synchronization time. |
| B207 | CommercialResponsibility | Commercial responsibility is bounded by its agreement while remaining usable for historical usage. |
| B208 | ChargingSession | Accepted session authorization precedes start and has not expired at start. |
| B209 | PaymentIntent | Payment state agrees with confirmed capture totals, including partial and fully refunded outcomes. |
| B210 | PaymentCapture | Confirmed capture records represent a positive collected amount. |
| B211 | Refund | Refund requests do not precede the original capture. |
| B212 | Invoice | Paid invoice status is backed by a settled same-currency position with collections and credits covering its gross amount. |
| B213 | PaymentAllocation | An invoice-specific collection cannot be allocated to a different source obligation. |
| B214 | CreditNote | An invoice credit is a positive reduction; negative credits cannot offset cumulative credit limits. |
| B215 | PaymentCapture | Posted allocations cannot retain money already returned by confirmed refunds. |
| B216 | Subscription | Cancelled subscriptions retain cancellation evidence time and disable renewal; ended periods have positive duration. |
| B217 | BillingPeriod | A billed subscription period retains a non-draft, non-void invoice in its currency. |
| B218 | SettlementApproval | Settlement approval cannot conceal unresolved reconciliation cases directly against the batch or its items. |
