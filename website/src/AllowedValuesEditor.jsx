import React from 'react';

// This edits only an existing enumerated contract. The backend owns the template.
export default function AllowedValuesEditor({ draft, onChange, onCancel, onApply, pending, stale }) {
  const selected = new Set(draft.values);
  const valid = selected.size >= 2 && selected.size < draft.original.length;
  return <section className="studio-activity" aria-label="Narrow allowed values">
    <h2>Narrow allowed values for {draft.name}</h2>
    <p>Keep at least two values and remove at least one. Narrowing can reject existing data; review affected requirements and rerun checks. This changes the domain schema.</p>
    <form onSubmit={event => { event.preventDefault(); if (valid && !stale && !pending) onApply(); }}>
      <fieldset disabled={pending}>
        <legend>Values to keep</legend>
        {draft.original.map(value => <label key={value}><input type="checkbox" checked={selected.has(value)} onChange={event => onChange(draft.original.filter(item => item === value ? event.target.checked : selected.has(item)))} /> {value}</label>)}
      </fieldset>
      <p aria-live="polite">{selected.size} of {draft.original.length} values selected.{!valid && ' Select at least two but fewer than the original set.'}</p>
      {stale && <p role="alert">The draft changed since this editor opened, or its change set is different or locked. Your selection is retained; cancel and reopen the field to review the current contract and change set.</p>}
      <button type="submit" disabled={!valid || pending || stale}>Apply allowed values</button>
      <button type="button" disabled={pending} onClick={onCancel}>Cancel allowed values</button>
    </form>
  </section>;
}
