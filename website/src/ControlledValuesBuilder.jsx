import React from 'react';

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
  }
  return <details>
    <summary>Build controlled values</summary>
    <p>Choose distinct values using letters and digits. At least two values are required; the entire range is limited to 128 characters.</p>
    {!values && <><p>The current datatype or target is not an editable controlled-value list.</p><button type="button" onClick={() => onRangeChange('{}')}>Start controlled values</button></>}
    {values && <div role="group" aria-label="Controlled values">
      {values.length ? <ul>{values.map((value, index) => <li key={`${value}-${index}`}>{value} <button type="button" aria-label={`Remove value ${value}`} onClick={() => onRangeChange(`{${values.filter((_, position) => position !== index).join(',')}}`)}>Remove</button></li>)}</ul> : <p>No values added.</p>}
      <label>New allowed value <input value={candidate} onChange={event => onCandidateChange(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); add(); } }} /></label>
      <button type="button" onClick={add} disabled={!candidate || Boolean(issue)}>Add allowed value</button>
      {issue && <p role="status">{issue}</p>}
      {new Set(values).size !== values.length && <p role="status">Remove duplicate values before adding the field.</p>}
    </div>}
    {!values && candidate && <div><p>A value is still pending; return to controlled values or clear it before adding the field.</p><button type="button" onClick={() => onCandidateChange('')}>Clear pending value</button></div>}
  </details>;
}
