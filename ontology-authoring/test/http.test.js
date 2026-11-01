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
  const other = store.create({ title: 'Other', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const token = 'a'.repeat(32);
  const reviewerToken = 'b'.repeat(32);
  const service = createHttpService({ store, token, reviewerToken, workspaceId: workspace.id, allowedOrigin: 'http://127.0.0.1:5173' });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  const url = new URL(`http://127.0.0.1:${service.address().port}/mcp`);
  try {
    assert.equal((await fetch(url, { method: 'POST' })).status, 401);
    assert.equal((await fetch(url, { method: 'POST', headers: { origin: 'https://untrusted.example', authorization: `Bearer ${token}` } })).status, 403);
    assert.equal((await fetch(url, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: JSON.stringify({ value: 'x'.repeat(600000) }) })).status, 413);
    const clients = [];
    for (const name of ['codex', 'browser']) {
      const client = new Client({ name, version: '1' });
      await client.connect(new StreamableHTTPClientTransport(url, { requestInit: { headers: { authorization: `Bearer ${token}` } } }));
      clients.push(client);
    }
    const [first, second] = clients;
    assert.equal((await first.callTool({ name: 'ontology_workspace_get', arguments: { workspaceId: other.id } })).isError, true);
    assert.equal((await first.callTool({ name: 'ontology_changeset_apply', arguments: { workspaceId: other.id, operationId: 'denied', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Record', definition: 'Forbidden.' }] } })).isError, true);
    assert.equal((await fetch(new URL(`/events?workspaceId=${other.id}`, url), { headers: { authorization: `Bearer ${token}` } })).status, 403);
    assert.equal((await fetch(new URL(`/events?workspaceId=${workspace.id}&after=999`, url), { headers: { authorization: `Bearer ${token}` } })).status, 409);
    assert.equal(store.get(other.id).revision, 0);
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
    assert.match(chunk, /"previousSequence":0/);
    assert.match(chunk, /NetworkExample/);
    controller.abort();
    await reviewer.close();
    for (const client of clients) await client.close();
  } finally { await service.shutdown(); store.close(); }
});

test('shutdown closes connected event streams', async () => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Shutdown', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const token = 'a'.repeat(32), service = createHttpService({ store, token, workspaceId: workspace.id });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  const response = await fetch(`http://127.0.0.1:${service.address().port}/events?workspaceId=${workspace.id}`, { headers: { authorization: `Bearer ${token}` } });
  assert.equal(response.status, 200);
  await service.shutdown();
  store.close();
});

test('shutdown waits for active validation before the store is closed', async () => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Drain', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  const token = 'a'.repeat(32);
  const service = createHttpService({ store, token, workspaceId: workspace.id, repository: '.', validationRunner: async (target, input, job) => { await pending; target.updateJob(job.id, 'passed'); } });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  const client = new Client({ name: 'test', version: '1' });
  await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${service.address().port}/mcp`), { requestInit: { headers: { authorization: `Bearer ${token}` } } }));
  const result = await client.callTool({ name: 'ontology_validation_start', arguments: { workspaceId: workspace.id, operationId: 'drain', expectedRevision: 0, sourceDigest: workspace.sourceDigest } });
  const shutdown = service.shutdown();
  let finished = false; void shutdown.then(() => { finished = true; });
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(finished, false);
  release(); await shutdown;
  assert.equal(store.job(workspace.id, result.structuredContent.id).status, 'passed');
  await client.close(); store.close();
});
