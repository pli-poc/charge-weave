import React, { useId, useRef } from 'react';

const valuePattern = /^[A-Za-z][A-Za-z0-9]*$/;

export function parseControlledValues(range) {
  if (!/^\{(?:[A-Za-z][A-Za-z0-9]*(?:,[A-Za-z][A-Za-z0-9]*)*)?\}$/.test(range)) return null;
  return range === '{}' ? [] : range.slice(1, -1).split(',');
}

export function validFieldRangeDraft(range, candidate) {
  if (candidate.length) return false;
  if (!range.startsWith('{')) return true;
  const values = parseControlledValues(range);
  return Boolean(values && values.length >= 2 && values.length <= 50 && new Set(values).size === values.length && range.length <= 128);
}

export default function ControlledValuesBuilder({ range, candidate, onRangeChange, onCandidateChange }) {
  const group = useRef(null);
  const candidateInput = useRef(null);
  const issueId = useId();
  const values = parseControlledValues(range);
  const trimmed = candidate.trim();
  let issue = '';
  if (candidate && !valuePattern.test(trimmed)) issue = 'Use letters and digits, starting with a letter.';
  else if (candidate && values?.includes(trimmed)) issue = 'This value is already included.';
  else if (candidate && values && (values.length >= 50 || `{${[...values, trimmed].join(',')}}`.length > 128)) issue = 'The controlled-value range would exceed the supported limit.';
  function add() {
    if (!values || !candidate || issue) return;
    onRangeChange(`{${[...values, trimmed].join(',')}}`);
    onCandidateChange('');
    requestAnimationFrame(() => candidateInput.current?.focus());
  }
  function remove(index) {
    onRangeChange(`{${values.filter((_, position) => position !== index).join(',')}}`);
    requestAnimationFrame(() => {
      const buttons = group.current?.querySelectorAll('[data-remove-controlled-value]');
      (buttons?.[Math.min(index, buttons.length - 1)] || candidateInput.current)?.focus();
    });
  }
  return <details>
    <summary>Build controlled values</summary>
    <p>Choose distinct values using letters and digits. At least two values are required; the entire range is limited to 128 characters.</p>
    {!values && <><p>The current datatype or target is not an editable controlled-value list.</p><button type="button" onClick={() => { onRangeChange('{}'); requestAnimationFrame(() => candidateInput.current?.focus()); }}>Start controlled values</button></>}
    {values && <div ref={group} role="group" aria-label="Controlled values">
      {values.length ? <ul>{values.map((value, index) => <li key={`${value}-${index}`}>{value} <button type="button" data-remove-controlled-value aria-label={`Remove value ${value}`} onClick={() => remove(index)}>Remove</button></li>)}</ul> : <p>No values added.</p>}
      <label>New allowed value <input ref={candidateInput} value={candidate} aria-invalid={issue ? true : undefined} aria-describedby={issue ? issueId : undefined} onChange={event => onCandidateChange(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); add(); } }} /></label>
      <button type="button" onClick={add} disabled={!candidate || Boolean(issue)}>Add allowed value</button>
      {issue && <p id={issueId} role="status">{issue}</p>}
      {new Set(values).size !== values.length && <p role="status">Remove duplicate values before adding the field.</p>}
    </div>}
    {!values && candidate && <div><p>A value is still pending; return to controlled values or clear it before adding the field.</p><button type="button" onClick={() => onCandidateChange('')}>Clear pending value</button></div>}
  </details>;
}
