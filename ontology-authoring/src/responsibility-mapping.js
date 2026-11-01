// Curated presentation mappings: each entry only applies to the exact declared
// owner, predicate and range. These labels do not create ontology assertions.
export const responsibilityMappingVersion = 'chargeweave-responsibility-v1';
export const responsibilityMappings = [
  { owner: 'ChargingStation', property: 'assetOwner', range: 'LegalEntity', label: 'Asset owner', category: 'ownership' },
  { owner: 'ChargingStation', property: 'maintenanceProvider', range: 'LegalEntity', label: 'Maintenance provider', category: 'service' },
  { owner: 'ChargingSite', property: 'siteHost', range: 'LegalEntity', label: 'Site host', category: 'ownership' },
  { owner: 'OperatorService', property: 'serviceProvider', range: 'LegalEntity', label: 'Service provider', category: 'service' },
  { owner: 'PartyRole', property: 'party', range: 'LegalEntity', label: 'Role-holding party', category: 'role' },
  { owner: 'WorkOrder', property: 'maintenanceProvider', range: 'LegalEntity', label: 'Maintenance provider', category: 'service' },
  { owner: 'WorkOrder', property: 'assignedPrincipal', range: 'Principal', label: 'Assigned principal', category: 'assignment' },
  { owner: 'WorkOrder', property: 'affectedRecord', range: 'Record', label: 'Affected record', category: 'affected' },
];
