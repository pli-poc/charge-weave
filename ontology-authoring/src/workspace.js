import { DatabaseSync } from 'node:sqlite';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { createPatch } from 'diff';
import { responsibilityMappings, responsibilityMappingVersion, responsibilityMappingPath, validateResponsibilityMapping } from './responsibility-mapping.js';
import { editableSourcePaths } from './source-manifest.js';
import { buildIntervalSources, buildReviewerIntervalCase, canonicalJson, intervalSourcePaths } from './business-templates.js';

const hash = value => createHash('sha256').update(value).digest('hex');
const candidateManifest = (manifest, schema, overlays = {}) => manifest?.map(entry => entry.path === 'model/domain.schema' ? { ...entry, sha256: hash(schema) } : Object.hasOwn(overlays, entry.path) ? { ...entry, sha256: hash(overlays[entry.path]) } : entry);
const sourceDigest = (schema, baselineCommit, version, manifest, overlays = {}) => hash(JSON.stringify(version === 1
  ? { adapter: 'domain-schema-v1', sources: { 'model/domain.schema': hash(schema) } }
  : version === 2 ? { adapter: 'domain-schema-v2', baselineCommit, overlay: { 'model/domain.schema': hash(schema) } }
    : { adapter: version === 4 ? 'domain-schema-v4' : 'domain-schema-v3', baselineCommit, sources: candidateManifest(manifest, schema, overlays) }));
const requirementsPath = 'requirements/business-requirements.json';
const temporalPolicyPath = 'model/temporal-policy.json';
const temporalPolicies = new Set(['abstract', 'history-metadata', 'immutable-aggregate', 'snapshot-versioned', 'tenant-context']);
const identifier = /^[A-Za-z][A-Za-z0-9]*$/;
const cardBounds = { '!': [1, 1], '?': [0, 1], '+': [1, Infinity], '*': [0, Infinity] };
function fieldContracts(entity) {
  return new Map((entity?.fields || '').split(/\s+/).filter(Boolean).map(token => {
    const match = /^([A-Za-z][A-Za-z0-9]*):(.+)([!?+*])$/.exec(token);
    if (!match) throw new Error('Invalid field contract');
    return [match[1], { range: match[2], cardinality: match[3] }];
  }));
}
function fieldChanges(before, after) {
  const oldFields = fieldContracts(before), newFields = fieldContracts(after), changes = [];
  for (const name of new Set([...oldFields.keys(), ...newFields.keys()])) {
    const old = oldFields.get(name), next = newFields.get(name);
    if (JSON.stringify(old) === JSON.stringify(next)) continue;
    let compatibility = 'potentially-breaking';
    if (!old && !before) compatibility = 'new-class';
    else if (!old && next && cardBounds[next.cardinality][0] === 0) compatibility = 'additive';
    else if (old && next && old.range === next.range) {
      const [oldMin, oldMax] = cardBounds[old.cardinality], [nextMin, nextMax] = cardBounds[next.cardinality];
      compatibility = nextMin > oldMin || nextMax < oldMax ? 'potentially-breaking' : 'relaxed-review-required';
    }
    changes.push({ name, before: old ?? null, after: next ?? null, compatibility });
  }
  return changes;
}

function parse(schema) {
  const modules = new Set(), classes = new Map();
  let module;
  for (const line of schema.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const parts = line.split('|');
    if (parts[0] === 'MODULE' && parts.length === 2) { module = parts[1]; modules.add(module); continue; }
    if (parts.length !== 4 || !module || !identifier.test(parts[0]) || classes.has(parts[0])) throw new Error('Invalid domain schema');
    classes.set(parts[0], { name: parts[0], module, parent: parts[1], definition: parts[2], fields: parts[3] });
  }
  return { modules, classes };
}

function adapterCall(request) {
  const adapter = fileURLToPath(new URL('../../tools/authoring_adapter.py', import.meta.url));
  const output = execFileSync(process.env.CHARGEWEAVE_PYTHON || 'python', [adapter], {
    input: JSON.stringify(request), encoding: 'utf8', timeout: 15000, maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, PYTHONUTF8: '1' },
  });
  const result = JSON.parse(output);
  if (result.error) throw new Error(result.error);
  return result;
}
function apply(schema, commands) {
  const result = adapterCall({ schema, commands });
  if (typeof result.schema !== 'string' || Buffer.byteLength(result.schema) > 2_000_000) throw new Error('Invalid adapter result');
  return result.schema;
}
function verifyAdapter(workspace) {
  if (workspace.digestVersion < 3) return;
  for (const name of ['tools/authoring_adapter.py', 'tools/domain_schema.py']) {
    const expected = workspace.sourceManifest.find(entry => entry.path === name)?.sha256;
    const path = fileURLToPath(new URL(`../../${name}`, import.meta.url));
    let actual;
    try { actual = hash(readFileSync(path)); } catch { actual = null; }
    if (!expected || actual !== expected) throw new Error(`Pinned adapter differs or is missing: ${name}; create a workspace from the current commit`);
  }
}

export class WorkspaceStore {
  constructor(path) {
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
      CREATE TABLE IF NOT EXISTS workspaces (id TEXT PRIMARY KEY, title TEXT NOT NULL, baseline_commit TEXT NOT NULL, baseline_schema TEXT NOT NULL, schema TEXT NOT NULL, revision INTEGER NOT NULL, digest TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS receipts (workspace TEXT NOT NULL, actor TEXT NOT NULL, operation TEXT NOT NULL, request_hash TEXT NOT NULL, result TEXT NOT NULL, PRIMARY KEY(workspace, actor, operation), FOREIGN KEY(workspace) REFERENCES workspaces(id));
      CREATE TABLE IF NOT EXISTS events (sequence INTEGER PRIMARY KEY AUTOINCREMENT, workspace TEXT NOT NULL, actor TEXT NOT NULL, revision INTEGER NOT NULL, payload TEXT NOT NULL, FOREIGN KEY(workspace) REFERENCES workspaces(id));`);
    if (!this.db.prepare('PRAGMA table_info(events)').all().some(column => column.name === 'created_at')) this.db.exec('ALTER TABLE events ADD COLUMN created_at TEXT');
    this.db.exec("CREATE TRIGGER IF NOT EXISTS events_timestamp AFTER INSERT ON events WHEN NEW.created_at IS NULL BEGIN UPDATE events SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE sequence = NEW.sequence; END");
    this.db.exec(`CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, workspace TEXT NOT NULL, revision INTEGER NOT NULL, digest TEXT NOT NULL, status TEXT NOT NULL, output TEXT NOT NULL, FOREIGN KEY(workspace) REFERENCES workspaces(id)); UPDATE jobs SET status = 'interrupted' WHERE status IN ('queued', 'running', 'cancelling');`);
    this.db.exec(`CREATE TABLE IF NOT EXISTS job_steps (job TEXT NOT NULL, ordinal INTEGER NOT NULL, check_name TEXT NOT NULL, status TEXT NOT NULL, started_at TEXT NOT NULL, finished_at TEXT, output TEXT NOT NULL, PRIMARY KEY(job, ordinal), FOREIGN KEY(job) REFERENCES jobs(id)); UPDATE job_steps SET status = 'interrupted', finished_at = datetime('now') WHERE status = 'running';`);
    this.db.exec('CREATE TABLE IF NOT EXISTS job_artifacts (job TEXT PRIMARY KEY, summary TEXT NOT NULL, FOREIGN KEY(job) REFERENCES jobs(id))');
    this.db.exec('CREATE TABLE IF NOT EXISTS job_generated_files (job TEXT NOT NULL, path TEXT NOT NULL, sha256 TEXT NOT NULL, content BLOB NOT NULL, PRIMARY KEY(job, path), FOREIGN KEY(job) REFERENCES jobs(id))');
    this.db.exec('CREATE TABLE IF NOT EXISTS workspace_sources (workspace TEXT NOT NULL, path TEXT NOT NULL, baseline_content TEXT NOT NULL, content TEXT NOT NULL, PRIMARY KEY(workspace, path), FOREIGN KEY(workspace) REFERENCES workspaces(id))');
    this.db.exec('CREATE TABLE IF NOT EXISTS saved_views (workspace TEXT NOT NULL, view_id TEXT NOT NULL, revision INTEGER NOT NULL, definition TEXT NOT NULL, PRIMARY KEY(workspace, view_id), FOREIGN KEY(workspace) REFERENCES workspaces(id))');
    this.db.exec('CREATE TABLE IF NOT EXISTS view_receipts (workspace TEXT NOT NULL, actor TEXT NOT NULL, operation TEXT NOT NULL, request_hash TEXT NOT NULL, result TEXT NOT NULL, PRIMARY KEY(workspace, actor, operation), FOREIGN KEY(workspace) REFERENCES workspaces(id))');
    this.db.exec('CREATE TABLE IF NOT EXISTS workspace_creation_receipts (actor TEXT NOT NULL, operation TEXT NOT NULL, request_hash TEXT NOT NULL, workspace TEXT NOT NULL, result TEXT NOT NULL, PRIMARY KEY(actor, operation), FOREIGN KEY(workspace) REFERENCES workspaces(id))');
    this.db.exec("CREATE TABLE IF NOT EXISTS change_sets (id TEXT PRIMARY KEY, workspace TEXT NOT NULL, intent TEXT NOT NULL, requirements TEXT NOT NULL, base_revision INTEGER NOT NULL, status TEXT NOT NULL, review_id TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(workspace) REFERENCES workspaces(id))");
    this.db.exec("CREATE UNIQUE INDEX IF NOT EXISTS one_open_change_set ON change_sets(workspace) WHERE status IN ('draft', 'accepted', 'rejected')");
    if (!this.db.prepare('PRAGMA table_info(workspaces)').all().some(column => column.name === 'digest_version')) this.db.exec('ALTER TABLE workspaces ADD COLUMN digest_version INTEGER NOT NULL DEFAULT 1');
    if (!this.db.prepare('PRAGMA table_info(workspaces)').all().some(column => column.name === 'source_manifest')) this.db.exec('ALTER TABLE workspaces ADD COLUMN source_manifest TEXT');
    if (!this.db.prepare('PRAGMA table_info(jobs)').all().some(column => column.name === 'profile')) this.db.exec("ALTER TABLE jobs ADD COLUMN profile TEXT NOT NULL DEFAULT 'structural'");
    this.db.exec('CREATE TABLE IF NOT EXISTS command_groups (workspace TEXT NOT NULL, revision INTEGER NOT NULL, before_schema TEXT NOT NULL, after_digest TEXT NOT NULL, PRIMARY KEY(workspace, revision), FOREIGN KEY(workspace) REFERENCES workspaces(id))');
    if (!this.db.prepare('PRAGMA table_info(command_groups)').all().some(column => column.name === 'before_overlays')) this.db.exec('ALTER TABLE command_groups ADD COLUMN before_overlays TEXT');
    if (!this.db.prepare('PRAGMA table_info(command_groups)').all().some(column => column.name === 'after_schema')) this.db.exec('ALTER TABLE command_groups ADD COLUMN after_schema TEXT');
    if (!this.db.prepare('PRAGMA table_info(command_groups)').all().some(column => column.name === 'after_overlays')) this.db.exec('ALTER TABLE command_groups ADD COLUMN after_overlays TEXT');
    this.db.exec('CREATE TABLE IF NOT EXISTS review_decisions (id TEXT PRIMARY KEY, workspace TEXT NOT NULL, baseline_commit TEXT NOT NULL, revision INTEGER NOT NULL, digest TEXT NOT NULL, actor TEXT NOT NULL, decision TEXT NOT NULL, reason TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(workspace) REFERENCES workspaces(id))');
    this.db.exec('CREATE TABLE IF NOT EXISTS review_evidence (review TEXT NOT NULL, profile TEXT NOT NULL, job TEXT NOT NULL, PRIMARY KEY(review, profile), FOREIGN KEY(review) REFERENCES review_decisions(id), FOREIGN KEY(job) REFERENCES jobs(id))');
    this.db.exec('CREATE TABLE IF NOT EXISTS publications (id TEXT PRIMARY KEY, workspace TEXT NOT NULL, actor TEXT NOT NULL, baseline_commit TEXT NOT NULL, revision INTEGER NOT NULL, digest TEXT NOT NULL, review_id TEXT NOT NULL, preview_job TEXT NOT NULL, branch TEXT NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL, state TEXT NOT NULL, commit_sha TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(workspace) REFERENCES workspaces(id), FOREIGN KEY(review_id) REFERENCES review_decisions(id), FOREIGN KEY(preview_job) REFERENCES jobs(id))');
    if (!this.db.prepare('PRAGMA table_info(publications)').all().some(column => column.name === 'pr_number')) this.db.exec('ALTER TABLE publications ADD COLUMN pr_number INTEGER');
    if (!this.db.prepare('PRAGMA table_info(publications)').all().some(column => column.name === 'pr_status')) this.db.exec('ALTER TABLE publications ADD COLUMN pr_status TEXT');
    this.db.exec('CREATE TABLE IF NOT EXISTS publication_bundles (publication TEXT PRIMARY KEY, sha256 TEXT NOT NULL, content BLOB NOT NULL, FOREIGN KEY(publication) REFERENCES publications(id))');
    this.db.prepare("UPDATE publications SET state = 'push_unknown', updated_at = ? WHERE state = 'push_pending'").run(new Date().toISOString());
    this.db.prepare("UPDATE publications SET state = 'pr_unknown', updated_at = ? WHERE state = 'pr_pending'").run(new Date().toISOString());
  }
  close() { this.db.close(); }
  createJob(id, revision, digest, actor, operationId, profile = 'structural', subject = null) {
    if (!actor || !operationId) throw new Error('Invalid validation identity');
    if (!['structural', 'reference', 'audit', 'acceptance', 'maintenance-demo', 'publication-preview', 'publication-commit', 'publication-push', 'publication-pr'].includes(profile) || (['publication-preview', 'publication-commit', 'publication-push', 'publication-pr'].includes(profile) && !/^[0-9a-f-]{36}$/i.test(subject ?? '')) || (!['publication-preview', 'publication-commit', 'publication-push', 'publication-pr'].includes(profile) && subject !== null)) throw new Error('Invalid validation profile');
    const requestHash = hash(JSON.stringify({ type: 'validation.start', revision, digest, profile, ...(subject === null ? {} : { subject }) }));
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const receipt = this.db.prepare('SELECT * FROM receipts WHERE workspace = ? AND actor = ? AND operation = ?').get(id, actor, operationId);
      if (receipt) {
        if (receipt.request_hash !== requestHash) throw new Error('Operation ID reused with different request');
        const job = this.job(id, JSON.parse(receipt.result).jobId);
        this.db.exec('COMMIT'); return { job, created: false };
      }
      const workspace = this.get(id);
      if (workspace.revision !== revision || workspace.sourceDigest !== digest) throw new Error('Stale validation input');
      if (this.db.prepare("SELECT 1 FROM publications WHERE workspace = ? AND state IN ('push_pending', 'pr_pending') LIMIT 1").get(id)) throw new Error('Publication operation is in progress');
      if (this.db.prepare("SELECT 1 FROM jobs WHERE workspace = ? AND status IN ('queued', 'running', 'cancelling') LIMIT 1").get(id)) throw new Error('A validation job is already active for this workspace');
      const jobId = randomUUID();
      this.db.prepare('INSERT INTO jobs (id, workspace, revision, digest, status, output, profile) VALUES (?, ?, ?, ?, ?, ?, ?)').run(jobId, id, revision, digest, 'queued', '', profile);
      this.db.prepare('INSERT INTO receipts VALUES (?, ?, ?, ?, ?)').run(id, actor, operationId, requestHash, JSON.stringify({ jobId }));
      const job = this.job(id, jobId);
      this.db.exec('COMMIT'); return { job, created: true };
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  requestJobCancel(workspaceId, jobId, actor, operationId) {
    if (!actor || !operationId) throw new Error('Invalid cancellation identity');
    const requestHash = hash(JSON.stringify({ type: 'validation.cancel', jobId }));
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const receipt = this.db.prepare('SELECT * FROM receipts WHERE workspace = ? AND actor = ? AND operation = ?').get(workspaceId, actor, operationId);
      if (receipt) {
        if (receipt.request_hash !== requestHash) throw new Error('Operation ID reused with different request');
        const job = this.job(workspaceId, jobId);
        this.db.exec('COMMIT'); return { job, requested: false };
      }
      const job = this.job(workspaceId, jobId);
      if (['publication-commit', 'publication-push', 'publication-pr'].includes(job.profile)) throw new Error('Publication operation cannot be cancelled after it starts');
      const requested = ['queued', 'running'].includes(job.status);
      if (requested) this.db.prepare("UPDATE jobs SET status = 'cancelling' WHERE id = ?").run(jobId);
      this.db.prepare('INSERT INTO receipts VALUES (?, ?, ?, ?, ?)').run(workspaceId, actor, operationId, requestHash, JSON.stringify({ jobId }));
      const result = this.job(workspaceId, jobId);
      this.db.exec('COMMIT'); return { job: result, requested };
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  job(workspaceId, jobId) {
    const row = this.db.prepare('SELECT id, workspace, revision, digest, status, output, profile FROM jobs WHERE workspace = ? AND id = ?').get(workspaceId, jobId);
    if (!row) throw new Error('Job not found');
    const workspace = this.get(workspaceId);
    const steps = this.db.prepare('SELECT ordinal, check_name AS checkName, status, started_at AS startedAt, finished_at AS finishedAt, output FROM job_steps WHERE job = ? ORDER BY ordinal').all(jobId);
    const artifact = this.db.prepare('SELECT summary FROM job_artifacts WHERE job = ?').get(jobId);
    return { ...row, baselineCommit: workspace.baselineCommit, digestVersion: workspace.digestVersion, steps, artifactSummary: artifact ? JSON.parse(artifact.summary) : null, stale: workspace.sourceDigest !== row.digest || workspace.revision !== row.revision };
  }
  saveJobArtifacts(jobId, summary) { this.db.prepare('INSERT OR REPLACE INTO job_artifacts (job, summary) VALUES (?, ?)').run(jobId, JSON.stringify(summary)); }
  saveJobGeneratedFiles(jobId, files) {
    if (!Array.isArray(files) || files.length > 5000 || files.reduce((sum, file) => sum + (file.content?.length ?? 0), 0) > 128 * 1024 * 1024) throw new Error('Invalid generated snapshot');
    this.db.exec('BEGIN IMMEDIATE');
    try {
      for (const file of files) {
        if (typeof file.path !== 'string' || !/^[A-Za-z0-9._/-]+$/.test(file.path) || file.path.split('/').some(part => !part || part === '.' || part === '..') || !Buffer.isBuffer(file.content) || file.content.length !== file.bytes || hash(file.content) !== file.sha256) throw new Error('Invalid generated snapshot file');
        this.db.prepare('INSERT INTO job_generated_files VALUES (?, ?, ?, ?)').run(jobId, file.path, file.sha256, file.content);
      }
      this.db.exec('COMMIT');
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  jobGeneratedFiles(workspaceId, jobId) {
    this.job(workspaceId, jobId);
    return this.db.prepare('SELECT path, sha256, content FROM job_generated_files WHERE job = ? ORDER BY path').all(jobId).map(row => ({ path: row.path, sha256: row.sha256, bytes: row.content.length, content: Buffer.from(row.content) }));
  }
  evidence(workspaceId, jobId) {
    const job = this.job(workspaceId, jobId);
    if (!['passed', 'failed', 'cancelled', 'interrupted'].includes(job.status)) throw new Error('Evidence is not complete');
    const scope = job.profile === 'maintenance-demo' ? 'Synthetic maintenance fixture checks only; not full release acceptance' : job.profile === 'publication-pr' ? 'Draft pull-request creation or reconciliation; required checks and deployment are separate' : job.profile === 'publication-push' ? 'Push of the recorded commit to its isolated branch; pull-request and required checks are separate' : job.profile === 'publication-commit' ? 'Local commit and recoverable bundle; no push or remote verification' : job.profile === 'publication-preview' ? 'Isolated staged-file preview; no commit, push or remote verification' : job.profile === 'acceptance' ? 'Generation, generated-artifact consistency and repository release gates' : job.profile === 'reference' ? 'Generation, SHACL reference validation, business-rule negative fixtures, structural boundaries and focused business decisions' : job.profile === 'audit' ? 'Generation and independent business traceability audit' : 'Structural generation';
    return { ...job, scope, completeAcceptanceEvidence: false };
  }
  startJobStep(jobId, ordinal, name) { this.db.prepare('INSERT INTO job_steps VALUES (?, ?, ?, ?, ?, NULL, ?)').run(jobId, ordinal, name, 'running', new Date().toISOString(), ''); }
  finishJobStep(jobId, ordinal, status, output = '') { this.db.prepare('UPDATE job_steps SET status = ?, finished_at = ?, output = ? WHERE job = ? AND ordinal = ?').run(status, new Date().toISOString(), output.slice(-16000), jobId, ordinal); }
  reviewReadiness(workspaceId) {
    const workspace = this.get(workspaceId);
    const jobs = this.db.prepare('SELECT id, profile, revision, digest, status FROM jobs WHERE workspace = ? AND digest = ? AND revision = ? ORDER BY rowid DESC').all(workspaceId, workspace.sourceDigest, workspace.revision);
    const evidence = ['structural', 'reference', 'audit', 'acceptance'].map(profile => ({ profile, job: jobs.find(job => job.profile === profile) ?? null }));
    const missing = evidence.filter(item => item.job?.status !== 'passed').map(item => item.profile);
    if (workspace.digestVersion === 1) missing.push('legacy digest does not bind the baseline commit');
    if (workspace.digestVersion < 3) missing.push('complete source manifest not recorded');
    const diff = this.diff(workspaceId);
    if (diff.source.before === diff.source.after && !diff.additionalSources.length) missing.push('no source changes');
    return { workspaceId, baselineCommit: workspace.baselineCommit, revision: workspace.revision, sourceDigest: workspace.sourceDigest, digestVersion: workspace.digestVersion, evidence, missing, canAccept: missing.length === 0, note: 'Passing checks support review; they do not establish business completeness or publish the change.' };
  }
  reviewDecisions(workspaceId) {
    const workspace = this.get(workspaceId);
    return this.db.prepare('SELECT id, baseline_commit AS baselineCommit, revision, digest AS sourceDigest, actor, decision, reason, created_at AS createdAt FROM review_decisions WHERE workspace = ? ORDER BY rowid DESC LIMIT 100').all(workspaceId)
      .map(row => ({ ...row, evidence: this.db.prepare('SELECT profile, job AS jobId FROM review_evidence WHERE review = ? ORDER BY profile').all(row.id), stale: row.revision !== workspace.revision || row.sourceDigest !== workspace.sourceDigest || row.baselineCommit !== workspace.baselineCommit || Boolean(row.decision === 'accept' && workspace.changeSet && (workspace.changeSet.reviewId !== row.id || !['accepted', 'published'].includes(workspace.changeSet.status))) }));
  }
  reviewDecision(workspaceId, reviewId) {
    const workspace = this.get(workspaceId);
    const row = this.db.prepare('SELECT id, baseline_commit AS baselineCommit, revision, digest AS sourceDigest, actor, decision, reason, created_at AS createdAt FROM review_decisions WHERE workspace = ? AND id = ?').get(workspaceId, reviewId);
    if (!row) throw new Error('Review decision not found');
    return { ...row, evidence: this.db.prepare('SELECT profile, job AS jobId FROM review_evidence WHERE review = ? ORDER BY profile').all(row.id), stale: row.revision !== workspace.revision || row.sourceDigest !== workspace.sourceDigest || row.baselineCommit !== workspace.baselineCommit || Boolean(row.decision === 'accept' && workspace.changeSet && (workspace.changeSet.reviewId !== row.id || !['accepted', 'published'].includes(workspace.changeSet.status))) };
  }
  publication(workspaceId, publicationId) {
    const row = this.db.prepare('SELECT id, actor, baseline_commit AS baselineCommit, revision, digest AS sourceDigest, review_id AS reviewId, preview_job AS previewJobId, branch, subject, body, state, commit_sha AS commitSha, pr_number AS prNumber, pr_status AS prStatus, created_at AS createdAt, updated_at AS updatedAt FROM publications WHERE workspace = ? AND id = ?').get(workspaceId, publicationId);
    if (!row) throw new Error('Publication not found');
    const workspace = this.get(workspaceId);
    const prUrl = Number.isSafeInteger(row.prNumber) && row.prNumber > 0 ? `https://github.com/pli-poc/charge-weave/pull/${row.prNumber}` : null;
    return { ...row, workspaceId, prUrl, stale: workspace.revision !== row.revision || workspace.sourceDigest !== row.sourceDigest || workspace.baselineCommit !== row.baselineCommit };
  }
  publicationHistory(workspaceId) {
    this.get(workspaceId);
    return this.db.prepare('SELECT id FROM publications WHERE workspace = ? ORDER BY rowid DESC LIMIT 100').all(workspaceId).map(row => this.publication(workspaceId, row.id));
  }
  publicationBundle(workspaceId, publicationId) {
    const record = this.publication(workspaceId, publicationId);
    const row = this.db.prepare('SELECT sha256, content FROM publication_bundles WHERE publication = ?').get(publicationId);
    if (!row || !record.commitSha || hash(row.content) !== row.sha256) throw new Error('Publication bundle is unavailable or corrupt');
    return { commitSha: record.commitSha, sha256: row.sha256, content: Buffer.from(row.content) };
  }
  savePublicationCommit(workspaceId, publicationId, commitSha, bundle) {
    if (!/^[a-f0-9]{40}$/.test(commitSha ?? '') || !Buffer.isBuffer(bundle) || !bundle.length || bundle.length > 128 * 1024 * 1024) throw new Error('Invalid publication commit bundle');
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const record = this.publication(workspaceId, publicationId);
      if (record.state !== 'prepared' || record.stale || this.reviewDecision(workspaceId, record.reviewId).stale || this.reviewDecisions(workspaceId)[0]?.id !== record.reviewId || !this.reviewReadiness(workspaceId).canAccept) throw new Error('Publication draft or review is stale');
      this.db.prepare('INSERT INTO publication_bundles VALUES (?, ?, ?)').run(publicationId, hash(bundle), bundle);
      this.db.prepare("UPDATE publications SET state = 'commit_created', commit_sha = ?, updated_at = ? WHERE workspace = ? AND id = ?").run(commitSha, new Date().toISOString(), workspaceId, publicationId);
      this.db.prepare('INSERT INTO events (workspace, actor, revision, payload) VALUES (?, ?, ?, ?)').run(workspaceId, record.actor, record.revision, JSON.stringify({ type: 'publication', publicationId, state: 'commit_created', commitSha }));
      const result = this.publication(workspaceId, publicationId);
      this.db.exec('COMMIT'); return result;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  reservePublication(workspaceId, { actor, operationId, expectedRevision, sourceDigest: digest, reviewId, previewJobId, subject, body }) {
    if (!actor || !operationId || !Number.isSafeInteger(expectedRevision) || !/^[a-f0-9]{64}$/.test(digest ?? '') || !/^[0-9a-f-]{36}$/i.test(reviewId ?? '') || !/^[0-9a-f-]{36}$/i.test(previewJobId ?? '') || typeof subject !== 'string' || !subject.trim() || subject.length > 120 || /[\r\n\x00-\x1f]/.test(subject) || typeof body !== 'string' || !body.trim() || body.length > 10000 || body.includes('\0')) throw new Error('Invalid publication intent');
    const requestHash = hash(JSON.stringify({ type: 'publication.reserve', expectedRevision, digest, reviewId, previewJobId, subject, body }));
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const receipt = this.db.prepare('SELECT * FROM receipts WHERE workspace = ? AND actor = ? AND operation = ?').get(workspaceId, actor, operationId);
      if (receipt) {
        if (receipt.request_hash !== requestHash) throw new Error('Operation ID reused with different request');
        const record = this.publication(workspaceId, JSON.parse(receipt.result).publicationId);
        this.db.exec('COMMIT'); return record;
      }
      const workspace = this.get(workspaceId), review = this.reviewDecision(workspaceId, reviewId), preview = this.job(workspaceId, previewJobId);
      if (workspace.revision !== expectedRevision || workspace.sourceDigest !== digest || review.decision !== 'accept' || review.stale || this.reviewDecisions(workspaceId)[0]?.id !== reviewId || !this.reviewReadiness(workspaceId).canAccept || preview.profile !== 'publication-preview' || preview.status !== 'passed' || preview.stale || preview.artifactSummary?.reviewId !== reviewId || preview.artifactSummary?.sourceDigest !== digest || preview.artifactSummary?.baselineCommit !== workspace.baselineCommit || preview.artifactSummary?.revision !== expectedRevision || !Array.isArray(preview.artifactSummary?.files) || !preview.artifactSummary.files.length) throw new Error('Current accepted review and staged preview are required');
      const id = randomUUID(), now = new Date().toISOString(), branch = `chargeweave/studio-${id}`;
      this.db.prepare('INSERT INTO publications (id, workspace, actor, baseline_commit, revision, digest, review_id, preview_job, branch, subject, body, state, commit_sha, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id, workspaceId, actor, workspace.baselineCommit, expectedRevision, digest, reviewId, previewJobId, branch, subject.trim(), body.trim(), 'prepared', null, now, now);
      this.db.prepare('INSERT INTO receipts VALUES (?, ?, ?, ?, ?)').run(workspaceId, actor, operationId, requestHash, JSON.stringify({ publicationId: id }));
      this.db.prepare('INSERT INTO events (workspace, actor, revision, payload) VALUES (?, ?, ?, ?)').run(workspaceId, actor, expectedRevision, JSON.stringify({ type: 'publication', publicationId: id, state: 'prepared', sourceDigest: digest }));
      const record = this.publication(workspaceId, id);
      this.db.exec('COMMIT'); return record;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  advancePublication(workspaceId, publicationId, expectedState, nextState, commitSha = null) {
    const allowed = { prepared: ['failed'], commit_created: ['push_pending', 'failed'], push_pending: ['pushed', 'push_unknown'], push_unknown: ['pushed'], pushed: ['pr_pending'], pr_pending: ['pr_unknown'] };
    if (!allowed[expectedState]?.includes(nextState) || (commitSha !== null && !/^[a-f0-9]{40}$/.test(commitSha))) throw new Error('Invalid publication transition');
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const record = this.publication(workspaceId, publicationId);
      if (record.state !== expectedState) throw new Error('Publication state conflict');
      if (['prepared', 'commit_created', 'pushed'].includes(expectedState) && (record.stale || this.reviewDecision(workspaceId, record.reviewId).stale || this.reviewDecisions(workspaceId)[0]?.id !== record.reviewId || !this.reviewReadiness(workspaceId).canAccept)) throw new Error('Publication draft or review is stale');
      if (record.commitSha && commitSha && record.commitSha !== commitSha) throw new Error('Publication commit cannot change');
      this.db.prepare('UPDATE publications SET state = ?, commit_sha = ?, updated_at = ? WHERE workspace = ? AND id = ?').run(nextState, record.commitSha ?? commitSha, new Date().toISOString(), workspaceId, publicationId);
      if (nextState === 'pushed') this.db.prepare("UPDATE change_sets SET status = 'published', updated_at = ? WHERE workspace = ? AND status = 'accepted' AND review_id = ?").run(new Date().toISOString(), workspaceId, record.reviewId);
      this.db.prepare('INSERT INTO events (workspace, actor, revision, payload) VALUES (?, ?, ?, ?)').run(workspaceId, record.actor, record.revision, JSON.stringify({ type: 'publication', publicationId, state: nextState, commitSha: record.commitSha ?? commitSha }));
      const updated = this.publication(workspaceId, publicationId);
      this.db.exec('COMMIT'); return updated;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  recordPublicationPullRequest(workspaceId, publicationId, expectedState, number, status) {
    if (!['pr_pending', 'pr_unknown'].includes(expectedState) || !Number.isSafeInteger(number) || number < 1 || !['open', 'closed'].includes(status)) throw new Error('Invalid pull request evidence');
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const record = this.publication(workspaceId, publicationId);
      if (record.state !== expectedState) throw new Error('Publication state conflict');
      this.db.prepare("UPDATE publications SET state = 'pr_created', pr_number = ?, pr_status = ?, updated_at = ? WHERE workspace = ? AND id = ?").run(number, status, new Date().toISOString(), workspaceId, publicationId);
      this.db.prepare('INSERT INTO events (workspace, actor, revision, payload) VALUES (?, ?, ?, ?)').run(workspaceId, record.actor, record.revision, JSON.stringify({ type: 'publication', publicationId, state: 'pr_created', prNumber: number }));
      const result = this.publication(workspaceId, publicationId);
      this.db.exec('COMMIT'); return result;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  retryPublicationAfterAbsentRemote(workspaceId, publicationId) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const record = this.publication(workspaceId, publicationId);
      if (record.state !== 'push_unknown' || record.stale || this.reviewDecisions(workspaceId)[0]?.id !== record.reviewId || !this.reviewReadiness(workspaceId).canAccept) throw new Error('Publication cannot be retried');
      this.db.prepare("UPDATE publications SET state = 'commit_created', updated_at = ? WHERE workspace = ? AND id = ?").run(new Date().toISOString(), workspaceId, publicationId);
      this.db.prepare('INSERT INTO events (workspace, actor, revision, payload) VALUES (?, ?, ?, ?)').run(workspaceId, record.actor, record.revision, JSON.stringify({ type: 'publication', publicationId, state: 'commit_created', reason: 'remote branch absent on reconciliation' }));
      const updated = this.publication(workspaceId, publicationId);
      this.db.exec('COMMIT'); return updated;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  retryPublicationAfterAbsentPullRequest(workspaceId, publicationId) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const record = this.publication(workspaceId, publicationId);
      if (record.state !== 'pr_unknown' || record.stale || this.reviewDecisions(workspaceId)[0]?.id !== record.reviewId || !this.reviewReadiness(workspaceId).canAccept) throw new Error('Pull request cannot be retried');
      this.db.prepare("UPDATE publications SET state = 'pushed', updated_at = ? WHERE workspace = ? AND id = ?").run(new Date().toISOString(), workspaceId, publicationId);
      this.db.prepare('INSERT INTO events (workspace, actor, revision, payload) VALUES (?, ?, ?, ?)').run(workspaceId, record.actor, record.revision, JSON.stringify({ type: 'publication', publicationId, state: 'pushed', reason: 'pull request absent on reconciliation' }));
      const updated = this.publication(workspaceId, publicationId);
      this.db.exec('COMMIT'); return updated;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  recordReview(workspaceId, { actor, operationId, expectedRevision, changeSetId, sourceDigest: digest, decision, reason }) {
    if (!actor || !operationId || !Number.isSafeInteger(expectedRevision) || !/^[a-f0-9]{64}$/.test(digest ?? '') || !['accept', 'request_changes', 'reject'].includes(decision) || typeof reason !== 'string' || !reason.trim() || reason.length > 4000) throw new Error('Invalid review decision');
    const requestHash = hash(JSON.stringify({ type: 'review', expectedRevision, digest, decision, reason, ...(changeSetId === undefined ? {} : { changeSetId }) }));
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const receipt = this.db.prepare('SELECT * FROM receipts WHERE workspace = ? AND actor = ? AND operation = ?').get(workspaceId, actor, operationId);
      if (receipt) {
        if (receipt.request_hash !== requestHash) throw new Error('Operation ID reused with different request');
        const record = this.reviewDecision(workspaceId, JSON.parse(receipt.result).reviewId);
        this.db.exec('COMMIT'); return record;
      }
      const workspace = this.get(workspaceId);
      if (workspace.revision !== expectedRevision || workspace.sourceDigest !== digest) throw new Error('Stale review input');
      if (workspace.changeSet && (workspace.changeSet.id !== changeSetId || workspace.changeSet.status !== 'draft')) throw new Error('Change set is not editable');
      if (!workspace.changeSet && changeSetId !== undefined) throw new Error('Change set not found');
      if (this.db.prepare("SELECT 1 FROM publications WHERE workspace = ? AND state IN ('push_pending', 'pr_pending') LIMIT 1").get(workspaceId)) throw new Error('Publication operation is in progress');
      const readiness = decision === 'accept' ? this.reviewReadiness(workspaceId) : null;
      if (readiness && !readiness.canAccept) throw new Error(`Review gates incomplete: ${readiness.missing.join(', ')}`);
      const reviewId = randomUUID(), createdAt = new Date().toISOString();
      this.db.prepare('INSERT INTO review_decisions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(reviewId, workspaceId, workspace.baselineCommit, expectedRevision, digest, actor, decision, reason, createdAt);
      if (workspace.changeSet) this.db.prepare('UPDATE change_sets SET status = ?, review_id = ?, updated_at = ? WHERE id = ?').run(decision === 'accept' ? 'accepted' : decision === 'reject' ? 'rejected' : 'draft', decision === 'accept' ? reviewId : null, createdAt, workspace.changeSet.id);
      if (readiness) for (const item of readiness.evidence) this.db.prepare('INSERT INTO review_evidence VALUES (?, ?, ?)').run(reviewId, item.profile, item.job.id);
      this.db.prepare('INSERT INTO receipts VALUES (?, ?, ?, ?, ?)').run(workspaceId, actor, operationId, requestHash, JSON.stringify({ reviewId }));
      this.db.prepare('INSERT INTO events (workspace, actor, revision, payload) VALUES (?, ?, ?, ?)').run(workspaceId, actor, expectedRevision, JSON.stringify({ type: 'review', reviewId, decision, sourceDigest: digest }));
      const record = this.reviewDecision(workspaceId, reviewId);
      this.db.exec('COMMIT'); return record;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  suggestView(workspaceId, { actor, operationId, expectedRevision, root, viewpoint, explanation }) {
    if (!actor || !operationId || !Number.isSafeInteger(expectedRevision) || !identifier.test(root ?? '') || !['information', 'responsibility', 'temporal'].includes(viewpoint) || typeof explanation !== 'string' || !explanation.trim() || explanation.length > 500) throw new Error('Invalid view suggestion');
    const requestHash = hash(JSON.stringify({ type: 'view.suggest', expectedRevision, root, viewpoint, explanation }));
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const receipt = this.db.prepare('SELECT * FROM receipts WHERE workspace = ? AND actor = ? AND operation = ?').get(workspaceId, actor, operationId);
      if (receipt) {
        if (receipt.request_hash !== requestHash) throw new Error('Operation ID reused with different request');
        const result = JSON.parse(receipt.result);
        this.db.exec('COMMIT'); return result;
      }
      const workspace = this.get(workspaceId);
      if (workspace.revision !== expectedRevision) throw new Error('Stale view suggestion');
      if (!parse(workspace.schema).classes.has(root)) throw new Error('Suggested class not found');
      const payload = { type: 'view_suggestion', root, viewpoint, explanation, sourceDigest: workspace.sourceDigest };
      const event = this.db.prepare('INSERT INTO events (workspace, actor, revision, payload) VALUES (?, ?, ?, ?)').run(workspaceId, actor, workspace.revision, JSON.stringify(payload));
      const result = { workspaceId, revision: workspace.revision, sourceDigest: workspace.sourceDigest, eventSequence: Number(event.lastInsertRowid), suggestion: payload };
      this.db.prepare('INSERT INTO receipts VALUES (?, ?, ?, ?, ?)').run(workspaceId, actor, operationId, requestHash, JSON.stringify(result));
      this.db.exec('COMMIT'); return result;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  updateJob(id, status, output = '') { this.db.prepare('UPDATE jobs SET status = ?, output = ? WHERE id = ?').run(status, output.slice(-16000), id); }
  createdWorkspaceId(actor, operationId) {
    return this.db.prepare('SELECT workspace FROM workspace_creation_receipts WHERE actor = ? AND operation = ?').get(actor, operationId)?.workspace ?? null;
  }
  create({ title, baselineCommit, schema, sourceManifest, sourceBlobs }, provision = null) {
    if (typeof title !== 'string' || !title.trim() || !/^[a-f0-9]{40}$/.test(baselineCommit ?? '') || typeof schema !== 'string' || Buffer.byteLength(schema) > 2_000_000) throw new Error('Invalid workspace baseline');
    parse(schema);
    if (sourceManifest !== undefined) {
      if (!Array.isArray(sourceManifest) || !sourceManifest.length || sourceManifest.length > 10000 || sourceManifest.some((entry, index) => !entry || typeof entry.path !== 'string' || !(entry.path === 'requirements.txt' || /^(model|benchmark|requirements|tests|tools)\/[A-Za-z0-9._/-]+$/.test(entry.path)) || entry.path.split('/').some(part => part === '.' || part === '..' || !part) || Object.keys(entry).sort().join(',') !== 'path,sha256' || !/^[a-f0-9]{64}$/.test(entry.sha256 ?? '') || (index > 0 && sourceManifest[index - 1].path >= entry.path)) || sourceManifest.find(entry => entry.path === 'model/domain.schema')?.sha256 !== hash(schema)) throw new Error('Invalid source manifest');
    }
    if (sourceBlobs !== undefined) {
      if (!sourceManifest || !sourceBlobs || typeof sourceBlobs !== 'object' || Array.isArray(sourceBlobs) || !Object.keys(sourceBlobs).length) throw new Error('Invalid editable source blobs');
      for (const [path, content] of Object.entries(sourceBlobs)) {
        if (!editableSourcePaths.has(path) || typeof content !== 'string' || Buffer.byteLength(content) > 2_000_000 || sourceManifest.find(entry => entry.path === path)?.sha256 !== hash(content)) throw new Error('Invalid editable source blob');
        try { JSON.parse(content); } catch { throw new Error('Invalid editable source JSON'); }
      }
    }
    const id = randomUUID();
    const version = sourceBlobs ? 4 : sourceManifest ? 3 : 2;
    if (provision && (typeof provision.actor !== 'string' || !provision.actor || typeof provision.operationId !== 'string' || !provision.operationId || provision.operationId.length > 128)) throw new Error('Invalid workspace creation identity');
    const requestHash = provision ? hash(JSON.stringify({ title, baselineCommit })) : null;
    this.db.exec('BEGIN IMMEDIATE');
    try {
      if (provision) {
        const receipt = this.db.prepare('SELECT request_hash, result FROM workspace_creation_receipts WHERE actor = ? AND operation = ?').get(provision.actor, provision.operationId);
        if (receipt) { if (receipt.request_hash !== requestHash) throw new Error('Operation ID reused with different request'); this.db.exec('COMMIT'); return JSON.parse(receipt.result); }
      }
      this.db.prepare('INSERT INTO workspaces (id, title, baseline_commit, baseline_schema, schema, revision, digest, digest_version, source_manifest) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)').run(id, title, baselineCommit, schema, schema, sourceDigest(schema, baselineCommit, version, sourceManifest), version, sourceManifest ? JSON.stringify(sourceManifest) : null);
      for (const [path, content] of Object.entries(sourceBlobs || {})) this.db.prepare('INSERT INTO workspace_sources VALUES (?, ?, ?, ?)').run(id, path, content, content);
      const workspace = this.get(id);
      const result = provision ? { id, title: workspace.title, baselineCommit, revision: 0, sourceDigest: workspace.sourceDigest } : workspace;
      if (provision) this.db.prepare('INSERT INTO workspace_creation_receipts VALUES (?, ?, ?, ?, ?)').run(provision.actor, provision.operationId, requestHash, id, JSON.stringify(result));
      this.db.exec('COMMIT'); return result;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  latestChangeSet(workspaceId) {
    const row = this.db.prepare('SELECT id, intent, requirements, base_revision AS baseRevision, status, review_id AS reviewId, created_at AS createdAt, updated_at AS updatedAt FROM change_sets WHERE workspace = ? ORDER BY rowid DESC LIMIT 1').get(workspaceId);
    return row ? { ...row, requirements: JSON.parse(row.requirements) } : null;
  }
  openChangeSet({ workspaceId, actor, operationId, expectedRevision, intent, requirements = [] }) {
    if (!actor || !operationId || !Number.isSafeInteger(expectedRevision) || typeof intent !== 'string' || !intent.trim() || intent.length > 1000 || !Array.isArray(requirements) || requirements.length > 100 || requirements.some(id => typeof id !== 'string' || !/^BR-[0-9]+$/.test(id)) || new Set(requirements).size !== requirements.length) throw new Error('Invalid change set request');
    const requestHash = hash(JSON.stringify({ type: 'changeset.open', expectedRevision, intent, requirements }));
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const receipt = this.db.prepare('SELECT request_hash, result FROM receipts WHERE workspace = ? AND actor = ? AND operation = ?').get(workspaceId, actor, operationId);
      if (receipt) { if (receipt.request_hash !== requestHash) throw new Error('Operation ID reused with different request'); this.db.exec('COMMIT'); return JSON.parse(receipt.result); }
      const workspace = this.get(workspaceId);
      if (workspace.revision !== expectedRevision) throw new Error('Stale revision');
      if (this.latestChangeSet(workspaceId)) throw new Error('Workspace already has a change set');
      if (this.db.prepare("SELECT 1 FROM publications WHERE workspace = ? AND state IN ('push_pending', 'push_unknown', 'pr_pending', 'pr_unknown') LIMIT 1").get(workspaceId)) throw new Error('Publication operation is in progress or requires reconciliation');
      if (requirements.length) {
        const source = this.db.prepare('SELECT content FROM workspace_sources WHERE workspace = ? AND path = ?').get(workspaceId, requirementsPath);
        if (!source) throw new Error('Requirements source is unavailable');
        const known = new Set(JSON.parse(source.content).map(item => item.id));
        if (requirements.some(id => !known.has(id))) throw new Error('Change set references an unknown requirement');
      }
      const id = randomUUID(), now = new Date().toISOString();
      this.db.prepare('INSERT INTO change_sets VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)').run(id, workspaceId, intent.trim(), JSON.stringify(requirements), expectedRevision, 'draft', now, now);
      const event = this.db.prepare('INSERT INTO events (workspace, actor, revision, payload) VALUES (?, ?, ?, ?)').run(workspaceId, actor, workspace.revision, JSON.stringify({ type: 'changeset_opened', changeSetId: id, intent: intent.trim(), requirements }));
      const result = { workspaceId, changeSet: this.latestChangeSet(workspaceId), revision: workspace.revision, sourceDigest: workspace.sourceDigest, eventSequence: Number(event.lastInsertRowid) };
      this.db.prepare('INSERT INTO receipts VALUES (?, ?, ?, ?, ?)').run(workspaceId, actor, operationId, requestHash, JSON.stringify(result));
      this.db.exec('COMMIT'); return result;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  reopenChangeSet({ workspaceId, actor, operationId, expectedRevision, changeSetId }) {
    if (!actor || !operationId || !Number.isSafeInteger(expectedRevision) || !/^[0-9a-f-]{36}$/i.test(changeSetId ?? '')) throw new Error('Invalid change set request');
    const requestHash = hash(JSON.stringify({ type: 'changeset.reopen', expectedRevision, changeSetId }));
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const receipt = this.db.prepare('SELECT request_hash, result FROM receipts WHERE workspace = ? AND actor = ? AND operation = ?').get(workspaceId, actor, operationId);
      if (receipt) { if (receipt.request_hash !== requestHash) throw new Error('Operation ID reused with different request'); this.db.exec('COMMIT'); return JSON.parse(receipt.result); }
      const workspace = this.get(workspaceId), current = this.latestChangeSet(workspaceId);
      if (workspace.revision !== expectedRevision) throw new Error('Stale revision');
      if (!current || current.id !== changeSetId || !['accepted', 'rejected'].includes(current.status)) throw new Error('Change set cannot be reopened');
      if (this.db.prepare("SELECT 1 FROM publications WHERE workspace = ? AND state IN ('push_pending', 'push_unknown', 'pr_pending', 'pr_unknown') LIMIT 1").get(workspaceId)) throw new Error('Publication operation is in progress or requires reconciliation');
      this.db.prepare("UPDATE change_sets SET status = 'draft', review_id = NULL, updated_at = ? WHERE id = ?").run(new Date().toISOString(), changeSetId);
      const event = this.db.prepare('INSERT INTO events (workspace, actor, revision, payload) VALUES (?, ?, ?, ?)').run(workspaceId, actor, workspace.revision, JSON.stringify({ type: 'changeset_reopened', changeSetId }));
      const result = { workspaceId, changeSet: this.latestChangeSet(workspaceId), revision: workspace.revision, sourceDigest: workspace.sourceDigest, eventSequence: Number(event.lastInsertRowid) };
      this.db.prepare('INSERT INTO receipts VALUES (?, ?, ?, ?, ?)').run(workspaceId, actor, operationId, requestHash, JSON.stringify(result));
      this.db.exec('COMMIT'); return result;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  get(id) {
    const row = this.db.prepare('SELECT * FROM workspaces WHERE id = ?').get(id);
    if (!row) throw new Error('Workspace not found');
    const sources = this.db.prepare('SELECT path, content, baseline_content FROM workspace_sources WHERE workspace = ? ORDER BY path').all(id);
    const overlays = Object.fromEntries(sources.filter(source => source.content !== source.baseline_content).map(source => [source.path, source.content]));
    return { id: row.id, title: row.title, baselineCommit: row.baseline_commit, revision: row.revision, sourceDigest: row.digest, digestVersion: row.digest_version, changeSet: this.latestChangeSet(id), sourceManifest: row.source_manifest ? candidateManifest(JSON.parse(row.source_manifest), row.schema, overlays) : null, editableSources: sources.map(source => source.path), sourceOverlays: overlays, schema: row.schema };
  }
  snapshot(id) {
    // Synchronous reads share the event loop with mutations, so identity and cursor
    // describe the same committed state for this single-process store.
    const workspace = this.get(id);
    const row = this.db.prepare('SELECT COALESCE(MAX(sequence), 0) AS cursor FROM events WHERE workspace = ?').get(id);
    return { ...workspace, eventSequence: row.cursor };
  }
  diff(id) {
    const row = this.db.prepare('SELECT * FROM workspaces WHERE id = ?').get(id);
    if (!row) throw new Error('Workspace not found');
    const before = parse(row.baseline_schema).classes, after = parse(row.schema).classes;
    const changes = [];
    for (const [name, entity] of after) {
      const previous = before.get(name);
      if (!previous) changes.push({ kind: 'added', name, after: entity, fieldChanges: fieldChanges(null, entity) });
      else if (JSON.stringify(previous) !== JSON.stringify(entity)) changes.push({ kind: 'changed', name, before: previous, after: entity, fieldChanges: fieldChanges(previous, entity) });
    }
    for (const [name, entity] of before) if (!after.has(name)) changes.push({ kind: 'removed', name, before: entity, fieldChanges: fieldChanges(entity, null) });
    const additionalSources = this.db.prepare('SELECT path, baseline_content, content FROM workspace_sources WHERE workspace = ? AND content <> baseline_content ORDER BY path').all(id).map(source => ({ path: source.path, patch: createPatch(source.path, source.baseline_content, source.content, 'baseline', 'draft', { context: 3 }) }));
    return { workspaceId: id, baselineCommit: row.baseline_commit, revision: row.revision, sourceDigest: row.digest, digestVersion: row.digest_version, changes, source: { path: 'model/domain.schema', before: row.baseline_schema, after: row.schema, patch: createPatch('model/domain.schema', row.baseline_schema, row.schema, 'baseline', 'draft', { context: 3 }) }, additionalSources };
  }
  historyDetail(id, revision) {
    if (!Number.isSafeInteger(revision) || revision < 1) throw new Error('Invalid historical revision');
    const workspace = this.get(id);
    const group = this.db.prepare('SELECT * FROM command_groups WHERE workspace = ? AND revision = ?').get(id, revision);
    if (!group) throw new Error('Historical command group not found');
    if (group.after_schema === null) return { workspaceId: id, revision, available: false, reason: 'This older command group did not record an after snapshot.' };
    const beforeOverlays = JSON.parse(group.before_overlays || '{}');
    const afterOverlays = JSON.parse(group.after_overlays || '{}');
    const stored = this.db.prepare('SELECT baseline_schema, source_manifest FROM workspaces WHERE id = ?').get(id);
    const manifest = stored.source_manifest ? JSON.parse(stored.source_manifest) : null;
    if (sourceDigest(group.after_schema, workspace.baselineCommit, workspace.digestVersion, manifest, afterOverlays) !== group.after_digest) throw new Error('Historical snapshot digest mismatch');
    const baseline = stored.baseline_schema;
    const sources = this.db.prepare('SELECT path, baseline_content FROM workspace_sources WHERE workspace = ? ORDER BY path').all(id);
    const additionalSources = sources.flatMap(({ path, baseline_content: original }) => {
      const before = beforeOverlays[path] ?? original, after = afterOverlays[path] ?? original;
      return before === after ? [] : [{ path, patch: createPatch(path, before, after, 'before', 'after', { context: 3 }) }];
    });
    const event = this.db.prepare('SELECT sequence, actor, created_at AS createdAt, payload FROM events WHERE workspace = ? AND revision = ? ORDER BY sequence LIMIT 1').get(id, revision);
    const payload = event ? JSON.parse(event.payload) : {};
    return { workspaceId: id, revision, baselineCommit: workspace.baselineCommit, sourceDigest: group.after_digest, available: true,
      actor: event?.actor ?? null, createdAt: event?.createdAt ?? null, eventSequence: event?.sequence ?? null, commandGroupId: payload.commandGroupId ?? null, operationId: payload.operationId ?? null, rationale: payload.rationale ?? null, commands: payload.commands ?? [],
      patch: createPatch('model/domain.schema', group.before_schema, group.after_schema, 'before', 'after', { context: 3 }),
      baselinePatch: createPatch('model/domain.schema', baseline, group.after_schema, 'baseline', 'historical revision', { context: 3 }), additionalSources };
  }
  explore(id, { expectedRevision, cursor, limit = 50, module } = {}) {
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0 || !Number.isInteger(limit) || limit < 1 || limit > 100 || (cursor !== undefined && !/^[A-Za-z][A-Za-z0-9]{0,127}$/.test(cursor)) || (module !== undefined && (typeof module !== 'string' || module.length > 128))) throw new Error('Invalid explorer request');
    const workspace = this.get(id);
    if (workspace.revision !== expectedRevision) throw new Error('Revision conflict');
    const model = parse(workspace.schema);
    const allClasses = [...model.classes.values()];
    const moduleCounts = new Map([...model.modules].map(name => [name, 0]));
    for (const item of allClasses) moduleCounts.set(item.module, (moduleCounts.get(item.module) ?? 0) + 1);
    const modules = [...moduleCounts].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([name, count]) => ({ name, count }));
    const classes = allClasses.filter(item => module === undefined || item.module === module)
      .sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    const remaining = classes.filter(item => cursor === undefined || item.name > cursor);
    const results = remaining.slice(0, limit);
    return { workspaceId: id, revision: workspace.revision, sourceDigest: workspace.sourceDigest, module: module ?? null, modules, results, total: classes.length, nextCursor: remaining.length > limit ? results.at(-1).name : null };
  }
  search(id, query, limit = 25, expectedRevision) {
    if (typeof query !== 'string' || query.length > 200 || !Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('Invalid search');
    const workspace = this.get(id), needle = query.toLowerCase();
    if (expectedRevision !== undefined && workspace.revision !== expectedRevision) throw new Error('Revision conflict');
    return { revision: workspace.revision, sourceDigest: workspace.sourceDigest, results: [...parse(workspace.schema).classes.values()].filter(item => `${item.name} ${item.definition}`.toLowerCase().includes(needle)).slice(0, limit) };
  }
  entity(id, name, expectedRevision) {
    const workspace = this.get(id);
    if (expectedRevision !== undefined && workspace.revision !== expectedRevision) throw new Error('Revision conflict');
    verifyAdapter(workspace);
    const result = adapterCall({ action: 'inspect', schema: workspace.schema, name });
    return { workspaceId: id, revision: workspace.revision, sourceDigest: workspace.sourceDigest, entity: result.entity };
  }
  constraintTemplates(id) {
    const workspace = this.get(id);
    verifyAdapter(workspace);
    const templates = adapterCall({ action: 'templates' }).templates;
    if (intervalSourcePaths.every(path => workspace.editableSources.includes(path))) templates.push({ id: 'valid-interval', description: 'For a new class and new dateTime fields, the end must be later than the start when both are present.', sourceOwner: intervalSourcePaths, compiler: 'tools/build_rules.py', testFactory: 'template-derived-positive-equal-and-reversed; independent review required' });
    return { workspaceId: id, revision: workspace.revision, sourceDigest: workspace.sourceDigest, templates };
  }
  requirementsSearch(id, query, limit = 20, expectedRevision) {
    const workspace = this.get(id);
    if (workspace.digestVersion !== 4 || typeof query !== 'string' || query.length > 200 || !Number.isInteger(limit) || limit < 1 || limit > 50) throw new Error('Requirements search needs a version-four workspace and bounded query');
    if (expectedRevision !== undefined && expectedRevision !== workspace.revision) throw new Error('Revision conflict');
    const row = this.db.prepare('SELECT content FROM workspace_sources WHERE workspace = ? AND path = ?').get(id, requirementsPath);
    if (!row) throw new Error('Requirements source is unavailable');
    const needle = query.toLowerCase(), entries = JSON.parse(row.content);
    if (!Array.isArray(entries)) throw new Error('Invalid requirements source');
    return { workspaceId: id, revision: workspace.revision, sourceDigest: workspace.sourceDigest, results: entries.filter(item => `${item.id} ${item.statement}`.toLowerCase().includes(needle)).slice(0, limit).map(item => ({ id: item.id, statement: item.statement, classes: item.classes, rules: item.rules, source: requirementsPath })) };
  }
  incoming(id, root, expectedRevision, offset = 0, limit = 50) {
    if (!identifier.test(root ?? '') || !Number.isSafeInteger(expectedRevision) || expectedRevision < 0 || !Number.isSafeInteger(offset) || offset < 0 || offset > 100000 || !Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('Invalid incoming reference request');
    const workspace = this.get(id);
    if (workspace.revision !== expectedRevision) throw new Error('Revision conflict');
    const classes = parse(workspace.schema).classes;
    if (!classes.has(root)) throw new Error('Class not found');
    const lines = new Map(workspace.schema.split(/\r?\n/).map((line, index) => [line.split('|', 1)[0], index + 1]));
    const references = [];
    for (const item of classes.values()) {
      const parent = item.parent === '-' ? 'Record' : item.parent;
      if (parent === root) references.push({ source: item.name, target: root, predicate: 'subClassOf', cardinality: null, sourceRef: { path: 'model/domain.schema', line: lines.get(item.name) } });
      for (const token of item.fields.split(/\s+/).filter(Boolean)) {
        const match = /^([A-Za-z][A-Za-z0-9]*):([A-Za-z][A-Za-z0-9]*)([!?+*])$/.exec(token);
        if (match && match[2] === root) references.push({ source: item.name, target: root, predicate: match[1], cardinality: match[3], sourceRef: { path: 'model/domain.schema', line: lines.get(item.name) } });
      }
    }
    references.sort((a, b) => a.source < b.source ? -1 : a.source > b.source ? 1 : a.predicate < b.predicate ? -1 : a.predicate > b.predicate ? 1 : 0);
    const results = references.slice(offset, offset + limit);
    const nodes = [...new Set(results.map(item => item.source))].map(name => ({ ...classes.get(name), sourceRef: { path: 'model/domain.schema', line: lines.get(name) } }));
    return { workspaceId: id, revision: workspace.revision, sourceDigest: workspace.sourceDigest, root, results, nodes, total: references.length, nextOffset: offset + results.length < references.length ? offset + results.length : null };
  }
  view(id, root, expectedRevision, limit = 50) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new Error('Invalid view limit');
    const workspace = this.get(id);
    if (expectedRevision !== undefined && workspace.revision !== expectedRevision) throw new Error('Revision conflict');
    const classes = parse(workspace.schema).classes;
    const entity = classes.get(root);
    if (!entity) throw new Error('Class not found');
    const baseline = parse(this.db.prepare('SELECT baseline_schema FROM workspaces WHERE id = ?').get(id).baseline_schema).classes;
    const prefix = 'https://example.org/charge-domain#';
    const lines = new Map(workspace.schema.split(/\r?\n/).map((line, index) => [line.split('|', 1)[0], index + 1]));
    const relationKeys = (item, classSet) => {
      if (!item) return [];
      const result = [];
      const parent = item.parent === '-' ? 'Record' : item.parent;
      if (classSet.has(parent)) result.push(['subClassOf', parent, null]);
      for (const token of item.fields.split(/\s+/).filter(Boolean)) {
        const match = /^([A-Za-z][A-Za-z0-9]*):([A-Za-z][A-Za-z0-9]*)([!?+*])$/.exec(token);
        if (match && classSet.has(match[2])) result.push([match[1], match[2], match[3]]);
      }
      return result;
    };
    const previousRelations = new Set(relationKeys(baseline.get(root), baseline).map(parts => JSON.stringify(parts)));
    const edges = relationKeys(entity, classes).map(([predicate, target, cardinality]) => ({
      id: JSON.stringify([prefix + root, predicate === 'subClassOf' ? 'http://www.w3.org/2000/01/rdf-schema#subClassOf' : prefix + predicate, prefix + target]),
      source: root, target, predicate, cardinality,
      predicateIri: predicate === 'subClassOf' ? 'http://www.w3.org/2000/01/rdf-schema#subClassOf' : prefix + predicate,
      sourcePath: 'model/domain.schema', sourceRef: { path: 'model/domain.schema', line: lines.get(root) },
      mappingVersion: 'chargeweave-authoring-v1', changeStatus: previousRelations.has(JSON.stringify([predicate, target, cardinality])) ? 'unchanged' : 'added',
    }));
    const visible = edges.slice(0, limit);
    const names = [...new Set([root, ...visible.map(edge => edge.target)])];
    const nodes = names.map(name => {
      const item = classes.get(name), before = baseline.get(name);
      return { ...item, id: prefix + name, iri: prefix + name, kind: 'class', label: name,
        sourceRef: { path: 'model/domain.schema', line: lines.get(name) },
        changeStatus: !before ? 'added' : JSON.stringify(before) === JSON.stringify(item) ? 'unchanged' : 'changed' };
    });
    return { workspaceId: id, revision: workspace.revision, sourceDigest: workspace.sourceDigest, viewpoint: 'information', mappingVersion: 'chargeweave-authoring-v1', root, nodes, edges: visible, omitted: edges.length - visible.length };
  }
  savedView(workspaceId, viewId) {
    this.get(workspaceId);
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(viewId ?? '')) throw new Error('Invalid view ID');
    const row = this.db.prepare('SELECT revision, definition FROM saved_views WHERE workspace = ? AND view_id = ?').get(workspaceId, viewId);
    return { workspaceId, viewId, viewRevision: row?.revision ?? 0, definition: row ? JSON.parse(row.definition) : null };
  }
  savedViews(workspaceId) {
    this.get(workspaceId);
    const views = this.db.prepare('SELECT view_id AS viewId, revision AS viewRevision FROM saved_views WHERE workspace = ? ORDER BY view_id LIMIT 101').all(workspaceId);
    return { workspaceId, views: views.slice(0, 100).map(view => ({ ...view })), truncated: views.length > 100 };
  }
  saveView({ workspaceId, viewId, actor, operationId, expectedViewRevision, definition }) {
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(viewId ?? '') || typeof actor !== 'string' || !actor || typeof operationId !== 'string' || !operationId || operationId.length > 128 || !Number.isSafeInteger(expectedViewRevision) || expectedViewRevision < 0) throw new Error('Invalid saved view request');
    if (!definition || Object.keys(definition).some(key => !['root', 'positions', 'mappingVersion', 'viewpoint', 'filter', 'groups', 'annotations'].includes(key)) || !identifier.test(definition.root ?? '') || !definition.positions || typeof definition.positions !== 'object' || Array.isArray(definition.positions)) throw new Error('Invalid saved view definition');
    const entries = Object.entries(definition.positions);
    if (entries.length > 500 || entries.some(([name, point]) => !identifier.test(name) || !point || typeof point !== 'object' || Object.keys(point).sort().join(',') !== 'x,y' || !Number.isFinite(point.x) || !Number.isFinite(point.y) || Math.abs(point.x) > 100000 || Math.abs(point.y) > 100000)) throw new Error('Invalid saved view positions');
    const groups = definition.groups ?? [], annotations = definition.annotations ?? [];
    if ((definition.mappingVersion !== undefined && definition.mappingVersion !== 'chargeweave-authoring-v1') || (definition.viewpoint !== undefined && !['information', 'responsibility', 'temporal'].includes(definition.viewpoint)) || (definition.filter !== undefined && (typeof definition.filter !== 'string' || definition.filter.length > 200)) || !Array.isArray(groups) || groups.length > 50 || groups.some(group => !group || Object.keys(group).sort().join(',') !== 'members,name' || typeof group.name !== 'string' || !group.name.trim() || group.name.length > 100 || !Array.isArray(group.members) || group.members.length > 100 || group.members.some(name => !identifier.test(name))) || !Array.isArray(annotations) || annotations.length > 100 || annotations.some(note => !note || Object.keys(note).sort().join(',') !== 'target,text' || !identifier.test(note.target ?? '') || typeof note.text !== 'string' || !note.text.trim() || note.text.length > 1000)) throw new Error('Invalid saved view metadata');
    const normalized = { root: definition.root, positions: Object.fromEntries(entries.sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)), ...Object.fromEntries(['mappingVersion', 'viewpoint', 'filter', 'groups', 'annotations'].filter(key => Object.hasOwn(definition, key)).map(key => [key, definition[key]])) };
    const requestHash = hash(JSON.stringify({ viewId, expectedViewRevision, definition: normalized }));
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const receipt = this.db.prepare('SELECT request_hash, result FROM view_receipts WHERE workspace = ? AND actor = ? AND operation = ?').get(workspaceId, actor, operationId);
      if (receipt) { if (receipt.request_hash !== requestHash) throw new Error('Operation ID reused with different request'); this.db.exec('COMMIT'); return JSON.parse(receipt.result); }
      const workspace = this.get(workspaceId), classes = parse(workspace.schema).classes;
      if (!classes.has(normalized.root) || entries.some(([name]) => !classes.has(name)) || groups.some(group => group.members.some(name => !classes.has(name))) || annotations.some(note => !classes.has(note.target))) throw new Error('Saved view references an unknown concept');
      const current = this.savedView(workspaceId, viewId);
      if (current.viewRevision !== expectedViewRevision) throw new Error('Saved view revision conflict');
      const viewRevision = current.viewRevision + 1;
      this.db.prepare('INSERT INTO saved_views (workspace, view_id, revision, definition) VALUES (?, ?, ?, ?) ON CONFLICT(workspace, view_id) DO UPDATE SET revision = excluded.revision, definition = excluded.definition').run(workspaceId, viewId, viewRevision, JSON.stringify(normalized));
      const event = this.db.prepare('INSERT INTO events (workspace, actor, revision, payload) VALUES (?, ?, ?, ?)').run(workspaceId, actor, workspace.revision, JSON.stringify({ type: 'view_saved', viewId, viewRevision }));
      const result = { workspaceId, viewId, viewRevision, definition: normalized, semanticRevision: workspace.revision, eventSequence: Number(event.lastInsertRowid) };
      this.db.prepare('INSERT INTO view_receipts VALUES (?, ?, ?, ?, ?)').run(workspaceId, actor, operationId, requestHash, JSON.stringify(result));
      this.db.exec('COMMIT'); return result;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  temporalView(id, root, expectedRevision, repository) {
    const workspace = this.get(id);
    if (expectedRevision !== undefined && workspace.revision !== expectedRevision) throw new Error('Revision conflict');
    if (workspace.digestVersion < 3 || !repository) throw new Error('Temporal policy requires a pinned source manifest and repository');
    const expected = workspace.sourceManifest.find(item => item.path === 'model/temporal-policy.json')?.sha256;
    if (!expected) throw new Error('Temporal policy is not in the pinned source manifest');
    const draftPolicy = Object.hasOwn(workspace.sourceOverlays, temporalPolicyPath);
    const bytes = draftPolicy ? Buffer.from(workspace.sourceOverlays[temporalPolicyPath], 'utf8') : execFileSync('git', ['show', `${workspace.baselineCommit}:model/temporal-policy.json`], { cwd: repository, timeout: 15000, maxBuffer: 4 * 1024 * 1024 });
    if (hash(bytes) !== expected) throw new Error('Pinned temporal policy does not match the source manifest');
    const policy = JSON.parse(bytes.toString('utf8'));
    const entity = this.entity(id, root, expectedRevision).entity;
    const fields = entity.fields.filter(field => ['dateTime', 'date', 'time', 'TimeWindow', 'RecurringWindow'].includes(field.range));
    return { workspaceId: id, revision: workspace.revision, sourceDigest: workspace.sourceDigest, baselineCommit: workspace.baselineCommit,
      viewpoint: 'temporal', root, iri: entity.iri, fields,
      policy: policy.classPolicies?.[root] ?? null,
      policySource: { path: temporalPolicyPath, baselineCommit: workspace.baselineCommit, sha256: expected, scope: draftPolicy ? 'draft' : 'baseline' },
      timeConvention: { interval: policy.intervalConvention ?? null, precision: policy.timePrecision ?? null, recordedTimeOwner: policy.recordedTimeOwner ?? null },
    };
  }
  responsibilityView(id, root, expectedRevision) {
    const inspected = this.entity(id, root, expectedRevision);
    const entity = inspected.entity;
    const prefix = 'https://example.org/charge-domain#';
    const source = this.db.prepare('SELECT content, baseline_content FROM workspace_sources WHERE workspace = ? AND path = ?').get(id, responsibilityMappingPath);
    const mappings = source ? validateResponsibilityMapping(JSON.parse(source.content)).bindings : responsibilityMappings;
    const bindings = entity.fields.flatMap(field => {
      const mapping = mappings.find(item => item.owner === field.owner && item.property === field.property && item.range === field.range);
      if (!mapping) return [];
      return [{ ...mapping, predicateIri: prefix + field.property, targetIri: prefix + field.range,
        cardinality: field.cardinality, inherited: field.inherited, source: field.source,
        mappingVersion: responsibilityMappingVersion, mappingSource: source ? { path: responsibilityMappingPath, scope: source.content === source.baseline_content ? 'baseline' : 'draft' } : { path: responsibilityMappingPath, scope: 'service-fallback' } }];
    });
    return { workspaceId: id, revision: inspected.revision, sourceDigest: inspected.sourceDigest, root, iri: entity.iri,
      viewpoint: 'responsibility', mappingVersion: responsibilityMappingVersion, bindings,
      coverage: 'partial', note: 'Only explicitly curated mappings are shown; absence does not prove that no other responsibility relationship exists.' };
  }
  applyReviewerCase({ workspaceId, actor, operationId, expectedRevision, changeSetId, command }) {
    return this.apply({ workspaceId, actor, operationId, expectedRevision, changeSetId, commands: [command], reviewerCase: true });
  }
  apply({ workspaceId, actor, operationId, expectedRevision, changeSetId, commands, rationale, reviewerCase = false }) {
    if (typeof actor !== 'string' || !actor || typeof operationId !== 'string' || !operationId || !Number.isSafeInteger(expectedRevision)) throw new Error('Invalid mutation identity');
    if (rationale !== undefined && (typeof rationale !== 'string' || !rationale.trim() || rationale.length > 2000)) throw new Error('Invalid command rationale');
    const requestHash = hash(JSON.stringify({ expectedRevision, commands, ...(changeSetId === undefined ? {} : { changeSetId }), ...(rationale === undefined ? {} : { rationale }) }));
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const receipt = this.db.prepare('SELECT * FROM receipts WHERE workspace = ? AND actor = ? AND operation = ?').get(workspaceId, actor, operationId);
      if (receipt) {
        if (receipt.request_hash !== requestHash) throw new Error('Operation ID reused with different request');
        this.db.exec('COMMIT'); return JSON.parse(receipt.result);
      }
      const current = this.get(workspaceId);
      if (current.revision !== expectedRevision) throw new Error('Stale revision');
      if (current.changeSet && (current.changeSet.id !== changeSetId || current.changeSet.status !== 'draft')) throw new Error('Change set is not editable');
      if (!current.changeSet && changeSetId !== undefined) throw new Error('Change set not found');
      if (this.db.prepare("SELECT 1 FROM publications WHERE workspace = ? AND state IN ('push_pending', 'pr_pending') LIMIT 1").get(workspaceId)) throw new Error('Publication push is in progress');
      verifyAdapter(current);
      if (!Array.isArray(commands) || !commands.length || commands.length > 100) throw new Error('Invalid command group');
      const baselineManifest = JSON.parse(this.db.prepare('SELECT source_manifest FROM workspaces WHERE id = ?').get(workspaceId).source_manifest || 'null');
      let schema = current.schema, pending = [];
      const overlays = { ...current.sourceOverlays };
      const flush = () => { if (pending.length) { schema = apply(schema, pending); pending = []; } };
      for (const command of commands) {
        if (command?.type === 'reviewer.interval_case_add') {
          if (!reviewerCase || commands.length !== 1 || current.digestVersion !== 4) throw new Error('Reviewer interval case is not authorized');
          flush();
          const contents = Object.fromEntries(this.db.prepare('SELECT path, content FROM workspace_sources WHERE workspace = ?').all(workspaceId).map(source => [source.path, source.content]));
          const updated = buildReviewerIntervalCase(command, contents);
          for (const [path, content] of Object.entries(updated)) {
            if (!editableSourcePaths.has(path) || Buffer.byteLength(content) > 2_000_000 || this.db.prepare('UPDATE workspace_sources SET content = ? WHERE workspace = ? AND path = ?').run(content, workspaceId, path).changes !== 1) throw new Error('Invalid reviewer case source update');
            overlays[path] = content;
          }
          continue;
        }
        const interval = command?.type === 'constraint.add' && command.template === 'valid-interval';
        if (!interval && !['requirement.link', 'temporal.policy_set', 'viewpoint.binding_add'].includes(command?.type)) { pending.push(command); continue; }
        flush();
        if (interval) {
          if (current.digestVersion !== 4) throw new Error('Valid-interval templates require a multi-source workspace');
          const baseline = this.db.prepare('SELECT baseline_schema FROM workspaces WHERE id = ?').get(workspaceId).baseline_schema;
          const baselineClasses = parse(baseline).classes;
          if (baselineClasses.has(command.owner) || [...baselineClasses.values()].some(item => fieldContracts(item).has(command.startProperty) || fieldContracts(item).has(command.endProperty))) throw new Error('Valid-interval templates require a new class and new fields; review existing rules for reuse');
          const contents = Object.fromEntries(this.db.prepare('SELECT path, content FROM workspace_sources WHERE workspace = ?').all(workspaceId).map(source => [source.path, source.content]));
          const updated = buildIntervalSources(parse(schema).classes.get(command.owner), command, contents);
          for (const [path, content] of Object.entries(updated)) {
            if (!editableSourcePaths.has(path) || Buffer.byteLength(content) > 2_000_000 || this.db.prepare('UPDATE workspace_sources SET content = ? WHERE workspace = ? AND path = ?').run(content, workspaceId, path).changes !== 1) throw new Error('Invalid template source update');
            overlays[path] = content;
          }
          continue;
        }
        if (command.type === 'viewpoint.binding_add') {
          if (current.digestVersion !== 4 || Object.keys(command).sort().join(',') !== 'category,label,owner,property,range,type') throw new Error('Invalid responsibility binding command');
          const classes = parse(schema).classes, owner = classes.get(command.owner), field = fieldContracts(owner).get(command.property);
          if (!owner || !classes.has(command.range) || !field || field.range !== command.range) throw new Error('Binding must reference an existing declared object relationship');
          const source = this.db.prepare('SELECT content FROM workspace_sources WHERE workspace = ? AND path = ?').get(workspaceId, responsibilityMappingPath);
          if (!source) throw new Error('Responsibility mapping source is unavailable in this workspace');
          const mapping = validateResponsibilityMapping(JSON.parse(source.content));
          if (canonicalJson(mapping) !== source.content.replace(/\r\n/g, '\n')) throw new Error('Responsibility mapping source format is not supported for editing');
          mapping.bindings.push({ owner: command.owner, property: command.property, range: command.range, label: command.label, category: command.category });
          validateResponsibilityMapping(mapping);
          const content = canonicalJson(mapping);
          if (Buffer.byteLength(content) > 2_000_000) throw new Error('Responsibility mapping source exceeds limit');
          this.db.prepare('UPDATE workspace_sources SET content = ? WHERE workspace = ? AND path = ?').run(content, workspaceId, responsibilityMappingPath);
          overlays[responsibilityMappingPath] = content;
          continue;
        }
        if (command.type === 'temporal.policy_set') {
          if (current.digestVersion !== 4 || Object.keys(command).sort().join(',') !== 'className,expectedPolicy,policy,type' || !identifier.test(command.className ?? '') || !parse(schema).classes.has(command.className) || !(command.expectedPolicy === null || temporalPolicies.has(command.expectedPolicy)) || !temporalPolicies.has(command.policy)) throw new Error('Invalid temporal policy command');
          const source = this.db.prepare('SELECT content FROM workspace_sources WHERE workspace = ? AND path = ?').get(workspaceId, temporalPolicyPath);
          if (!source) throw new Error('Temporal policy source is unavailable in this workspace');
          const policy = JSON.parse(source.content);
          if (!policy || typeof policy !== 'object' || Array.isArray(policy) || !policy.classPolicies || typeof policy.classPolicies !== 'object' || Array.isArray(policy.classPolicies) || canonicalJson(policy) !== source.content.replace(/\r\n/g, '\n')) throw new Error('Temporal policy source format is not supported for editing');
          const previous = Object.hasOwn(policy.classPolicies, command.className) ? policy.classPolicies[command.className] : null;
          if (previous !== command.expectedPolicy) throw new Error('Temporal policy precondition does not match');
          if (previous === command.policy) throw new Error('Temporal policy is unchanged');
          policy.classPolicies[command.className] = command.policy;
          const content = canonicalJson(policy);
          if (Buffer.byteLength(content) > 2_000_000) throw new Error('Temporal policy source exceeds limit');
          this.db.prepare('UPDATE workspace_sources SET content = ? WHERE workspace = ? AND path = ?').run(content, workspaceId, temporalPolicyPath);
          overlays[temporalPolicyPath] = content;
          continue;
        }
        if (current.digestVersion !== 4 || Object.keys(command).sort().join(',') !== 'className,expectedClasses,requirementId,type' || !/^BR-[0-9]+$/.test(command.requirementId ?? '') || !identifier.test(command.className ?? '') || !Array.isArray(command.expectedClasses) || command.expectedClasses.length > 200 || command.expectedClasses.some(name => typeof name !== 'string' || !identifier.test(name)) || !parse(schema).classes.has(command.className)) throw new Error('Invalid requirement link');
        const source = this.db.prepare('SELECT content FROM workspace_sources WHERE workspace = ? AND path = ?').get(workspaceId, requirementsPath);
        if (!source) throw new Error('Requirements source is unavailable');
        const requirements = JSON.parse(source.content);
        if (!Array.isArray(requirements) || canonicalJson(requirements) !== source.content.replace(/\r\n/g, '\n')) throw new Error('Requirements source format is not supported for editing');
        const matches = requirements.filter(item => item.id === command.requirementId);
        if (matches.length !== 1 || !Array.isArray(matches[0].classes) || JSON.stringify(matches[0].classes) !== JSON.stringify(command.expectedClasses)) throw new Error('Requirement precondition does not match');
        if (matches[0].classes.includes(command.className)) throw new Error('Requirement already links this class');
        matches[0].classes.push(command.className);
        const content = canonicalJson(requirements);
        if (Buffer.byteLength(content) > 2_000_000) throw new Error('Requirements source exceeds limit');
        this.db.prepare('UPDATE workspace_sources SET content = ? WHERE workspace = ? AND path = ?').run(content, workspaceId, requirementsPath);
        overlays[requirementsPath] = content;
      }
      flush();
      const revision = current.revision + 1, digest = sourceDigest(schema, current.baselineCommit, current.digestVersion, baselineManifest, overlays);
      this.db.prepare('UPDATE workspaces SET schema = ?, revision = ?, digest = ? WHERE id = ?').run(schema, revision, digest, workspaceId);
      this.db.prepare('INSERT INTO command_groups (workspace, revision, before_schema, after_digest, before_overlays, after_schema, after_overlays) VALUES (?, ?, ?, ?, ?, ?, ?)').run(workspaceId, revision, current.schema, digest, current.digestVersion === 4 ? JSON.stringify(current.sourceOverlays) : null, schema, current.digestVersion === 4 ? JSON.stringify(overlays) : null);
      const commandGroupId = randomUUID();
      const event = this.db.prepare('INSERT INTO events (workspace, actor, revision, payload) VALUES (?, ?, ?, ?)').run(workspaceId, actor, revision, JSON.stringify({ commands, commandGroupId, operationId, ...(changeSetId === undefined ? {} : { changeSetId }), ...(rationale === undefined ? {} : { rationale }), sourceDigest: digest }));
      const result = { workspaceId, baselineCommit: current.baselineCommit, revision, sourceDigest: digest, commandGroupId, ...(changeSetId === undefined ? {} : { changeSetId }), eventSequence: Number(event.lastInsertRowid) };
      this.db.prepare('INSERT INTO receipts VALUES (?, ?, ?, ?, ?)').run(workspaceId, actor, operationId, requestHash, JSON.stringify(result));
      this.db.exec('COMMIT'); return result;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  undo({ workspaceId, actor, operationId, expectedRevision, targetRevision, changeSetId }) {
    if (!actor || !operationId || !Number.isSafeInteger(expectedRevision) || !Number.isSafeInteger(targetRevision)) throw new Error('Invalid undo identity');
    const requestHash = hash(JSON.stringify({ type: 'undo', expectedRevision, targetRevision, ...(changeSetId === undefined ? {} : { changeSetId }) }));
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const receipt = this.db.prepare('SELECT * FROM receipts WHERE workspace = ? AND actor = ? AND operation = ?').get(workspaceId, actor, operationId);
      if (receipt) {
        if (receipt.request_hash !== requestHash) throw new Error('Operation ID reused with different request');
        this.db.exec('COMMIT'); return JSON.parse(receipt.result);
      }
      const current = this.get(workspaceId);
      if (current.revision !== expectedRevision || targetRevision !== current.revision) throw new Error('Undo requires the latest revision');
      if (current.changeSet && (current.changeSet.id !== changeSetId || current.changeSet.status !== 'draft')) throw new Error('Change set is not editable');
      if (!current.changeSet && changeSetId !== undefined) throw new Error('Change set not found');
      if (this.db.prepare("SELECT 1 FROM publications WHERE workspace = ? AND state IN ('push_pending', 'pr_pending') LIMIT 1").get(workspaceId)) throw new Error('Publication push is in progress');
      const group = this.db.prepare('SELECT * FROM command_groups WHERE workspace = ? AND revision = ?').get(workspaceId, targetRevision);
      if (!group || group.after_digest !== current.sourceDigest) throw new Error('Command group cannot be undone');
      const overlays = current.digestVersion === 4 ? JSON.parse(group.before_overlays || '{}') : {};
      if (current.digestVersion === 4) {
        this.db.prepare('UPDATE workspace_sources SET content = baseline_content WHERE workspace = ?').run(workspaceId);
        for (const [path, content] of Object.entries(overlays)) {
          if (!editableSourcePaths.has(path) || this.db.prepare('UPDATE workspace_sources SET content = ? WHERE workspace = ? AND path = ?').run(content, workspaceId, path).changes !== 1) throw new Error('Invalid saved source overlay');
        }
      }
      const baselineManifest = JSON.parse(this.db.prepare('SELECT source_manifest FROM workspaces WHERE id = ?').get(workspaceId).source_manifest || 'null');
      const revision = current.revision + 1, digest = sourceDigest(group.before_schema, current.baselineCommit, current.digestVersion, baselineManifest, overlays);
      this.db.prepare('UPDATE workspaces SET schema = ?, revision = ?, digest = ? WHERE id = ?').run(group.before_schema, revision, digest, workspaceId);
      const event = this.db.prepare('INSERT INTO events (workspace, actor, revision, payload) VALUES (?, ?, ?, ?)').run(workspaceId, actor, revision, JSON.stringify({ type: 'undo', targetRevision, sourceDigest: digest }));
      const result = { workspaceId, revision, sourceDigest: digest, eventSequence: Number(event.lastInsertRowid) };
      this.db.prepare('INSERT INTO receipts VALUES (?, ?, ?, ?, ?)').run(workspaceId, actor, operationId, requestHash, JSON.stringify(result));
      this.db.exec('COMMIT'); return result;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  events(id, after = 0) {
    this.get(id);
    if (!Number.isSafeInteger(after) || after < 0) throw new Error('Invalid cursor');
    return this.db.prepare('SELECT e.sequence, e.actor, e.revision, e.created_at AS createdAt, e.payload, COALESCE((SELECT MAX(p.sequence) FROM events p WHERE p.workspace = e.workspace AND p.sequence < e.sequence), 0) AS previousSequence FROM events e WHERE e.workspace = ? AND e.sequence > ? ORDER BY e.sequence LIMIT 100').all(id, after).map(row => ({ ...row, payload: JSON.parse(row.payload) }));
  }
  hasCursor(id, sequence) {
    this.get(id);
    return sequence === 0 || Boolean(this.db.prepare('SELECT 1 FROM events WHERE workspace = ? AND sequence = ?').get(id, sequence));
  }
  recentEvents(id) {
    this.get(id);
    return this.db.prepare('SELECT sequence, actor, revision, created_at AS createdAt, payload FROM events WHERE workspace = ? ORDER BY sequence DESC LIMIT 100').all(id).reverse().map(row => ({ ...row, payload: JSON.parse(row.payload) }));
  }
}
