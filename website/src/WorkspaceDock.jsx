import React, { useEffect, useLayoutEffect, useRef } from 'react';
import ValidationIssues, { fixtureConcepts, fixtureFailures } from './ValidationIssues.jsx';
import StudioScrollableText from './StudioScrollableText.jsx';

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

export default function WorkspaceDock({ panel, onPanelChange, height, heightLimit, onHeightChange, disabled, job, snapshot, history, historyDetail, historyPending, onInspectRevision, onCloseHistory, onRetry, onFocusConcept, onDownloadEvidence, onShowChecks, activityConcept }) {
  const terminal = job && ['passed', 'failed', 'cancelled', 'interrupted'].includes(job.status);
  const validationJob = job && !['publication-preview', 'publication-commit', 'publication-push', 'publication-pr'].includes(job.profile) ? job : null;
  const failedSteps = (validationJob?.steps || []).filter(step => step.status === 'failed');
  const failureCount = failedSteps.length || (validationJob?.status === 'failed' ? 1 : 0);
  const stale = validationJob && (validationJob.revision !== snapshot.revision || validationJob.digest !== snapshot.sourceDigest);
  const navigation = useRef(null);
  const content = useRef(null);
  const activityHeading = useRef(null);
  const detailHeading = useRef(null);
  const drag = useRef(null);
  useLayoutEffect(() => {
    content.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [panel]);
  useEffect(() => {
    if (panel === 'activity' && historyDetail) detailHeading.current?.focus();
  }, [panel, historyDetail]);
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
    <div ref={content} id="studio-bottom-content" className="studio-bottom-content" role="region" aria-label="Results content" tabIndex={panel ? 0 : -1} hidden={!panel} onKeyDown={event => {
      if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const element = event.currentTarget;
      if (event.key === 'Home') element.scrollTo({ top: 0, behavior: 'instant' });
      else if (event.key === 'End') element.scrollTo({ top: element.scrollHeight, behavior: 'instant' });
      else if (event.key === 'PageDown') element.scrollBy({ top: element.clientHeight, behavior: 'instant' });
      else if (event.key === 'PageUp') element.scrollBy({ top: -element.clientHeight, behavior: 'instant' });
      else return;
      event.preventDefault();
    }}>
      <section hidden={panel !== 'problems'} aria-label="Problems">
        <h2>Problems</h2>
        {!validationJob ? <p>No validation result is displayed. Run a check to inspect failures.</p> : <>
          <p>{validationJob.profile}: {validationJob.status} at revision {validationJob.revision}{stale ? ' · out of date for this draft' : ''}.</p>
          {failureCount ? <><p>A failed check needs investigation; it does not automatically identify a model defect.</p><ul>{failedSteps.length ? failedSteps.map(step => <li key={step.ordinal}><strong>{step.checkName}</strong><p>Affected concept and cause are unknown from the check summary.</p>{fixtureFailures(step).map(item => fixtureConcepts[item.case] && <div key={item.case}><p>Synthetic fixture {item.case}: target {fixtureConcepts[item.case].join('.')}.</p><button type="button" disabled={Boolean(stale) || disabled} onClick={() => onFocusConcept(fixtureConcepts[item.case][0], { focusView: false })}>Inspect fixture target {fixtureConcepts[item.case][0]}</button></div>)}<details><summary>Recorded output for {step.checkName}</summary><StudioScrollableText label={`Problem output: ${step.checkName}`}>{step.output || validationJob.output || 'No output was recorded.'}</StudioScrollableText></details></li>) : <li>Validation job failed without a reported step.<details><summary>Recorded job output</summary><StudioScrollableText label="Problem job output">{validationJob.output || 'No output was recorded.'}</StudioScrollableText></details></li>}</ul><button type="button" onClick={onShowChecks}>Inspect failed checks</button></> : <p>No failed checks are recorded in this job. Other required checks may still be missing.</p>}
        </>}
      </section>
      <div hidden={panel !== 'checks'}>
        <ValidationIssues job={job} snapshot={snapshot} onRetry={onRetry} onFocusConcept={onFocusConcept} disabled={disabled} />
        {terminal && validationJob && <button type="button" onClick={onDownloadEvidence}>Download evidence report</button>}
      </div>
      {panel === 'activity' && <section aria-label="Recent activity">
        <h2 ref={activityHeading} tabIndex={-1}>Recent activity</h2>
        {historyPending && <p role="status">Loading revision…</p>}
        {historyDetail ? <section aria-label="Activity revision detail">
          <h3 ref={detailHeading} tabIndex={-1}>Historical revision {historyDetail.revision}</h3>
          <p>Read-only comparison; the current draft is unchanged.</p>
          {historyDetail.available ? <><p>Actor: {historyDetail.actor}; source digest: <code>{historyDetail.sourceDigest}</code>.</p>{historyDetail.rationale && <p>Reason: {historyDetail.rationale}</p>}<details open><summary>Command group patch</summary><StudioScrollableText label="Historical command group patch">{historyDetail.patch}</StudioScrollableText></details><details><summary>Compare with baseline</summary><StudioScrollableText label="Historical comparison with baseline">{historyDetail.baselinePatch}</StudioScrollableText></details>{historyDetail.additionalSources.map(source => <details key={source.path}><summary>Historical source patch: {source.path}</summary><StudioScrollableText label={`Historical source patch: ${source.path}`}>{source.patch}</StudioScrollableText></details>)}</> : <p>{historyDetail.reason}</p>}
          <button type="button" onClick={() => { onCloseHistory(); requestAnimationFrame(() => activityHeading.current?.focus()); }}>Back to recent activity</button>
        </section> : history.length ? <><p>Showing the most recent {Math.min(history.length, 10)} loaded workspace events.</p><ol>{history.slice(-10).reverse().map(event => { const concept = activityConcept(event); const date = event.createdAt && new Date(event.createdAt); return <li key={event.sequence}><strong>{describeActivity(event)}</strong> · {event.actor} · revision {event.revision}{date && !Number.isNaN(date.getTime()) && <> · <time dateTime={event.createdAt}>{date.toLocaleString()}</time></>}{event.payload.rationale && <p>Reason: {event.payload.rationale}</p>}{event.payload.type === 'view_suggestion' && event.payload.explanation && <p>{event.payload.explanation}</p>}{concept && <button type="button" onClick={() => onFocusConcept(concept)}>Inspect current {concept}</button>}{event.payload.commands?.length > 0 && <button type="button" disabled={historyPending} onClick={() => onInspectRevision(event.revision)}>Inspect revision {event.revision}</button>}</li>; })}</ol></> : <p>No activity is available for this workspace.</p>}
        <a href="#studio-activity-heading">Open full activity history</a>
      </section>}
      <section hidden={panel !== 'output'} aria-label="Job output">
        <h2>Job output</h2>
        {job ? <><p>{job.profile}: {job.status} at revision {job.revision}.</p><StudioScrollableText label="Recorded job output">{job.output || 'No output has been recorded yet.'}</StudioScrollableText></> : <p>No job output is available.</p>}
      </section>
    </div>
  </section>;
}
