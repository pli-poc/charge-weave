import { DatabaseSync } from 'node:sqlite';
import { createHash, randomUUID } from 'node:crypto';

const hash = value => createHash('sha256').update(value).digest('hex');
const sourceDigest = schema => hash(JSON.stringify({ adapter: 'domain-schema-v1', sources: { 'model/domain.schema': hash(schema) } }));
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
  if (!Array.isArray(commands) || !commands.length || commands.length > 100) throw new Error('Expected 1–100 commands');
  const lines = schema.split(/\r?\n/);
  for (const command of commands) {
    const model = parse(lines.join('\n'));
    if (command.type === 'class.add') {
      const { name, module, parent, definition } = command;
      if (!identifier.test(name ?? '') || model.classes.has(name) || !model.modules.has(module) || !(parent === 'root' || parent === '-' || model.classes.has(parent)) || typeof definition !== 'string' || !definition.trim() || /[|\r\n]/.test(definition)) throw new Error('Invalid class.add');
      let index = lines.findIndex(line => line === `MODULE|${module}`) + 1;
      while (index < lines.length && !lines[index].startsWith('MODULE|')) index++;
      lines.splice(index, 0, `${name}|${parent}|${definition}|`);
    } else if (command.type === 'class.describe') {
      const { name, definition } = command;
      if (!model.classes.has(name) || typeof definition !== 'string' || !definition.trim() || /[|\r\n]/.test(definition)) throw new Error('Invalid class.describe');
      const index = lines.findIndex(line => line.startsWith(`${name}|`));
      const parts = lines[index].split('|'); parts[2] = definition; lines[index] = parts.join('|');
    } else throw new Error(`Unsupported command: ${command.type}`);
  }
  return lines.join('\n');
}

export class WorkspaceStore {
  constructor(path) {
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
      CREATE TABLE IF NOT EXISTS workspaces (id TEXT PRIMARY KEY, title TEXT NOT NULL, baseline_commit TEXT NOT NULL, baseline_schema TEXT NOT NULL, schema TEXT NOT NULL, revision INTEGER NOT NULL, digest TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS receipts (workspace TEXT NOT NULL, actor TEXT NOT NULL, operation TEXT NOT NULL, request_hash TEXT NOT NULL, result TEXT NOT NULL, PRIMARY KEY(workspace, actor, operation), FOREIGN KEY(workspace) REFERENCES workspaces(id));
      CREATE TABLE IF NOT EXISTS events (sequence INTEGER PRIMARY KEY AUTOINCREMENT, workspace TEXT NOT NULL, actor TEXT NOT NULL, revision INTEGER NOT NULL, payload TEXT NOT NULL, FOREIGN KEY(workspace) REFERENCES workspaces(id));`);
  }
  close() { this.db.close(); }
  create({ title, baselineCommit, schema }) {
    if (typeof title !== 'string' || !title.trim() || !/^[a-f0-9]{40}$/.test(baselineCommit ?? '') || typeof schema !== 'string' || Buffer.byteLength(schema) > 2_000_000) throw new Error('Invalid workspace baseline');
    parse(schema);
    const id = randomUUID();
    this.db.prepare('INSERT INTO workspaces VALUES (?, ?, ?, ?, ?, 0, ?)').run(id, title, baselineCommit, schema, schema, sourceDigest(schema));
    return this.get(id);
  }
  get(id) {
    const row = this.db.prepare('SELECT * FROM workspaces WHERE id = ?').get(id);
    if (!row) throw new Error('Workspace not found');
    return { id: row.id, title: row.title, baselineCommit: row.baseline_commit, revision: row.revision, sourceDigest: row.digest, schema: row.schema };
  }
  snapshot(id) {
    // Synchronous reads share the event loop with mutations, so identity and cursor
    // describe the same committed state for this single-process store.
    const workspace = this.get(id);
    const row = this.db.prepare('SELECT COALESCE(MAX(sequence), 0) AS cursor FROM events WHERE workspace = ?').get(id);
    return { ...workspace, eventSequence: row.cursor };
  }
  search(id, query, limit = 25) {
    if (typeof query !== 'string' || query.length > 200 || !Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('Invalid search');
    const workspace = this.get(id), needle = query.toLowerCase();
    return { revision: workspace.revision, sourceDigest: workspace.sourceDigest, results: [...parse(workspace.schema).classes.values()].filter(item => `${item.name} ${item.definition}`.toLowerCase().includes(needle)).slice(0, limit) };
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
      const schema = apply(current.schema, commands), revision = current.revision + 1, digest = sourceDigest(schema);
      this.db.prepare('UPDATE workspaces SET schema = ?, revision = ?, digest = ? WHERE id = ?').run(schema, revision, digest, workspaceId);
      const event = this.db.prepare('INSERT INTO events (workspace, actor, revision, payload) VALUES (?, ?, ?, ?)').run(workspaceId, actor, revision, JSON.stringify({ commands, sourceDigest: digest }));
      const result = { workspaceId, revision, sourceDigest: digest, eventSequence: Number(event.lastInsertRowid) };
      this.db.prepare('INSERT INTO receipts VALUES (?, ?, ?, ?, ?)').run(workspaceId, actor, operationId, requestHash, JSON.stringify(result));
      this.db.exec('COMMIT'); return result;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  events(id, after = 0) {
    this.get(id);
    if (!Number.isSafeInteger(after) || after < 0) throw new Error('Invalid cursor');
    return this.db.prepare('SELECT sequence, actor, revision, payload FROM events WHERE workspace = ? AND sequence > ? ORDER BY sequence LIMIT 100').all(id, after).map(row => ({ ...row, payload: JSON.parse(row.payload) }));
  }
}
