import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { WorkspaceStore } from '../src/workspace.js';
import { createServer } from '../src/mcp.js';

test('two MCP clients share revisioned state and reject stale edits', async () => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Shared', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const clients = [];
  for (const actor of ['codex', 'browser']) {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const server = createServer(store, actor);
    const client = new Client({ name: actor, version: '1' });
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    clients.push(client);
  }
  const [codex, browser] = clients;
  assert.ok((await codex.listTools()).tools.some(tool => tool.name === 'ontology_changeset_apply'));
  const inspected = await codex.callTool({ name: 'ontology_entity_get', arguments: { workspaceId: workspace.id, iri: 'https://example.org/charge-domain#Record', expectedRevision: 0 } });
  assert.equal(inspected.structuredContent.entity.iri, 'https://example.org/charge-domain#Record');
  assert.equal((await codex.callTool({ name: 'ontology_entity_get', arguments: { workspaceId: workspace.id, iri: 'https://other.example/#Record' } })).isError, true);
  const args = { workspaceId: workspace.id, operationId: 'add', expectedRevision: 0, commands: [{ type: 'class.add', name: 'Example', module: 'foundation', parent: 'Record', definition: 'An example.' }] };
  assert.equal((await codex.callTool({ name: 'ontology_changeset_apply', arguments: args })).structuredContent.revision, 1);
  assert.equal((await browser.callTool({ name: 'ontology_context_search', arguments: { workspaceId: workspace.id, query: 'Example' } })).structuredContent.results[0].name, 'Example');
  assert.equal((await browser.callTool({ name: 'ontology_changeset_apply', arguments: { ...args, operationId: 'stale' } })).isError, true);
  const addField = { workspaceId: workspace.id, operationId: 'field', expectedRevision: 1, commands: [{ type: 'property.add', owner: 'Example', name: 'exampleLabel', range: 'string', cardinality: '?' }] };
  assert.equal((await codex.callTool({ name: 'ontology_changeset_apply', arguments: addField })).structuredContent.revision, 2);
  const updateField = { workspaceId: workspace.id, operationId: 'update', expectedRevision: 2, commands: [{ type: 'property.update', owner: 'Example', name: 'exampleLabel', expectedRange: 'string', expectedCardinality: '?', range: 'string', cardinality: '!' }] };
  assert.equal((await browser.callTool({ name: 'ontology_changeset_apply', arguments: updateField })).structuredContent.revision, 3);
  assert.equal((await codex.callTool({ name: 'ontology_changeset_apply', arguments: { ...updateField, operationId: 'bad-precondition', expectedRevision: 3 } })).isError, true);
  for (const client of clients) await client.close();
  store.close();
});
