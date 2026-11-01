import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { runGenerator } from './validation.js';
import { changeImpact } from './impact.js';
import { publicationPreflight } from './publication-preflight.js';

// The transport supplies the authenticated actor; tool arguments never select it.
export function createServer(store, actor, options = {}) {
  if (!actor) throw new Error('An authenticated actor is required');
  const server = new McpServer({ name: 'chargeweave-ontology-authoring', version: '0.1.0' });
  const result = value => ({ content: [{ type: 'text', text: JSON.stringify(value) }], structuredContent: value });
  const workspaceId = z.string().uuid();
  const operationId = z.string().min(1).max(128);
  const revision = z.number().int().nonnegative().safe();
  const command = z.union([
    z.object({ type: z.literal('class.add'), name: z.string().max(128), module: z.string().max(128), parent: z.string().max(128), definition: z.string().max(4000) }).strict(),
    z.object({ type: z.literal('class.describe'), name: z.string().max(128), definition: z.string().max(4000) }).strict(),
    z.object({ type: z.literal('property.add'), owner: z.string().max(128), name: z.string().max(128), range: z.string().max(128), cardinality: z.enum(['!', '?', '+', '*']) }).strict(),
    z.object({ type: z.literal('property.update'), owner: z.string().max(128), name: z.string().max(128), expectedRange: z.string().max(128), expectedCardinality: z.enum(['!', '?', '+', '*']), range: z.string().max(128), cardinality: z.enum(['!', '?', '+', '*']) }).strict(),
    z.object({ type: z.literal('constraint.add'), template: z.enum(['required-relationship', 'allowed-values']), owner: z.string().max(128), name: z.string().max(128), expectedRange: z.string().max(128), expectedCardinality: z.enum(['!', '?', '+', '*']), values: z.array(z.string().regex(/^[A-Za-z][A-Za-z0-9]*$/).max(128)).min(2).max(50).optional() }).strict(),
    z.object({ type: z.literal('constraint.add'), template: z.literal('valid-interval'), owner: z.string().regex(/^[A-Za-z][A-Za-z0-9]*$/).max(128), startProperty: z.string().regex(/^[A-Za-z][A-Za-z0-9]*$/).max(128), endProperty: z.string().regex(/^[A-Za-z][A-Za-z0-9]*$/).max(128), expectedStartCardinality: z.enum(['!', '?']), expectedEndCardinality: z.enum(['!', '?']), requirementId: z.string().regex(/^BR-[0-9]+$/).max(32), expectedRules: z.array(z.string().regex(/^B[0-9]{3,6}$/)).max(500), ruleId: z.string().regex(/^B[0-9]{3,6}$/) }).strict(),
    z.object({ type: z.literal('requirement.link'), requirementId: z.string().regex(/^BR-[0-9]+$/).max(32), className: z.string().regex(/^[A-Za-z][A-Za-z0-9]*$/).max(128), expectedClasses: z.array(z.string().regex(/^[A-Za-z][A-Za-z0-9]*$/).max(128)).max(200) }).strict(),
    z.object({ type: z.literal('temporal.policy_set'), className: z.string().regex(/^[A-Za-z][A-Za-z0-9]*$/).max(128), expectedPolicy: z.enum(['abstract', 'history-metadata', 'immutable-aggregate', 'snapshot-versioned', 'tenant-context']).nullable(), policy: z.enum(['abstract', 'history-metadata', 'immutable-aggregate', 'snapshot-versioned', 'tenant-context']) }).strict(),
    z.object({ type: z.literal('relationship.add'), owner: z.string().max(128), name: z.string().max(128), range: z.string().max(128), cardinality: z.enum(['!', '?', '+', '*']) }).strict(),
  ]);
  server.registerTool('ontology_workspace_get', { description: 'Read a pinned workspace identity, source and event cursor.', inputSchema: { workspaceId }, annotations: { readOnlyHint: true } }, async args => result(store.snapshot(args.workspaceId)));
  server.registerTool('ontology_constraint_templates', { description: 'List the bounded schema constraint templates supported by the pinned adapter.', inputSchema: { workspaceId }, annotations: { readOnlyHint: true } }, async args => result(store.constraintTemplates(args.workspaceId)));
  server.registerTool('ontology_context_search', { description: 'Search existing model classes before proposing additions.', inputSchema: { workspaceId, query: z.string().max(200), limit: z.number().int().min(1).max(100).optional(), expectedRevision: revision.optional() }, annotations: { readOnlyHint: true } }, async args => result(store.search(args.workspaceId, args.query, args.limit, args.expectedRevision)));
  server.registerTool('ontology_requirement_search', { description: 'Search the editable requirement register with exact class-list preconditions; linking a term does not prove acceptance.', inputSchema: { workspaceId, query: z.string().max(200), limit: z.number().int().min(1).max(50).optional(), expectedRevision: revision.optional() }, annotations: { readOnlyHint: true } }, async args => result(store.requirementsSearch(args.workspaceId, args.query, args.limit, args.expectedRevision)));
  server.registerTool('ontology_entity_get', { description: 'Inspect a class and its declared and inherited fields with source locations. Supply either a local name or ChargeWeave development IRI.', inputSchema: { workspaceId, name: z.string().max(128).optional(), iri: z.string().max(256).optional(), expectedRevision: revision.optional() }, annotations: { readOnlyHint: true } }, async args => {
    const prefix = 'https://example.org/charge-domain#';
    if (Boolean(args.name) === Boolean(args.iri) || (args.iri && !args.iri.startsWith(prefix))) throw new Error('Provide exactly one supported entity name or IRI');
    return result(store.entity(args.workspaceId, args.name ?? args.iri.slice(prefix.length), args.expectedRevision));
  });
  server.registerTool('ontology_view_get', { description: 'Read a bounded explicit class neighbourhood from the draft schema.', inputSchema: { workspaceId, root: z.string().max(128), expectedRevision: revision.optional() }, annotations: { readOnlyHint: true } }, async args => result(store.view(args.workspaceId, args.root, args.expectedRevision)));
  server.registerTool('ontology_responsibility_view_get', { description: 'Inspect explicit responsibility-related relationships matched by a versioned, partial mapping; absence is not inferred.', inputSchema: { workspaceId, root: z.string().max(128), expectedRevision: revision.optional() }, annotations: { readOnlyHint: true } }, async args => result(store.responsibilityView(args.workspaceId, args.root, args.expectedRevision)));
  server.registerTool('ontology_changeset_diff', { description: 'Compare the current draft with its committed baseline.', inputSchema: { workspaceId }, annotations: { readOnlyHint: true } }, async args => result(store.diff(args.workspaceId)));
  server.registerTool('ontology_history_get', { description: 'Read the most recent committed workspace events.', inputSchema: { workspaceId }, annotations: { readOnlyHint: true } }, async args => result({ events: store.recentEvents(args.workspaceId) }));
  server.registerTool('ontology_view_suggest', { description: 'Suggest a concept and perspective to a connected viewer; this does not change the model or force a selection.', inputSchema: { workspaceId, operationId, expectedRevision: revision, root: z.string().regex(/^[A-Za-z][A-Za-z0-9]*$/).max(128), viewpoint: z.enum(['information', 'responsibility', 'temporal']), explanation: z.string().min(1).max(500) }, annotations: { idempotentHint: true } }, async args => result(store.suggestView(args.workspaceId, { ...args, actor })));
  if (options.role === 'reviewer') {
    server.registerTool('ontology_reviewer_interval_case_add', { description: 'Record one reviewer-authored synthetic interval case and its expected decision; later checks evaluate it. Review independence and business relevance.', inputSchema: { workspaceId, operationId, expectedRevision: revision, requirementId: z.string().regex(/^BR-[0-9]+$/).max(32), ruleId: z.string().regex(/^B[0-9]{3,6}$/), caseId: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9-]{0,127}$/), start: z.string().max(20), end: z.string().max(20), expectedConformance: z.boolean(), scenario: z.string().min(12).max(1000) }, annotations: { idempotentHint: true } }, async args => {
      const { workspaceId: id, operationId: op, expectedRevision: rev, ...values } = args;
      return result(store.applyReviewerCase({ workspaceId: id, operationId: op, expectedRevision: rev, actor, command: { type: 'reviewer.interval_case_add', ...values } }));
    });
    server.registerTool('ontology_review_readiness', { description: 'Inspect exact-digest evidence and missing review gates. Passing checks do not establish business completeness.', inputSchema: { workspaceId }, annotations: { readOnlyHint: true } }, async args => result(store.reviewReadiness(args.workspaceId)));
    server.registerTool('ontology_review_decisions', { description: 'Read recent reviewer decisions and whether each still matches the draft.', inputSchema: { workspaceId }, annotations: { readOnlyHint: true } }, async args => result({ decisions: store.reviewDecisions(args.workspaceId) }));
    server.registerTool('ontology_changeset_review', { description: 'Record a digest-bound reviewer decision; acceptance requires current validation evidence and does not publish the draft.', inputSchema: { workspaceId, operationId, expectedRevision: revision, sourceDigest: z.string().regex(/^[a-f0-9]{64}$/), decision: z.enum(['accept', 'request_changes', 'reject']), reason: z.string().min(1).max(4000) }, annotations: { idempotentHint: true } }, async args => result(store.recordReview(args.workspaceId, { ...args, actor })));
  }
  if (options.repository) {
    if (options.role === 'reviewer') server.registerTool('ontology_publication_preflight', { description: 'Inspect the configured target head, draft source files and available evidence. Does not accept or publish.', inputSchema: { workspaceId, expectedRevision: revision.optional() }, annotations: { readOnlyHint: true } }, async args => result(await publicationPreflight(store, args.workspaceId, args.expectedRevision, options.repository, options.publicationFixture)));
    server.registerTool('ontology_change_impact_get', { description: 'Find bounded explicit references in pinned requirements, journeys, rules and temporal queries; coverage is partial.', inputSchema: { workspaceId, expectedRevision: revision.optional() }, annotations: { readOnlyHint: true } }, async args => {
      const workspace = store.get(args.workspaceId);
      if (args.expectedRevision !== undefined && args.expectedRevision !== workspace.revision) throw new Error('Revision conflict');
      return result(changeImpact(workspace, store.diff(args.workspaceId).changes, options.repository));
    });
    server.registerTool('ontology_temporal_view_get', { description: 'Inspect explicit time fields and the pinned class temporal policy; no missing policy or relationship is inferred.', inputSchema: { workspaceId, root: z.string().max(128), expectedRevision: revision.optional() }, annotations: { readOnlyHint: true } }, async args => result(store.temporalView(args.workspaceId, args.root, args.expectedRevision, options.repository)));
    server.registerTool('ontology_validation_start', { description: 'Run structural, reference, independent audit or release checks on an isolated pinned draft.', inputSchema: { workspaceId, operationId, expectedRevision: revision, sourceDigest: z.string().regex(/^[a-f0-9]{64}$/), profile: z.enum(['structural', 'reference', 'audit', 'acceptance']).default('structural') }, annotations: { idempotentHint: true } }, async args => {
      const workspace = store.get(args.workspaceId);
      const { job, created } = store.createJob(args.workspaceId, args.expectedRevision, args.sourceDigest, actor, args.operationId, args.profile);
      if (created) {
        if (options.startValidation) options.startValidation(workspace, job);
        else void runGenerator(store, workspace, job, options.repository, options.python);
      }
      return result(job);
    });
    server.registerTool('ontology_job_get', { description: 'Read generator job status and freshness.', inputSchema: { workspaceId, jobId: z.string().uuid() }, annotations: { readOnlyHint: true } }, async args => result(store.job(args.workspaceId, args.jobId)));
    server.registerTool('ontology_evidence_get', { description: 'Read completed validation evidence and its exact baseline, revision and digest.', inputSchema: { workspaceId, evidenceId: z.string().uuid() }, annotations: { readOnlyHint: true } }, async args => result(store.evidence(args.workspaceId, args.evidenceId)));
    if (options.cancelValidation) server.registerTool('ontology_job_cancel', { description: 'Request cooperative cancellation after the current fixed check finishes.', inputSchema: { workspaceId, jobId: z.string().uuid(), operationId }, annotations: { idempotentHint: true } }, async args => {
      const outcome = store.requestJobCancel(args.workspaceId, args.jobId, actor, args.operationId);
      if (outcome.requested) options.cancelValidation(args.jobId);
      return result(outcome.job);
    });
  }
  server.registerTool('ontology_changeset_apply', { description: 'Atomically apply supported draft class commands at an expected revision.', inputSchema: { workspaceId, operationId, expectedRevision: revision, commands: z.array(command).min(1).max(100) }, annotations: { destructiveHint: false, idempotentHint: true } }, async args => result(store.apply({ ...args, actor })));
  server.registerTool('ontology_changeset_undo', { description: 'Undo the latest supported command group as a new revision.', inputSchema: { workspaceId, operationId, expectedRevision: revision, targetRevision: revision }, annotations: { idempotentHint: true } }, async args => result(store.undo({ ...args, actor })));
  return server;
}
