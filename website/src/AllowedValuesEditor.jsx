import React, { useRef } from 'react';

// This edits only an existing enumerated contract. The backend owns the template.
export default function AllowedValuesEditor({ draft, onChange, onCancel, onApply, onReview, pending, stale, latest, latestReady }) {
  const heading = useRef(null);
  const selected = new Set(draft.values);
  const valid = selected.size >= 2 && selected.size < draft.original.length;
  const choices = stale && latest ? [...draft.original, ...latest.values.filter(value => !draft.original.includes(value))] : draft.original;
  const missing = latest ? draft.values.filter(value => !latest.values.includes(value)) : [];
  const reviewValid = Boolean(latest && latest.values.length >= 3 && missing.length === 0 && selected.size >= 2 && selected.size < latest.values.length);
  return <section className="studio-activity" aria-label="Narrow allowed values">
    <h2 ref={heading} tabIndex={-1}>Narrow allowed values for {draft.name}</h2>
    <p>Keep at least two values and remove at least one. Narrowing can reject existing data; review affected requirements and rerun checks. This changes the domain schema.</p>
    <form onSubmit={event => { event.preventDefault(); if (valid && !stale && !pending) onApply(); }}>
      <fieldset disabled={pending}>
        <legend>Values to keep</legend>
        {choices.map(value => <label key={value}><input type="checkbox" checked={selected.has(value)} onChange={event => onChange(choices.filter(item => item === value ? event.target.checked : selected.has(item)))} /> {value}{!draft.original.includes(value) ? ' (new in current contract)' : ''}</label>)}
      </fieldset>
      <p aria-live="polite">{selected.size} of {draft.original.length} values selected.{!valid && ' Select at least two but fewer than the original set.'}</p>
      {stale && <div role="alert">
        <p>The draft changed since this editor opened, or its change set is different or locked. Your selection is retained; review the current contract and change set before continuing.</p>
        <p>Previous: {draft.original.join(', ')} ({draft.expectedCardinality}).</p>
        <p>Current: {latestReady ? (latest ? `${latest.values.join(', ')} (${latest.cardinality})` : 'This field is no longer an editable controlled-value set.') : 'Loading current contract or editing is locked.'}</p>
        <p>Your selected values: {draft.values.join(', ') || '(none)'}. Values not selected will be excluded.</p>
        {missing.length > 0 && <p>These selected values no longer exist: {missing.join(', ')}. Uncheck them before reviewing.</p>}
        {latest && !missing.length && !reviewValid && <p>Select at least two values and leave at least one current value unselected.</p>}
        <button type="button" disabled={pending || !latestReady || !reviewValid} onClick={() => { onReview(); requestAnimationFrame(() => heading.current?.focus()); }}>Reviewed latest, keep selected values</button>
      </div>}
      <button type="submit" disabled={!valid || pending || stale}>Apply allowed values</button>
      <button type="button" disabled={pending} onClick={onCancel}>Cancel allowed values</button>
    </form>
  </section>;
}
