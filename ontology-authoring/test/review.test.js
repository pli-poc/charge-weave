import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { WorkspaceStore } from '../src/workspace.js';
import { createServer } from '../src/mcp.js';
import { editableSourcePaths, importSourceManifest } from '../src/source-manifest.js';

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

test('acceptance binds each current evidence job and becomes stale after an edit', () => {
  const repository = fileURLToPath(new URL('../..', import.meta.url));
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim();
  const show = path => execFileSync('git', ['show', `${commit}:${path}`], { cwd: repository, encoding: 'utf8' });
  const store = new WorkspaceStore(':memory:');
  try {
    const workspace = store.create({ title: 'Accept', baselineCommit: commit, schema: show('model/domain.schema'), sourceManifest: importSourceManifest(repository, commit), sourceBlobs: Object.fromEntries([...editableSourcePaths].map(path => [path, show(path)])) });
    store.apply({ workspaceId: workspace.id, actor: 'draft', operationId: 'edit', expectedRevision: 0, commands: [{ type: 'class.add', name: 'ReviewCandidate', module: 'foundation', parent: 'Record', definition: 'A candidate for review.' }] });
    const candidate = store.get(workspace.id);
    const review = { actor: 'reviewer', operationId: 'accept', expectedRevision: 1, sourceDigest: candidate.sourceDigest, decision: 'accept', reason: 'Reviewed the source changes and evidence.' };
    assert.throws(() => store.recordReview(workspace.id, review), /Review gates incomplete/);
    for (const profile of ['structural', 'reference', 'audit', 'acceptance']) {
      const { job } = store.createJob(workspace.id, 1, candidate.sourceDigest, 'validator', profile, profile);
      store.updateJob(job.id, 'passed');
    }
    assert.equal(store.reviewReadiness(workspace.id).canAccept, true);
    const accepted = store.recordReview(workspace.id, review);
    assert.deepEqual(accepted.evidence.map(item => item.profile), ['acceptance', 'audit', 'reference', 'structural']);
    assert.equal(store.recordReview(workspace.id, review).id, accepted.id);
    const rerun = store.createJob(workspace.id, 1, candidate.sourceDigest, 'validator', 'audit-rerun', 'audit').job;
    store.updateJob(rerun.id, 'failed');
    assert.equal(store.reviewReadiness(workspace.id).canAccept, false);
    assert.throws(() => store.recordReview(workspace.id, { ...review, operationId: 'failed-rerun' }), /Review gates incomplete: audit/);
    store.apply({ workspaceId: workspace.id, actor: 'draft', operationId: 'edit-again', expectedRevision: 1, commands: [{ type: 'class.describe', name: 'ReviewCandidate', definition: 'A revised candidate for review.' }] });
    assert.equal(store.reviewDecision(workspace.id, accepted.id).stale, true);
    assert.equal(store.reviewReadiness(workspace.id).canAccept, false);
    assert.throws(() => store.recordReview(workspace.id, { ...review, operationId: 'stale' }), /Stale review input/);
  } finally { store.close(); }
});
