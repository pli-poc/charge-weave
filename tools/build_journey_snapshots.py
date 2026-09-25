"""Author coherent journey snapshots and one meaningful business fault for each."""
from runtime import *
from rdflib import XSD
import json

base = Graph().parse(P / 'examples/reference.ttl')
rows = []
folder = P / 'examples/journeys'
folder.mkdir(exist_ok=True)

def new():
    return base + Graph()
def setv(g, node, prop, value):
    g.set((E[node], C[prop], value))
def link(g, node, prop, target):
    setv(g, node, prop, E[target])
def code(g, node, prop, value):
    setv(g, node, prop, C[prop + '_' + value])
def number(g, node, prop, value):
    setv(g, node, prop, Literal(str(value), datatype=XSD.decimal))
def integer(g, node, prop, value):
    setv(g, node, prop, Literal(value, datatype=XSD.nonNegativeInteger))
def boolean(g, node, prop, value):
    setv(g, node, prop, Literal(value))
def time(g, node, prop, hour):
    setv(g, node, prop, Literal(f'2026-09-25T{hour:02}:00:00Z', datatype=XSD.dateTime))
def clone(g, source, target):
    for prop, value in list(g.predicate_objects(E[source])):
        g.add((E[target], prop, value))
    setv(g, target, 'canonicalId', Literal(target, datatype=XSD.string))
def save(name, title, graph, query, mutate, rule, journeys):
    for valid in (True, False):
        data = graph + Graph()
        if not valid:
            mutate(data)
        suffix = 'pass' if valid else 'reject'
        path = f'examples/journeys/{name}-{suffix}.ttl'
        (P / path).write_text(data.serialize(format='turtle').rstrip() + '\n')
        rows.append({'id':f'JOURNEY-{name.upper()}-{suffix.upper()}', 'family':name,
                     'title':title, 'file':path, 'expectedConformance':valid,
                     'expectedRule':None if valid else rule, 'journeys':journeys,
                     'assertion':query if valid else None,
                     'validationScope':'Full structural and business SHACL over a complete synthetic graph; no external service execution.'})

g = new()
code(g,'ServiceAgreement','agreementState','Active')
code(g,'AgreementLifecycleEvent','agreementAction','Accept')
code(g,'AccountClosure','closureState','Completed')
integer(g,'AccountClosure','activeGrantCount',0)
number(g,'AccountClosure','openLiabilityAmount','9.50')
link(g,'AccountClosure','residualLiabilityOwner','LegalEntity')
link(g,'AccountClosure','closureEvidence','EvidenceDocument')
time(g,'AccountClosure','completedAt',13)
code(g,'CustomerAccount','accountState','Closed')
setv(g,'LifecycleSnapshot','stateValue',C.accountState_Closed)
save('closure','Accepted contract and customer exit with transferred residual debt',g,
     'ASK { ex:AccountClosure cd:customer ex:CustomerAccount; cd:closureState cd:closureState_Completed; cd:residualLiabilityOwner ?owner. ex:CustomerAccount cd:accountState cd:accountState_Closed. ex:ServiceAgreement cd:financialOwner ?owner; cd:agreementState cd:agreementState_Active. }',
     lambda d:d.remove((E.AccountClosure,C.residualLiabilityOwner,None)), 'B115',['J01','J02','J20'])

g = new()
setv(g,'Currency','currencyCode',Literal('EUR',datatype=XSD.string))
number(g,'ChargingSession','importedEnergyKWh','10')
for node in ['ChargeDetailRecord','CorrectedChargeDetailRecord']:
    number(g,node,'importedEnergyKWh','10')
for node in ['ChargeDetailRecord','CorrectedChargeDetailRecord','RatingCalculation','RatedLine','InvoiceLine','Invoice']:
    number(g,node,'netAmount','4');number(g,node,'taxAmount','.84');number(g,node,'grossAmount','4.84')
for node in ['RatedLine','InvoiceLine']:
    number(g,node,'quantityValue','10');number(g,node,'unitPrice','.4')
link(g,'InvoiceLine','chargeRecord','ChargeDetailRecord')
link(g,'PaymentIntent','invoice','Invoice');link(g,'PaymentIntent','session','ChargingSession')
number(g,'PaymentIntent','requestedAmount','4.84');code(g,'PaymentIntent','paymentState','Captured')
number(g,'PaymentCapture','capturedAmount','4.84');code(g,'PaymentCapture','captureState','Confirmed')
number(g,'PaymentAuthorization','authorizedAmount','4.84')
number(g,'PaymentAllocation','allocatedAmount','4.84');code(g,'PaymentAllocation','allocationState','Posted')
number(g,'FinancialPosition','originalAmount','4.84');number(g,'FinancialPosition','collectedAmount','4.84');number(g,'FinancialPosition','outstandingAmount','0')
code(g,'FinancialPosition','positionState','Settled');link(g,'FinancialPosition','sourceRecord','Invoice')
code(g,'Invoice','invoiceState','Paid');link(g,'ChargingSession','commercialResponsibility','CommercialResponsibility')
save('charge','Completed charging through billability, CDR, invoice, capture and allocated settlement',g,
     'ASK { ex:ChargingSession cd:sessionState cd:sessionState_Completed; cd:importedEnergyKWh ?energy. ex:ChargeDetailRecord cd:session ex:ChargingSession; cd:billingReadiness/cd:readinessState cd:readinessState_Ready. ex:InvoiceLine cd:chargeRecord ex:ChargeDetailRecord. ex:Invoice cd:invoiceLine ex:InvoiceLine; cd:invoiceState cd:invoiceState_Paid. ex:PaymentIntent cd:invoice ex:Invoice. ex:PaymentCapture cd:paymentIntent ex:PaymentIntent; cd:captureState cd:captureState_Confirmed. ex:PaymentAllocation cd:paymentCapture ex:PaymentCapture; cd:financialPosition/cd:outstandingAmount ?balance. FILTER(?energy=10 && ?balance=0) }',
     lambda d:number(d,'PaymentAllocation','allocatedAmount','5.84'),'B138',['J04','J06','J07','J08','J09','J12'])

g = new()
code(g,'ChargeDetailRecord','recordOrigin','Roaming')
for prop,value in [('netAmount','4'),('taxAmount','.84'),('grossAmount','4.84')]:number(g,'ChargeDetailRecord',prop,value)
clone(g,'ChargeDetailRecord','CreditCDR');code(g,'CreditCDR','recordKind','Credit')
link(g,'CreditCDR','originalChargeRecord','ChargeDetailRecord')
for prop,value in [('netAmount','-4'),('taxAmount','-.84'),('grossAmount','-4.84')]:number(g,'CreditCDR',prop,value)
link(g,'RecordCorrection','correctingRecord','CreditCDR');code(g,'RecordCorrection','correctionKind','Credit')
save('credit','Immutable roaming debit followed by a matching credit and correction evidence',g,
     'ASK { ex:RecordCorrection cd:originalRecord ex:ChargeDetailRecord; cd:correctingRecord ex:CreditCDR; cd:correctionEvidence ?e. ex:CreditCDR cd:recordKind cd:recordKind_Credit; cd:originalChargeRecord ex:ChargeDetailRecord; cd:grossAmount ?credit. ex:ChargeDetailRecord cd:grossAmount ?original. FILTER(?credit = -?original) }',
     lambda d:number(d,'CreditCDR','grossAmount','-3.84'),'B133',['J08','J10','J11'])

g = new()
code(g,'OfflineAuthorizationAssessment','offlineDecision','Allow')
for prop,value in [('credentialRevoked',False),('unknownCredential',True),('permitUnknownCredential',True)]:boolean(g,'OfflineAuthorizationAssessment',prop,value)
for prop in ['cacheAgeSeconds','maximumCacheAgeSeconds']:integer(g,'OfflineAuthorizationAssessment',prop,60)
for prop in ['exposureAmount','maximumExposureAmount']:number(g,'OfflineAuthorizationAssessment',prop,'10')
code(g,'AuthorizationDecision','decisionSource','LocalCache')
save('offline','Policy-limited offline authorization with accepted local-cache decision',g,
     'ASK { ex:OfflineAuthorizationAssessment cd:authorizationDecision ex:AuthorizationDecision; cd:offlineDecision cd:offlineDecision_Allow; cd:accountableParty ?p. ex:AuthorizationDecision cd:decision cd:decision_Accepted; cd:decisionSource cd:decisionSource_LocalCache. ex:ChargingSession cd:authorizationDecision ex:AuthorizationDecision. }',
     lambda d:boolean(d,'OfflineAuthorizationAssessment','credentialRevoked',True),'B125',['J05','J06'])

g = new()
number(g,'ChargingSession','importedEnergyKWh','10')
for node in ['ChargeDetailRecord','CorrectedChargeDetailRecord']:number(g,node,'importedEnergyKWh','10')
for prop,value in [('reimbursementAmount','2'),('reimbursementRate','.2'),('reimbursableEnergyKWh','10')]:number(g,'ReimbursementRecord',prop,value)
for prop,value in [('approvedAmount','2'),('approvedRate','.2'),('approvedEnergyKWh','10')]:number(g,'ReimbursementApproval',prop,value)
code(g,'ReimbursementApproval','approvalState','Approved');time(g,'ReimbursementApproval','approvedAt',13);link(g,'ReimbursementApproval','approvalEvidence','EvidenceDocument')
code(g,'ReimbursementRecord','reimbursementState','Paid');link(g,'ReimbursementRecord','reimbursementApproval','ReimbursementApproval');link(g,'ReimbursementRecord','payout','Payout')
number(g,'Payout','payoutAmount','2');code(g,'Payout','payoutState','Confirmed');time(g,'Payout','confirmedAt',13)
number(g,'PayoutBatch','batchTotal','2')
save('reimbursement','Eligible personal charging, approved employer claim and confirmed payout',g,
     'ASK { ex:ReimbursementApproval cd:approvalState cd:approvalState_Approved; cd:reimbursementRecord ex:ReimbursementRecord; cd:entitledAccount ?employee. ex:ReimbursementRecord cd:beneficiaryAccount ?employee; cd:session ex:ChargingSession; cd:payout ex:Payout; cd:reimbursementState cd:reimbursementState_Paid. ex:Payout cd:payoutState cd:payoutState_Confirmed. }',
     lambda d:code(d,'Payout','payoutState','Failed'),'B147',['J13','J14'])

g = new()
code(g,'DataSubjectRequest','requestState','Fulfilled');code(g,'DataSubjectRequest','requestKind','Erasure')
boolean(g,'DataSubjectRequest','identityVerified',True);time(g,'DataSubjectRequest','completedAt',13);link(g,'DataSubjectRequest','responseEvidence','EvidenceDocument')
code(g,'DataDisposition','dispositionState','Completed');time(g,'DataDisposition','completedAt',13);link(g,'DataDisposition','dispositionEvidence','EvidenceDocument');link(g,'DataDisposition','legalHold','LegalHold')
code(g,'LegalHold','holdState','Released');time(g,'LegalHold','releasedAt',13)
save('privacy','Verified erasure request, released scoped hold and evidenced disposition',g,
     'ASK { ex:DataSubjectRequest cd:subjectAccount ?a; cd:requestState cd:requestState_Fulfilled; cd:responseEvidence ?e. ex:DataDisposition cd:subjectAccount ?a; cd:dispositionState cd:dispositionState_Completed; cd:legalHold/cd:holdState cd:holdState_Released. }',
     lambda d:code(d,'LegalHold','holdState','Active'),'B154',['J16','J17'])

g = new()
for prop,value in [('requestedPowerKW','22'),('feasiblePowerKW','11'),('safetyLimitKW','11'),('contractualLimitKW','18')]:number(g,'ControlDecision',prop,value)
code(g,'ControlDecision','controlDecision','Limited');code(g,'ControlDecision','energyDirection','Export');link(g,'ControlDecision','exportAgreement','ExportAgreement')
link(g,'ChargingStation','site','ChargingSite');boolean(g,'ExportAgreement','exportPermitted',True)
save('energy','Export permission and feasible power below safety and contract limits',g,
     'ASK { ex:ControlDecision cd:controlDecision cd:controlDecision_Limited; cd:exportAgreement ex:ExportAgreement; cd:feasiblePowerKW ?p; cd:safetyLimitKW ?limit. ex:ExportAgreement cd:exportPermitted true; cd:exportBeneficiary ?beneficiary. FILTER(?p<=?limit) }',
     lambda d:number(d,'ControlDecision','feasiblePowerKW','22'),'B149',['J15'])

g = new()
for prop,value in [('recoveryTimeObjectiveSeconds',300),('recoveryPointObjectiveSeconds',60),('achievedRecoverySeconds',250),('achievedDataLossSeconds',30)]:
    setv(g,'RecoveryExercise',prop,Literal(value,datatype=XSD.positiveInteger if prop=='recoveryTimeObjectiveSeconds' else XSD.nonNegativeInteger))
code(g,'RecoveryExercise','recoveryResult','Passed')
for prop,value in [('expectedRecordCount',100),('migratedRecordCount',100),('rejectedRecordCount',0)]:integer(g,'MigrationBatch',prop,value)
code(g,'MigrationBatch','migrationState','Completed');boolean(g,'MigrationBatch','sourceCredentialsRevoked',True);link(g,'MigrationBatch','reconciliationEvidence','EvidenceDocument')
save('migration','Measured recovery and reconciled provider exit with source credentials revoked',g,
     'ASK { ex:RecoveryExercise cd:recoveryResult cd:recoveryResult_Passed; cd:recoveryEvidence ?e. ex:MigrationBatch cd:migrationState cd:migrationState_Completed; cd:sourceCredentialsRevoked true; cd:reconciliationEvidence ?e. }',
     lambda d:integer(d,'MigrationBatch','migratedRecordCount',99),'B162',['J18','J19'])

g = new()
code(g,'ChargingStation','assetLifecycle','Operating')
link(g,'ChargingStation','operationalAcceptance','OperationalAcceptance')
code(g,'OperationalAcceptance','acceptanceState','Accepted')
for prop in ['safetyAccepted','protocolAccepted','meteringAccepted']:boolean(g,'OperationalAcceptance',prop,True)
time(g,'OperationalAcceptance','acceptedAt',12)
link(g,'OperationalAcceptance','acceptanceEvidence','EvidenceDocument')
code(g,'AssetLifecycleEvent','assetAction','Activate')
save('asset','Operating station has accepted safety, protocol, meter and maintenance handover',g,
     'ASK { ex:ChargingStation cd:assetLifecycle cd:assetLifecycle_Operating; cd:operationalAcceptance ?handover. ?handover cd:station ex:ChargingStation; cd:acceptanceState cd:acceptanceState_Accepted; cd:maintenanceProvider ?owner; cd:acceptanceEvidence ?e. ex:AssetLifecycleEvent cd:station ex:ChargingStation; cd:accountableParty ?owner. }',
     lambda d:boolean(d,'OperationalAcceptance','safetyAccepted',False),'B117',['J03','J18'])

g = new()
for prop,value in [('openingValue','2'),('grantedValue','20'),('consumedValue','4'),('reservedValue','3'),('expiredValue','1'),('closingValue','14')]:number(g,'AllowanceBalance',prop,value)
number(g,'AllowanceConsumption','consumedValue','4')
number(g,'BenefitReservation','reservedValue','3');code(g,'BenefitReservation','reservationState','Active')
save('allowance','Period allowance reconciles rollover, grant, actual use, active reservation and expiry',g,
     'ASK { ex:AllowanceConsumption cd:allowanceBalance ex:AllowanceBalance; cd:session ?used; cd:consumedValue ?usage. ex:BenefitReservation cd:allowanceBalance ex:AllowanceBalance; cd:reservationState cd:reservationState_Active; cd:reservedValue ?reserved. ex:AllowanceBalance cd:customer ?payer; cd:consumedValue ?usage; cd:reservedValue ?reserved; cd:closingValue ?available. FILTER(?available=14 && ?usage=4 && ?reserved=3) }',
     lambda d:number(d,'AllowanceConsumption','consumedValue','5'),'B171',['J14'])

g = new()
code(g,'AccessDecision','accessDecision','Permit');link(g,'AccessDecision','accessGrant','AccessGrant')
code(g,'AccessGrant','grantState','Active')
time(g,'AccessDecision','decidedAt',13);time(g,'AccessGrant','validFrom',12);time(g,'AccessGrant','validUntil',14)
save('access','Time-valid scoped permission is the basis of an operational access decision',g,
     'ASK { ex:AccessDecision cd:accessDecision cd:accessDecision_Permit; cd:grantee ?principal; cd:scopeRecord ?scope; cd:permission ?permission; cd:accessGrant ?grant. ?grant cd:grantee ?principal; cd:scopeRecord ?scope; cd:securityRole/cd:permission ?permission; cd:grantState cd:grantState_Active. }',
     lambda d:code(d,'AccessGrant','grantState','Revoked'),'B157',['J17'])

g = new()
code(g,'SettlementApproval','approvalState','Approved')
integer(g,'SettlementApproval','openDifferenceCount',0)
link(g,'SettlementApproval','approvalEvidence','EvidenceDocument');time(g,'SettlementApproval','approvedAt',13)
code(g,'SettlementBatch','settlementState','Approved')
save('settlement','Partner settlement release retains reconciled approval and contract ownership',g,
     'ASK { ex:SettlementApproval cd:settlementBatch ex:SettlementBatch; cd:approvalState cd:approvalState_Approved; cd:approvalEvidence ?e. ex:SettlementBatch cd:serviceAgreement ?agreement; cd:settlementItem ?item; cd:settlementState cd:settlementState_Approved. ?agreement cd:financialOwner ?owner. }',
     lambda d:integer(d,'SettlementApproval','openDifferenceCount',1),'B144',['J12'])

g = new()
code(g,'ProcessExecution','processState','Completed');link(g,'ProcessExecution','processEvidence','EvidenceDocument')
code(g,'ProcessStep','stepState','Compensated');link(g,'ProcessStep','compensationRecord','RecordCorrection')
save('process','Completed exception journey retains responsibility and correction for compensated step',g,
     'ASK { ex:ProcessExecution cd:processState cd:processState_Completed; cd:financialOwner ?owner; cd:processStep ex:ProcessStep. ex:ProcessStep cd:responsibleParty ?owner; cd:stepState cd:stepState_Compensated; cd:compensationRecord/cd:correctionEvidence ?e. }',
     lambda d:d.remove((E.ProcessStep,C.compensationRecord,None)),'B167',['J20'])

(P / 'tests/journey-snapshots.json').write_text(json.dumps(rows,indent=2)+'\n')
print(f'Built {len(rows)} full-graph journey acceptance snapshots.')
