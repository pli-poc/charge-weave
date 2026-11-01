import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

// The transport supplies the authenticated actor; tool arguments never select it.
export function createServer(store, actor) {
  if (!actor) throw new Error('An authenticated actor is required');
  const server = new McpServer({ name: 'chargeweave-ontology-authoring', version: '0.1.0' });
  const result = value => ({ content: [{ type: 'text', text: JSON.stringify(value) }], structuredContent: value });
  const workspaceId = z.string().uuid();
  const operationId = z.string().min(1).max(128);
  const revision = z.number().int().nonnegative().safe();
  const command = z.discriminatedUnion('type', [
    z.object({ type: z.literal('class.add'), name: z.string().max(128), module: z.string().max(128), parent: z.string().max(128), definition: z.string().max(4000) }).strict(),
    z.object({ type: z.literal('class.describe'), name: z.string().max(128), definition: z.string().max(4000) }).strict(),
  ]);
  server.registerTool('ontology_workspace_get', { description: 'Read a pinned workspace identity and source.', inputSchema: { workspaceId }, annotations: { readOnlyHint: true } }, async args => result(store.get(args.workspaceId)));
  server.registerTool('ontology_context_search', { description: 'Search existing model classes before proposing additions.', inputSchema: { workspaceId, query: z.string().max(200), limit: z.number().int().min(1).max(100).optional() }, annotations: { readOnlyHint: true } }, async args => result(store.search(args.workspaceId, args.query, args.limit)));
  server.registerTool('ontology_changeset_apply', { description: 'Atomically apply supported draft class commands at an expected revision.', inputSchema: { workspaceId, operationId, expectedRevision: revision, commands: z.array(command).min(1).max(100) }, annotations: { destructiveHint: false, idempotentHint: true } }, async args => result(store.apply({ ...args, actor })));
  return server;
}
