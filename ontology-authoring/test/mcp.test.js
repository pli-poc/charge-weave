import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { WorkspaceStore } from '../src/workspace.js';
import { createServer } from '../src/mcp.js';

test('MCP field search reports declaration scope and revision conflicts', async () => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Field discovery', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|name:string?\nDevice|Record|A device.|peer:Record?\n' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createServer(store, 'reader', { role: 'draft' });
  const client = new Client({ name: 'field-search-test', version: '1' });
  try {
    await server.connect(serverTransport); await client.connect(clientTransport);
    const excerpt = await client.callTool({ name: 'ontology_source_excerpt', arguments: { workspaceId: workspace.id, name: 'Device', expectedRevision: 0, version: 'candidate' } });
    assert.equal(excerpt.structuredContent.path, 'model/domain.schema');
    assert.equal(excerpt.structuredContent.lines.find(line => line.number === excerpt.structuredContent.declarationLine).text, 'Device|Record|A device.|peer:Record?');
    assert.equal((await client.callTool({ name: 'ontology_source_excerpt', arguments: { workspaceId: workspace.id, name: '../secret', expectedRevision: 0 } })).isError, true);
    const found = await client.callTool({ name: 'ontology_field_search', arguments: { workspaceId: workspace.id, query: 'peer', expectedRevision: 0 } });
    assert.equal(found.structuredContent.results[0].owner, 'Device');
    assert.equal(found.structuredContent.results[0].kind, 'relationship');
    assert.match(found.structuredContent.scope, /inherited/i);
    const inherited = await client.callTool({ name: 'ontology_field_search', arguments: { workspaceId: workspace.id, query: 'name', expectedRevision: 0, context: 'Device' } });
    assert.equal(inherited.structuredContent.results[0].owner, 'Record');
    assert.equal(inherited.structuredContent.results[0].inherited, true);
    const relationships = await client.callTool({ name: 'ontology_field_search', arguments: { workspaceId: workspace.id, query: '', expectedRevision: 0, context: 'Device', kind: 'relationship' } });
    assert.deepEqual(relationships.structuredContent.results.map(item => item.name), ['peer']);
    assert.equal((await client.callTool({ name: 'ontology_field_search', arguments: { workspaceId: workspace.id, query: 'peer', expectedRevision: 1 } })).structuredContent.error.code, 'REVISION_CONFLICT');
  } finally { await client.close(); store.close(); }
});

test('MCP apply accepts an event cursor and reports intervening activity', async () => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Cursor guard', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createServer(store, 'author', { role: 'draft' });
  const client = new Client({ name: 'cursor-test', version: '1' });
  try {
    await server.connect(serverTransport); await client.connect(clientTransport);
    const summary = JSON.parse((await client.readResource({ uri: `ontology://workspace/${workspace.id}/v1/summary` })).contents[0].text);
    store.suggestView(workspace.id, { actor: 'other', operationId: 'suggest', expectedRevision: 0, root: 'Record', viewpoint: 'information', explanation: 'Review this concept.' });
    const request = { workspaceId: workspace.id, operationId: 'describe', expectedRevision: 0, expectedEventSequence: summary.eventSequence, commands: [{ type: 'class.describe', name: 'Record', definition: 'A clearer record.' }] };
    const stale = await client.callTool({ name: 'ontology_changeset_apply', arguments: request });
    assert.equal(stale.isError, true);
    assert.equal(stale.structuredContent.error.code, 'ACTIVITY_CONFLICT');
    assert.equal(store.get(workspace.id).revision, 0);
    const fresh = { ...request, expectedEventSequence: store.snapshot(workspace.id).eventSequence };
    assert.equal((await client.callTool({ name: 'ontology_changeset_apply', arguments: fresh })).structuredContent.revision, 1);
  } finally { await client.close(); store.close(); }
});

test('reviewer-only workspace controls include carry-forward', async () => {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Change set', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const clients = [];
  try {
    for (const role of ['draft', 'reviewer']) {
      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      const server = createServer(store, role, { role, carryForwardWorkspace: async () => ({ status: 'carried-forward' }) });
      const client = new Client({ name: role, version: '1' });
      await server.connect(serverTransport); await client.connect(clientTransport); clients.push(client);
    }
    const [draft, reviewer] = clients;
    assert.equal((await draft.listTools()).tools.some(item => item.name === 'ontology_workspace_carry_forward'), false);
    assert.equal((await reviewer.listTools()).tools.some(item => item.name === 'ontology_workspace_carry_forward'), true);
    assert.equal((await draft.listTools()).tools.some(item => item.name === 'ontology_changeset_reopen'), false);
    assert.equal((await reviewer.listTools()).tools.some(item => item.name === 'ontology_changeset_reopen'), true);
    const opened = (await draft.callTool({ name: 'ontology_changeset_open', arguments: { workspaceId: workspace.id, operationId: 'open', expectedRevision: 0, intent: 'Describe the record.' } })).structuredContent;
    const id = opened.changeSet.id;
    const applied = (await draft.callTool({ name: 'ontology_changeset_apply', arguments: { workspaceId: workspace.id, operationId: 'edit', expectedRevision: 0, changeSetId: id, commands: [{ type: 'class.describe', name: 'Record', definition: 'A revised record.' }] } })).structuredContent;
    assert.equal(applied.changeSetId, id);
    await reviewer.callTool({ name: 'ontology_changeset_review', arguments: { workspaceId: workspace.id, operationId: 'reject', expectedRevision: 1, changeSetId: id, sourceDigest: applied.sourceDigest, decision: 'reject', reason: 'Needs revision.' } });
    const reopened = await reviewer.callTool({ name: 'ontology_changeset_reopen', arguments: { workspaceId: workspace.id, operationId: 'reopen', expectedRevision: 1, changeSetId: id } });
    assert.equal(reopened.structuredContent.changeSet.status, 'draft');
  } finally { for (const client of clients) await client.close(); store.close(); }
});

test('saved view manifests import presentation data with version and destination checks', async () => {
  const store = new WorkspaceStore(':memory:');
  const source = store.create({ title: 'Source views', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|\n' });
  const destination = store.create({ title: 'Destination views', baselineCommit: 'b'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|\n' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createServer(store, 'author', { role: 'draft' });
  const client = new Client({ name: 'view-manifest-import-test', version: '1' });
  try {
    await server.connect(serverTransport); await client.connect(clientTransport);
    const definition = { root: 'Device', positions: { Device: { x: 10, y: 20 }, Record: { x: 240, y: 20 } }, viewpoint: 'information', groups: [{ name: 'Core', members: ['Device', 'Record'] }], annotations: [{ target: 'Device', text: 'Imported view note' }] };
    store.saveView({ workspaceId: source.id, viewId: 'maintenance', actor: 'author', operationId: 'save-source', expectedViewRevision: 0, definition });
    const exported = (await client.callTool({ name: 'ontology_view_manifest_get', arguments: { workspaceId: source.id, viewId: 'maintenance' } })).structuredContent;
    const request = { workspaceId: destination.id, operationId: 'import-view', expectedViewRevision: 0, manifest: exported };
    const imported = await client.callTool({ name: 'ontology_view_manifest_import', arguments: request });
    assert.equal(imported.structuredContent.viewId, 'maintenance');
    assert.equal(imported.structuredContent.viewRevision, 1);
    assert.equal(imported.structuredContent.importedFrom.workspaceId, source.id);
    assert.deepEqual(store.savedView(destination.id, 'maintenance').definition, definition);
    assert.deepEqual((await client.callTool({ name: 'ontology_view_manifest_import', arguments: request })).structuredContent, imported.structuredContent);
    const invalidReference = { ...exported, definition: { ...definition, root: 'Missing' } };
    const rejected = await client.callTool({ name: 'ontology_view_manifest_import', arguments: { ...request, operationId: 'bad-import', manifest: invalidReference } });
    assert.equal(rejected.isError, true);
    assert.equal(store.savedView(destination.id, 'maintenance').viewRevision, 1);
    const wrongVersion = await client.callTool({ name: 'ontology_view_manifest_import', arguments: { ...request, operationId: 'wrong-version', manifest: { ...exported, contractVersion: 'future-view-v2' } } });
    assert.equal(wrongVersion.isError, true);
    assert.equal(store.get(destination.id).revision, 0);
  } finally { await client.close(); store.close(); }
});

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
  const invalidSchema = await codex.callTool({ name: 'ontology_workspace_get', arguments: { workspaceId: 'not-a-uuid' } });
  assert.equal(invalidSchema.isError, true);
  assert.equal(invalidSchema.structuredContent?.error, undefined);
  const inspected = await codex.callTool({ name: 'ontology_entity_get', arguments: { workspaceId: workspace.id, iri: 'https://example.org/charge-domain#Record', expectedRevision: 0 } });
  assert.equal(inspected.structuredContent.entity.iri, 'https://example.org/charge-domain#Record');
  assert.equal((await codex.callTool({ name: 'ontology_entity_get', arguments: { workspaceId: workspace.id, iri: 'https://other.example/#Record' } })).isError, true);
  const args = { workspaceId: workspace.id, operationId: 'add', expectedRevision: 0, rationale: 'Explain the example.', commands: [{ type: 'class.add', name: 'Example', module: 'foundation', parent: 'Record', definition: 'An example.' }] };
  const applied = (await codex.callTool({ name: 'ontology_changeset_apply', arguments: args })).structuredContent;
  assert.equal(applied.revision, 1);
  assert.match(applied.commandGroupId, /^[0-9a-f-]{36}$/);
  assert.deepEqual((await codex.callTool({ name: 'ontology_changeset_apply', arguments: args })).structuredContent, applied);
  assert.equal(store.events(workspace.id)[0].payload.rationale, args.rationale);
  assert.equal(store.events(workspace.id)[0].payload.operationId, args.operationId);
  assert.equal(store.events(workspace.id)[0].payload.commandGroupId, applied.commandGroupId);
  assert.equal((await browser.callTool({ name: 'ontology_context_search', arguments: { workspaceId: workspace.id, query: 'Example' } })).structuredContent.results[0].name, 'Example');
  const stale = await browser.callTool({ name: 'ontology_changeset_apply', arguments: { ...args, operationId: 'stale' } });
  assert.equal(stale.isError, true);
  assert.equal(stale.structuredContent.error.code, 'REVISION_CONFLICT');
  assert.match(stale.structuredContent.error.recovery, /current revision/);
  const duplicateOperation = await codex.callTool({ name: 'ontology_changeset_apply', arguments: { ...args, commands: [{ ...args.commands[0], definition: 'Different content.' }] } });
  assert.equal(duplicateOperation.structuredContent.error.code, 'IDEMPOTENCY_CONFLICT');
  const differentReason = await codex.callTool({ name: 'ontology_changeset_apply', arguments: { ...args, rationale: 'A different reason.' } });
  assert.equal(differentReason.structuredContent.error.code, 'IDEMPOTENCY_CONFLICT');
  const missing = await codex.callTool({ name: 'ontology_entity_get', arguments: { workspaceId: workspace.id, name: 'Missing' } });
  assert.equal(missing.structuredContent.error.code, 'UNKNOWN_TERM');
  const addField = { workspaceId: workspace.id, operationId: 'field', expectedRevision: 1, commands: [{ type: 'property.add', owner: 'Example', name: 'exampleLabel', range: 'string', cardinality: '?' }] };
  assert.equal((await codex.callTool({ name: 'ontology_changeset_apply', arguments: addField })).structuredContent.revision, 2);
  const updateField = { workspaceId: workspace.id, operationId: 'update', expectedRevision: 2, commands: [{ type: 'property.update', owner: 'Example', name: 'exampleLabel', expectedRange: 'string', expectedCardinality: '?', range: 'string', cardinality: '!' }] };
  assert.equal((await browser.callTool({ name: 'ontology_changeset_apply', arguments: updateField })).structuredContent.revision, 3);
  assert.equal((await codex.callTool({ name: 'ontology_changeset_apply', arguments: { ...updateField, operationId: 'bad-precondition', expectedRevision: 3 } })).isError, true);
  const templates = await codex.callTool({ name: 'ontology_constraint_templates', arguments: { workspaceId: workspace.id } });
  assert.ok(templates.structuredContent.templates.some(item => item.id === 'required-relationship'));
  const addRelation = { workspaceId: workspace.id, operationId: 'relation', expectedRevision: 3, commands: [{ type: 'relationship.add', owner: 'Example', name: 'relatedRecord', range: 'Record', cardinality: '?' }] };
  assert.equal((await codex.callTool({ name: 'ontology_changeset_apply', arguments: addRelation })).structuredContent.revision, 4);
  const requireRelation = { workspaceId: workspace.id, operationId: 'constraint', expectedRevision: 4, commands: [{ type: 'constraint.add', template: 'required-relationship', owner: 'Example', name: 'relatedRecord', expectedRange: 'Record', expectedCardinality: '?' }] };
  assert.equal((await browser.callTool({ name: 'ontology_changeset_apply', arguments: requireRelation })).structuredContent.revision, 5);
  assert.match(store.get(workspace.id).schema, /relatedRecord:Record!/);
  const addEnum = { workspaceId: workspace.id, operationId: 'enum', expectedRevision: 5, commands: [{ type: 'property.add', owner: 'Example', name: 'exampleState', range: '{Draft,Final,Archived}', cardinality: '?' }] };
  assert.equal((await codex.callTool({ name: 'ontology_changeset_apply', arguments: addEnum })).structuredContent.revision, 6);
  const narrow = { workspaceId: workspace.id, operationId: 'narrow', expectedRevision: 6, commands: [{ type: 'constraint.add', template: 'allowed-values', owner: 'Example', name: 'exampleState', expectedRange: '{Draft,Final,Archived}', expectedCardinality: '?', values: ['Draft', 'Final'] }] };
  assert.equal((await browser.callTool({ name: 'ontology_changeset_apply', arguments: narrow })).structuredContent.revision, 7);
  assert.match(store.get(workspace.id).schema, /exampleState:\{Draft,Final\}\?/);
  const suggestion = { workspaceId: workspace.id, operationId: 'suggest', expectedRevision: 7, root: 'Example', viewpoint: 'temporal', explanation: 'Review the new concept.' };
  const proposed = (await codex.callTool({ name: 'ontology_view_suggest', arguments: suggestion })).structuredContent;
  assert.equal((await codex.callTool({ name: 'ontology_view_suggest', arguments: suggestion })).structuredContent.eventSequence, proposed.eventSequence);
  assert.equal(store.get(workspace.id).revision, 7);
  assert.equal((await browser.callTool({ name: 'ontology_history_get', arguments: { workspaceId: workspace.id } })).structuredContent.events.at(-1).payload.type, 'view_suggestion');
  assert.equal((await codex.callTool({ name: 'ontology_view_suggest', arguments: { ...suggestion, operationId: 'stale-view', expectedRevision: 6 } })).isError, true);
  assert.equal((await codex.callTool({ name: 'ontology_view_suggest', arguments: { ...suggestion, operationId: 'missing-view', root: 'Missing' } })).isError, true);
  for (const client of clients) await client.close();
  store.close();
});
