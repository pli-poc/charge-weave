import React, { useRef } from 'react';
import ValidationIssues from './ValidationIssues.jsx';

function describeActivity(event) {
  const payload = event.payload;
  if (payload.type === 'view_suggestion') return `Suggested ${payload.root} · ${payload.viewpoint} view`;
  if (payload.type === 'view_saved') return `Saved view ${payload.viewId}`;
  if (payload.type === 'undo') return `Undid revision ${payload.targetRevision}`;
  if (payload.type === 'review') return `Review: ${payload.decision.replaceAll('_', ' ')}`;
  if (payload.type === 'publication') return `Publication: ${payload.state.replaceAll('_', ' ')}`;
  if (payload.type === 'changeset_opened') return 'Opened a change set';
  if (payload.type === 'changeset_reopened') return 'Reopened a change set';
  if (payload.commands?.length) {
    const labels = { 'class.add': 'Added a concept', 'class.describe': 'Updated a definition', 'property.add': 'Added a property', 'property.update': 'Updated a property', 'relationship.add': 'Added a relationship' };
    return payload.commands.map(command => labels[command.type] || 'Updated the model').join('; ');
  }
  return 'Workspace activity';
}

export default function WorkspaceDock({ panel, onPanelChange, height, heightLimit, onHeightChange, disabled, job, snapshot, history, onRetry, onFocusConcept, onDownloadEvidence, onShowChecks, activityConcept }) {
  const terminal = job && ['passed', 'failed', 'cancelled', 'interrupted'].includes(job.status);
  const validationJob = job && !['publication-preview', 'publication-commit', 'publication-push', 'publication-pr'].includes(job.profile) ? job : null;
  const failedSteps = (validationJob?.steps || []).filter(step => step.status === 'failed');
  const failureCount = failedSteps.length || (validationJob?.status === 'failed' ? 1 : 0);
  const stale = validationJob && (validationJob.revision !== snapshot.revision || validationJob.digest !== snapshot.sourceDigest);
  const navigation = useRef(null);
  const drag = useRef(null);
  function resize(value) { onHeightChange(Math.round(Math.min(heightLimit, Math.max(160, value)))); }
  function onResizeKey(event) {
    if (disabled) return;
    if (event.key === 'ArrowUp') resize(height + 16);
    else if (event.key === 'ArrowDown') resize(height - 16);
    else if (event.key === 'Home') resize(160);
    else if (event.key === 'End') resize(heightLimit);
    else return;
    event.preventDefault();
  }
  function closePanel() {
    const previous = panel;
    onPanelChange(null);
    requestAnimationFrame(() => navigation.current?.querySelector(`[data-panel="${previous}"]`)?.focus());
  }
  return <section className="studio-bottom-dock" aria-label="Workspace results" style={{ '--results-height': `${height}px` }}>
    {panel && <div className="studio-results-splitter" role="separator" aria-label="Resize results panel" aria-orientation="horizontal" aria-controls="studio-bottom-content" aria-valuemin={160} aria-valuemax={heightLimit} aria-valuenow={height} aria-valuetext={`${height} pixels`} aria-disabled={disabled} tabIndex={disabled ? -1 : 0} onKeyDown={onResizeKey} onPointerDown={event => {
      if (disabled || event.button !== 0) return;
      drag.current = { y: event.clientY, height };
      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();
    }} onPointerMove={event => { if (drag.current) resize(drag.current.height + drag.current.y - event.clientY); }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} />}
    <nav ref={navigation} aria-label="Results panels">
      {['problems', 'checks', 'activity', 'output'].map(name => <button key={name} type="button" data-panel={name} aria-pressed={panel === name} aria-label={name === 'problems' && failureCount ? `Problems, ${failureCount} failed ${failureCount === 1 ? 'check' : 'checks'}` : undefined} onClick={() => onPanelChange(panel === name ? null : name)}>{name[0].toUpperCase() + name.slice(1)}{name === 'problems' && failureCount > 0 && <span aria-hidden="true"> {failureCount}</span>}</button>)}
      {panel && <button type="button" onClick={closePanel} aria-label="Close results panel">Close</button>}
    </nav>
    <div id="studio-bottom-content" className="studio-bottom-content" hidden={!panel}>
      <section hidden={panel !== 'problems'} aria-label="Problems">
        <h2>Problems</h2>
        {!validationJob ? <p>No validation result is displayed. Run a check to inspect failures.</p> : <>
          <p>{validationJob.profile}: {validationJob.status} at revision {validationJob.revision}{stale ? ' · out of date for this draft' : ''}.</p>
          {failureCount ? <><p>A failed check needs investigation; it does not automatically identify a model defect.</p><ul>{failedSteps.length ? failedSteps.map(step => <li key={step.ordinal}>{step.checkName}</li>) : <li>Validation job failed without a reported step.</li>}</ul><button type="button" onClick={onShowChecks}>Inspect failed checks</button></> : <p>No failed checks are recorded in this job. Other required checks may still be missing.</p>}
        </>}
      </section>
      <div hidden={panel !== 'checks'}>
        <ValidationIssues job={job} snapshot={snapshot} onRetry={onRetry} onFocusConcept={onFocusConcept} />
        {terminal && <button type="button" onClick={onDownloadEvidence}>Download evidence report</button>}
      </div>
      {panel === 'activity' && <section aria-label="Recent activity">
        <h2>Recent activity</h2>
        {history.length ? <ol>{history.slice(-10).reverse().map(event => { const concept = activityConcept(event); return <li key={event.sequence}><strong>{describeActivity(event)}</strong> · {event.actor} · revision {event.revision}{event.payload.type === 'view_suggestion' && event.payload.explanation && <p>{event.payload.explanation}</p>}{concept && <button type="button" onClick={() => onFocusConcept(concept)}>Inspect current {concept}</button>}</li>; })}</ol> : <p>No activity is available for this workspace.</p>}
        <a href="#studio-activity-heading">Open full activity history</a>
      </section>}
      <section hidden={panel !== 'output'} aria-label="Job output">
        <h2>Job output</h2>
        {job ? <><p>{job.profile}: {job.status} at revision {job.revision}.</p><pre>{job.output || 'No output has been recorded yet.'}</pre></> : <p>No job output is available.</p>}
      </section>
    </div>
  </section>;
}
