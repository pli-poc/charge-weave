import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { carryForwardWorkspaceFromRepository, createWorkspaceFromRepository } from '../src/workspace-create.js';
import { WorkspaceStore } from '../src/workspace.js';
import { editableSourcePaths } from '../src/source-manifest.js';

test('carry-forward creates a fresh target-based draft with provenance and fresh review gates', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'chargeweave-carry-'));
  const repository = join(directory, 'repo'), remote = join(directory, 'remote.git'), advance = join(directory, 'advance');
  mkdirSync(repository);
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const git = (cwd, args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  let store;
  try {
    for (const path of [...editableSourcePaths, 'model/domain.schema', 'tools/authoring_adapter.py', 'tools/domain_schema.py', 'requirements.txt']) {
      const targetPath = join(repository, path);
      mkdirSync(join(targetPath, '..'), { recursive: true });
      cpSync(join(root, path), targetPath);
    }
    writeFileSync(join(repository, 'README.md'), 'baseline\n');
    git(directory, ['init', '--bare', remote]);
    git(repository, ['init']);
    git(repository, ['config', 'user.name', 'Carry-forward test']);
    git(repository, ['config', 'user.email', 'carry-forward@example.invalid']);
    git(repository, ['remote', 'add', 'origin', remote]);
    git(repository, ['add', '.']);
    git(repository, ['commit', '-m', 'baseline']);
    git(repository, ['push', 'origin', 'HEAD:refs/heads/main']);
    git(directory, ['--git-dir', remote, 'symbolic-ref', 'HEAD', 'refs/heads/main']);
    const baselineCommit = git(repository, ['rev-parse', 'HEAD']);
    const publicationFixture = { remote, branch: 'main' };
    store = new WorkspaceStore(':memory:');
    const source = createWorkspaceFromRepository(store, repository, { title: 'Original', baselineCommit, operationId: 'source', actor: 'reviewer', publicationFixture });
    await assert.rejects(carryForwardWorkspaceFromRepository(store, repository, {
      sourceWorkspaceId: source.id, expectedRevision: 0, expectedSourceDigest: source.sourceDigest,
      baselineCommit, operationId: 'x'.repeat(114), actor: 'reviewer', publicationFixture,
    }), /Invalid carry-forward request/);
    const edit = store.apply({ workspaceId: source.id, actor: 'author', operationId: 'describe', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Record', definition: 'An identifiable tenant-owned domain record.' }] });
    git(directory, ['clone', '--quiet', remote, advance]);
    git(advance, ['config', 'user.name', 'Remote maintainer']);
    git(advance, ['config', 'user.email', 'remote@example.invalid']);
    writeFileSync(join(advance, 'README.md'), 'advanced baseline\n');
    git(advance, ['add', 'README.md']);
    git(advance, ['commit', '-m', 'advance disjoint path']);
    git(advance, ['push', 'origin', 'HEAD:refs/heads/main']);
    const targetCommit = git(advance, ['rev-parse', 'HEAD']);
    const carried = await carryForwardWorkspaceFromRepository(store, repository, {
      sourceWorkspaceId: source.id, expectedRevision: edit.revision, expectedSourceDigest: edit.sourceDigest,
      baselineCommit: targetCommit, operationId: 'carry', actor: 'reviewer', publicationFixture,
    });
    assert.equal(carried.status, 'carried-forward');
    assert.equal(carried.baselineCommit, targetCommit);
    assert.equal(carried.revision, 1);
    assert.deepEqual(carried.carriedFiles, ['model/domain.schema']);
    assert.equal(carried.validationRequired, true);
    assert.equal(carried.reviewRequired, true);
    const target = store.get(carried.workspaceId);
    assert.equal(target.baselineCommit, targetCommit);
    assert.match(target.schema, /Record\|root\|An identifiable tenant-owned domain record\./);
    assert.equal(store.reviewReadiness(target.id).canAccept, false);
    const history = store.historyDetail(target.id, 1);
    assert.equal(history.type, 'carry_forward');
    assert.equal(history.carriedFrom.workspaceId, source.id);
    assert.deepEqual(history.carriedFiles, ['model/domain.schema']);
    const retried = await carryForwardWorkspaceFromRepository(store, repository, {
      sourceWorkspaceId: source.id, expectedRevision: edit.revision, expectedSourceDigest: edit.sourceDigest,
      baselineCommit: targetCommit, operationId: 'carry', actor: 'reviewer', publicationFixture,
    });
    assert.equal(retried.workspaceId, carried.workspaceId);

    const conflictingSource = createWorkspaceFromRepository(store, repository, { title: 'Conflicting source', baselineCommit, operationId: 'source-conflict', actor: 'reviewer', publicationFixture });
    const conflictingEdit = store.apply({ workspaceId: conflictingSource.id, actor: 'author', operationId: 'describe-conflict', expectedRevision: 0, commands: [{ type: 'class.describe', name: 'Record', definition: 'Draft description.' }] });
    writeFileSync(join(advance, 'model/domain.schema'), readFileSync(join(advance, 'model/domain.schema'), 'utf8').replace('Identifiable tenant-owned domain record with explicit provenance and version metadata.', 'Remote record description.'));
    git(advance, ['add', 'model/domain.schema']);
    git(advance, ['commit', '-m', 'advance overlapping path']);
    git(advance, ['push', 'origin', 'HEAD:refs/heads/main']);
    const conflictingTarget = git(advance, ['rev-parse', 'HEAD']);
    const conflict = await carryForwardWorkspaceFromRepository(store, repository, {
      sourceWorkspaceId: conflictingSource.id, expectedRevision: conflictingEdit.revision, expectedSourceDigest: conflictingEdit.sourceDigest,
      baselineCommit: conflictingTarget, operationId: 'conflict', actor: 'reviewer', publicationFixture,
    });
    assert.equal(conflict.status, 'conflict');
    assert.deepEqual(conflict.conflicts.map(item => item.path), ['model/domain.schema']);
  } finally {
    store?.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
