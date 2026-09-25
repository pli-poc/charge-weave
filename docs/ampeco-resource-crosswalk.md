# AMPECO resource crosswalk

Captured public catalogue: 25 September 2026, displayed version v3.253.0. Each listed family has a domain representation and named structural shapes. This is a semantic resource-family crosswalk, not a claim that every API field or vendor business rule has been replicated. Deprecated API families remain accounted for.

| AMPECO family | Canonical classes | Source | Evidence |
|---|---|---|---|
| admins | Principal, AccessGrant, SecurityRole, Permission | [Reference](https://developers.ampeco.com/reference/adminread) | Retrieved body |
| authorizations | AuthorizationRequest, AuthorizationDecision | [Reference](https://developers.ampeco.com/reference/authorizationreadv2_1) | Retrieved body |
| booking requests | BookingRequest | [Reference](https://developers.ampeco.com/reference/bookingrequestcreate) | Retrieved body |
| bookings | Booking | [Reference](https://developers.ampeco.com/reference/bookingread) | Retrieved body |
| cdrs | ChargeDetailRecord | [Reference](https://developers.ampeco.com/reference/cdrread) | Retrieved body |
| charge point downtime periods | DowntimePeriod, OperationalPeriod | [Reference](https://developers.ampeco.com/reference/chargepointdowntimeperiodcreate) | Navigation only; body retrieval failed |
| charge point models | EquipmentModel, DeviceCapability | [Reference](https://developers.ampeco.com/reference/chargepointmodelcreate) | Retrieved body |
| charge point vendors | Manufacturer | [Reference](https://developers.ampeco.com/reference/chargepointvendorcreate) | Retrieved body |
| charge points | ChargingStation, ProtocolEndpoint, ConfigurationVariable, HardwareStatusObservation, ConnectionObservation | [Reference](https://developers.ampeco.com/reference/chargepointcreate) | Retrieved body |
| circuits | LoadControlGroup, ControlGroupMembership, PowerConstraint, PhaseCurrentConstraint | [Reference](https://developers.ampeco.com/reference/circuitcreate) | Retrieved body |
| configuration templates | ConfigurationTemplate, ConfigurationTemplateEntry, TemplateApplication | [Reference](https://developers.ampeco.com/reference/configurationtemplatevariablecreate) | Retrieved body |
| consent-history | ConsentDecision | [Reference](https://developers.ampeco.com/reference/consenthistorylisting) | Retrieved body |
| consents | ConsentDecision | [Reference](https://developers.ampeco.com/reference/consentscreate) | Navigation only; body retrieval failed |
| contact details | ContactProfile | [Reference](https://developers.ampeco.com/reference/contactdetailsread) | Retrieved body |
| currencies | Currency | [Reference](https://developers.ampeco.com/reference/currencycreate) | Navigation only; body retrieval failed |
| currency rates | ExchangeRate | [Reference](https://developers.ampeco.com/reference/createcurrencyrate) | Navigation only; body retrieval failed |
| custom fees | CustomFee | [Reference](https://developers.ampeco.com/reference/customfeeread) | Retrieved body |
| downtime period notices | ServiceNotice | [Reference](https://developers.ampeco.com/reference/postdowntimeperiodnotice) | Retrieved body |
| electricity meters | ElectricityMeter, MeterObservation | [Reference](https://developers.ampeco.com/reference/electricitymetercreate) | Navigation only; body retrieval failed |
| electricity rates | ElectricityPriceSchedule, ElectricityPriceInterval, EnergyMix | [Reference](https://developers.ampeco.com/reference/electricityratecreate) | Retrieved body |
| energy coupon templates | EnergyCouponTemplate | [Reference](https://developers.ampeco.com/reference/energycoupontemplatecreate) | Retrieved body |
| energy coupons | EnergyCoupon, CouponConsumption | [Reference](https://developers.ampeco.com/reference/energycouponcreate) | Retrieved body |
| evse downtime periods | DowntimePeriod | [Reference](https://developers.ampeco.com/reference/evsedowntimeperiodcreate) | Navigation only; body retrieval failed |
| evses | ChargingUnit, Connector | [Reference](https://developers.ampeco.com/reference/evsecreate) | Retrieved body |
| faqs | HelpArticle | [Reference](https://developers.ampeco.com/reference/faqcreate) | Navigation only; body retrieval failed |
| firmware versions | FirmwareRelease | [Reference](https://developers.ampeco.com/reference/firmwareversionread) | Retrieved body |
| flexibility activation requests | FlexibilityActivation, FlexibilityDelivery | [Reference](https://developers.ampeco.com/reference/getflexibilityactivationrequest) | Retrieved body |
| flexibility assets | FlexibilityAsset, EnergyForecast | [Reference](https://developers.ampeco.com/reference/createflexibilityasset) | Retrieved body |
| id tags | ChargingCredential, CredentialAssignment | [Reference](https://developers.ampeco.com/reference/idtagcreate) | Retrieved body |
| installation and maintenance companies | LegalEntity, PartyRole | [Reference](https://developers.ampeco.com/reference/createinstallationandmaintenancecompany) | Retrieved body |
| installer jobs | InstallationJob | [Reference](https://developers.ampeco.com/reference/createinstallerjob) | Retrieved body |
| invoices | Invoice, InvoiceLine, FiscalizationAttempt | [Reference](https://developers.ampeco.com/reference/invoiceread) | Retrieved body |
| issues | Issue, RecoveryAttempt | [Reference](https://developers.ampeco.com/reference/issuescreate) | Retrieved body |
| locations | ChargingSite, PublicListing, ChargingArea | [Reference](https://developers.ampeco.com/reference/locationcreate) | Retrieved body |
| ocpi commands | RoamingCommand | [Reference](https://developers.ampeco.com/reference/ocpicommandread) | Retrieved body |
| operators | OperatorService | [Reference](https://developers.ampeco.com/reference/operatorread) | Retrieved body |
| parking spaces | ParkingSpace | [Reference](https://developers.ampeco.com/reference/createparkingspace) | Navigation only; body retrieval failed |
| partner contracts | ServiceAgreement, RevenueShareRule, CostAllocationRule, SettlementOverride | [Reference](https://developers.ampeco.com/reference/partnercontractcreate) | Navigation only; body retrieval failed |
| partner invite access policies | SiteAccessPolicy | [Reference](https://developers.ampeco.com/reference/partnerinviteaccesspolicydelete) | Retrieved body |
| partner invite corporate billing policies | CorporateBillingPolicy, CorporateChargerRule | [Reference](https://developers.ampeco.com/reference/partnerinvitecorporatebillingpolicycreate) | Retrieved body |
| partner invite corporate billing policy snapshots | CorporateBillingSnapshot | [Reference](https://developers.ampeco.com/reference/partnerinvitecorporatebillingpolicysnapshotread) | Retrieved body |
| partner invites | PartnerInvitation | [Reference](https://developers.ampeco.com/reference/partnerinvitecreatev2_0) | Retrieved body |
| partner invoices | Invoice, CreditNote | [Reference](https://developers.ampeco.com/reference/partnerinvoiceread) | Retrieved body |
| partner settlement reports | SettlementBatch, SettlementItem | [Reference](https://developers.ampeco.com/reference/partnersettlementreportread) | Navigation only; body retrieval failed |
| partners | LegalEntity, PartyRole, ServiceAgreement | [Reference](https://developers.ampeco.com/reference/partnercreate) | Retrieved body |
| payment terminals | PaymentTerminal | [Reference](https://developers.ampeco.com/reference/createpaymentterminalv1_1) | Retrieved body |
| provisioning certificate | ProvisioningCertificate, PlugAndChargeEnrollment | [Reference](https://developers.ampeco.com/reference/createpcid) | Retrieved body |
| receipts | Receipt | [Reference](https://developers.ampeco.com/reference/receiptread) | Retrieved body |
| reimbursement policies | ReimbursementPolicy | [Reference](https://developers.ampeco.com/reference/reimbursementpolicycreate) | Retrieved body |
| reimbursement records | ReimbursementRecord | [Reference](https://developers.ampeco.com/reference/reimbursementrecordread) | Retrieved body |
| reimbursement reports | ReimbursementReport | [Reference](https://developers.ampeco.com/reference/reimbursementreportread) | Retrieved body |
| reservations | Reservation | [Reference](https://developers.ampeco.com/reference/reservationread) | Retrieved body |
| revenues & expenses | RatedLine, SettlementItem, LedgerAccount, JournalLine | [Reference](https://developers.ampeco.com/reference/revenuesv1_2listing) | Retrieved body |
| rfids | ChargingCredential | [Reference](https://developers.ampeco.com/reference/rfidtagcreatedeprecated) | Navigation only; body retrieval failed |
| roaming connections | RoamingConnection, RoamingModuleAgreement | [Reference](https://developers.ampeco.com/reference/getroamingconnection) | Retrieved body |
| roaming cpos | RoamingParty | [Reference](https://developers.ampeco.com/reference/roamingcporead) | Retrieved body |
| roaming emsps | RoamingParty | [Reference](https://developers.ampeco.com/reference/roamingemspcreate) | Retrieved body |
| roaming operators | RoamingParty, RoamingTariffFilter | [Reference](https://developers.ampeco.com/reference/roamingoperatorread) | Navigation only; body retrieval failed |
| roaming platforms | RoamingNetwork | [Reference](https://developers.ampeco.com/reference/roamingplatformreaddeprecated) | Retrieved body |
| roaming providers | LegalEntity, RoamingNetwork | [Reference](https://developers.ampeco.com/reference/roamingprovidercreate) | Navigation only; body retrieval failed |
| roaming tariffs | TariffVersion, RoamingTariffMapping | [Reference](https://developers.ampeco.com/reference/roamingtariffread) | Retrieved body |
| security event logs | SecurityEvent | [Reference](https://developers.ampeco.com/reference/securityeventlogreaddeprecated) | Retrieved body |
| security events | SecurityEvent | [Reference](https://developers.ampeco.com/reference/securityeventread) | Retrieved body |
| sessions | ChargingSession, ChargingInterval, SessionEvent, UsageAggregate | [Reference](https://developers.ampeco.com/reference/sessionread) | Retrieved body |
| settings | PlatformSetting | [Reference](https://developers.ampeco.com/reference/settingslisting) | Navigation only; body retrieval failed |
| sharing invites | SharingInvitation | [Reference](https://developers.ampeco.com/reference/sharinginviteread) | Retrieved body |
| sub operators | OperatorService, ManagementDelegation | [Reference](https://developers.ampeco.com/reference/suboperatorcreate) | Retrieved body |
| subscription-plans | SubscriptionPlan, BenefitAllowance | [Reference](https://developers.ampeco.com/reference/subscriptionplancreate) | Retrieved body |
| subscriptions | Subscription, BillingPeriod | [Reference](https://developers.ampeco.com/reference/subscriptionread) | Retrieved body |
| tariffs | Tariff, TariffVersion, PriceComponent, PricingCondition, TariffSet, TariffAssignment, ScheduledTariffChange | [Reference](https://developers.ampeco.com/reference/tariffcreate) | Retrieved body |
| tax identification numbers | TaxIdentifier | [Reference](https://developers.ampeco.com/reference/taxidentificationnumbercreate) | Retrieved body |
| taxes | TaxRule, TaxDetermination | [Reference](https://developers.ampeco.com/reference/taxcreate) | Retrieved body |
| templates | ContentTemplate | [Reference](https://developers.ampeco.com/reference/templateslisting) | Retrieved body |
| terms and policies | PolicyDocument | [Reference](https://developers.ampeco.com/reference/termsandpoliciesread) | Retrieved body |
| top-up packages | TopUpOffer | [Reference](https://developers.ampeco.com/reference/topuppackagcreate) | Navigation only; body retrieval failed |
| transactions | PaymentIntent, PaymentAuthorization, PaymentCapture | [Reference](https://developers.ampeco.com/reference/transactionscreate) | Retrieved body |
| user-devices | UserDevice | [Reference](https://developers.ampeco.com/reference/userdeviceread) | Retrieved body |
| user-groups | CustomerGroup, GroupMembership | [Reference](https://developers.ampeco.com/reference/usergroupcreate) | Retrieved body |
| users | CustomerAccount, Person, BillingProfile, PaymentInstrument | [Reference](https://developers.ampeco.com/reference/usercreatev1_1) | Retrieved body |
| utilities | LegalEntity, PartyRole | [Reference](https://developers.ampeco.com/reference/createutility) | Navigation only; body retrieval failed |
| vehicles | Vehicle, VehicleAssignment, VehicleTelemetry | [Reference](https://developers.ampeco.com/reference/vehicletelemetryreadingcreate) | Retrieved body |
| vendor error codes | VendorFaultDefinition | [Reference](https://developers.ampeco.com/reference/vendorerrorcodecreate) | Retrieved body |
| vouchers | Voucher, VoucherRedemption | [Reference](https://developers.ampeco.com/reference/vouchercreate) | Retrieved body |
