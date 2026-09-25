"""Idempotent reviewed additions discovered during detailed public-schema review."""
from pathlib import Path
P=Path(__file__).resolve().parents[1];p=P/'model/domain.schema';s=p.read_text()
amend={
'TariffVersion':'discountRule:DiscountRule* sessionPricingPolicy:SessionPricingPolicy? preauthorizationPolicy:PreauthorizationPolicy? subsidyRule:SubsidyRule*',
'PriceComponent':'feeBounds:FeeBounds? priceTier:PriceTier* priceFreezePolicy:PriceFreezePolicy? graceMode:{FromStart,AfterCharging,AfterGrace}?',
'DynamicPriceFormula':'fixedMarkup:decimal? percentageMarkup:decimal? fallbackSchedule:ElectricityPriceSchedule?',
'SourceEvent':'clockAssessment:ClockAssessment?',
'ChargingStation':'powerCabinet:PowerCabinet? chargingProfile:ChargingProfile*',
'SubscriptionPlan':'subscriptionBillingPolicy:SubscriptionBillingPolicy?',
'ReimbursementRecord':'reimbursementTaxCalculation:ReimbursementTaxCalculation? payout:Payout?',
'RoamingConnection':'roamingBehaviorPolicy:RoamingBehaviorPolicy?',
'LegalEntity':'financialAccount:FinancialAccountReference*',
'PaymentIntent':'paymentRouting:PaymentRouting?',
'ServiceAgreement':'autoRenewal:boolean? platformFee:CustomFee*',
}
lines=[]
for l in s.splitlines():
 c=l.split('|')[0]
 if c in amend and amend[c].split(':')[0]+':' not in l:l+=' '+amend[c]
 lines.append(l)
extra='''MODULE|pricing
DiscountRule|-|Explicit reduction applied to selected price dimensions or a session total; computation order is part of the policy.|discountBasis:{Percentage,FixedPerUnit,FixedTotal}! discountMagnitude:decimal! affectedDimension:{EnergyImport,EnergyExport,ChargingTime,ParkingTime,IdleTime,Flat,Total}+ discountOrder:integer! pricingCondition:PricingCondition*
FeeBounds|-|Currency-denominated cap and minimum with an optional quantity cap for one price component.|minimumCharge:decimal? maximumCharge:decimal? maximumBillableQuantity:decimal? currency:Currency!
PriceTier|-|Tier in a component's piecewise price schedule with explicit accumulation semantics.|tierLowerBound:decimal! tierUpperBound:decimal? tierUnitPrice:decimal! tierMode:{Graduated,WholeQuantity}! pricingCondition:PricingCondition*
PriceFreezePolicy|-|Defines when a component's selected unit price is frozen, independently of quantities and tax.|freezeMoment:{SessionStart,PeriodStart,Continuously}! priceDimension:{EnergyImport,EnergyExport,ChargingTime,ParkingTime,IdleTime,Flat}!
SessionPricingPolicy|-|Session-wide floor, ceiling, fee eligibility and ordered component evaluation policy.|currency:Currency! minimumSessionCharge:decimal? maximumSessionCharge:decimal? minimumConnectionDurationSeconds:nonNegativeInteger? minimumConnectionEnergyKWh:decimal? optimizedPriceThreshold:decimal? optimizedUnitPrice:decimal? optimizedLabel:langString* evaluationVersion:string!
PreauthorizationPolicy|-|Payment hold policy separated from the tariff's actual charge calculation.|currency:Currency! initialHoldAmount:decimal! incrementalHoldAmount:decimal? holdTimeoutSeconds:positiveInteger! failureAction:{StopCharging,RejectStart,AllowWithRisk}!
SubsidyRule|-|Externally funded reduction with a beneficiary, policy version and optional integration authority.|fundingParty:LegalEntity! subsidyBasis:{FixedPerUnit,Percentage,FixedTotal}! subsidyValue:decimal! subsidyPolicyVersion:string! integrationConnection:IntegrationConnection? pricingCondition:PricingCondition*
MODULE|payments-ledger
FinancialAccountReference|-|Payment-provider or vault reference to bank details with masked display values; raw credentials are not required in the graph.|accountHolder:LegalEntity! accountReference:string! accountScheme:{IBAN,Domestic,Provider}! maskedAccount:string! bankCountryCode:string? bankIdentifierCode:string?
PaymentRouting|-|Deterministic choice of payment service and merchant account for a transaction.|integrationConnection:IntegrationConnection! merchantAccountReference:string! routePriority:integer! pricingCondition:PricingCondition*
Payout|-|Disbursement to a beneficiary account, distinct from collection of a driver's payment.|beneficiary:LegalEntity! financialAccount:FinancialAccountReference! currency:Currency! payoutAmount:decimal! payoutState:{Scheduled,Submitted,Confirmed,Failed,Reversed}! payoutReference:string! scheduledAt:dateTime! confirmedAt:dateTime? settlementBatch:SettlementBatch? reimbursementRecord:ReimbursementRecord*
PayoutBatch|-|Currency-specific group of disbursements for a funding entity and execution date.|fundingParty:LegalEntity! currency:Currency! payout:Payout+ batchTotal:decimal! scheduledAt:dateTime!
MODULE|energy
PowerCabinet|-|Shared DC conversion capacity serving multiple charging units, separate from a station identity.|site:ChargingSite! totalCabinetPowerKW:decimal! moduleSizeKW:decimal! sharingMode:{Fixed,Dynamic,External}! servedUnit:ChargingUnit+
PowerModuleAllocation|-|Time-bounded assignment of cabinet power modules to a charging unit.|powerCabinet:PowerCabinet! chargingUnit:ChargingUnit! allocatedModules:positiveInteger! allocatedPowerKW:decimal! interval:TimeWindow!
ChargingProfile|-|Protocol-independent charging profile preserving purpose, kind, stack precedence and schedule.|profilePurpose:{StationMaximum,TransactionDefault,TransactionSpecific,ExternalConstraints}! profileKind:{Absolute,Recurring,Relative}! stackLevel:nonNegativeInteger! chargingSchedule:ChargingSchedule! recurrenceKind:{Daily,Weekly}? protocolTransaction:ProtocolTransaction? relativeAnchor:dateTime?
MODULE|roaming
RoamingBehaviorPolicy|-|Versioned interpretation rules at a roaming boundary, including unknown status and tariff precedence.|mappingMode:{Native,Translated,Overridden}! unknownUnitStatus:{Unknown,Unavailable,Available}! periodicMeterUpdates:boolean! phasePowerFormula:{SinglePhase,ThreePhase,Reported}! overrideExplicitTariff:boolean! policyVersion:string!
MODULE|security-governance
AccessTokenLease|-|Metadata for an issued API access token; token material is stored in a secret manager and is never the RDF identifier.|apiClient:ApiClient! issuedAt:dateTime! expiresAt:dateTime! tokenFingerprint:string! accessTokenState:{Active,Revoked,Expired}! permission:Permission* revokedAt:dateTime?
MODULE|subscriptions-benefits
SubscriptionBillingPolicy|-|Subscription fee accumulation, renewal and personal-charger multipliers independent of the service allowance.|billingType:{Prepaid,Postpaid}! renewalIntervalMonths:positiveInteger! freeRenewalPeriods:nonNegativeInteger! currency:Currency! baseFee:decimal! feePerPersonalStation:decimal? applyBaseFeePerStation:boolean! usageBillingThreshold:decimal? accumulateChargingCharges:boolean! replacementPlan:SubscriptionPlan?
MODULE|partners-settlement
ReimbursementTaxCalculation|-|Explicit tax interpretation and rounded monetary breakdown of a reimbursement.|taxBasis:{Inclusive,Exclusive,Exempt}! taxRatePercent:decimal! netAmount:decimal! taxAmount:decimal! grossAmount:decimal! currency:Currency! taxDetermination:TaxDetermination?
MODULE|sessions-metering
ClockAssessment|-|Recorded clock offset applied to a source timestamp, including method and evidence; preserves the unmodified source time.|offsetSeconds:decimal! correctionMethod:string! assessedAt:dateTime! evidence:EvidenceDocument+
'''
if 'DiscountRule|-|' not in s:lines.append(extra)
p.write_text('\n'.join(lines)+'\n')
