import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { mergeIncoming } from './incoming-view.js';

test('incoming projection keeps only explicit matching references and rejects stale data', () => {
  const view = { workspaceId: 'workspace', revision: 1, sourceDigest: 'digest', root: 'Device', nodes: [{ name: 'Device' }], edges: [] };
  const incoming = { workspaceId: 'workspace', revision: 1, sourceDigest: 'digest', root: 'Device', total: 3, nodes: [{ name: 'Station' }], results: [{ source: 'Station', target: 'Device', predicate: 'device', cardinality: '!', sourceRef: { path: 'model/domain.schema', line: 2 } }] };
  const result = mergeIncoming(view, incoming, 'station');
  assert.equal(result.nodes.length, 2);
  assert.equal(result.edges[0].source, 'Station');
  assert.equal(result.edges[0].target, 'Device');
  assert.equal(result.incomingOmitted, 2);
  assert.equal(mergeIncoming(view, incoming, 'unmatched').edges.length, 0);
  assert.throws(() => mergeIncoming(view, { ...incoming, revision: 2 }), /do not match/);
});
