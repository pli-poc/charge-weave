import React, { useState } from 'react';

// A failing check is evidence of a failed check, not automatically a model defect.
export default function ValidationIssues({ job, snapshot, onRetry }) {
  const [copyMessage, setCopyMessage] = useState('');
  if (!job || ['publication-preview', 'publication-commit', 'publication-push', 'publication-pr'].includes(job.profile)) return null;
  const stale = job.revision !== snapshot.revision || job.digest !== snapshot.sourceDigest;
  const failed = (job.steps || []).filter(step => step.status === 'failed');
  const issues = failed.length ? failed : job.status === 'failed' ? [{ ordinal: -1, checkName: 'Validation job', output: job.output }] : [];
  async function copyRepair(step) {
    const text = `Investigate the failed ${job.profile} check ${step.checkName} for workspace ${job.workspace}, revision ${job.revision}, source digest ${job.digest}. Use the recorded output as evidence, identify the cause before changing the model, and rerun the check after a fix.\n\nRecorded output:\n${step.output || job.output || '(no output recorded)'}`;
    try { await navigator.clipboard.writeText(text); setCopyMessage('Repair instruction copied.'); }
    catch { setCopyMessage('Clipboard unavailable; select and copy the recorded output below.'); }
  }
  return <section className="studio-activity" aria-label="Validation issues">
    <h2>Validation issues</h2>
    <p>{job.profile} check at revision {job.revision}: {job.status}{stale ? ' — stale for the current draft' : ''}.</p>
    {!issues.length && <p>{job.status === 'passed' ? 'No failed steps in this job. Other required checks may still be missing.' : 'No failed step has been reported.'}</p>}
    {issues.map(step => <article key={step.ordinal}>
      <h3>Failed check: {step.checkName}</h3>
      <p>Severity: error. Affected concept and cause are not determined by this check summary; inspect its output before choosing a repair.</p>
      <details><summary>Recorded check output</summary><pre>{step.output || job.output || 'No output was recorded.'}</pre></details>
      <button type="button" onClick={() => copyRepair(step)}>Copy repair instruction</button>
    </article>)}
    {copyMessage && <p aria-live="polite">{copyMessage}</p>}
    {['failed', 'cancelled', 'interrupted'].includes(job.status) && <button type="button" onClick={() => onRetry(job.profile)}>Retry {job.profile} check on current draft</button>}
  </section>;
}
