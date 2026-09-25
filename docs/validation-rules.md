# Cross-domain business validation

These are canonical domain policies. Vendor-specific restrictions belong in the separate AMPECO compatibility profile. SELECT results are violations; absence of rows is meaningful only after structural validation over a complete authorized snapshot.

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
