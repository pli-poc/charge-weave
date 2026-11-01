// Scripted rehearsal, not a model or a substitute for a live Codex session.
// All semantic changes go through the same MCP tools used by the studio.
export function maintenanceCommands() {
  return [
    { type: 'class.add', name: 'PlannedMaintenanceWindow', module: 'foundation', parent: 'Record', definition: 'A planned interval of charging station unavailability.' },
    ...[['maintenanceStation', 'ChargingStation', '!'], ['maintenanceInterval', 'TimeWindow', '!'], ['maintenanceWorkOrder', 'WorkOrder', '?'], ['maintenanceAccountableParty', 'LegalEntity', '!']].map(([name, range, cardinality]) => ({ type: 'relationship.add', owner: 'PlannedMaintenanceWindow', name, range, cardinality })),
    { type: 'property.add', owner: 'PlannedMaintenanceWindow', name: 'maintenanceReason', range: 'string', cardinality: '!' },
    { type: 'property.add', owner: 'PlannedMaintenanceWindow', name: 'maintenancePlanningState', range: '{Draft,Confirmed,Cancelled}', cardinality: '!' },
    { type: 'temporal.policy_set', className: 'PlannedMaintenanceWindow', expectedPolicy: null, policy: 'snapshot-versioned' },
    { type: 'viewpoint.binding_add', owner: 'PlannedMaintenanceWindow', property: 'maintenanceAccountableParty', range: 'LegalEntity', label: 'Accountable party', category: 'ownership' },
  ];
}

export async function runMaintenanceDemo(client, workspaceId, { waitForEdit = async () => {}, log = () => {}, validate = true } = {}) {
  const call = async (name, args) => {
    const response = await client.callTool({ name, arguments: args });
    if (response.isError || !response.structuredContent) throw new Error(`Scripted demonstration failed at ${name}`);
    return response.structuredContent;
  };
  const initial = await call('ontology_workspace_get', { workspaceId });
  if (initial.revision !== 0) throw new Error('Scripted demonstration requires a fresh workspace');
  if (initial.digestVersion !== 4 || !['model/temporal-policy.json', 'model/responsibility-bindings.json'].every(path => initial.editableSources.includes(path))) throw new Error('Scripted demonstration requires a fresh workspace with temporal policy and responsibility mapping sources');
  for (const name of ['ChargingStation', 'TimeWindow', 'WorkOrder', 'LegalEntity', 'AvailabilityPolicy', 'AvailabilityResult']) {
    const found = await call('ontology_context_search', { workspaceId, query: name });
    if (!found.results.some(item => item.name === name)) throw new Error(`Baseline concept is unavailable: ${name}`);
  }
  const existing = await call('ontology_context_search', { workspaceId, query: 'PlannedMaintenanceWindow' });
  if (existing.results.some(item => item.name === 'PlannedMaintenanceWindow')) throw new Error('The baseline already contains PlannedMaintenanceWindow; inspect and reuse it instead of adding a duplicate');
  const nearby = await call('ontology_context_search', { workspaceId, query: 'maintenance', limit: 100 });
  if (nearby.results.some(item => /maintenance.*(window|interval)|(window|interval).*maintenance/i.test(item.name))) throw new Error('A maintenance-window concept already exists; inspect it before adding another');
  log(`Maintenance-related concepts found: ${nearby.results.map(item => item.name).join(', ') || 'none'}.`);
  log('Discovered existing station, time, work-order, responsibility and availability concepts.');
  const request = { workspaceId, operationId: 'scripted-maintenance-proposal', expectedRevision: 0, commands: maintenanceCommands() };
  const proposal = await call('ontology_changeset_apply', request);
  const retry = await call('ontology_changeset_apply', request);
  if (proposal.revision !== 1 || retry.eventSequence !== proposal.eventSequence) throw new Error('Proposal retry was not idempotent');
  await call('ontology_view_suggest', { workspaceId, operationId: 'scripted-maintenance-view', expectedRevision: proposal.revision, root: 'PlannedMaintenanceWindow', viewpoint: 'information', explanation: 'Inspect the new maintenance window and its reused concepts.' });
  log('Proposed a maintenance window; the identical retry did not create another revision.');
  await waitForEdit();
  let current = await call('ontology_workspace_get', { workspaceId });
  if (current.revision === proposal.revision) {
    await call('ontology_changeset_apply', { workspaceId, operationId: 'scripted-maintenance-refinement', expectedRevision: current.revision, commands: [{ type: 'class.describe', name: 'PlannedMaintenanceWindow', definition: 'A scheduled interval of charging station unavailability.' }] });
    log('No manual edit was made; the scripted client supplied a visible refinement.');
    current = await call('ontology_workspace_get', { workspaceId });
  } else log('The workspace changed during the pause; continuing from the current revision.');
  const stale = await client.callTool({ name: 'ontology_changeset_apply', arguments: { workspaceId, operationId: 'scripted-stale-check', expectedRevision: proposal.revision, commands: [{ type: 'class.describe', name: 'PlannedMaintenanceWindow', definition: 'A stale description that must not be applied.' }] } });
  if (!stale.isError) throw new Error('Stale revision was unexpectedly accepted');
  const after = await call('ontology_workspace_get', { workspaceId });
  if (after.revision !== current.revision || after.sourceDigest !== current.sourceDigest) throw new Error('Stale command changed the workspace');
  const graph = await call('ontology_view_get', { workspaceId, root: 'PlannedMaintenanceWindow', expectedRevision: current.revision });
  const diff = await call('ontology_changeset_diff', { workspaceId });
  log('A stale edit was rejected; inspect the current graph and source diff in the studio.');
  let job = null, fixtureJob = null;
  if (validate) {
    job = await call('ontology_validation_start', { workspaceId, operationId: 'scripted-maintenance-reference', expectedRevision: current.revision, sourceDigest: current.sourceDigest, profile: 'reference' });
    log('Reference validation started; its result is tied to the current draft.');
    while (['queued', 'running', 'cancelling'].includes(job.status)) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      job = await call('ontology_job_get', { workspaceId, jobId: job.id });
    }
    log(`Reference validation: ${job.status}${job.stale ? ' (stale)' : ''}.`);
    if (job.status === 'passed' && !job.stale) {
      fixtureJob = await call('ontology_validation_start', { workspaceId, operationId: 'scripted-maintenance-fixtures', expectedRevision: current.revision, sourceDigest: current.sourceDigest, profile: 'maintenance-demo' });
      log('Checking synthetic maintenance examples against the generated property shapes and shared TimeWindow rule.');
      while (['queued', 'running', 'cancelling'].includes(fixtureJob.status)) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        fixtureJob = await call('ontology_job_get', { workspaceId, jobId: fixtureJob.id });
      }
      log(`Maintenance fixtures: ${fixtureJob.status}${fixtureJob.stale ? ' (stale)' : ''}.`);
      if (fixtureJob.status === 'passed' && !fixtureJob.stale) {
        const step = fixtureJob.steps.find(item => item.checkName === 'tools/test_authoring_maintenance_demo.py');
        const report = JSON.parse(step?.output?.split(/\r?\n/).find(line => line.trim().startsWith('{')) || 'null');
        if (!report || !Array.isArray(report.cases)) throw new Error('Maintenance fixture evidence is unavailable');
        for (const item of report.cases) log(`${item.case}: ${item.expectedConformance ? 'accepted' : 'rejected'} as expected.`);
      }
    }
  } else log('Reference validation was explicitly skipped for this quick rehearsal.');
  return { workspaceId, baselineCommit: current.baselineCommit, revision: current.revision, sourceDigest: current.sourceDigest, proposal, graph, diff, job, fixtureJob };
}
