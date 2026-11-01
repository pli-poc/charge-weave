import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { once } from 'node:events';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { WorkspaceStore } from '../src/workspace.js';
import { createHttpService } from '../src/http.js';

test('loopback MCP transport authenticates and shares state', async () => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Network', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const token = 'a'.repeat(32);
  const reviewerToken = 'b'.repeat(32);
  const service = createHttpService({ store, token, reviewerToken, allowedOrigin: 'http://127.0.0.1:5173' });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  const url = new URL(`http://127.0.0.1:${service.address().port}/mcp`);
  try {
    assert.equal((await fetch(url, { method: 'POST' })).status, 401);
    assert.equal((await fetch(url, { method: 'POST', headers: { origin: 'https://untrusted.example', authorization: `Bearer ${token}` } })).status, 403);
    const clients = [];
    for (const name of ['codex', 'browser']) {
      const client = new Client({ name, version: '1' });
      await client.connect(new StreamableHTTPClientTransport(url, { requestInit: { headers: { authorization: `Bearer ${token}` } } }));
      clients.push(client);
    }
    const [first, second] = clients;
    assert.equal((await first.listTools()).tools.some(tool => tool.name === 'ontology_review_readiness'), false);
    const reviewer = new Client({ name: 'reviewer', version: '1' });
    await reviewer.connect(new StreamableHTTPClientTransport(url, { requestInit: { headers: { authorization: `Bearer ${reviewerToken}` } } }));
    assert.equal((await reviewer.listTools()).tools.some(tool => tool.name === 'ontology_review_readiness'), true);
    const readiness = (await reviewer.callTool({ name: 'ontology_review_readiness', arguments: { workspaceId: workspace.id } })).structuredContent;
    assert.equal(readiness.canAccept, false);
    assert.ok(readiness.missing.includes('independent acceptance and publication evidence'));
    const args = { workspaceId: workspace.id, operationId: 'network-edit', expectedRevision: 0, commands: [{ type: 'class.add', name: 'NetworkExample', module: 'foundation', parent: 'Record', definition: 'An example.' }] };
    assert.equal((await first.callTool({ name: 'ontology_changeset_apply', arguments: args })).structuredContent.revision, 1);
    assert.equal((await second.callTool({ name: 'ontology_context_search', arguments: { workspaceId: workspace.id, query: 'NetworkExample' } })).structuredContent.results.length, 1);
    const controller = new AbortController();
    const feed = await fetch(new URL(`/events?workspaceId=${workspace.id}&after=0`, url), { headers: { authorization: `Bearer ${token}` }, signal: controller.signal });
    assert.equal(feed.status, 200);
    const reader = feed.body.getReader();
    const chunk = new TextDecoder().decode((await reader.read()).value);
    assert.match(chunk, /event: workspace-change/);
    assert.match(chunk, /NetworkExample/);
    controller.abort();
    await reviewer.close();
    for (const client of clients) await client.close();
  } finally { await new Promise(resolve => service.close(resolve)); store.close(); }
});
