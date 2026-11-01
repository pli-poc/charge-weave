import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { runGenerator } from './validation.js';

// The transport supplies the authenticated actor; tool arguments never select it.
export function createServer(store, actor, options = {}) {
  if (!actor) throw new Error('An authenticated actor is required');
  const server = new McpServer({ name: 'chargeweave-ontology-authoring', version: '0.1.0' });
  const result = value => ({ content: [{ type: 'text', text: JSON.stringify(value) }], structuredContent: value });
  const workspaceId = z.string().uuid();
  const operationId = z.string().min(1).max(128);
  const revision = z.number().int().nonnegative().safe();
  const command = z.discriminatedUnion('type', [
    z.object({ type: z.literal('class.add'), name: z.string().max(128), module: z.string().max(128), parent: z.string().max(128), definition: z.string().max(4000) }).strict(),
    z.object({ type: z.literal('class.describe'), name: z.string().max(128), definition: z.string().max(4000) }).strict(),
    z.object({ type: z.literal('property.add'), owner: z.string().max(128), name: z.string().max(128), range: z.string().max(128), cardinality: z.enum(['!', '?', '+', '*']) }).strict(),
    z.object({ type: z.literal('relationship.add'), owner: z.string().max(128), name: z.string().max(128), range: z.string().max(128), cardinality: z.enum(['!', '?', '+', '*']) }).strict(),
  ]);
  server.registerTool('ontology_workspace_get', { description: 'Read a pinned workspace identity, source and event cursor.', inputSchema: { workspaceId }, annotations: { readOnlyHint: true } }, async args => result(store.snapshot(args.workspaceId)));
  server.registerTool('ontology_context_search', { description: 'Search existing model classes before proposing additions.', inputSchema: { workspaceId, query: z.string().max(200), limit: z.number().int().min(1).max(100).optional() }, annotations: { readOnlyHint: true } }, async args => result(store.search(args.workspaceId, args.query, args.limit)));
  server.registerTool('ontology_view_get', { description: 'Read a bounded explicit class neighbourhood from the draft schema.', inputSchema: { workspaceId, root: z.string().max(128) }, annotations: { readOnlyHint: true } }, async args => result(store.view(args.workspaceId, args.root)));
  server.registerTool('ontology_changeset_diff', { description: 'Compare the current draft with its committed baseline.', inputSchema: { workspaceId }, annotations: { readOnlyHint: true } }, async args => result(store.diff(args.workspaceId)));
  server.registerTool('ontology_history_get', { description: 'Read the most recent committed workspace events.', inputSchema: { workspaceId }, annotations: { readOnlyHint: true } }, async args => result({ events: store.recentEvents(args.workspaceId) }));
  if (options.role === 'reviewer') server.registerTool('ontology_review_readiness', { description: 'Inspect exact-digest evidence and missing review gates. Acceptance is not yet available.', inputSchema: { workspaceId }, annotations: { readOnlyHint: true } }, async args => result(store.reviewReadiness(args.workspaceId)));
  if (options.repository) {
    server.registerTool('ontology_validation_start', { description: 'Run structural generation or reference checks on an isolated pinned draft.', inputSchema: { workspaceId, operationId, expectedRevision: revision, sourceDigest: z.string().regex(/^[a-f0-9]{64}$/), profile: z.enum(['structural', 'reference']).default('structural') }, annotations: { idempotentHint: true } }, async args => {
      const workspace = store.get(args.workspaceId);
      const { job, created } = store.createJob(args.workspaceId, args.expectedRevision, args.sourceDigest, actor, args.operationId, args.profile);
      if (created) {
        if (options.startValidation) options.startValidation(workspace, job);
        else void runGenerator(store, workspace, job, options.repository, options.python);
      }
      return result(job);
    });
    server.registerTool('ontology_job_get', { description: 'Read generator job status and freshness.', inputSchema: { workspaceId, jobId: z.string().uuid() }, annotations: { readOnlyHint: true } }, async args => result(store.job(args.workspaceId, args.jobId)));
  }
  server.registerTool('ontology_changeset_apply', { description: 'Atomically apply supported draft class commands at an expected revision.', inputSchema: { workspaceId, operationId, expectedRevision: revision, commands: z.array(command).min(1).max(100) }, annotations: { destructiveHint: false, idempotentHint: true } }, async args => result(store.apply({ ...args, actor })));
  server.registerTool('ontology_changeset_undo', { description: 'Undo the latest supported command group as a new revision.', inputSchema: { workspaceId, operationId, expectedRevision: revision, targetRevision: revision }, annotations: { idempotentHint: true } }, async args => result(store.undo({ ...args, actor })));
  return server;
}
