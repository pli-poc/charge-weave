# Endpoint-to-domain traceability

Every endpoint entry observed in the public catalogue is assigned to domain classes. CRUD operations are representations of these classes. Actions additionally have controlled command kinds. A mapping is not an implemented adapter or a field-level equivalence assertion.

| Group | Operation | Classes | Source |
|---|---|---|---|
| action / certificate | Certificate / Reissue an EMAID | PlugAndChargeEnrollment, CertificateRecord | [Reference](urn:chargeweave:legacy-api/reference/certificatereissueanemaid) |
| action / certificate | Certificate / Issue an EMAID | PlugAndChargeEnrollment, CertificateRecord | [Reference](urn:chargeweave:legacy-api/reference/certificateissueanemaid) |
| action / charge point | Charge Point / Change Availability | ChargingStation, RemoteCommand | [Reference](urn:chargeweave:legacy-api/reference/chargepointchangeavailability) |
| action / charge point | Charge Point / Change Owner | ChargingStation, RemoteCommand | [Reference](urn:chargeweave:legacy-api/reference/chargepointchangeowner) |
| action / charge point | Charge Point / Check Tariff Display Support | ChargingStation, RemoteCommand | [Reference](urn:chargeweave:legacy-api/reference/chargepointchecktariffdisplaysupport) |
| action / charge point | Charge Point / Clear cache | ChargingStation, RemoteCommand | [Reference](urn:chargeweave:legacy-api/reference/chargepointclearcache) |
| action / charge point | Charge Point / Clear Charging Profile | ChargingStation, RemoteCommand | [Reference](urn:chargeweave:legacy-api/reference/chargepointclearchargingprofile) |
| action / charge point | Charge Point / Disconnect | ChargingStation, RemoteCommand | [Reference](urn:chargeweave:legacy-api/reference/chargepointdisconnect) |
| action / charge point | Charge Point / Get Composite Schedule | ChargingStation, RemoteCommand | [Reference](urn:chargeweave:legacy-api/reference/chargepointgetcompositeschedule) |
| action / charge point | Charge Point / Get Diagnostics | ChargingStation, RemoteCommand | [Reference](urn:chargeweave:legacy-api/reference/chargepointgetdiagnostics) |
| action / charge point | Charge Point / Get Local List Version | ChargingStation, RemoteCommand | [Reference](urn:chargeweave:legacy-api/reference/chargepointgetlocallistversion) |
| action / charge point | Charge Point / Get Security Log | ChargingStation, RemoteCommand | [Reference](urn:chargeweave:legacy-api/reference/chargepointgetsecuritylog) |
| action / charge point | Charge Point / Move EVSEs to Satellite | ChargingStation, RemoteCommand | [Reference](urn:chargeweave:legacy-api/reference/chargepointmoveevsestosatellite) |
| action / charge point | Charge Point / Reserve | ChargingStation, RemoteCommand | [Reference](urn:chargeweave:legacy-api/reference/chargepointreserve) |
| action / charge point | Charge Point / Reset Security Profile | ChargingStation, RemoteCommand | [Reference](urn:chargeweave:legacy-api/reference/chargepointresetsecurityprofile) |
| action / charge point | Charge Point / Reset | ChargingStation, RemoteCommand | [Reference](urn:chargeweave:legacy-api/reference/chargepointreset) |
| action / charge point | Charge Point / Send Custom OCPP Command | ChargingStation, RemoteCommand | [Reference](urn:chargeweave:legacy-api/reference/chargepointsendcustomocpp) |
| action / charge point | Charge Point / Send Data Transfer | ChargingStation, RemoteCommand | [Reference](urn:chargeweave:legacy-api/reference/chargepointsenddatatransfer) |
| action / charge point | Charge Point / Set Charging Profile | ChargingStation, RemoteCommand | [Reference](urn:chargeweave:legacy-api/reference/chargepointsetchargingprofile) |
| action / charge point | Charge Point / Start Charging Session Without EVSE | ChargingStation, RemoteCommand | [Reference](urn:chargeweave:legacy-api/reference/chargepointstartchargingsessionwithoutevse) |
| action / charge point | Charge Point / Start Charging Session | ChargingStation, RemoteCommand | [Reference](urn:chargeweave:legacy-api/reference/chargepointstartchargingsession) |
| action / charge point | Charge Point / Stop Charging Session | ChargingStation, RemoteCommand | [Reference](urn:chargeweave:legacy-api/reference/chargepointstopchargingsession) |
| action / charge point | Charge point / Sync configuration | ChargingStation, RemoteCommand | [Reference](urn:chargeweave:legacy-api/reference/chargepointsyncconfiguration) |
| action / charge point | Charge Point / Trigger Message Charge Point | ChargingStation, RemoteCommand | [Reference](urn:chargeweave:legacy-api/reference/chargepointtriggermessagechargepoint) |
| action / charge point | Charge Point / EVSE / Unlock | ChargingStation, RemoteCommand | [Reference](urn:chargeweave:legacy-api/reference/chargepointevseunlock) |
| action / charge point | Charge Point / Change sharing code | ChargingStation, RemoteCommand | [Reference](urn:chargeweave:legacy-api/reference/chargepointchangesharingcode) |
| action / charge point | Charge Point / Delete Certificate | ChargingStation, RemoteCommand | [Reference](urn:chargeweave:legacy-api/reference/chargepointdeletecertificate) |
| action / charge point | Charge Point / Install Certificate | ChargingStation, RemoteCommand | [Reference](urn:chargeweave:legacy-api/reference/chargepointinstallcertificate) |
| action / charge point | Charge Point / Set Configuration | ChargingStation, RemoteCommand | [Reference](urn:chargeweave:legacy-api/reference/chargepointsetconfiguration) |
| action / charge point | Charge Point / Set Security Profile | ChargingStation, RemoteCommand | [Reference](urn:chargeweave:legacy-api/reference/chargepointsetsecurityprofile) |
| action / charge point | Charge Point / Get Installed Certificate IDs | ChargingStation, RemoteCommand | [Reference](urn:chargeweave:legacy-api/reference/chargepointgetinstalledcertificateids) |
| action / charge point | Charge Point / Update Firmware | ChargingStation, RemoteCommand | [Reference](urn:chargeweave:legacy-api/reference/chargepointupdatefirmware) |
| action / circuit | Circuit / Attach Charge Point | LoadControlGroup, PriorityRule | [Reference](urn:chargeweave:legacy-api/reference/circuitattachchargepoint) |
| action / circuit | Circuit / Detach Charge Point | LoadControlGroup, PriorityRule | [Reference](urn:chargeweave:legacy-api/reference/circuitdetachchargepoint) |
| action / circuit | Circuit / Set Charge Point Priority | LoadControlGroup, PriorityRule | [Reference](urn:chargeweave:legacy-api/reference/circuitsetchargepointpriority) |
| action / circuit | Circuit / Set Charge Point EVSE Priority | LoadControlGroup, PriorityRule | [Reference](urn:chargeweave:legacy-api/reference/circuitsetchargepointevsepriority) |
| action / circuit | Circuit / Set Circuit SoC Priority | LoadControlGroup, PriorityRule | [Reference](urn:chargeweave:legacy-api/reference/circuitsetcircuitsocpriority) |
| action / circuit | Circuit / Set Session Boost | LoadControlGroup, PriorityRule | [Reference](urn:chargeweave:legacy-api/reference/circuitsetsessionboost) |
| action / circuit | Circuit / Set Session Priority | LoadControlGroup, PriorityRule | [Reference](urn:chargeweave:legacy-api/reference/circuitsetsessionpriority) |
| action / configuration template | Configuration Template / Apply to Charge Points | ConfigurationTemplate, TemplateApplication | [Reference](urn:chargeweave:legacy-api/reference/configurationtemplateapplytochargepoints) |
| action / configuration template | Configuration Template / Bulk Create Variables | ConfigurationTemplate, TemplateApplication | [Reference](urn:chargeweave:legacy-api/reference/configurationtemplatebulkcreatevariables) |
| action / electricity meter | Electricity Meter / Report Consumption | ElectricityMeter, MeterObservation | [Reference](urn:chargeweave:legacy-api/reference/electricitymeterreportconsumption) |
| action / energy coupon | Energy coupon / Redeem code | EnergyCoupon, CouponConsumption | [Reference](urn:chargeweave:legacy-api/reference/energycouponredeemcode) |
| action / energy coupon | Energy coupon / Cancel | EnergyCoupon, CouponConsumption | [Reference](urn:chargeweave:legacy-api/reference/energycouponcancel) |
| action / energy coupon template | Energy coupon template / Deactivate | EnergyCouponTemplate | [Reference](urn:chargeweave:legacy-api/reference/energycoupontemplatedeactivate) |
| action / evse | EVSEs / Bulk Assign Tariff Groups | TariffSet, TariffAssignment | [Reference](urn:chargeweave:legacy-api/reference/evsebulkassigntariffgroups) |
| action / evse | EVSE / Start Charging with EVSE ID | ChargingUnit | [Reference](urn:chargeweave:legacy-api/reference/evsestartchargingwithevseid) |
| action / evse | EVSE / Trigger Message | ChargingUnit | [Reference](urn:chargeweave:legacy-api/reference/evsetriggermessage) |
| action / flexibility asset | Flexibility Asset / Change Status | FlexibilityAsset, FlexibilityActivation | [Reference](urn:chargeweave:legacy-api/reference/changeflexibilityassetstatus) |
| action / flexibility asset | Flexibility Asset / Create Activation Request | FlexibilityAsset, FlexibilityActivation | [Reference](urn:chargeweave:legacy-api/reference/flexibilityassetcreateactivationrequest) |
| action / installer job | Actions / Assign Charge Points | InstallationJob | [Reference](urn:chargeweave:legacy-api/reference/assigninstallerjobchargepoints) |
| action / installer job | Actions / Change Status | InstallationJob | [Reference](urn:chargeweave:legacy-api/reference/changeinstallerjobstatus) |
| action / invoice | Invoice / Update External ID | Invoice, ExternalIdentifier | [Reference](urn:chargeweave:legacy-api/reference/invoiceupdateexternalid) |
| action / location | Location / Check Booking Availability | ChargingSite, BookingRequest | [Reference](urn:chargeweave:legacy-api/reference/locationcheckbookingavailability) |
| action / notifications | Notifications / Resend Failed | EventSubscription, EventDelivery | [Reference](urn:chargeweave:legacy-api/reference/notificationsresendfailed) |
| action / parking space | Parking Space / Update occupancy status | ParkingSpace | [Reference](urn:chargeweave:legacy-api/reference/parkingspaceupdateoccupancystatus) |
| action / partner | Partner / set custom fields | LegalEntity, CustomFieldValue | [Reference](urn:chargeweave:legacy-api/reference/partnersetcustomfieldsv1_0) |
| action / partner invite corporate billing policy | Partner invite corporate billing policy / Disable | CorporateBillingPolicy | [Reference](urn:chargeweave:legacy-api/reference/partnerinvitecorporatebillingpolicydisable) |
| action / partner invite corporate billing policy | Partner invite corporate billing policy / Enable | CorporateBillingPolicy | [Reference](urn:chargeweave:legacy-api/reference/partnerinvitecorporatebillingpolicyenable) |
| action / partner invoice | Partner invoice / Issue credit note | Invoice, CreditNote | [Reference](urn:chargeweave:legacy-api/reference/partnerinvoiceissuecreditnote) |
| action / partner invoice | Partner invoice / Update external ID | Invoice, CreditNote | [Reference](urn:chargeweave:legacy-api/reference/partnerinvoiceupdateexternalid) |
| action / partner settlement report | Partner settlement report / Issue partner invoice | SettlementBatch, Invoice | [Reference](urn:chargeweave:legacy-api/reference/partnersettlementreportissuepartnerinvoice) |
| action / partner settlement report | Partner settlement report / set custom fields | SettlementBatch, Invoice | [Reference](urn:chargeweave:legacy-api/reference/partnersettlementreportsetcustomfields) |
| action / partner settlement report | Partner Settlement Report / Update External ID | SettlementBatch, Invoice | [Reference](urn:chargeweave:legacy-api/reference/partnersettlementreportupdateexternalid) |
| action / payment terminal | Payment terminal / set custom fields | PaymentTerminal, CustomFieldValue | [Reference](urn:chargeweave:legacy-api/reference/paymentterminalsetcustomfields) |
| action / reimbursement record | Reimbursement record / Issue credit | ReimbursementRecord | [Reference](urn:chargeweave:legacy-api/reference/reimbursementrecordissuecredit) |
| action / reimbursement report | Reimbursement report / Regenerate | ReimbursementReport | [Reference](urn:chargeweave:legacy-api/reference/reimbursementreportregenerate) |
| action / reservation | Reservation / Cancel | Reservation | [Reference](urn:chargeweave:legacy-api/reference/reservationcancel) |
| action / roaming emsp | Roaming EMSP / Assign Partner | RoamingParty | [Reference](urn:chargeweave:legacy-api/reference/roamingemspassignpartner) |
| action / roaming operator | Custom Tariff Filters / Set Pricing Data | RoamingTariffFilter | [Reference](urn:chargeweave:legacy-api/reference/updatecustomtarifffiltertariff) |
| action / session | Session / Assign to user | ChargingSession | [Reference](urn:chargeweave:legacy-api/reference/sessionassigntouser) |
| action / session | Session / Change tariff | ChargingSession | [Reference](urn:chargeweave:legacy-api/reference/sessionchangetariff) |
| action / session | Session / Retry Payment | ChargingSession | [Reference](urn:chargeweave:legacy-api/reference/sessionretrypayment) |
| action / session | Session / set custom fields | ChargingSession | [Reference](urn:chargeweave:legacy-api/reference/sessionsetcustomfields) |
| action / subscription-plan | Subscription plan / Replace | SubscriptionPlan | [Reference](urn:chargeweave:legacy-api/reference/subscriptionplanreplace) |
| action / tariff | Tariff / Set Display Information | TariffVersion, PriceDisplay | [Reference](urn:chargeweave:legacy-api/reference/tariffsetdisplayinformation) |
| action / tax | Taxes / Validate VAT number | TaxIdentifier, TaxDetermination | [Reference](urn:chargeweave:legacy-api/reference/validatetaxnumber) |
| action / transaction | Transaction / Create Pre-Authorization | PaymentIntent, PaymentAuthorization, Invoice | [Reference](urn:chargeweave:legacy-api/reference/transactioncreatepreauthorization) |
| action / transaction | Transaction / Issue Invoice | PaymentIntent, PaymentAuthorization, Invoice | [Reference](urn:chargeweave:legacy-api/reference/transactionissueinvoice) |
| action / transaction | Transaction / Resend Invoice | PaymentIntent, PaymentAuthorization, Invoice | [Reference](urn:chargeweave:legacy-api/reference/transactionresendinvoice) |
| action / transaction | Transaction / Update Payment Reference | PaymentIntent, PaymentAuthorization, Invoice | [Reference](urn:chargeweave:legacy-api/reference/transactionupdatepaymentreference) |
| action / user | User / Revoke marketing consent | CustomerAccount, Subscription, Wallet, VoucherRedemption, ConsentDecision | [Reference](urn:chargeweave:legacy-api/reference/userrevokemarketingconsent) |
| action / user | User / Activate subscription | CustomerAccount, Subscription, Wallet, VoucherRedemption, ConsentDecision | [Reference](urn:chargeweave:legacy-api/reference/useractivatesubscription) |
| action / user | User / Add Balance | CustomerAccount, Subscription, Wallet, VoucherRedemption, ConsentDecision | [Reference](urn:chargeweave:legacy-api/reference/useraddbalance) |
| action / user | User / Apply Custom Fee | CustomerAccount, Subscription, Wallet, VoucherRedemption, ConsentDecision | [Reference](urn:chargeweave:legacy-api/reference/userapplycustomfee) |
| action / user | User / Cancel subscription | CustomerAccount, Subscription, Wallet, VoucherRedemption, ConsentDecision | [Reference](urn:chargeweave:legacy-api/reference/usercancelsubscription) |
| action / user | User / Change Status | CustomerAccount, Subscription, Wallet, VoucherRedemption, ConsentDecision | [Reference](urn:chargeweave:legacy-api/reference/userchangestatus) |
| action / user | User / Clear subscription amount due | CustomerAccount, Subscription, Wallet, VoucherRedemption, ConsentDecision | [Reference](urn:chargeweave:legacy-api/reference/userclearsubscriptionamountdue) |
| action / user | User / Get total eligible coupon energy | CustomerAccount, Subscription, Wallet, VoucherRedemption, ConsentDecision | [Reference](urn:chargeweave:legacy-api/reference/usergettotaleligiblecouponenergy) |
| action / user | User / Subscribe to plan | CustomerAccount, Subscription, Wallet, VoucherRedemption, ConsentDecision | [Reference](urn:chargeweave:legacy-api/reference/usersubscribetoplan) |
| action / user | Subscription billing period / Retry payment | BillingPeriod | [Reference](urn:chargeweave:legacy-api/reference/subscriptionbillingperiodretrypayment) |
| action / user | User / Export All Private Data | CustomerAccount, Subscription, Wallet, VoucherRedemption, ConsentDecision | [Reference](urn:chargeweave:legacy-api/reference/userexportallprivatedata) |
| action / user | User / Redeem Voucher | CustomerAccount, Subscription, Wallet, VoucherRedemption, ConsentDecision | [Reference](urn:chargeweave:legacy-api/reference/userredeemvoucher) |
| logs / communication | Communication logs / Listing | CommunicationLog, SourceEvent | [Reference](urn:chargeweave:legacy-api/reference/communicationlogslisting) |
| logs / communication | Communication log / Read | CommunicationLog, SourceEvent | [Reference](urn:chargeweave:legacy-api/reference/communicationlogread) |
| logs / ocpi | OCPI Logs / Listing | CommunicationLog, SourceEvent | [Reference](urn:chargeweave:legacy-api/reference/listocpilogs) |
| logs / ocpi | OCPI Log / Read | CommunicationLog, SourceEvent | [Reference](urn:chargeweave:legacy-api/reference/readocpilog) |
| notifications | Notifications / Subscribe | EventSubscription, EventDelivery, SourceEvent | [Reference](urn:chargeweave:legacy-api/reference/notificationssubscribedeprecated) |
| notifications | Notifications / Listing | EventSubscription, EventDelivery, SourceEvent | [Reference](urn:chargeweave:legacy-api/reference/notificationslistingdeprecated) |
| notifications | Notifications / Read | EventSubscription, EventDelivery, SourceEvent | [Reference](urn:chargeweave:legacy-api/reference/notificationsreaddeprecated) |
| notifications | Notifications / Update | EventSubscription, EventDelivery, SourceEvent | [Reference](urn:chargeweave:legacy-api/reference/notificationsupdatedeprecated) |
| notifications | Notifications / Unsubscribe | EventSubscription, EventDelivery, SourceEvent | [Reference](urn:chargeweave:legacy-api/reference/notificationsunsubscribedeprecated) |
| notifications | Notifications / Subscribe | EventSubscription, EventDelivery, SourceEvent | [Reference](urn:chargeweave:legacy-api/reference/notificationssubscribe) |
| notifications | Notifications / Listing | EventSubscription, EventDelivery, SourceEvent | [Reference](urn:chargeweave:legacy-api/reference/notificationslisting) |
| notifications | Notification / Read | EventSubscription, EventDelivery, SourceEvent | [Reference](urn:chargeweave:legacy-api/reference/notificationread) |
| notifications | Notifications / Update | EventSubscription, EventDelivery, SourceEvent | [Reference](urn:chargeweave:legacy-api/reference/notificationscreate) |
| notifications | Notifications / Unsubscribe | EventSubscription, EventDelivery, SourceEvent | [Reference](urn:chargeweave:legacy-api/reference/notificationsunsubscribe) |
| oauth | OAuth token revocation | ApiClient, AccessTokenLease, AccessGrant, AuditEntry | [Reference](urn:chargeweave:legacy-api/reference/oauthtokenrevoke) |
| oauth | OAuth / Token Exchange | ApiClient, AccessTokenLease, AccessGrant, AuditEntry | [Reference](urn:chargeweave:legacy-api/reference/oauthtokenexchange) |
| resource / admins | Admins / Listing | Principal, AccessGrant, SecurityRole, Permission | [Reference](urn:chargeweave:legacy-api/reference/adminlist) |
| resource / admins | Admin / Read | Principal, AccessGrant, SecurityRole, Permission | [Reference](urn:chargeweave:legacy-api/reference/adminread) |
| resource / admins | Admin / Permissions | Principal, AccessGrant, SecurityRole, Permission | [Reference](urn:chargeweave:legacy-api/reference/adminpermissions) |
| resource / authorizations | Authorization / Read | AuthorizationRequest, AuthorizationDecision | [Reference](urn:chargeweave:legacy-api/reference/authorizationreaddeprecated) |
| resource / authorizations | Authorizations / Listing | AuthorizationRequest, AuthorizationDecision | [Reference](urn:chargeweave:legacy-api/reference/authorizationslisting) |
| resource / authorizations | Authorization / Read | AuthorizationRequest, AuthorizationDecision | [Reference](urn:chargeweave:legacy-api/reference/authorizationread) |
| resource / authorizations | Authorizations / Listing | AuthorizationRequest, AuthorizationDecision | [Reference](urn:chargeweave:legacy-api/reference/authorizationslistingv2_1) |
| resource / authorizations | Authorization / Read | AuthorizationRequest, AuthorizationDecision | [Reference](urn:chargeweave:legacy-api/reference/authorizationreadv2_1) |
| resource / booking requests | Booking Requests / Listing | BookingRequest | [Reference](urn:chargeweave:legacy-api/reference/bookingrequestslisting) |
| resource / booking requests | Booking Request / Create | BookingRequest | [Reference](urn:chargeweave:legacy-api/reference/bookingrequestcreate) |
| resource / booking requests | Booking Request / Read | BookingRequest | [Reference](urn:chargeweave:legacy-api/reference/bookingrequestread) |
| resource / bookings | Bookings / Listing | Booking | [Reference](urn:chargeweave:legacy-api/reference/bookingslisting) |
| resource / bookings | Booking / Read | Booking | [Reference](urn:chargeweave:legacy-api/reference/bookingread) |
| resource / cdrs | CDRs / Listing | ChargeDetailRecord | [Reference](urn:chargeweave:legacy-api/reference/cdrslisting) |
| resource / cdrs | CDR / Read | ChargeDetailRecord | [Reference](urn:chargeweave:legacy-api/reference/cdrread) |
| resource / charge point downtime periods | Charge Point Downtime Periods / Listing | DowntimePeriod, OperationalPeriod | [Reference](urn:chargeweave:legacy-api/reference/chargepointdowntimeperiodslisting) |
| resource / charge point downtime periods | Charge Point Downtime Period / Create | DowntimePeriod, OperationalPeriod | [Reference](urn:chargeweave:legacy-api/reference/chargepointdowntimeperiodcreate) |
| resource / charge point downtime periods | Charge Point Downtime Period / Read | DowntimePeriod, OperationalPeriod | [Reference](urn:chargeweave:legacy-api/reference/chargepointdowntimeperiodread) |
| resource / charge point downtime periods | Charge Point Downtime Period / Update | DowntimePeriod, OperationalPeriod | [Reference](urn:chargeweave:legacy-api/reference/chargepointdowntimeperiodupdate) |
| resource / charge point downtime periods | Charge Point Downtime Period / Delete | DowntimePeriod, OperationalPeriod | [Reference](urn:chargeweave:legacy-api/reference/chargepointdowntimeperioddelete) |
| resource / charge point downtime periods | Charge Point Downtime Period / Status Log | DowntimePeriod, OperationalPeriod | [Reference](urn:chargeweave:legacy-api/reference/chargepointdowntimeperiodstatuslog) |
| resource / charge point models | Charge Point Models / Listing | EquipmentModel, DeviceCapability | [Reference](urn:chargeweave:legacy-api/reference/chargepointmodelslisting) |
| resource / charge point models | Charge Point Model / Create | EquipmentModel, DeviceCapability | [Reference](urn:chargeweave:legacy-api/reference/chargepointmodelcreate) |
| resource / charge point models | Charge Point Model / Read | EquipmentModel, DeviceCapability | [Reference](urn:chargeweave:legacy-api/reference/chargepointmodelread) |
| resource / charge point models | Charge Point Model / Update | EquipmentModel, DeviceCapability | [Reference](urn:chargeweave:legacy-api/reference/chargepointmodelupdate) |
| resource / charge point models | Charge Point Model / Delete | EquipmentModel, DeviceCapability | [Reference](urn:chargeweave:legacy-api/reference/chargepointmodeldelete) |
| resource / charge point models | Charge Point Models / Listing | EquipmentModel, DeviceCapability | [Reference](urn:chargeweave:legacy-api/reference/chargepointmodelslistingdeprecated) |
| resource / charge point models | Charge Point Model / Create | EquipmentModel, DeviceCapability | [Reference](urn:chargeweave:legacy-api/reference/chargepointmodelcreatedeprecated) |
| resource / charge point models | Charge Point Model / Read | EquipmentModel, DeviceCapability | [Reference](urn:chargeweave:legacy-api/reference/chargepointmodelreaddeprecated) |
| resource / charge point models | Charge Point Model / Update | EquipmentModel, DeviceCapability | [Reference](urn:chargeweave:legacy-api/reference/chargepointmodelupdatedeprecated) |
| resource / charge point models | Charge Point Model / Delete | EquipmentModel, DeviceCapability | [Reference](urn:chargeweave:legacy-api/reference/chargepointmodeldeletedeprecated) |
| resource / charge point vendors | Charge Point Vendors / Listing | Manufacturer | [Reference](urn:chargeweave:legacy-api/reference/chargepointvendorslisting) |
| resource / charge point vendors | Charge Point Vendor / Create | Manufacturer | [Reference](urn:chargeweave:legacy-api/reference/chargepointvendorcreate) |
| resource / charge point vendors | Charge Point Vendor / Read | Manufacturer | [Reference](urn:chargeweave:legacy-api/reference/chargepointvendorread) |
| resource / charge point vendors | Charge Point Vendor / Update | Manufacturer | [Reference](urn:chargeweave:legacy-api/reference/chargepointvendorupdate) |
| resource / charge point vendors | Charge Point Vendor / Delete | Manufacturer | [Reference](urn:chargeweave:legacy-api/reference/chargepointvendordelete) |
| resource / charge point vendors | Charge Point Vendors / Listing | Manufacturer | [Reference](urn:chargeweave:legacy-api/reference/chargepointvendorslistingdeprecated) |
| resource / charge point vendors | Charge Point Vendor / Create | Manufacturer | [Reference](urn:chargeweave:legacy-api/reference/chargepointvendorcreatedeprecated) |
| resource / charge point vendors | Charge Point Vendor / Read | Manufacturer | [Reference](urn:chargeweave:legacy-api/reference/chargepointvendorreaddeprecated) |
| resource / charge point vendors | Charge Point Vendor / Update | Manufacturer | [Reference](urn:chargeweave:legacy-api/reference/chargepointvendorupdatedeprecated) |
| resource / charge point vendors | Charge Point Vendor / Delete | Manufacturer | [Reference](urn:chargeweave:legacy-api/reference/chargepointvendordeletedeprecated) |
| resource / charge points | Charge Points / Listing | ChargingStation, ProtocolEndpoint, ConfigurationVariable, HardwareStatusObservation, ConnectionObservation | [Reference](urn:chargeweave:legacy-api/reference/chargepointslistingdeprecated) |
| resource / charge points | Charge Point / Create | ChargingStation, ProtocolEndpoint, ConfigurationVariable, HardwareStatusObservation, ConnectionObservation | [Reference](urn:chargeweave:legacy-api/reference/chargepointcreatedeprecated) |
| resource / charge points | Charge Point / Read | ChargingStation, ProtocolEndpoint, ConfigurationVariable, HardwareStatusObservation, ConnectionObservation | [Reference](urn:chargeweave:legacy-api/reference/chargepointreaddeprecated) |
| resource / charge points | Charge Point / Update | ChargingStation, ProtocolEndpoint, ConfigurationVariable, HardwareStatusObservation, ConnectionObservation | [Reference](urn:chargeweave:legacy-api/reference/chargepointupdatedeprecated) |
| resource / charge points | Charge Point / Delete | ChargingStation, ProtocolEndpoint, ConfigurationVariable, HardwareStatusObservation, ConnectionObservation | [Reference](urn:chargeweave:legacy-api/reference/chargepointdeletedeprecated) |
| resource / charge points | Charge Point / Configurations / Listing | ConfigurationVariable | [Reference](urn:chargeweave:legacy-api/reference/chargepointconfigurationslistingdeprecated) |
| resource / charge points | Charge Point / Configuration / Read | ConfigurationVariable | [Reference](urn:chargeweave:legacy-api/reference/chargepointconfigurationreaddeprecated) |
| resource / charge points | Charge Point / Configuration / Update | ConfigurationVariable | [Reference](urn:chargeweave:legacy-api/reference/chargepointconfigurationupdatedeprecated) |
| resource / charge points | Charge Point / Status / Read | ChargingStation, ProtocolEndpoint, ConfigurationVariable, HardwareStatusObservation, ConnectionObservation | [Reference](urn:chargeweave:legacy-api/reference/chargepointstatusread) |
| resource / charge points | Charge Point / Create | ChargingStation, ProtocolEndpoint, ConfigurationVariable, HardwareStatusObservation, ConnectionObservation | [Reference](urn:chargeweave:legacy-api/reference/chargepointcreate) |
| resource / charge points | Charge Points / Listing | ChargingStation, ProtocolEndpoint, ConfigurationVariable, HardwareStatusObservation, ConnectionObservation | [Reference](urn:chargeweave:legacy-api/reference/chargepointslisting) |
| resource / charge points | Charge Point / Update | ChargingStation, ProtocolEndpoint, ConfigurationVariable, HardwareStatusObservation, ConnectionObservation | [Reference](urn:chargeweave:legacy-api/reference/chargepointupdate) |
| resource / charge points | Charge Point / Read | ChargingStation, ProtocolEndpoint, ConfigurationVariable, HardwareStatusObservation, ConnectionObservation | [Reference](urn:chargeweave:legacy-api/reference/chargepointread) |
| resource / charge points | Charge Point / Delete | ChargingStation, ProtocolEndpoint, ConfigurationVariable, HardwareStatusObservation, ConnectionObservation | [Reference](urn:chargeweave:legacy-api/reference/chargepointdelete) |
| resource / charge points | Charge Point / Available personal smart charging modes / Listing | SmartChargingPreference | [Reference](urn:chargeweave:legacy-api/reference/chargepointavailablepersonalsmartchargingmodeslisting) |
| resource / charge points | Charge Point / Configurations / Listing | ConfigurationVariable | [Reference](urn:chargeweave:legacy-api/reference/chargepointconfigurationslisting) |
| resource / charge points | Charge Point / Configuration / Read | ConfigurationVariable | [Reference](urn:chargeweave:legacy-api/reference/chargepointconfigurationread) |
| resource / charge points | Charge Point / Configuration / Update | ConfigurationVariable | [Reference](urn:chargeweave:legacy-api/reference/chargepointconfigurationupdate) |
| resource / charge points | Charge Point / EVSE / Create | ChargingUnit | [Reference](urn:chargeweave:legacy-api/reference/chargepointevsecreate) |
| resource / charge points | Charge Point / EVSEs / Listing | ChargingUnit | [Reference](urn:chargeweave:legacy-api/reference/chargepointevseslisting) |
| resource / charge points | Charge Point / EVSE / Update | ChargingUnit | [Reference](urn:chargeweave:legacy-api/reference/chargepointevseupdate) |
| resource / charge points | Charge Point / EVSE / Read | ChargingUnit | [Reference](urn:chargeweave:legacy-api/reference/chargepointevseread) |
| resource / charge points | Charge Point / EVSE / Delete | ChargingUnit | [Reference](urn:chargeweave:legacy-api/reference/chargepointevsedelete) |
| resource / charge points | Charge Point / Evse / Connectors / Listing | Connector | [Reference](urn:chargeweave:legacy-api/reference/chargepointevseconnectorslisting) |
| resource / charge points | Charge Points / Evse / Connector / Create | Connector | [Reference](urn:chargeweave:legacy-api/reference/chargepointevseconnectorcreate) |
| resource / charge points | Charge Points / Evse / Connector / Read | Connector | [Reference](urn:chargeweave:legacy-api/reference/chargepointevseconnectorread) |
| resource / charge points | Charge Points / Evse / Connector / Update | Connector | [Reference](urn:chargeweave:legacy-api/reference/chargepointevseconnectorupdate) |
| resource / charge points | Charge Points / Evse / Connector / Delete | Connector | [Reference](urn:chargeweave:legacy-api/reference/chargepointevseconnectordelete) |
| resource / charge points | Charge Point / Hardware Status Logs / Listing | HardwareStatusObservation | [Reference](urn:chargeweave:legacy-api/reference/listchargepointhardwarestatuslogs) |
| resource / charge points | Charge Point / Latest Hardware Status Log | HardwareStatusObservation | [Reference](urn:chargeweave:legacy-api/reference/getchargepointlatesthardwarestatuslog) |
| resource / charge points | Charge Point / Latest Network Status Log | ConnectionObservation | [Reference](urn:chargeweave:legacy-api/reference/getchargepointlatestnetworkstatuslog) |
| resource / charge points | Charge Point / Network Status Logs / Listing | ConnectionObservation | [Reference](urn:chargeweave:legacy-api/reference/listchargepointnetworkstatuslogs) |
| resource / charge points | Charge Point / Notes / Listing | Annotation | [Reference](urn:chargeweave:legacy-api/reference/chargepointnoteslisting) |
| resource / charge points | Charge Point / Note / Create | Annotation | [Reference](urn:chargeweave:legacy-api/reference/chargepointnotecreate) |
| resource / charge points | Charge Point / Note / Read | Annotation | [Reference](urn:chargeweave:legacy-api/reference/chargepointnoteshow) |
| resource / charge points | Charge Point / Note / Update | Annotation | [Reference](urn:chargeweave:legacy-api/reference/chargepointnoteupdate) |
| resource / charge points | Charge Point / Note / Delete | Annotation | [Reference](urn:chargeweave:legacy-api/reference/chargepointnotedelete) |
| resource / charge points | Charge Point / Personal smart charging preferences / Read | SmartChargingPreference | [Reference](urn:chargeweave:legacy-api/reference/chargepointpersonalsmartchargingpreferencesread) |
| resource / charge points | Charge Point / Personal smart charging preferences / Update | SmartChargingPreference | [Reference](urn:chargeweave:legacy-api/reference/personalsmartchargingpreferencesupdate) |
| resource / charge points | Charge Point / Shared Partners / Listing | SharingAgreement | [Reference](urn:chargeweave:legacy-api/reference/chargepointsharedpartnerslisting) |
| resource / charge points | Charge Point / Shared Partners / Update | SharingAgreement | [Reference](urn:chargeweave:legacy-api/reference/chargepointsharedpartnerssync) |
| resource / charge points | Charge point / share / create | SharingAgreement | [Reference](urn:chargeweave:legacy-api/reference/chargepointsharecreate) |
| resource / charge points | Charge point / shares / listing | SharingAgreement | [Reference](urn:chargeweave:legacy-api/reference/chargepointshareslisting) |
| resource / charge points | Charge point / share / read | SharingAgreement | [Reference](urn:chargeweave:legacy-api/reference/chargepointshareread) |
| resource / charge points | Charge point / share / update | SharingAgreement | [Reference](urn:chargeweave:legacy-api/reference/chargepointshareupdate) |
| resource / charge points | Charge point / share / delete | SharingAgreement | [Reference](urn:chargeweave:legacy-api/reference/charegpointsharedelete) |
| resource / charge points | Charge Point / Smart Charging / Update | SmartChargingPreference | [Reference](urn:chargeweave:legacy-api/reference/chargepointsmartchargingupdate) |
| resource / circuits | Circuits / Listing | LoadControlGroup, ControlGroupMembership, PowerConstraint, PhaseCurrentConstraint | [Reference](urn:chargeweave:legacy-api/reference/circuitslistingdeprecated) |
| resource / circuits | Circuit / Create | LoadControlGroup, ControlGroupMembership, PowerConstraint, PhaseCurrentConstraint | [Reference](urn:chargeweave:legacy-api/reference/circuitcreatedeprecated) |
| resource / circuits | Circuit / Read | LoadControlGroup, ControlGroupMembership, PowerConstraint, PhaseCurrentConstraint | [Reference](urn:chargeweave:legacy-api/reference/circuitreaddeprecated) |
| resource / circuits | Circuit / Update | LoadControlGroup, ControlGroupMembership, PowerConstraint, PhaseCurrentConstraint | [Reference](urn:chargeweave:legacy-api/reference/circuitupdatedeprecated) |
| resource / circuits | Circuit / Delete | LoadControlGroup, ControlGroupMembership, PowerConstraint, PhaseCurrentConstraint | [Reference](urn:chargeweave:legacy-api/reference/circuitdeletedeprecated) |
| resource / circuits | Circuit / Consumption (all phases) | UnmanagedLoadObservation | [Reference](urn:chargeweave:legacy-api/reference/circuitconsumptionallphasesdeprecated) |
| resource / circuits | Circuit / Consumption (phase) | UnmanagedLoadObservation | [Reference](urn:chargeweave:legacy-api/reference/circuitconsumptionphasedeprecated) |
| resource / circuits | Circuits / Listing | LoadControlGroup, ControlGroupMembership, PowerConstraint, PhaseCurrentConstraint | [Reference](urn:chargeweave:legacy-api/reference/circuitslisting) |
| resource / circuits | Circuit / Create | LoadControlGroup, ControlGroupMembership, PowerConstraint, PhaseCurrentConstraint | [Reference](urn:chargeweave:legacy-api/reference/circuitcreate) |
| resource / circuits | Circuit / Read | LoadControlGroup, ControlGroupMembership, PowerConstraint, PhaseCurrentConstraint | [Reference](urn:chargeweave:legacy-api/reference/circuitread) |
| resource / circuits | Circuit / Update | LoadControlGroup, ControlGroupMembership, PowerConstraint, PhaseCurrentConstraint | [Reference](urn:chargeweave:legacy-api/reference/circuitupdate) |
| resource / circuits | Circuit / Delete | LoadControlGroup, ControlGroupMembership, PowerConstraint, PhaseCurrentConstraint | [Reference](urn:chargeweave:legacy-api/reference/circuitdelete) |
| resource / circuits | Circuit / Charge Point Priorities / Listing | PriorityRule | [Reference](urn:chargeweave:legacy-api/reference/circuitchargepointprioritieslisting) |
| resource / circuits | Circuit / Consumption | UnmanagedLoadObservation | [Reference](urn:chargeweave:legacy-api/reference/circuitconsumption) |
| resource / circuits | Circuit / Schedule / Read | ChargingSchedule, SchedulePeriod | [Reference](urn:chargeweave:legacy-api/reference/circuitscheduleread) |
| resource / circuits | Circuit / Schedule / Create or Update | ChargingSchedule, SchedulePeriod | [Reference](urn:chargeweave:legacy-api/reference/circuitschedulecreateorupdate) |
| resource / circuits | Circuit / Schedule / Delete | ChargingSchedule, SchedulePeriod | [Reference](urn:chargeweave:legacy-api/reference/circuitscheduledelete) |
| resource / circuits | Circuit / SoC Priorities / Listing | PriorityRule | [Reference](urn:chargeweave:legacy-api/reference/circuitsocprioritieslisting) |
| resource / circuits | Circuit / Unmanaged Load / Read | UnmanagedLoadObservation | [Reference](urn:chargeweave:legacy-api/reference/circuitunmanagedloadread) |
| resource / circuits | Circuits / User Priorities / Listing | PriorityRule | [Reference](urn:chargeweave:legacy-api/reference/circuituserprioritieslisting) |
| resource / circuits | Circuits / User Priority / Create | PriorityRule | [Reference](urn:chargeweave:legacy-api/reference/circuituserprioritycreate) |
| resource / circuits | Circuits / User Priority / Read | PriorityRule | [Reference](urn:chargeweave:legacy-api/reference/circuituserpriorityread) |
| resource / circuits | Circuits / User Priority / Update | PriorityRule | [Reference](urn:chargeweave:legacy-api/reference/circuituserpriorityupdate) |
| resource / circuits | Circuits / User Priority / Delete | PriorityRule | [Reference](urn:chargeweave:legacy-api/reference/circuituserprioritydelete) |
| resource / configuration templates | Configuration Template / Listing | ConfigurationTemplate, ConfigurationTemplateEntry, TemplateApplication | [Reference](urn:chargeweave:legacy-api/reference/listconfigurationtemplates) |
| resource / configuration templates | Configuration Template / Create | ConfigurationTemplate, ConfigurationTemplateEntry, TemplateApplication | [Reference](urn:chargeweave:legacy-api/reference/createconfigurationtemplate) |
| resource / configuration templates | Configuration Template / Update | ConfigurationTemplate, ConfigurationTemplateEntry, TemplateApplication | [Reference](urn:chargeweave:legacy-api/reference/updateconfigurationtemplate) |
| resource / configuration templates | Configuration Template / Read | ConfigurationTemplate, ConfigurationTemplateEntry, TemplateApplication | [Reference](urn:chargeweave:legacy-api/reference/getconfigurationtemplate) |
| resource / configuration templates | Configuration Template / Delete | ConfigurationTemplate, ConfigurationTemplateEntry, TemplateApplication | [Reference](urn:chargeweave:legacy-api/reference/deleteconfigurationtemplate) |
| resource / configuration templates | Configuration Template Variable / Listing | ConfigurationTemplateEntry | [Reference](urn:chargeweave:legacy-api/reference/configurationtemplatevariablelisting) |
| resource / configuration templates | Configuration Template Variable / Create | ConfigurationTemplateEntry | [Reference](urn:chargeweave:legacy-api/reference/configurationtemplatevariablecreate) |
| resource / configuration templates | Configuration Template Variable / Update | ConfigurationTemplateEntry | [Reference](urn:chargeweave:legacy-api/reference/configurationtemplatevariableupdate) |
| resource / configuration templates | Configuration Template Variable / Delete | ConfigurationTemplateEntry | [Reference](urn:chargeweave:legacy-api/reference/configurationtemplatevariabledelete) |
| resource / consent-history | Consent History / Listing | ConsentDecision | [Reference](urn:chargeweave:legacy-api/reference/consenthistorylisting) |
| resource / consents | Consents / Listing | ConsentDecision | [Reference](urn:chargeweave:legacy-api/reference/consentslisting) |
| resource / consents | Consents / Create | ConsentDecision | [Reference](urn:chargeweave:legacy-api/reference/consentscreate) |
| resource / contact details | Contact details / Read | ContactProfile | [Reference](urn:chargeweave:legacy-api/reference/contactdetailsread) |
| resource / contact details | Contact details / Update | ContactProfile | [Reference](urn:chargeweave:legacy-api/reference/contactdetailsupdate) |
| resource / contact details | Contact details / Delete | ContactProfile | [Reference](urn:chargeweave:legacy-api/reference/contactdetailsdelete) |
| resource / currencies | Currencies / Listing | Currency | [Reference](urn:chargeweave:legacy-api/reference/currencieslisting) |
| resource / currencies | Currency / Create | Currency | [Reference](urn:chargeweave:legacy-api/reference/currencycreate) |
| resource / currencies | Currency / Read | Currency | [Reference](urn:chargeweave:legacy-api/reference/currencyread) |
| resource / currencies | Currency / Update | Currency | [Reference](urn:chargeweave:legacy-api/reference/currencyupdate) |
| resource / currencies | Currency / Delete | Currency | [Reference](urn:chargeweave:legacy-api/reference/currencydeletedeprecated) |
| resource / currency rates | Currency Rate / Create | ExchangeRate | [Reference](urn:chargeweave:legacy-api/reference/createcurrencyrate) |
| resource / currency rates | Currency Rate / Listing | ExchangeRate | [Reference](urn:chargeweave:legacy-api/reference/listcurrencyrates) |
| resource / currency rates | Currency Rate / Update | ExchangeRate | [Reference](urn:chargeweave:legacy-api/reference/updatecurrencyrate) |
| resource / currency rates | Currency Rate / Read | ExchangeRate | [Reference](urn:chargeweave:legacy-api/reference/getcurrencyrate) |
| resource / currency rates | Currency Rate / Delete | ExchangeRate | [Reference](urn:chargeweave:legacy-api/reference/deletecurrencyrate) |
| resource / custom fees | Custom Fees / Listing | CustomFee | [Reference](urn:chargeweave:legacy-api/reference/customfeeslisting) |
| resource / custom fees | Custom Fee / Read | CustomFee | [Reference](urn:chargeweave:legacy-api/reference/customfeeread) |
| resource / downtime period notices | Downtime Period Notices / Listing | ServiceNotice | [Reference](urn:chargeweave:legacy-api/reference/getdowntimeperiodnotices) |
| resource / downtime period notices | Downtime Period Notices / Create | ServiceNotice | [Reference](urn:chargeweave:legacy-api/reference/postdowntimeperiodnotice) |
| resource / downtime period notices | Downtime Period Notices / Read | ServiceNotice | [Reference](urn:chargeweave:legacy-api/reference/getdowntimeperiodnotice) |
| resource / downtime period notices | Downtime Period Notices / Update | ServiceNotice | [Reference](urn:chargeweave:legacy-api/reference/patchdowntimeperiodnotice) |
| resource / downtime period notices | Downtime Period Notices / Delete | ServiceNotice | [Reference](urn:chargeweave:legacy-api/reference/deletedowntimeperiodnotice) |
| resource / electricity meters | Electricity Meters / Listing | ElectricityMeter, MeterObservation | [Reference](urn:chargeweave:legacy-api/reference/electricitymeterslising) |
| resource / electricity meters | Electricity Meter / Create | ElectricityMeter, MeterObservation | [Reference](urn:chargeweave:legacy-api/reference/electricitymetercreate) |
| resource / electricity meters | Electricity Meter / Read | ElectricityMeter, MeterObservation | [Reference](urn:chargeweave:legacy-api/reference/electricitymeterread) |
| resource / electricity meters | Electricity Meter / Update | ElectricityMeter, MeterObservation | [Reference](urn:chargeweave:legacy-api/reference/electricitymeterupdate) |
| resource / electricity meters | Electricity Meter / Delete | ElectricityMeter, MeterObservation | [Reference](urn:chargeweave:legacy-api/reference/electricitymeterdelete) |
| resource / electricity rates | Electricity rates / Listing | ElectricityPriceSchedule, ElectricityPriceInterval, EnergyMix | [Reference](urn:chargeweave:legacy-api/reference/electricityrateslistingdeprecated) |
| resource / electricity rates | Electricity rate / Create | ElectricityPriceSchedule, ElectricityPriceInterval, EnergyMix | [Reference](urn:chargeweave:legacy-api/reference/electricityratecreatedeprecated) |
| resource / electricity rates | Electricity rate / Read | ElectricityPriceSchedule, ElectricityPriceInterval, EnergyMix | [Reference](urn:chargeweave:legacy-api/reference/electricityratereaddeprecated) |
| resource / electricity rates | Electricity rate / Update | ElectricityPriceSchedule, ElectricityPriceInterval, EnergyMix | [Reference](urn:chargeweave:legacy-api/reference/electricityrateupdatedeprecated) |
| resource / electricity rates | Electricity rate / Delete | ElectricityPriceSchedule, ElectricityPriceInterval, EnergyMix | [Reference](urn:chargeweave:legacy-api/reference/electricityratedeletedeprecated) |
| resource / electricity rates | Electricity rates / Listing | ElectricityPriceSchedule, ElectricityPriceInterval, EnergyMix | [Reference](urn:chargeweave:legacy-api/reference/electricityrateslisting) |
| resource / electricity rates | Electricity rate / Create | ElectricityPriceSchedule, ElectricityPriceInterval, EnergyMix | [Reference](urn:chargeweave:legacy-api/reference/electricityratecreate) |
| resource / electricity rates | Electricity rate / Read | ElectricityPriceSchedule, ElectricityPriceInterval, EnergyMix | [Reference](urn:chargeweave:legacy-api/reference/electricityrateread) |
| resource / electricity rates | Electricity rate / Update | ElectricityPriceSchedule, ElectricityPriceInterval, EnergyMix | [Reference](urn:chargeweave:legacy-api/reference/electricityrateupdate) |
| resource / electricity rates | Electricity rate / Delete | ElectricityPriceSchedule, ElectricityPriceInterval, EnergyMix | [Reference](urn:chargeweave:legacy-api/reference/electricityratedelete) |
| resource / electricity rates | Electricity rate / Energy Mix / Read | EnergyMix, EnergySourceShare | [Reference](urn:chargeweave:legacy-api/reference/electricityrateenergymixread) |
| resource / electricity rates | Electricity rate / Energy Mix / Update | EnergyMix, EnergySourceShare | [Reference](urn:chargeweave:legacy-api/reference/electricityrateenergymixupdate) |
| resource / electricity rates | Electricity rate / Price periods / Listing | ElectricityPriceInterval | [Reference](urn:chargeweave:legacy-api/reference/electricityratepriceperiodslisting) |
| resource / electricity rates | Electricity rate / Price periods / Date / Listing | ElectricityPriceInterval | [Reference](urn:chargeweave:legacy-api/reference/electricityratepriceperiodsdatelisting) |
| resource / electricity rates | Electricity rate / Price periods / Date / Read | ElectricityPriceInterval | [Reference](urn:chargeweave:legacy-api/reference/electricityratepriceperiodsdateread) |
| resource / electricity rates | Electricity rate / Price periods / Date / Create or update | ElectricityPriceInterval | [Reference](urn:chargeweave:legacy-api/reference/electricityratepriceperiodsdatecreateorupdate) |
| resource / electricity rates | Electricity rate / Price periods / Date / Delete | ElectricityPriceInterval | [Reference](urn:chargeweave:legacy-api/reference/electricityratepriceperiodsdatedelete) |
| resource / electricity rates | Electricity rate / Price periods / Week day / Listing | ElectricityPriceInterval | [Reference](urn:chargeweave:legacy-api/reference/electricityratepriceperiodsweekdaylisting) |
| resource / electricity rates | Electricity rate / Price periods / Week day / Read | ElectricityPriceInterval | [Reference](urn:chargeweave:legacy-api/reference/electricityratepriceperiodsweekdayread) |
| resource / electricity rates | Electricity rate / Price periods / Week day / Create or update | ElectricityPriceInterval | [Reference](urn:chargeweave:legacy-api/reference/electricityratepriceperiodsweekdaycreateaorupdate) |
| resource / electricity rates | Electricity rate / Price periods / Week day / Delete | ElectricityPriceInterval | [Reference](urn:chargeweave:legacy-api/reference/electricityratepriceperiodsweekdaydelete) |
| resource / energy coupon templates | Energy coupon templates / Listing | EnergyCouponTemplate | [Reference](urn:chargeweave:legacy-api/reference/energycoupontemplateslisting) |
| resource / energy coupon templates | Energy coupon templates / Create | EnergyCouponTemplate | [Reference](urn:chargeweave:legacy-api/reference/energycoupontemplatecreate) |
| resource / energy coupon templates | Energy coupon template / Read | EnergyCouponTemplate | [Reference](urn:chargeweave:legacy-api/reference/energycoupontemplateread) |
| resource / energy coupon templates | Energy coupon template / Update | EnergyCouponTemplate | [Reference](urn:chargeweave:legacy-api/reference/energycoupontemplateupdate) |
| resource / energy coupons | Energy coupons / Listing | EnergyCoupon, CouponConsumption | [Reference](urn:chargeweave:legacy-api/reference/energycouponslisting) |
| resource / energy coupons | Energy coupon / Create | EnergyCoupon, CouponConsumption | [Reference](urn:chargeweave:legacy-api/reference/energycouponcreate) |
| resource / energy coupons | Energy coupon / Read | EnergyCoupon, CouponConsumption | [Reference](urn:chargeweave:legacy-api/reference/energycouponread) |
| resource / energy coupons | Energy coupon / Session consumption records | CouponConsumption | [Reference](urn:chargeweave:legacy-api/reference/energycouponsessionconsumptionrecords) |
| resource / evse downtime periods | EVSE Downtime Periods / Listing | DowntimePeriod | [Reference](urn:chargeweave:legacy-api/reference/evsedowntimeperiodslisting) |
| resource / evse downtime periods | EVSE Downtime Period / Create | DowntimePeriod | [Reference](urn:chargeweave:legacy-api/reference/evsedowntimeperiodcreate) |
| resource / evse downtime periods | EVSE Downtime Period / Read | DowntimePeriod | [Reference](urn:chargeweave:legacy-api/reference/evsedowntimeperiodread) |
| resource / evse downtime periods | EVSE Downtime Period / Update | DowntimePeriod | [Reference](urn:chargeweave:legacy-api/reference/evsedowntimeperiodupdate) |
| resource / evse downtime periods | EVSE Downtime Period / Delete | DowntimePeriod | [Reference](urn:chargeweave:legacy-api/reference/evsedowntimeperioddelete) |
| resource / evse downtime periods | EVSE Downtime Period / Status Log | DowntimePeriod | [Reference](urn:chargeweave:legacy-api/reference/evsedowntimeperiodstatuslog) |
| resource / evses | EVSEs / Listing | ChargingUnit, Connector | [Reference](urn:chargeweave:legacy-api/reference/evseslistingdeprecated) |
| resource / evses | EVSE / Read | ChargingUnit, Connector | [Reference](urn:chargeweave:legacy-api/reference/evsereaddeprecated) |
| resource / evses | EVSE / Update | ChargingUnit, Connector | [Reference](urn:chargeweave:legacy-api/reference/evseupdatedeprecated) |
| resource / evses | EVSE / Hardware Status Logs / Listing | HardwareStatusObservation | [Reference](urn:chargeweave:legacy-api/reference/listevsehardwarestatuslogs) |
| resource / evses | EVSE / Latest Hardware Status Log | HardwareStatusObservation | [Reference](urn:chargeweave:legacy-api/reference/getevselatesthardwarestatuslog) |
| resource / evses | EVSE / Notes / Listing | Annotation | [Reference](urn:chargeweave:legacy-api/reference/evsenoteslisting) |
| resource / evses | EVSE / Note / Create | Annotation | [Reference](urn:chargeweave:legacy-api/reference/evsenotecreate) |
| resource / evses | EVSE / Note / Read | Annotation | [Reference](urn:chargeweave:legacy-api/reference/evsenoteshow) |
| resource / evses | EVSE / Note / Update | Annotation | [Reference](urn:chargeweave:legacy-api/reference/evsenoteupdate) |
| resource / evses | EVSE / Note / Delete | Annotation | [Reference](urn:chargeweave:legacy-api/reference/evsenotedelete) |
| resource / evses | EVSE / Create | ChargingUnit, Connector | [Reference](urn:chargeweave:legacy-api/reference/evsecreate) |
| resource / evses | EVSEs / Listing | ChargingUnit, Connector | [Reference](urn:chargeweave:legacy-api/reference/evseslisting) |
| resource / evses | EVSE / Update | ChargingUnit, Connector | [Reference](urn:chargeweave:legacy-api/reference/evseupdate) |
| resource / evses | EVSE / Read | ChargingUnit, Connector | [Reference](urn:chargeweave:legacy-api/reference/evseread) |
| resource / evses | EVSE / Delete | ChargingUnit, Connector | [Reference](urn:chargeweave:legacy-api/reference/evsedelete) |
| resource / faqs | FAQs / Listing | HelpArticle | [Reference](urn:chargeweave:legacy-api/reference/faqslisting) |
| resource / faqs | FAQ / Create | HelpArticle | [Reference](urn:chargeweave:legacy-api/reference/faqcreate) |
| resource / faqs | FAQ / Read | HelpArticle | [Reference](urn:chargeweave:legacy-api/reference/faqread) |
| resource / faqs | FAQ / Update | HelpArticle | [Reference](urn:chargeweave:legacy-api/reference/faqupdate) |
| resource / faqs | FAQ / Delete | HelpArticle | [Reference](urn:chargeweave:legacy-api/reference/faqdelete) |
| resource / firmware versions | Firmware Versions / Listing | FirmwareRelease | [Reference](urn:chargeweave:legacy-api/reference/firmwareversionslisting) |
| resource / firmware versions | Firmware Version / Read | FirmwareRelease | [Reference](urn:chargeweave:legacy-api/reference/firmwareversionread) |
| resource / firmware versions | Firmware Version / Attached Models | FirmwareRelease | [Reference](urn:chargeweave:legacy-api/reference/firmwareversionattachedmodels) |
| resource / flexibility activation requests | Flexibility Activation Requests / Listing | FlexibilityActivation, FlexibilityDelivery | [Reference](urn:chargeweave:legacy-api/reference/listflexibilityactivationrequests) |
| resource / flexibility activation requests | Flexibility Activation Requests / Read | FlexibilityActivation, FlexibilityDelivery | [Reference](urn:chargeweave:legacy-api/reference/getflexibilityactivationrequest) |
| resource / flexibility assets | Flexibility Assets / Create | FlexibilityAsset, EnergyForecast | [Reference](urn:chargeweave:legacy-api/reference/createflexibilityasset) |
| resource / flexibility assets | Flexibility Assets / Listing | FlexibilityAsset, EnergyForecast | [Reference](urn:chargeweave:legacy-api/reference/listflexibilityassets) |
| resource / flexibility assets | Flexibility Assets / Update | FlexibilityAsset, EnergyForecast | [Reference](urn:chargeweave:legacy-api/reference/updateflexibilityasset) |
| resource / flexibility assets | Flexibility Assets / Read | FlexibilityAsset, EnergyForecast | [Reference](urn:chargeweave:legacy-api/reference/getflexibilityasset) |
| resource / flexibility assets | Flexibility Assets / Delete | FlexibilityAsset, EnergyForecast | [Reference](urn:chargeweave:legacy-api/reference/deleteflexibilityasset) |
| resource / flexibility assets | Flexibility Assets / Historical Time Series | UsageAggregate | [Reference](urn:chargeweave:legacy-api/reference/gethistoricaltimeseries) |
| resource / flexibility assets | Flexibility Assets / Time Series Forecast | EnergyForecast, ForecastPoint | [Reference](urn:chargeweave:legacy-api/reference/gettimeseriesforecast) |
| resource / id tags | Id Tags / Listing | ChargingCredential, CredentialAssignment | [Reference](urn:chargeweave:legacy-api/reference/idtagslisting) |
| resource / id tags | Id Tag / Create | ChargingCredential, CredentialAssignment | [Reference](urn:chargeweave:legacy-api/reference/idtagcreate) |
| resource / id tags | Id Tag / Read | ChargingCredential, CredentialAssignment | [Reference](urn:chargeweave:legacy-api/reference/idtagread) |
| resource / id tags | Id Tag / Update | ChargingCredential, CredentialAssignment | [Reference](urn:chargeweave:legacy-api/reference/idtagupdate) |
| resource / id tags | Id Tag / Delete | ChargingCredential, CredentialAssignment | [Reference](urn:chargeweave:legacy-api/reference/idtagdelete) |
| resource / id tags | ID tag / Notes / Listing | Annotation | [Reference](urn:chargeweave:legacy-api/reference/idtagnoteslisting) |
| resource / id tags | ID tag / Note / Create | Annotation | [Reference](urn:chargeweave:legacy-api/reference/idtagnotecreate) |
| resource / id tags | ID tag / Note / Read | Annotation | [Reference](urn:chargeweave:legacy-api/reference/idtagnoteread) |
| resource / id tags | ID tag / Note / Update | Annotation | [Reference](urn:chargeweave:legacy-api/reference/idtagnoteupdate) |
| resource / id tags | ID tag / Note / Delete | Annotation | [Reference](urn:chargeweave:legacy-api/reference/idtagnotedelete) |
| resource / installation and maintenance companies | Installation And Maintenance Companies / Listing | LegalEntity, PartyRole | [Reference](urn:chargeweave:legacy-api/reference/getinstallationandmaintenancecompanieslist) |
| resource / installation and maintenance companies | Installation And Maintenance Companies / Create | LegalEntity, PartyRole | [Reference](urn:chargeweave:legacy-api/reference/createinstallationandmaintenancecompany) |
| resource / installation and maintenance companies | Installation And Maintenance Companies / Read | LegalEntity, PartyRole | [Reference](urn:chargeweave:legacy-api/reference/getinstallationandmaintenancecompany) |
| resource / installation and maintenance companies | Installation And Maintenance Companies / Update | LegalEntity, PartyRole | [Reference](urn:chargeweave:legacy-api/reference/updateinstallationandmaintenancecompany) |
| resource / installation and maintenance companies | Installation And Maintenance Companies / Delete | LegalEntity, PartyRole | [Reference](urn:chargeweave:legacy-api/reference/deleteinstallationandmaintenancecompany) |
| resource / installer jobs | InstallerJobs / Listing | InstallationJob | [Reference](urn:chargeweave:legacy-api/reference/getinstallerjobslist) |
| resource / installer jobs | Installer Jobs / Create | InstallationJob | [Reference](urn:chargeweave:legacy-api/reference/createinstallerjob) |
| resource / installer jobs | Installer Jobs / Read | InstallationJob | [Reference](urn:chargeweave:legacy-api/reference/getinstallerjob) |
| resource / installer jobs | Installer Jobs / Update | InstallationJob | [Reference](urn:chargeweave:legacy-api/reference/updateinstallerjob) |
| resource / installer jobs | Installer Jobs / Delete | InstallationJob | [Reference](urn:chargeweave:legacy-api/reference/deleteinstallerjob) |
| resource / invoices | Invoices / Listing | Invoice, InvoiceLine, FiscalizationAttempt | [Reference](urn:chargeweave:legacy-api/reference/invoiceslisting) |
| resource / invoices | Invoice / Read | Invoice, InvoiceLine, FiscalizationAttempt | [Reference](urn:chargeweave:legacy-api/reference/invoiceread) |
| resource / invoices | Invoice fiscalization attempts / Listing | FiscalizationAttempt, EvidenceDocument | [Reference](urn:chargeweave:legacy-api/reference/invoicefiscalizationattemptslisting) |
| resource / invoices | Invoice fiscalization document / Download | FiscalizationAttempt, EvidenceDocument | [Reference](urn:chargeweave:legacy-api/reference/invoicefiscalizationdocumentdownload) |
| resource / issues | Issues / Listing | Issue, RecoveryAttempt | [Reference](urn:chargeweave:legacy-api/reference/issueslisting) |
| resource / issues | Issues / Create | Issue, RecoveryAttempt | [Reference](urn:chargeweave:legacy-api/reference/issuescreate) |
| resource / issues | Issue / Read | Issue, RecoveryAttempt | [Reference](urn:chargeweave:legacy-api/reference/issueread) |
| resource / issues | Issue / Update | Issue, RecoveryAttempt | [Reference](urn:chargeweave:legacy-api/reference/issueupdate) |
| resource / issues | Issue / Delete | Issue, RecoveryAttempt | [Reference](urn:chargeweave:legacy-api/reference/issuedelete) |
| resource / locations | Locations / Listing | ChargingSite, PublicListing, ChargingArea | [Reference](urn:chargeweave:legacy-api/reference/locationslistingdeprecated) |
| resource / locations | Location / Create | ChargingSite, PublicListing, ChargingArea | [Reference](urn:chargeweave:legacy-api/reference/locationcreatedeprecated) |
| resource / locations | Location / Read | ChargingSite, PublicListing, ChargingArea | [Reference](urn:chargeweave:legacy-api/reference/locationreaddeprecated) |
| resource / locations | Location / Update | ChargingSite, PublicListing, ChargingArea | [Reference](urn:chargeweave:legacy-api/reference/locationupdatedeprecated) |
| resource / locations | Location / Delete | ChargingSite, PublicListing, ChargingArea | [Reference](urn:chargeweave:legacy-api/reference/locationdeletedeprecated) |
| resource / locations | Location / Create | ChargingSite, PublicListing, ChargingArea | [Reference](urn:chargeweave:legacy-api/reference/locationcreate) |
| resource / locations | Locations / Listing | ChargingSite, PublicListing, ChargingArea | [Reference](urn:chargeweave:legacy-api/reference/locationslisting) |
| resource / locations | Location / Update | ChargingSite, PublicListing, ChargingArea | [Reference](urn:chargeweave:legacy-api/reference/locationupdate) |
| resource / locations | Location / Read | ChargingSite, PublicListing, ChargingArea | [Reference](urn:chargeweave:legacy-api/reference/locationread) |
| resource / locations | Location / Delete | ChargingSite, PublicListing, ChargingArea | [Reference](urn:chargeweave:legacy-api/reference/locationdelete) |
| resource / locations | Location / Charging Zones / Listing | ChargingArea | [Reference](urn:chargeweave:legacy-api/reference/locationchargingzoneslisting) |
| resource / locations | Location / Charging Zone / Create | ChargingArea | [Reference](urn:chargeweave:legacy-api/reference/locationchargingzonecreate) |
| resource / locations | Location / Charging Zone / Read | ChargingArea | [Reference](urn:chargeweave:legacy-api/reference/locationchargingzoneread) |
| resource / locations | Location / Charging Zones / Update | ChargingArea | [Reference](urn:chargeweave:legacy-api/reference/locationchargingzoneupdate) |
| resource / locations | Location / Charging Zone / Delete | ChargingArea | [Reference](urn:chargeweave:legacy-api/reference/locationchargingzonedelete) |
| resource / locations | Location / Notes / Listing | Annotation | [Reference](urn:chargeweave:legacy-api/reference/locationnoteslisting) |
| resource / locations | Location / Note / Create | Annotation | [Reference](urn:chargeweave:legacy-api/reference/locationnotecreate) |
| resource / locations | Location / Note / Read | Annotation | [Reference](urn:chargeweave:legacy-api/reference/locationnoteshow) |
| resource / locations | Location / Note / Update | Annotation | [Reference](urn:chargeweave:legacy-api/reference/locationnoteupdate) |
| resource / locations | Location / Note / Delete | Annotation | [Reference](urn:chargeweave:legacy-api/reference/locationnotedelete) |
| resource / ocpi commands | OCPI commands / Listing | RoamingCommand | [Reference](urn:chargeweave:legacy-api/reference/ocpicommandslisting) |
| resource / ocpi commands | OCPI command / Read | RoamingCommand | [Reference](urn:chargeweave:legacy-api/reference/ocpicommandread) |
| resource / operators | Operators / Listing | OperatorService | [Reference](urn:chargeweave:legacy-api/reference/operatorslisting) |
| resource / operators | Operator / Read | OperatorService | [Reference](urn:chargeweave:legacy-api/reference/operatorread) |
| resource / parking spaces | Parking Space / Create | ParkingSpace | [Reference](urn:chargeweave:legacy-api/reference/createparkingspace) |
| resource / parking spaces | Parking Space / Listing | ParkingSpace | [Reference](urn:chargeweave:legacy-api/reference/listparkingspace) |
| resource / parking spaces | Parking Space / Update | ParkingSpace | [Reference](urn:chargeweave:legacy-api/reference/updateparkingspace) |
| resource / parking spaces | Parking Space / Update | ParkingSpace | [Reference](urn:chargeweave:legacy-api/reference/parkingspaceupdate) |
| resource / parking spaces | Parking Space / Read | ParkingSpace | [Reference](urn:chargeweave:legacy-api/reference/getparkingspace) |
| resource / parking spaces | Parking Space / Delete | ParkingSpace | [Reference](urn:chargeweave:legacy-api/reference/deleteparkingspace) |
| resource / parking spaces | Parking Space / EVSEs / Listing | ParkingSpace | [Reference](urn:chargeweave:legacy-api/reference/parkingspacesevseslisting) |
| resource / parking spaces | Parking Space / EVSEs / Update | ParkingSpace | [Reference](urn:chargeweave:legacy-api/reference/parkingspacesevsessync) |
| resource / partner contracts | Partner Contracts / Listing | ServiceAgreement, RevenueShareRule, CostAllocationRule, SettlementOverride | [Reference](urn:chargeweave:legacy-api/reference/partnercontractslisting) |
| resource / partner contracts | Partner Contract / Create | ServiceAgreement, RevenueShareRule, CostAllocationRule, SettlementOverride | [Reference](urn:chargeweave:legacy-api/reference/partnercontractcreate) |
| resource / partner contracts | Partner Contract / Read | ServiceAgreement, RevenueShareRule, CostAllocationRule, SettlementOverride | [Reference](urn:chargeweave:legacy-api/reference/partnercontractread) |
| resource / partner contracts | Partner Contract / Update | ServiceAgreement, RevenueShareRule, CostAllocationRule, SettlementOverride | [Reference](urn:chargeweave:legacy-api/reference/partnercontractupdate) |
| resource / partner contracts | Partner Contract / Patch | ServiceAgreement, RevenueShareRule, CostAllocationRule, SettlementOverride | [Reference](urn:chargeweave:legacy-api/reference/partnercontractpatch) |
| resource / partner contracts | Partner Contract / Delete | ServiceAgreement, RevenueShareRule, CostAllocationRule, SettlementOverride | [Reference](urn:chargeweave:legacy-api/reference/partnercontractdelete) |
| resource / partner contracts | Partner contract / Settlement overrides / Listing | SettlementOverride | [Reference](urn:chargeweave:legacy-api/reference/partnercontractsettlementoverrideslisting) |
| resource / partner contracts | Partner contract / Settlement override / Create | SettlementOverride | [Reference](urn:chargeweave:legacy-api/reference/partnercontractsettlementoverridecreate) |
| resource / partner contracts | Partner contract / Settlement override / Read | SettlementOverride | [Reference](urn:chargeweave:legacy-api/reference/partnercontractsettlementoverrideread) |
| resource / partner contracts | Partner contract / Settlement override / Update | SettlementOverride | [Reference](urn:chargeweave:legacy-api/reference/partnercontractsettlementoverrideupdate) |
| resource / partner contracts | Partner contract / Settlement override / Delete | SettlementOverride | [Reference](urn:chargeweave:legacy-api/reference/partnercontractsettlementoverridedelete) |
| resource / partner invite access policies | Partner invite access policies / listing | SiteAccessPolicy | [Reference](urn:chargeweave:legacy-api/reference/partnerinviteaccesspolicieslisting) |
| resource / partner invite access policies | Partner invite access policy / create | SiteAccessPolicy | [Reference](urn:chargeweave:legacy-api/reference/partnerinviteaccesspolicycreate) |
| resource / partner invite access policies | Partner invite access policy / read | SiteAccessPolicy | [Reference](urn:chargeweave:legacy-api/reference/partnerinviteaccesspolicyread) |
| resource / partner invite access policies | Partner invite access policy / update | SiteAccessPolicy | [Reference](urn:chargeweave:legacy-api/reference/partnerinviteaccesspolicyupdate) |
| resource / partner invite access policies | Partner invite access policy / delete | SiteAccessPolicy | [Reference](urn:chargeweave:legacy-api/reference/partnerinviteaccesspolicydelete) |
| resource / partner invite corporate billing policies | Partner invite corporate billing policies / Listing | CorporateBillingPolicy, CorporateChargerRule | [Reference](urn:chargeweave:legacy-api/reference/partnerinvitecorporatebillingpolicieslisting) |
| resource / partner invite corporate billing policies | Partner invite corporate billing policy / Create | CorporateBillingPolicy, CorporateChargerRule | [Reference](urn:chargeweave:legacy-api/reference/partnerinvitecorporatebillingpolicycreate) |
| resource / partner invite corporate billing policies | Partner invite corporate billing policy / Read | CorporateBillingPolicy, CorporateChargerRule | [Reference](urn:chargeweave:legacy-api/reference/partnerinvitecorporatebillingpolicyread) |
| resource / partner invite corporate billing policies | Partner invite corporate billing policy / Update | CorporateBillingPolicy, CorporateChargerRule | [Reference](urn:chargeweave:legacy-api/reference/partnerinvitecorporatebillingpolicyupdate) |
| resource / partner invite corporate billing policies | Partner invite corporate billing policy / Delete | CorporateBillingPolicy, CorporateChargerRule | [Reference](urn:chargeweave:legacy-api/reference/partnerinvitecorporatebillingpolicydelete) |
| resource / partner invite corporate billing policy snapshots | Partner invite corporate billing policy snapshot / Read | CorporateBillingSnapshot | [Reference](urn:chargeweave:legacy-api/reference/partnerinvitecorporatebillingpolicysnapshotread) |
| resource / partner invites | Partner Invites / Listing | PartnerInvitation | [Reference](urn:chargeweave:legacy-api/reference/partnerinviteslisting) |
| resource / partner invites | Partner Invite / Create | PartnerInvitation | [Reference](urn:chargeweave:legacy-api/reference/partnerinvitecreate) |
| resource / partner invites | Partner Invite / Read | PartnerInvitation | [Reference](urn:chargeweave:legacy-api/reference/partnerinviteread) |
| resource / partner invites | Partner Invite / Update | PartnerInvitation | [Reference](urn:chargeweave:legacy-api/reference/partnerinviteupdate) |
| resource / partner invites | Partner Invite / Delete | PartnerInvitation | [Reference](urn:chargeweave:legacy-api/reference/partnerinvitedelete) |
| resource / partner invites | Partner invites / Listing | PartnerInvitation | [Reference](urn:chargeweave:legacy-api/reference/partnerinviteslistingv2_0) |
| resource / partner invites | Partner invite / Create | PartnerInvitation | [Reference](urn:chargeweave:legacy-api/reference/partnerinvitecreatev2_0) |
| resource / partner invites | Partner invite / Read | PartnerInvitation | [Reference](urn:chargeweave:legacy-api/reference/partnerinvitereadv2_0) |
| resource / partner invites | Partner invite / Update | PartnerInvitation | [Reference](urn:chargeweave:legacy-api/reference/partnerinviteupdatev2_0) |
| resource / partner invites | Partner invite / Delete | PartnerInvitation | [Reference](urn:chargeweave:legacy-api/reference/partnerinvitedeletev2_0) |
| resource / partner invoices | Partner Invoices / Listing | Invoice, CreditNote | [Reference](urn:chargeweave:legacy-api/reference/partnerinvoiceslisting) |
| resource / partner invoices | Partner Invoice / Read | Invoice, CreditNote | [Reference](urn:chargeweave:legacy-api/reference/partnerinvoiceread) |
| resource / partner settlement reports | Partner Settlement Reports / Listing | SettlementBatch, SettlementItem | [Reference](urn:chargeweave:legacy-api/reference/partnersettlementreportslisting) |
| resource / partner settlement reports | Partner Settlement Report / Read | SettlementBatch, SettlementItem | [Reference](urn:chargeweave:legacy-api/reference/partnersettlementreportread) |
| resource / partner settlement reports | Partner Settlement Report / Partner Settlement Records / Listing | SettlementItem | [Reference](urn:chargeweave:legacy-api/reference/partnersettlementreportpartnersettlementrecordslisting) |
| resource / partner settlement reports | Partner Settlement Report / Partner Settlement Record / Create | SettlementItem | [Reference](urn:chargeweave:legacy-api/reference/partnersettlementreportpartnersettlementrecordcreate) |
| resource / partner settlement reports | Partner Settlement Report / Partner Settlement Record / Read | SettlementItem | [Reference](urn:chargeweave:legacy-api/reference/partnertsettlementreportpartnersettlementrecordread) |
| resource / partner settlement reports | Partner Settlement Report / Partner Settlement Record / Update | SettlementItem | [Reference](urn:chargeweave:legacy-api/reference/partnersettlementreportpartnersettlementrecordupdate) |
| resource / partner settlement reports | Partner Settlement Report / Partner Settlement Record / Delete | SettlementItem | [Reference](urn:chargeweave:legacy-api/reference/partnersettlementreportpartnersettlementrecorddelete) |
| resource / partners | Partners / Listing | LegalEntity, PartyRole, ServiceAgreement | [Reference](urn:chargeweave:legacy-api/reference/partnerslistingdeprecated) |
| resource / partners | Partner / Create | LegalEntity, PartyRole, ServiceAgreement | [Reference](urn:chargeweave:legacy-api/reference/partnercreatedeprecated) |
| resource / partners | Partner / Read | LegalEntity, PartyRole, ServiceAgreement | [Reference](urn:chargeweave:legacy-api/reference/partnerreaddeprecated) |
| resource / partners | Partner / Update | LegalEntity, PartyRole, ServiceAgreement | [Reference](urn:chargeweave:legacy-api/reference/partnerupdatedeprecated) |
| resource / partners | Partner / Delete | LegalEntity, PartyRole, ServiceAgreement | [Reference](urn:chargeweave:legacy-api/reference/partnerdeletedeprecated) |
| resource / partners | Partners / Listing | LegalEntity, PartyRole, ServiceAgreement | [Reference](urn:chargeweave:legacy-api/reference/partnerslisting) |
| resource / partners | Partner / Create | LegalEntity, PartyRole, ServiceAgreement | [Reference](urn:chargeweave:legacy-api/reference/partnercreate) |
| resource / partners | Partner / Read | LegalEntity, PartyRole, ServiceAgreement | [Reference](urn:chargeweave:legacy-api/reference/partnerread) |
| resource / partners | Partner / Update | LegalEntity, PartyRole, ServiceAgreement | [Reference](urn:chargeweave:legacy-api/reference/partnerupdate) |
| resource / partners | Partner / Delete | LegalEntity, PartyRole, ServiceAgreement | [Reference](urn:chargeweave:legacy-api/reference/partnerdelete) |
| resource / partners | Partner / Admins / Listing | Principal, AccessGrant | [Reference](urn:chargeweave:legacy-api/reference/partneradminslisting) |
| resource / partners | Partner / Admin / Create | Principal, AccessGrant | [Reference](urn:chargeweave:legacy-api/reference/partneradmincreate) |
| resource / partners | Partner / Admin / Update | Principal, AccessGrant | [Reference](urn:chargeweave:legacy-api/reference/partneradminupdate) |
| resource / partners | Partner / Admin / Delete | Principal, AccessGrant | [Reference](urn:chargeweave:legacy-api/reference/partneradmindelete) |
| resource / partners | Partner / Notes / Listing | Annotation | [Reference](urn:chargeweave:legacy-api/reference/partnernoteslisting) |
| resource / partners | Partner / Note / Create | Annotation | [Reference](urn:chargeweave:legacy-api/reference/partnernotecreate) |
| resource / partners | Partner / Note / Read | Annotation | [Reference](urn:chargeweave:legacy-api/reference/partnernoteshow) |
| resource / partners | Partner / Note / Update | Annotation | [Reference](urn:chargeweave:legacy-api/reference/partnernoteupdate) |
| resource / partners | Partner / Note / Delete | Annotation | [Reference](urn:chargeweave:legacy-api/reference/partnernotedelete) |
| resource / payment terminals | Payment Terminals / Listing | PaymentTerminal | [Reference](urn:chargeweave:legacy-api/reference/getpaymentterminalsdeprecated) |
| resource / payment terminals | Payment Terminals / Create | PaymentTerminal | [Reference](urn:chargeweave:legacy-api/reference/createpaymentterminaldeprecated) |
| resource / payment terminals | Payment Terminals / Read | PaymentTerminal | [Reference](urn:chargeweave:legacy-api/reference/getpaymentterminaldeprecated) |
| resource / payment terminals | Payment Terminals / Update | PaymentTerminal | [Reference](urn:chargeweave:legacy-api/reference/updatepaymentterminaldeprecated) |
| resource / payment terminals | Payment Terminals / Delete | PaymentTerminal | [Reference](urn:chargeweave:legacy-api/reference/deletepaymentterminaldeprecated) |
| resource / payment terminals | Payment Terminals / Listing | PaymentTerminal | [Reference](urn:chargeweave:legacy-api/reference/getpaymentterminalsv1_1) |
| resource / payment terminals | Payment Terminals / Create | PaymentTerminal | [Reference](urn:chargeweave:legacy-api/reference/createpaymentterminalv1_1) |
| resource / payment terminals | Payment Terminals / Read | PaymentTerminal | [Reference](urn:chargeweave:legacy-api/reference/getpaymentterminalv1_1) |
| resource / payment terminals | Payment Terminals / Update | PaymentTerminal | [Reference](urn:chargeweave:legacy-api/reference/updatepaymentterminalv1_1) |
| resource / payment terminals | Payment Terminals / Delete | PaymentTerminal | [Reference](urn:chargeweave:legacy-api/reference/deletepaymentterminalv1_1) |
| resource / provisioning certificate | Provisioning Certificate / Create | ProvisioningCertificate, PlugAndChargeEnrollment | [Reference](urn:chargeweave:legacy-api/reference/createpcid) |
| resource / provisioning certificate | Provisioning Certificate / Listing | ProvisioningCertificate, PlugAndChargeEnrollment | [Reference](urn:chargeweave:legacy-api/reference/listpcids) |
| resource / provisioning certificate | Provisioning Certificate / Update | ProvisioningCertificate, PlugAndChargeEnrollment | [Reference](urn:chargeweave:legacy-api/reference/updatepcid) |
| resource / provisioning certificate | Provisioning Certificate / Read | ProvisioningCertificate, PlugAndChargeEnrollment | [Reference](urn:chargeweave:legacy-api/reference/getpcid) |
| resource / provisioning certificate | Provisioning Certificates / Delete | ProvisioningCertificate, PlugAndChargeEnrollment | [Reference](urn:chargeweave:legacy-api/reference/deletepcid) |
| resource / receipts | Receipts / Listing | Receipt | [Reference](urn:chargeweave:legacy-api/reference/receiptslisting) |
| resource / receipts | Receipt / Read | Receipt | [Reference](urn:chargeweave:legacy-api/reference/receiptread) |
| resource / reimbursement policies | Reimbursement policies / Listing | ReimbursementPolicy | [Reference](urn:chargeweave:legacy-api/reference/reimbursementpolicieslisting) |
| resource / reimbursement policies | Reimbursement policy / Create | ReimbursementPolicy | [Reference](urn:chargeweave:legacy-api/reference/reimbursementpolicycreate) |
| resource / reimbursement policies | Reimbursement policy / Read | ReimbursementPolicy | [Reference](urn:chargeweave:legacy-api/reference/reimbursementpolicyread) |
| resource / reimbursement policies | Reimbursement policy / Update | ReimbursementPolicy | [Reference](urn:chargeweave:legacy-api/reference/reimbursementpolicyupdate) |
| resource / reimbursement policies | Reimbursement policy / Delete | ReimbursementPolicy | [Reference](urn:chargeweave:legacy-api/reference/reimbursementpolicydelete) |
| resource / reimbursement records | Reimbursement records / Listing | ReimbursementRecord | [Reference](urn:chargeweave:legacy-api/reference/reimbursementrecordslisting) |
| resource / reimbursement records | Reimbursement record / Read | ReimbursementRecord | [Reference](urn:chargeweave:legacy-api/reference/reimbursementrecordread) |
| resource / reimbursement reports | Reimbursement reports / Listing | ReimbursementReport | [Reference](urn:chargeweave:legacy-api/reference/reimbursementreportslisting) |
| resource / reimbursement reports | Reimbursement report / Read | ReimbursementReport | [Reference](urn:chargeweave:legacy-api/reference/reimbursementreportread) |
| resource / reservations | Reservations / Listing | Reservation | [Reference](urn:chargeweave:legacy-api/reference/reservationslisting) |
| resource / reservations | Reservation / Read | Reservation | [Reference](urn:chargeweave:legacy-api/reference/reservationread) |
| resource / revenues & expenses | Expenses / Listing | RatedLine, SettlementItem, LedgerAccount, JournalLine | [Reference](urn:chargeweave:legacy-api/reference/expenseslistingdeprecated) |
| resource / revenues & expenses | Expenses / Listing | RatedLine, SettlementItem, LedgerAccount, JournalLine | [Reference](urn:chargeweave:legacy-api/reference/expenseslisting) |
| resource / revenues & expenses | Expenses / Listing | RatedLine, SettlementItem, LedgerAccount, JournalLine | [Reference](urn:chargeweave:legacy-api/reference/expensesv1_2listing) |
| resource / revenues & expenses | Revenues / Listing | RatedLine, SettlementItem, LedgerAccount, JournalLine | [Reference](urn:chargeweave:legacy-api/reference/revenueslistingdeprecated) |
| resource / revenues & expenses | Revenues / Listing | RatedLine, SettlementItem, LedgerAccount, JournalLine | [Reference](urn:chargeweave:legacy-api/reference/revenueslisting) |
| resource / revenues & expenses | Revenues / Listing | RatedLine, SettlementItem, LedgerAccount, JournalLine | [Reference](urn:chargeweave:legacy-api/reference/revenuesv1_2listing) |
| resource / rfids | RFID Tags / Listing | ChargingCredential | [Reference](urn:chargeweave:legacy-api/reference/rfidtagslistingdeprecated) |
| resource / rfids | RFID Tag / Create | ChargingCredential | [Reference](urn:chargeweave:legacy-api/reference/rfidtagcreatedeprecated) |
| resource / rfids | RFID Tag / Read | ChargingCredential | [Reference](urn:chargeweave:legacy-api/reference/rfidtagreaddeprecated) |
| resource / rfids | RFID Tag / Update | ChargingCredential | [Reference](urn:chargeweave:legacy-api/reference/rfidtagupdatedeprecated) |
| resource / rfids | RFID Tag / Delete | ChargingCredential | [Reference](urn:chargeweave:legacy-api/reference/rfidtagdeletedeprecated) |
| resource / roaming connections | Roaming Connections / Listing | RoamingConnection, RoamingModuleAgreement | [Reference](urn:chargeweave:legacy-api/reference/listroamingconnections) |
| resource / roaming connections | Roaming Connections / Read | RoamingConnection, RoamingModuleAgreement | [Reference](urn:chargeweave:legacy-api/reference/getroamingconnection) |
| resource / roaming cpos | Roaming CPOs / Listing | RoamingParty | [Reference](urn:chargeweave:legacy-api/reference/roamingcposlisting) |
| resource / roaming cpos | Roaming CPO / Read | RoamingParty | [Reference](urn:chargeweave:legacy-api/reference/roamingcporead) |
| resource / roaming cpos | Roaming CPO / Update | RoamingParty | [Reference](urn:chargeweave:legacy-api/reference/roamingcpoupdate) |
| resource / roaming emsps | Roaming EMSPs / Listing | RoamingParty | [Reference](urn:chargeweave:legacy-api/reference/roamingemspslisting) |
| resource / roaming emsps | Roaming EMSP / Create | RoamingParty | [Reference](urn:chargeweave:legacy-api/reference/roamingemspcreate) |
| resource / roaming emsps | Roaming EMSP / Read | RoamingParty | [Reference](urn:chargeweave:legacy-api/reference/roamingemspread) |
| resource / roaming emsps | Roaming EMSP / Update | RoamingParty | [Reference](urn:chargeweave:legacy-api/reference/roamingemspupdate) |
| resource / roaming emsps | Roaming EMSP / Delete | RoamingParty | [Reference](urn:chargeweave:legacy-api/reference/roamingemspdelete) |
| resource / roaming emsps | Roaming EMSP Partners / Listing | RoamingParty | [Reference](urn:chargeweave:legacy-api/reference/roamingemsppartnerslisting) |
| resource / roaming operators | Roaming Operators / Listing | RoamingParty, RoamingTariffFilter | [Reference](urn:chargeweave:legacy-api/reference/roamingoperatorslisting) |
| resource / roaming operators | Roaming Operator / Read | RoamingParty, RoamingTariffFilter | [Reference](urn:chargeweave:legacy-api/reference/roamingoperatorread) |
| resource / roaming operators | Roaming Operator / Update | RoamingParty, RoamingTariffFilter | [Reference](urn:chargeweave:legacy-api/reference/roamingoperatorupdate) |
| resource / roaming operators | Roaming Operators / Custom Tariff Filters / Listing | RoamingTariffFilter | [Reference](urn:chargeweave:legacy-api/reference/listroamingcustomtarifffilters) |
| resource / roaming operators | Roaming Operators / Custom Tariff Filters / Create | RoamingTariffFilter | [Reference](urn:chargeweave:legacy-api/reference/createroamingcustomtarifffilter) |
| resource / roaming operators | Roaming Operators / Custom Tariff Filters / Reorder | RoamingTariffFilter | [Reference](urn:chargeweave:legacy-api/reference/reorderroamingcustomtarifffilters) |
| resource / roaming operators | Roaming Operators / Custom Tariff Filters / Read | RoamingTariffFilter | [Reference](urn:chargeweave:legacy-api/reference/getroamingcustomtarifffilter) |
| resource / roaming operators | Roaming Operators / Custom Tariff Filters / Update | RoamingTariffFilter | [Reference](urn:chargeweave:legacy-api/reference/updateroamingcustomtarifffilter) |
| resource / roaming operators | Roaming Operators / Custom Tariff Filters / Delete | RoamingTariffFilter | [Reference](urn:chargeweave:legacy-api/reference/deleteroamingcustomtarifffilter) |
| resource / roaming platforms | Roaming Platforms / Listing | RoamingNetwork | [Reference](urn:chargeweave:legacy-api/reference/roamingplatformslistingdeprecated) |
| resource / roaming platforms | Roaming Platform / Read | RoamingNetwork | [Reference](urn:chargeweave:legacy-api/reference/roamingplatformreaddeprecated) |
| resource / roaming providers | Roaming Providers / Listing | LegalEntity, RoamingNetwork | [Reference](urn:chargeweave:legacy-api/reference/roamingproviderslisting) |
| resource / roaming providers | Roaming Provider / Create | LegalEntity, RoamingNetwork | [Reference](urn:chargeweave:legacy-api/reference/roamingprovidercreate) |
| resource / roaming providers | Roaming Provider / Read | LegalEntity, RoamingNetwork | [Reference](urn:chargeweave:legacy-api/reference/roamingproviderread) |
| resource / roaming providers | Roaming Provider / Update | LegalEntity, RoamingNetwork | [Reference](urn:chargeweave:legacy-api/reference/roamingproviderupdate) |
| resource / roaming providers | Roaming Provider / Delete | LegalEntity, RoamingNetwork | [Reference](urn:chargeweave:legacy-api/reference/roamingproviderdelete) |
| resource / roaming tariffs | Roaming Tariffs / Listing | TariffVersion, RoamingTariffMapping | [Reference](urn:chargeweave:legacy-api/reference/roamingtariffslisting) |
| resource / roaming tariffs | Roaming Tariff / Read | TariffVersion, RoamingTariffMapping | [Reference](urn:chargeweave:legacy-api/reference/roamingtariffread) |
| resource / roaming tariffs | Roaming Tariff / Update | TariffVersion, RoamingTariffMapping | [Reference](urn:chargeweave:legacy-api/reference/roamingtariffupdate) |
| resource / security event logs | Security Events Logs / Listing | SecurityEvent | [Reference](urn:chargeweave:legacy-api/reference/securityeventlogslistingdeprecated) |
| resource / security event logs | Security Event Log / Read | SecurityEvent | [Reference](urn:chargeweave:legacy-api/reference/securityeventlogreaddeprecated) |
| resource / security events | Security Events / Listing | SecurityEvent | [Reference](urn:chargeweave:legacy-api/reference/securityeventslisting) |
| resource / security events | Security Event / Read | SecurityEvent | [Reference](urn:chargeweave:legacy-api/reference/securityeventread) |
| resource / sessions | Sessions / Listing | ChargingSession, ChargingInterval, SessionEvent, UsageAggregate | [Reference](urn:chargeweave:legacy-api/reference/sessionslisting) |
| resource / sessions | Session / Read | ChargingSession, ChargingInterval, SessionEvent, UsageAggregate | [Reference](urn:chargeweave:legacy-api/reference/sessionread) |
| resource / sessions | Sessions / Consumption Stats / Read | UsageAggregate | [Reference](urn:chargeweave:legacy-api/reference/sessionsconsumptionstatsread) |
| resource / sessions | Session / Energy coupon session consumptions | CouponConsumption | [Reference](urn:chargeweave:legacy-api/reference/energycouponsessionconsumptionslisting) |
| resource / sessions | Sessions / Timeline Snapshot / Read | SessionEvent | [Reference](urn:chargeweave:legacy-api/reference/sessiontimelinesnapshotread) |
| resource / settings | Settings / Listing | PlatformSetting | [Reference](urn:chargeweave:legacy-api/reference/settingslisting) |
| resource / sharing invites | Sharing invites / Listing | SharingInvitation | [Reference](urn:chargeweave:legacy-api/reference/sharinginviteslisting) |
| resource / sharing invites | Sharing invite / Read | SharingInvitation | [Reference](urn:chargeweave:legacy-api/reference/sharinginviteread) |
| resource / sub operators | Sub operators / Listing | OperatorService, ManagementDelegation | [Reference](urn:chargeweave:legacy-api/reference/suboperatorslistingdeprecated) |
| resource / sub operators | Sub operator / Read | OperatorService, ManagementDelegation | [Reference](urn:chargeweave:legacy-api/reference/suboperatorreaddeprecated) |
| resource / sub operators | Sub-operators / Listing | OperatorService, ManagementDelegation | [Reference](urn:chargeweave:legacy-api/reference/suboperatorslisting) |
| resource / sub operators | Sub-operators / Create | OperatorService, ManagementDelegation | [Reference](urn:chargeweave:legacy-api/reference/suboperatorcreate) |
| resource / sub operators | Sub-operators / Read | OperatorService, ManagementDelegation | [Reference](urn:chargeweave:legacy-api/reference/suboperatorread) |
| resource / sub operators | Sub-operators / Update | OperatorService, ManagementDelegation | [Reference](urn:chargeweave:legacy-api/reference/suboperatorupdate) |
| resource / sub operators | Sub-operators / Delete | OperatorService, ManagementDelegation | [Reference](urn:chargeweave:legacy-api/reference/suboperatordelete) |
| resource / sub operators | Sub Operator / Notes / Listing | Annotation | [Reference](urn:chargeweave:legacy-api/reference/suboperatornoteslisting) |
| resource / sub operators | Sub Operator / Note / Create | Annotation | [Reference](urn:chargeweave:legacy-api/reference/suboperatornotecreate) |
| resource / sub operators | Sub Operator / Note / Read | Annotation | [Reference](urn:chargeweave:legacy-api/reference/suboperatornoteshow) |
| resource / sub operators | Sub Operator / Note / Update | Annotation | [Reference](urn:chargeweave:legacy-api/reference/suboperatornoteupdate) |
| resource / sub operators | Sub Operator / Note / Delete | Annotation | [Reference](urn:chargeweave:legacy-api/reference/suboperatornotedelete) |
| resource / subscription-plans | Subscription Plans / Listing | SubscriptionPlan, BenefitAllowance | [Reference](urn:chargeweave:legacy-api/reference/subscriptionplanslistingdeprecated) |
| resource / subscription-plans | Subscription plans / Listing | SubscriptionPlan, BenefitAllowance | [Reference](urn:chargeweave:legacy-api/reference/subscriptionplanslisting) |
| resource / subscription-plans | Subscription plan / Create | SubscriptionPlan, BenefitAllowance | [Reference](urn:chargeweave:legacy-api/reference/subscriptionplancreate) |
| resource / subscription-plans | Subscription plan / Read | SubscriptionPlan, BenefitAllowance | [Reference](urn:chargeweave:legacy-api/reference/subscriptionplanread) |
| resource / subscription-plans | Subscription plan / Update | SubscriptionPlan, BenefitAllowance | [Reference](urn:chargeweave:legacy-api/reference/subscriptionplanupdate) |
| resource / subscription-plans | Subscription plan / Delete | SubscriptionPlan, BenefitAllowance | [Reference](urn:chargeweave:legacy-api/reference/subscriptionplandelete) |
| resource / subscriptions | Subscriptions / Listing | Subscription, BillingPeriod | [Reference](urn:chargeweave:legacy-api/reference/subscriptionslisting) |
| resource / subscriptions | Subscription / Read | Subscription, BillingPeriod | [Reference](urn:chargeweave:legacy-api/reference/subscriptionread) |
| resource / tariffs | Tariff Groups / Listing | TariffSet, TariffAssignment | [Reference](urn:chargeweave:legacy-api/reference/tariffgroupslisting) |
| resource / tariffs | Tariff Group / Create | TariffSet, TariffAssignment | [Reference](urn:chargeweave:legacy-api/reference/tariffgroupcreate) |
| resource / tariffs | Tariff Group / Read | TariffSet, TariffAssignment | [Reference](urn:chargeweave:legacy-api/reference/tariffgroupread) |
| resource / tariffs | Tariff Group / Update | TariffSet, TariffAssignment | [Reference](urn:chargeweave:legacy-api/reference/tariffgroupupdate) |
| resource / tariffs | Tariff Group / Delete | TariffSet, TariffAssignment | [Reference](urn:chargeweave:legacy-api/reference/tariffgroupdelete) |
| resource / tariffs | Tariff Snapshot / Read | TariffVersion | [Reference](urn:chargeweave:legacy-api/reference/tariffsnapshotread) |
| resource / tariffs | Tariffs / Listing | Tariff, TariffVersion, PriceComponent, PricingCondition, TariffSet, TariffAssignment, ScheduledTariffChange | [Reference](urn:chargeweave:legacy-api/reference/tariffslisting) |
| resource / tariffs | Tariff / Create | Tariff, TariffVersion, PriceComponent, PricingCondition, TariffSet, TariffAssignment, ScheduledTariffChange | [Reference](urn:chargeweave:legacy-api/reference/tariffcreate) |
| resource / tariffs | Tariff / Read | Tariff, TariffVersion, PriceComponent, PricingCondition, TariffSet, TariffAssignment, ScheduledTariffChange | [Reference](urn:chargeweave:legacy-api/reference/tariffread) |
| resource / tariffs | Tariff / Update | Tariff, TariffVersion, PriceComponent, PricingCondition, TariffSet, TariffAssignment, ScheduledTariffChange | [Reference](urn:chargeweave:legacy-api/reference/tariffupdate) |
| resource / tariffs | Tariff / Partial Update | Tariff, TariffVersion, PriceComponent, PricingCondition, TariffSet, TariffAssignment, ScheduledTariffChange | [Reference](urn:chargeweave:legacy-api/reference/tariffpartialupdate) |
| resource / tariffs | Tariff / Delete | Tariff, TariffVersion, PriceComponent, PricingCondition, TariffSet, TariffAssignment, ScheduledTariffChange | [Reference](urn:chargeweave:legacy-api/reference/tariffdelete) |
| resource / tariffs | Tariff / Scheduled Changes / Listing | ScheduledTariffChange | [Reference](urn:chargeweave:legacy-api/reference/tariffscheduledchangeslisting) |
| resource / tariffs | Tariff / Scheduled Change / Create | ScheduledTariffChange | [Reference](urn:chargeweave:legacy-api/reference/tariffscheduledchangecreate) |
| resource / tariffs | Tariff / Scheduled Change / Delete | ScheduledTariffChange | [Reference](urn:chargeweave:legacy-api/reference/tariffscheduledchangedelete) |
| resource / tariffs | Tariff / Scheduled Change / Read | ScheduledTariffChange | [Reference](urn:chargeweave:legacy-api/reference/tariffscheduledchangeread) |
| resource / tariffs | Tariff / Scheduled Change / Update | ScheduledTariffChange | [Reference](urn:chargeweave:legacy-api/reference/tariffscheduledchangeupdate) |
| resource / tax identification numbers | Tax Identification Numbers / Listing | TaxIdentifier | [Reference](urn:chargeweave:legacy-api/reference/taxidentificationnumberslisting) |
| resource / tax identification numbers | Tax Identification Number / Create | TaxIdentifier | [Reference](urn:chargeweave:legacy-api/reference/taxidentificationnumbercreate) |
| resource / tax identification numbers | Tax Identification Number / Read | TaxIdentifier | [Reference](urn:chargeweave:legacy-api/reference/taxidentificationnumberread) |
| resource / tax identification numbers | Tax Identification Number / Update | TaxIdentifier | [Reference](urn:chargeweave:legacy-api/reference/taxidentificationnumberupdate) |
| resource / tax identification numbers | Tax Identification Number / Delete | TaxIdentifier | [Reference](urn:chargeweave:legacy-api/reference/taxidentificationnumberdelete) |
| resource / taxes | Taxes / Listing | TaxRule, TaxDetermination | [Reference](urn:chargeweave:legacy-api/reference/taxeslisting) |
| resource / taxes | Tax / Create | TaxRule, TaxDetermination | [Reference](urn:chargeweave:legacy-api/reference/taxcreate) |
| resource / taxes | Tax / Read | TaxRule, TaxDetermination | [Reference](urn:chargeweave:legacy-api/reference/taxread) |
| resource / taxes | Tax / Update | TaxRule, TaxDetermination | [Reference](urn:chargeweave:legacy-api/reference/taxupdate) |
| resource / taxes | Tax / Delete | TaxRule, TaxDetermination | [Reference](urn:chargeweave:legacy-api/reference/taxdelete) |
| resource / templates | Templates / Listing | ContentTemplate | [Reference](urn:chargeweave:legacy-api/reference/templateslisting) |
| resource / terms and policies | Terms and policies / Listing | PolicyDocument | [Reference](urn:chargeweave:legacy-api/reference/termsandpolicieslisting) |
| resource / terms and policies | Terms and policies / Read | PolicyDocument | [Reference](urn:chargeweave:legacy-api/reference/termsandpoliciesread) |
| resource / top-up packages | Top-Up Packages / Listing | TopUpOffer | [Reference](urn:chargeweave:legacy-api/reference/topuppackageslisting) |
| resource / top-up packages | Top-Up Package / Create | TopUpOffer | [Reference](urn:chargeweave:legacy-api/reference/topuppackagcreate) |
| resource / top-up packages | Top-Up Package / Read | TopUpOffer | [Reference](urn:chargeweave:legacy-api/reference/topuppackageread) |
| resource / top-up packages | Top-Up Package / Update | TopUpOffer | [Reference](urn:chargeweave:legacy-api/reference/topuppackageupdate) |
| resource / top-up packages | Top-Up Package / Delete | TopUpOffer | [Reference](urn:chargeweave:legacy-api/reference/topuppackagedelete) |
| resource / transactions | Transactions / Listing | PaymentIntent, PaymentAuthorization, PaymentCapture | [Reference](urn:chargeweave:legacy-api/reference/transactionslisting) |
| resource / transactions | Transactions / Create | PaymentIntent, PaymentAuthorization, PaymentCapture | [Reference](urn:chargeweave:legacy-api/reference/transactionscreate) |
| resource / transactions | Transaction / Read | PaymentIntent, PaymentAuthorization, PaymentCapture | [Reference](urn:chargeweave:legacy-api/reference/transactionread) |
| resource / transactions | Transaction / Update | PaymentIntent, PaymentAuthorization, PaymentCapture | [Reference](urn:chargeweave:legacy-api/reference/transactionupdate) |
| resource / user-devices | User devices / Listing | UserDevice | [Reference](urn:chargeweave:legacy-api/reference/userdeviceslisting) |
| resource / user-devices | User device / Read | UserDevice | [Reference](urn:chargeweave:legacy-api/reference/userdeviceread) |
| resource / user-groups | User Groups / Listing | CustomerGroup, GroupMembership | [Reference](urn:chargeweave:legacy-api/reference/usergroupslisting) |
| resource / user-groups | User Group / Create | CustomerGroup, GroupMembership | [Reference](urn:chargeweave:legacy-api/reference/usergroupcreate) |
| resource / user-groups | User Group / Read | CustomerGroup, GroupMembership | [Reference](urn:chargeweave:legacy-api/reference/usergroupread) |
| resource / user-groups | User Group / Update | CustomerGroup, GroupMembership | [Reference](urn:chargeweave:legacy-api/reference/usergroupupdate) |
| resource / user-groups | User Group / Replace | CustomerGroup, GroupMembership | [Reference](urn:chargeweave:legacy-api/reference/usergroupreplace) |
| resource / user-groups | User Group / Delete | CustomerGroup, GroupMembership | [Reference](urn:chargeweave:legacy-api/reference/usergroupdelete) |
| resource / users | Users / Listing | CustomerAccount, Person, BillingProfile, PaymentInstrument | [Reference](urn:chargeweave:legacy-api/reference/userslisting) |
| resource / users | User / Create | CustomerAccount, Person, BillingProfile, PaymentInstrument | [Reference](urn:chargeweave:legacy-api/reference/usercreate) |
| resource / users | User / Read | CustomerAccount, Person, BillingProfile, PaymentInstrument | [Reference](urn:chargeweave:legacy-api/reference/userread) |
| resource / users | User / Update | CustomerAccount, Person, BillingProfile, PaymentInstrument | [Reference](urn:chargeweave:legacy-api/reference/userupdate) |
| resource / users | User / Delete | CustomerAccount, Person, BillingProfile, PaymentInstrument | [Reference](urn:chargeweave:legacy-api/reference/userdelete) |
| resource / users | Invoice details / Read | BillingProfile | [Reference](urn:chargeweave:legacy-api/reference/invoicedetailsread) |
| resource / users | Invoice details / Create or update | BillingProfile | [Reference](urn:chargeweave:legacy-api/reference/invoicedetailscreateorupdate) |
| resource / users | Payment Methods / Listing | PaymentInstrument | [Reference](urn:chargeweave:legacy-api/reference/paymentmethodslisting) |
| resource / users | Payment Method / Create | PaymentInstrument | [Reference](urn:chargeweave:legacy-api/reference/paymentmethodcreate) |
| resource / users | Payment Method / Read | PaymentInstrument | [Reference](urn:chargeweave:legacy-api/reference/paymentmethodread) |
| resource / users | Payment Method / Update | PaymentInstrument | [Reference](urn:chargeweave:legacy-api/reference/paymentmethodupdate) |
| resource / users | Payment Method / Delete | PaymentInstrument | [Reference](urn:chargeweave:legacy-api/reference/paymentmethoddelete) |
| resource / users | Subscription billing periods / Listing | BillingPeriod | [Reference](urn:chargeweave:legacy-api/reference/subscriptionbillingperiodslisting) |
| resource / users | Subscription billing period / Read | BillingPeriod | [Reference](urn:chargeweave:legacy-api/reference/subscriptionbillingperiodread) |
| resource / users | Users / Listing | CustomerAccount, Person, BillingProfile, PaymentInstrument | [Reference](urn:chargeweave:legacy-api/reference/userslistingv1_1) |
| resource / users | User / Create | CustomerAccount, Person, BillingProfile, PaymentInstrument | [Reference](urn:chargeweave:legacy-api/reference/usercreatev1_1) |
| resource / users | User / Read | CustomerAccount, Person, BillingProfile, PaymentInstrument | [Reference](urn:chargeweave:legacy-api/reference/userreadv1_1) |
| resource / users | User / Update | CustomerAccount, Person, BillingProfile, PaymentInstrument | [Reference](urn:chargeweave:legacy-api/reference/userupdatev1_1) |
| resource / users | User / Delete | CustomerAccount, Person, BillingProfile, PaymentInstrument | [Reference](urn:chargeweave:legacy-api/reference/userdeletev1_1) |
| resource / users | User / Notes / Listing | Annotation | [Reference](urn:chargeweave:legacy-api/reference/usernoteslisting) |
| resource / users | User / Note / Create | Annotation | [Reference](urn:chargeweave:legacy-api/reference/usernotecreate) |
| resource / users | User / Note / Read | Annotation | [Reference](urn:chargeweave:legacy-api/reference/usernoteshow) |
| resource / users | User / Note / Update | Annotation | [Reference](urn:chargeweave:legacy-api/reference/usernoteupdate) |
| resource / users | User / Note / Delete | Annotation | [Reference](urn:chargeweave:legacy-api/reference/usernotedelete) |
| resource / utilities | Utilities / Listing | LegalEntity, PartyRole | [Reference](urn:chargeweave:legacy-api/reference/listutilities) |
| resource / utilities | Utilities / Create | LegalEntity, PartyRole | [Reference](urn:chargeweave:legacy-api/reference/createutility) |
| resource / utilities | Utilities / Read | LegalEntity, PartyRole | [Reference](urn:chargeweave:legacy-api/reference/getutility) |
| resource / utilities | Utilities / Update | LegalEntity, PartyRole | [Reference](urn:chargeweave:legacy-api/reference/updateutility) |
| resource / utilities | Utilities / Delete | LegalEntity, PartyRole | [Reference](urn:chargeweave:legacy-api/reference/deleteutility) |
| resource / vehicles | Vehicles / Listing | Vehicle, VehicleAssignment, VehicleTelemetry | [Reference](urn:chargeweave:legacy-api/reference/vehicleslisting) |
| resource / vehicles | Vehicle / Create | Vehicle, VehicleAssignment, VehicleTelemetry | [Reference](urn:chargeweave:legacy-api/reference/vehiclecreate) |
| resource / vehicles | Vehicle telemetry readings / listing | VehicleTelemetry | [Reference](urn:chargeweave:legacy-api/reference/vehicletelemetryreadingslisting) |
| resource / vehicles | Vehicle / Read | Vehicle, VehicleAssignment, VehicleTelemetry | [Reference](urn:chargeweave:legacy-api/reference/vehicleread) |
| resource / vehicles | Vehicle / Update | Vehicle, VehicleAssignment, VehicleTelemetry | [Reference](urn:chargeweave:legacy-api/reference/vehicleupdate) |
| resource / vehicles | Vehicle / Delete | Vehicle, VehicleAssignment, VehicleTelemetry | [Reference](urn:chargeweave:legacy-api/reference/vehicledelete) |
| resource / vehicles | Vehicle / Users / Listing | VehicleAssignment | [Reference](urn:chargeweave:legacy-api/reference/vehicleuserslisting) |
| resource / vehicles | Vehicle / Users / Replace | VehicleAssignment | [Reference](urn:chargeweave:legacy-api/reference/vehicleusersreplace) |
| resource / vehicles | Vehicle / Users / Attach | VehicleAssignment | [Reference](urn:chargeweave:legacy-api/reference/vehicleusersattach) |
| resource / vehicles | Vehicle / Users / Detach | VehicleAssignment | [Reference](urn:chargeweave:legacy-api/reference/vehicleusersdetach) |
| resource / vehicles | Vehicle telemetry readings / Listing | VehicleTelemetry | [Reference](urn:chargeweave:legacy-api/reference/vehicletelemetryreadingsbyvehiclelisting) |
| resource / vehicles | Vehicle telemetry reading / Create | VehicleTelemetry | [Reference](urn:chargeweave:legacy-api/reference/vehicletelemetryreadingcreate) |
| resource / vehicles | Vehicle telemetry reading / Delete | VehicleTelemetry | [Reference](urn:chargeweave:legacy-api/reference/vehicletelemetryreadingdelete) |
| resource / vendor error codes | Vendor Error Codes / Listing | VendorFaultDefinition | [Reference](urn:chargeweave:legacy-api/reference/vendorerrorcodeslisting) |
| resource / vendor error codes | Vendor Error Code / Create | VendorFaultDefinition | [Reference](urn:chargeweave:legacy-api/reference/vendorerrorcodecreate) |
| resource / vendor error codes | Vendor Error Code / Read | VendorFaultDefinition | [Reference](urn:chargeweave:legacy-api/reference/vendorerrorcoderead) |
| resource / vendor error codes | Vendor Error Code / Update | VendorFaultDefinition | [Reference](urn:chargeweave:legacy-api/reference/vendorerrorcodeupdate) |
| resource / vendor error codes | Vendor Error Code / Delete | VendorFaultDefinition | [Reference](urn:chargeweave:legacy-api/reference/vendorerrorcodedelete) |
| resource / vouchers | Vouchers / Listing | Voucher, VoucherRedemption | [Reference](urn:chargeweave:legacy-api/reference/voucherslistingdeprecated) |
| resource / vouchers | Voucher / Create | Voucher, VoucherRedemption | [Reference](urn:chargeweave:legacy-api/reference/vouchercreatedeprecated) |
| resource / vouchers | Voucher / Read | Voucher, VoucherRedemption | [Reference](urn:chargeweave:legacy-api/reference/voucherreaddeprecated) |
| resource / vouchers | Voucher / Update | Voucher, VoucherRedemption | [Reference](urn:chargeweave:legacy-api/reference/voucherupdatedeprecated) |
| resource / vouchers | Voucher / Delete | Voucher, VoucherRedemption | [Reference](urn:chargeweave:legacy-api/reference/voucherdeletedeprecated) |
| resource / vouchers | Vouchers / Listing | Voucher, VoucherRedemption | [Reference](urn:chargeweave:legacy-api/reference/voucherslisting) |
| resource / vouchers | Voucher / Create | Voucher, VoucherRedemption | [Reference](urn:chargeweave:legacy-api/reference/vouchercreate) |
| resource / vouchers | Voucher / Read | Voucher, VoucherRedemption | [Reference](urn:chargeweave:legacy-api/reference/voucherread) |
| resource / vouchers | Voucher / Update | Voucher, VoucherRedemption | [Reference](urn:chargeweave:legacy-api/reference/voucherupdate) |
| resource / vouchers | Voucher / Delete | Voucher, VoucherRedemption | [Reference](urn:chargeweave:legacy-api/reference/voucherdelete) |
