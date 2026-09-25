# External platform resource crosswalk

Captured public catalogue: 25 September 2026, displayed version v3.253.0. Each listed family has a domain representation and named structural shapes. This is a semantic resource-family crosswalk, not a claim that every API field or vendor business rule has been replicated. Deprecated API families remain accounted for.

| External platform family | Canonical classes | Source | Evidence |
|---|---|---|---|
| admins | Principal, AccessGrant, SecurityRole, Permission | [Reference](urn:chargeweave:legacy-api/reference/adminread) | Retrieved body |
| authorizations | AuthorizationRequest, AuthorizationDecision | [Reference](urn:chargeweave:legacy-api/reference/authorizationreadv2_1) | Retrieved body |
| booking requests | BookingRequest | [Reference](urn:chargeweave:legacy-api/reference/bookingrequestcreate) | Retrieved body |
| bookings | Booking | [Reference](urn:chargeweave:legacy-api/reference/bookingread) | Retrieved body |
| cdrs | ChargeDetailRecord | [Reference](urn:chargeweave:legacy-api/reference/cdrread) | Retrieved body |
| charge point downtime periods | DowntimePeriod, OperationalPeriod | [Reference](urn:chargeweave:legacy-api/reference/chargepointdowntimeperiodcreate) | Navigation only; body retrieval failed |
| charge point models | EquipmentModel, DeviceCapability | [Reference](urn:chargeweave:legacy-api/reference/chargepointmodelcreate) | Retrieved body |
| charge point vendors | Manufacturer | [Reference](urn:chargeweave:legacy-api/reference/chargepointvendorcreate) | Retrieved body |
| charge points | ChargingStation, ProtocolEndpoint, ConfigurationVariable, HardwareStatusObservation, ConnectionObservation | [Reference](urn:chargeweave:legacy-api/reference/chargepointcreate) | Retrieved body |
| circuits | LoadControlGroup, ControlGroupMembership, PowerConstraint, PhaseCurrentConstraint | [Reference](urn:chargeweave:legacy-api/reference/circuitcreate) | Retrieved body |
| configuration templates | ConfigurationTemplate, ConfigurationTemplateEntry, TemplateApplication | [Reference](urn:chargeweave:legacy-api/reference/configurationtemplatevariablecreate) | Retrieved body |
| consent-history | ConsentDecision | [Reference](urn:chargeweave:legacy-api/reference/consenthistorylisting) | Retrieved body |
| consents | ConsentDecision | [Reference](urn:chargeweave:legacy-api/reference/consentscreate) | Navigation only; body retrieval failed |
| contact details | ContactProfile | [Reference](urn:chargeweave:legacy-api/reference/contactdetailsread) | Retrieved body |
| currencies | Currency | [Reference](urn:chargeweave:legacy-api/reference/currencycreate) | Navigation only; body retrieval failed |
| currency rates | ExchangeRate | [Reference](urn:chargeweave:legacy-api/reference/createcurrencyrate) | Navigation only; body retrieval failed |
| custom fees | CustomFee | [Reference](urn:chargeweave:legacy-api/reference/customfeeread) | Retrieved body |
| downtime period notices | ServiceNotice | [Reference](urn:chargeweave:legacy-api/reference/postdowntimeperiodnotice) | Retrieved body |
| electricity meters | ElectricityMeter, MeterObservation | [Reference](urn:chargeweave:legacy-api/reference/electricitymetercreate) | Navigation only; body retrieval failed |
| electricity rates | ElectricityPriceSchedule, ElectricityPriceInterval, EnergyMix | [Reference](urn:chargeweave:legacy-api/reference/electricityratecreate) | Retrieved body |
| energy coupon templates | EnergyCouponTemplate | [Reference](urn:chargeweave:legacy-api/reference/energycoupontemplatecreate) | Retrieved body |
| energy coupons | EnergyCoupon, CouponConsumption | [Reference](urn:chargeweave:legacy-api/reference/energycouponcreate) | Retrieved body |
| evse downtime periods | DowntimePeriod | [Reference](urn:chargeweave:legacy-api/reference/evsedowntimeperiodcreate) | Navigation only; body retrieval failed |
| evses | ChargingUnit, Connector | [Reference](urn:chargeweave:legacy-api/reference/evsecreate) | Retrieved body |
| faqs | HelpArticle | [Reference](urn:chargeweave:legacy-api/reference/faqcreate) | Navigation only; body retrieval failed |
| firmware versions | FirmwareRelease | [Reference](urn:chargeweave:legacy-api/reference/firmwareversionread) | Retrieved body |
| flexibility activation requests | FlexibilityActivation, FlexibilityDelivery | [Reference](urn:chargeweave:legacy-api/reference/getflexibilityactivationrequest) | Retrieved body |
| flexibility assets | FlexibilityAsset, EnergyForecast | [Reference](urn:chargeweave:legacy-api/reference/createflexibilityasset) | Retrieved body |
| id tags | ChargingCredential, CredentialAssignment | [Reference](urn:chargeweave:legacy-api/reference/idtagcreate) | Retrieved body |
| installation and maintenance companies | LegalEntity, PartyRole | [Reference](urn:chargeweave:legacy-api/reference/createinstallationandmaintenancecompany) | Retrieved body |
| installer jobs | InstallationJob | [Reference](urn:chargeweave:legacy-api/reference/createinstallerjob) | Retrieved body |
| invoices | Invoice, InvoiceLine, FiscalizationAttempt | [Reference](urn:chargeweave:legacy-api/reference/invoiceread) | Retrieved body |
| issues | Issue, RecoveryAttempt | [Reference](urn:chargeweave:legacy-api/reference/issuescreate) | Retrieved body |
| locations | ChargingSite, PublicListing, ChargingArea | [Reference](urn:chargeweave:legacy-api/reference/locationcreate) | Retrieved body |
| ocpi commands | RoamingCommand | [Reference](urn:chargeweave:legacy-api/reference/ocpicommandread) | Retrieved body |
| operators | OperatorService | [Reference](urn:chargeweave:legacy-api/reference/operatorread) | Retrieved body |
| parking spaces | ParkingSpace | [Reference](urn:chargeweave:legacy-api/reference/createparkingspace) | Navigation only; body retrieval failed |
| partner contracts | ServiceAgreement, RevenueShareRule, CostAllocationRule, SettlementOverride | [Reference](urn:chargeweave:legacy-api/reference/partnercontractcreate) | Navigation only; body retrieval failed |
| partner invite access policies | SiteAccessPolicy | [Reference](urn:chargeweave:legacy-api/reference/partnerinviteaccesspolicydelete) | Retrieved body |
| partner invite corporate billing policies | CorporateBillingPolicy, CorporateChargerRule | [Reference](urn:chargeweave:legacy-api/reference/partnerinvitecorporatebillingpolicycreate) | Retrieved body |
| partner invite corporate billing policy snapshots | CorporateBillingSnapshot | [Reference](urn:chargeweave:legacy-api/reference/partnerinvitecorporatebillingpolicysnapshotread) | Retrieved body |
| partner invites | PartnerInvitation | [Reference](urn:chargeweave:legacy-api/reference/partnerinvitecreatev2_0) | Retrieved body |
| partner invoices | Invoice, CreditNote | [Reference](urn:chargeweave:legacy-api/reference/partnerinvoiceread) | Retrieved body |
| partner settlement reports | SettlementBatch, SettlementItem | [Reference](urn:chargeweave:legacy-api/reference/partnersettlementreportread) | Navigation only; body retrieval failed |
| partners | LegalEntity, PartyRole, ServiceAgreement | [Reference](urn:chargeweave:legacy-api/reference/partnercreate) | Retrieved body |
| payment terminals | PaymentTerminal | [Reference](urn:chargeweave:legacy-api/reference/createpaymentterminalv1_1) | Retrieved body |
| provisioning certificate | ProvisioningCertificate, PlugAndChargeEnrollment | [Reference](urn:chargeweave:legacy-api/reference/createpcid) | Retrieved body |
| receipts | Receipt | [Reference](urn:chargeweave:legacy-api/reference/receiptread) | Retrieved body |
| reimbursement policies | ReimbursementPolicy | [Reference](urn:chargeweave:legacy-api/reference/reimbursementpolicycreate) | Retrieved body |
| reimbursement records | ReimbursementRecord | [Reference](urn:chargeweave:legacy-api/reference/reimbursementrecordread) | Retrieved body |
| reimbursement reports | ReimbursementReport | [Reference](urn:chargeweave:legacy-api/reference/reimbursementreportread) | Retrieved body |
| reservations | Reservation | [Reference](urn:chargeweave:legacy-api/reference/reservationread) | Retrieved body |
| revenues & expenses | RatedLine, SettlementItem, LedgerAccount, JournalLine | [Reference](urn:chargeweave:legacy-api/reference/revenuesv1_2listing) | Retrieved body |
| rfids | ChargingCredential | [Reference](urn:chargeweave:legacy-api/reference/rfidtagcreatedeprecated) | Navigation only; body retrieval failed |
| roaming connections | RoamingConnection, RoamingModuleAgreement | [Reference](urn:chargeweave:legacy-api/reference/getroamingconnection) | Retrieved body |
| roaming cpos | RoamingParty | [Reference](urn:chargeweave:legacy-api/reference/roamingcporead) | Retrieved body |
| roaming emsps | RoamingParty | [Reference](urn:chargeweave:legacy-api/reference/roamingemspcreate) | Retrieved body |
| roaming operators | RoamingParty, RoamingTariffFilter | [Reference](urn:chargeweave:legacy-api/reference/roamingoperatorread) | Navigation only; body retrieval failed |
| roaming platforms | RoamingNetwork | [Reference](urn:chargeweave:legacy-api/reference/roamingplatformreaddeprecated) | Retrieved body |
| roaming providers | LegalEntity, RoamingNetwork | [Reference](urn:chargeweave:legacy-api/reference/roamingprovidercreate) | Navigation only; body retrieval failed |
| roaming tariffs | TariffVersion, RoamingTariffMapping | [Reference](urn:chargeweave:legacy-api/reference/roamingtariffread) | Retrieved body |
| security event logs | SecurityEvent | [Reference](urn:chargeweave:legacy-api/reference/securityeventlogreaddeprecated) | Retrieved body |
| security events | SecurityEvent | [Reference](urn:chargeweave:legacy-api/reference/securityeventread) | Retrieved body |
| sessions | ChargingSession, ChargingInterval, SessionEvent, UsageAggregate | [Reference](urn:chargeweave:legacy-api/reference/sessionread) | Retrieved body |
| settings | PlatformSetting | [Reference](urn:chargeweave:legacy-api/reference/settingslisting) | Navigation only; body retrieval failed |
| sharing invites | SharingInvitation | [Reference](urn:chargeweave:legacy-api/reference/sharinginviteread) | Retrieved body |
| sub operators | OperatorService, ManagementDelegation | [Reference](urn:chargeweave:legacy-api/reference/suboperatorcreate) | Retrieved body |
| subscription-plans | SubscriptionPlan, BenefitAllowance | [Reference](urn:chargeweave:legacy-api/reference/subscriptionplancreate) | Retrieved body |
| subscriptions | Subscription, BillingPeriod | [Reference](urn:chargeweave:legacy-api/reference/subscriptionread) | Retrieved body |
| tariffs | Tariff, TariffVersion, PriceComponent, PricingCondition, TariffSet, TariffAssignment, ScheduledTariffChange | [Reference](urn:chargeweave:legacy-api/reference/tariffcreate) | Retrieved body |
| tax identification numbers | TaxIdentifier | [Reference](urn:chargeweave:legacy-api/reference/taxidentificationnumbercreate) | Retrieved body |
| taxes | TaxRule, TaxDetermination | [Reference](urn:chargeweave:legacy-api/reference/taxcreate) | Retrieved body |
| templates | ContentTemplate | [Reference](urn:chargeweave:legacy-api/reference/templateslisting) | Retrieved body |
| terms and policies | PolicyDocument | [Reference](urn:chargeweave:legacy-api/reference/termsandpoliciesread) | Retrieved body |
| top-up packages | TopUpOffer | [Reference](urn:chargeweave:legacy-api/reference/topuppackagcreate) | Navigation only; body retrieval failed |
| transactions | PaymentIntent, PaymentAuthorization, PaymentCapture | [Reference](urn:chargeweave:legacy-api/reference/transactionscreate) | Retrieved body |
| user-devices | UserDevice | [Reference](urn:chargeweave:legacy-api/reference/userdeviceread) | Retrieved body |
| user-groups | CustomerGroup, GroupMembership | [Reference](urn:chargeweave:legacy-api/reference/usergroupcreate) | Retrieved body |
| users | CustomerAccount, Person, BillingProfile, PaymentInstrument | [Reference](urn:chargeweave:legacy-api/reference/usercreatev1_1) | Retrieved body |
| utilities | LegalEntity, PartyRole | [Reference](urn:chargeweave:legacy-api/reference/createutility) | Navigation only; body retrieval failed |
| vehicles | Vehicle, VehicleAssignment, VehicleTelemetry | [Reference](urn:chargeweave:legacy-api/reference/vehicletelemetryreadingcreate) | Retrieved body |
| vendor error codes | VendorFaultDefinition | [Reference](urn:chargeweave:legacy-api/reference/vendorerrorcodecreate) | Retrieved body |
| vouchers | Voucher, VoucherRedemption | [Reference](urn:chargeweave:legacy-api/reference/vouchercreate) | Retrieved body |
