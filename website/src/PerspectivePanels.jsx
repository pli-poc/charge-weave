import React, { useState } from 'react';

export default function PerspectivePanels({ selected, snapshot, responsibility, temporal, temporalPolicy, setTemporalPolicy, inspectResponsibility, inspectTemporal, saveTemporalPolicy, selectConcept, addRelationship }) {
  const [category, setCategory] = useState('all');
  const currentResponsibility = responsibility && responsibility.root === selected?.name && responsibility.revision === snapshot.revision ? responsibility : null;
  const currentTemporal = temporal && temporal.root === selected?.name && temporal.revision === snapshot.revision ? temporal : null;
  const visible = currentResponsibility?.bindings.filter(binding => category === 'all' || binding.category === category) || [];
  return <>
    <section className="studio-activity"><h2>Responsibility perspective</h2>
      <button type="button" onClick={inspectResponsibility} disabled={!selected}>Inspect responsibilities for selected concept</button>
      {currentResponsibility && <>
        <p>{currentResponsibility.note}</p>
        <p>Concept: <strong>{currentResponsibility.root}</strong>. Each listed arrow is an explicit declared or inherited relationship; its role label comes from the named mapping.</p>
        <label>Filter responsibility category <select value={category} onChange={event => setCategory(event.target.value)}><option value="all">All categories</option><option value="ownership">Ownership</option><option value="service">Service and operations</option><option value="role">Role</option><option value="assignment">Assignment</option><option value="affected">Affected record</option></select></label>
        {currentResponsibility.bindings.length ? visible.length ? <ul>{visible.map(binding => <li key={`${binding.owner}-${binding.property}`}><strong>{binding.label}</strong>: {binding.property} → {binding.range} ({binding.cardinality}) · {binding.category} · {binding.source.path}:{binding.source.line} · {binding.mappingVersion}
          <button type="button" onClick={() => selectConcept(binding.range)}>Inspect {binding.range}</button>
          <details><summary>Why this binding appears</summary><p>{binding.inherited ? `Inherited from ${binding.owner}` : `Declared by ${binding.owner}`}; mapping {binding.mappingVersion} matched this owner, predicate and target.</p><p>Predicate IRI: <code>{binding.predicateIri}</code>; target IRI: <code>{binding.targetIri}</code>.</p></details>
        </li>)}</ul> : <p>No bindings in this category.</p> : <><p>No responsibility binding defined in this mapping.</p><button type="button" onClick={addRelationship}>Add a field or relationship</button></>}
      </>}
    </section>
    <section className="studio-activity"><h2>Temporal perspective</h2>
      <button type="button" onClick={inspectTemporal} disabled={!selected}>Inspect time for selected concept</button>
      {currentTemporal && <>
        <p>Model revision {currentTemporal.revision}; {currentTemporal.policySource.scope === 'draft' ? 'draft policy from baseline' : 'policy from baseline'} <code>{currentTemporal.baselineCommit}</code>.</p>
        <p>Model revision identifies this schema draft. Business valid time describes when a fact applies; recorded time describes when it became known. The listed fields are explicit contracts, not inferred classifications.</p>
        <p>Class policy: {currentTemporal.policy ?? 'No explicit temporal policy defined.'}</p>
        {snapshot.editableSources?.includes('model/temporal-policy.json') && <form onSubmit={saveTemporalPolicy}><label>Set explicit temporal policy <select value={temporalPolicy} onChange={event => setTemporalPolicy(event.target.value)}><option value="snapshot-versioned">Snapshot versioned</option><option value="immutable-aggregate">Immutable aggregate</option><option value="history-metadata">History metadata</option><option value="tenant-context">Tenant context</option><option value="abstract">Abstract</option></select></label><button disabled={temporalPolicy === currentTemporal.policy}>Save temporal policy</button><p>Review the policy and associated temporal tests; choosing a value does not establish complete time semantics.</p></form>}
        <p>Policy source: {currentTemporal.policySource.path}; interval convention: {currentTemporal.timeConvention.interval ?? 'unspecified'}; recorded time: {currentTemporal.timeConvention.recordedTimeOwner ?? 'unspecified'}; precision: {currentTemporal.timeConvention.precision ?? 'unspecified'}.</p>
        <h3>Explicit time fields and window references</h3>{currentTemporal.fields.length ? <ul>{currentTemporal.fields.map(field => <li key={`${field.owner}-${field.property}`}>{field.property}: {field.range} ({field.cardinality}) · {field.inherited ? `inherited from ${field.owner}` : 'declared'} · {field.source.path}:{field.source.line}{['TimeWindow', 'RecurringWindow'].includes(field.range) && <button type="button" onClick={() => selectConcept(field.range)}>Inspect {field.range}</button>}</li>)}</ul> : <p>No explicit time fields or window references.</p>}
      </>}
    </section>
  </>;
}
