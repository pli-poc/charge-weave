import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { captureGeneratedArtifacts, summarizeGeneratedArtifacts } from '../src/artifact-summary.js';

test('generated artifact evidence compares exact bytes without retaining content', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'chargeweave-artifacts-'));
  try {
    mkdirSync(join(directory, 'tools')); mkdirSync(join(directory, 'generated'));
    writeFileSync(join(directory, 'tools', 'check_generated.py'), "def generated_paths(root):\n    return {str(p.relative_to(root)) for p in (root / 'generated').glob('*')} | {'generated/optional.txt'}\n");
    writeFileSync(join(directory, 'generated', 'changed.txt'), 'before');
    writeFileSync(join(directory, 'generated', 'removed.txt'), 'removed');
    const before = await captureGeneratedArtifacts(directory, process.env.CHARGEWEAVE_TEST_PYTHON || 'python');
    writeFileSync(join(directory, 'generated', 'changed.txt'), 'after');
    unlinkSync(join(directory, 'generated', 'removed.txt'));
    writeFileSync(join(directory, 'generated', 'added.txt'), 'added');
    const after = await captureGeneratedArtifacts(directory, process.env.CHARGEWEAVE_TEST_PYTHON || 'python');
    const summary = summarizeGeneratedArtifacts(before, after);
    assert.equal(summary.comparison, 'exact-bytes');
    assert.equal(summary.changedCount, 3);
    assert.deepEqual(summary.changes.map(item => item.kind), ['added', 'changed', 'removed']);
    assert.notEqual(summary.baselineManifestSha256, summary.candidateManifestSha256);
    assert.equal(JSON.stringify(summary).includes('"before"'), false);
    assert.equal(summarizeGeneratedArtifacts(after, after).changedCount, 0);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
