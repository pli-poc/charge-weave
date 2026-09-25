# Detailed pricing field audit

Every property in the inspected External platform `pricing` and `discountTariffSettings` objects has an explicit semantic disposition below. Source: [Tariff create](urn:chargeweave:legacy-api/reference/tariffcreate), retrieved 25 September 2026; compared with the official schema index v3.251.8. This is a design mapping. Vendor enum conversion, precedence, arithmetic equivalence and serializers still require adapter contract tests.

| Source object.field | Canonical path | Translation decision |
|---|---|---|
| pricing.averagePowerIdleThreshold | PriceComponent[IdleTime].pricingCondition | SOC and measured-power conditions determine idle classification; time alone is insufficient. |
| pricing.averagePowerLevels | PriceTier.pricingCondition / PricingCondition[Power].measurementAggregation | Use comparisonValue and comparisonDatatype; preserve average versus peak in the versioned condition definition. |
| pricing.chargePointElectricityRate | DynamicPriceFormula.electricitySchedule + ChargingStation.electricitySchedule | Resolve station-specific feed in a versioned formula implementation. |
| pricing.connectionFee | TariffVersion.priceComponent / PriceComponent[Flat].unitPrice | Represent separate flat components; retain connection eligibility conditions. |
| pricing.connectionFeeMinimumSessionDuration | SessionPricingPolicy.minimumConnectionDurationSeconds | Convert minutes if specified by the source field contract. |
| pricing.connectionFeeMinimumSessionEnergy | SessionPricingPolicy.minimumConnectionEnergyKWh | Preserve energy threshold inclusivity in the pricing condition. |
| pricing.dayIdleFeePerMinute | PriceComponent[IdleTime].unitPrice + pricingCondition | Keep idle and charging-time dimensions separate. |
| pricing.dayPricePerKwh | PriceComponent[EnergyImport].unitPrice + pricingCondition | Energy unit is explicit; day/night use recurring local windows and timezone. |
| pricing.dayPricePerPeriod | PriceComponent[ChargingTime].unitPrice + pricingCondition | Use an explicit time unit and billing increment; preserve day/night conditions. |
| pricing.daysWhenApplied | PriceComponent.pricingCondition / RecurringWindow or TimeWindow | Preserve inclusion/exclusion rules, dates, weekdays, timezone and exceptions. |
| pricing.durationFeeCapMinutes | FeeBounds.maximumBillableQuantity | Convert minutes to the component time unit. |
| pricing.durationFeeFrom | PriceComponent.pricingCondition / PricingCondition[TimeWindow].relatedRecord / RecurringWindow | Represent local intervals, timezone and overnight behavior explicitly. |
| pricing.durationFeeGracePeriod | PriceComponent.graceQuantity | Grace quantity uses the component unit. |
| pricing.durationFeeLimit | PriceComponent.feeBounds / FeeBounds.maximumCharge | Monetary cap is distinct from a cap on billable duration. |
| pricing.durationFeeTo | PriceComponent.pricingCondition / PricingCondition[TimeWindow].relatedRecord / RecurringWindow | Represent local intervals, timezone and overnight behavior explicitly. |
| pricing.fallbackElectricityRateId | DynamicPriceFormula.fallbackSchedule | Resolve the qualified external electricity-rate identifier. |
| pricing.flexibleMarkUpAsFixedPerKwh | DynamicPriceFormula.fixedMarkup + formulaExpression | Preserve the source mode as a formula variant; fields are not blindly equated. |
| pricing.idleFeeCapMinutes | FeeBounds.maximumBillableQuantity | Convert minutes to the component time unit. |
| pricing.idleFeeGracePeriodMinutes | PriceComponent.graceQuantity | Grace quantity uses the component unit. |
| pricing.idleFeeGracePeriodMode | PriceComponent.graceMode | Translate source codes using an adapter-specific reviewed table. |
| pricing.idleFeeLimit | PriceComponent.feeBounds / FeeBounds.maximumCharge | Monetary cap is distinct from a cap on billable duration. |
| pricing.idleFeePerMinute | PriceComponent[IdleTime].unitPrice + pricingCondition | Keep idle and charging-time dimensions separate. |
| pricing.idleFeePeriodEnd | PriceComponent.pricingCondition / PricingCondition[TimeWindow].relatedRecord / RecurringWindow | Represent local intervals, timezone and overnight behavior explicitly. |
| pricing.idleFeePeriodStart | PriceComponent.pricingCondition / PricingCondition[TimeWindow].relatedRecord / RecurringWindow | Represent local intervals, timezone and overnight behavior explicitly. |
| pricing.idlePricingPeriodInMinutes | PriceComponent[IdleTime].billingStep | Preserve billed block size and rounding policy. |
| pricing.incrementalPreAuthorizationAmount | PreauthorizationPolicy.incrementalHoldAmount | PSP hold increment policy is separate from tariff arithmetic. |
| pricing.lockDurationPriceOnSessionStart | PriceComponent.priceFreezePolicy / PriceFreezePolicy.freezeMoment | Expand global locks into the affected component dimensions; freeze price selection, not usage quantities. |
| pricing.lockEnergyPriceOnSessionStart | PriceComponent.priceFreezePolicy / PriceFreezePolicy.freezeMoment | Expand global locks into the affected component dimensions; freeze price selection, not usage quantities. |
| pricing.lockIdlePriceOnSessionStart | PriceComponent.priceFreezePolicy / PriceFreezePolicy.freezeMoment | Expand global locks into the affected component dimensions; freeze price selection, not usage quantities. |
| pricing.lockPriceOnSessionStart | PriceComponent.priceFreezePolicy / PriceFreezePolicy.freezeMoment | Expand global locks into the affected component dimensions; freeze price selection, not usage quantities. |
| pricing.markupFixedFeePerKwh | DynamicPriceFormula.fixedMarkup + formulaExpression | Preserve the source mode as a formula variant; fields are not blindly equated. |
| pricing.markupPercentagePerKwh | DynamicPriceFormula.percentageMarkup | Percentage markup remains independent of fixed monetary markup. |
| pricing.minPrice | SessionPricingPolicy.minimumSessionCharge | Session floor is applied after component evaluation according to evaluationVersion. |
| pricing.multiIdleFee | PriceComponent.priceTier / PriceTier | Use tier bounds, unit prices and explicit graduated versus whole-quantity calculation. |
| pricing.multiPricePerDuration | PriceComponent.priceTier / PriceTier | Use tier bounds, unit prices and explicit graduated versus whole-quantity calculation. |
| pricing.multiPricePerKwh | PriceComponent.priceTier / PriceTier | Use tier bounds, unit prices and explicit graduated versus whole-quantity calculation. |
| pricing.nightIdleFeePerMinute | PriceComponent[IdleTime].unitPrice + pricingCondition | Keep idle and charging-time dimensions separate. |
| pricing.nightPricePerKwh | PriceComponent[EnergyImport].unitPrice + pricingCondition | Energy unit is explicit; day/night use recurring local windows and timezone. |
| pricing.nightPricePerPeriod | PriceComponent[ChargingTime].unitPrice + pricingCondition | Use an explicit time unit and billing increment; preserve day/night conditions. |
| pricing.optimisedLabel | SessionPricingPolicy.optimizedLabel | Retain localized presentation text separately from arithmetic. |
| pricing.peakPowerLevels | PriceTier.pricingCondition / PricingCondition[Power].measurementAggregation | Use comparisonValue and comparisonDatatype; preserve average versus peak in the versioned condition definition. |
| pricing.preAuthorizeAmount | PreauthorizationPolicy.initialHoldAmount | A hold is not session revenue or a captured payment. |
| pricing.priceForEnergyWhenOptimized | SessionPricingPolicy.optimizedUnitPrice | Separate optimized unit price from the threshold. |
| pricing.pricePerKwh | PriceComponent[EnergyImport].unitPrice + pricingCondition | Energy unit is explicit; day/night use recurring local windows and timezone. |
| pricing.pricePerPeriod | PriceComponent[ChargingTime].unitPrice + pricingCondition | Use an explicit time unit and billing increment; preserve day/night conditions. |
| pricing.pricePerSession | TariffVersion.priceComponent / PriceComponent[Flat].unitPrice | Represent separate flat components; retain connection eligibility conditions. |
| pricing.pricePeriodInMinutes | PriceComponent.billingStep + unitIri | Convert to the declared time unit without changing step rounding. |
| pricing.pricePeriods | PriceComponent.pricingCondition / RecurringWindow or TimeWindow | Preserve inclusion/exclusion rules, dates, weekdays, timezone and exceptions. |
| pricing.regularUsePeriod | PricingCondition[Duration].comparisonValue + comparisonDatatype | Minutes of regular use before the peak-power excess-duration rate; not a wall-clock interval. |
| pricing.stateOfChargeIdleThreshold | PriceComponent[IdleTime].pricingCondition | SOC and measured-power conditions determine idle classification; time alone is insufficient. |
| pricing.subsidy | TariffVersion.subsidyRule / SubsidyRule.integrationConnection, subsidyValue, subsidyBasis | Resolve funding authority, value basis and calculation version. |
| pricing.subsidyIntegrationId | TariffVersion.subsidyRule / SubsidyRule.integrationConnection, subsidyValue, subsidyBasis | Resolve funding authority, value basis and calculation version. |
| pricing.taxID | PriceComponent.taxRule / TaxRule.externalIdentifier | Use qualified external identifiers rather than reusing an API integer as a global IRI. |
| pricing.thresholdPriceForEnergy | SessionPricingPolicy.optimizedPriceThreshold | Threshold influences the optimized price branch. |
| pricing.timePeriods | PriceComponent.pricingCondition / RecurringWindow or TimeWindow | Preserve inclusion/exclusion rules, dates, weekdays, timezone and exceptions. |
| discountTariffSettings.discountElements | DiscountRule.affectedDimension | Translate source enum values explicitly; preserve selected tariff version. |
| discountTariffSettings.discountMode | DiscountRule.affectedDimension: one common rule across dimensions or individual rules per component | Translate source enum values explicitly; preserve selected tariff version. |
| discountTariffSettings.discountPercentage | DiscountRule[Percentage].discountMagnitude | Translate source enum values explicitly; preserve selected tariff version. |
| discountTariffSettings.discountReferenceType | TariffVersion.baseTariffSelection with TariffResolution.resolvedBaseTariff at session time | Translate source enum values explicitly; preserve selected tariff version. |
| discountTariffSettings.discountType | DiscountRule.discountBasis | Translate source enum values explicitly; preserve selected tariff version. |
| discountTariffSettings.discountValue | DiscountRule.discountMagnitude | Translate source enum values explicitly; preserve selected tariff version. |
| discountTariffSettings.referencedTariffId | TariffVersion.baseTariffVersion / qualified ExternalIdentifier | Translate source enum values explicitly; preserve selected tariff version. |
