import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { importSourceManifest, sha256 } from '../src/source-manifest.js';

test('batch source import hashes exact committed blobs including binary bytes', () => {
  const repo = mkdtempSync(join(tmpdir(), 'chargeweave-manifest-'));
  const git = (...args) => execFileSync('git', args, { cwd: repo, stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    git('init'); git('config', 'user.name', 'Test'); git('config', 'user.email', 'test@example.invalid');
    mkdirSync(join(repo, 'model')); mkdirSync(join(repo, 'tools'));
    writeFileSync(join(repo, 'model', 'domain.schema'), 'first\nsecond\n');
    writeFileSync(join(repo, 'model', 'catalog.json'), 'generated');
    writeFileSync(join(repo, 'tools', 'binary.bin'), Buffer.from([0, 10, 255, 13, 10]));
    writeFileSync(join(repo, 'tools', 'empty'), '');
    git('add', '.'); git('commit', '-m', 'baseline'); const commit = git('rev-parse', 'HEAD').toString().trim();
    writeFileSync(join(repo, 'model', 'domain.schema'), 'uncommitted');
    const manifest = importSourceManifest(repo, commit);
    assert.deepEqual(manifest.map(entry => entry.path), ['model/domain.schema', 'tools/binary.bin', 'tools/empty']);
    for (const entry of manifest) assert.equal(entry.sha256, sha256(git('show', `${commit}:${entry.path}`)));
  } finally { rmSync(repo, { recursive: true, force: true }); }
});
