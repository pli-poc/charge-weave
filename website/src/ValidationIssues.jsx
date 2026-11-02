import React, { useEffect, useState } from 'react';
import StudioScrollableText from './StudioScrollableText.jsx';

function fixtureFailures(step) {
  if (!step.checkName.includes('tools/test_authoring_maintenance_demo.py')) return [];
  for (const line of (step.output || '').split(/\r?\n/).reverse()) {
    try {
      const report = JSON.parse(line);
      if (!Array.isArray(report.cases)) continue;
      return report.cases.filter(item => item && typeof item.case === 'string' && typeof item.expectedConformance === 'boolean' && typeof item.actualConformance === 'boolean' && item.passed === false).slice(0, 100);
    } catch { /* Not a structured fixture report. */ }
  }
  return [];
}
const fixtureConcepts = { 'missing-station': ['PlannedMaintenanceWindow', 'maintenanceStation'], 'invalid-planning-state': ['PlannedMaintenanceWindow', 'maintenancePlanningState'], 'reversed-shared-interval': ['TimeWindow', 'endsAt'] };

// A failing check is evidence of a failed check, not automatically a model defect.
export default function ValidationIssues({ job, snapshot, onRetry, onFocusConcept, disabled = false }) {
  const [copyMessage, setCopyMessage] = useState('');
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState(true);
  useEffect(() => { setFilter(''); setCopyMessage(''); }, [job?.id]);
  useEffect(() => { if (job?.status === 'failed') setExpanded(true); }, [job?.id, job?.status]);
  if (!job || ['publication-preview', 'publication-commit', 'publication-push', 'publication-pr'].includes(job.profile)) return <section className="studio-activity studio-validation-dock" aria-label="Validation issues">
    <h2 id="studio-validation-heading" tabIndex={-1}>Validation issues</h2>
    <button type="button" aria-expanded={expanded} aria-controls="studio-validation-content" onClick={() => setExpanded(!expanded)}>{expanded ? 'Collapse validation' : 'Expand validation'}</button>
    <div id="studio-validation-content" hidden={!expanded}>
    <p>No validation result is displayed for this draft. Run a structural check to inspect it.</p>
    <button type="button" disabled={disabled || Boolean(job && ['queued', 'running', 'cancelling'].includes(job.status))} onClick={() => onRetry('structural')}>Run structural check</button>
    </div>
  </section>;
  const stale = job.revision !== snapshot.revision || job.digest !== snapshot.sourceDigest;
  const failed = (job.steps || []).filter(step => step.status === 'failed');
  const issues = failed.length ? failed : job.status === 'failed' ? [{ ordinal: -1, checkName: 'Validation job', output: job.output }] : [];
  const term = filter.trim().toLocaleLowerCase();
  const visibleIssues = issues.filter(step => !term || `${step.checkName}\n${step.output || job.output || ''}`.toLocaleLowerCase().includes(term));
  async function copyRepair(step) {
    const text = `Investigate the failed ${job.profile} check ${step.checkName} for workspace ${job.workspace}, revision ${job.revision}, source digest ${job.digest}. Use the recorded output as evidence, identify the cause before changing the model, and rerun the check after a fix.\n\nRecorded output:\n${step.output || job.output || '(no output recorded)'}`;
    try { await navigator.clipboard.writeText(text); setCopyMessage('Repair instruction copied.'); }
    catch { setCopyMessage('Clipboard unavailable; select and copy the recorded output below.'); }
  }
  return <section className="studio-activity studio-validation-dock" aria-label="Validation issues">
    <h2 id="studio-validation-heading" tabIndex={-1}>Validation issues</h2>
    <button type="button" aria-expanded={expanded} aria-controls="studio-validation-content" onClick={() => setExpanded(!expanded)}>{expanded ? 'Collapse validation' : 'Expand validation'}</button>
    <div id="studio-validation-content" hidden={!expanded}>
    <p>{job.profile} check at revision {job.revision}: {job.status}{stale ? ' — stale for the current draft' : ''}.</p>
    {!issues.length && <p>{job.status === 'passed' ? 'No failed steps in this job. Other required checks may still be missing.' : 'No failed step has been reported.'}</p>}
    {issues.length > 0 && <><label>Filter failed checks <input value={filter} onChange={event => setFilter(event.target.value)} placeholder="Check name or recorded output" /></label><p aria-live="polite">Showing {visibleIssues.length} of {issues.length} failed checks{term ? ' matching the filter' : ''}.</p></>}
    {visibleIssues.map(step => <article key={step.ordinal}>
      <h3>Failed check: {step.checkName}</h3>
      <p>Severity: error. Affected concept and cause are not determined by this check summary; inspect its output before choosing a repair.</p>
      {fixtureFailures(step).length > 0 && <><h4>Synthetic fixture mismatches</h4><p>These are test examples, not live data or a claim that the model is incomplete.</p><ul>{fixtureFailures(step).map(item => <li key={item.case}>{item.case}: expected {item.expectedConformance ? 'conformance' : 'rejection'}, observed {item.actualConformance ? 'conformance' : 'rejection'}.{fixtureConcepts[item.case] && <> Fixture target: {fixtureConcepts[item.case].join('.')}. <button type="button" disabled={stale} onClick={() => onFocusConcept(fixtureConcepts[item.case][0])}>Inspect {fixtureConcepts[item.case][0]}</button></>}</li>)}</ul></>}
      <details><summary>Recorded check output</summary><StudioScrollableText label={`Recorded output: ${step.checkName}`}>{step.output || job.output || 'No output was recorded.'}</StudioScrollableText></details>
      <button type="button" onClick={() => copyRepair(step)}>Copy repair instruction</button>
    </article>)}
    {copyMessage && <p aria-live="polite">{copyMessage}</p>}
    {['failed', 'cancelled', 'interrupted'].includes(job.status) && <button type="button" disabled={disabled} onClick={() => onRetry(job.profile)}>Retry {job.profile} check on current draft</button>}
    </div>
  </section>;
}
