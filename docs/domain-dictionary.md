# Domain dictionary

Cardinalities: `!` exactly one, `?` zero or one, `+` one or more, `*` any number. Every Record subclass also inherits the Record properties. OWL has open-world semantics; mandatory fields are enforced by SHACL.

## assets

### Manufacturer

Organization manufacturing charging equipment; identified separately from models.

Parent: Record. Shape: `ManufacturerShape`.

| Property | Range | Cardinality |
|---|---|---|
| manufacturerParty | LegalEntity | ! |
| manufacturerName | string | ! |

### EquipmentModel

Versioned hardware model and its declared electrical and communication capabilities.

Parent: Record. Shape: `EquipmentModelShape`.

| Property | Range | Cardinality |
|---|---|---|
| manufacturer | Manufacturer | ! |
| modelCode | string | ! |
| modelRevision | string | ! |
| capability | DeviceCapability | * |
| manual | EvidenceDocument | * |

### DeviceCapability

Capability assertion with source, firmware context and verification status.

Parent: Record. Shape: `DeviceCapabilityShape`.

| Property | Range | Cardinality |
|---|---|---|
| capabilityCode | string | ! |
| protocolVersion | string | ? |
| firmware | FirmwareRelease | ? |
| verificationState | Declared, Observed, Tested, Certified | ! |
| evidence | EvidenceDocument | * |

### ChargingStation

Managed physical assembly that may host multiple charging units or use a gateway.

Parent: Record. Shape: `ChargingStationShape`.

| Property | Range | Cardinality |
|---|---|---|
| operatorService | OperatorService | ! |
| stationName | string | ! |
| equipmentModel | EquipmentModel | ! |
| site | ChargingSite | ? |
| area | ChargingArea | ? |
| stationUse | Public, Private, Personal | ! |
| communicationMode | Direct, Gateway, Unmanaged | ! |
| gatewayStation | ChargingStation | ? |
| protocolEndpoint | ProtocolEndpoint | ? |
| ownerAccount | CustomerAccount | ? |
| assetOwner | LegalEntity | ? |
| administrationState | Enabled, Disabled, OutOfService, Simulation | ! |
| monitoringEnabled | boolean | ! |
| recoveryEnabled | boolean | ! |
| electricitySchedule | ElectricityPriceSchedule | ? |
| reimbursementPolicy | ReimbursementPolicy | ? |
| maintenanceProvider | LegalEntity | ? |
| commissionedAt | dateTime | ? |
| manufacturedAt | dateTime | ? |
| sharingSecretReference | anyURI | ? |
| nationalStationIdentifier | string | ? |
| powerCabinet | PowerCabinet | ? |
| chargingProfile | ChargingProfile | * |

### ChargingUnit

Logical EVSE capable of supplying one vehicle at a time; may expose multiple alternative connectors.

Parent: Record. Shape: `ChargingUnitShape`.

| Property | Range | Cardinality |
|---|---|---|
| station | ChargingStation | ! |
| physicalReference | string | ! |
| currentKind | AC, DC | ! |
| maximumPowerKW | decimal | ! |
| minimumCurrentA | decimal | ? |
| maximumCurrentA | decimal | ? |
| tariffSet | TariffSet | ? |
| reservable | boolean | ! |
| bookable | boolean | ! |
| calibration | CalibrationRecord | ? |
| electricalConnection | ElectricalConnection | ? |

### Connector

Physical vehicle interface attached to a charging unit.

Parent: Record. Shape: `ConnectorShape`.

| Property | Range | Cardinality |
|---|---|---|
| chargingUnit | ChargingUnit | ! |
| connectorReference | string | ! |
| connectorStandard | string | ! |
| connectorFormat | Socket, Cable | ! |
| ratedVoltageV | decimal | ! |
| ratedCurrentA | decimal | ! |
| maximumPowerKW | decimal | ! |

### ElectricityMeter

Meter measuring site or charging energy; sensor role is separate from commercial evidence.

Parent: Record. Shape: `ElectricityMeterShape`.

| Property | Range | Cardinality |
|---|---|---|
| meterSerial | string | ! |
| measurandCode | string | + |
| unitIri | IRI | ! |
| site | ChargingSite | ? |
| chargingUnit | ChargingUnit | ? |
| calibration | CalibrationRecord | ? |
| integration | IntegrationConnection | ? |

### CalibrationRecord

Metrology certification and validity information, without assuming compliance from a label.

Parent: Record. Shape: `CalibrationRecordShape`.

| Property | Range | Cardinality |
|---|---|---|
| meterSerial | string | ! |
| jurisdictionCode | string | ! |
| validFrom | dateTime | ! |
| validUntil | dateTime | ! |
| certificateEvidence | EvidenceDocument | ! |
| verificationState | Declared, Observed, Tested, Certified | ! |

### ElectricalCircuit

Physical circuit topology and conductor ratings; distinct from virtual allocation groups.

Parent: Record. Shape: `ElectricalCircuitShape`.

| Property | Range | Cardinality |
|---|---|---|
| site | ChargingSite | ! |
| parentCircuit | ElectricalCircuit | ? |
| phaseSystem | Single, Three, Split | ! |
| ratedCurrentA | decimal | ! |
| phaseRotation | string | ? |
| protectiveDeviceReference | string | ! |

### ElectricalConnection

Physical attachment of charging equipment to a circuit and mapped conductors.

Parent: Record. Shape: `ElectricalConnectionShape`.

| Property | Range | Cardinality |
|---|---|---|
| circuit | ElectricalCircuit | ! |
| connectedRecord | Record | ! |
| conductorCode | string | + |
| voltageV | decimal | ! |

### OwnershipTransfer

Effective-time transfer of asset ownership retaining previous accountability.

Parent: Record. Shape: `OwnershipTransferShape`.

| Property | Range | Cardinality |
|---|---|---|
| transferredAsset | ChargingStation | ! |
| previousOwner | Record | ! |
| nextOwner | Record | ! |
| effectiveAt | dateTime | ! |
| transferEvidence | EvidenceDocument | ! |

## billing-tax

### BillingProfile

Versionable invoice-party details captured when financial documents are issued.

Parent: Record. Shape: `BillingProfileShape`.

| Property | Range | Cardinality |
|---|---|---|
| billToName | string | ! |
| billToAddress | Address | ! |
| taxIdentifier | TaxIdentifier | * |
| receiptEmail | string | ? |
| billingParty | LegalEntity | ? |

### TaxIdentifier

Tax registration identifier qualified by issuing jurisdiction and identifier type.

Parent: Record. Shape: `TaxIdentifierShape`.

| Property | Range | Cardinality |
|---|---|---|
| taxNumber | string | ! |
| jurisdictionCode | string | ! |
| taxIdentifierType | string | ! |
| party | LegalEntity | ? |
| verificationState | Unchecked, Valid, Invalid, Unavailable | ! |

### TaxRule

Versioned tax rule selected by jurisdiction and supply context; not a global VAT default.

Parent: Record. Shape: `TaxRuleShape`.

| Property | Range | Cardinality |
|---|---|---|
| taxName | string | ! |
| jurisdictionCode | string | ! |
| taxFraction | decimal | ! |
| validFrom | dateTime | ! |
| validUntil | dateTime | ? |
| taxCategory | string | ! |
| taxIdentifier | TaxIdentifier | ? |

### TaxDetermination

Recorded tax treatment and evidential facts for a supply or billing line.

Parent: Record. Shape: `TaxDeterminationShape`.

| Property | Range | Cardinality |
|---|---|---|
| supplier | LegalEntity | ! |
| customerParty | Record | ! |
| taxRule | TaxRule | ! |
| taxBasisAmount | decimal | ! |
| taxAmount | decimal | ! |
| currency | Currency | ! |
| determinationReason | string | ! |
| determinedAt | dateTime | ! |

### RatingCalculation

Versioned calculation of a session charge from immutable tariff and usage inputs.

Parent: Record. Shape: `RatingCalculationShape`.

| Property | Range | Cardinality |
|---|---|---|
| session | ChargingSession | ! |
| selectedTariff | TariffVersion | ! |
| ratingVersion | string | ! |
| calculatedAt | dateTime | ! |
| ratedLine | RatedLine | + |
| currency | Currency | ! |
| netAmount | decimal | ! |
| taxAmount | decimal | ! |
| grossAmount | decimal | ! |
| evidence | EvidenceDocument | + |
| tariffResolution | TariffResolution | ? |

### RatedLine

Priced usage or fee component with quantity, rounding and tax evidence.

Parent: Record. Shape: `RatedLineShape`.

| Property | Range | Cardinality |
|---|---|---|
| priceComponent | PriceComponent | ! |
| quantityValue | decimal | ! |
| unitPrice | decimal | ! |
| netAmount | decimal | ! |
| taxAmount | decimal | ! |
| grossAmount | decimal | ! |
| currency | Currency | ! |
| roundingPolicy | RoundingPolicy | ! |
| taxDetermination | TaxDetermination | ? |
| chargingInterval | ChargingInterval | ? |

### Invoice

Issued or draft accounting document with independent lifecycle and issuer numbering.

Parent: Record. Shape: `InvoiceShape`.

| Property | Range | Cardinality |
|---|---|---|
| issuer | LegalEntity | ! |
| billingProfile | BillingProfile | ! |
| invoiceNumber | string | ! |
| issuedAt | dateTime | ! |
| dueAt | dateTime | ! |
| invoiceState | Draft, Issued, Paid, PartiallyPaid, Voided, Overdue | ! |
| currency | Currency | ! |
| invoiceLine | InvoiceLine | + |
| netAmount | decimal | ! |
| taxAmount | decimal | ! |
| grossAmount | decimal | ! |
| numberSequence | DocumentNumberSequence | ! |

### InvoiceLine

Invoice line linked to rated or contractual supply evidence.

Parent: Record. Shape: `InvoiceLineShape`.

| Property | Range | Cardinality |
|---|---|---|
| lineDescription | langString | + |
| quantityValue | decimal | ! |
| unitPrice | decimal | ! |
| netAmount | decimal | ! |
| taxAmount | decimal | ! |
| grossAmount | decimal | ! |
| currency | Currency | ! |
| ratedLine | RatedLine | ? |
| chargeRecord | ChargeDetailRecord | ? |
| serviceAgreement | ServiceAgreement | ? |

### CreditNote

Accounting correction linked to an original invoice, separate from refund execution.

Parent: Record. Shape: `CreditNoteShape`.

| Property | Range | Cardinality |
|---|---|---|
| originalInvoice | Invoice | ! |
| creditNumber | string | ! |
| issuedAt | dateTime | ! |
| creditReason | string | ! |
| currency | Currency | ! |
| creditAmount | decimal | ! |
| issuer | LegalEntity | ! |
| artifact | EvidenceDocument | ! |

### Receipt

Evidence of a monetary receipt tied to payment capture and optional invoice.

Parent: Record. Shape: `ReceiptShape`.

| Property | Range | Cardinality |
|---|---|---|
| paymentCapture | PaymentCapture | ! |
| receiptNumber | string | ! |
| issuedAt | dateTime | ! |
| currency | Currency | ! |
| receivedAmount | decimal | ! |
| invoice | Invoice | ? |
| artifact | EvidenceDocument | ! |

### DocumentNumberSequence

Issuer-scoped numbering configuration with preserved string prefixes and auditability.

Parent: Record. Shape: `DocumentNumberSequenceShape`.

| Property | Range | Cardinality |
|---|---|---|
| issuer | LegalEntity | ! |
| documentKind | Invoice, CreditNote, Receipt | ! |
| numberPrefix | string | ! |
| nextSequence | nonNegativeInteger | ! |
| numberWidth | nonNegativeInteger | ! |

### FiscalizationAttempt

Attempt to submit an invoice to a fiscal authority, with retry and authority outcome.

Parent: Record. Shape: `FiscalizationAttemptShape`.

| Property | Range | Cardinality |
|---|---|---|
| invoice | Invoice | ! |
| integration | IntegrationConnection | ! |
| attemptedAt | dateTime | ! |
| attemptNumber | positiveInteger | ! |
| fiscalizationState | Pending, Accepted, Rejected, Unavailable | ! |
| authorityReference | string | ? |
| fiscalDocument | EvidenceDocument | ? |
| failureCode | string | ? |

### CustomFee

Explicit non-session fee tied to a customer and accounting basis.

Parent: Record. Shape: `CustomFeeShape`.

| Property | Range | Cardinality |
|---|---|---|
| customer | CustomerAccount | ! |
| feeReason | string | ! |
| currency | Currency | ! |
| netAmount | decimal | ! |
| taxAmount | decimal | ! |
| grossAmount | decimal | ! |
| assessedAt | dateTime | ! |
| taxDetermination | TaxDetermination | ? |

## commands-booking

### RemoteCommand

Persisted asynchronous action request; acknowledgement and achieved outcome are separate.

Parent: Record. Shape: `RemoteCommandShape`.

| Property | Range | Cardinality |
|---|---|---|
| commandKind | IRI | ! |
| targetRecord | Record | ! |
| requestedBy | Principal | ! |
| requestedAt | dateTime | ! |
| expiresAt | dateTime | ! |
| correlationId | string | ! |
| idempotencyKey | string | ! |
| commandState | Queued, Sent, Accepted, Rejected, Succeeded, Failed, Expired, Unknown | ! |
| sourceEvent | SourceEvent | ? |
| commandParameter | CommandParameter | * |

### CommandParameter

Typed parameter of a domain command with a declared semantic key.

Parent: Record. Shape: `CommandParameterShape`.

| Property | Range | Cardinality |
|---|---|---|
| parameterKey | IRI | ! |
| lexicalValue | string | ! |
| valueDatatype | IRI | ! |
| referencedRecord | Record | ? |

### CommandOutcome

Reported acknowledgement or terminal outcome of one command.

Parent: Record. Shape: `CommandOutcomeShape`.

| Property | Range | Cardinality |
|---|---|---|
| command | RemoteCommand | ! |
| outcomeKind | Acknowledgement, Completion | ! |
| outcomeState | Accepted, Rejected, Succeeded, Failed, Unknown | ! |
| reasonCode | string | ! |
| reportedAt | dateTime | ! |
| evidence | EvidenceDocument | * |

### BookingRequest

Request to allocate charging or parking over a future interval, including modification/cancellation intent.

Parent: Record. Shape: `BookingRequestShape`.

| Property | Range | Cardinality |
|---|---|---|
| customer | CustomerAccount | ! |
| site | ChargingSite | ! |
| requestedWindow | TimeWindow | ! |
| requestKind | Create, Change, Cancel | ! |
| previousBooking | Booking | ? |
| requestedEnergyKWh | decimal | ? |
| requestState | Pending, Accepted, Rejected, Expired | ! |

### Booking

Confirmed future allocation tied to a request, distinct from immediate charger reservation.

Parent: Record. Shape: `BookingShape`.

| Property | Range | Cardinality |
|---|---|---|
| bookingRequest | BookingRequest | ! |
| bookingWindow | TimeWindow | ! |
| chargingUnit | ChargingUnit | ! |
| parkingSpace | ParkingSpace | ? |
| bookingState | Confirmed, Cancelled, Fulfilled, NoShow, Expired | ! |

### Reservation

Immediate resource hold with an expiry and optional booking linkage.

Parent: Record. Shape: `ReservationShape`.

| Property | Range | Cardinality |
|---|---|---|
| chargingUnit | ChargingUnit | ! |
| customer | CustomerAccount | ! |
| reservedAt | dateTime | ! |
| expiresAt | dateTime | ! |
| reservationState | Pending, Active, Cancelled, Consumed, Expired, Rejected | ! |
| booking | Booking | ? |
| session | ChargingSession | ? |

## device-management

### ProtocolEndpoint

Versioned charger communication endpoint with identity and credential reference.

Parent: Record. Shape: `ProtocolEndpointShape`.

| Property | Range | Cardinality |
|---|---|---|
| endpointIdentity | ExternalIdentifier | ! |
| protocolName | OCPP, OCPI, OICP, OpenADR, Custom | ! |
| protocolVersion | string | ! |
| endpointUrl | anyURI | ? |
| credentialReference | anyURI | ! |
| securityProfile | string | ! |

### ConfigurationVariable

Desired and observed device configuration, including component and EVSE addressing.

Parent: Record. Shape: `ConfigurationVariableShape`.

| Property | Range | Cardinality |
|---|---|---|
| station | ChargingStation | ! |
| componentName | string | ! |
| variableName | string | ! |
| attributeType | string | ! |
| desiredValue | string | ? |
| observedValue | string | ? |
| valueDatatype | IRI | ! |
| configurationState | Unknown, Pending, Applied, Rejected | ! |
| observedAt | dateTime | ? |

### ConfigurationTemplate

Reusable versioned collection of desired device configuration values.

Parent: Record. Shape: `ConfigurationTemplateShape`.

| Property | Range | Cardinality |
|---|---|---|
| templateName | string | ! |
| templateVersion | string | ! |
| templateEntry | ConfigurationTemplateEntry | + |

### ConfigurationTemplateEntry

One typed variable assignment within a configuration template.

Parent: Record. Shape: `ConfigurationTemplateEntryShape`.

| Property | Range | Cardinality |
|---|---|---|
| componentName | string | ! |
| variableName | string | ! |
| attributeType | string | ! |
| lexicalValue | string | ! |
| valueDatatype | IRI | ! |

### TemplateApplication

Auditable attempt to apply a configuration template to a station.

Parent: Record. Shape: `TemplateApplicationShape`.

| Property | Range | Cardinality |
|---|---|---|
| configurationTemplate | ConfigurationTemplate | ! |
| station | ChargingStation | ! |
| requestedAt | dateTime | ! |
| applicationState | Pending, Applied, PartiallyApplied, Rejected | ! |
| command | RemoteCommand | * |

### FirmwareRelease

Firmware artifact with immutable digest, compatibility and verification information.

Parent: Record. Shape: `FirmwareReleaseShape`.

| Property | Range | Cardinality |
|---|---|---|
| firmwareVersion | string | ! |
| firmwareArtifact | EvidenceDocument | ! |
| compatibleModel | EquipmentModel | + |
| releaseDate | date | ! |
| signatureVerified | boolean | ! |

### FirmwareDeployment

Scheduled rollout to a station with explicit progression and rollback reference.

Parent: Record. Shape: `FirmwareDeploymentShape`.

| Property | Range | Cardinality |
|---|---|---|
| firmware | FirmwareRelease | ! |
| station | ChargingStation | ! |
| requestedAt | dateTime | ! |
| deploymentState | Scheduled, Downloading, Downloaded, Installing, Succeeded, Failed, RolledBack | ! |
| completedAt | dateTime | ? |
| rollbackFirmware | FirmwareRelease | ? |
| command | RemoteCommand | ? |

### HardwareStatusObservation

Timestamped equipment state from a specific reporting source.

Parent: Record. Shape: `HardwareStatusObservationShape`.

| Property | Range | Cardinality |
|---|---|---|
| observedAsset | Record | ! |
| hardwareState | Available, Preparing, Charging, SuspendedByVehicle, SuspendedByStation, Finishing, Reserved, Unavailable, Faulted, Unknown | ! |
| observedAt | dateTime | ! |
| sourceEvent | SourceEvent | ! |
| vendorFault | VendorFaultDefinition | ? |

### ConnectionObservation

Network reachability observation separated from physical availability and administrative state.

Parent: Record. Shape: `ConnectionObservationShape`.

| Property | Range | Cardinality |
|---|---|---|
| station | ChargingStation | ! |
| connectionState | NeverConnected, Connected, Disconnected, Stale | ! |
| observedAt | dateTime | ! |
| lastHeartbeatAt | dateTime | ? |

### DiagnosticArtifact

Diagnostic or security log collection associated with a request and result.

Parent: Record. Shape: `DiagnosticArtifactShape`.

| Property | Range | Cardinality |
|---|---|---|
| station | ChargingStation | ! |
| command | RemoteCommand | ! |
| artifact | EvidenceDocument | ? |
| diagnosticState | Requested, Uploading, Available, Failed | ! |
| requestedAt | dateTime | ! |

## energy

### GridConnection

Site boundary with contractual import and export power limits.

Parent: Record. Shape: `GridConnectionShape`.

| Property | Range | Cardinality |
|---|---|---|
| site | ChargingSite | ! |
| gridOperator | LegalEntity | ! |
| importLimitKW | decimal | ! |
| exportLimitKW | decimal | ! |
| effectiveWindow | TimeWindow | ! |
| connectionIdentifier | ExternalIdentifier | ! |

### LoadControlGroup

Virtual allocation group for dynamic load management, separate from physical circuit topology.

Parent: Record. Shape: `LoadControlGroupShape`.

| Property | Range | Cardinality |
|---|---|---|
| groupName | string | ! |
| site | ChargingSite | ! |
| parentControlGroup | LoadControlGroup | ? |
| phaseSystem | Single, Three, Split | ! |
| phaseRotation | string | ? |
| controlStrategy | EqualShare, Priority, FirstCome, Deadline, Cost | ! |
| offlineReserveCurrentA | decimal | ! |
| externalControlIntegration | IntegrationConnection | ? |

### ControlGroupMembership

Assignment of a station or unit to a load control group with conductor mapping.

Parent: Record. Shape: `ControlGroupMembershipShape`.

| Property | Range | Cardinality |
|---|---|---|
| controlGroup | LoadControlGroup | ! |
| controlledAsset | Record | ! |
| phaseRotation | string | ? |
| validFrom | dateTime | ! |
| validUntil | dateTime | ? |

### PowerConstraint

Time-limited directional power limit with origin and precedence.

Parent: Record. Shape: `PowerConstraintShape`.

| Property | Range | Cardinality |
|---|---|---|
| controlGroup | LoadControlGroup | ! |
| interval | TimeWindow | ! |
| energyDirection | Import, Export | ! |
| maximumPowerKW | decimal | ! |
| constraintOrigin | Grid, Contract, LocalSafety, Optimizer, Utility, User | ! |
| priority | integer | ! |

### PhaseCurrentConstraint

Per-phase electrical current bound used alongside aggregate power constraints.

Parent: Record. Shape: `PhaseCurrentConstraintShape`.

| Property | Range | Cardinality |
|---|---|---|
| controlGroup | LoadControlGroup | ! |
| interval | TimeWindow | ! |
| phaseCode | string | ! |
| maximumCurrentA | decimal | ! |
| constraintOrigin | Grid, Contract, LocalSafety, Optimizer, Utility, User | ! |

### PriorityRule

Allocation preference for a customer, asset, session or state-of-charge band.

Parent: Record. Shape: `PriorityRuleShape`.

| Property | Range | Cardinality |
|---|---|---|
| controlGroup | LoadControlGroup | ! |
| priority | integer | ! |
| targetRecord | Record | ! |
| minimumStateOfChargePercent | decimal | ? |
| maximumStateOfChargePercent | decimal | ? |
| boostUntil | dateTime | ? |

### SmartChargingPreference

Customer charging objective including deadline, target energy and randomized-delay preference.

Parent: Record. Shape: `SmartChargingPreferenceShape`.

| Property | Range | Cardinality |
|---|---|---|
| customer | CustomerAccount | ! |
| station | ChargingStation | ! |
| strategy | Immediate, Deadline, LowestCost, Solar, Custom | ! |
| departureAt | dateTime | ? |
| requiredEnergyKWh | decimal | ? |
| targetStateOfChargePercent | decimal | ? |
| randomizedDelaySeconds | nonNegativeInteger | ! |

### ChargingSchedule

Time-based power/current proposal with explicit version, purpose and validity.

Parent: Record. Shape: `ChargingScheduleShape`.

| Property | Range | Cardinality |
|---|---|---|
| controlledAsset | Record | ! |
| schedulePurpose | StationLimit, DefaultSession, Session, Composite | ! |
| scheduleKind | Absolute, Relative, Recurring | ! |
| scheduleUnit | kW, A | ! |
| schedulePeriod | SchedulePeriod | + |
| validFrom | dateTime | ! |
| validUntil | dateTime | ! |
| stackLevel | nonNegativeInteger | ! |
| session | ChargingSession | ? |

### SchedulePeriod

Non-overlapping interval within a charging schedule with a signed directional setpoint.

Parent: Record. Shape: `SchedulePeriodShape`.

| Property | Range | Cardinality |
|---|---|---|
| periodStart | dateTime | ! |
| periodEnd | dateTime | ! |
| limitValue | decimal | ! |
| numberOfPhases | positiveInteger | ! |
| energyDirection | Import, Export | ! |

### ScheduleApplication

Evidence of device acceptance and observed enforcement of a schedule.

Parent: Record. Shape: `ScheduleApplicationShape`.

| Property | Range | Cardinality |
|---|---|---|
| chargingSchedule | ChargingSchedule | ! |
| command | RemoteCommand | ! |
| applicationState | Pending, Applied, PartiallyApplied, Rejected | ! |
| appliedAt | dateTime | ? |
| observedCompliance | Unknown, WithinLimit, Violation | ! |

### UnmanagedLoadObservation

Measured or estimated non-controlled load used for site allocation.

Parent: Record. Shape: `UnmanagedLoadObservationShape`.

| Property | Range | Cardinality |
|---|---|---|
| controlGroup | LoadControlGroup | ! |
| observedAt | dateTime | ! |
| powerKW | decimal | ! |
| phaseCurrentA | decimal | ? |
| phaseCode | string | ? |
| quality | Valid, Estimated, Suspect, Invalid | ! |
| sourceEvent | SourceEvent | ! |

### EnergyForecast

Versioned forecast series with issue time, horizon, source and uncertainty semantics.

Parent: Record. Shape: `EnergyForecastShape`.

| Property | Range | Cardinality |
|---|---|---|
| forecastTarget | Record | ! |
| issuedAt | dateTime | ! |
| horizon | TimeWindow | ! |
| forecastMethod | string | ! |
| forecastPoint | ForecastPoint | + |
| unitIri | IRI | ! |

### ForecastPoint

Forecast value and optional interval bounds for one time bucket.

Parent: Record. Shape: `ForecastPointShape`.

| Property | Range | Cardinality |
|---|---|---|
| interval | TimeWindow | ! |
| predictedValue | decimal | ! |
| lowerBound | decimal | ? |
| upperBound | decimal | ? |

### DemandResponseProgram

Utility or aggregator program defining controllable services and measurement obligations.

Parent: Record. Shape: `DemandResponseProgramShape`.

| Property | Range | Cardinality |
|---|---|---|
| programProvider | LegalEntity | ! |
| programReference | string | ! |
| protocolName | OpenADR, Custom | ! |
| settlementUnit | IRI | ! |
| serviceAgreement | ServiceAgreement | ! |

### FlexibilityAsset

Registered control group participating in a flexibility program.

Parent: Record. Shape: `FlexibilityAssetShape`.

| Property | Range | Cardinality |
|---|---|---|
| controlGroup | LoadControlGroup | ! |
| demandResponseProgram | DemandResponseProgram | ! |
| integration | IntegrationConnection | ! |
| assetState | Registered, Active, Suspended, Expired | ! |
| validUntil | dateTime | ? |

### FlexibilityActivation

Requested power adjustment over a defined interval with acceptance and delivery tracking.

Parent: Record. Shape: `FlexibilityActivationShape`.

| Property | Range | Cardinality |
|---|---|---|
| flexibilityAsset | FlexibilityAsset | ! |
| interval | TimeWindow | ! |
| requestedPowerKW | decimal | ! |
| activationState | Requested, Accepted, Rejected, Active, Completed, Failed | ! |
| baseline | EnergyForecast | ! |
| requestedAt | dateTime | ! |

### FlexibilityDelivery

Measured delivery against an activation and baseline, retaining verification evidence.

Parent: Record. Shape: `FlexibilityDeliveryShape`.

| Property | Range | Cardinality |
|---|---|---|
| flexibilityActivation | FlexibilityActivation | ! |
| actualEnergyKWh | decimal | ! |
| baselineEnergyKWh | decimal | ! |
| deliveredAdjustmentKWh | decimal | ! |
| verifiedAt | dateTime | ! |
| evidence | EvidenceDocument | + |

### DistributedEnergyAsset

Site generation or storage participating in energy management.

Parent: Record. Shape: `DistributedEnergyAssetShape`.

| Property | Range | Cardinality |
|---|---|---|
| site | ChargingSite | ! |
| energyAssetKind | Solar, StationaryBattery, VehicleBattery, Other | ! |
| ratedPowerKW | decimal | ! |
| capacityKWh | decimal | ? |
| integration | IntegrationConnection | ! |
| bidirectional | boolean | ! |

### PowerCabinet

Shared DC conversion capacity serving multiple charging units, separate from a station identity.

Parent: Record. Shape: `PowerCabinetShape`.

| Property | Range | Cardinality |
|---|---|---|
| site | ChargingSite | ! |
| totalCabinetPowerKW | decimal | ! |
| moduleSizeKW | decimal | ! |
| sharingMode | Fixed, Dynamic, External | ! |
| servedUnit | ChargingUnit | + |

### PowerModuleAllocation

Time-bounded assignment of cabinet power modules to a charging unit.

Parent: Record. Shape: `PowerModuleAllocationShape`.

| Property | Range | Cardinality |
|---|---|---|
| powerCabinet | PowerCabinet | ! |
| chargingUnit | ChargingUnit | ! |
| allocatedModules | positiveInteger | ! |
| allocatedPowerKW | decimal | ! |
| interval | TimeWindow | ! |

### ChargingProfile

Protocol-independent charging profile preserving purpose, kind, stack precedence and schedule.

Parent: Record. Shape: `ChargingProfileShape`.

| Property | Range | Cardinality |
|---|---|---|
| profilePurpose | StationMaximum, TransactionDefault, TransactionSpecific, ExternalConstraints | ! |
| profileKind | Absolute, Recurring, Relative | ! |
| stackLevel | nonNegativeInteger | ! |
| chargingSchedule | ChargingSchedule | ! |
| recurrenceKind | Daily, Weekly | ? |
| protocolTransaction | ProtocolTransaction | ? |
| relativeAnchor | dateTime | ? |

## foundation

### Tenant

Administrative data-isolation boundary, independent of legal entities and brands.

Parent: root. Shape: `TenantShape`.

| Property | Range | Cardinality |
|---|---|---|
| tenantName | string | ! |
| tenantKey | string | ! |

### Record

Identifiable tenant-owned domain record with explicit provenance and version metadata.

Parent: root. Shape: `RecordShape`.

| Property | Range | Cardinality |
|---|---|---|
| tenant | Tenant | ! |
| canonicalId | string | ! |
| createdAt | dateTime | ! |
| revision | positiveInteger | ! |
| label | langString | * |
| externalIdentifier | ExternalIdentifier | * |
| evidence | EvidenceDocument | * |
| customValue | CustomFieldValue | * |
| annotation | Annotation | * |

### ExternalIdentifier

Identifier qualified by scheme, assigning authority and validity; equality does not imply entity equivalence.

Parent: Record. Shape: `ExternalIdentifierShape`.

| Property | Range | Cardinality |
|---|---|---|
| identifierValue | string | ! |
| identifierScheme | string | ! |
| assigningAuthority | string | ! |
| validFrom | dateTime | ? |
| validUntil | dateTime | ? |

### EvidenceDocument

Retained evidence described by content digest and storage reference, without embedding credentials.

Parent: Record. Shape: `EvidenceDocumentShape`.

| Property | Range | Cardinality |
|---|---|---|
| contentDigest | string | ! |
| mediaType | string | ! |
| storageReference | anyURI | ! |
| capturedAt | dateTime | ! |
| retentionPolicy | RetentionPolicy | ? |

### TimeWindow

Half-open UTC interval with an inclusive start and exclusive end.

Parent: Record. Shape: `TimeWindowShape`.

| Property | Range | Cardinality |
|---|---|---|
| startsAt | dateTime | ! |
| endsAt | dateTime | ! |

### RecurringWindow

Local recurring opening or pricing window with explicit timezone and overnight semantics.

Parent: Record. Shape: `RecurringWindowShape`.

| Property | Range | Cardinality |
|---|---|---|
| timezoneName | string | ! |
| weekday | nonNegativeInteger | + |
| localStart | time | ! |
| localEnd | time | ! |
| spansMidnight | boolean | ! |
| exceptionWindow | TimeWindow | * |

### Address

Structured postal address; optional fields accommodate national differences.

Parent: Record. Shape: `AddressShape`.

| Property | Range | Cardinality |
|---|---|---|
| countryCode | string | ! |
| locality | string | ? |
| postalCode | string | ? |
| streetAddress | langString | * |
| regionCode | string | ? |

### GeoPosition

Geodetic position in WGS84 decimal degrees.

Parent: Record. Shape: `GeoPositionShape`.

| Property | Range | Cardinality |
|---|---|---|
| latitude | decimal | ! |
| longitude | decimal | ! |
| altitudeMetres | decimal | ? |

### Currency

Tenant-enabled monetary currency with ISO code and minor-unit precision.

Parent: Record. Shape: `CurrencyShape`.

| Property | Range | Cardinality |
|---|---|---|
| currencyCode | string | ! |
| minorUnitDigits | nonNegativeInteger | ! |

### ExchangeRate

Directional currency conversion quote tied to an instant and provider.

Parent: Record. Shape: `ExchangeRateShape`.

| Property | Range | Cardinality |
|---|---|---|
| baseCurrency | Currency | ! |
| quoteCurrency | Currency | ! |
| conversionRate | decimal | ! |
| quotedAt | dateTime | ! |
| rateProvider | string | ! |

### Quantity

Numerical quantity with explicit unit and physical dimension.

Parent: Record. Shape: `QuantityShape`.

| Property | Range | Cardinality |
|---|---|---|
| numericValue | decimal | ! |
| unitIri | IRI | ! |
| quantityKind | string | ! |

### Annotation

Authored note attached to a domain record; stored independently from controlled classifications.

Parent: Record. Shape: `AnnotationShape`.

| Property | Range | Cardinality |
|---|---|---|
| noteText | string | ! |
| author | Principal | ! |
| notedAt | dateTime | ! |
| visibility | Internal, Partner, Customer | ! |

### CustomFieldDefinition

Versioned, named extension field with declared datatype and applicable class IRI.

Parent: Record. Shape: `CustomFieldDefinitionShape`.

| Property | Range | Cardinality |
|---|---|---|
| fieldKey | string | ! |
| fieldDatatype | IRI | ! |
| applicableClass | IRI | ! |
| requiredField | boolean | ! |
| definitionVersion | string | ! |

### CustomFieldValue

Typed extension value associated with its definition, not a substitute for modeled core properties.

Parent: Record. Shape: `CustomFieldValueShape`.

| Property | Range | Cardinality |
|---|---|---|
| fieldDefinition | CustomFieldDefinition | ! |
| lexicalValue | string | ! |
| valueDatatype | IRI | ! |

### StateTransition

Recorded transition between controlled states with policy and source evidence.

Parent: Record. Shape: `StateTransitionShape`.

| Property | Range | Cardinality |
|---|---|---|
| targetRecord | Record | ! |
| stateProperty | IRI | ! |
| previousState | IRI | ! |
| nextState | IRI | ! |
| transitionedAt | dateTime | ! |
| sourceEvent | SourceEvent | ! |

## identity

### LegalEntity

Legal person participating in charging services; role is represented separately.

Parent: Record. Shape: `LegalEntityShape`.

| Property | Range | Cardinality |
|---|---|---|
| legalName | string | ! |
| registeredAddress | Address | ! |
| registrationNumber | string | ? |
| taxIdentifier | TaxIdentifier | * |
| contact | ContactProfile | * |
| financialAccount | FinancialAccountReference | * |

### Person

Minimal person reference; personally identifying details remain purpose-controlled.

Parent: Record. Shape: `PersonShape`.

| Property | Range | Cardinality |
|---|---|---|
| personReference | string | ! |
| preferredLanguage | string | ? |
| contact | ContactProfile | ? |

### ContactProfile

Purpose-specific contact details with visibility and retention boundaries.

Parent: Record. Shape: `ContactProfileShape`.

| Property | Range | Cardinality |
|---|---|---|
| contactPurpose | string | ! |
| emailAddress | string | ? |
| telephoneNumber | string | ? |
| contactAddress | Address | ? |
| retentionPolicy | RetentionPolicy | ? |

### PartyRole

Time-qualified business role held by a legal entity within a service context.

Parent: Record. Shape: `PartyRoleShape`.

| Property | Range | Cardinality |
|---|---|---|
| party | LegalEntity | ! |
| businessRole | CPO, EMSP, SiteHost, AssetOwner, FleetEmployer, Installer, Utility, RoamingHub, PaymentProvider, ServiceProvider | ! |
| operatorService | OperatorService | ? |
| validFrom | dateTime | ! |
| validUntil | dateTime | ? |

### OperatorService

Business service operating a network or driver offering within one tenant.

Parent: Record. Shape: `OperatorServiceShape`.

| Property | Range | Cardinality |
|---|---|---|
| serviceProvider | LegalEntity | ! |
| serviceName | string | ! |
| serviceRole | CPO, EMSP, Both | ! |
| parentService | OperatorService | ? |
| brand | BrandProfile | ? |
| defaultCurrency | Currency | ! |

### Principal

Human or machine security subject linked to an identity provider by opaque reference.

Parent: Record. Shape: `PrincipalShape`.

| Property | Range | Cardinality |
|---|---|---|
| subjectReference | string | ! |
| identityProvider | string | ! |
| principalKind | Human, Machine | ! |
| principalState | Enabled, Disabled | ! |
| person | Person | ? |

### Permission

Named action permission for a class or bounded resource scope.

Parent: Record. Shape: `PermissionShape`.

| Property | Range | Cardinality |
|---|---|---|
| permissionAction | string | ! |
| resourceClass | IRI | ! |
| descriptionText | string | ! |

### SecurityRole

Named collection of permissions; not an organization business role.

Parent: Record. Shape: `SecurityRoleShape`.

| Property | Range | Cardinality |
|---|---|---|
| roleName | string | ! |
| permission | Permission | + |

### AccessGrant

Time-qualified grant of permissions to a principal over an explicit scope.

Parent: Record. Shape: `AccessGrantShape`.

| Property | Range | Cardinality |
|---|---|---|
| grantee | Principal | ! |
| securityRole | SecurityRole | ! |
| scopeRecord | Record | ! |
| validFrom | dateTime | ! |
| validUntil | dateTime | ? |
| grantState | Active, Revoked, Expired | ! |

### ManagementDelegation

Authorized delegation of operational responsibility, without changing asset ownership.

Parent: Record. Shape: `ManagementDelegationShape`.

| Property | Range | Cardinality |
|---|---|---|
| delegator | OperatorService | ! |
| delegate | LegalEntity | ! |
| scopeRecord | Record | ! |
| accessGrant | AccessGrant | + |
| validFrom | dateTime | ! |
| validUntil | dateTime | ? |

### CustomerAccount

Service account used for charging and commercial relationships; may represent an ad hoc customer.

Parent: Record. Shape: `CustomerAccountShape`.

| Property | Range | Cardinality |
|---|---|---|
| operatorService | OperatorService | ! |
| accountKind | Registered, AdHoc, Corporate | ! |
| accountState | Pending, Active, Suspended, Closed | ! |
| person | Person | ? |
| organization | LegalEntity | ? |
| billingProfile | BillingProfile | ? |
| preferredLanguage | string | ? |

### CustomerGroup

Group for pricing, eligibility, reporting or access; membership is explicit and temporal.

Parent: Record. Shape: `CustomerGroupShape`.

| Property | Range | Cardinality |
|---|---|---|
| operatorService | OperatorService | ! |
| groupName | string | ! |
| groupingPurpose | Access, Pricing, Reporting, Corporate | ! |

### GroupMembership

Time-bound association of a customer account with a group.

Parent: Record. Shape: `GroupMembershipShape`.

| Property | Range | Cardinality |
|---|---|---|
| customer | CustomerAccount | ! |
| customerGroup | CustomerGroup | ! |
| validFrom | dateTime | ! |
| validUntil | dateTime | ? |

### UserDevice

Client-device registration using an opaque push or device reference.

Parent: Record. Shape: `UserDeviceShape`.

| Property | Range | Cardinality |
|---|---|---|
| customer | CustomerAccount | ! |
| deviceReference | string | ! |
| platformName | string | ! |
| pushTokenReference | anyURI | ? |
| lastSeenAt | dateTime | ? |

## integration-experience

### IntegrationConnection

Configured external-service integration with a versioned contract and secret reference.

Parent: Record. Shape: `IntegrationConnectionShape`.

| Property | Range | Cardinality |
|---|---|---|
| integrationName | string | ! |
| integrationKind | Payment, Billing, Energy, Roaming, Maintenance, Telematics, Fiscalization, Other | ! |
| provider | LegalEntity | ! |
| endpointUrl | anyURI | ! |
| contractVersion | string | ! |
| credentialReference | anyURI | ! |
| integrationState | Configured, Active, Disabled, Failed | ! |

### ApiClient

Machine API identity with bounded permissions and rate-limit policy.

Parent: Record. Shape: `ApiClientShape`.

| Property | Range | Cardinality |
|---|---|---|
| principal | Principal | ! |
| accessGrant | AccessGrant | + |
| credentialReference | anyURI | ! |
| allowedNetwork | string | * |
| requestsPerMinute | positiveInteger | ! |
| requestsPerDay | positiveInteger | ! |

### EventSubscription

Subscription to domain event types over a declared transport and filtering scope.

Parent: Record. Shape: `EventSubscriptionShape`.

| Property | Range | Cardinality |
|---|---|---|
| subscriber | ApiClient | ! |
| eventType | IRI | + |
| deliveryTransport | Webhook, Kafka | ! |
| destinationReference | anyURI | ! |
| signingKeyReference | anyURI | ! |
| includeTimestampInSignature | boolean | ! |
| suppressOwnEvents | boolean | ! |
| includeRoamingAssets | boolean | ! |
| maximumAttempts | positiveInteger | ! |

### EventDelivery

Idempotent delivery attempt of one source event to one subscription.

Parent: Record. Shape: `EventDeliveryShape`.

| Property | Range | Cardinality |
|---|---|---|
| eventSubscription | EventSubscription | ! |
| sourceEvent | SourceEvent | ! |
| attemptNumber | positiveInteger | ! |
| attemptedAt | dateTime | ! |
| deliveryState | Pending, Delivered, Retrying, DeadLetter | ! |
| responseCode | integer | ? |
| nextRetryAt | dateTime | ? |
| idempotencyKey | string | ! |

### CommunicationLog

Bounded request/response metadata and evidence for external communication.

Parent: Record. Shape: `CommunicationLogShape`.

| Property | Range | Cardinality |
|---|---|---|
| wireProtocol | string | ! |
| integration | IntegrationConnection | ? |
| endpoint | ProtocolEndpoint | ? |
| sourceEvent | SourceEvent | ! |
| direction | Inbound, Outbound | ! |
| messageType | string | ! |
| correlationId | string | ! |
| protocolResponseCode | string | ? |

### PlatformSetting

Typed, scoped platform configuration, independently versioned from domain state.

Parent: Record. Shape: `PlatformSettingShape`.

| Property | Range | Cardinality |
|---|---|---|
| settingKey | string | ! |
| settingValue | string | ! |
| valueDatatype | IRI | ! |
| scopeRecord | Record | ! |
| effectiveAt | dateTime | ! |

### BrandProfile

White-label identity and locale configuration shared across customer channels.

Parent: Record. Shape: `BrandProfileShape`.

| Property | Range | Cardinality |
|---|---|---|
| brandName | string | ! |
| supportedLanguage | string | + |
| defaultLanguage | string | ! |
| logo | MediaAsset | ? |
| primaryColour | string | ? |
| supportContact | ContactProfile | ! |

### ExperienceChannel

Branded driver or partner interface and its audience/capability configuration.

Parent: Record. Shape: `ExperienceChannelShape`.

| Property | Range | Cardinality |
|---|---|---|
| brand | BrandProfile | ! |
| channelKind | DriverApp, AdHocWeb, PartnerPortal, BackOffice, Terminal, InstallerApp | ! |
| channelUrl | anyURI | ! |
| operatorService | OperatorService | ! |
| policyDocument | PolicyDocument | + |

### ContentTemplate

Localized versioned communication template with declared placeholders.

Parent: Record. Shape: `ContentTemplateShape`.

| Property | Range | Cardinality |
|---|---|---|
| templateKey | string | ! |
| templateVersion | string | ! |
| templateBody | langString | + |
| placeholderName | string | * |
| channelKind | Email, SMS, Push, Display, Document | ! |

### HelpArticle

Localized customer-help content with ordering and publication lifecycle.

Parent: Record. Shape: `HelpArticleShape`.

| Property | Range | Cardinality |
|---|---|---|
| question | langString | + |
| answer | langString | + |
| displayOrder | nonNegativeInteger | ! |
| contentState | Draft, Published, Archived | ! |

### CustomerNotification

Customer-facing message request and delivery evidence.

Parent: Record. Shape: `CustomerNotificationShape`.

| Property | Range | Cardinality |
|---|---|---|
| customer | CustomerAccount | ! |
| contentTemplate | ContentTemplate | ! |
| requestedAt | dateTime | ! |
| notificationChannel | Email, SMS, Push, InApp | ! |
| notificationState | Queued, Sent, Delivered, Failed | ! |
| sourceEvent | SourceEvent | ? |

### ApplicationInstallation

Marketplace or custom extension installed with declared permissions and version.

Parent: Record. Shape: `ApplicationInstallationShape`.

| Property | Range | Cardinality |
|---|---|---|
| applicationName | string | ! |
| applicationVersion | string | ! |
| provider | LegalEntity | ! |
| integration | IntegrationConnection | ! |
| accessGrant | AccessGrant | + |
| installationState | Installed, Enabled, Disabled, Removed | ! |

### MetricDefinition

Versioned operational or financial metric with explicit population, denominator and unit.

Parent: Record. Shape: `MetricDefinitionShape`.

| Property | Range | Cardinality |
|---|---|---|
| metricName | string | ! |
| metricVersion | string | ! |
| metricExpression | string | ! |
| expressionLanguage | string | ! |
| unitIri | IRI | ! |
| scopeClass | IRI | ! |

### MetricObservation

Calculated metric value tied to a scope, time interval and definition version.

Parent: Record. Shape: `MetricObservationShape`.

| Property | Range | Cardinality |
|---|---|---|
| metricDefinition | MetricDefinition | ! |
| scopeRecord | Record | ! |
| interval | TimeWindow | ! |
| numericValue | decimal | ! |
| calculatedAt | dateTime | ! |
| evidence | EvidenceDocument | + |

### AssistantRecommendation

AI-assisted operational suggestion with evidence and a separate action approval trail.

Parent: Record. Shape: `AssistantRecommendationShape`.

| Property | Range | Cardinality |
|---|---|---|
| requestedBy | Principal | ! |
| affectedRecord | Record | + |
| generatedAt | dateTime | ! |
| recommendationText | string | ! |
| modelReference | string | ! |
| evidence | EvidenceDocument | + |
| proposedCommand | RemoteCommand | ? |

### ActionApproval

Human approval or rejection of an assistant-proposed operation; never implied by a suggestion.

Parent: Record. Shape: `ActionApprovalShape`.

| Property | Range | Cardinality |
|---|---|---|
| recommendation | AssistantRecommendation | ! |
| approver | Principal | ! |
| approvalDecision | Approved, Rejected | ! |
| decidedAt | dateTime | ! |
| approvedCommand | RemoteCommand | ? |

## operations

### VendorFaultDefinition

Vendor-scoped fault meaning, severity and recommended customer or operator response.

Parent: Record. Shape: `VendorFaultDefinitionShape`.

| Property | Range | Cardinality |
|---|---|---|
| manufacturer | Manufacturer | ! |
| faultCode | string | ! |
| faultDescription | langString | + |
| recommendedAction | langString | * |
| faultSeverity | Info, Warning, Critical | ! |

### Issue

Operational problem with affected assets, chronology, severity and resolution evidence.

Parent: Record. Shape: `IssueShape`.

| Property | Range | Cardinality |
|---|---|---|
| affectedRecord | Record | + |
| issueKind | Hardware, Connectivity, Payment, Roaming, Security, Other | ! |
| issueState | Open, Acknowledged, Investigating, Resolved, Closed | ! |
| severity | Info, Warning, Critical | ! |
| openedAt | dateTime | ! |
| resolvedAt | dateTime | ? |
| vendorFault | VendorFaultDefinition | ? |
| resolutionNote | string | ? |

### RecoveryPolicy

Bounded automated recovery procedure with eligibility, attempts and escalation.

Parent: Record. Shape: `RecoveryPolicyShape`.

| Property | Range | Cardinality |
|---|---|---|
| policyName | string | ! |
| triggeringFault | VendorFaultDefinition | * |
| recoveryAction | IRI | + |
| maximumAttempts | positiveInteger | ! |
| cooldownSeconds | nonNegativeInteger | ! |
| escalationRole | SecurityRole | ! |

### RecoveryAttempt

Audited recovery action linked to an issue and policy.

Parent: Record. Shape: `RecoveryAttemptShape`.

| Property | Range | Cardinality |
|---|---|---|
| issue | Issue | ! |
| recoveryPolicy | RecoveryPolicy | ! |
| command | RemoteCommand | ! |
| attemptNumber | positiveInteger | ! |
| attemptedAt | dateTime | ! |
| recoveryResult | Pending, Succeeded, Failed, Escalated | ! |

### WorkOrder

Accountable maintenance assignment with scope, provider and completion evidence.

Parent: Record. Shape: `WorkOrderShape`.

| Property | Range | Cardinality |
|---|---|---|
| maintenanceProvider | LegalEntity | ! |
| affectedRecord | Record | + |
| issue | Issue | ? |
| assignedPrincipal | Principal | ? |
| workState | New, Assigned, InProgress, Completed, Cancelled | ! |
| dueAt | dateTime | ! |
| completedAt | dateTime | ? |
| completionEvidence | EvidenceDocument | * |

### InstallationJob

Commissioning task with installer organization, location, equipment and acceptance result.

Parent: Record. Shape: `InstallationJobShape`.

| Property | Range | Cardinality |
|---|---|---|
| installationCompany | LegalEntity | ! |
| site | ChargingSite | ! |
| station | ChargingStation | + |
| assignedPrincipal | Principal | ? |
| jobState | Planned, Assigned, InProgress, Completed, Rejected | ! |
| scheduledAt | dateTime | ! |
| completedAt | dateTime | ? |
| commissioningEvidence | EvidenceDocument | * |

### OperationalPeriod

Interval included in a precisely defined operational availability denominator.

Parent: Record. Shape: `OperationalPeriodShape`.

| Property | Range | Cardinality |
|---|---|---|
| observedAsset | Record | ! |
| interval | TimeWindow | ! |
| availabilityPolicy | AvailabilityPolicy | ! |

### DowntimePeriod

Planned or unplanned unavailability with cause and notice; exclusions are policy-specific.

Parent: Record. Shape: `DowntimePeriodShape`.

| Property | Range | Cardinality |
|---|---|---|
| observedAsset | Record | ! |
| interval | TimeWindow | ! |
| downtimeKind | Planned, Unplanned | ! |
| reasonCode | string | ! |
| serviceNotice | ServiceNotice | ? |
| downtimeState | Scheduled, Active, Completed, Cancelled | ! |

### AvailabilityPolicy

Versioned definition of downtime inclusion, exclusions and freshness.

Parent: Record. Shape: `AvailabilityPolicyShape`.

| Property | Range | Cardinality |
|---|---|---|
| policyName | string | ! |
| policyVersion | string | ! |
| includePlannedDowntime | boolean | ! |
| staleAfterSeconds | positiveInteger | ! |
| calculationExpression | string | ! |

### AvailabilityResult

Calculated uptime evidence using a stated denominator and policy.

Parent: Record. Shape: `AvailabilityResultShape`.

| Property | Range | Cardinality |
|---|---|---|
| observedAsset | Record | ! |
| interval | TimeWindow | ! |
| availabilityPolicy | AvailabilityPolicy | ! |
| eligibleSeconds | decimal | ! |
| unavailableSeconds | decimal | ! |
| availabilityFraction | decimal | ! |
| calculatedAt | dateTime | ! |

## partners-settlement

### ServiceAgreement

Versioned contract defining supplier, counterparty, assets, responsibilities and charging economics.

Parent: Record. Shape: `ServiceAgreementShape`.

| Property | Range | Cardinality |
|---|---|---|
| supplier | LegalEntity | ! |
| counterparty | LegalEntity | ! |
| agreementReference | string | ! |
| agreementVersion | string | ! |
| validFrom | dateTime | ! |
| validUntil | dateTime | ? |
| coveredRecord | Record | + |
| revenueShareRule | RevenueShareRule | * |
| costAllocationRule | CostAllocationRule | * |
| agreementEvidence | EvidenceDocument | ! |
| autoRenewal | boolean | ? |
| platformFee | CustomFee | * |

### RevenueShareRule

Contractual allocation of a defined revenue base to a beneficiary.

Parent: Record. Shape: `RevenueShareRuleShape`.

| Property | Range | Cardinality |
|---|---|---|
| beneficiary | LegalEntity | ! |
| shareFraction | decimal | ! |
| revenueBasis | NetCharging, EnergyMargin, FixedFee, GrossCharging | ! |
| fixedAmount | decimal | ? |
| currency | Currency | ? |
| applicableTariff | TariffVersion | ? |

### CostAllocationRule

Contract cost responsibility for a category and beneficiary.

Parent: Record. Shape: `CostAllocationRuleShape`.

| Property | Range | Cardinality |
|---|---|---|
| responsibleParty | LegalEntity | ! |
| costCategory | Energy, Maintenance, Platform, Payment, Roaming, Other | ! |
| allocationFraction | decimal | ! |
| fixedAmount | decimal | ? |
| currency | Currency | ? |

### SettlementOverride

Time-scoped exception to a contract settlement rule with authorization evidence.

Parent: Record. Shape: `SettlementOverrideShape`.

| Property | Range | Cardinality |
|---|---|---|
| serviceAgreement | ServiceAgreement | ! |
| interval | TimeWindow | ! |
| overrideReason | string | ! |
| approvedBy | Principal | ! |
| revenueShareRule | RevenueShareRule | ? |
| costAllocationRule | CostAllocationRule | ? |

### SettlementBatch

Partner receivable/payable reconciliation over a defined period and currency.

Parent: Record. Shape: `SettlementBatchShape`.

| Property | Range | Cardinality |
|---|---|---|
| serviceAgreement | ServiceAgreement | ! |
| period | TimeWindow | ! |
| currency | Currency | ! |
| settlementItem | SettlementItem | + |
| netAmount | decimal | ! |
| taxAmount | decimal | ! |
| grossAmount | decimal | ! |
| settlementState | Draft, Calculated, Approved, Invoiced, Settled, Disputed | ! |
| invoice | Invoice | ? |

### SettlementItem

Individual charge or adjustment attributed under a contract.

Parent: Record. Shape: `SettlementItemShape`.

| Property | Range | Cardinality |
|---|---|---|
| serviceAgreement | ServiceAgreement | ! |
| chargeRecord | ChargeDetailRecord | ? |
| adjustmentReason | string | ? |
| currency | Currency | ! |
| netAmount | decimal | ! |
| taxAmount | decimal | ! |
| grossAmount | decimal | ! |
| beneficiary | LegalEntity | ! |

### ReconciliationCase

Mismatch between expected and observed usage or money with resolution evidence.

Parent: Record. Shape: `ReconciliationCaseShape`.

| Property | Range | Cardinality |
|---|---|---|
| expectedRecord | Record | ! |
| observedRecord | Record | ! |
| mismatchKind | Missing, Duplicate, Energy, Price, Tax, Currency, Payment, Other | ! |
| caseState | Open, Investigating, Resolved, Rejected | ! |
| openedAt | dateTime | ! |
| resolutionNote | string | ? |
| resolvedAt | dateTime | ? |

### PartnerInvitation

Invitation connecting a customer to a partner account and applicable access/billing policies.

Parent: Record. Shape: `PartnerInvitationShape`.

| Property | Range | Cardinality |
|---|---|---|
| partner | LegalEntity | ! |
| inviteeReference | string | ! |
| invitationState | Pending, Accepted, Declined, Expired, Revoked | ! |
| accessPolicy | SiteAccessPolicy | ? |
| corporateBillingPolicy | CorporateBillingPolicy | ? |
| expiresAt | dateTime | ! |

### CorporateBillingPolicy

Versioned rules deciding which costs a corporate sponsor covers.

Parent: Record. Shape: `CorporateBillingPolicyShape`.

| Property | Range | Cardinality |
|---|---|---|
| sponsor | LegalEntity | ! |
| policyName | string | ! |
| policyVersion | string | ! |
| coverageMode | Full, Limited, None | ! |
| individualPeriodLimit | decimal | ? |
| currency | Currency | ! |
| costCapPerKWh | decimal | ? |
| eligibleGroup | CustomerGroup | * |
| pricingCondition | PricingCondition | * |
| corporateChargerRule | CorporateChargerRule | * |
| policyState | Active, Disabled | ! |

### CorporateChargerRule

AC/DC-specific sponsor coverage overriding general cost coverage terms.

Parent: Record. Shape: `CorporateChargerRuleShape`.

| Property | Range | Cardinality |
|---|---|---|
| currentKind | AC, DC | ! |
| coverageMode | Full, Limited, None | ! |
| costCapPerKWh | decimal | ? |
| maximumEnergyUnitPrice | decimal | ? |
| maximumIdleUnitPrice | decimal | ? |
| maximumFlatFee | decimal | ? |

### CorporateBillingSnapshot

Immutable corporate policy selection captured for a charging session.

Parent: Record. Shape: `CorporateBillingSnapshotShape`.

| Property | Range | Cardinality |
|---|---|---|
| corporateBillingPolicy | CorporateBillingPolicy | ! |
| policyVersion | string | ! |
| snapshotDigest | string | ! |
| session | ChargingSession | ! |
| capturedAt | dateTime | ! |

### CorporateCostAllocation

Split of an eligible session charge between sponsor and driver.

Parent: Record. Shape: `CorporateCostAllocationShape`.

| Property | Range | Cardinality |
|---|---|---|
| session | ChargingSession | ! |
| corporateSnapshot | CorporateBillingSnapshot | ! |
| currency | Currency | ! |
| totalAmount | decimal | ! |
| sponsorAmount | decimal | ! |
| driverAmount | decimal | ! |
| calculationVersion | string | ! |

### ReimbursementPolicy

Date-based home-charge reimbursement rate selection policy.

Parent: Record. Shape: `ReimbursementPolicyShape`.

| Property | Range | Cardinality |
|---|---|---|
| policyName | string | ! |
| reimbursementRateSource | Policy, Station | ! |
| electricitySchedule | ElectricityPriceSchedule | ? |
| validFromDate | date | ! |
| validUntilDate | date | ? |
| partner | LegalEntity | ? |
| serviceAgreement | ServiceAgreement | ? |

### ReimbursementRecord

Home-charging reimbursement calculation with immutable rate evidence.

Parent: Record. Shape: `ReimbursementRecordShape`.

| Property | Range | Cardinality |
|---|---|---|
| session | ChargingSession | ! |
| reimbursementPolicy | ReimbursementPolicy | ! |
| beneficiaryAccount | CustomerAccount | ! |
| currency | Currency | ! |
| reimbursableEnergyKWh | decimal | ! |
| reimbursementRate | decimal | ! |
| reimbursementAmount | decimal | ! |
| reimbursementState | Calculated, Approved, Paid, Credited, Disputed | ! |
| calculatedAt | dateTime | ! |
| correctionOf | ReimbursementRecord | ? |
| reimbursementTaxCalculation | ReimbursementTaxCalculation | ? |
| payout | Payout | ? |

### ReimbursementReport

Period aggregation of reimbursement records for one payer and currency.

Parent: Record. Shape: `ReimbursementReportShape`.

| Property | Range | Cardinality |
|---|---|---|
| payer | LegalEntity | ! |
| period | TimeWindow | ! |
| currency | Currency | ! |
| reimbursementRecord | ReimbursementRecord | + |
| totalAmount | decimal | ! |
| reportState | Draft, Approved, Paid, Replaced | ! |

### ReimbursementTaxCalculation

Explicit tax interpretation and rounded monetary breakdown of a reimbursement.

Parent: Record. Shape: `ReimbursementTaxCalculationShape`.

| Property | Range | Cardinality |
|---|---|---|
| taxBasis | Inclusive, Exclusive, Exempt | ! |
| taxRatePercent | decimal | ! |
| netAmount | decimal | ! |
| taxAmount | decimal | ! |
| grossAmount | decimal | ! |
| currency | Currency | ! |
| taxDetermination | TaxDetermination | ? |

## payments-ledger

### PaymentInstrument

PSP or account reference for payment; never a primary card number or secret.

Parent: Record. Shape: `PaymentInstrumentShape`.

| Property | Range | Cardinality |
|---|---|---|
| customer | CustomerAccount | ? |
| instrumentKind | Card, Wallet, BankTransfer, Corporate, External | ! |
| provider | LegalEntity | ! |
| providerInstrumentReference | string | ! |
| instrumentState | Active, Expired, Revoked | ! |
| expiryMonth | string | ? |

### PaymentIntent

Commercial obligation to collect money with provider-independent lifecycle.

Parent: Record. Shape: `PaymentIntentShape`.

| Property | Range | Cardinality |
|---|---|---|
| customer | CustomerAccount | ? |
| session | ChargingSession | ? |
| invoice | Invoice | ? |
| paymentInstrument | PaymentInstrument | ! |
| currency | Currency | ! |
| requestedAmount | decimal | ! |
| paymentState | Created, Authorized, PartiallyCaptured, Captured, Failed, Cancelled, Refunded | ! |
| idempotencyKey | string | ! |
| providerOrderReference | string | ? |
| paymentRouting | PaymentRouting | ? |

### PaymentAuthorization

PSP authorization or preauthorization; does not prove capture.

Parent: Record. Shape: `PaymentAuthorizationShape`.

| Property | Range | Cardinality |
|---|---|---|
| paymentIntent | PaymentIntent | ! |
| authorizedAmount | decimal | ! |
| currency | Currency | ! |
| authorizedAt | dateTime | ! |
| expiresAt | dateTime | ! |
| providerReference | string | ! |
| authorizationState | Approved, Declined, Voided, Expired | ! |

### PaymentCapture

Confirmed or pending capture against a payment intent.

Parent: Record. Shape: `PaymentCaptureShape`.

| Property | Range | Cardinality |
|---|---|---|
| paymentIntent | PaymentIntent | ! |
| paymentAuthorization | PaymentAuthorization | ? |
| capturedAmount | decimal | ! |
| currency | Currency | ! |
| capturedAt | dateTime | ! |
| captureState | Pending, Confirmed, Failed | ! |
| providerReference | string | ! |
| idempotencyKey | string | ! |

### Refund

Payment reversal request and result linked to one original capture.

Parent: Record. Shape: `RefundShape`.

| Property | Range | Cardinality |
|---|---|---|
| paymentCapture | PaymentCapture | ! |
| refundAmount | decimal | ! |
| currency | Currency | ! |
| refundReason | string | ! |
| refundState | Pending, Confirmed, Failed | ! |
| requestedAt | dateTime | ! |
| providerReference | string | ! |

### Chargeback

Dispute raised through a payment provider with evidential deadline and outcome.

Parent: Record. Shape: `ChargebackShape`.

| Property | Range | Cardinality |
|---|---|---|
| paymentCapture | PaymentCapture | ! |
| disputedAmount | decimal | ! |
| currency | Currency | ! |
| reasonCode | string | ! |
| responseDueAt | dateTime | ! |
| disputeState | Open, Submitted, Won, Lost, Closed | ! |
| evidence | EvidenceDocument | * |

### Wallet

Customer monetary balance projection, backed by immutable ledger entries.

Parent: Record. Shape: `WalletShape`.

| Property | Range | Cardinality |
|---|---|---|
| customer | CustomerAccount | ! |
| currency | Currency | ! |
| balanceAmount | decimal | ! |
| balanceAsOf | dateTime | ! |
| walletState | Active, Frozen, Closed | ! |

### WalletEntry

Signed customer balance movement linked to immutable journal evidence.

Parent: Record. Shape: `WalletEntryShape`.

| Property | Range | Cardinality |
|---|---|---|
| wallet | Wallet | ! |
| signedAmount | decimal | ! |
| recordedAt | dateTime | ! |
| entryReason | TopUp, Charge, Refund, Adjustment, Voucher | ! |
| journal | Journal | ! |
| idempotencyKey | string | ! |

### LedgerAccount

Currency-specific accounting account within a tenant ledger.

Parent: Record. Shape: `LedgerAccountShape`.

| Property | Range | Cardinality |
|---|---|---|
| accountCode | string | ! |
| accountCategory | Asset, Liability, Income, Expense, Equity | ! |
| currency | Currency | ! |
| ownerParty | LegalEntity | ! |

### Journal

Balanced accounting posting group; posted entries are immutable.

Parent: Record. Shape: `JournalShape`.

| Property | Range | Cardinality |
|---|---|---|
| postedAt | dateTime | ! |
| journalState | Draft, Posted, Reversed | ! |
| journalLine | JournalLine | + |
| postingReference | string | ! |
| reversalOf | Journal | ? |

### JournalLine

Signed debit-positive accounting amount in one currency account.

Parent: Record. Shape: `JournalLineShape`.

| Property | Range | Cardinality |
|---|---|---|
| ledgerAccount | LedgerAccount | ! |
| signedAmount | decimal | ! |
| currency | Currency | ! |
| lineDescription | langString | + |

### TopUpOffer

Purchase offer for funding a wallet, separating purchase price and credited value.

Parent: Record. Shape: `TopUpOfferShape`.

| Property | Range | Cardinality |
|---|---|---|
| offerName | langString | + |
| currency | Currency | ! |
| purchaseAmount | decimal | ! |
| creditAmount | decimal | ! |
| validFrom | dateTime | ! |
| validUntil | dateTime | ? |

### Voucher

Monetary redemption instrument with opaque code reference and finite redemption terms.

Parent: Record. Shape: `VoucherShape`.

| Property | Range | Cardinality |
|---|---|---|
| voucherCodeReference | anyURI | ! |
| currency | Currency | ! |
| faceValue | decimal | ! |
| validFrom | dateTime | ! |
| validUntil | dateTime | ! |
| redemptionLimit | positiveInteger | ! |
| voucherState | Active, Redeemed, Cancelled, Expired | ! |

### VoucherRedemption

Recorded application of voucher value to a customer's wallet.

Parent: Record. Shape: `VoucherRedemptionShape`.

| Property | Range | Cardinality |
|---|---|---|
| voucher | Voucher | ! |
| wallet | Wallet | ! |
| redeemedAmount | decimal | ! |
| redeemedAt | dateTime | ! |
| idempotencyKey | string | ! |
| walletEntry | WalletEntry | ! |

### PaymentTerminal

Payment device serving exactly one station or charging area.

Parent: Record. Shape: `PaymentTerminalShape`.

| Property | Range | Cardinality |
|---|---|---|
| terminalName | string | ! |
| terminalSerial | string | ! |
| terminalType | string | ! |
| integration | IntegrationConnection | ! |
| station | ChargingStation | ? |
| area | ChargingArea | ? |
| preauthorizationAmount | decimal | ? |
| currency | Currency | ! |
| supportedLanguage | string | + |
| displayTemplate | ContentTemplate | ? |

### FinancialAccountReference

Payment-provider or vault reference to bank details with masked display values; raw credentials are not required in the graph.

Parent: Record. Shape: `FinancialAccountReferenceShape`.

| Property | Range | Cardinality |
|---|---|---|
| accountHolder | LegalEntity | ! |
| accountReference | string | ! |
| accountScheme | IBAN, Domestic, Provider | ! |
| maskedAccount | string | ! |
| bankCountryCode | string | ? |
| bankIdentifierCode | string | ? |

### PaymentRouting

Deterministic choice of payment service and merchant account for a transaction.

Parent: Record. Shape: `PaymentRoutingShape`.

| Property | Range | Cardinality |
|---|---|---|
| integrationConnection | IntegrationConnection | ! |
| merchantAccountReference | string | ! |
| routePriority | integer | ! |
| pricingCondition | PricingCondition | * |

### Payout

Disbursement to a beneficiary account, distinct from collection of a driver's payment.

Parent: Record. Shape: `PayoutShape`.

| Property | Range | Cardinality |
|---|---|---|
| beneficiary | LegalEntity | ! |
| financialAccount | FinancialAccountReference | ! |
| currency | Currency | ! |
| payoutAmount | decimal | ! |
| payoutState | Scheduled, Submitted, Confirmed, Failed, Reversed | ! |
| payoutReference | string | ! |
| scheduledAt | dateTime | ! |
| confirmedAt | dateTime | ? |
| settlementBatch | SettlementBatch | ? |
| reimbursementRecord | ReimbursementRecord | * |

### PayoutBatch

Currency-specific group of disbursements for a funding entity and execution date.

Parent: Record. Shape: `PayoutBatchShape`.

| Property | Range | Cardinality |
|---|---|---|
| fundingParty | LegalEntity | ! |
| currency | Currency | ! |
| payout | Payout | + |
| batchTotal | decimal | ! |
| scheduledAt | dateTime | ! |

## places

### ChargingSite

Physical place containing charging infrastructure, separated from its public listing.

Parent: Record. Shape: `ChargingSiteShape`.

| Property | Range | Cardinality |
|---|---|---|
| siteName | langString | + |
| address | Address | ! |
| position | GeoPosition | ! |
| timezoneName | string | ! |
| siteHost | LegalEntity | ? |
| openingWindow | RecurringWindow | * |
| serviceNotice | ServiceNotice | * |
| siteAccessPolicy | SiteAccessPolicy | ? |

### ChargingArea

Named subdivision of a physical charging site.

Parent: Record. Shape: `ChargingAreaShape`.

| Property | Range | Cardinality |
|---|---|---|
| site | ChargingSite | ! |
| areaName | langString | + |
| parkingSpace | ParkingSpace | * |
| terminal | PaymentTerminal | * |

### ParkingSpace

Physical parking bay that can serve one or more reachable charging units.

Parent: Record. Shape: `ParkingSpaceShape`.

| Property | Range | Cardinality |
|---|---|---|
| site | ChargingSite | ! |
| area | ChargingArea | ? |
| bayReference | string | ! |
| accessibleBay | boolean | ! |
| servesUnit | ChargingUnit | + |
| occupancy | Unknown, Vacant, Occupied, Blocked | ! |
| occupancyObservedAt | dateTime | ! |

### PublicListing

Published representation of a site for discovery or roaming, with audience and publication state.

Parent: Record. Shape: `PublicListingShape`.

| Property | Range | Cardinality |
|---|---|---|
| site | ChargingSite | ! |
| operatorService | OperatorService | ! |
| listingState | Draft, Published, Withdrawn | ! |
| publicName | langString | + |
| accessibility | Public, Restricted, Private | ! |
| parkingCategory | string | ? |
| facilityCode | string | * |
| paymentOptionCode | string | * |
| paymentOptionsKnowledge | Unknown, Known | ! |
| paymentBrandCode | string | * |
| media | MediaAsset | * |
| publishedAt | dateTime | ? |

### SiteAccessPolicy

Rules for physical or service access, independent of map visibility.

Parent: Record. Shape: `SiteAccessPolicyShape`.

| Property | Range | Cardinality |
|---|---|---|
| accessMode | Open, AllowList, DenyList, Private | ! |
| eligibleGroup | CustomerGroup | * |
| credentialMethod | string | * |
| openingWindow | RecurringWindow | * |
| stopOutsideOpening | boolean | ! |

### ServiceNotice

Localized customer information with severity and effective interval.

Parent: Record. Shape: `ServiceNoticeShape`.

| Property | Range | Cardinality |
|---|---|---|
| noticeText | langString | + |
| noticeSeverity | Information, Warning, Unavailable | ! |
| validFrom | dateTime | ! |
| validUntil | dateTime | ? |
| affectedRecord | Record | * |

### MediaAsset

Image or media associated with a place or brand, with rights and language metadata.

Parent: Record. Shape: `MediaAssetShape`.

| Property | Range | Cardinality |
|---|---|---|
| mediaUrl | anyURI | ! |
| mediaType | string | ! |
| altText | langString | + |
| rightsStatement | string | ! |

### SharingAgreement

Time-limited sharing of an asset with an account or partner, preserving ownership.

Parent: Record. Shape: `SharingAgreementShape`.

| Property | Range | Cardinality |
|---|---|---|
| sharedRecord | Record | ! |
| sharingParty | LegalEntity | ! |
| beneficiary | Record | ! |
| accessGrant | AccessGrant | ? |
| validFrom | dateTime | ! |
| validUntil | dateTime | ? |

### SharingInvitation

Invitation to accept asset access; stores a secret reference rather than an invitation token.

Parent: Record. Shape: `SharingInvitationShape`.

| Property | Range | Cardinality |
|---|---|---|
| sharedRecord | Record | ! |
| inviter | Principal | ! |
| inviteeReference | string | ! |
| invitationState | Pending, Accepted, Declined, Expired, Revoked | ! |
| expiresAt | dateTime | ! |
| invitationSecretReference | anyURI | ! |
| sharingAgreement | SharingAgreement | ? |

## pricing

### Tariff

Stable identity of a commercial pricing offer whose versions hold the immutable terms.

Parent: Record. Shape: `TariffShape`.

| Property | Range | Cardinality |
|---|---|---|
| operatorService | OperatorService | ! |
| tariffName | langString | + |
| tariffPurpose | Retail, Wholesale, Reimbursement, Internal | ! |
| tariffState | Draft, Active, Retired | ! |

### TariffVersion

Immutable price definition including effective window, currency and component rules.

Parent: Record. Shape: `TariffVersionShape`.

| Property | Range | Cardinality |
|---|---|---|
| tariff | Tariff | ! |
| versionTag | string | ! |
| validFrom | dateTime | ! |
| validUntil | dateTime | ? |
| currency | Currency | ! |
| tariffMode | Priced, Free, Prohibited, DiscountBased, Dynamic | ! |
| priceComponent | PriceComponent | * |
| pricingCondition | PricingCondition | * |
| baseTariffVersion | TariffVersion | ? |
| dynamicPriceFormula | DynamicPriceFormula | ? |
| priceDisplay | PriceDisplay | ? |
| roundingPolicy | RoundingPolicy | ! |
| snapshotDigest | string | ! |
| discountRule | DiscountRule | * |
| sessionPricingPolicy | SessionPricingPolicy | ? |
| preauthorizationPolicy | PreauthorizationPolicy | ? |
| subsidyRule | SubsidyRule | * |
| baseTariffSelection | Explicit, SetBase, RoamingWholesale | ? |

### PriceComponent

Charge dimension with explicit unit price, billing increment and thresholds.

Parent: Record. Shape: `PriceComponentShape`.

| Property | Range | Cardinality |
|---|---|---|
| priceDimension | EnergyImport, EnergyExport, ChargingTime, ParkingTime, IdleTime, Flat, Connection, ServiceFee | ! |
| unitPrice | decimal | ! |
| unitIri | IRI | ! |
| billingStep | decimal | ! |
| taxRule | TaxRule | ? |
| minimumQuantity | decimal | ? |
| maximumQuantity | decimal | ? |
| graceQuantity | decimal | ? |
| pricingCondition | PricingCondition | * |
| feeBounds | FeeBounds | ? |
| priceTier | PriceTier | * |
| priceFreezePolicy | PriceFreezePolicy | ? |
| graceMode | FromStart, AfterCharging, AfterGrace | ? |

### PricingCondition

Typed eligibility predicate for a pricing rule, using an explicit comparator and typed value.

Parent: Record. Shape: `PricingConditionShape`.

| Property | Range | Cardinality |
|---|---|---|
| conditionDimension | CustomerGroup, Location, TimeWindow, Energy, Duration, Power, Current, StateOfCharge, Weekday, Reservation, ConnectorKind, Partner | ! |
| comparisonOperator | Equal, In, NotIn, GreaterOrEqual, LessThan, Between | ! |
| comparisonValue | string | ! |
| comparisonDatatype | IRI | ! |
| relatedRecord | Record | * |
| priority | integer | ! |
| measurementAggregation | Instantaneous, Average, Peak | ? |
| measurementWindowSeconds | positiveInteger | ? |
| unitIri | IRI | ? |

### TariffSet

Ordered candidate selection policy, with explicit default and offline pricing.

Parent: Record. Shape: `TariffSetShape`.

| Property | Range | Cardinality |
|---|---|---|
| operatorService | OperatorService | ! |
| setName | string | ! |
| defaultTariff | TariffVersion | ! |
| offlineTariff | TariffVersion | ? |
| tariffAssignment | TariffAssignment | + |
| selectionStrategy | HighestPriorityFirst | ! |

### TariffAssignment

Membership of a tariff version in a selection set, with explicit priority.

Parent: Record. Shape: `TariffAssignmentShape`.

| Property | Range | Cardinality |
|---|---|---|
| assignedTariff | TariffVersion | ! |
| priority | integer | ! |
| eligibleGroup | CustomerGroup | * |
| pricingCondition | PricingCondition | * |

### TariffResolution

Recorded result of price selection, including input evidence and resolver version.

Parent: Record. Shape: `TariffResolutionShape`.

| Property | Range | Cardinality |
|---|---|---|
| session | ChargingSession | ! |
| tariffSet | TariffSet | ! |
| selectedTariff | TariffVersion | ! |
| resolvedAt | dateTime | ! |
| resolverVersion | string | ! |
| decisionExplanation | string | ! |
| resolvedBaseTariff | TariffVersion | ? |

### ScheduledTariffChange

Future activation of a tariff version with accountable scheduling and outcome.

Parent: Record. Shape: `ScheduledTariffChangeShape`.

| Property | Range | Cardinality |
|---|---|---|
| tariff | Tariff | ! |
| nextTariffVersion | TariffVersion | ! |
| effectiveAt | dateTime | ! |
| changeState | Scheduled, Applied, Cancelled, Failed | ! |
| requestedBy | Principal | ! |

### DynamicPriceFormula

Versioned formula referencing price feeds, markup and fallback; executable implementation is external.

Parent: Record. Shape: `DynamicPriceFormulaShape`.

| Property | Range | Cardinality |
|---|---|---|
| formulaExpression | string | ! |
| formulaLanguage | string | ! |
| electricitySchedule | ElectricityPriceSchedule | ! |
| fallbackUnitPrice | decimal | ! |
| minimumUnitPrice | decimal | ? |
| maximumUnitPrice | decimal | ? |
| calculationVersion | string | ! |
| fixedMarkup | decimal | ? |
| percentageMarkup | decimal | ? |
| fallbackSchedule | ElectricityPriceSchedule | ? |

### ElectricityPriceSchedule

Energy procurement price source, distinct from customer charging tariffs.

Parent: Record. Shape: `ElectricityPriceScheduleShape`.

| Property | Range | Cardinality |
|---|---|---|
| scheduleName | string | ! |
| utilityParty | LegalEntity | ? |
| currency | Currency | ! |
| pricingMode | Fixed, TimeOfUse, MarketIndexed | ! |
| defaultUnitPrice | decimal | ! |
| priceInterval | ElectricityPriceInterval | * |
| energyMix | EnergyMix | ? |
| timezoneName | string | ! |

### ElectricityPriceInterval

Price for an explicit interval or recurring local window; one timing form is required.

Parent: Record. Shape: `ElectricityPriceIntervalShape`.

| Property | Range | Cardinality |
|---|---|---|
| interval | TimeWindow | ? |
| recurringWindow | RecurringWindow | ? |
| unitPrice | decimal | ! |
| unitIri | IRI | ! |
| quotedAt | dateTime | ! |

### EnergyMix

Attributed electricity generation mix with period and evidential origin.

Parent: Record. Shape: `EnergyMixShape`.

| Property | Range | Cardinality |
|---|---|---|
| mixName | string | ! |
| sourceShare | EnergySourceShare | + |
| reportingPeriod | TimeWindow | ! |
| evidence | EvidenceDocument | + |

### EnergySourceShare

Fraction of generation from one energy source.

Parent: Record. Shape: `EnergySourceShareShape`.

| Property | Range | Cardinality |
|---|---|---|
| energySource | Solar, Wind, Hydro, Biomass, Nuclear, Gas, Coal, Other | ! |
| shareFraction | decimal | ! |

### PriceDisplay

Localized pre-session price disclosure and the tariff version it describes.

Parent: Record. Shape: `PriceDisplayShape`.

| Property | Range | Cardinality |
|---|---|---|
| displayText | langString | + |
| displayCurrency | Currency | ! |
| includesTax | boolean | ! |
| disclosureChannel | App, Web, Terminal, StationDisplay, Printed | ! |
| effectiveAt | dateTime | ! |

### RoundingPolicy

Explicit rounding mode and granularity for reproducible commercial calculations.

Parent: Record. Shape: `RoundingPolicyShape`.

| Property | Range | Cardinality |
|---|---|---|
| roundingMode | HalfUp, HalfEven, Down, Up | ! |
| decimalPlaces | nonNegativeInteger | ! |
| roundingStage | Component, Line, Invoice | ! |

### SessionLimitPolicy

Limits on charging start or continuation with an explicit enforcement outcome.

Parent: Record. Shape: `SessionLimitPolicyShape`.

| Property | Range | Cardinality |
|---|---|---|
| limitDimension | Energy, Duration, Cost, Balance, OpeningHours | ! |
| limitValue | decimal | ! |
| unitIri | IRI | ! |
| enforcement | RejectStart, RequestStop, Notify | ! |
| applicableTariff | TariffVersion | ? |

### DiscountRule

Explicit reduction applied to selected price dimensions or a session total; computation order is part of the policy.

Parent: Record. Shape: `DiscountRuleShape`.

| Property | Range | Cardinality |
|---|---|---|
| discountBasis | Percentage, FixedPerUnit, FixedTotal | ! |
| discountMagnitude | decimal | ! |
| affectedDimension | EnergyImport, EnergyExport, ChargingTime, ParkingTime, IdleTime, Flat, Connection, ServiceFee, MinimumCharge, Total | + |
| discountOrder | integer | ! |
| pricingCondition | PricingCondition | * |

### FeeBounds

Currency-denominated cap and minimum with an optional quantity cap for one price component.

Parent: Record. Shape: `FeeBoundsShape`.

| Property | Range | Cardinality |
|---|---|---|
| minimumCharge | decimal | ? |
| maximumCharge | decimal | ? |
| maximumBillableQuantity | decimal | ? |
| currency | Currency | ! |

### PriceTier

Tier in a component's piecewise price schedule with explicit accumulation semantics.

Parent: Record. Shape: `PriceTierShape`.

| Property | Range | Cardinality |
|---|---|---|
| tierLowerBound | decimal | ! |
| tierUpperBound | decimal | ? |
| tierUnitPrice | decimal | ! |
| tierMode | Graduated, WholeQuantity | ! |
| pricingCondition | PricingCondition | * |

### PriceFreezePolicy

Defines when a component's selected unit price is frozen, independently of quantities and tax.

Parent: Record. Shape: `PriceFreezePolicyShape`.

| Property | Range | Cardinality |
|---|---|---|
| freezeMoment | SessionStart, PeriodStart, Continuously | ! |
| priceDimension | EnergyImport, EnergyExport, ChargingTime, ParkingTime, IdleTime, Flat, Connection, ServiceFee | ! |

### SessionPricingPolicy

Session-wide floor, ceiling, fee eligibility and ordered component evaluation policy.

Parent: Record. Shape: `SessionPricingPolicyShape`.

| Property | Range | Cardinality |
|---|---|---|
| currency | Currency | ! |
| minimumSessionCharge | decimal | ? |
| maximumSessionCharge | decimal | ? |
| minimumConnectionDurationSeconds | nonNegativeInteger | ? |
| minimumConnectionEnergyKWh | decimal | ? |
| optimizedPriceThreshold | decimal | ? |
| optimizedUnitPrice | decimal | ? |
| optimizedLabel | langString | * |
| evaluationVersion | string | ! |

### PreauthorizationPolicy

Payment hold policy separated from the tariff's actual charge calculation.

Parent: Record. Shape: `PreauthorizationPolicyShape`.

| Property | Range | Cardinality |
|---|---|---|
| currency | Currency | ! |
| initialHoldAmount | decimal | ! |
| incrementalHoldAmount | decimal | ? |
| holdTimeoutSeconds | positiveInteger | ! |
| failureAction | StopCharging, RejectStart, AllowWithRisk | ! |

### SubsidyRule

Externally funded reduction with a beneficiary, policy version and optional integration authority.

Parent: Record. Shape: `SubsidyRuleShape`.

| Property | Range | Cardinality |
|---|---|---|
| fundingParty | LegalEntity | ! |
| subsidyBasis | FixedPerUnit, Percentage, FixedTotal | ! |
| subsidyValue | decimal | ! |
| subsidyPolicyVersion | string | ! |
| integrationConnection | IntegrationConnection | ? |
| pricingCondition | PricingCondition | * |

## roaming

### RoamingNetwork

Hub or direct-exchange network with provider identity and supported protocols.

Parent: Record. Shape: `RoamingNetworkShape`.

| Property | Range | Cardinality |
|---|---|---|
| networkName | string | ! |
| provider | LegalEntity | ! |
| protocolName | OCPI, OICP, Custom | ! |
| supportedVersion | string | + |

### RoamingParty

Counterparty representation with externally scoped CPO or eMSP identity.

Parent: Record. Shape: `RoamingPartyShape`.

| Property | Range | Cardinality |
|---|---|---|
| party | LegalEntity | ! |
| roamingRole | CPO, EMSP, Hub | ! |
| countryCode | string | ! |
| partyCode | string | ! |
| roamingNetwork | RoamingNetwork | ? |
| localPartner | LegalEntity | ? |

### RoamingConnection

Contracted technical relationship with negotiated protocol modules and credential references.

Parent: Record. Shape: `RoamingConnectionShape`.

| Property | Range | Cardinality |
|---|---|---|
| localService | OperatorService | ! |
| remoteParty | RoamingParty | ! |
| roamingNetwork | RoamingNetwork | ? |
| serviceAgreement | ServiceAgreement | ! |
| protocolName | OCPI, OICP, Custom | ! |
| protocolVersion | string | ! |
| endpointUrl | anyURI | ! |
| credentialReference | anyURI | ! |
| connectionState | Pending, Active, Suspended, Closed | ! |
| moduleAgreement | RoamingModuleAgreement | + |
| roamingBehaviorPolicy | RoamingBehaviorPolicy | ? |

### RoamingModuleAgreement

Versioned sender/receiver role for one negotiated roaming module.

Parent: Record. Shape: `RoamingModuleAgreementShape`.

| Property | Range | Cardinality |
|---|---|---|
| moduleName | Credentials, Locations, Tariffs, Tokens, Sessions, CDRs, Commands, ChargingProfiles, HubClientInfo, Payments, Bookings, InvoiceReconciliation | ! |
| moduleVersion | string | ! |
| localRole | Sender, Receiver, Both | ! |
| endpointUrl | anyURI | ! |

### RoamingExchange

Delivery and acknowledgement of one versioned roaming resource or command.

Parent: Record. Shape: `RoamingExchangeShape`.

| Property | Range | Cardinality |
|---|---|---|
| roamingConnection | RoamingConnection | ! |
| exchangedRecord | Record | ! |
| exchangeDirection | Inbound, Outbound | ! |
| exchangeState | Pending, Sent, Acknowledged, Rejected, Retrying, DeadLetter | ! |
| externalIdentifier | ExternalIdentifier | + |
| attemptNumber | positiveInteger | ! |
| sourceEvent | SourceEvent | ! |
| acknowledgedAt | dateTime | ? |

### RoamingCommand

Cross-network command tied to a local command and asynchronous remote outcome.

Parent: Record. Shape: `RoamingCommandShape`.

| Property | Range | Cardinality |
|---|---|---|
| roamingConnection | RoamingConnection | ! |
| command | RemoteCommand | ! |
| remoteCommandReference | string | ! |
| remoteCommandState | Pending, Accepted, Rejected, Succeeded, Failed, Expired | ! |
| callbackUrl | anyURI | ? |
| receivedAt | dateTime | ! |

### SynchronizationCursor

Checkpoint of a partner stream retaining negotiated ordering and freshness semantics.

Parent: Record. Shape: `SynchronizationCursorShape`.

| Property | Range | Cardinality |
|---|---|---|
| roamingConnection | RoamingConnection | ! |
| streamModuleName | string | ! |
| cursorValue | string | ! |
| lastSuccessfulAt | dateTime | ! |
| watermarkAt | dateTime | ! |

### RoamingTariffMapping

Connection-specific imported tariff and local commercial interpretation.

Parent: Record. Shape: `RoamingTariffMappingShape`.

| Property | Range | Cardinality |
|---|---|---|
| roamingConnection | RoamingConnection | ! |
| remoteTariffIdentifier | ExternalIdentifier | ! |
| importedTariff | TariffVersion | ! |
| retailTariff | TariffVersion | ? |
| sourceEvidence | EvidenceDocument | ! |
| importedAt | dateTime | ! |

### RoamingTariffFilter

Ordered rule for selecting or transforming a remote operator tariff.

Parent: Record. Shape: `RoamingTariffFilterShape`.

| Property | Range | Cardinality |
|---|---|---|
| remoteParty | RoamingParty | ! |
| priority | integer | ! |
| pricingCondition | PricingCondition | + |
| resultingTariff | TariffVersion | ! |
| filterState | Active, Disabled | ! |

### PublicDataPublication

Versioned public-data export with schema, audience, freshness and evidence.

Parent: Record. Shape: `PublicDataPublicationShape`.

| Property | Range | Cardinality |
|---|---|---|
| listing | PublicListing | ! |
| publicationSchema | string | ! |
| schemaVersion | string | ! |
| destinationUrl | anyURI | ! |
| publishedAt | dateTime | ! |
| validUntil | dateTime | ! |
| publicationEvidence | EvidenceDocument | ! |

### RoamingBehaviorPolicy

Versioned interpretation rules at a roaming boundary, including unknown status and tariff precedence.

Parent: Record. Shape: `RoamingBehaviorPolicyShape`.

| Property | Range | Cardinality |
|---|---|---|
| mappingMode | Native, Translated, Overridden | ! |
| unknownUnitStatus | Unknown, Unavailable, Available | ! |
| periodicMeterUpdates | boolean | ! |
| phasePowerFormula | SinglePhase, ThreePhase, Reported | ! |
| overrideExplicitTariff | boolean | ! |
| policyVersion | string | ! |

## security-governance

### CertificateRecord

Certificate identity, validity and trust metadata with key material held externally.

Parent: Record. Shape: `CertificateRecordShape`.

| Property | Range | Cardinality |
|---|---|---|
| certificateFingerprint | string | ! |
| certificatePurpose | Transport, Contract, Provisioning, MeterSigning, FirmwareSigning, TrustAnchor | ! |
| issuerName | string | ! |
| subjectName | string | ! |
| validFrom | dateTime | ! |
| validUntil | dateTime | ! |
| certificateState | Valid, Expired, Revoked, Pending | ! |
| certificateArtifact | EvidenceDocument | ! |
| privateKeyReference | anyURI | ? |

### CertificateLifecycleEvent

Issuance, installation, renewal or revocation evidence for a certificate.

Parent: Record. Shape: `CertificateLifecycleEventShape`.

| Property | Range | Cardinality |
|---|---|---|
| certificate | CertificateRecord | ! |
| certificateAction | Issued, Installed, Renewed, Revoked, Deleted, Failed | ! |
| eventAt | dateTime | ! |
| station | ChargingStation | ? |
| command | RemoteCommand | ? |
| evidence | EvidenceDocument | + |

### SecurityEvent

Detected security-relevant event with source evidence and triage status.

Parent: Record. Shape: `SecurityEventShape`.

| Property | Range | Cardinality |
|---|---|---|
| affectedRecord | Record | ! |
| eventAt | dateTime | ! |
| securityEventCode | string | ! |
| severity | Info, Warning, Critical | ! |
| sourceEvent | SourceEvent | ! |
| issue | Issue | ? |

### AuditEntry

Append-only actor-action-result evidence for privileged or business-significant changes.

Parent: Record. Shape: `AuditEntryShape`.

| Property | Range | Cardinality |
|---|---|---|
| actor | Principal | ! |
| auditedRecord | Record | ! |
| actionCode | string | ! |
| eventAt | dateTime | ! |
| auditResult | Succeeded, Rejected, Failed | ! |
| previousDigest | string | ? |
| newDigest | string | ? |
| sourceEvent | SourceEvent | ? |

### PolicyDocument

Versioned legal or operational policy with purpose and effective interval.

Parent: Record. Shape: `PolicyDocumentShape`.

| Property | Range | Cardinality |
|---|---|---|
| policyTitle | langString | + |
| policyVersion | string | ! |
| policyPurpose | Terms, Privacy, Marketing, Operational, Accessibility, Other | ! |
| validFrom | dateTime | ! |
| validUntil | dateTime | ? |
| policyArtifact | EvidenceDocument | ! |

### ConsentDecision

Recorded grant or withdrawal for a specific person, purpose and document version.

Parent: Record. Shape: `ConsentDecisionShape`.

| Property | Range | Cardinality |
|---|---|---|
| customer | CustomerAccount | ! |
| policyDocument | PolicyDocument | ! |
| consentPurpose | string | ! |
| consentChoice | Granted, Withdrawn, Declined | ! |
| decidedAt | dateTime | ! |
| evidence | EvidenceDocument | + |

### RetentionPolicy

Purpose- and jurisdiction-specific retention rule with legal-hold handling.

Parent: Record. Shape: `RetentionPolicyShape`.

| Property | Range | Cardinality |
|---|---|---|
| retentionPurpose | string | ! |
| jurisdictionCode | string | ! |
| retentionDays | nonNegativeInteger | ! |
| disposition | Delete, Anonymize, Archive | ! |
| legalBasis | string | ! |

### DataDisposition

Evidence of a requested or completed deletion/anonymization action.

Parent: Record. Shape: `DataDispositionShape`.

| Property | Range | Cardinality |
|---|---|---|
| subjectAccount | CustomerAccount | ! |
| retentionPolicy | RetentionPolicy | ! |
| requestedAt | dateTime | ! |
| dispositionState | Requested, BlockedByHold, Completed, Failed | ! |
| completedAt | dateTime | ? |
| dispositionEvidence | EvidenceDocument | ? |

### ComplianceAssessment

Provision-specific applicability and evidence assessment; no automatic legal conclusion.

Parent: Record. Shape: `ComplianceAssessmentShape`.

| Property | Range | Cardinality |
|---|---|---|
| assessedRecord | Record | ! |
| jurisdictionCode | string | ! |
| regulationReference | anyURI | ! |
| provisionReference | string | ! |
| applicable | boolean | ! |
| assessmentResult | Unassessed, Conforming, Nonconforming, NotApplicable | ! |
| assessedAt | dateTime | ! |
| assessor | Principal | ! |
| evidence | EvidenceDocument | * |

### AccessTokenLease

Metadata for an issued API access token; token material is stored in a secret manager and is never the RDF identifier.

Parent: Record. Shape: `AccessTokenLeaseShape`.

| Property | Range | Cardinality |
|---|---|---|
| apiClient | ApiClient | ! |
| issuedAt | dateTime | ! |
| expiresAt | dateTime | ! |
| tokenFingerprint | string | ! |
| accessTokenState | Active, Revoked, Expired | ! |
| permission | Permission | * |
| revokedAt | dateTime | ? |

## sessions-metering

### SourceEvent

Immutable source envelope identifying event time, receipt time, producer and retained payload.

Parent: Record. Shape: `SourceEventShape`.

| Property | Range | Cardinality |
|---|---|---|
| eventKey | string | ! |
| sourceSystem | string | ! |
| occurredAt | dateTime | ! |
| receivedAt | dateTime | ! |
| schemaVersion | string | ! |
| payloadEvidence | EvidenceDocument | ! |
| sequenceNumber | nonNegativeInteger | ? |
| correlationId | string | ? |
| clockAssessment | ClockAssessment | ? |

### ChargingSession

Canonical charging lifecycle independent of wire transactions and financial settlement.

Parent: Record. Shape: `ChargingSessionShape`.

| Property | Range | Cardinality |
|---|---|---|
| chargingUnit | ChargingUnit | ! |
| customer | CustomerAccount | ? |
| vehicle | Vehicle | ? |
| authorizationDecision | AuthorizationDecision | ! |
| sessionState | Pending, Starting, Active, Suspended, Ending, Completed, Failed, ReconciliationRequired | ! |
| startedAt | dateTime | ! |
| endedAt | dateTime | ? |
| importedEnergyKWh | decimal | ! |
| exportedEnergyKWh | decimal | ! |
| commercialMode | Free, Direct, Roaming, Corporate, HomeReimbursement | ! |
| selectedTariff | TariffVersion | ? |
| endEvidence | SessionEndEvidence | ? |
| reservation | Reservation | ? |

### ProtocolTransaction

Wire-protocol transaction scoped to endpoint and boot epoch; may be one fragment of a session.

Parent: Record. Shape: `ProtocolTransactionShape`.

| Property | Range | Cardinality |
|---|---|---|
| session | ChargingSession | ! |
| endpoint | ProtocolEndpoint | ! |
| transactionIdentifier | string | ! |
| bootEpoch | string | ! |
| protocolVersion | string | ! |
| startedAt | dateTime | ! |
| endedAt | dateTime | ? |

### SessionEvent

Ordered lifecycle evidence for a canonical session, with a source envelope.

Parent: Record. Shape: `SessionEventShape`.

| Property | Range | Cardinality |
|---|---|---|
| session | ChargingSession | ! |
| sourceEvent | SourceEvent | ! |
| sessionEventKind | Requested, Authorized, Started, Suspended, Resumed, Stopped, Recovered, Reconciled | ! |
| sequenceNumber | nonNegativeInteger | ! |

### ChargingInterval

Segment of a session with phase of activity and interval usage.

Parent: Record. Shape: `ChargingIntervalShape`.

| Property | Range | Cardinality |
|---|---|---|
| session | ChargingSession | ! |
| interval | TimeWindow | ! |
| intervalKind | Charging, Idle, Parking, Suspended, Exporting | ! |
| importedEnergyKWh | decimal | ! |
| exportedEnergyKWh | decimal | ! |
| averagePowerKW | decimal | ? |

### MeterObservation

One measured value preserving measurand, unit, phase, direction and measurement quality.

Parent: Record. Shape: `MeterObservationShape`.

| Property | Range | Cardinality |
|---|---|---|
| meter | ElectricityMeter | ! |
| session | ChargingSession | ? |
| observedAt | dateTime | ! |
| numericValue | decimal | ! |
| unitIri | IRI | ! |
| measurandCode | string | ! |
| phaseCode | string | ! |
| energyDirection | Import, Export, NotApplicable | ! |
| readingKind | Cumulative, Interval, Instantaneous | ! |
| quality | Valid, Estimated, Suspect, Invalid | ! |
| sourceEvent | SourceEvent | ! |
| signedEvidence | SignedMeterEvidence | ? |

### SignedMeterEvidence

Cryptographically signed metering evidence with signing identity and verification result.

Parent: Record. Shape: `SignedMeterEvidenceShape`.

| Property | Range | Cardinality |
|---|---|---|
| artifact | EvidenceDocument | ! |
| signingCertificate | CertificateRecord | ! |
| signatureAlgorithm | string | ! |
| signatureVerification | NotChecked, Valid, Invalid, Unverifiable | ! |
| verifiedAt | dateTime | ? |

### SessionEndEvidence

Basis and quality of session finalization, allowing physical or administrative closure to be distinguished.

Parent: Record. Shape: `SessionEndEvidenceShape`.

| Property | Range | Cardinality |
|---|---|---|
| session | ChargingSession | ! |
| finalizationBasis | DeviceStop, ReconciledMeter, Administrative, PartnerCDR | ! |
| finalizedAt | dateTime | ! |
| completeness | Complete, Estimated, Disputed | ! |
| sourceEvent | SourceEvent | + |
| finalMeterObservation | MeterObservation | ? |

### UsageAggregate

Reproducible time-bucketed usage with direction and aggregation policy.

Parent: Record. Shape: `UsageAggregateShape`.

| Property | Range | Cardinality |
|---|---|---|
| scopeRecord | Record | ! |
| interval | TimeWindow | ! |
| importedEnergyKWh | decimal | ! |
| exportedEnergyKWh | decimal | ! |
| aggregationMethod | string | ! |
| sourceEvent | SourceEvent | + |

### ChargeDetailRecord

Immutable commercial usage record; can represent local or external charging and correction lineage.

Parent: Record. Shape: `ChargeDetailRecordShape`.

| Property | Range | Cardinality |
|---|---|---|
| session | ChargingSession | ? |
| issuer | LegalEntity | ! |
| recipient | LegalEntity | ! |
| recordOrigin | Local, Roaming | ! |
| externalIdentifier | ExternalIdentifier | + |
| recordVersion | string | ! |
| period | TimeWindow | ! |
| importedEnergyKWh | decimal | ! |
| exportedEnergyKWh | decimal | ! |
| currency | Currency | ! |
| netAmount | decimal | ! |
| taxAmount | decimal | ! |
| grossAmount | decimal | ! |
| selectedTariff | TariffVersion | ? |
| correctionOf | ChargeDetailRecord | ? |
| receivedAt | dateTime | ! |
| artifact | EvidenceDocument | ! |

### ClockAssessment

Recorded clock offset applied to a source timestamp, including method and evidence; preserves the unmodified source time.

Parent: Record. Shape: `ClockAssessmentShape`.

| Property | Range | Cardinality |
|---|---|---|
| offsetSeconds | decimal | ! |
| correctionMethod | string | ! |
| assessedAt | dateTime | ! |
| evidence | EvidenceDocument | + |

## subscriptions-benefits

### SubscriptionPlan

Versioned recurring commercial plan with charging benefits and billing policy.

Parent: Record. Shape: `SubscriptionPlanShape`.

| Property | Range | Cardinality |
|---|---|---|
| planName | langString | + |
| planVersion | string | ! |
| billingMode | Prepaid, Postpaid | ! |
| billingCycle | Monthly, Annual | ! |
| currency | Currency | ! |
| baseFee | decimal | ! |
| perHomeStationFee | decimal | ! |
| freeInitialPeriods | nonNegativeInteger | ! |
| benefit | BenefitAllowance | * |
| visibilityPolicy | SiteAccessPolicy | ? |
| externalBilling | boolean | ! |
| subscriptionBillingPolicy | SubscriptionBillingPolicy | ? |

### Subscription

Customer enrollment in a plan with explicit renewal and cancellation semantics.

Parent: Record. Shape: `SubscriptionShape`.

| Property | Range | Cardinality |
|---|---|---|
| customer | CustomerAccount | ! |
| subscriptionPlan | SubscriptionPlan | ! |
| subscriptionState | Pending, Active, Cancelled, Expired, Suspended | ! |
| startsAt | dateTime | ! |
| endsAt | dateTime | ? |
| renewAutomatically | boolean | ! |
| cancelledAt | dateTime | ? |

### BillingPeriod

Accountable period for subscription accrual, invoicing and allowance reset.

Parent: Record. Shape: `BillingPeriodShape`.

| Property | Range | Cardinality |
|---|---|---|
| subscription | Subscription | ! |
| period | TimeWindow | ! |
| billingPeriodState | Open, Closed, Billed | ! |
| invoice | Invoice | ? |
| accruedAmount | decimal | ! |
| currency | Currency | ! |

### BenefitAllowance

Plan benefit measured in an explicit dimension with reset semantics.

Parent: Record. Shape: `BenefitAllowanceShape`.

| Property | Range | Cardinality |
|---|---|---|
| allowanceDimension | Energy, Money, Time, Sessions | ! |
| allowanceValue | decimal | ! |
| unitIri | IRI | ! |
| resetRule | BillingPeriod, CalendarMonth, Never | ! |
| rolloverAllowed | boolean | ! |

### AllowanceConsumption

Consumption of a plan allowance with session and period evidence.

Parent: Record. Shape: `AllowanceConsumptionShape`.

| Property | Range | Cardinality |
|---|---|---|
| allowance | BenefitAllowance | ! |
| billingPeriod | BillingPeriod | ! |
| session | ChargingSession | ! |
| consumedValue | decimal | ! |
| recordedAt | dateTime | ! |

### EnergyCouponTemplate

Issuance and redemption policy for energy-denominated coupons.

Parent: Record. Shape: `EnergyCouponTemplateShape`.

| Property | Range | Cardinality |
|---|---|---|
| templateName | string | ! |
| energyAllowanceKWh | decimal | ! |
| maximumRedemptions | positiveInteger | ! |
| validityMode | FixedWindow, DaysAfterRedemption | ! |
| validFrom | dateTime | ? |
| validUntil | dateTime | ? |
| validityDays | positiveInteger | ? |
| eligibleGroup | CustomerGroup | * |

### EnergyCoupon

Energy entitlement distinct from monetary vouchers and wallet balances.

Parent: Record. Shape: `EnergyCouponShape`.

| Property | Range | Cardinality |
|---|---|---|
| customer | CustomerAccount | ! |
| energyAllowanceKWh | decimal | ! |
| validFrom | dateTime | ! |
| validUntil | dateTime | ! |
| couponState | Active, Exhausted, Expired, Cancelled | ! |
| couponTemplate | EnergyCouponTemplate | ? |
| currentKind | AC, DC, Any | ! |

### CouponConsumption

Energy charged against an energy coupon within a session.

Parent: Record. Shape: `CouponConsumptionShape`.

| Property | Range | Cardinality |
|---|---|---|
| energyCoupon | EnergyCoupon | ! |
| session | ChargingSession | ! |
| consumedEnergyKWh | decimal | ! |
| consumedAt | dateTime | ! |
| reversalOf | CouponConsumption | ? |

### SubscriptionBillingPolicy

Subscription fee accumulation, renewal and personal-charger multipliers independent of the service allowance.

Parent: Record. Shape: `SubscriptionBillingPolicyShape`.

| Property | Range | Cardinality |
|---|---|---|
| billingType | Prepaid, Postpaid | ! |
| renewalIntervalMonths | positiveInteger | ! |
| freeRenewalPeriods | nonNegativeInteger | ! |
| currency | Currency | ! |
| baseFee | decimal | ! |
| feePerPersonalStation | decimal | ? |
| applyBaseFeePerStation | boolean | ! |
| usageBillingThreshold | decimal | ? |
| accumulateChargingCharges | boolean | ! |
| replacementPlan | SubscriptionPlan | ? |

## vehicles-authorization

### Vehicle

Vehicle reference with technical data and controlled identity information.

Parent: Record. Shape: `VehicleShape`.

| Property | Range | Cardinality |
|---|---|---|
| vehicleReference | string | ! |
| vehicleCategory | Passenger, Van, Truck, Bus, Other | ! |
| batteryCapacityKWh | decimal | ? |
| maximumChargePowerKW | decimal | ? |
| vehicleIdentificationReference | anyURI | ? |
| telematicsIntegration | IntegrationConnection | ? |

### VehicleAssignment

Time-qualified access of a customer account to a vehicle.

Parent: Record. Shape: `VehicleAssignmentShape`.

| Property | Range | Cardinality |
|---|---|---|
| vehicle | Vehicle | ! |
| customer | CustomerAccount | ! |
| assignmentRole | Owner, Driver, FleetUser | ! |
| validFrom | dateTime | ! |
| validUntil | dateTime | ? |

### VehicleTelemetry

Timestamped vehicle values with provenance and units fixed by property names.

Parent: Record. Shape: `VehicleTelemetryShape`.

| Property | Range | Cardinality |
|---|---|---|
| vehicle | Vehicle | ! |
| observedAt | dateTime | ! |
| stateOfChargePercent | decimal | ? |
| odometerKm | decimal | ? |
| sourceEvent | SourceEvent | ! |

### ChargingCredential

Opaque charging credential; RFID, Autocharge and certificate identities remain distinguishable.

Parent: Record. Shape: `ChargingCredentialShape`.

| Property | Range | Cardinality |
|---|---|---|
| credentialKind | RFID, Autocharge, ContractCertificate, App, AdHoc | ! |
| credentialIdentifier | ExternalIdentifier | ! |
| credentialState | Active, Blocked, Expired, Revoked | ! |
| customer | CustomerAccount | ? |
| vehicle | Vehicle | ? |
| paymentInstrument | PaymentInstrument | ? |
| validFrom | dateTime | ! |
| validUntil | dateTime | ? |
| homeOnly | boolean | ! |

### CredentialAssignment

Time-bound assignment of a charging credential to a customer or vehicle.

Parent: Record. Shape: `CredentialAssignmentShape`.

| Property | Range | Cardinality |
|---|---|---|
| credential | ChargingCredential | ! |
| customer | CustomerAccount | ! |
| vehicle | Vehicle | ? |
| validFrom | dateTime | ! |
| validUntil | dateTime | ! |

### AuthorizationRequest

Request to authorize charging including context, source and requested target.

Parent: Record. Shape: `AuthorizationRequestShape`.

| Property | Range | Cardinality |
|---|---|---|
| credential | ChargingCredential | ? |
| customer | CustomerAccount | ? |
| chargingUnit | ChargingUnit | ! |
| requestedAt | dateTime | ! |
| authorizationMethod | RFID, Autocharge, PlugAndCharge, App, AdHoc, LocalFree, Roaming | ! |
| sourceEvent | SourceEvent | ! |

### AuthorizationDecision

Explicit charging decision with reason, policy and offline or remote origin.

Parent: Record. Shape: `AuthorizationDecisionShape`.

| Property | Range | Cardinality |
|---|---|---|
| authorizationRequest | AuthorizationRequest | ! |
| decision | Accepted, Rejected, Pending | ! |
| reasonCode | string | ! |
| decidedAt | dateTime | ! |
| decisionSource | LocalCache, Operator, RoamingPartner, PaymentProvider, Policy | ! |
| appliedPolicy | Record | * |
| expiresAt | dateTime | ? |

### LocalAuthorizationList

Versioned local cache distributed to a charger, separate from online authorization.

Parent: Record. Shape: `LocalAuthorizationListShape`.

| Property | Range | Cardinality |
|---|---|---|
| station | ChargingStation | ! |
| listVersion | nonNegativeInteger | ! |
| localListEntry | LocalAuthorizationEntry | * |
| generatedAt | dateTime | ! |

### LocalAuthorizationEntry

Credential entry in a local authorization snapshot.

Parent: Record. Shape: `LocalAuthorizationEntryShape`.

| Property | Range | Cardinality |
|---|---|---|
| credential | ChargingCredential | ! |
| credentialState | Active, Blocked, Expired, Revoked | ! |
| validUntil | dateTime | ! |

### PlugAndChargeEnrollment

Enrollment joining a customer, vehicle provisioning identity and charging contract certificate.

Parent: Record. Shape: `PlugAndChargeEnrollmentShape`.

| Property | Range | Cardinality |
|---|---|---|
| customer | CustomerAccount | ! |
| vehicle | Vehicle | ! |
| provisioningCertificate | ProvisioningCertificate | ! |
| contractCertificate | CertificateRecord | ? |
| emaid | ExternalIdentifier | ! |
| enrollmentState | Pending, Active, Revoked, Failed | ! |

### ProvisioningCertificate

Vehicle provisioning-certificate identifier and lifecycle, without private key material.

Parent: Record. Shape: `ProvisioningCertificateShape`.

| Property | Range | Cardinality |
|---|---|---|
| provisioningIdentifier | ExternalIdentifier | ! |
| customer | CustomerAccount | ! |
| vehicle | Vehicle | ? |
| certificate | CertificateRecord | ? |
| provisioningState | Registered, Active, Revoked | ! |
