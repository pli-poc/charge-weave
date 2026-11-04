// Include bounded check identities, never raw output or credentials, in a copied handoff.
export function contextCheckSummary(job, snapshot) {
  if (!job || job.profile?.startsWith('publication-')) return ['Recorded checks: none displayed.'];
  const stale = job.revision !== snapshot.revision || job.digest !== snapshot.sourceDigest;
  const clean = value => String(value ?? '').replace(/[\r\n\t]+/g, ' ').slice(0, 200);
  const failed = (job.steps || []).filter(step => step.status === 'failed');
  const lines = [`Recorded check: ${clean(job.profile)} · ${clean(job.status)} · revision ${job.revision}${stale ? ' · out of date for current draft' : ''}.`];
  if (failed.length) {
    lines.push('Failed check steps (recorded names; inspect output for cause):');
    for (const step of failed.slice(0, 10)) lines.push(`- ${clean(step.checkName)}`);
    if (failed.length > 10) lines.push(`- ${failed.length - 10} additional failed steps omitted.`);
  } else if (job.status === 'failed') lines.push('Job failed without a recorded failed step; inspect output for cause.');
  else lines.push('No failed steps are recorded in this job; other checks may be missing.');
  return lines;
}
