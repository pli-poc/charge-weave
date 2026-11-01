import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { runGenerator } from './validation.js';
import { changeImpact } from './impact.js';
import { publicationPreflight } from './publication-preflight.js';
import { githubCommitWorkflows, githubRequiredChecks } from './github-ci.js';
import { runPublicationCommit, runPublicationPreview } from './publication-candidate.js';
import { runPublicationPush } from './publication-push.js';
import { runPublicationPullRequest } from './publication-pr.js';
import { applicationError } from './errors.js';

// The transport supplies the authenticated actor; tool arguments never select it.
export function createServer(store, actor, options = {}) {
  if (!actor) throw new Error('An authenticated actor is required');
  const server = new McpServer({ name: 'chargeweave-ontology-authoring', version: '0.1.0' });
  const result = value => ({ content: [{ type: 'text', text: JSON.stringify(value) }], structuredContent: value });
  const registerTool = (name, config, handler) => server.registerTool(name, config, async (...args) => {
    try { return await handler(...args); }
    catch (problem) {
      const error = applicationError(problem);
      return { isError: true, content: [{ type: 'text', text: `${error.code}: ${error.message} ${error.recovery}` }], structuredContent: { error } };
    }
  });
  const workspaceId = z.string().uuid();
  const operationId = z.string().min(1).max(128);
  const revision = z.number().int().nonnegative().safe();
  const resource = (name, template, description, read) => server.registerResource(name, new ResourceTemplate(template, { list: undefined }), { description, mimeType: 'application/json' }, async (uri, variables) => {
    const id = workspaceId.parse(variables.workspaceId);
    const value = await read(id, variables);
    const text = JSON.stringify({ contractVersion: 'chargeweave-resource-v1', ...value });
    if (Buffer.byteLength(text) > 256 * 1024) throw new Error('Resource exceeds bounded response size');
    return { contents: [{ uri: uri.href, mimeType: 'application/json', text }] };
  });
  resource('workspace-summary', 'ontology://workspace/{workspaceId}/v1/summary', 'Bounded workspace identity and event cursor.', id => {
    const value = store.snapshot(id);
    return { workspaceId: id, title: value.title, baselineCommit: value.baselineCommit, revision: value.revision, sourceDigest: value.sourceDigest, digestVersion: value.digestVersion, changeSet: value.changeSet, eventSequence: value.eventSequence, editableSources: value.editableSources };
  });
  resource('workspace-entity', 'ontology://workspace/{workspaceId}/v1/entity/{entity}', 'Source-grounded class inspection by local name or encoded development IRI.', (id, vars) => {
    const decoded = decodeURIComponent(z.string().max(768).parse(vars.entity));
    const prefix = 'https://example.org/charge-domain#';
    const name = decoded.startsWith(prefix) ? decoded.slice(prefix.length) : decoded;
    if (!/^[A-Za-z][A-Za-z0-9]{0,127}$/.test(name)) throw new Error('Unsupported entity identifier');
    return store.entity(id, name);
  });
  resource('workspace-changes', 'ontology://workspace/{workspaceId}/v1/changes', 'Bounded semantic change summary; use the diff tool for source patches.', id => {
    const value = store.diff(id);
    return { workspaceId: id, baselineCommit: value.baselineCommit, revision: value.revision, sourceDigest: value.sourceDigest, changes: value.changes.slice(0, 100).map(item => ({ kind: item.kind, name: item.name, fieldChanges: item.fieldChanges.slice(0, 20), omittedFields: Math.max(0, item.fieldChanges.length - 20) })), omitted: Math.max(0, value.changes.length - 100), additionalSourcePaths: value.additionalSources.map(item => item.path) };
  });
  if (options.repository) resource('workspace-evidence', 'ontology://workspace/{workspaceId}/v1/evidence/{evidenceId}', 'Bounded completed validation evidence; logs are available through the job tool.', (id, vars) => {
    const value = store.evidence(id, z.string().uuid().parse(vars.evidenceId));
    return { workspaceId: id, id: value.id, baselineCommit: value.baselineCommit, revision: value.revision, sourceDigest: value.digest, profile: value.profile, status: value.status, stale: value.stale, scope: value.scope, completeAcceptanceEvidence: value.completeAcceptanceEvidence, steps: value.steps.map(({ checkName, status }) => ({ checkName, status })) };
  });
  const command = z.union([
    z.object({ type: z.literal('class.add'), name: z.string().max(128), module: z.string().max(128), parent: z.string().max(128), definition: z.string().max(4000) }).strict(),
    z.object({ type: z.literal('class.describe'), name: z.string().max(128), definition: z.string().max(4000) }).strict(),
    z.object({ type: z.literal('property.add'), owner: z.string().max(128), name: z.string().max(128), range: z.string().max(128), cardinality: z.enum(['!', '?', '+', '*']) }).strict(),
    z.object({ type: z.literal('property.update'), owner: z.string().max(128), name: z.string().max(128), expectedRange: z.string().max(128), expectedCardinality: z.enum(['!', '?', '+', '*']), range: z.string().max(128), cardinality: z.enum(['!', '?', '+', '*']) }).strict(),
    z.object({ type: z.literal('constraint.add'), template: z.enum(['required-relationship', 'allowed-values']), owner: z.string().max(128), name: z.string().max(128), expectedRange: z.string().max(128), expectedCardinality: z.enum(['!', '?', '+', '*']), values: z.array(z.string().regex(/^[A-Za-z][A-Za-z0-9]*$/).max(128)).min(2).max(50).optional() }).strict(),
    z.object({ type: z.literal('constraint.add'), template: z.literal('valid-interval'), owner: z.string().regex(/^[A-Za-z][A-Za-z0-9]*$/).max(128), startProperty: z.string().regex(/^[A-Za-z][A-Za-z0-9]*$/).max(128), endProperty: z.string().regex(/^[A-Za-z][A-Za-z0-9]*$/).max(128), expectedStartCardinality: z.enum(['!', '?']), expectedEndCardinality: z.enum(['!', '?']), requirementId: z.string().regex(/^BR-[0-9]+$/).max(32), expectedRules: z.array(z.string().regex(/^B[0-9]{3,6}$/)).max(500), ruleId: z.string().regex(/^B[0-9]{3,6}$/) }).strict(),
    z.object({ type: z.literal('requirement.link'), requirementId: z.string().regex(/^BR-[0-9]+$/).max(32), className: z.string().regex(/^[A-Za-z][A-Za-z0-9]*$/).max(128), expectedClasses: z.array(z.string().regex(/^[A-Za-z][A-Za-z0-9]*$/).max(128)).max(200) }).strict(),
    z.object({ type: z.literal('temporal.policy_set'), className: z.string().regex(/^[A-Za-z][A-Za-z0-9]*$/).max(128), expectedPolicy: z.enum(['abstract', 'history-metadata', 'immutable-aggregate', 'snapshot-versioned', 'tenant-context']).nullable(), policy: z.enum(['abstract', 'history-metadata', 'immutable-aggregate', 'snapshot-versioned', 'tenant-context']) }).strict(),
    z.object({ type: z.literal('viewpoint.binding_add'), owner: z.string().regex(/^[A-Za-z][A-Za-z0-9]*$/).max(128), property: z.string().regex(/^[A-Za-z][A-Za-z0-9]*$/).max(128), range: z.string().regex(/^[A-Za-z][A-Za-z0-9]*$/).max(128), label: z.string().min(1).max(100), category: z.enum(['ownership', 'service', 'role', 'assignment', 'affected']) }).strict(),
    z.object({ type: z.literal('relationship.add'), owner: z.string().max(128), name: z.string().max(128), range: z.string().max(128), cardinality: z.enum(['!', '?', '+', '*']), description: z.string().min(1).max(4000).optional() }).strict(),
  ]);
  if (options.workspaceId) registerTool('ontology_workspace_list', { description: 'List the one workspace authorized for this local service session.', inputSchema: {}, annotations: { readOnlyHint: true } }, async () => {
    const workspace = store.snapshot(options.workspaceId);
    return result({ workspaces: [{ workspaceId: workspace.id, title: workspace.title, baselineCommit: workspace.baselineCommit, revision: workspace.revision, sourceDigest: workspace.sourceDigest }] });
  });
  registerTool('ontology_workspace_get', { description: 'Read a pinned workspace identity, source and event cursor.', inputSchema: { workspaceId }, annotations: { readOnlyHint: true } }, async args => result(store.snapshot(args.workspaceId)));
  registerTool('ontology_constraint_templates', { description: 'List the bounded schema constraint templates supported by the pinned adapter.', inputSchema: { workspaceId }, annotations: { readOnlyHint: true } }, async args => result(store.constraintTemplates(args.workspaceId)));
  registerTool('ontology_context_search', { description: 'Search existing model classes before proposing additions.', inputSchema: { workspaceId, query: z.string().max(200), limit: z.number().int().min(1).max(100).optional(), expectedRevision: revision.optional() }, annotations: { readOnlyHint: true } }, async args => result(store.search(args.workspaceId, args.query, args.limit, args.expectedRevision)));
  registerTool('ontology_requirement_search', { description: 'Search the editable requirement register with exact class-list preconditions; linking a term does not prove acceptance.', inputSchema: { workspaceId, query: z.string().max(200), limit: z.number().int().min(1).max(50).optional(), expectedRevision: revision.optional() }, annotations: { readOnlyHint: true } }, async args => result(store.requirementsSearch(args.workspaceId, args.query, args.limit, args.expectedRevision)));
  registerTool('ontology_entity_get', { description: 'Inspect a class and its declared and inherited fields with source locations. Supply either a local name or ChargeWeave development IRI.', inputSchema: { workspaceId, name: z.string().max(128).optional(), iri: z.string().max(256).optional(), expectedRevision: revision.optional() }, annotations: { readOnlyHint: true } }, async args => {
    const prefix = 'https://example.org/charge-domain#';
    if (Boolean(args.name) === Boolean(args.iri) || (args.iri && !args.iri.startsWith(prefix))) throw new Error('Provide exactly one supported entity name or IRI');
    return result(store.entity(args.workspaceId, args.name ?? args.iri.slice(prefix.length), args.expectedRevision));
  });
  registerTool('ontology_view_get', { description: 'Read a bounded explicit class neighbourhood from the draft schema.', inputSchema: { workspaceId, root: z.string().max(128), expectedRevision: revision.optional() }, annotations: { readOnlyHint: true } }, async args => result(store.view(args.workspaceId, args.root, args.expectedRevision)));
  registerTool('ontology_view_saved_get', { description: 'Read a shared saved presentation view and its independent revision.', inputSchema: { workspaceId, viewId: z.string().min(1).max(64) }, annotations: { readOnlyHint: true } }, async args => result(store.savedView(args.workspaceId, args.viewId)));
  registerTool('ontology_view_saved_list', { description: 'List up to 100 shared presentation views in this workspace.', inputSchema: { workspaceId }, annotations: { readOnlyHint: true } }, async args => result(store.savedViews(args.workspaceId)));
  registerTool('ontology_view_save', { description: 'Save a shared presentation view with an independent optimistic revision; groups and annotations are visual metadata, not ontology assertions.', inputSchema: { workspaceId, viewId: z.string().min(1).max(64), operationId, expectedViewRevision: revision, definition: z.object({ root: z.string().max(128), positions: z.record(z.string(), z.object({ x: z.number().finite(), y: z.number().finite() }).strict()), mappingVersion: z.literal('chargeweave-authoring-v1').optional(), viewpoint: z.enum(['information', 'responsibility', 'temporal']).optional(), filter: z.string().max(200).optional(), groups: z.array(z.object({ name: z.string().min(1).max(100), members: z.array(z.string().max(128)).max(100) }).strict()).max(50).optional(), annotations: z.array(z.object({ target: z.string().max(128), text: z.string().min(1).max(1000) }).strict()).max(100).optional() }).strict() }, annotations: { idempotentHint: true } }, async args => result(store.saveView({ ...args, actor })));
  registerTool('ontology_responsibility_view_get', { description: 'Inspect explicit responsibility-related relationships matched by a versioned, partial mapping; absence is not inferred.', inputSchema: { workspaceId, root: z.string().max(128), expectedRevision: revision.optional() }, annotations: { readOnlyHint: true } }, async args => result(store.responsibilityView(args.workspaceId, args.root, args.expectedRevision)));
  registerTool('ontology_changeset_diff', { description: 'Compare the current draft with its committed baseline.', inputSchema: { workspaceId }, annotations: { readOnlyHint: true } }, async args => result(store.diff(args.workspaceId)));
  registerTool('ontology_history_get', { description: 'Read the most recent committed workspace events.', inputSchema: { workspaceId }, annotations: { readOnlyHint: true } }, async args => result({ events: store.recentEvents(args.workspaceId) }));
  registerTool('ontology_history_detail', { description: 'Read the recorded, digest-verified before/after and baseline patches for a historical command group; older snapshots may be unavailable.', inputSchema: { workspaceId, revision: revision.min(1) }, annotations: { readOnlyHint: true } }, async args => result(store.historyDetail(args.workspaceId, args.revision)));
  registerTool('ontology_view_suggest', { description: 'Suggest a concept and perspective to a connected viewer; this does not change the model or force a selection.', inputSchema: { workspaceId, operationId, expectedRevision: revision, root: z.string().regex(/^[A-Za-z][A-Za-z0-9]*$/).max(128), viewpoint: z.enum(['information', 'responsibility', 'temporal']), explanation: z.string().min(1).max(500) }, annotations: { idempotentHint: true } }, async args => result(store.suggestView(args.workspaceId, { ...args, actor })));
  registerTool('ontology_changeset_open', { description: 'Open one change set for the current workspace draft, recording its intent and optional existing requirement IDs.', inputSchema: { workspaceId, operationId, expectedRevision: revision, intent: z.string().min(1).max(1000), requirements: z.array(z.string().regex(/^BR-[0-9]+$/)).max(100).optional() }, annotations: { idempotentHint: true } }, async args => result(store.openChangeSet({ ...args, actor })));
  if (options.role === 'reviewer') {
    registerTool('ontology_publication_capabilities', { description: 'Inspect whether this local server has publisher permission enabled.', inputSchema: { workspaceId }, annotations: { readOnlyHint: true } }, async args => { store.get(args.workspaceId); return result({ canPush: Boolean(options.allowPublish) }); });
    registerTool('ontology_publication_history', { description: 'Inspect durable publication intents and uncertain push outcomes; prepared entries do not mean anything was pushed.', inputSchema: { workspaceId }, annotations: { readOnlyHint: true } }, async args => result({ publications: store.publicationHistory(args.workspaceId) }));
    registerTool('ontology_publication_reserve', { description: 'Record a reviewed staged candidate and proposed commit message as a local publication intent. This does not create a commit or push.', inputSchema: { workspaceId, operationId, expectedRevision: revision, sourceDigest: z.string().regex(/^[a-f0-9]{64}$/), reviewId: z.string().uuid(), previewJobId: z.string().uuid(), subject: z.string().min(1).max(120), body: z.string().min(1).max(10000) }, annotations: { idempotentHint: true } }, async args => result(store.reservePublication(args.workspaceId, { ...args, actor })));
    registerTool('ontology_github_commit_workflows', { description: 'Look up public GitHub Actions runs for an exact ChargeWeave commit. Required branch-protection checks and deployment are not verified.', inputSchema: { workspaceId, commitSha: z.string().regex(/^[a-f0-9]{40}$/) }, annotations: { readOnlyHint: true } }, async args => {
      store.get(args.workspaceId);
      return result(await githubCommitWorkflows(args.commitSha, options.ciFetch));
    });
    registerTool('ontology_github_required_checks', { description: 'Inspect available main-branch required status checks against an exact commit. Missing policy access and incomplete or ambiguous results remain unknown.', inputSchema: { workspaceId, commitSha: z.string().regex(/^[a-f0-9]{40}$/) }, annotations: { readOnlyHint: true } }, async args => {
      store.get(args.workspaceId);
      return result(await githubRequiredChecks(args.commitSha, options.githubToken, options.ciFetch));
    });
    registerTool('ontology_reviewer_interval_case_add', { description: 'Record one reviewer-authored synthetic interval case and its expected decision; later checks evaluate it. Review independence and business relevance.', inputSchema: { workspaceId, operationId, expectedRevision: revision, changeSetId: z.string().uuid().optional(), requirementId: z.string().regex(/^BR-[0-9]+$/).max(32), ruleId: z.string().regex(/^B[0-9]{3,6}$/), caseId: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9-]{0,127}$/), start: z.string().max(20), end: z.string().max(20), expectedConformance: z.boolean(), scenario: z.string().min(12).max(1000) }, annotations: { idempotentHint: true } }, async args => {
      const { workspaceId: id, operationId: op, expectedRevision: rev, changeSetId, ...values } = args;
      return result(store.applyReviewerCase({ workspaceId: id, operationId: op, expectedRevision: rev, changeSetId, actor, command: { type: 'reviewer.interval_case_add', ...values } }));
    });
    registerTool('ontology_review_readiness', { description: 'Inspect exact-digest evidence and missing review gates. Passing checks do not establish business completeness.', inputSchema: { workspaceId }, annotations: { readOnlyHint: true } }, async args => result(store.reviewReadiness(args.workspaceId)));
    registerTool('ontology_review_decisions', { description: 'Read recent reviewer decisions and whether each still matches the draft.', inputSchema: { workspaceId }, annotations: { readOnlyHint: true } }, async args => result({ decisions: store.reviewDecisions(args.workspaceId) }));
    registerTool('ontology_changeset_review', { description: 'Record a digest-bound reviewer decision; acceptance requires current validation evidence and does not publish the draft.', inputSchema: { workspaceId, operationId, expectedRevision: revision, changeSetId: z.string().uuid().optional(), sourceDigest: z.string().regex(/^[a-f0-9]{64}$/), decision: z.enum(['accept', 'request_changes', 'reject']), reason: z.string().min(1).max(4000) }, annotations: { idempotentHint: true } }, async args => result(store.recordReview(args.workspaceId, { ...args, actor })));
    registerTool('ontology_changeset_reopen', { description: 'Reopen an accepted or rejected change set, invalidating its acceptance without changing source.', inputSchema: { workspaceId, operationId, expectedRevision: revision, changeSetId: z.string().uuid() }, annotations: { idempotentHint: true } }, async args => result(store.reopenChangeSet({ ...args, actor })));
  }
  if (options.repository) {
    if (options.role === 'reviewer') registerTool('ontology_publication_preflight', { description: 'Inspect the configured target head, draft source files and available evidence. Does not accept or publish.', inputSchema: { workspaceId, expectedRevision: revision.optional() }, annotations: { readOnlyHint: true } }, async args => result(await publicationPreflight(store, args.workspaceId, args.expectedRevision, options.repository, options.publicationFixture)));
    if (options.role === 'reviewer') registerTool('ontology_publication_prepare', { description: 'Prepare an accepted exact draft in a disposable checkout and return a job for its staged file manifest. This does not commit, push or check the remote.', inputSchema: { workspaceId, operationId, expectedRevision: revision, sourceDigest: z.string().regex(/^[a-f0-9]{64}$/), reviewId: z.string().uuid() }, annotations: { idempotentHint: true } }, async args => {
      const { job, created } = store.createJob(args.workspaceId, args.expectedRevision, args.sourceDigest, actor, args.operationId, 'publication-preview', args.reviewId);
      if (created) {
        if (options.startPublication) options.startPublication(args.workspaceId, args.reviewId, job);
        else void runPublicationPreview(store, args.workspaceId, args.reviewId, job, options.repository, options.python);
      }
      return result(job);
    });
    if (options.role === 'reviewer') registerTool('ontology_publication_create_commit', { description: 'Reconstruct the saved intent and create a local Git commit and recoverable bundle. Requires configured Git user.name and user.email; does not push.', inputSchema: { workspaceId, operationId, expectedRevision: revision, sourceDigest: z.string().regex(/^[a-f0-9]{64}$/), publicationId: z.string().uuid() }, annotations: { idempotentHint: true } }, async args => {
      const { job, created } = store.createJob(args.workspaceId, args.expectedRevision, args.sourceDigest, actor, args.operationId, 'publication-commit', args.publicationId);
      if (created) {
        if (options.startCommit) options.startCommit(args.workspaceId, args.publicationId, job);
        else void runPublicationCommit(store, args.workspaceId, args.publicationId, job, options.repository, options.python);
      }
      return result(job);
    });
    if (options.role === 'reviewer' && options.allowPublish) registerTool('ontology_publication_push', { description: 'Push the recorded commit to its unique branch or reconcile a previous uncertain push. Requires explicitly configured publisher permission; never pushes main or force-pushes.', inputSchema: { workspaceId, operationId, expectedRevision: revision, sourceDigest: z.string().regex(/^[a-f0-9]{64}$/), publicationId: z.string().uuid() }, annotations: { idempotentHint: true } }, async args => {
      const { job, created } = store.createJob(args.workspaceId, args.expectedRevision, args.sourceDigest, actor, args.operationId, 'publication-push', args.publicationId);
      if (created) {
        if (options.startPush) options.startPush(args.workspaceId, args.publicationId, job);
        else void runPublicationPush(store, args.workspaceId, args.publicationId, job, options.repository, options.githubToken, options.publicationFixture);
      }
      return result(job);
    });
    if (options.role === 'reviewer' && options.allowPublish) registerTool('ontology_publication_pull_request', { description: 'Create a draft pull request for the confirmed branch, or reconcile a previous uncertain response. Required checks and deployment are separate.', inputSchema: { workspaceId, operationId, expectedRevision: revision, sourceDigest: z.string().regex(/^[a-f0-9]{64}$/), publicationId: z.string().uuid() }, annotations: { idempotentHint: true } }, async args => {
      const { job, created } = store.createJob(args.workspaceId, args.expectedRevision, args.sourceDigest, actor, args.operationId, 'publication-pr', args.publicationId);
      if (created) {
        if (options.startPullRequest) options.startPullRequest(args.workspaceId, args.publicationId, job);
        else void runPublicationPullRequest(store, args.workspaceId, args.publicationId, job, options.githubToken, options.pullRequestFetch);
      }
      return result(job);
    });
    registerTool('ontology_change_impact_get', { description: 'Find bounded explicit references in pinned requirements, journeys, rules and temporal queries; coverage is partial.', inputSchema: { workspaceId, expectedRevision: revision.optional() }, annotations: { readOnlyHint: true } }, async args => {
      const workspace = store.get(args.workspaceId);
      if (args.expectedRevision !== undefined && args.expectedRevision !== workspace.revision) throw new Error('Revision conflict');
      return result(changeImpact(workspace, store.diff(args.workspaceId).changes, options.repository));
    });
    registerTool('ontology_temporal_view_get', { description: 'Inspect explicit time fields and the pinned class temporal policy; no missing policy or relationship is inferred.', inputSchema: { workspaceId, root: z.string().max(128), expectedRevision: revision.optional() }, annotations: { readOnlyHint: true } }, async args => result(store.temporalView(args.workspaceId, args.root, args.expectedRevision, options.repository)));
    registerTool('ontology_validation_start', { description: 'Run structural, reference, maintenance-demo fixture, independent audit or release checks on an isolated pinned draft.', inputSchema: { workspaceId, operationId, expectedRevision: revision, sourceDigest: z.string().regex(/^[a-f0-9]{64}$/), profile: z.enum(['structural', 'reference', 'audit', 'acceptance', 'maintenance-demo']).default('structural') }, annotations: { idempotentHint: true } }, async args => {
      const workspace = store.get(args.workspaceId);
      const { job, created } = store.createJob(args.workspaceId, args.expectedRevision, args.sourceDigest, actor, args.operationId, args.profile);
      if (created) {
        if (options.startValidation) options.startValidation(workspace, job);
        else void runGenerator(store, workspace, job, options.repository, options.python);
      }
      return result(job);
    });
    registerTool('ontology_job_get', { description: 'Read generator job status and freshness.', inputSchema: { workspaceId, jobId: z.string().uuid() }, annotations: { readOnlyHint: true } }, async args => result(store.job(args.workspaceId, args.jobId)));
    registerTool('ontology_evidence_get', { description: 'Read completed validation evidence and its exact baseline, revision and digest.', inputSchema: { workspaceId, evidenceId: z.string().uuid() }, annotations: { readOnlyHint: true } }, async args => result(store.evidence(args.workspaceId, args.evidenceId)));
    if (options.cancelValidation) registerTool('ontology_job_cancel', { description: 'Request cooperative cancellation after the current fixed check finishes.', inputSchema: { workspaceId, jobId: z.string().uuid(), operationId }, annotations: { idempotentHint: true } }, async args => {
      const outcome = store.requestJobCancel(args.workspaceId, args.jobId, actor, args.operationId);
      if (outcome.requested) options.cancelValidation(args.jobId);
      return result(outcome.job);
    });
  }
  registerTool('ontology_changeset_apply', { description: 'Atomically apply supported draft commands with an optional caller-supplied rationale at an expected revision.', inputSchema: { workspaceId, operationId, expectedRevision: revision, changeSetId: z.string().uuid().optional(), rationale: z.string().min(1).max(2000).optional(), commands: z.array(command).min(1).max(100) }, annotations: { destructiveHint: false, idempotentHint: true } }, async args => result(store.apply({ ...args, actor })));
  registerTool('ontology_changeset_undo', { description: 'Undo the latest supported command group as a new revision.', inputSchema: { workspaceId, operationId, expectedRevision: revision, changeSetId: z.string().uuid().optional(), targetRevision: revision }, annotations: { idempotentHint: true } }, async args => result(store.undo({ ...args, actor })));
  return server;
}
