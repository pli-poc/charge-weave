import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { WorkspaceStore } from '../src/workspace.js';
import { once } from 'node:events';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { createHttpService } from '../src/http.js';

test('outgoing neighbourhood limits preserve omitted counts and the existing default', () => {
  const store = new WorkspaceStore(':memory:');
  try {
    const fields = Array.from({ length: 16 }, (_, i) => `link${i}:Record?`).join(' ');
    const workspace = store.create({ title: 'View limit', baselineCommit: 'a'.repeat(40), schema: `MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|${fields}\n` });
    const initial = store.view(workspace.id, 'Device', 0, 5);
    assert.equal(initial.edges.length, 5);
    assert.equal(initial.omitted, 12);
    const expanded = store.view(workspace.id, 'Device', 0, 20);
    assert.equal(expanded.edges.length, 17);
    assert.equal(expanded.omitted, 0);
    assert.deepEqual(expanded.edges.slice(0, 5), initial.edges);
    assert.equal(store.view(workspace.id, 'Device', 0).edges.length, 17);
    assert.throws(() => store.view(workspace.id, 'Device', 0, 0), /Invalid view limit/);
    assert.throws(() => store.view(workspace.id, 'Device', 1, 5), /Revision conflict/);
  } finally { store.close(); }
});

test('MCP accepts the larger bounded view and rejects requests beyond it', async () => {
  const store = new WorkspaceStore(':memory:');
  const fields = Array.from({ length: 110 }, (_, i) => `link${i}:Record?`).join(' ');
  const workspace = store.create({ title: 'MCP view limit', baselineCommit: 'a'.repeat(40), schema: `MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|${fields}\n` });
  const token = 'synthetic-view-token-'.repeat(2);
  const service = createHttpService({ store, token, workspaceId: workspace.id });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  const client = new Client({ name: 'view-limit-test', version: '1' });
  try {
    await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${service.address().port}/mcp`), { requestInit: { headers: { authorization: `Bearer ${token}` } } }));
    const request = limit => client.callTool({ name: 'ontology_view_get', arguments: { workspaceId: workspace.id, root: 'Device', expectedRevision: 0, limit } });
    const expanded = await request(100);
    assert.equal(expanded.isError, undefined);
    assert.equal(expanded.structuredContent.edges.length, 100);
    assert.equal(expanded.structuredContent.omitted, 11);
    assert.equal((await request(101)).isError, true);
  } finally { await client.close(); await service.shutdown(); store.close(); }
});

test('larger outgoing views remain bounded with accurate omissions', () => {
  const store = new WorkspaceStore(':memory:');
  try {
    const fields = Array.from({ length: 110 }, (_, i) => `link${i}:Record?`).join(' ');
    const workspace = store.create({ title: 'Large view', baselineCommit: 'a'.repeat(40), schema: `MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|${fields}\n` });
    assert.equal(store.view(workspace.id, 'Device', 0).edges.length, 50);
    const expanded = store.view(workspace.id, 'Device', 0, 100);
    assert.equal(expanded.edges.length, 100);
    assert.equal(expanded.omitted, 11);
    assert.throws(() => store.view(workspace.id, 'Device', 0, 101), /Invalid view limit/);
  } finally { store.close(); }
});
