"""Explicit semantic disposition of every field in the inspected tariff pricing object."""
from pathlib import Path
import json
P=Path(__file__).resolve().parents[1]
mapping={}
def m(fields,path,note):
 for f in fields.split():mapping[f]={'path':path,'translation':note}
m('pricePerSession connectionFee','TariffVersion.priceComponent / PriceComponent[Flat].unitPrice','Represent separate flat components; retain connection eligibility conditions.')
m('pricePerKwh dayPricePerKwh nightPricePerKwh','PriceComponent[EnergyImport].unitPrice + pricingCondition','Energy unit is explicit; day/night use recurring local windows and timezone.')
m('pricePerPeriod dayPricePerPeriod nightPricePerPeriod','PriceComponent[ChargingTime].unitPrice + pricingCondition','Use an explicit time unit and billing increment; preserve day/night conditions.')
m('pricePeriodInMinutes','PriceComponent.billingStep + unitIri','Convert to the declared time unit without changing step rounding.')
m('idleFeePerMinute dayIdleFeePerMinute nightIdleFeePerMinute','PriceComponent[IdleTime].unitPrice + pricingCondition','Keep idle and charging-time dimensions separate.')
m('durationFeeLimit idleFeeLimit','PriceComponent.feeBounds / FeeBounds.maximumCharge','Monetary cap is distinct from a cap on billable duration.')
m('durationFeeCapMinutes idleFeeCapMinutes','FeeBounds.maximumBillableQuantity','Convert minutes to the component time unit.')
m('durationFeeGracePeriod idleFeeGracePeriodMinutes','PriceComponent.graceQuantity','Grace quantity uses the component unit.')
m('idleFeeGracePeriodMode','PriceComponent.graceMode','Translate source codes using an adapter-specific reviewed table.')
m('idlePricingPeriodInMinutes','PriceComponent[IdleTime].billingStep','Preserve billed block size and rounding policy.')
m('idleFeePeriodStart idleFeePeriodEnd durationFeeFrom durationFeeTo','PriceComponent.pricingCondition / PricingCondition[TimeWindow].relatedRecord / RecurringWindow','Represent local intervals, timezone and overnight behavior explicitly.')
m('connectionFeeMinimumSessionDuration','SessionPricingPolicy.minimumConnectionDurationSeconds','Convert minutes if specified by the source field contract.')
m('connectionFeeMinimumSessionEnergy','SessionPricingPolicy.minimumConnectionEnergyKWh','Preserve energy threshold inclusivity in the pricing condition.')
m('minPrice','SessionPricingPolicy.minimumSessionCharge','Session floor is applied after component evaluation according to evaluationVersion.')
m('preAuthorizeAmount','PreauthorizationPolicy.initialHoldAmount','A hold is not session revenue or a captured payment.')
m('incrementalPreAuthorizationAmount','PreauthorizationPolicy.incrementalHoldAmount','PSP hold increment policy is separate from tariff arithmetic.')
m('taxID','PriceComponent.taxRule / TaxRule.externalIdentifier','Use qualified external identifiers rather than reusing an API integer as a global IRI.')
m('chargePointElectricityRate','DynamicPriceFormula.electricitySchedule + ChargingStation.electricitySchedule','Resolve station-specific feed in a versioned formula implementation.')
m('fallbackElectricityRateId','DynamicPriceFormula.fallbackSchedule','Resolve the qualified external electricity-rate identifier.')
m('markupPercentagePerKwh','DynamicPriceFormula.percentageMarkup','Percentage markup remains independent of fixed monetary markup.')
m('markupFixedFeePerKwh flexibleMarkUpAsFixedPerKwh','DynamicPriceFormula.fixedMarkup + formulaExpression','Preserve the source mode as a formula variant; fields are not blindly equated.')
m('multiPricePerKwh multiPricePerDuration multiIdleFee','PriceComponent.priceTier / PriceTier','Use tier bounds, unit prices and explicit graduated versus whole-quantity calculation.')
m('timePeriods pricePeriods daysWhenApplied','PriceComponent.pricingCondition / RecurringWindow or TimeWindow','Preserve inclusion/exclusion rules, dates, weekdays, timezone and exceptions.')
m('regularUsePeriod','PricingCondition[Duration].comparisonValue + comparisonDatatype','Minutes of regular use before the peak-power excess-duration rate; not a wall-clock interval.')
m('averagePowerLevels peakPowerLevels','PriceTier.pricingCondition / PricingCondition[Power].measurementAggregation','Use comparisonValue and comparisonDatatype; preserve average versus peak in the versioned condition definition.')
m('thresholdPriceForEnergy','SessionPricingPolicy.optimizedPriceThreshold','Threshold influences the optimized price branch.')
m('priceForEnergyWhenOptimized','SessionPricingPolicy.optimizedUnitPrice','Separate optimized unit price from the threshold.')
m('optimisedLabel','SessionPricingPolicy.optimizedLabel','Retain localized presentation text separately from arithmetic.')
m('subsidyIntegrationId subsidy','TariffVersion.subsidyRule / SubsidyRule.integrationConnection, subsidyValue, subsidyBasis','Resolve funding authority, value basis and calculation version.')
m('lockPriceOnSessionStart lockEnergyPriceOnSessionStart lockDurationPriceOnSessionStart lockIdlePriceOnSessionStart','PriceComponent.priceFreezePolicy / PriceFreezePolicy.freezeMoment','Expand global locks into the affected component dimensions; freeze price selection, not usage quantities.')
m('stateOfChargeIdleThreshold averagePowerIdleThreshold','PriceComponent[IdleTime].pricingCondition','SOC and measured-power conditions determine idle classification; time alone is insufficient.')
discount={
'discountReferenceType':'TariffVersion.baseTariffSelection with TariffResolution.resolvedBaseTariff at session time',
'referencedTariffId':'TariffVersion.baseTariffVersion / qualified ExternalIdentifier',
'discountMode':'DiscountRule.affectedDimension: one common rule across dimensions or individual rules per component',
'discountPercentage':'DiscountRule[Percentage].discountMagnitude',
'discountType':'DiscountRule.discountBasis',
'discountValue':'DiscountRule.discountMagnitude',
'discountElements':'DiscountRule.affectedDimension'}
rows=[{'sourceSchema':'pricing','sourceField':k,**v} for k,v in sorted(mapping.items())]+[{'sourceSchema':'discountTariffSettings','sourceField':k,'path':v,'translation':'Translate source enum values explicitly; preserve selected tariff version.'} for k,v in sorted(discount.items())]
(P/'benchmark/pricing-field-crosswalk.json').write_text(json.dumps(rows,indent=2))
(P/'docs/pricing-field-crosswalk.md').write_text('# Detailed pricing field audit\n\nEvery property in the inspected AMPECO `pricing` and `discountTariffSettings` objects has an explicit semantic disposition below. Source: [Tariff create](https://developers.ampeco.com/reference/tariffcreate), retrieved 25 September 2026; compared with the official schema index v3.251.8. This is a design mapping. Vendor enum conversion, precedence, arithmetic equivalence and serializers still require adapter contract tests.\n\n| Source object.field | Canonical path | Translation decision |\n|---|---|---|\n'+'\n'.join('| '+r['sourceSchema']+'.'+r['sourceField']+' | '+r['path']+' | '+r['translation']+' |' for r in rows)+'\n')
print(len(mapping),'pricing fields and',len(discount),'discount fields mapped')
