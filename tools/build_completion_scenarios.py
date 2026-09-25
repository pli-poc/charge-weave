"""Authored cross-domain acceptance, with nonzero money and explicit historical facts."""
from runtime import *
from rdflib import XSD
import json
import re

base=Graph().parse(P/'examples/reference.ttl'); rows=[]
folder=P/'examples/completion';folder.mkdir(exist_ok=True)
def setv(g,n,p,v):g.set((E[n],C[p],v))
def link(g,n,p,v):setv(g,n,p,E[v])
def code(g,n,p,v):setv(g,n,p,C[p+'_'+v])
def dec(g,n,p,v):setv(g,n,p,Literal(str(v),datatype=XSD.decimal))
def text(g,n,p,v):setv(g,n,p,Literal(v,datatype=XSD.string))
def flag(g,n,p,v):setv(g,n,p,Literal(v))
def time(g,n,p,h):setv(g,n,p,Literal(f'2026-09-25T{h:02d}:00:00Z',datatype=XSD.dateTime))
def clone(g,source,target):
 for p,v in list(g.predicate_objects(E[source])):g.add((E[target],p,v))
 text(g,target,'canonicalId',target)
def scenario(family,name,g,assertion,requirements,faults):
 # ASK numeric value comparisons must not depend on RDF literal lexical forms.
 numbers=[]
 def numeric(match):
  variable='?expectedNumber'+str(len(numbers));numbers.append(variable+'='+match[0]);return variable
 assertion=re.sub(r'(?<![\w:"/])-?\d+(?:\.\d+)?(?=[ ;.}])',numeric,assertion)
 if numbers:assertion=assertion.rsplit('}',1)[0]+' FILTER('+' && '.join(numbers)+') }'
 variants=[('PASS',None,None)]+[(str(i+1),rule,change) for i,(rule,change) in enumerate(faults)]
 for suffix,rule,change in variants:
  graph=g+Graph()
  if change:change(graph)
  path=f'examples/completion/{name}-{suffix.lower()}.ttl'
  (P/path).write_text(graph.serialize(format='turtle').rstrip()+'\n')
  rows.append(dict(id='COMPLETE-'+name.upper()+'-'+suffix,family=family,title=name,file=path,
    expectedConformance=not bool(rule),expectedRule=rule,assertion=assertion if not rule else None,
    requirements=requirements))

g=base+Graph()
code(g,'AccessDecision','accessDecision','Permit');code(g,'AccessDecision','decisionContext','Historical')
link(g,'AccessDecision','accessGrant','AccessGrant');link(g,'AccessDecision','authorizationSnapshot','AuthorizationSnapshot')
code(g,'Principal','principalState','Disabled');code(g,'AccessGrant','grantState','Revoked')
flag(g,'AuthorizationSnapshot','principalEnabled',True);flag(g,'AuthorizationSnapshot','grantActive',True)
scenario('access','historical-permit',g,
 'ASK {ex:AccessDecision cd:decisionContext cd:decisionContext_Historical; cd:accessDecision cd:accessDecision_Permit; cd:authorizationSnapshot/cd:grantActive true. ex:Principal cd:principalState cd:principalState_Disabled. ex:AccessGrant cd:grantState cd:grantState_Revoked.}',
 ['BR-173','BR-157'],[('B173',lambda d:flag(d,'AuthorizationSnapshot','principalEnabled',False)),('B157',lambda d:code(d,'AccessDecision','decisionContext','Current'))])

g=base+Graph();clone(g,'CustomerAccount','SponsoredCustomer')
link(g,'ChargingSession','customer','SponsoredCustomer');link(g,'AllowanceBalance','allowanceSponsorship','AllowanceSponsorship')
link(g,'AllowanceSponsorship','beneficiaryCustomer','SponsoredCustomer');link(g,'AllowanceSponsorship','scopeRecord','SponsoredCustomer')
time(g,'ServiceAgreement','validUntil',14)
time(g,'ServiceEntitlement','validUntil',14);time(g,'CommercialResponsibility','validUntil',14)
for p,v in [('openingValue',20),('consumedValue',5),('reservedValue',2),('closingValue',13)]:dec(g,'AllowanceBalance',p,v)
dec(g,'AllowanceConsumption','consumedValue',5);dec(g,'BenefitReservation','reservedValue',2)
scenario('access','sponsored-allowance',g,
 'ASK {ex:AllowanceBalance cd:customer ex:CustomerAccount; cd:allowanceSponsorship/cd:beneficiaryCustomer ex:SponsoredCustomer; cd:closingValue 13. ex:ChargingSession cd:customer ex:SponsoredCustomer.}',
 ['BR-174','BR-171'],[('B174',lambda d:time(d,'AllowanceSponsorship','validUntil',15)),('B171',lambda d:d.remove((E.AllowanceBalance,C.allowanceSponsorship,None)))])

g=base+Graph()
dec(g,'PaymentIntent','requestedAmount',10);dec(g,'PaymentCapture','capturedAmount',10)
code(g,'PaymentAllocation','allocationState','Posted');dec(g,'PaymentAllocation','allocatedAmount',4)
code(g,'FinancialPosition','collectionBasis','PaymentAllocations')
for p,v in [('originalAmount',10),('collectedAmount',4),('writtenOffAmount',1),('outstandingAmount',5)]:dec(g,'FinancialPosition',p,v)
link(g,'FinancialPosition','writeOffEvidence','EvidenceDocument')
dec(g,'Wallet','openingBalance',10);dec(g,'Wallet','balanceAmount',7.5);time(g,'Wallet','balanceFrom',10);time(g,'Wallet','balanceAsOf',14)
dec(g,'WalletEntry','signedAmount',-2.5)
scenario('finance','money-reconciliation',g,
 'ASK {ex:FinancialPosition cd:collectedAmount 4; cd:writtenOffAmount 1; cd:outstandingAmount 5. ex:PaymentAllocation cd:allocatedAmount 4. ex:Wallet cd:openingBalance 10; cd:balanceAmount 7.5.}',
 ['BR-175','BR-176','BR-177'],[('B175',lambda d:dec(d,'PaymentAllocation','allocatedAmount',3)),('B176',lambda d:d.remove((E.FinancialPosition,C.writeOffEvidence,None))),('B177',lambda d:dec(d,'WalletEntry','signedAmount',-2))])

g=base+Graph();clone(g,'TimeWindow','NextWindow');time(g,'NextWindow','startsAt',14);time(g,'NextWindow','endsAt',18)
clone(g,'AccountingPeriod','NextPeriod');link(g,'NextPeriod','period','NextWindow');text(g,'NextPeriod','periodReference','next-period')
code(g,'AccountingPeriod','periodState','Closed');time(g,'AccountingPeriod','closedAt',14);link(g,'AccountingPeriod','closingEvidence','EvidenceDocument')
code(g,'Journal','journalState','Posted')
code(g,'PeriodAdjustment','adjustmentState','Posted');link(g,'PeriodAdjustment','postingPeriod','NextPeriod')
link(g,'PeriodAdjustment','sourceRecord','ChargeDetailRecord');link(g,'PeriodAdjustment','correctingRecord','CorrectedChargeDetailRecord');time(g,'PeriodAdjustment','postedAt',15)
dec(g,'PeriodAdjustment','adjustmentAmount',-1)
code(g,'ServiceAgreement','agreementState','Terminated');time(g,'ServiceAgreement','validUntil',13)
time(g,'ServiceEntitlement','validUntil',13);time(g,'CommercialResponsibility','validUntil',13);time(g,'AllowanceSponsorship','validUntil',13)
scenario('finance','late-correction',g,
 'ASK {ex:ServiceAgreement cd:agreementState cd:agreementState_Terminated. ex:AccountingPeriod cd:periodState cd:periodState_Closed. ex:PeriodAdjustment cd:postingPeriod ex:NextPeriod; cd:commercialResponsibility ex:CommercialResponsibility; cd:adjustmentState cd:adjustmentState_Posted; cd:adjustmentAmount -1. ex:NextPeriod cd:periodState cd:periodState_Open.}',
 ['BR-178','BR-179','BR-180','BR-207'],[('B178',lambda d:time(d,'AccountingPeriod','closedAt',13)),('B179',lambda d:time(d,'Journal','postedAt',15)),('B180',lambda d:code(d,'NextPeriod','periodState','Closed')),('B180',lambda d:time(d,'PeriodAdjustment','effectiveUsageAt',14)),('B207',lambda d:time(d,'CommercialResponsibility','validUntil',14))])
code(g,'NextPeriod','periodState','Closed');time(g,'NextPeriod','closedAt',18);link(g,'NextPeriod','closingEvidence','EvidenceDocument')
scenario('finance','historical-posting-period',g,
 'ASK {ex:PeriodAdjustment cd:adjustmentState cd:adjustmentState_Posted; cd:postingPeriod ex:NextPeriod; cd:postedAt ?posted. ex:NextPeriod cd:periodState cd:periodState_Closed; cd:closedAt ?closed. FILTER(?posted < ?closed)}',
 ['BR-180'],[])

g=base+Graph();clone(g,'Currency','USDCurrency');text(g,'USDCurrency','currencyCode','USD')
link(g,'ExchangeRate','baseCurrency','USDCurrency');dec(g,'ExchangeRate','conversionRate','.9125')
link(g,'CurrencyConversion','sourceCurrency','USDCurrency');dec(g,'CurrencyConversion','sourceAmount',10);dec(g,'CurrencyConversion','unroundedTargetAmount','9.125');dec(g,'CurrencyConversion','targetAmount','9.13')
setv(g,'RoundingPolicy','decimalPlaces',Literal(2,datatype=XSD.nonNegativeInteger))
dec(g,'AmountRounding','rawAmount','9.125');dec(g,'AmountRounding','roundedAmount','9.13')
link(g,'RatedLine','amountRounding','AmountRounding')
for n in ['RatedLine','RatingCalculation']:
 dec(g,n,'netAmount','9.13');dec(g,n,'grossAmount','9.13')
time(g,'TaxRule','validUntil',13);time(g,'TaxDetermination','taxableAt',12);time(g,'TaxDetermination','determinedAt',15)
scenario('pricing','conversion-and-rounding',g,
 'ASK {ex:CurrencyConversion cd:sourceCurrency ex:USDCurrency; cd:sourceAmount 10; cd:targetAmount 9.13. ex:AmountRounding cd:rawAmount 9.125; cd:roundedAmount 9.13. ex:RatingCalculation cd:netAmount 9.13.}',
 ['BR-181','BR-182','BR-183','BR-184','BR-185'],[('B181',lambda d:dec(d,'AmountRounding','roundedAmount','9.12')),('B182',lambda d:link(d,'CurrencyConversion','sourceCurrency','Currency')),('B183',lambda d:dec(d,'RatingCalculation','netAmount','10')),('B184',lambda d:dec(d,'RatedLine','netAmount','9.12')),('B185',lambda d:time(d,'TaxDetermination','taxableAt',14))])

g=base+Graph()
setv(g,'PricingTimeResolution','sourceLocalTime',Literal('2026-10-25T02:30:00+01:00',datatype=XSD.dateTime))
setv(g,'PricingTimeResolution','resolvedUtcTime',Literal('2026-10-25T01:30:00Z',datatype=XSD.dateTime))
code(g,'PricingTimeResolution','repeatedHourPolicy','Second')
scenario('pricing','repeated-local-hour',g,
 'ASK {ex:PricingTimeResolution cd:repeatedHourPolicy cd:repeatedHourPolicy_Second; cd:timezoneName "Europe/Amsterdam".}',
 ['BR-186'],[('B186',lambda d:setv(d,'PricingTimeResolution','resolvedUtcTime',Literal('2026-10-25T00:30:00Z',datatype=XSD.dateTime))),('IanaTimeResolutionConstraint',lambda d:code(d,'PricingTimeResolution','repeatedHourPolicy','First'))])

g=base+Graph();clone(g,'LegalEntity','Intermediary');clone(g,'LegalEntity','Retailer')
clone(g,'ServiceAgreement','RetailAgreement');clone(g,'SettlementBatch','RetailBatch');clone(g,'SettlementItem','RetailItem');clone(g,'SettlementLeg','RetailLeg')
link(g,'RetailBatch','serviceAgreement','RetailAgreement');link(g,'RetailBatch','settlementItem','RetailItem');link(g,'RetailItem','serviceAgreement','RetailAgreement');link(g,'RetailItem','beneficiary','Intermediary')
link(g,'SettlementLeg','liableParty','Intermediary');link(g,'RetailLeg','liableParty','Retailer');link(g,'RetailLeg','entitledParty','Intermediary')
link(g,'RetailLeg','serviceAgreement','RetailAgreement');link(g,'RetailLeg','settlementBatch','RetailBatch')
for n in ['SettlementLeg','RetailLeg']:code(g,n,'legState','Posted')
for n,amount in [('SettlementLeg',4),('SettlementBatch',4),('SettlementItem',4),('RetailLeg',5),('RetailBatch',5),('RetailItem',5)]:dec(g,n,'netAmount',amount);dec(g,n,'grossAmount',amount)
scenario('settlement','multi-party-legs',g,
 'ASK {ex:SettlementLeg cd:liableParty ex:Intermediary; cd:entitledParty ex:LegalEntity; cd:chargeRecord ?cdr; cd:grossAmount 4. ex:RetailLeg cd:liableParty ex:Retailer; cd:entitledParty ex:Intermediary; cd:chargeRecord ?cdr; cd:grossAmount 5.}',
 ['BR-187','BR-188'],[('B187',lambda d:link(d,'RetailLeg','serviceAgreement','ServiceAgreement')),('B188',lambda d:clone(d,'SettlementLeg','DuplicateLeg'))])

g=base+Graph();code(g,'DataSubjectRequest','requestState','Closed');code(g,'DataSubjectRequest','requestOutcome','Fulfilled');flag(g,'DataSubjectRequest','identityVerified',True);time(g,'DataSubjectRequest','completedAt',13);link(g,'DataSubjectRequest','responseEvidence','EvidenceDocument')
code(g,'DataDisposition','dispositionState','Completed');link(g,'DataDisposition','disposedRecord','Invoice');time(g,'DataDisposition','completedAt',13);link(g,'DataDisposition','dispositionEvidence','EvidenceDocument')
link(g,'LegalHold','heldRecord','Invoice');code(g,'LegalHold','holdState','Released');time(g,'LegalHold','releasedAt',12)
scenario('governance','closed-rights-request',g,
 'ASK {ex:DataSubjectRequest cd:requestState cd:requestState_Closed; cd:requestOutcome cd:requestOutcome_Fulfilled. ex:DataDisposition cd:disposedRecord ex:Invoice. ex:LegalHold cd:heldRecord ex:Invoice; cd:holdState cd:holdState_Released.}',
 ['BR-189','BR-190'],[('B189',lambda d:flag(d,'DataSubjectRequest','identityVerified',False)),('B190',lambda d:code(d,'LegalHold','holdState','Active'))])

g=base+Graph();clone(g,'ProcessStep','FollowingStep');g.add((E.ProcessExecution,C.processStep,E.FollowingStep))
setv(g,'FollowingStep','stepSequence',Literal(2,datatype=XSD.positiveInteger));link(g,'FollowingStep','previousStep','ProcessStep')
for n in ['ProcessStep','FollowingStep']:flag(g,n,'requiredStep',True);code(g,n,'stepState','Succeeded');link(g,n,'outputRecord','Invoice');link(g,n,'stepEvidence','EvidenceDocument')
code(g,'ProcessExecution','processState','Completed');link(g,'ProcessExecution','processEvidence','EvidenceDocument')
scenario('governance','ordered-accountability',g,
 'ASK {ex:ProcessExecution cd:processState cd:processState_Completed; cd:processStep ex:ProcessStep,ex:FollowingStep. ex:FollowingStep cd:previousStep ex:ProcessStep; cd:requiredStep true.}',
 ['BR-191','BR-192'],[('B191',lambda d:code(d,'FollowingStep','stepState','Skipped')),('B192',lambda d:link(d,'ProcessStep','previousStep','FollowingStep'))])

g=base+Graph();flag(g,'Issue','billingBlocking',True);code(g,'Issue','issueState','Resolved');time(g,'Issue','resolvedAt',12)
time(g,'ServiceAgreement','validUntil',14);time(g,'ServiceEntitlement','validUntil',14);time(g,'CommercialResponsibility','validUntil',14)
code(g,'AccountClosure','closureState','Completed');setv(g,'AccountClosure','activeGrantCount',Literal(0,datatype=XSD.nonNegativeInteger));time(g,'AccountClosure','completedAt',13);link(g,'AccountClosure','closureEvidence','EvidenceDocument')
code(g,'CustomerAccount','accountState','Closed');setv(g,'LifecycleSnapshot','stateValue',C.accountState_Closed)
code(g,'AccessGrant','grantState','Revoked');link(g,'AccessGrant','scopeRecord','CustomerAccount')
code(g,'AssetLifecycleEvent','assetAction','Decommission');setv(g,'AssetLifecycleEvent','openSessionCount',Literal(0,datatype=XSD.nonNegativeInteger))
code(g,'EventProcessingOutcome','processingState','Applied');time(g,'EventProcessingOutcome','processedAt',12)
link(g,'PriceDisplay','selectedTariff','TariffVersion')
clone(g,'TariffVersion','ImportedTariff')
scenario('lifecycle','closure-and-evidence',g,
 'ASK {ex:CustomerAccount cd:accountState cd:accountState_Closed. ex:AccountClosure cd:closureState cd:closureState_Completed. ex:Issue cd:billingBlocking true; cd:issueState cd:issueState_Resolved. ex:ChargingSession cd:sessionState cd:sessionState_Completed. ex:AssetLifecycleEvent cd:assetAction cd:assetAction_Decommission.}',
 ['BR-193','BR-194','BR-195','BR-196','BR-197','BR-198','BR-199'],[('B193',lambda d:code(d,'Issue','issueState','Open')),('B194',lambda d:time(d,'ServiceEntitlement','validUntil',15)),('B195',lambda d:code(d,'AccessGrant','grantState','Active')),('B196',lambda d:code(d,'ChargingSession','sessionState','ReconciliationRequired')),('B197',lambda d:link(d,'OwnershipTransfer','nextOwner','ChargingSession')),('B198',lambda d:time(d,'EventProcessingOutcome','processedAt',11)),('B199',lambda d:link(d,'PriceDisplay','selectedTariff','ImportedTariff'))])

g=base+Graph();dec(g,'PaymentIntent','requestedAmount',10);dec(g,'PaymentCapture','capturedAmount',10);dec(g,'Refund','refundAmount',2);code(g,'Refund','refundState','Confirmed');dec(g,'Chargeback','disputedAmount',5)
clone(g,'LegalEntity','OtherBeneficiary')
dec(g,'Payout','payoutAmount',2);code(g,'Payout','payoutState','Confirmed');time(g,'Payout','confirmedAt',13);dec(g,'PayoutBatch','batchTotal',2)
for p,v in [('actualEnergyKWh',7),('baselineEnergyKWh',10),('deliveredAdjustmentKWh',-3)]:dec(g,'FlexibilityDelivery',p,v)
clone(g,'PowerModuleAllocation','SecondAllocation');clone(g,'TimeWindow','FollowingWindow');time(g,'FollowingWindow','startsAt',14);time(g,'FollowingWindow','endsAt',18);link(g,'SecondAllocation','interval','FollowingWindow')
code(g,'ServiceLevelBreach','breachState','Closed');link(g,'ServiceLevelBreach','remedyRecord','RecordCorrection');link(g,'ServiceLevelBreach','closureEvidence','EvidenceDocument')
time(g,'AuthorizationDecision','expiresAt',13)
scenario('operations','financial-and-energy-boundaries',g,
 'ASK {ex:Refund cd:refundState cd:refundState_Confirmed; cd:refundAmount 2. ex:Chargeback cd:disputedAmount 5. ex:FlexibilityDelivery cd:deliveredAdjustmentKWh -3. ex:PowerModuleAllocation cd:interval/cd:endsAt ?end. ex:SecondAllocation cd:interval/cd:startsAt ?end.}',
 ['BR-200','BR-201','BR-202','BR-203','BR-204','BR-205','BR-206','BR-208'],[('B200',lambda d:dec(d,'Refund','refundAmount',-1)),('B201',lambda d:dec(d,'Chargeback','disputedAmount',11)),('B202',lambda d:link(d,'Payout','beneficiary','OtherBeneficiary')),('B203',lambda d:dec(d,'FlexibilityDelivery','deliveredAdjustmentKWh',3)),('B204',lambda d:time(d,'FollowingWindow','startsAt',13)),('B205',lambda d:d.remove((E.ServiceLevelBreach,C.closureEvidence,None))),('B206',lambda d:time(d,'SynchronizationCursor','watermarkAt',13)),('B208',lambda d:time(d,'AuthorizationDecision','expiresAt',12))])

g=base+Graph();dec(g,'PaymentIntent','requestedAmount',10);dec(g,'PaymentCapture','capturedAmount',10)
link(g,'PaymentIntent','invoice','Invoice');code(g,'PaymentIntent','paymentState','Captured')
code(g,'Refund','refundState','Confirmed');dec(g,'Refund','refundAmount',2);time(g,'Refund','requestedAt',13)
code(g,'PaymentAllocation','allocationState','Posted');dec(g,'PaymentAllocation','allocatedAmount',8)
for n in ['Invoice','InvoiceLine']:dec(g,n,'netAmount',10);dec(g,n,'grossAmount',10)
dec(g,'CreditNote','creditAmount',2);code(g,'Invoice','invoiceState','Paid')
link(g,'FinancialPosition','sourceRecord','Invoice');code(g,'FinancialPosition','positionState','Settled');code(g,'FinancialPosition','collectionBasis','PaymentAllocations')
for p,v in [('originalAmount',10),('creditedAmount',2),('collectedAmount',8),('outstandingAmount',0)]:dec(g,'FinancialPosition',p,v)
scenario('financial-state','partial-refund-and-paid-invoice',g,
 'ASK {ex:Invoice cd:invoiceState cd:invoiceState_Paid; cd:grossAmount 10. ex:FinancialPosition cd:creditedAmount 2; cd:collectedAmount 8; cd:outstandingAmount 0. ex:PaymentCapture cd:capturedAmount 10. ex:Refund cd:refundAmount 2; cd:refundState cd:refundState_Confirmed.}',
 ['BR-209','BR-210','BR-211','BR-212','BR-213','BR-214','BR-215'],[('B209',lambda d:code(d,'PaymentIntent','paymentState','Created')),('B210',lambda d:dec(d,'PaymentCapture','capturedAmount',0)),('B211',lambda d:time(d,'Refund','requestedAt',11)),('B212',lambda d:code(d,'FinancialPosition','positionState','Disputed')),('B213',lambda d:link(d,'FinancialPosition','sourceRecord','ChargeDetailRecord')),('B214',lambda d:dec(d,'CreditNote','creditAmount',-2)),('B215',lambda d:dec(d,'Refund','refundAmount',3))])

g=base+Graph();code(g,'Subscription','subscriptionState','Cancelled');flag(g,'Subscription','renewAutomatically',False);time(g,'Subscription','cancelledAt',12);time(g,'Subscription','endsAt',14)
code(g,'BillingPeriod','billingPeriodState','Billed');link(g,'BillingPeriod','invoice','Invoice');code(g,'Invoice','invoiceState','Issued')
scenario('access','subscription-exit',g,
 'ASK {ex:Subscription cd:subscriptionState cd:subscriptionState_Cancelled; cd:renewAutomatically false. ex:BillingPeriod cd:billingPeriodState cd:billingPeriodState_Billed; cd:invoice/cd:invoiceState cd:invoiceState_Issued.}',
 ['BR-216','BR-217'],[('B216',lambda d:flag(d,'Subscription','renewAutomatically',True)),('B217',lambda d:code(d,'Invoice','invoiceState','Draft'))])

g=base+Graph();code(g,'SettlementApproval','approvalState','Approved');setv(g,'SettlementApproval','openDifferenceCount',Literal(0,datatype=XSD.nonNegativeInteger));time(g,'SettlementApproval','approvedAt',13);link(g,'SettlementApproval','approvalEvidence','EvidenceDocument')
# An unrelated open reconciliation is permitted; an open case against this batch is not.
link(g,'ReconciliationCase','expectedRecord','Invoice')
scenario('settlement','reconciled-settlement-approval',g,
 'ASK {ex:SettlementApproval cd:approvalState cd:approvalState_Approved; cd:openDifferenceCount 0. ex:ReconciliationCase cd:expectedRecord ex:Invoice.}',
 ['BR-218'],[('B218',lambda d:link(d,'ReconciliationCase','expectedRecord','SettlementBatch'))])

(P/'tests/completion-scenarios.json').write_text(json.dumps(rows,indent=2)+'\n')
print('Built',len(rows),'complete business scenarios.')
