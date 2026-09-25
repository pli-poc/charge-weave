# Migration from the earlier foundation

Version 1.0 is a substantially expanded domain design, not a drop-in namespace-compatible edit of the initial small ontology. Keep the original archive as a historical version. There is no production data migration included because no persisted user data or deployed namespace was supplied.

Map old charger concepts to ChargingStation, ChargingUnit and Connector according to their actual meaning. Split overloaded transaction records into ProtocolTransaction and financial payment records. Introduce tenant-qualified identifiers, immutable tariff versions, explicit authorization decisions, session-end evidence and distinct import/export quantities before loading older session data into the finalized-record contract.

Build an explicit source-to-canonical mapping for each existing dataset. Preserve source identifiers in ExternalIdentifier rather than guessing `owl:sameAs`. Validate on a staged snapshot, reconcile rejected records, and retain migration provenance. Do not manufacture missing financial or physical evidence to make the graph conform.

The full source model, compiled serializations, shapes, diagnostic queries and tests now live together in this release. `model/domain.schema` is the maintained source for class/field contracts; `tools/build_rules.py` is the maintained source for cross-domain rules.
