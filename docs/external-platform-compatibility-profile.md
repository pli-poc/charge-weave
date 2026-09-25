# External platform compatibility profile

Canonical business meaning and vendor payload restrictions are versioned separately. This document records concrete restrictions observed during research; it is not an exhaustive copy of External platform's validation behavior.

| Observed vendor behavior | Canonical treatment | Enforcement location |
|---|---|---|
| A circuit participating in flexibility or an external load-balancing integration cannot be used in multilevel DLM | Keep control hierarchy, integration and flexibility participation explicit | Adapter policy before creating/changing hierarchy |
| Three-phase multilevel circuits require phase rotation; single/split-phase circuits require conductor mapping | LoadControlGroup, ElectricalCircuit and ElectricalConnection separate control from wiring | Electrical topology validation plus adapter enum checks |
| Parent and child electrical configuration must agree; station membership must be compatible | Model physical topology and connection evidence rather than treating all virtual groups as circuits | Asset and energy-service policy; source enum translations need an adapter profile |
| Public/private stations require locations; personal stations have an owner | ChargingSite and ownerAccount are distinct relationships | B010 and B011 |
| Removing a station-derived reimbursement rate conflicts with attached reimbursement policy | Preserve the selected rate and immutable reimbursement evidence | Atomic station/policy write guard; B057 validates reimbursement records |
| Monitoring and automatic recovery are independent controls | monitoringEnabled and recoveryEnabled remain separate | Station contract and recovery service |
| Personal charging can be subject to subscription/authentication policy | Subscription, authorization and station ownership remain independent | Authorization service resolves effective policy |
| The corporate billing API retains policy snapshots after changes | Store immutable canonical policy versions and session selections | CorporateBillingSnapshot, B086 and transactional history |
| Payment terminal types expose provider-specific fields | PaymentTerminal carries canonical identity; IntegrationConnection and approved custom definitions carry provider-specific configuration | Provider-specific adapter schema, not a universal union of every terminal's fields |

Sources: [Circuit create](urn:chargeweave:legacy-api/reference/circuitcreate), [Charge point update](urn:chargeweave:legacy-api/reference/chargepointupdate), [Models relationship](urn:chargeweave:legacy-api/docs/models-relationship), and the family references in the crosswalk.

Do not infer that a constraint absent from the canonical business-rule set is accepted by External platform. An External platform importer/exporter must pin an exact OpenAPI version, preserve null-versus-absent update semantics, map enums explicitly, respect endpoint-specific permission scopes and test conflict responses. This release supplies semantic traceability, not that adapter.
