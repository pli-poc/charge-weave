import { DatabaseSync } from 'node:sqlite';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const hash = value => createHash('sha256').update(value).digest('hex');
const candidateManifest = (manifest, schema) => manifest?.map(entry => entry.path === 'model/domain.schema' ? { ...entry, sha256: hash(schema) } : entry);
const sourceDigest = (schema, baselineCommit, version, manifest) => hash(JSON.stringify(version === 1
  ? { adapter: 'domain-schema-v1', sources: { 'model/domain.schema': hash(schema) } }
  : version === 2 ? { adapter: 'domain-schema-v2', baselineCommit, overlay: { 'model/domain.schema': hash(schema) } }
    : { adapter: 'domain-schema-v3', baselineCommit, sources: candidateManifest(manifest, schema) }));
const identifier = /^[A-Za-z][A-Za-z0-9]*$/;

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

function apply(schema, commands) {
  const adapter = fileURLToPath(new URL('../../tools/authoring_adapter.py', import.meta.url));
  const output = execFileSync(process.env.CHARGEWEAVE_PYTHON || 'python', [adapter], {
    input: JSON.stringify({ schema, commands }), encoding: 'utf8', timeout: 15000, maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, PYTHONUTF8: '1' },
  });
  const result = JSON.parse(output);
  if (result.error) throw new Error(result.error);
  if (typeof result.schema !== 'string' || Buffer.byteLength(result.schema) > 2_000_000) throw new Error('Invalid adapter result');
  return result.schema;
}

export class WorkspaceStore {
  constructor(path) {
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
      CREATE TABLE IF NOT EXISTS workspaces (id TEXT PRIMARY KEY, title TEXT NOT NULL, baseline_commit TEXT NOT NULL, baseline_schema TEXT NOT NULL, schema TEXT NOT NULL, revision INTEGER NOT NULL, digest TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS receipts (workspace TEXT NOT NULL, actor TEXT NOT NULL, operation TEXT NOT NULL, request_hash TEXT NOT NULL, result TEXT NOT NULL, PRIMARY KEY(workspace, actor, operation), FOREIGN KEY(workspace) REFERENCES workspaces(id));
      CREATE TABLE IF NOT EXISTS events (sequence INTEGER PRIMARY KEY AUTOINCREMENT, workspace TEXT NOT NULL, actor TEXT NOT NULL, revision INTEGER NOT NULL, payload TEXT NOT NULL, FOREIGN KEY(workspace) REFERENCES workspaces(id));`);
    this.db.exec(`CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, workspace TEXT NOT NULL, revision INTEGER NOT NULL, digest TEXT NOT NULL, status TEXT NOT NULL, output TEXT NOT NULL, FOREIGN KEY(workspace) REFERENCES workspaces(id)); UPDATE jobs SET status = 'interrupted' WHERE status IN ('queued', 'running', 'cancelling');`);
    this.db.exec(`CREATE TABLE IF NOT EXISTS job_steps (job TEXT NOT NULL, ordinal INTEGER NOT NULL, check_name TEXT NOT NULL, status TEXT NOT NULL, started_at TEXT NOT NULL, finished_at TEXT, output TEXT NOT NULL, PRIMARY KEY(job, ordinal), FOREIGN KEY(job) REFERENCES jobs(id)); UPDATE job_steps SET status = 'interrupted', finished_at = datetime('now') WHERE status = 'running';`);
    if (!this.db.prepare('PRAGMA table_info(workspaces)').all().some(column => column.name === 'digest_version')) this.db.exec('ALTER TABLE workspaces ADD COLUMN digest_version INTEGER NOT NULL DEFAULT 1');
    if (!this.db.prepare('PRAGMA table_info(workspaces)').all().some(column => column.name === 'source_manifest')) this.db.exec('ALTER TABLE workspaces ADD COLUMN source_manifest TEXT');
    if (!this.db.prepare('PRAGMA table_info(jobs)').all().some(column => column.name === 'profile')) this.db.exec("ALTER TABLE jobs ADD COLUMN profile TEXT NOT NULL DEFAULT 'structural'");
    this.db.exec('CREATE TABLE IF NOT EXISTS command_groups (workspace TEXT NOT NULL, revision INTEGER NOT NULL, before_schema TEXT NOT NULL, after_digest TEXT NOT NULL, PRIMARY KEY(workspace, revision), FOREIGN KEY(workspace) REFERENCES workspaces(id))');
  }
  close() { this.db.close(); }
  createJob(id, revision, digest, actor, operationId, profile = 'structural') {
    if (!actor || !operationId) throw new Error('Invalid validation identity');
    if (!['structural', 'reference'].includes(profile)) throw new Error('Invalid validation profile');
    const requestHash = hash(JSON.stringify({ type: 'validation.start', revision, digest, profile }));
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
    return { ...row, baselineCommit: workspace.baselineCommit, digestVersion: workspace.digestVersion, steps, stale: workspace.sourceDigest !== row.digest || workspace.revision !== row.revision };
  }
  evidence(workspaceId, jobId) {
    const job = this.job(workspaceId, jobId);
    if (!['passed', 'failed', 'cancelled', 'interrupted'].includes(job.status)) throw new Error('Evidence is not complete');
    return { ...job, scope: job.profile === 'reference' ? 'Generation, SHACL reference validation, business-rule negative fixtures and structural boundaries' : 'Structural generation', completeAcceptanceEvidence: false };
  }
  startJobStep(jobId, ordinal, name) { this.db.prepare('INSERT INTO job_steps VALUES (?, ?, ?, ?, ?, NULL, ?)').run(jobId, ordinal, name, 'running', new Date().toISOString(), ''); }
  finishJobStep(jobId, ordinal, status, output = '') { this.db.prepare('UPDATE job_steps SET status = ?, finished_at = ?, output = ? WHERE job = ? AND ordinal = ?').run(status, new Date().toISOString(), output.slice(-16000), jobId, ordinal); }
  reviewReadiness(workspaceId) {
    const workspace = this.get(workspaceId);
    const jobs = this.db.prepare("SELECT id, profile, revision, digest, status FROM jobs WHERE workspace = ? AND status = 'passed' AND digest = ? AND revision = ? ORDER BY rowid DESC").all(workspaceId, workspace.sourceDigest, workspace.revision);
    const evidence = ['structural', 'reference'].map(profile => ({ profile, job: jobs.find(job => job.profile === profile) ?? null }));
    const missing = evidence.filter(item => !item.job).map(item => item.profile);
    // Remaining independent acceptance tiers and reviewer decisions are not implemented.
    if (workspace.digestVersion === 1) missing.push('legacy digest does not bind the baseline commit');
    if (workspace.digestVersion < 3) missing.push('complete source manifest not recorded');
    missing.push('independent acceptance and publication evidence');
    return { workspaceId, baselineCommit: workspace.baselineCommit, revision: workspace.revision, sourceDigest: workspace.sourceDigest, digestVersion: workspace.digestVersion, evidence, missing, canAccept: false };
  }
  updateJob(id, status, output = '') { this.db.prepare('UPDATE jobs SET status = ?, output = ? WHERE id = ?').run(status, output.slice(-16000), id); }
  create({ title, baselineCommit, schema, sourceManifest }) {
    if (typeof title !== 'string' || !title.trim() || !/^[a-f0-9]{40}$/.test(baselineCommit ?? '') || typeof schema !== 'string' || Buffer.byteLength(schema) > 2_000_000) throw new Error('Invalid workspace baseline');
    parse(schema);
    if (sourceManifest !== undefined) {
      if (!Array.isArray(sourceManifest) || !sourceManifest.length || sourceManifest.length > 10000 || sourceManifest.some((entry, index) => !entry || typeof entry.path !== 'string' || !(entry.path === 'requirements.txt' || /^(model|benchmark|requirements|tests|tools)\/[A-Za-z0-9._/-]+$/.test(entry.path)) || entry.path.split('/').some(part => part === '.' || part === '..' || !part) || Object.keys(entry).sort().join(',') !== 'path,sha256' || !/^[a-f0-9]{64}$/.test(entry.sha256 ?? '') || (index > 0 && sourceManifest[index - 1].path >= entry.path)) || sourceManifest.find(entry => entry.path === 'model/domain.schema')?.sha256 !== hash(schema)) throw new Error('Invalid source manifest');
    }
    const id = randomUUID();
    const version = sourceManifest ? 3 : 2;
    this.db.prepare('INSERT INTO workspaces (id, title, baseline_commit, baseline_schema, schema, revision, digest, digest_version, source_manifest) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)').run(id, title, baselineCommit, schema, schema, sourceDigest(schema, baselineCommit, version, sourceManifest), version, sourceManifest ? JSON.stringify(sourceManifest) : null);
    return this.get(id);
  }
  get(id) {
    const row = this.db.prepare('SELECT * FROM workspaces WHERE id = ?').get(id);
    if (!row) throw new Error('Workspace not found');
    return { id: row.id, title: row.title, baselineCommit: row.baseline_commit, revision: row.revision, sourceDigest: row.digest, digestVersion: row.digest_version, sourceManifest: row.source_manifest ? candidateManifest(JSON.parse(row.source_manifest), row.schema) : null, schema: row.schema };
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
      if (!previous) changes.push({ kind: 'added', name, after: entity });
      else if (JSON.stringify(previous) !== JSON.stringify(entity)) changes.push({ kind: 'changed', name, before: previous, after: entity });
    }
    for (const [name, entity] of before) if (!after.has(name)) changes.push({ kind: 'removed', name, before: entity });
    return { workspaceId: id, baselineCommit: row.baseline_commit, revision: row.revision, sourceDigest: row.digest, digestVersion: row.digest_version, changes, source: { path: 'model/domain.schema', before: row.baseline_schema, after: row.schema } };
  }
  search(id, query, limit = 25, expectedRevision) {
    if (typeof query !== 'string' || query.length > 200 || !Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('Invalid search');
    const workspace = this.get(id), needle = query.toLowerCase();
    if (expectedRevision !== undefined && workspace.revision !== expectedRevision) throw new Error('Revision conflict');
    return { revision: workspace.revision, sourceDigest: workspace.sourceDigest, results: [...parse(workspace.schema).classes.values()].filter(item => `${item.name} ${item.definition}`.toLowerCase().includes(needle)).slice(0, limit) };
  }
  view(id, root, expectedRevision) {
    const workspace = this.get(id);
    if (expectedRevision !== undefined && workspace.revision !== expectedRevision) throw new Error('Revision conflict');
    const classes = parse(workspace.schema).classes;
    const entity = classes.get(root);
    if (!entity) throw new Error('Class not found');
    const edges = [];
    const parent = entity.parent === '-' ? 'Record' : entity.parent;
    if (classes.has(parent)) edges.push({ source: root, target: parent, predicate: 'subClassOf', sourcePath: 'model/domain.schema' });
    for (const token of entity.fields.split(/\s+/).filter(Boolean)) {
      const match = /^([A-Za-z][A-Za-z0-9]*):([A-Za-z][A-Za-z0-9]*)[!?+*]$/.exec(token);
      if (match && classes.has(match[2])) edges.push({ source: root, target: match[2], predicate: match[1], sourcePath: 'model/domain.schema' });
    }
    const visible = edges.slice(0, 50);
    const names = [...new Set([root, ...visible.map(edge => edge.target)])];
    return { workspaceId: id, revision: workspace.revision, sourceDigest: workspace.sourceDigest, root, nodes: names.map(name => classes.get(name)), edges: visible, omitted: edges.length - visible.length };
  }
  apply({ workspaceId, actor, operationId, expectedRevision, commands }) {
    if (typeof actor !== 'string' || !actor || typeof operationId !== 'string' || !operationId || !Number.isSafeInteger(expectedRevision)) throw new Error('Invalid mutation identity');
    const requestHash = hash(JSON.stringify({ expectedRevision, commands }));
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const receipt = this.db.prepare('SELECT * FROM receipts WHERE workspace = ? AND actor = ? AND operation = ?').get(workspaceId, actor, operationId);
      if (receipt) {
        if (receipt.request_hash !== requestHash) throw new Error('Operation ID reused with different request');
        this.db.exec('COMMIT'); return JSON.parse(receipt.result);
      }
      const current = this.get(workspaceId);
      if (current.revision !== expectedRevision) throw new Error('Stale revision');
      const schema = apply(current.schema, commands), revision = current.revision + 1, digest = sourceDigest(schema, current.baselineCommit, current.digestVersion, current.sourceManifest);
      this.db.prepare('UPDATE workspaces SET schema = ?, revision = ?, digest = ? WHERE id = ?').run(schema, revision, digest, workspaceId);
      this.db.prepare('INSERT INTO command_groups VALUES (?, ?, ?, ?)').run(workspaceId, revision, current.schema, digest);
      const event = this.db.prepare('INSERT INTO events (workspace, actor, revision, payload) VALUES (?, ?, ?, ?)').run(workspaceId, actor, revision, JSON.stringify({ commands, sourceDigest: digest }));
      const result = { workspaceId, revision, sourceDigest: digest, eventSequence: Number(event.lastInsertRowid) };
      this.db.prepare('INSERT INTO receipts VALUES (?, ?, ?, ?, ?)').run(workspaceId, actor, operationId, requestHash, JSON.stringify(result));
      this.db.exec('COMMIT'); return result;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  undo({ workspaceId, actor, operationId, expectedRevision, targetRevision }) {
    if (!actor || !operationId || !Number.isSafeInteger(expectedRevision) || !Number.isSafeInteger(targetRevision)) throw new Error('Invalid undo identity');
    const requestHash = hash(JSON.stringify({ type: 'undo', expectedRevision, targetRevision }));
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const receipt = this.db.prepare('SELECT * FROM receipts WHERE workspace = ? AND actor = ? AND operation = ?').get(workspaceId, actor, operationId);
      if (receipt) {
        if (receipt.request_hash !== requestHash) throw new Error('Operation ID reused with different request');
        this.db.exec('COMMIT'); return JSON.parse(receipt.result);
      }
      const current = this.get(workspaceId);
      if (current.revision !== expectedRevision || targetRevision !== current.revision) throw new Error('Undo requires the latest revision');
      const group = this.db.prepare('SELECT * FROM command_groups WHERE workspace = ? AND revision = ?').get(workspaceId, targetRevision);
      if (!group || group.after_digest !== current.sourceDigest) throw new Error('Command group cannot be undone');
      const revision = current.revision + 1, digest = sourceDigest(group.before_schema, current.baselineCommit, current.digestVersion, current.sourceManifest);
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
    return this.db.prepare('SELECT e.sequence, e.actor, e.revision, e.payload, COALESCE((SELECT MAX(p.sequence) FROM events p WHERE p.workspace = e.workspace AND p.sequence < e.sequence), 0) AS previousSequence FROM events e WHERE e.workspace = ? AND e.sequence > ? ORDER BY e.sequence LIMIT 100').all(id, after).map(row => ({ ...row, payload: JSON.parse(row.payload) }));
  }
  hasCursor(id, sequence) {
    this.get(id);
    return sequence === 0 || Boolean(this.db.prepare('SELECT 1 FROM events WHERE workspace = ? AND sequence = ?').get(id, sequence));
  }
  recentEvents(id) {
    this.get(id);
    return this.db.prepare('SELECT sequence, actor, revision, payload FROM events WHERE workspace = ? ORDER BY sequence DESC LIMIT 100').all(id).reverse().map(row => ({ ...row, payload: JSON.parse(row.payload) }));
  }
}
