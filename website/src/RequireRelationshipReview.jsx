import React, { useEffect, useRef } from 'react';

export default function RequireRelationshipReview({ draft, pending, stale, ready, onApply, onCancel }) {
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus(); }, []);
  return <section className="studio-activity" aria-label="Review required relationship">
    <h2 tabIndex={-1} ref={heading}>Require {draft.name}</h2>
    <p>This changes {draft.owner}.{draft.name}, targeting {draft.range}, from {draft.cardinality === '?' ? 'optional (0..1) to exactly one (1)' : 'zero or more (0..*) to one or more (1..*)'}. Existing data without a value may no longer conform.</p>
    <p>The source is the domain schema. Rerun structural and relevant business checks; a required relationship alone does not prove business completeness.</p>
    {stale && <p role="alert">The workspace changed since this review opened. Cancel and review the latest relationship before applying.</p>}
    <button type="button" disabled={pending || stale || !ready} onClick={onApply}>Confirm required relationship</button>
    <button type="button" disabled={pending} onClick={onCancel}>Cancel required relationship</button>
  </section>;
}
