# Endpoint-to-domain traceability

Every endpoint entry observed in the public catalogue is assigned to domain classes. CRUD operations are representations of these classes. Actions additionally have controlled command kinds. A mapping is not an implemented adapter or a field-level equivalence assertion.

| Group | Operation | Classes | Source |
|---|---|---|---|
| action / certificate | Certificate / Reissue an EMAID | PlugAndChargeEnrollment, CertificateRecord | [Reference](https://developers.ampeco.com/reference/certificatereissueanemaid) |
| action / certificate | Certificate / Issue an EMAID | PlugAndChargeEnrollment, CertificateRecord | [Reference](https://developers.ampeco.com/reference/certificateissueanemaid) |
| action / charge point | Charge Point / Change Availability | ChargingStation, RemoteCommand | [Reference](https://developers.ampeco.com/reference/chargepointchangeavailability) |
| action / charge point | Charge Point / Change Owner | ChargingStation, RemoteCommand | [Reference](https://developers.ampeco.com/reference/chargepointchangeowner) |
| action / charge point | Charge Point / Check Tariff Display Support | ChargingStation, RemoteCommand | [Reference](https://developers.ampeco.com/reference/chargepointchecktariffdisplaysupport) |
| action / charge point | Charge Point / Clear cache | ChargingStation, RemoteCommand | [Reference](https://developers.ampeco.com/reference/chargepointclearcache) |
| action / charge point | Charge Point / Clear Charging Profile | ChargingStation, RemoteCommand | [Reference](https://developers.ampeco.com/reference/chargepointclearchargingprofile) |
| action / charge point | Charge Point / Disconnect | ChargingStation, RemoteCommand | [Reference](https://developers.ampeco.com/reference/chargepointdisconnect) |
| action / charge point | Charge Point / Get Composite Schedule | ChargingStation, RemoteCommand | [Reference](https://developers.ampeco.com/reference/chargepointgetcompositeschedule) |
| action / charge point | Charge Point / Get Diagnostics | ChargingStation, RemoteCommand | [Reference](https://developers.ampeco.com/reference/chargepointgetdiagnostics) |
| action / charge point | Charge Point / Get Local List Version | ChargingStation, RemoteCommand | [Reference](https://developers.ampeco.com/reference/chargepointgetlocallistversion) |
| action / charge point | Charge Point / Get Security Log | ChargingStation, RemoteCommand | [Reference](https://developers.ampeco.com/reference/chargepointgetsecuritylog) |
| action / charge point | Charge Point / Move EVSEs to Satellite | ChargingStation, RemoteCommand | [Reference](https://developers.ampeco.com/reference/chargepointmoveevsestosatellite) |
| action / charge point | Charge Point / Reserve | ChargingStation, RemoteCommand | [Reference](https://developers.ampeco.com/reference/chargepointreserve) |
| action / charge point | Charge Point / Reset Security Profile | ChargingStation, RemoteCommand | [Reference](https://developers.ampeco.com/reference/chargepointresetsecurityprofile) |
| action / charge point | Charge Point / Reset | ChargingStation, RemoteCommand | [Reference](https://developers.ampeco.com/reference/chargepointreset) |
| action / charge point | Charge Point / Send Custom OCPP Command | ChargingStation, RemoteCommand | [Reference](https://developers.ampeco.com/reference/chargepointsendcustomocpp) |
| action / charge point | Charge Point / Send Data Transfer | ChargingStation, RemoteCommand | [Reference](https://developers.ampeco.com/reference/chargepointsenddatatransfer) |
| action / charge point | Charge Point / Set Charging Profile | ChargingStation, RemoteCommand | [Reference](https://developers.ampeco.com/reference/chargepointsetchargingprofile) |
| action / charge point | Charge Point / Start Charging Session Without EVSE | ChargingStation, RemoteCommand | [Reference](https://developers.ampeco.com/reference/chargepointstartchargingsessionwithoutevse) |
| action / charge point | Charge Point / Start Charging Session | ChargingStation, RemoteCommand | [Reference](https://developers.ampeco.com/reference/chargepointstartchargingsession) |
| action / charge point | Charge Point / Stop Charging Session | ChargingStation, RemoteCommand | [Reference](https://developers.ampeco.com/reference/chargepointstopchargingsession) |
| action / charge point | Charge point / Sync configuration | ChargingStation, RemoteCommand | [Reference](https://developers.ampeco.com/reference/chargepointsyncconfiguration) |
| action / charge point | Charge Point / Trigger Message Charge Point | ChargingStation, RemoteCommand | [Reference](https://developers.ampeco.com/reference/chargepointtriggermessagechargepoint) |
| action / charge point | Charge Point / EVSE / Unlock | ChargingStation, RemoteCommand | [Reference](https://developers.ampeco.com/reference/chargepointevseunlock) |
| action / charge point | Charge Point / Change sharing code | ChargingStation, RemoteCommand | [Reference](https://developers.ampeco.com/reference/chargepointchangesharingcode) |
| action / charge point | Charge Point / Delete Certificate | ChargingStation, RemoteCommand | [Reference](https://developers.ampeco.com/reference/chargepointdeletecertificate) |
| action / charge point | Charge Point / Install Certificate | ChargingStation, RemoteCommand | [Reference](https://developers.ampeco.com/reference/chargepointinstallcertificate) |
| action / charge point | Charge Point / Set Configuration | ChargingStation, RemoteCommand | [Reference](https://developers.ampeco.com/reference/chargepointsetconfiguration) |
| action / charge point | Charge Point / Set Security Profile | ChargingStation, RemoteCommand | [Reference](https://developers.ampeco.com/reference/chargepointsetsecurityprofile) |
| action / charge point | Charge Point / Get Installed Certificate IDs | ChargingStation, RemoteCommand | [Reference](https://developers.ampeco.com/reference/chargepointgetinstalledcertificateids) |
| action / charge point | Charge Point / Update Firmware | ChargingStation, RemoteCommand | [Reference](https://developers.ampeco.com/reference/chargepointupdatefirmware) |
| action / circuit | Circuit / Attach Charge Point | LoadControlGroup, PriorityRule | [Reference](https://developers.ampeco.com/reference/circuitattachchargepoint) |
| action / circuit | Circuit / Detach Charge Point | LoadControlGroup, PriorityRule | [Reference](https://developers.ampeco.com/reference/circuitdetachchargepoint) |
| action / circuit | Circuit / Set Charge Point Priority | LoadControlGroup, PriorityRule | [Reference](https://developers.ampeco.com/reference/circuitsetchargepointpriority) |
| action / circuit | Circuit / Set Charge Point EVSE Priority | LoadControlGroup, PriorityRule | [Reference](https://developers.ampeco.com/reference/circuitsetchargepointevsepriority) |
| action / circuit | Circuit / Set Circuit SoC Priority | LoadControlGroup, PriorityRule | [Reference](https://developers.ampeco.com/reference/circuitsetcircuitsocpriority) |
| action / circuit | Circuit / Set Session Boost | LoadControlGroup, PriorityRule | [Reference](https://developers.ampeco.com/reference/circuitsetsessionboost) |
| action / circuit | Circuit / Set Session Priority | LoadControlGroup, PriorityRule | [Reference](https://developers.ampeco.com/reference/circuitsetsessionpriority) |
| action / configuration template | Configuration Template / Apply to Charge Points | ConfigurationTemplate, TemplateApplication | [Reference](https://developers.ampeco.com/reference/configurationtemplateapplytochargepoints) |
| action / configuration template | Configuration Template / Bulk Create Variables | ConfigurationTemplate, TemplateApplication | [Reference](https://developers.ampeco.com/reference/configurationtemplatebulkcreatevariables) |
| action / electricity meter | Electricity Meter / Report Consumption | ElectricityMeter, MeterObservation | [Reference](https://developers.ampeco.com/reference/electricitymeterreportconsumption) |
| action / energy coupon | Energy coupon / Redeem code | EnergyCoupon, CouponConsumption | [Reference](https://developers.ampeco.com/reference/energycouponredeemcode) |
| action / energy coupon | Energy coupon / Cancel | EnergyCoupon, CouponConsumption | [Reference](https://developers.ampeco.com/reference/energycouponcancel) |
| action / energy coupon template | Energy coupon template / Deactivate | EnergyCouponTemplate | [Reference](https://developers.ampeco.com/reference/energycoupontemplatedeactivate) |
| action / evse | EVSEs / Bulk Assign Tariff Groups | TariffSet, TariffAssignment | [Reference](https://developers.ampeco.com/reference/evsebulkassigntariffgroups) |
| action / evse | EVSE / Start Charging with EVSE ID | ChargingUnit | [Reference](https://developers.ampeco.com/reference/evsestartchargingwithevseid) |
| action / evse | EVSE / Trigger Message | ChargingUnit | [Reference](https://developers.ampeco.com/reference/evsetriggermessage) |
| action / flexibility asset | Flexibility Asset / Change Status | FlexibilityAsset, FlexibilityActivation | [Reference](https://developers.ampeco.com/reference/changeflexibilityassetstatus) |
| action / flexibility asset | Flexibility Asset / Create Activation Request | FlexibilityAsset, FlexibilityActivation | [Reference](https://developers.ampeco.com/reference/flexibilityassetcreateactivationrequest) |
| action / installer job | Actions / Assign Charge Points | InstallationJob | [Reference](https://developers.ampeco.com/reference/assigninstallerjobchargepoints) |
| action / installer job | Actions / Change Status | InstallationJob | [Reference](https://developers.ampeco.com/reference/changeinstallerjobstatus) |
| action / invoice | Invoice / Update External ID | Invoice, ExternalIdentifier | [Reference](https://developers.ampeco.com/reference/invoiceupdateexternalid) |
| action / location | Location / Check Booking Availability | ChargingSite, BookingRequest | [Reference](https://developers.ampeco.com/reference/locationcheckbookingavailability) |
| action / notifications | Notifications / Resend Failed | EventSubscription, EventDelivery | [Reference](https://developers.ampeco.com/reference/notificationsresendfailed) |
| action / parking space | Parking Space / Update occupancy status | ParkingSpace | [Reference](https://developers.ampeco.com/reference/parkingspaceupdateoccupancystatus) |
| action / partner | Partner / set custom fields | LegalEntity, CustomFieldValue | [Reference](https://developers.ampeco.com/reference/partnersetcustomfieldsv1_0) |
| action / partner invite corporate billing policy | Partner invite corporate billing policy / Disable | CorporateBillingPolicy | [Reference](https://developers.ampeco.com/reference/partnerinvitecorporatebillingpolicydisable) |
| action / partner invite corporate billing policy | Partner invite corporate billing policy / Enable | CorporateBillingPolicy | [Reference](https://developers.ampeco.com/reference/partnerinvitecorporatebillingpolicyenable) |
| action / partner invoice | Partner invoice / Issue credit note | Invoice, CreditNote | [Reference](https://developers.ampeco.com/reference/partnerinvoiceissuecreditnote) |
| action / partner invoice | Partner invoice / Update external ID | Invoice, CreditNote | [Reference](https://developers.ampeco.com/reference/partnerinvoiceupdateexternalid) |
| action / partner settlement report | Partner settlement report / Issue partner invoice | SettlementBatch, Invoice | [Reference](https://developers.ampeco.com/reference/partnersettlementreportissuepartnerinvoice) |
| action / partner settlement report | Partner settlement report / set custom fields | SettlementBatch, Invoice | [Reference](https://developers.ampeco.com/reference/partnersettlementreportsetcustomfields) |
| action / partner settlement report | Partner Settlement Report / Update External ID | SettlementBatch, Invoice | [Reference](https://developers.ampeco.com/reference/partnersettlementreportupdateexternalid) |
| action / payment terminal | Payment terminal / set custom fields | PaymentTerminal, CustomFieldValue | [Reference](https://developers.ampeco.com/reference/paymentterminalsetcustomfields) |
| action / reimbursement record | Reimbursement record / Issue credit | ReimbursementRecord | [Reference](https://developers.ampeco.com/reference/reimbursementrecordissuecredit) |
| action / reimbursement report | Reimbursement report / Regenerate | ReimbursementReport | [Reference](https://developers.ampeco.com/reference/reimbursementreportregenerate) |
| action / reservation | Reservation / Cancel | Reservation | [Reference](https://developers.ampeco.com/reference/reservationcancel) |
| action / roaming emsp | Roaming EMSP / Assign Partner | RoamingParty | [Reference](https://developers.ampeco.com/reference/roamingemspassignpartner) |
| action / roaming operator | Custom Tariff Filters / Set Pricing Data | RoamingTariffFilter | [Reference](https://developers.ampeco.com/reference/updatecustomtarifffiltertariff) |
| action / session | Session / Assign to user | ChargingSession | [Reference](https://developers.ampeco.com/reference/sessionassigntouser) |
| action / session | Session / Change tariff | ChargingSession | [Reference](https://developers.ampeco.com/reference/sessionchangetariff) |
| action / session | Session / Retry Payment | ChargingSession | [Reference](https://developers.ampeco.com/reference/sessionretrypayment) |
| action / session | Session / set custom fields | ChargingSession | [Reference](https://developers.ampeco.com/reference/sessionsetcustomfields) |
| action / subscription-plan | Subscription plan / Replace | SubscriptionPlan | [Reference](https://developers.ampeco.com/reference/subscriptionplanreplace) |
| action / tariff | Tariff / Set Display Information | TariffVersion, PriceDisplay | [Reference](https://developers.ampeco.com/reference/tariffsetdisplayinformation) |
| action / tax | Taxes / Validate VAT number | TaxIdentifier, TaxDetermination | [Reference](https://developers.ampeco.com/reference/validatetaxnumber) |
| action / transaction | Transaction / Create Pre-Authorization | PaymentIntent, PaymentAuthorization, Invoice | [Reference](https://developers.ampeco.com/reference/transactioncreatepreauthorization) |
| action / transaction | Transaction / Issue Invoice | PaymentIntent, PaymentAuthorization, Invoice | [Reference](https://developers.ampeco.com/reference/transactionissueinvoice) |
| action / transaction | Transaction / Resend Invoice | PaymentIntent, PaymentAuthorization, Invoice | [Reference](https://developers.ampeco.com/reference/transactionresendinvoice) |
| action / transaction | Transaction / Update Payment Reference | PaymentIntent, PaymentAuthorization, Invoice | [Reference](https://developers.ampeco.com/reference/transactionupdatepaymentreference) |
| action / user | User / Revoke marketing consent | CustomerAccount, Subscription, Wallet, VoucherRedemption, ConsentDecision | [Reference](https://developers.ampeco.com/reference/userrevokemarketingconsent) |
| action / user | User / Activate subscription | CustomerAccount, Subscription, Wallet, VoucherRedemption, ConsentDecision | [Reference](https://developers.ampeco.com/reference/useractivatesubscription) |
| action / user | User / Add Balance | CustomerAccount, Subscription, Wallet, VoucherRedemption, ConsentDecision | [Reference](https://developers.ampeco.com/reference/useraddbalance) |
| action / user | User / Apply Custom Fee | CustomerAccount, Subscription, Wallet, VoucherRedemption, ConsentDecision | [Reference](https://developers.ampeco.com/reference/userapplycustomfee) |
| action / user | User / Cancel subscription | CustomerAccount, Subscription, Wallet, VoucherRedemption, ConsentDecision | [Reference](https://developers.ampeco.com/reference/usercancelsubscription) |
| action / user | User / Change Status | CustomerAccount, Subscription, Wallet, VoucherRedemption, ConsentDecision | [Reference](https://developers.ampeco.com/reference/userchangestatus) |
| action / user | User / Clear subscription amount due | CustomerAccount, Subscription, Wallet, VoucherRedemption, ConsentDecision | [Reference](https://developers.ampeco.com/reference/userclearsubscriptionamountdue) |
| action / user | User / Get total eligible coupon energy | CustomerAccount, Subscription, Wallet, VoucherRedemption, ConsentDecision | [Reference](https://developers.ampeco.com/reference/usergettotaleligiblecouponenergy) |
| action / user | User / Subscribe to plan | CustomerAccount, Subscription, Wallet, VoucherRedemption, ConsentDecision | [Reference](https://developers.ampeco.com/reference/usersubscribetoplan) |
| action / user | Subscription billing period / Retry payment | BillingPeriod | [Reference](https://developers.ampeco.com/reference/subscriptionbillingperiodretrypayment) |
| action / user | User / Export All Private Data | CustomerAccount, Subscription, Wallet, VoucherRedemption, ConsentDecision | [Reference](https://developers.ampeco.com/reference/userexportallprivatedata) |
| action / user | User / Redeem Voucher | CustomerAccount, Subscription, Wallet, VoucherRedemption, ConsentDecision | [Reference](https://developers.ampeco.com/reference/userredeemvoucher) |
| logs / communication | Communication logs / Listing | CommunicationLog, SourceEvent | [Reference](https://developers.ampeco.com/reference/communicationlogslisting) |
| logs / communication | Communication log / Read | CommunicationLog, SourceEvent | [Reference](https://developers.ampeco.com/reference/communicationlogread) |
| logs / ocpi | OCPI Logs / Listing | CommunicationLog, SourceEvent | [Reference](https://developers.ampeco.com/reference/listocpilogs) |
| logs / ocpi | OCPI Log / Read | CommunicationLog, SourceEvent | [Reference](https://developers.ampeco.com/reference/readocpilog) |
| notifications | Notifications / Subscribe | EventSubscription, EventDelivery, SourceEvent | [Reference](https://developers.ampeco.com/reference/notificationssubscribedeprecated) |
| notifications | Notifications / Listing | EventSubscription, EventDelivery, SourceEvent | [Reference](https://developers.ampeco.com/reference/notificationslistingdeprecated) |
| notifications | Notifications / Read | EventSubscription, EventDelivery, SourceEvent | [Reference](https://developers.ampeco.com/reference/notificationsreaddeprecated) |
| notifications | Notifications / Update | EventSubscription, EventDelivery, SourceEvent | [Reference](https://developers.ampeco.com/reference/notificationsupdatedeprecated) |
| notifications | Notifications / Unsubscribe | EventSubscription, EventDelivery, SourceEvent | [Reference](https://developers.ampeco.com/reference/notificationsunsubscribedeprecated) |
| notifications | Notifications / Subscribe | EventSubscription, EventDelivery, SourceEvent | [Reference](https://developers.ampeco.com/reference/notificationssubscribe) |
| notifications | Notifications / Listing | EventSubscription, EventDelivery, SourceEvent | [Reference](https://developers.ampeco.com/reference/notificationslisting) |
| notifications | Notification / Read | EventSubscription, EventDelivery, SourceEvent | [Reference](https://developers.ampeco.com/reference/notificationread) |
| notifications | Notifications / Update | EventSubscription, EventDelivery, SourceEvent | [Reference](https://developers.ampeco.com/reference/notificationscreate) |
| notifications | Notifications / Unsubscribe | EventSubscription, EventDelivery, SourceEvent | [Reference](https://developers.ampeco.com/reference/notificationsunsubscribe) |
| oauth | OAuth token revocation | ApiClient, AccessTokenLease, AccessGrant, AuditEntry | [Reference](https://developers.ampeco.com/reference/oauthtokenrevoke) |
| oauth | OAuth / Token Exchange | ApiClient, AccessTokenLease, AccessGrant, AuditEntry | [Reference](https://developers.ampeco.com/reference/oauthtokenexchange) |
| resource / admins | Admins / Listing | Principal, AccessGrant, SecurityRole, Permission | [Reference](https://developers.ampeco.com/reference/adminlist) |
| resource / admins | Admin / Read | Principal, AccessGrant, SecurityRole, Permission | [Reference](https://developers.ampeco.com/reference/adminread) |
| resource / admins | Admin / Permissions | Principal, AccessGrant, SecurityRole, Permission | [Reference](https://developers.ampeco.com/reference/adminpermissions) |
| resource / authorizations | Authorization / Read | AuthorizationRequest, AuthorizationDecision | [Reference](https://developers.ampeco.com/reference/authorizationreaddeprecated) |
| resource / authorizations | Authorizations / Listing | AuthorizationRequest, AuthorizationDecision | [Reference](https://developers.ampeco.com/reference/authorizationslisting) |
| resource / authorizations | Authorization / Read | AuthorizationRequest, AuthorizationDecision | [Reference](https://developers.ampeco.com/reference/authorizationread) |
| resource / authorizations | Authorizations / Listing | AuthorizationRequest, AuthorizationDecision | [Reference](https://developers.ampeco.com/reference/authorizationslistingv2_1) |
| resource / authorizations | Authorization / Read | AuthorizationRequest, AuthorizationDecision | [Reference](https://developers.ampeco.com/reference/authorizationreadv2_1) |
| resource / booking requests | Booking Requests / Listing | BookingRequest | [Reference](https://developers.ampeco.com/reference/bookingrequestslisting) |
| resource / booking requests | Booking Request / Create | BookingRequest | [Reference](https://developers.ampeco.com/reference/bookingrequestcreate) |
| resource / booking requests | Booking Request / Read | BookingRequest | [Reference](https://developers.ampeco.com/reference/bookingrequestread) |
| resource / bookings | Bookings / Listing | Booking | [Reference](https://developers.ampeco.com/reference/bookingslisting) |
| resource / bookings | Booking / Read | Booking | [Reference](https://developers.ampeco.com/reference/bookingread) |
| resource / cdrs | CDRs / Listing | ChargeDetailRecord | [Reference](https://developers.ampeco.com/reference/cdrslisting) |
| resource / cdrs | CDR / Read | ChargeDetailRecord | [Reference](https://developers.ampeco.com/reference/cdrread) |
| resource / charge point downtime periods | Charge Point Downtime Periods / Listing | DowntimePeriod, OperationalPeriod | [Reference](https://developers.ampeco.com/reference/chargepointdowntimeperiodslisting) |
| resource / charge point downtime periods | Charge Point Downtime Period / Create | DowntimePeriod, OperationalPeriod | [Reference](https://developers.ampeco.com/reference/chargepointdowntimeperiodcreate) |
| resource / charge point downtime periods | Charge Point Downtime Period / Read | DowntimePeriod, OperationalPeriod | [Reference](https://developers.ampeco.com/reference/chargepointdowntimeperiodread) |
| resource / charge point downtime periods | Charge Point Downtime Period / Update | DowntimePeriod, OperationalPeriod | [Reference](https://developers.ampeco.com/reference/chargepointdowntimeperiodupdate) |
| resource / charge point downtime periods | Charge Point Downtime Period / Delete | DowntimePeriod, OperationalPeriod | [Reference](https://developers.ampeco.com/reference/chargepointdowntimeperioddelete) |
| resource / charge point downtime periods | Charge Point Downtime Period / Status Log | DowntimePeriod, OperationalPeriod | [Reference](https://developers.ampeco.com/reference/chargepointdowntimeperiodstatuslog) |
| resource / charge point models | Charge Point Models / Listing | EquipmentModel, DeviceCapability | [Reference](https://developers.ampeco.com/reference/chargepointmodelslisting) |
| resource / charge point models | Charge Point Model / Create | EquipmentModel, DeviceCapability | [Reference](https://developers.ampeco.com/reference/chargepointmodelcreate) |
| resource / charge point models | Charge Point Model / Read | EquipmentModel, DeviceCapability | [Reference](https://developers.ampeco.com/reference/chargepointmodelread) |
| resource / charge point models | Charge Point Model / Update | EquipmentModel, DeviceCapability | [Reference](https://developers.ampeco.com/reference/chargepointmodelupdate) |
| resource / charge point models | Charge Point Model / Delete | EquipmentModel, DeviceCapability | [Reference](https://developers.ampeco.com/reference/chargepointmodeldelete) |
| resource / charge point models | Charge Point Models / Listing | EquipmentModel, DeviceCapability | [Reference](https://developers.ampeco.com/reference/chargepointmodelslistingdeprecated) |
| resource / charge point models | Charge Point Model / Create | EquipmentModel, DeviceCapability | [Reference](https://developers.ampeco.com/reference/chargepointmodelcreatedeprecated) |
| resource / charge point models | Charge Point Model / Read | EquipmentModel, DeviceCapability | [Reference](https://developers.ampeco.com/reference/chargepointmodelreaddeprecated) |
| resource / charge point models | Charge Point Model / Update | EquipmentModel, DeviceCapability | [Reference](https://developers.ampeco.com/reference/chargepointmodelupdatedeprecated) |
| resource / charge point models | Charge Point Model / Delete | EquipmentModel, DeviceCapability | [Reference](https://developers.ampeco.com/reference/chargepointmodeldeletedeprecated) |
| resource / charge point vendors | Charge Point Vendors / Listing | Manufacturer | [Reference](https://developers.ampeco.com/reference/chargepointvendorslisting) |
| resource / charge point vendors | Charge Point Vendor / Create | Manufacturer | [Reference](https://developers.ampeco.com/reference/chargepointvendorcreate) |
| resource / charge point vendors | Charge Point Vendor / Read | Manufacturer | [Reference](https://developers.ampeco.com/reference/chargepointvendorread) |
| resource / charge point vendors | Charge Point Vendor / Update | Manufacturer | [Reference](https://developers.ampeco.com/reference/chargepointvendorupdate) |
| resource / charge point vendors | Charge Point Vendor / Delete | Manufacturer | [Reference](https://developers.ampeco.com/reference/chargepointvendordelete) |
| resource / charge point vendors | Charge Point Vendors / Listing | Manufacturer | [Reference](https://developers.ampeco.com/reference/chargepointvendorslistingdeprecated) |
| resource / charge point vendors | Charge Point Vendor / Create | Manufacturer | [Reference](https://developers.ampeco.com/reference/chargepointvendorcreatedeprecated) |
| resource / charge point vendors | Charge Point Vendor / Read | Manufacturer | [Reference](https://developers.ampeco.com/reference/chargepointvendorreaddeprecated) |
| resource / charge point vendors | Charge Point Vendor / Update | Manufacturer | [Reference](https://developers.ampeco.com/reference/chargepointvendorupdatedeprecated) |
| resource / charge point vendors | Charge Point Vendor / Delete | Manufacturer | [Reference](https://developers.ampeco.com/reference/chargepointvendordeletedeprecated) |
| resource / charge points | Charge Points / Listing | ChargingStation, ProtocolEndpoint, ConfigurationVariable, HardwareStatusObservation, ConnectionObservation | [Reference](https://developers.ampeco.com/reference/chargepointslistingdeprecated) |
| resource / charge points | Charge Point / Create | ChargingStation, ProtocolEndpoint, ConfigurationVariable, HardwareStatusObservation, ConnectionObservation | [Reference](https://developers.ampeco.com/reference/chargepointcreatedeprecated) |
| resource / charge points | Charge Point / Read | ChargingStation, ProtocolEndpoint, ConfigurationVariable, HardwareStatusObservation, ConnectionObservation | [Reference](https://developers.ampeco.com/reference/chargepointreaddeprecated) |
| resource / charge points | Charge Point / Update | ChargingStation, ProtocolEndpoint, ConfigurationVariable, HardwareStatusObservation, ConnectionObservation | [Reference](https://developers.ampeco.com/reference/chargepointupdatedeprecated) |
| resource / charge points | Charge Point / Delete | ChargingStation, ProtocolEndpoint, ConfigurationVariable, HardwareStatusObservation, ConnectionObservation | [Reference](https://developers.ampeco.com/reference/chargepointdeletedeprecated) |
| resource / charge points | Charge Point / Configurations / Listing | ConfigurationVariable | [Reference](https://developers.ampeco.com/reference/chargepointconfigurationslistingdeprecated) |
| resource / charge points | Charge Point / Configuration / Read | ConfigurationVariable | [Reference](https://developers.ampeco.com/reference/chargepointconfigurationreaddeprecated) |
| resource / charge points | Charge Point / Configuration / Update | ConfigurationVariable | [Reference](https://developers.ampeco.com/reference/chargepointconfigurationupdatedeprecated) |
| resource / charge points | Charge Point / Status / Read | ChargingStation, ProtocolEndpoint, ConfigurationVariable, HardwareStatusObservation, ConnectionObservation | [Reference](https://developers.ampeco.com/reference/chargepointstatusread) |
| resource / charge points | Charge Point / Create | ChargingStation, ProtocolEndpoint, ConfigurationVariable, HardwareStatusObservation, ConnectionObservation | [Reference](https://developers.ampeco.com/reference/chargepointcreate) |
| resource / charge points | Charge Points / Listing | ChargingStation, ProtocolEndpoint, ConfigurationVariable, HardwareStatusObservation, ConnectionObservation | [Reference](https://developers.ampeco.com/reference/chargepointslisting) |
| resource / charge points | Charge Point / Update | ChargingStation, ProtocolEndpoint, ConfigurationVariable, HardwareStatusObservation, ConnectionObservation | [Reference](https://developers.ampeco.com/reference/chargepointupdate) |
| resource / charge points | Charge Point / Read | ChargingStation, ProtocolEndpoint, ConfigurationVariable, HardwareStatusObservation, ConnectionObservation | [Reference](https://developers.ampeco.com/reference/chargepointread) |
| resource / charge points | Charge Point / Delete | ChargingStation, ProtocolEndpoint, ConfigurationVariable, HardwareStatusObservation, ConnectionObservation | [Reference](https://developers.ampeco.com/reference/chargepointdelete) |
| resource / charge points | Charge Point / Available personal smart charging modes / Listing | SmartChargingPreference | [Reference](https://developers.ampeco.com/reference/chargepointavailablepersonalsmartchargingmodeslisting) |
| resource / charge points | Charge Point / Configurations / Listing | ConfigurationVariable | [Reference](https://developers.ampeco.com/reference/chargepointconfigurationslisting) |
| resource / charge points | Charge Point / Configuration / Read | ConfigurationVariable | [Reference](https://developers.ampeco.com/reference/chargepointconfigurationread) |
| resource / charge points | Charge Point / Configuration / Update | ConfigurationVariable | [Reference](https://developers.ampeco.com/reference/chargepointconfigurationupdate) |
| resource / charge points | Charge Point / EVSE / Create | ChargingUnit | [Reference](https://developers.ampeco.com/reference/chargepointevsecreate) |
| resource / charge points | Charge Point / EVSEs / Listing | ChargingUnit | [Reference](https://developers.ampeco.com/reference/chargepointevseslisting) |
| resource / charge points | Charge Point / EVSE / Update | ChargingUnit | [Reference](https://developers.ampeco.com/reference/chargepointevseupdate) |
| resource / charge points | Charge Point / EVSE / Read | ChargingUnit | [Reference](https://developers.ampeco.com/reference/chargepointevseread) |
| resource / charge points | Charge Point / EVSE / Delete | ChargingUnit | [Reference](https://developers.ampeco.com/reference/chargepointevsedelete) |
| resource / charge points | Charge Point / Evse / Connectors / Listing | Connector | [Reference](https://developers.ampeco.com/reference/chargepointevseconnectorslisting) |
| resource / charge points | Charge Points / Evse / Connector / Create | Connector | [Reference](https://developers.ampeco.com/reference/chargepointevseconnectorcreate) |
| resource / charge points | Charge Points / Evse / Connector / Read | Connector | [Reference](https://developers.ampeco.com/reference/chargepointevseconnectorread) |
| resource / charge points | Charge Points / Evse / Connector / Update | Connector | [Reference](https://developers.ampeco.com/reference/chargepointevseconnectorupdate) |
| resource / charge points | Charge Points / Evse / Connector / Delete | Connector | [Reference](https://developers.ampeco.com/reference/chargepointevseconnectordelete) |
| resource / charge points | Charge Point / Hardware Status Logs / Listing | HardwareStatusObservation | [Reference](https://developers.ampeco.com/reference/listchargepointhardwarestatuslogs) |
| resource / charge points | Charge Point / Latest Hardware Status Log | HardwareStatusObservation | [Reference](https://developers.ampeco.com/reference/getchargepointlatesthardwarestatuslog) |
| resource / charge points | Charge Point / Latest Network Status Log | ConnectionObservation | [Reference](https://developers.ampeco.com/reference/getchargepointlatestnetworkstatuslog) |
| resource / charge points | Charge Point / Network Status Logs / Listing | ConnectionObservation | [Reference](https://developers.ampeco.com/reference/listchargepointnetworkstatuslogs) |
| resource / charge points | Charge Point / Notes / Listing | Annotation | [Reference](https://developers.ampeco.com/reference/chargepointnoteslisting) |
| resource / charge points | Charge Point / Note / Create | Annotation | [Reference](https://developers.ampeco.com/reference/chargepointnotecreate) |
| resource / charge points | Charge Point / Note / Read | Annotation | [Reference](https://developers.ampeco.com/reference/chargepointnoteshow) |
| resource / charge points | Charge Point / Note / Update | Annotation | [Reference](https://developers.ampeco.com/reference/chargepointnoteupdate) |
| resource / charge points | Charge Point / Note / Delete | Annotation | [Reference](https://developers.ampeco.com/reference/chargepointnotedelete) |
| resource / charge points | Charge Point / Personal smart charging preferences / Read | SmartChargingPreference | [Reference](https://developers.ampeco.com/reference/chargepointpersonalsmartchargingpreferencesread) |
| resource / charge points | Charge Point / Personal smart charging preferences / Update | SmartChargingPreference | [Reference](https://developers.ampeco.com/reference/personalsmartchargingpreferencesupdate) |
| resource / charge points | Charge Point / Shared Partners / Listing | SharingAgreement | [Reference](https://developers.ampeco.com/reference/chargepointsharedpartnerslisting) |
| resource / charge points | Charge Point / Shared Partners / Update | SharingAgreement | [Reference](https://developers.ampeco.com/reference/chargepointsharedpartnerssync) |
| resource / charge points | Charge point / share / create | SharingAgreement | [Reference](https://developers.ampeco.com/reference/chargepointsharecreate) |
| resource / charge points | Charge point / shares / listing | SharingAgreement | [Reference](https://developers.ampeco.com/reference/chargepointshareslisting) |
| resource / charge points | Charge point / share / read | SharingAgreement | [Reference](https://developers.ampeco.com/reference/chargepointshareread) |
| resource / charge points | Charge point / share / update | SharingAgreement | [Reference](https://developers.ampeco.com/reference/chargepointshareupdate) |
| resource / charge points | Charge point / share / delete | SharingAgreement | [Reference](https://developers.ampeco.com/reference/charegpointsharedelete) |
| resource / charge points | Charge Point / Smart Charging / Update | SmartChargingPreference | [Reference](https://developers.ampeco.com/reference/chargepointsmartchargingupdate) |
| resource / circuits | Circuits / Listing | LoadControlGroup, ControlGroupMembership, PowerConstraint, PhaseCurrentConstraint | [Reference](https://developers.ampeco.com/reference/circuitslistingdeprecated) |
| resource / circuits | Circuit / Create | LoadControlGroup, ControlGroupMembership, PowerConstraint, PhaseCurrentConstraint | [Reference](https://developers.ampeco.com/reference/circuitcreatedeprecated) |
| resource / circuits | Circuit / Read | LoadControlGroup, ControlGroupMembership, PowerConstraint, PhaseCurrentConstraint | [Reference](https://developers.ampeco.com/reference/circuitreaddeprecated) |
| resource / circuits | Circuit / Update | LoadControlGroup, ControlGroupMembership, PowerConstraint, PhaseCurrentConstraint | [Reference](https://developers.ampeco.com/reference/circuitupdatedeprecated) |
| resource / circuits | Circuit / Delete | LoadControlGroup, ControlGroupMembership, PowerConstraint, PhaseCurrentConstraint | [Reference](https://developers.ampeco.com/reference/circuitdeletedeprecated) |
| resource / circuits | Circuit / Consumption (all phases) | UnmanagedLoadObservation | [Reference](https://developers.ampeco.com/reference/circuitconsumptionallphasesdeprecated) |
| resource / circuits | Circuit / Consumption (phase) | UnmanagedLoadObservation | [Reference](https://developers.ampeco.com/reference/circuitconsumptionphasedeprecated) |
| resource / circuits | Circuits / Listing | LoadControlGroup, ControlGroupMembership, PowerConstraint, PhaseCurrentConstraint | [Reference](https://developers.ampeco.com/reference/circuitslisting) |
| resource / circuits | Circuit / Create | LoadControlGroup, ControlGroupMembership, PowerConstraint, PhaseCurrentConstraint | [Reference](https://developers.ampeco.com/reference/circuitcreate) |
| resource / circuits | Circuit / Read | LoadControlGroup, ControlGroupMembership, PowerConstraint, PhaseCurrentConstraint | [Reference](https://developers.ampeco.com/reference/circuitread) |
| resource / circuits | Circuit / Update | LoadControlGroup, ControlGroupMembership, PowerConstraint, PhaseCurrentConstraint | [Reference](https://developers.ampeco.com/reference/circuitupdate) |
| resource / circuits | Circuit / Delete | LoadControlGroup, ControlGroupMembership, PowerConstraint, PhaseCurrentConstraint | [Reference](https://developers.ampeco.com/reference/circuitdelete) |
| resource / circuits | Circuit / Charge Point Priorities / Listing | PriorityRule | [Reference](https://developers.ampeco.com/reference/circuitchargepointprioritieslisting) |
| resource / circuits | Circuit / Consumption | UnmanagedLoadObservation | [Reference](https://developers.ampeco.com/reference/circuitconsumption) |
| resource / circuits | Circuit / Schedule / Read | ChargingSchedule, SchedulePeriod | [Reference](https://developers.ampeco.com/reference/circuitscheduleread) |
| resource / circuits | Circuit / Schedule / Create or Update | ChargingSchedule, SchedulePeriod | [Reference](https://developers.ampeco.com/reference/circuitschedulecreateorupdate) |
| resource / circuits | Circuit / Schedule / Delete | ChargingSchedule, SchedulePeriod | [Reference](https://developers.ampeco.com/reference/circuitscheduledelete) |
| resource / circuits | Circuit / SoC Priorities / Listing | PriorityRule | [Reference](https://developers.ampeco.com/reference/circuitsocprioritieslisting) |
| resource / circuits | Circuit / Unmanaged Load / Read | UnmanagedLoadObservation | [Reference](https://developers.ampeco.com/reference/circuitunmanagedloadread) |
| resource / circuits | Circuits / User Priorities / Listing | PriorityRule | [Reference](https://developers.ampeco.com/reference/circuituserprioritieslisting) |
| resource / circuits | Circuits / User Priority / Create | PriorityRule | [Reference](https://developers.ampeco.com/reference/circuituserprioritycreate) |
| resource / circuits | Circuits / User Priority / Read | PriorityRule | [Reference](https://developers.ampeco.com/reference/circuituserpriorityread) |
| resource / circuits | Circuits / User Priority / Update | PriorityRule | [Reference](https://developers.ampeco.com/reference/circuituserpriorityupdate) |
| resource / circuits | Circuits / User Priority / Delete | PriorityRule | [Reference](https://developers.ampeco.com/reference/circuituserprioritydelete) |
| resource / configuration templates | Configuration Template / Listing | ConfigurationTemplate, ConfigurationTemplateEntry, TemplateApplication | [Reference](https://developers.ampeco.com/reference/listconfigurationtemplates) |
| resource / configuration templates | Configuration Template / Create | ConfigurationTemplate, ConfigurationTemplateEntry, TemplateApplication | [Reference](https://developers.ampeco.com/reference/createconfigurationtemplate) |
| resource / configuration templates | Configuration Template / Update | ConfigurationTemplate, ConfigurationTemplateEntry, TemplateApplication | [Reference](https://developers.ampeco.com/reference/updateconfigurationtemplate) |
| resource / configuration templates | Configuration Template / Read | ConfigurationTemplate, ConfigurationTemplateEntry, TemplateApplication | [Reference](https://developers.ampeco.com/reference/getconfigurationtemplate) |
| resource / configuration templates | Configuration Template / Delete | ConfigurationTemplate, ConfigurationTemplateEntry, TemplateApplication | [Reference](https://developers.ampeco.com/reference/deleteconfigurationtemplate) |
| resource / configuration templates | Configuration Template Variable / Listing | ConfigurationTemplateEntry | [Reference](https://developers.ampeco.com/reference/configurationtemplatevariablelisting) |
| resource / configuration templates | Configuration Template Variable / Create | ConfigurationTemplateEntry | [Reference](https://developers.ampeco.com/reference/configurationtemplatevariablecreate) |
| resource / configuration templates | Configuration Template Variable / Update | ConfigurationTemplateEntry | [Reference](https://developers.ampeco.com/reference/configurationtemplatevariableupdate) |
| resource / configuration templates | Configuration Template Variable / Delete | ConfigurationTemplateEntry | [Reference](https://developers.ampeco.com/reference/configurationtemplatevariabledelete) |
| resource / consent-history | Consent History / Listing | ConsentDecision | [Reference](https://developers.ampeco.com/reference/consenthistorylisting) |
| resource / consents | Consents / Listing | ConsentDecision | [Reference](https://developers.ampeco.com/reference/consentslisting) |
| resource / consents | Consents / Create | ConsentDecision | [Reference](https://developers.ampeco.com/reference/consentscreate) |
| resource / contact details | Contact details / Read | ContactProfile | [Reference](https://developers.ampeco.com/reference/contactdetailsread) |
| resource / contact details | Contact details / Update | ContactProfile | [Reference](https://developers.ampeco.com/reference/contactdetailsupdate) |
| resource / contact details | Contact details / Delete | ContactProfile | [Reference](https://developers.ampeco.com/reference/contactdetailsdelete) |
| resource / currencies | Currencies / Listing | Currency | [Reference](https://developers.ampeco.com/reference/currencieslisting) |
| resource / currencies | Currency / Create | Currency | [Reference](https://developers.ampeco.com/reference/currencycreate) |
| resource / currencies | Currency / Read | Currency | [Reference](https://developers.ampeco.com/reference/currencyread) |
| resource / currencies | Currency / Update | Currency | [Reference](https://developers.ampeco.com/reference/currencyupdate) |
| resource / currencies | Currency / Delete | Currency | [Reference](https://developers.ampeco.com/reference/currencydeletedeprecated) |
| resource / currency rates | Currency Rate / Create | ExchangeRate | [Reference](https://developers.ampeco.com/reference/createcurrencyrate) |
| resource / currency rates | Currency Rate / Listing | ExchangeRate | [Reference](https://developers.ampeco.com/reference/listcurrencyrates) |
| resource / currency rates | Currency Rate / Update | ExchangeRate | [Reference](https://developers.ampeco.com/reference/updatecurrencyrate) |
| resource / currency rates | Currency Rate / Read | ExchangeRate | [Reference](https://developers.ampeco.com/reference/getcurrencyrate) |
| resource / currency rates | Currency Rate / Delete | ExchangeRate | [Reference](https://developers.ampeco.com/reference/deletecurrencyrate) |
| resource / custom fees | Custom Fees / Listing | CustomFee | [Reference](https://developers.ampeco.com/reference/customfeeslisting) |
| resource / custom fees | Custom Fee / Read | CustomFee | [Reference](https://developers.ampeco.com/reference/customfeeread) |
| resource / downtime period notices | Downtime Period Notices / Listing | ServiceNotice | [Reference](https://developers.ampeco.com/reference/getdowntimeperiodnotices) |
| resource / downtime period notices | Downtime Period Notices / Create | ServiceNotice | [Reference](https://developers.ampeco.com/reference/postdowntimeperiodnotice) |
| resource / downtime period notices | Downtime Period Notices / Read | ServiceNotice | [Reference](https://developers.ampeco.com/reference/getdowntimeperiodnotice) |
| resource / downtime period notices | Downtime Period Notices / Update | ServiceNotice | [Reference](https://developers.ampeco.com/reference/patchdowntimeperiodnotice) |
| resource / downtime period notices | Downtime Period Notices / Delete | ServiceNotice | [Reference](https://developers.ampeco.com/reference/deletedowntimeperiodnotice) |
| resource / electricity meters | Electricity Meters / Listing | ElectricityMeter, MeterObservation | [Reference](https://developers.ampeco.com/reference/electricitymeterslising) |
| resource / electricity meters | Electricity Meter / Create | ElectricityMeter, MeterObservation | [Reference](https://developers.ampeco.com/reference/electricitymetercreate) |
| resource / electricity meters | Electricity Meter / Read | ElectricityMeter, MeterObservation | [Reference](https://developers.ampeco.com/reference/electricitymeterread) |
| resource / electricity meters | Electricity Meter / Update | ElectricityMeter, MeterObservation | [Reference](https://developers.ampeco.com/reference/electricitymeterupdate) |
| resource / electricity meters | Electricity Meter / Delete | ElectricityMeter, MeterObservation | [Reference](https://developers.ampeco.com/reference/electricitymeterdelete) |
| resource / electricity rates | Electricity rates / Listing | ElectricityPriceSchedule, ElectricityPriceInterval, EnergyMix | [Reference](https://developers.ampeco.com/reference/electricityrateslistingdeprecated) |
| resource / electricity rates | Electricity rate / Create | ElectricityPriceSchedule, ElectricityPriceInterval, EnergyMix | [Reference](https://developers.ampeco.com/reference/electricityratecreatedeprecated) |
| resource / electricity rates | Electricity rate / Read | ElectricityPriceSchedule, ElectricityPriceInterval, EnergyMix | [Reference](https://developers.ampeco.com/reference/electricityratereaddeprecated) |
| resource / electricity rates | Electricity rate / Update | ElectricityPriceSchedule, ElectricityPriceInterval, EnergyMix | [Reference](https://developers.ampeco.com/reference/electricityrateupdatedeprecated) |
| resource / electricity rates | Electricity rate / Delete | ElectricityPriceSchedule, ElectricityPriceInterval, EnergyMix | [Reference](https://developers.ampeco.com/reference/electricityratedeletedeprecated) |
| resource / electricity rates | Electricity rates / Listing | ElectricityPriceSchedule, ElectricityPriceInterval, EnergyMix | [Reference](https://developers.ampeco.com/reference/electricityrateslisting) |
| resource / electricity rates | Electricity rate / Create | ElectricityPriceSchedule, ElectricityPriceInterval, EnergyMix | [Reference](https://developers.ampeco.com/reference/electricityratecreate) |
| resource / electricity rates | Electricity rate / Read | ElectricityPriceSchedule, ElectricityPriceInterval, EnergyMix | [Reference](https://developers.ampeco.com/reference/electricityrateread) |
| resource / electricity rates | Electricity rate / Update | ElectricityPriceSchedule, ElectricityPriceInterval, EnergyMix | [Reference](https://developers.ampeco.com/reference/electricityrateupdate) |
| resource / electricity rates | Electricity rate / Delete | ElectricityPriceSchedule, ElectricityPriceInterval, EnergyMix | [Reference](https://developers.ampeco.com/reference/electricityratedelete) |
| resource / electricity rates | Electricity rate / Energy Mix / Read | EnergyMix, EnergySourceShare | [Reference](https://developers.ampeco.com/reference/electricityrateenergymixread) |
| resource / electricity rates | Electricity rate / Energy Mix / Update | EnergyMix, EnergySourceShare | [Reference](https://developers.ampeco.com/reference/electricityrateenergymixupdate) |
| resource / electricity rates | Electricity rate / Price periods / Listing | ElectricityPriceInterval | [Reference](https://developers.ampeco.com/reference/electricityratepriceperiodslisting) |
| resource / electricity rates | Electricity rate / Price periods / Date / Listing | ElectricityPriceInterval | [Reference](https://developers.ampeco.com/reference/electricityratepriceperiodsdatelisting) |
| resource / electricity rates | Electricity rate / Price periods / Date / Read | ElectricityPriceInterval | [Reference](https://developers.ampeco.com/reference/electricityratepriceperiodsdateread) |
| resource / electricity rates | Electricity rate / Price periods / Date / Create or update | ElectricityPriceInterval | [Reference](https://developers.ampeco.com/reference/electricityratepriceperiodsdatecreateorupdate) |
| resource / electricity rates | Electricity rate / Price periods / Date / Delete | ElectricityPriceInterval | [Reference](https://developers.ampeco.com/reference/electricityratepriceperiodsdatedelete) |
| resource / electricity rates | Electricity rate / Price periods / Week day / Listing | ElectricityPriceInterval | [Reference](https://developers.ampeco.com/reference/electricityratepriceperiodsweekdaylisting) |
| resource / electricity rates | Electricity rate / Price periods / Week day / Read | ElectricityPriceInterval | [Reference](https://developers.ampeco.com/reference/electricityratepriceperiodsweekdayread) |
| resource / electricity rates | Electricity rate / Price periods / Week day / Create or update | ElectricityPriceInterval | [Reference](https://developers.ampeco.com/reference/electricityratepriceperiodsweekdaycreateaorupdate) |
| resource / electricity rates | Electricity rate / Price periods / Week day / Delete | ElectricityPriceInterval | [Reference](https://developers.ampeco.com/reference/electricityratepriceperiodsweekdaydelete) |
| resource / energy coupon templates | Energy coupon templates / Listing | EnergyCouponTemplate | [Reference](https://developers.ampeco.com/reference/energycoupontemplateslisting) |
| resource / energy coupon templates | Energy coupon templates / Create | EnergyCouponTemplate | [Reference](https://developers.ampeco.com/reference/energycoupontemplatecreate) |
| resource / energy coupon templates | Energy coupon template / Read | EnergyCouponTemplate | [Reference](https://developers.ampeco.com/reference/energycoupontemplateread) |
| resource / energy coupon templates | Energy coupon template / Update | EnergyCouponTemplate | [Reference](https://developers.ampeco.com/reference/energycoupontemplateupdate) |
| resource / energy coupons | Energy coupons / Listing | EnergyCoupon, CouponConsumption | [Reference](https://developers.ampeco.com/reference/energycouponslisting) |
| resource / energy coupons | Energy coupon / Create | EnergyCoupon, CouponConsumption | [Reference](https://developers.ampeco.com/reference/energycouponcreate) |
| resource / energy coupons | Energy coupon / Read | EnergyCoupon, CouponConsumption | [Reference](https://developers.ampeco.com/reference/energycouponread) |
| resource / energy coupons | Energy coupon / Session consumption records | CouponConsumption | [Reference](https://developers.ampeco.com/reference/energycouponsessionconsumptionrecords) |
| resource / evse downtime periods | EVSE Downtime Periods / Listing | DowntimePeriod | [Reference](https://developers.ampeco.com/reference/evsedowntimeperiodslisting) |
| resource / evse downtime periods | EVSE Downtime Period / Create | DowntimePeriod | [Reference](https://developers.ampeco.com/reference/evsedowntimeperiodcreate) |
| resource / evse downtime periods | EVSE Downtime Period / Read | DowntimePeriod | [Reference](https://developers.ampeco.com/reference/evsedowntimeperiodread) |
| resource / evse downtime periods | EVSE Downtime Period / Update | DowntimePeriod | [Reference](https://developers.ampeco.com/reference/evsedowntimeperiodupdate) |
| resource / evse downtime periods | EVSE Downtime Period / Delete | DowntimePeriod | [Reference](https://developers.ampeco.com/reference/evsedowntimeperioddelete) |
| resource / evse downtime periods | EVSE Downtime Period / Status Log | DowntimePeriod | [Reference](https://developers.ampeco.com/reference/evsedowntimeperiodstatuslog) |
| resource / evses | EVSEs / Listing | ChargingUnit, Connector | [Reference](https://developers.ampeco.com/reference/evseslistingdeprecated) |
| resource / evses | EVSE / Read | ChargingUnit, Connector | [Reference](https://developers.ampeco.com/reference/evsereaddeprecated) |
| resource / evses | EVSE / Update | ChargingUnit, Connector | [Reference](https://developers.ampeco.com/reference/evseupdatedeprecated) |
| resource / evses | EVSE / Hardware Status Logs / Listing | HardwareStatusObservation | [Reference](https://developers.ampeco.com/reference/listevsehardwarestatuslogs) |
| resource / evses | EVSE / Latest Hardware Status Log | HardwareStatusObservation | [Reference](https://developers.ampeco.com/reference/getevselatesthardwarestatuslog) |
| resource / evses | EVSE / Notes / Listing | Annotation | [Reference](https://developers.ampeco.com/reference/evsenoteslisting) |
| resource / evses | EVSE / Note / Create | Annotation | [Reference](https://developers.ampeco.com/reference/evsenotecreate) |
| resource / evses | EVSE / Note / Read | Annotation | [Reference](https://developers.ampeco.com/reference/evsenoteshow) |
| resource / evses | EVSE / Note / Update | Annotation | [Reference](https://developers.ampeco.com/reference/evsenoteupdate) |
| resource / evses | EVSE / Note / Delete | Annotation | [Reference](https://developers.ampeco.com/reference/evsenotedelete) |
| resource / evses | EVSE / Create | ChargingUnit, Connector | [Reference](https://developers.ampeco.com/reference/evsecreate) |
| resource / evses | EVSEs / Listing | ChargingUnit, Connector | [Reference](https://developers.ampeco.com/reference/evseslisting) |
| resource / evses | EVSE / Update | ChargingUnit, Connector | [Reference](https://developers.ampeco.com/reference/evseupdate) |
| resource / evses | EVSE / Read | ChargingUnit, Connector | [Reference](https://developers.ampeco.com/reference/evseread) |
| resource / evses | EVSE / Delete | ChargingUnit, Connector | [Reference](https://developers.ampeco.com/reference/evsedelete) |
| resource / faqs | FAQs / Listing | HelpArticle | [Reference](https://developers.ampeco.com/reference/faqslisting) |
| resource / faqs | FAQ / Create | HelpArticle | [Reference](https://developers.ampeco.com/reference/faqcreate) |
| resource / faqs | FAQ / Read | HelpArticle | [Reference](https://developers.ampeco.com/reference/faqread) |
| resource / faqs | FAQ / Update | HelpArticle | [Reference](https://developers.ampeco.com/reference/faqupdate) |
| resource / faqs | FAQ / Delete | HelpArticle | [Reference](https://developers.ampeco.com/reference/faqdelete) |
| resource / firmware versions | Firmware Versions / Listing | FirmwareRelease | [Reference](https://developers.ampeco.com/reference/firmwareversionslisting) |
| resource / firmware versions | Firmware Version / Read | FirmwareRelease | [Reference](https://developers.ampeco.com/reference/firmwareversionread) |
| resource / firmware versions | Firmware Version / Attached Models | FirmwareRelease | [Reference](https://developers.ampeco.com/reference/firmwareversionattachedmodels) |
| resource / flexibility activation requests | Flexibility Activation Requests / Listing | FlexibilityActivation, FlexibilityDelivery | [Reference](https://developers.ampeco.com/reference/listflexibilityactivationrequests) |
| resource / flexibility activation requests | Flexibility Activation Requests / Read | FlexibilityActivation, FlexibilityDelivery | [Reference](https://developers.ampeco.com/reference/getflexibilityactivationrequest) |
| resource / flexibility assets | Flexibility Assets / Create | FlexibilityAsset, EnergyForecast | [Reference](https://developers.ampeco.com/reference/createflexibilityasset) |
| resource / flexibility assets | Flexibility Assets / Listing | FlexibilityAsset, EnergyForecast | [Reference](https://developers.ampeco.com/reference/listflexibilityassets) |
| resource / flexibility assets | Flexibility Assets / Update | FlexibilityAsset, EnergyForecast | [Reference](https://developers.ampeco.com/reference/updateflexibilityasset) |
| resource / flexibility assets | Flexibility Assets / Read | FlexibilityAsset, EnergyForecast | [Reference](https://developers.ampeco.com/reference/getflexibilityasset) |
| resource / flexibility assets | Flexibility Assets / Delete | FlexibilityAsset, EnergyForecast | [Reference](https://developers.ampeco.com/reference/deleteflexibilityasset) |
| resource / flexibility assets | Flexibility Assets / Historical Time Series | UsageAggregate | [Reference](https://developers.ampeco.com/reference/gethistoricaltimeseries) |
| resource / flexibility assets | Flexibility Assets / Time Series Forecast | EnergyForecast, ForecastPoint | [Reference](https://developers.ampeco.com/reference/gettimeseriesforecast) |
| resource / id tags | Id Tags / Listing | ChargingCredential, CredentialAssignment | [Reference](https://developers.ampeco.com/reference/idtagslisting) |
| resource / id tags | Id Tag / Create | ChargingCredential, CredentialAssignment | [Reference](https://developers.ampeco.com/reference/idtagcreate) |
| resource / id tags | Id Tag / Read | ChargingCredential, CredentialAssignment | [Reference](https://developers.ampeco.com/reference/idtagread) |
| resource / id tags | Id Tag / Update | ChargingCredential, CredentialAssignment | [Reference](https://developers.ampeco.com/reference/idtagupdate) |
| resource / id tags | Id Tag / Delete | ChargingCredential, CredentialAssignment | [Reference](https://developers.ampeco.com/reference/idtagdelete) |
| resource / id tags | ID tag / Notes / Listing | Annotation | [Reference](https://developers.ampeco.com/reference/idtagnoteslisting) |
| resource / id tags | ID tag / Note / Create | Annotation | [Reference](https://developers.ampeco.com/reference/idtagnotecreate) |
| resource / id tags | ID tag / Note / Read | Annotation | [Reference](https://developers.ampeco.com/reference/idtagnoteread) |
| resource / id tags | ID tag / Note / Update | Annotation | [Reference](https://developers.ampeco.com/reference/idtagnoteupdate) |
| resource / id tags | ID tag / Note / Delete | Annotation | [Reference](https://developers.ampeco.com/reference/idtagnotedelete) |
| resource / installation and maintenance companies | Installation And Maintenance Companies / Listing | LegalEntity, PartyRole | [Reference](https://developers.ampeco.com/reference/getinstallationandmaintenancecompanieslist) |
| resource / installation and maintenance companies | Installation And Maintenance Companies / Create | LegalEntity, PartyRole | [Reference](https://developers.ampeco.com/reference/createinstallationandmaintenancecompany) |
| resource / installation and maintenance companies | Installation And Maintenance Companies / Read | LegalEntity, PartyRole | [Reference](https://developers.ampeco.com/reference/getinstallationandmaintenancecompany) |
| resource / installation and maintenance companies | Installation And Maintenance Companies / Update | LegalEntity, PartyRole | [Reference](https://developers.ampeco.com/reference/updateinstallationandmaintenancecompany) |
| resource / installation and maintenance companies | Installation And Maintenance Companies / Delete | LegalEntity, PartyRole | [Reference](https://developers.ampeco.com/reference/deleteinstallationandmaintenancecompany) |
| resource / installer jobs | InstallerJobs / Listing | InstallationJob | [Reference](https://developers.ampeco.com/reference/getinstallerjobslist) |
| resource / installer jobs | Installer Jobs / Create | InstallationJob | [Reference](https://developers.ampeco.com/reference/createinstallerjob) |
| resource / installer jobs | Installer Jobs / Read | InstallationJob | [Reference](https://developers.ampeco.com/reference/getinstallerjob) |
| resource / installer jobs | Installer Jobs / Update | InstallationJob | [Reference](https://developers.ampeco.com/reference/updateinstallerjob) |
| resource / installer jobs | Installer Jobs / Delete | InstallationJob | [Reference](https://developers.ampeco.com/reference/deleteinstallerjob) |
| resource / invoices | Invoices / Listing | Invoice, InvoiceLine, FiscalizationAttempt | [Reference](https://developers.ampeco.com/reference/invoiceslisting) |
| resource / invoices | Invoice / Read | Invoice, InvoiceLine, FiscalizationAttempt | [Reference](https://developers.ampeco.com/reference/invoiceread) |
| resource / invoices | Invoice fiscalization attempts / Listing | FiscalizationAttempt, EvidenceDocument | [Reference](https://developers.ampeco.com/reference/invoicefiscalizationattemptslisting) |
| resource / invoices | Invoice fiscalization document / Download | FiscalizationAttempt, EvidenceDocument | [Reference](https://developers.ampeco.com/reference/invoicefiscalizationdocumentdownload) |
| resource / issues | Issues / Listing | Issue, RecoveryAttempt | [Reference](https://developers.ampeco.com/reference/issueslisting) |
| resource / issues | Issues / Create | Issue, RecoveryAttempt | [Reference](https://developers.ampeco.com/reference/issuescreate) |
| resource / issues | Issue / Read | Issue, RecoveryAttempt | [Reference](https://developers.ampeco.com/reference/issueread) |
| resource / issues | Issue / Update | Issue, RecoveryAttempt | [Reference](https://developers.ampeco.com/reference/issueupdate) |
| resource / issues | Issue / Delete | Issue, RecoveryAttempt | [Reference](https://developers.ampeco.com/reference/issuedelete) |
| resource / locations | Locations / Listing | ChargingSite, PublicListing, ChargingArea | [Reference](https://developers.ampeco.com/reference/locationslistingdeprecated) |
| resource / locations | Location / Create | ChargingSite, PublicListing, ChargingArea | [Reference](https://developers.ampeco.com/reference/locationcreatedeprecated) |
| resource / locations | Location / Read | ChargingSite, PublicListing, ChargingArea | [Reference](https://developers.ampeco.com/reference/locationreaddeprecated) |
| resource / locations | Location / Update | ChargingSite, PublicListing, ChargingArea | [Reference](https://developers.ampeco.com/reference/locationupdatedeprecated) |
| resource / locations | Location / Delete | ChargingSite, PublicListing, ChargingArea | [Reference](https://developers.ampeco.com/reference/locationdeletedeprecated) |
| resource / locations | Location / Create | ChargingSite, PublicListing, ChargingArea | [Reference](https://developers.ampeco.com/reference/locationcreate) |
| resource / locations | Locations / Listing | ChargingSite, PublicListing, ChargingArea | [Reference](https://developers.ampeco.com/reference/locationslisting) |
| resource / locations | Location / Update | ChargingSite, PublicListing, ChargingArea | [Reference](https://developers.ampeco.com/reference/locationupdate) |
| resource / locations | Location / Read | ChargingSite, PublicListing, ChargingArea | [Reference](https://developers.ampeco.com/reference/locationread) |
| resource / locations | Location / Delete | ChargingSite, PublicListing, ChargingArea | [Reference](https://developers.ampeco.com/reference/locationdelete) |
| resource / locations | Location / Charging Zones / Listing | ChargingArea | [Reference](https://developers.ampeco.com/reference/locationchargingzoneslisting) |
| resource / locations | Location / Charging Zone / Create | ChargingArea | [Reference](https://developers.ampeco.com/reference/locationchargingzonecreate) |
| resource / locations | Location / Charging Zone / Read | ChargingArea | [Reference](https://developers.ampeco.com/reference/locationchargingzoneread) |
| resource / locations | Location / Charging Zones / Update | ChargingArea | [Reference](https://developers.ampeco.com/reference/locationchargingzoneupdate) |
| resource / locations | Location / Charging Zone / Delete | ChargingArea | [Reference](https://developers.ampeco.com/reference/locationchargingzonedelete) |
| resource / locations | Location / Notes / Listing | Annotation | [Reference](https://developers.ampeco.com/reference/locationnoteslisting) |
| resource / locations | Location / Note / Create | Annotation | [Reference](https://developers.ampeco.com/reference/locationnotecreate) |
| resource / locations | Location / Note / Read | Annotation | [Reference](https://developers.ampeco.com/reference/locationnoteshow) |
| resource / locations | Location / Note / Update | Annotation | [Reference](https://developers.ampeco.com/reference/locationnoteupdate) |
| resource / locations | Location / Note / Delete | Annotation | [Reference](https://developers.ampeco.com/reference/locationnotedelete) |
| resource / ocpi commands | OCPI commands / Listing | RoamingCommand | [Reference](https://developers.ampeco.com/reference/ocpicommandslisting) |
| resource / ocpi commands | OCPI command / Read | RoamingCommand | [Reference](https://developers.ampeco.com/reference/ocpicommandread) |
| resource / operators | Operators / Listing | OperatorService | [Reference](https://developers.ampeco.com/reference/operatorslisting) |
| resource / operators | Operator / Read | OperatorService | [Reference](https://developers.ampeco.com/reference/operatorread) |
| resource / parking spaces | Parking Space / Create | ParkingSpace | [Reference](https://developers.ampeco.com/reference/createparkingspace) |
| resource / parking spaces | Parking Space / Listing | ParkingSpace | [Reference](https://developers.ampeco.com/reference/listparkingspace) |
| resource / parking spaces | Parking Space / Update | ParkingSpace | [Reference](https://developers.ampeco.com/reference/updateparkingspace) |
| resource / parking spaces | Parking Space / Update | ParkingSpace | [Reference](https://developers.ampeco.com/reference/parkingspaceupdate) |
| resource / parking spaces | Parking Space / Read | ParkingSpace | [Reference](https://developers.ampeco.com/reference/getparkingspace) |
| resource / parking spaces | Parking Space / Delete | ParkingSpace | [Reference](https://developers.ampeco.com/reference/deleteparkingspace) |
| resource / parking spaces | Parking Space / EVSEs / Listing | ParkingSpace | [Reference](https://developers.ampeco.com/reference/parkingspacesevseslisting) |
| resource / parking spaces | Parking Space / EVSEs / Update | ParkingSpace | [Reference](https://developers.ampeco.com/reference/parkingspacesevsessync) |
| resource / partner contracts | Partner Contracts / Listing | ServiceAgreement, RevenueShareRule, CostAllocationRule, SettlementOverride | [Reference](https://developers.ampeco.com/reference/partnercontractslisting) |
| resource / partner contracts | Partner Contract / Create | ServiceAgreement, RevenueShareRule, CostAllocationRule, SettlementOverride | [Reference](https://developers.ampeco.com/reference/partnercontractcreate) |
| resource / partner contracts | Partner Contract / Read | ServiceAgreement, RevenueShareRule, CostAllocationRule, SettlementOverride | [Reference](https://developers.ampeco.com/reference/partnercontractread) |
| resource / partner contracts | Partner Contract / Update | ServiceAgreement, RevenueShareRule, CostAllocationRule, SettlementOverride | [Reference](https://developers.ampeco.com/reference/partnercontractupdate) |
| resource / partner contracts | Partner Contract / Patch | ServiceAgreement, RevenueShareRule, CostAllocationRule, SettlementOverride | [Reference](https://developers.ampeco.com/reference/partnercontractpatch) |
| resource / partner contracts | Partner Contract / Delete | ServiceAgreement, RevenueShareRule, CostAllocationRule, SettlementOverride | [Reference](https://developers.ampeco.com/reference/partnercontractdelete) |
| resource / partner contracts | Partner contract / Settlement overrides / Listing | SettlementOverride | [Reference](https://developers.ampeco.com/reference/partnercontractsettlementoverrideslisting) |
| resource / partner contracts | Partner contract / Settlement override / Create | SettlementOverride | [Reference](https://developers.ampeco.com/reference/partnercontractsettlementoverridecreate) |
| resource / partner contracts | Partner contract / Settlement override / Read | SettlementOverride | [Reference](https://developers.ampeco.com/reference/partnercontractsettlementoverrideread) |
| resource / partner contracts | Partner contract / Settlement override / Update | SettlementOverride | [Reference](https://developers.ampeco.com/reference/partnercontractsettlementoverrideupdate) |
| resource / partner contracts | Partner contract / Settlement override / Delete | SettlementOverride | [Reference](https://developers.ampeco.com/reference/partnercontractsettlementoverridedelete) |
| resource / partner invite access policies | Partner invite access policies / listing | SiteAccessPolicy | [Reference](https://developers.ampeco.com/reference/partnerinviteaccesspolicieslisting) |
| resource / partner invite access policies | Partner invite access policy / create | SiteAccessPolicy | [Reference](https://developers.ampeco.com/reference/partnerinviteaccesspolicycreate) |
| resource / partner invite access policies | Partner invite access policy / read | SiteAccessPolicy | [Reference](https://developers.ampeco.com/reference/partnerinviteaccesspolicyread) |
| resource / partner invite access policies | Partner invite access policy / update | SiteAccessPolicy | [Reference](https://developers.ampeco.com/reference/partnerinviteaccesspolicyupdate) |
| resource / partner invite access policies | Partner invite access policy / delete | SiteAccessPolicy | [Reference](https://developers.ampeco.com/reference/partnerinviteaccesspolicydelete) |
| resource / partner invite corporate billing policies | Partner invite corporate billing policies / Listing | CorporateBillingPolicy, CorporateChargerRule | [Reference](https://developers.ampeco.com/reference/partnerinvitecorporatebillingpolicieslisting) |
| resource / partner invite corporate billing policies | Partner invite corporate billing policy / Create | CorporateBillingPolicy, CorporateChargerRule | [Reference](https://developers.ampeco.com/reference/partnerinvitecorporatebillingpolicycreate) |
| resource / partner invite corporate billing policies | Partner invite corporate billing policy / Read | CorporateBillingPolicy, CorporateChargerRule | [Reference](https://developers.ampeco.com/reference/partnerinvitecorporatebillingpolicyread) |
| resource / partner invite corporate billing policies | Partner invite corporate billing policy / Update | CorporateBillingPolicy, CorporateChargerRule | [Reference](https://developers.ampeco.com/reference/partnerinvitecorporatebillingpolicyupdate) |
| resource / partner invite corporate billing policies | Partner invite corporate billing policy / Delete | CorporateBillingPolicy, CorporateChargerRule | [Reference](https://developers.ampeco.com/reference/partnerinvitecorporatebillingpolicydelete) |
| resource / partner invite corporate billing policy snapshots | Partner invite corporate billing policy snapshot / Read | CorporateBillingSnapshot | [Reference](https://developers.ampeco.com/reference/partnerinvitecorporatebillingpolicysnapshotread) |
| resource / partner invites | Partner Invites / Listing | PartnerInvitation | [Reference](https://developers.ampeco.com/reference/partnerinviteslisting) |
| resource / partner invites | Partner Invite / Create | PartnerInvitation | [Reference](https://developers.ampeco.com/reference/partnerinvitecreate) |
| resource / partner invites | Partner Invite / Read | PartnerInvitation | [Reference](https://developers.ampeco.com/reference/partnerinviteread) |
| resource / partner invites | Partner Invite / Update | PartnerInvitation | [Reference](https://developers.ampeco.com/reference/partnerinviteupdate) |
| resource / partner invites | Partner Invite / Delete | PartnerInvitation | [Reference](https://developers.ampeco.com/reference/partnerinvitedelete) |
| resource / partner invites | Partner invites / Listing | PartnerInvitation | [Reference](https://developers.ampeco.com/reference/partnerinviteslistingv2_0) |
| resource / partner invites | Partner invite / Create | PartnerInvitation | [Reference](https://developers.ampeco.com/reference/partnerinvitecreatev2_0) |
| resource / partner invites | Partner invite / Read | PartnerInvitation | [Reference](https://developers.ampeco.com/reference/partnerinvitereadv2_0) |
| resource / partner invites | Partner invite / Update | PartnerInvitation | [Reference](https://developers.ampeco.com/reference/partnerinviteupdatev2_0) |
| resource / partner invites | Partner invite / Delete | PartnerInvitation | [Reference](https://developers.ampeco.com/reference/partnerinvitedeletev2_0) |
| resource / partner invoices | Partner Invoices / Listing | Invoice, CreditNote | [Reference](https://developers.ampeco.com/reference/partnerinvoiceslisting) |
| resource / partner invoices | Partner Invoice / Read | Invoice, CreditNote | [Reference](https://developers.ampeco.com/reference/partnerinvoiceread) |
| resource / partner settlement reports | Partner Settlement Reports / Listing | SettlementBatch, SettlementItem | [Reference](https://developers.ampeco.com/reference/partnersettlementreportslisting) |
| resource / partner settlement reports | Partner Settlement Report / Read | SettlementBatch, SettlementItem | [Reference](https://developers.ampeco.com/reference/partnersettlementreportread) |
| resource / partner settlement reports | Partner Settlement Report / Partner Settlement Records / Listing | SettlementItem | [Reference](https://developers.ampeco.com/reference/partnersettlementreportpartnersettlementrecordslisting) |
| resource / partner settlement reports | Partner Settlement Report / Partner Settlement Record / Create | SettlementItem | [Reference](https://developers.ampeco.com/reference/partnersettlementreportpartnersettlementrecordcreate) |
| resource / partner settlement reports | Partner Settlement Report / Partner Settlement Record / Read | SettlementItem | [Reference](https://developers.ampeco.com/reference/partnertsettlementreportpartnersettlementrecordread) |
| resource / partner settlement reports | Partner Settlement Report / Partner Settlement Record / Update | SettlementItem | [Reference](https://developers.ampeco.com/reference/partnersettlementreportpartnersettlementrecordupdate) |
| resource / partner settlement reports | Partner Settlement Report / Partner Settlement Record / Delete | SettlementItem | [Reference](https://developers.ampeco.com/reference/partnersettlementreportpartnersettlementrecorddelete) |
| resource / partners | Partners / Listing | LegalEntity, PartyRole, ServiceAgreement | [Reference](https://developers.ampeco.com/reference/partnerslistingdeprecated) |
| resource / partners | Partner / Create | LegalEntity, PartyRole, ServiceAgreement | [Reference](https://developers.ampeco.com/reference/partnercreatedeprecated) |
| resource / partners | Partner / Read | LegalEntity, PartyRole, ServiceAgreement | [Reference](https://developers.ampeco.com/reference/partnerreaddeprecated) |
| resource / partners | Partner / Update | LegalEntity, PartyRole, ServiceAgreement | [Reference](https://developers.ampeco.com/reference/partnerupdatedeprecated) |
| resource / partners | Partner / Delete | LegalEntity, PartyRole, ServiceAgreement | [Reference](https://developers.ampeco.com/reference/partnerdeletedeprecated) |
| resource / partners | Partners / Listing | LegalEntity, PartyRole, ServiceAgreement | [Reference](https://developers.ampeco.com/reference/partnerslisting) |
| resource / partners | Partner / Create | LegalEntity, PartyRole, ServiceAgreement | [Reference](https://developers.ampeco.com/reference/partnercreate) |
| resource / partners | Partner / Read | LegalEntity, PartyRole, ServiceAgreement | [Reference](https://developers.ampeco.com/reference/partnerread) |
| resource / partners | Partner / Update | LegalEntity, PartyRole, ServiceAgreement | [Reference](https://developers.ampeco.com/reference/partnerupdate) |
| resource / partners | Partner / Delete | LegalEntity, PartyRole, ServiceAgreement | [Reference](https://developers.ampeco.com/reference/partnerdelete) |
| resource / partners | Partner / Admins / Listing | Principal, AccessGrant | [Reference](https://developers.ampeco.com/reference/partneradminslisting) |
| resource / partners | Partner / Admin / Create | Principal, AccessGrant | [Reference](https://developers.ampeco.com/reference/partneradmincreate) |
| resource / partners | Partner / Admin / Update | Principal, AccessGrant | [Reference](https://developers.ampeco.com/reference/partneradminupdate) |
| resource / partners | Partner / Admin / Delete | Principal, AccessGrant | [Reference](https://developers.ampeco.com/reference/partneradmindelete) |
| resource / partners | Partner / Notes / Listing | Annotation | [Reference](https://developers.ampeco.com/reference/partnernoteslisting) |
| resource / partners | Partner / Note / Create | Annotation | [Reference](https://developers.ampeco.com/reference/partnernotecreate) |
| resource / partners | Partner / Note / Read | Annotation | [Reference](https://developers.ampeco.com/reference/partnernoteshow) |
| resource / partners | Partner / Note / Update | Annotation | [Reference](https://developers.ampeco.com/reference/partnernoteupdate) |
| resource / partners | Partner / Note / Delete | Annotation | [Reference](https://developers.ampeco.com/reference/partnernotedelete) |
| resource / payment terminals | Payment Terminals / Listing | PaymentTerminal | [Reference](https://developers.ampeco.com/reference/getpaymentterminalsdeprecated) |
| resource / payment terminals | Payment Terminals / Create | PaymentTerminal | [Reference](https://developers.ampeco.com/reference/createpaymentterminaldeprecated) |
| resource / payment terminals | Payment Terminals / Read | PaymentTerminal | [Reference](https://developers.ampeco.com/reference/getpaymentterminaldeprecated) |
| resource / payment terminals | Payment Terminals / Update | PaymentTerminal | [Reference](https://developers.ampeco.com/reference/updatepaymentterminaldeprecated) |
| resource / payment terminals | Payment Terminals / Delete | PaymentTerminal | [Reference](https://developers.ampeco.com/reference/deletepaymentterminaldeprecated) |
| resource / payment terminals | Payment Terminals / Listing | PaymentTerminal | [Reference](https://developers.ampeco.com/reference/getpaymentterminalsv1_1) |
| resource / payment terminals | Payment Terminals / Create | PaymentTerminal | [Reference](https://developers.ampeco.com/reference/createpaymentterminalv1_1) |
| resource / payment terminals | Payment Terminals / Read | PaymentTerminal | [Reference](https://developers.ampeco.com/reference/getpaymentterminalv1_1) |
| resource / payment terminals | Payment Terminals / Update | PaymentTerminal | [Reference](https://developers.ampeco.com/reference/updatepaymentterminalv1_1) |
| resource / payment terminals | Payment Terminals / Delete | PaymentTerminal | [Reference](https://developers.ampeco.com/reference/deletepaymentterminalv1_1) |
| resource / provisioning certificate | Provisioning Certificate / Create | ProvisioningCertificate, PlugAndChargeEnrollment | [Reference](https://developers.ampeco.com/reference/createpcid) |
| resource / provisioning certificate | Provisioning Certificate / Listing | ProvisioningCertificate, PlugAndChargeEnrollment | [Reference](https://developers.ampeco.com/reference/listpcids) |
| resource / provisioning certificate | Provisioning Certificate / Update | ProvisioningCertificate, PlugAndChargeEnrollment | [Reference](https://developers.ampeco.com/reference/updatepcid) |
| resource / provisioning certificate | Provisioning Certificate / Read | ProvisioningCertificate, PlugAndChargeEnrollment | [Reference](https://developers.ampeco.com/reference/getpcid) |
| resource / provisioning certificate | Provisioning Certificates / Delete | ProvisioningCertificate, PlugAndChargeEnrollment | [Reference](https://developers.ampeco.com/reference/deletepcid) |
| resource / receipts | Receipts / Listing | Receipt | [Reference](https://developers.ampeco.com/reference/receiptslisting) |
| resource / receipts | Receipt / Read | Receipt | [Reference](https://developers.ampeco.com/reference/receiptread) |
| resource / reimbursement policies | Reimbursement policies / Listing | ReimbursementPolicy | [Reference](https://developers.ampeco.com/reference/reimbursementpolicieslisting) |
| resource / reimbursement policies | Reimbursement policy / Create | ReimbursementPolicy | [Reference](https://developers.ampeco.com/reference/reimbursementpolicycreate) |
| resource / reimbursement policies | Reimbursement policy / Read | ReimbursementPolicy | [Reference](https://developers.ampeco.com/reference/reimbursementpolicyread) |
| resource / reimbursement policies | Reimbursement policy / Update | ReimbursementPolicy | [Reference](https://developers.ampeco.com/reference/reimbursementpolicyupdate) |
| resource / reimbursement policies | Reimbursement policy / Delete | ReimbursementPolicy | [Reference](https://developers.ampeco.com/reference/reimbursementpolicydelete) |
| resource / reimbursement records | Reimbursement records / Listing | ReimbursementRecord | [Reference](https://developers.ampeco.com/reference/reimbursementrecordslisting) |
| resource / reimbursement records | Reimbursement record / Read | ReimbursementRecord | [Reference](https://developers.ampeco.com/reference/reimbursementrecordread) |
| resource / reimbursement reports | Reimbursement reports / Listing | ReimbursementReport | [Reference](https://developers.ampeco.com/reference/reimbursementreportslisting) |
| resource / reimbursement reports | Reimbursement report / Read | ReimbursementReport | [Reference](https://developers.ampeco.com/reference/reimbursementreportread) |
| resource / reservations | Reservations / Listing | Reservation | [Reference](https://developers.ampeco.com/reference/reservationslisting) |
| resource / reservations | Reservation / Read | Reservation | [Reference](https://developers.ampeco.com/reference/reservationread) |
| resource / revenues & expenses | Expenses / Listing | RatedLine, SettlementItem, LedgerAccount, JournalLine | [Reference](https://developers.ampeco.com/reference/expenseslistingdeprecated) |
| resource / revenues & expenses | Expenses / Listing | RatedLine, SettlementItem, LedgerAccount, JournalLine | [Reference](https://developers.ampeco.com/reference/expenseslisting) |
| resource / revenues & expenses | Expenses / Listing | RatedLine, SettlementItem, LedgerAccount, JournalLine | [Reference](https://developers.ampeco.com/reference/expensesv1_2listing) |
| resource / revenues & expenses | Revenues / Listing | RatedLine, SettlementItem, LedgerAccount, JournalLine | [Reference](https://developers.ampeco.com/reference/revenueslistingdeprecated) |
| resource / revenues & expenses | Revenues / Listing | RatedLine, SettlementItem, LedgerAccount, JournalLine | [Reference](https://developers.ampeco.com/reference/revenueslisting) |
| resource / revenues & expenses | Revenues / Listing | RatedLine, SettlementItem, LedgerAccount, JournalLine | [Reference](https://developers.ampeco.com/reference/revenuesv1_2listing) |
| resource / rfids | RFID Tags / Listing | ChargingCredential | [Reference](https://developers.ampeco.com/reference/rfidtagslistingdeprecated) |
| resource / rfids | RFID Tag / Create | ChargingCredential | [Reference](https://developers.ampeco.com/reference/rfidtagcreatedeprecated) |
| resource / rfids | RFID Tag / Read | ChargingCredential | [Reference](https://developers.ampeco.com/reference/rfidtagreaddeprecated) |
| resource / rfids | RFID Tag / Update | ChargingCredential | [Reference](https://developers.ampeco.com/reference/rfidtagupdatedeprecated) |
| resource / rfids | RFID Tag / Delete | ChargingCredential | [Reference](https://developers.ampeco.com/reference/rfidtagdeletedeprecated) |
| resource / roaming connections | Roaming Connections / Listing | RoamingConnection, RoamingModuleAgreement | [Reference](https://developers.ampeco.com/reference/listroamingconnections) |
| resource / roaming connections | Roaming Connections / Read | RoamingConnection, RoamingModuleAgreement | [Reference](https://developers.ampeco.com/reference/getroamingconnection) |
| resource / roaming cpos | Roaming CPOs / Listing | RoamingParty | [Reference](https://developers.ampeco.com/reference/roamingcposlisting) |
| resource / roaming cpos | Roaming CPO / Read | RoamingParty | [Reference](https://developers.ampeco.com/reference/roamingcporead) |
| resource / roaming cpos | Roaming CPO / Update | RoamingParty | [Reference](https://developers.ampeco.com/reference/roamingcpoupdate) |
| resource / roaming emsps | Roaming EMSPs / Listing | RoamingParty | [Reference](https://developers.ampeco.com/reference/roamingemspslisting) |
| resource / roaming emsps | Roaming EMSP / Create | RoamingParty | [Reference](https://developers.ampeco.com/reference/roamingemspcreate) |
| resource / roaming emsps | Roaming EMSP / Read | RoamingParty | [Reference](https://developers.ampeco.com/reference/roamingemspread) |
| resource / roaming emsps | Roaming EMSP / Update | RoamingParty | [Reference](https://developers.ampeco.com/reference/roamingemspupdate) |
| resource / roaming emsps | Roaming EMSP / Delete | RoamingParty | [Reference](https://developers.ampeco.com/reference/roamingemspdelete) |
| resource / roaming emsps | Roaming EMSP Partners / Listing | RoamingParty | [Reference](https://developers.ampeco.com/reference/roamingemsppartnerslisting) |
| resource / roaming operators | Roaming Operators / Listing | RoamingParty, RoamingTariffFilter | [Reference](https://developers.ampeco.com/reference/roamingoperatorslisting) |
| resource / roaming operators | Roaming Operator / Read | RoamingParty, RoamingTariffFilter | [Reference](https://developers.ampeco.com/reference/roamingoperatorread) |
| resource / roaming operators | Roaming Operator / Update | RoamingParty, RoamingTariffFilter | [Reference](https://developers.ampeco.com/reference/roamingoperatorupdate) |
| resource / roaming operators | Roaming Operators / Custom Tariff Filters / Listing | RoamingTariffFilter | [Reference](https://developers.ampeco.com/reference/listroamingcustomtarifffilters) |
| resource / roaming operators | Roaming Operators / Custom Tariff Filters / Create | RoamingTariffFilter | [Reference](https://developers.ampeco.com/reference/createroamingcustomtarifffilter) |
| resource / roaming operators | Roaming Operators / Custom Tariff Filters / Reorder | RoamingTariffFilter | [Reference](https://developers.ampeco.com/reference/reorderroamingcustomtarifffilters) |
| resource / roaming operators | Roaming Operators / Custom Tariff Filters / Read | RoamingTariffFilter | [Reference](https://developers.ampeco.com/reference/getroamingcustomtarifffilter) |
| resource / roaming operators | Roaming Operators / Custom Tariff Filters / Update | RoamingTariffFilter | [Reference](https://developers.ampeco.com/reference/updateroamingcustomtarifffilter) |
| resource / roaming operators | Roaming Operators / Custom Tariff Filters / Delete | RoamingTariffFilter | [Reference](https://developers.ampeco.com/reference/deleteroamingcustomtarifffilter) |
| resource / roaming platforms | Roaming Platforms / Listing | RoamingNetwork | [Reference](https://developers.ampeco.com/reference/roamingplatformslistingdeprecated) |
| resource / roaming platforms | Roaming Platform / Read | RoamingNetwork | [Reference](https://developers.ampeco.com/reference/roamingplatformreaddeprecated) |
| resource / roaming providers | Roaming Providers / Listing | LegalEntity, RoamingNetwork | [Reference](https://developers.ampeco.com/reference/roamingproviderslisting) |
| resource / roaming providers | Roaming Provider / Create | LegalEntity, RoamingNetwork | [Reference](https://developers.ampeco.com/reference/roamingprovidercreate) |
| resource / roaming providers | Roaming Provider / Read | LegalEntity, RoamingNetwork | [Reference](https://developers.ampeco.com/reference/roamingproviderread) |
| resource / roaming providers | Roaming Provider / Update | LegalEntity, RoamingNetwork | [Reference](https://developers.ampeco.com/reference/roamingproviderupdate) |
| resource / roaming providers | Roaming Provider / Delete | LegalEntity, RoamingNetwork | [Reference](https://developers.ampeco.com/reference/roamingproviderdelete) |
| resource / roaming tariffs | Roaming Tariffs / Listing | TariffVersion, RoamingTariffMapping | [Reference](https://developers.ampeco.com/reference/roamingtariffslisting) |
| resource / roaming tariffs | Roaming Tariff / Read | TariffVersion, RoamingTariffMapping | [Reference](https://developers.ampeco.com/reference/roamingtariffread) |
| resource / roaming tariffs | Roaming Tariff / Update | TariffVersion, RoamingTariffMapping | [Reference](https://developers.ampeco.com/reference/roamingtariffupdate) |
| resource / security event logs | Security Events Logs / Listing | SecurityEvent | [Reference](https://developers.ampeco.com/reference/securityeventlogslistingdeprecated) |
| resource / security event logs | Security Event Log / Read | SecurityEvent | [Reference](https://developers.ampeco.com/reference/securityeventlogreaddeprecated) |
| resource / security events | Security Events / Listing | SecurityEvent | [Reference](https://developers.ampeco.com/reference/securityeventslisting) |
| resource / security events | Security Event / Read | SecurityEvent | [Reference](https://developers.ampeco.com/reference/securityeventread) |
| resource / sessions | Sessions / Listing | ChargingSession, ChargingInterval, SessionEvent, UsageAggregate | [Reference](https://developers.ampeco.com/reference/sessionslisting) |
| resource / sessions | Session / Read | ChargingSession, ChargingInterval, SessionEvent, UsageAggregate | [Reference](https://developers.ampeco.com/reference/sessionread) |
| resource / sessions | Sessions / Consumption Stats / Read | UsageAggregate | [Reference](https://developers.ampeco.com/reference/sessionsconsumptionstatsread) |
| resource / sessions | Session / Energy coupon session consumptions | CouponConsumption | [Reference](https://developers.ampeco.com/reference/energycouponsessionconsumptionslisting) |
| resource / sessions | Sessions / Timeline Snapshot / Read | SessionEvent | [Reference](https://developers.ampeco.com/reference/sessiontimelinesnapshotread) |
| resource / settings | Settings / Listing | PlatformSetting | [Reference](https://developers.ampeco.com/reference/settingslisting) |
| resource / sharing invites | Sharing invites / Listing | SharingInvitation | [Reference](https://developers.ampeco.com/reference/sharinginviteslisting) |
| resource / sharing invites | Sharing invite / Read | SharingInvitation | [Reference](https://developers.ampeco.com/reference/sharinginviteread) |
| resource / sub operators | Sub operators / Listing | OperatorService, ManagementDelegation | [Reference](https://developers.ampeco.com/reference/suboperatorslistingdeprecated) |
| resource / sub operators | Sub operator / Read | OperatorService, ManagementDelegation | [Reference](https://developers.ampeco.com/reference/suboperatorreaddeprecated) |
| resource / sub operators | Sub-operators / Listing | OperatorService, ManagementDelegation | [Reference](https://developers.ampeco.com/reference/suboperatorslisting) |
| resource / sub operators | Sub-operators / Create | OperatorService, ManagementDelegation | [Reference](https://developers.ampeco.com/reference/suboperatorcreate) |
| resource / sub operators | Sub-operators / Read | OperatorService, ManagementDelegation | [Reference](https://developers.ampeco.com/reference/suboperatorread) |
| resource / sub operators | Sub-operators / Update | OperatorService, ManagementDelegation | [Reference](https://developers.ampeco.com/reference/suboperatorupdate) |
| resource / sub operators | Sub-operators / Delete | OperatorService, ManagementDelegation | [Reference](https://developers.ampeco.com/reference/suboperatordelete) |
| resource / sub operators | Sub Operator / Notes / Listing | Annotation | [Reference](https://developers.ampeco.com/reference/suboperatornoteslisting) |
| resource / sub operators | Sub Operator / Note / Create | Annotation | [Reference](https://developers.ampeco.com/reference/suboperatornotecreate) |
| resource / sub operators | Sub Operator / Note / Read | Annotation | [Reference](https://developers.ampeco.com/reference/suboperatornoteshow) |
| resource / sub operators | Sub Operator / Note / Update | Annotation | [Reference](https://developers.ampeco.com/reference/suboperatornoteupdate) |
| resource / sub operators | Sub Operator / Note / Delete | Annotation | [Reference](https://developers.ampeco.com/reference/suboperatornotedelete) |
| resource / subscription-plans | Subscription Plans / Listing | SubscriptionPlan, BenefitAllowance | [Reference](https://developers.ampeco.com/reference/subscriptionplanslistingdeprecated) |
| resource / subscription-plans | Subscription plans / Listing | SubscriptionPlan, BenefitAllowance | [Reference](https://developers.ampeco.com/reference/subscriptionplanslisting) |
| resource / subscription-plans | Subscription plan / Create | SubscriptionPlan, BenefitAllowance | [Reference](https://developers.ampeco.com/reference/subscriptionplancreate) |
| resource / subscription-plans | Subscription plan / Read | SubscriptionPlan, BenefitAllowance | [Reference](https://developers.ampeco.com/reference/subscriptionplanread) |
| resource / subscription-plans | Subscription plan / Update | SubscriptionPlan, BenefitAllowance | [Reference](https://developers.ampeco.com/reference/subscriptionplanupdate) |
| resource / subscription-plans | Subscription plan / Delete | SubscriptionPlan, BenefitAllowance | [Reference](https://developers.ampeco.com/reference/subscriptionplandelete) |
| resource / subscriptions | Subscriptions / Listing | Subscription, BillingPeriod | [Reference](https://developers.ampeco.com/reference/subscriptionslisting) |
| resource / subscriptions | Subscription / Read | Subscription, BillingPeriod | [Reference](https://developers.ampeco.com/reference/subscriptionread) |
| resource / tariffs | Tariff Groups / Listing | TariffSet, TariffAssignment | [Reference](https://developers.ampeco.com/reference/tariffgroupslisting) |
| resource / tariffs | Tariff Group / Create | TariffSet, TariffAssignment | [Reference](https://developers.ampeco.com/reference/tariffgroupcreate) |
| resource / tariffs | Tariff Group / Read | TariffSet, TariffAssignment | [Reference](https://developers.ampeco.com/reference/tariffgroupread) |
| resource / tariffs | Tariff Group / Update | TariffSet, TariffAssignment | [Reference](https://developers.ampeco.com/reference/tariffgroupupdate) |
| resource / tariffs | Tariff Group / Delete | TariffSet, TariffAssignment | [Reference](https://developers.ampeco.com/reference/tariffgroupdelete) |
| resource / tariffs | Tariff Snapshot / Read | TariffVersion | [Reference](https://developers.ampeco.com/reference/tariffsnapshotread) |
| resource / tariffs | Tariffs / Listing | Tariff, TariffVersion, PriceComponent, PricingCondition, TariffSet, TariffAssignment, ScheduledTariffChange | [Reference](https://developers.ampeco.com/reference/tariffslisting) |
| resource / tariffs | Tariff / Create | Tariff, TariffVersion, PriceComponent, PricingCondition, TariffSet, TariffAssignment, ScheduledTariffChange | [Reference](https://developers.ampeco.com/reference/tariffcreate) |
| resource / tariffs | Tariff / Read | Tariff, TariffVersion, PriceComponent, PricingCondition, TariffSet, TariffAssignment, ScheduledTariffChange | [Reference](https://developers.ampeco.com/reference/tariffread) |
| resource / tariffs | Tariff / Update | Tariff, TariffVersion, PriceComponent, PricingCondition, TariffSet, TariffAssignment, ScheduledTariffChange | [Reference](https://developers.ampeco.com/reference/tariffupdate) |
| resource / tariffs | Tariff / Partial Update | Tariff, TariffVersion, PriceComponent, PricingCondition, TariffSet, TariffAssignment, ScheduledTariffChange | [Reference](https://developers.ampeco.com/reference/tariffpartialupdate) |
| resource / tariffs | Tariff / Delete | Tariff, TariffVersion, PriceComponent, PricingCondition, TariffSet, TariffAssignment, ScheduledTariffChange | [Reference](https://developers.ampeco.com/reference/tariffdelete) |
| resource / tariffs | Tariff / Scheduled Changes / Listing | ScheduledTariffChange | [Reference](https://developers.ampeco.com/reference/tariffscheduledchangeslisting) |
| resource / tariffs | Tariff / Scheduled Change / Create | ScheduledTariffChange | [Reference](https://developers.ampeco.com/reference/tariffscheduledchangecreate) |
| resource / tariffs | Tariff / Scheduled Change / Delete | ScheduledTariffChange | [Reference](https://developers.ampeco.com/reference/tariffscheduledchangedelete) |
| resource / tariffs | Tariff / Scheduled Change / Read | ScheduledTariffChange | [Reference](https://developers.ampeco.com/reference/tariffscheduledchangeread) |
| resource / tariffs | Tariff / Scheduled Change / Update | ScheduledTariffChange | [Reference](https://developers.ampeco.com/reference/tariffscheduledchangeupdate) |
| resource / tax identification numbers | Tax Identification Numbers / Listing | TaxIdentifier | [Reference](https://developers.ampeco.com/reference/taxidentificationnumberslisting) |
| resource / tax identification numbers | Tax Identification Number / Create | TaxIdentifier | [Reference](https://developers.ampeco.com/reference/taxidentificationnumbercreate) |
| resource / tax identification numbers | Tax Identification Number / Read | TaxIdentifier | [Reference](https://developers.ampeco.com/reference/taxidentificationnumberread) |
| resource / tax identification numbers | Tax Identification Number / Update | TaxIdentifier | [Reference](https://developers.ampeco.com/reference/taxidentificationnumberupdate) |
| resource / tax identification numbers | Tax Identification Number / Delete | TaxIdentifier | [Reference](https://developers.ampeco.com/reference/taxidentificationnumberdelete) |
| resource / taxes | Taxes / Listing | TaxRule, TaxDetermination | [Reference](https://developers.ampeco.com/reference/taxeslisting) |
| resource / taxes | Tax / Create | TaxRule, TaxDetermination | [Reference](https://developers.ampeco.com/reference/taxcreate) |
| resource / taxes | Tax / Read | TaxRule, TaxDetermination | [Reference](https://developers.ampeco.com/reference/taxread) |
| resource / taxes | Tax / Update | TaxRule, TaxDetermination | [Reference](https://developers.ampeco.com/reference/taxupdate) |
| resource / taxes | Tax / Delete | TaxRule, TaxDetermination | [Reference](https://developers.ampeco.com/reference/taxdelete) |
| resource / templates | Templates / Listing | ContentTemplate | [Reference](https://developers.ampeco.com/reference/templateslisting) |
| resource / terms and policies | Terms and policies / Listing | PolicyDocument | [Reference](https://developers.ampeco.com/reference/termsandpolicieslisting) |
| resource / terms and policies | Terms and policies / Read | PolicyDocument | [Reference](https://developers.ampeco.com/reference/termsandpoliciesread) |
| resource / top-up packages | Top-Up Packages / Listing | TopUpOffer | [Reference](https://developers.ampeco.com/reference/topuppackageslisting) |
| resource / top-up packages | Top-Up Package / Create | TopUpOffer | [Reference](https://developers.ampeco.com/reference/topuppackagcreate) |
| resource / top-up packages | Top-Up Package / Read | TopUpOffer | [Reference](https://developers.ampeco.com/reference/topuppackageread) |
| resource / top-up packages | Top-Up Package / Update | TopUpOffer | [Reference](https://developers.ampeco.com/reference/topuppackageupdate) |
| resource / top-up packages | Top-Up Package / Delete | TopUpOffer | [Reference](https://developers.ampeco.com/reference/topuppackagedelete) |
| resource / transactions | Transactions / Listing | PaymentIntent, PaymentAuthorization, PaymentCapture | [Reference](https://developers.ampeco.com/reference/transactionslisting) |
| resource / transactions | Transactions / Create | PaymentIntent, PaymentAuthorization, PaymentCapture | [Reference](https://developers.ampeco.com/reference/transactionscreate) |
| resource / transactions | Transaction / Read | PaymentIntent, PaymentAuthorization, PaymentCapture | [Reference](https://developers.ampeco.com/reference/transactionread) |
| resource / transactions | Transaction / Update | PaymentIntent, PaymentAuthorization, PaymentCapture | [Reference](https://developers.ampeco.com/reference/transactionupdate) |
| resource / user-devices | User devices / Listing | UserDevice | [Reference](https://developers.ampeco.com/reference/userdeviceslisting) |
| resource / user-devices | User device / Read | UserDevice | [Reference](https://developers.ampeco.com/reference/userdeviceread) |
| resource / user-groups | User Groups / Listing | CustomerGroup, GroupMembership | [Reference](https://developers.ampeco.com/reference/usergroupslisting) |
| resource / user-groups | User Group / Create | CustomerGroup, GroupMembership | [Reference](https://developers.ampeco.com/reference/usergroupcreate) |
| resource / user-groups | User Group / Read | CustomerGroup, GroupMembership | [Reference](https://developers.ampeco.com/reference/usergroupread) |
| resource / user-groups | User Group / Update | CustomerGroup, GroupMembership | [Reference](https://developers.ampeco.com/reference/usergroupupdate) |
| resource / user-groups | User Group / Replace | CustomerGroup, GroupMembership | [Reference](https://developers.ampeco.com/reference/usergroupreplace) |
| resource / user-groups | User Group / Delete | CustomerGroup, GroupMembership | [Reference](https://developers.ampeco.com/reference/usergroupdelete) |
| resource / users | Users / Listing | CustomerAccount, Person, BillingProfile, PaymentInstrument | [Reference](https://developers.ampeco.com/reference/userslisting) |
| resource / users | User / Create | CustomerAccount, Person, BillingProfile, PaymentInstrument | [Reference](https://developers.ampeco.com/reference/usercreate) |
| resource / users | User / Read | CustomerAccount, Person, BillingProfile, PaymentInstrument | [Reference](https://developers.ampeco.com/reference/userread) |
| resource / users | User / Update | CustomerAccount, Person, BillingProfile, PaymentInstrument | [Reference](https://developers.ampeco.com/reference/userupdate) |
| resource / users | User / Delete | CustomerAccount, Person, BillingProfile, PaymentInstrument | [Reference](https://developers.ampeco.com/reference/userdelete) |
| resource / users | Invoice details / Read | BillingProfile | [Reference](https://developers.ampeco.com/reference/invoicedetailsread) |
| resource / users | Invoice details / Create or update | BillingProfile | [Reference](https://developers.ampeco.com/reference/invoicedetailscreateorupdate) |
| resource / users | Payment Methods / Listing | PaymentInstrument | [Reference](https://developers.ampeco.com/reference/paymentmethodslisting) |
| resource / users | Payment Method / Create | PaymentInstrument | [Reference](https://developers.ampeco.com/reference/paymentmethodcreate) |
| resource / users | Payment Method / Read | PaymentInstrument | [Reference](https://developers.ampeco.com/reference/paymentmethodread) |
| resource / users | Payment Method / Update | PaymentInstrument | [Reference](https://developers.ampeco.com/reference/paymentmethodupdate) |
| resource / users | Payment Method / Delete | PaymentInstrument | [Reference](https://developers.ampeco.com/reference/paymentmethoddelete) |
| resource / users | Subscription billing periods / Listing | BillingPeriod | [Reference](https://developers.ampeco.com/reference/subscriptionbillingperiodslisting) |
| resource / users | Subscription billing period / Read | BillingPeriod | [Reference](https://developers.ampeco.com/reference/subscriptionbillingperiodread) |
| resource / users | Users / Listing | CustomerAccount, Person, BillingProfile, PaymentInstrument | [Reference](https://developers.ampeco.com/reference/userslistingv1_1) |
| resource / users | User / Create | CustomerAccount, Person, BillingProfile, PaymentInstrument | [Reference](https://developers.ampeco.com/reference/usercreatev1_1) |
| resource / users | User / Read | CustomerAccount, Person, BillingProfile, PaymentInstrument | [Reference](https://developers.ampeco.com/reference/userreadv1_1) |
| resource / users | User / Update | CustomerAccount, Person, BillingProfile, PaymentInstrument | [Reference](https://developers.ampeco.com/reference/userupdatev1_1) |
| resource / users | User / Delete | CustomerAccount, Person, BillingProfile, PaymentInstrument | [Reference](https://developers.ampeco.com/reference/userdeletev1_1) |
| resource / users | User / Notes / Listing | Annotation | [Reference](https://developers.ampeco.com/reference/usernoteslisting) |
| resource / users | User / Note / Create | Annotation | [Reference](https://developers.ampeco.com/reference/usernotecreate) |
| resource / users | User / Note / Read | Annotation | [Reference](https://developers.ampeco.com/reference/usernoteshow) |
| resource / users | User / Note / Update | Annotation | [Reference](https://developers.ampeco.com/reference/usernoteupdate) |
| resource / users | User / Note / Delete | Annotation | [Reference](https://developers.ampeco.com/reference/usernotedelete) |
| resource / utilities | Utilities / Listing | LegalEntity, PartyRole | [Reference](https://developers.ampeco.com/reference/listutilities) |
| resource / utilities | Utilities / Create | LegalEntity, PartyRole | [Reference](https://developers.ampeco.com/reference/createutility) |
| resource / utilities | Utilities / Read | LegalEntity, PartyRole | [Reference](https://developers.ampeco.com/reference/getutility) |
| resource / utilities | Utilities / Update | LegalEntity, PartyRole | [Reference](https://developers.ampeco.com/reference/updateutility) |
| resource / utilities | Utilities / Delete | LegalEntity, PartyRole | [Reference](https://developers.ampeco.com/reference/deleteutility) |
| resource / vehicles | Vehicles / Listing | Vehicle, VehicleAssignment, VehicleTelemetry | [Reference](https://developers.ampeco.com/reference/vehicleslisting) |
| resource / vehicles | Vehicle / Create | Vehicle, VehicleAssignment, VehicleTelemetry | [Reference](https://developers.ampeco.com/reference/vehiclecreate) |
| resource / vehicles | Vehicle telemetry readings / listing | VehicleTelemetry | [Reference](https://developers.ampeco.com/reference/vehicletelemetryreadingslisting) |
| resource / vehicles | Vehicle / Read | Vehicle, VehicleAssignment, VehicleTelemetry | [Reference](https://developers.ampeco.com/reference/vehicleread) |
| resource / vehicles | Vehicle / Update | Vehicle, VehicleAssignment, VehicleTelemetry | [Reference](https://developers.ampeco.com/reference/vehicleupdate) |
| resource / vehicles | Vehicle / Delete | Vehicle, VehicleAssignment, VehicleTelemetry | [Reference](https://developers.ampeco.com/reference/vehicledelete) |
| resource / vehicles | Vehicle / Users / Listing | VehicleAssignment | [Reference](https://developers.ampeco.com/reference/vehicleuserslisting) |
| resource / vehicles | Vehicle / Users / Replace | VehicleAssignment | [Reference](https://developers.ampeco.com/reference/vehicleusersreplace) |
| resource / vehicles | Vehicle / Users / Attach | VehicleAssignment | [Reference](https://developers.ampeco.com/reference/vehicleusersattach) |
| resource / vehicles | Vehicle / Users / Detach | VehicleAssignment | [Reference](https://developers.ampeco.com/reference/vehicleusersdetach) |
| resource / vehicles | Vehicle telemetry readings / Listing | VehicleTelemetry | [Reference](https://developers.ampeco.com/reference/vehicletelemetryreadingsbyvehiclelisting) |
| resource / vehicles | Vehicle telemetry reading / Create | VehicleTelemetry | [Reference](https://developers.ampeco.com/reference/vehicletelemetryreadingcreate) |
| resource / vehicles | Vehicle telemetry reading / Delete | VehicleTelemetry | [Reference](https://developers.ampeco.com/reference/vehicletelemetryreadingdelete) |
| resource / vendor error codes | Vendor Error Codes / Listing | VendorFaultDefinition | [Reference](https://developers.ampeco.com/reference/vendorerrorcodeslisting) |
| resource / vendor error codes | Vendor Error Code / Create | VendorFaultDefinition | [Reference](https://developers.ampeco.com/reference/vendorerrorcodecreate) |
| resource / vendor error codes | Vendor Error Code / Read | VendorFaultDefinition | [Reference](https://developers.ampeco.com/reference/vendorerrorcoderead) |
| resource / vendor error codes | Vendor Error Code / Update | VendorFaultDefinition | [Reference](https://developers.ampeco.com/reference/vendorerrorcodeupdate) |
| resource / vendor error codes | Vendor Error Code / Delete | VendorFaultDefinition | [Reference](https://developers.ampeco.com/reference/vendorerrorcodedelete) |
| resource / vouchers | Vouchers / Listing | Voucher, VoucherRedemption | [Reference](https://developers.ampeco.com/reference/voucherslistingdeprecated) |
| resource / vouchers | Voucher / Create | Voucher, VoucherRedemption | [Reference](https://developers.ampeco.com/reference/vouchercreatedeprecated) |
| resource / vouchers | Voucher / Read | Voucher, VoucherRedemption | [Reference](https://developers.ampeco.com/reference/voucherreaddeprecated) |
| resource / vouchers | Voucher / Update | Voucher, VoucherRedemption | [Reference](https://developers.ampeco.com/reference/voucherupdatedeprecated) |
| resource / vouchers | Voucher / Delete | Voucher, VoucherRedemption | [Reference](https://developers.ampeco.com/reference/voucherdeletedeprecated) |
| resource / vouchers | Vouchers / Listing | Voucher, VoucherRedemption | [Reference](https://developers.ampeco.com/reference/voucherslisting) |
| resource / vouchers | Voucher / Create | Voucher, VoucherRedemption | [Reference](https://developers.ampeco.com/reference/vouchercreate) |
| resource / vouchers | Voucher / Read | Voucher, VoucherRedemption | [Reference](https://developers.ampeco.com/reference/voucherread) |
| resource / vouchers | Voucher / Update | Voucher, VoucherRedemption | [Reference](https://developers.ampeco.com/reference/voucherupdate) |
| resource / vouchers | Voucher / Delete | Voucher, VoucherRedemption | [Reference](https://developers.ampeco.com/reference/voucherdelete) |
