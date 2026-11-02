import React, { useRef } from 'react';
import ValidationIssues from './ValidationIssues.jsx';

export default function WorkspaceDock({ panel, onPanelChange, height, heightLimit, onHeightChange, disabled, job, snapshot, history, onRetry, onFocusConcept, onDownloadEvidence }) {
  const terminal = job && ['passed', 'failed', 'cancelled', 'interrupted'].includes(job.status);
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
      {['checks', 'activity', 'output'].map(name => <button key={name} type="button" data-panel={name} aria-pressed={panel === name} onClick={() => onPanelChange(panel === name ? null : name)}>{name[0].toUpperCase() + name.slice(1)}</button>)}
      {panel && <button type="button" onClick={closePanel} aria-label="Close results panel">Close</button>}
    </nav>
    <div id="studio-bottom-content" className="studio-bottom-content" hidden={!panel}>
      <div hidden={panel !== 'checks'}>
        <ValidationIssues job={job} snapshot={snapshot} onRetry={onRetry} onFocusConcept={onFocusConcept} />
        {terminal && <button type="button" onClick={onDownloadEvidence}>Download evidence report</button>}
      </div>
      <section hidden={panel !== 'activity'} aria-label="Recent activity">
        <h2>Recent activity</h2>
        {history.length ? <ol>{history.slice(-10).reverse().map(event => <li key={event.sequence}>Revision {event.revision} · {event.actor} · {event.payload.type}</li>)}</ol> : <p>No activity is available for this workspace.</p>}
        <a href="#studio-activity-heading">Open full activity history</a>
      </section>
      <section hidden={panel !== 'output'} aria-label="Job output">
        <h2>Job output</h2>
        {job ? <><p>{job.profile}: {job.status} at revision {job.revision}.</p><pre>{job.output || 'No output has been recorded yet.'}</pre></> : <p>No job output is available.</p>}
      </section>
    </div>
  </section>;
}
