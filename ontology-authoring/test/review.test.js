import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { WorkspaceStore } from '../src/workspace.js';
import { createServer } from '../src/mcp.js';

test('only reviewers can record durable digest-bound decisions; edits make them stale', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'chargeweave-review-'));
  let store = new WorkspaceStore(join(directory, 'workspace.sqlite'));
  const workspace = store.create({ title: 'Review', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const clients = [];
  try {
    for (const role of ['draft', 'reviewer']) {
      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      const server = createServer(store, role, { role, repository: '.' });
      const client = new Client({ name: role, version: '1' });
      await server.connect(serverTransport); await client.connect(clientTransport); clients.push(client);
    }
    const [draft, reviewer] = clients;
    assert.equal((await draft.listTools()).tools.some(tool => tool.name === 'ontology_changeset_review'), false);
    assert.equal((await draft.listTools()).tools.some(tool => tool.name === 'ontology_publication_preflight'), false);
    assert.equal((await reviewer.listTools()).tools.some(tool => tool.name === 'ontology_publication_preflight'), true);
    assert.equal((await draft.callTool({ name: 'ontology_changeset_review', arguments: {} })).isError, true);
    const args = { workspaceId: workspace.id, operationId: 'review-1', expectedRevision: 0, sourceDigest: workspace.sourceDigest, decision: 'request_changes', reason: 'Add a negative fixture.' };
    const first = (await reviewer.callTool({ name: 'ontology_changeset_review', arguments: args })).structuredContent;
    assert.equal(first.stale, false);
    assert.equal((await reviewer.callTool({ name: 'ontology_changeset_review', arguments: args })).structuredContent.id, first.id);
    assert.equal((await reviewer.callTool({ name: 'ontology_changeset_review', arguments: { ...args, reason: 'Changed request.' } })).isError, true);
    assert.equal((await reviewer.callTool({ name: 'ontology_changeset_review', arguments: { ...args, operationId: 'accept', decision: 'accept' } })).isError, true);
    const edit = { workspaceId: workspace.id, operationId: 'edit', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Record', definition: 'A revised record.' }] };
    assert.equal((await draft.callTool({ name: 'ontology_changeset_apply', arguments: edit })).structuredContent.revision, 1);
    const decisions = (await reviewer.callTool({ name: 'ontology_review_decisions', arguments: { workspaceId: workspace.id } })).structuredContent.decisions;
    assert.equal(decisions[0].stale, true);
    assert.equal((await reviewer.callTool({ name: 'ontology_changeset_review', arguments: { ...args, operationId: 'stale' } })).isError, true);
    for (const client of clients) await client.close();
    store.close(); store = new WorkspaceStore(join(directory, 'workspace.sqlite'));
    assert.equal(store.reviewDecisions(workspace.id)[0].id, first.id);
    assert.equal(store.reviewDecisions(workspace.id)[0].stale, true);
    assert.equal(store.recordReview(workspace.id, { ...args, actor: 'reviewer' }).id, first.id);
  } finally { for (const client of clients) await client.close(); store.close(); rmSync(directory, { recursive: true, force: true }); }
});
