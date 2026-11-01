import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { WorkspaceStore } from './workspace.js';
import { createHttpService } from './http.js';
import { importSourceManifest } from './source-manifest.js';

const repository = resolve(process.env.CHARGEWEAVE_REPOSITORY ?? '..');
const database = resolve(process.env.CHARGEWEAVE_WORKSPACE_DB ?? 'workspaces.sqlite');
const token = process.env.CHARGEWEAVE_DRAFT_TOKEN;
const port = Number(process.env.CHARGEWEAVE_PORT ?? 4317);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid port');
const store = new WorkspaceStore(database);
if (process.argv.includes('--create-workspace')) {
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim();
  // Import committed bytes, not a potentially dirty checkout.
  const schema = execFileSync('git', ['show', `${commit}:model/domain.schema`], { cwd: repository, encoding: 'utf8', maxBuffer: 2_000_000 });
  const sourceManifest = importSourceManifest(repository, commit);
  const workspace = store.create({ title: 'ChargeWeave draft', baselineCommit: commit, schema, sourceManifest });
  console.log(JSON.stringify({ id: workspace.id, baselineCommit: workspace.baselineCommit, revision: workspace.revision }));
  store.close();
} else {
  const service = createHttpService({ store, token, reviewerToken: process.env.CHARGEWEAVE_REVIEWER_TOKEN, workspaceId: process.env.CHARGEWEAVE_WORKSPACE_ID, allowedOrigin: process.env.CHARGEWEAVE_BROWSER_ORIGIN, repository, python: process.env.CHARGEWEAVE_PYTHON });
  service.listen(port, '127.0.0.1', () => console.log(`Ontology MCP listening on 127.0.0.1:${port}`));
  const stop = async () => { await service.shutdown(); store.close(); process.exit(0); };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
}
