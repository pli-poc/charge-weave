# Migrating semantic snapshots to v1.1

Version 1.1 adds required fields and changes closed-world validation. Existing v1.0 snapshots must be migrated; this release does not silently invent business evidence.

| Existing concept | Required migration |
|---|---|
| ServiceAgreement | Supply agreement state, financial owner and governing policy version. Active/suspended agreements require acceptance and obligation evidence. |
| ChargingStation | Supply asset lifecycle; operating assets require an accepted operational handover. |
| ChargeDetailRecord | Supply Debit/Credit record kind. Local debit records require billing readiness; credits reference and reverse their original. |
| Invoice | Identify the financial owner. |
| ReconciliationCase | Identify the accountable party. Expected/observed records are now optional so a genuinely missing side can be represented; use the missing identifier where required. |
| AllowanceConsumption | Link a per-customer/per-period allowance balance and reconcile aggregate consumption/reservations. |

New concepts require their declared fields when used. Import existing commercial, closure, privacy, energy and approval evidence rather than synthesizing successful decisions. The generated class dictionary is authoritative for every structural requirement.

Source namespaces remain stable. Source filenames and legacy provenance references have been debranded; importers using old catalogue paths must update them. The old hash manifest was removed from redacted historical evidence because its hashes no longer represented those edited files.

Run the complete validator against migrated authorized snapshots, then run adapter and service acceptance for the affected business flow. No production data was available or changed during this review.
