import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { WorkspaceStore } from './workspace.js';
import { createHttpService } from './http.js';
import { editableSourcePaths, importSourceManifest } from './source-manifest.js';
import { runMaintenanceDemo } from './maintenance-demo.js';

const args = new Set(process.argv.slice(2));
if ([...args].some(arg => !['--interactive', '--quick'].includes(arg))) throw new Error('Usage: npm run demo -- [--interactive] [--quick]');
const interactive = args.has('--interactive'), quick = args.has('--quick');
const pairingCode = process.env.CHARGEWEAVE_PAIRING_CODE;
if (interactive && (!stdin.isTTY || !pairingCode || Buffer.byteLength(pairingCode) < 32)) throw new Error('Interactive mode requires a terminal and CHARGEWEAVE_PAIRING_CODE of at least 32 bytes');
const repository = resolve(process.env.CHARGEWEAVE_REPOSITORY ?? '..');
const database = resolve(process.env.CHARGEWEAVE_DEMO_DB ?? 'demo-workspaces.sqlite');
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim();
const show = path => execFileSync('git', ['show', `${commit}:${path}`], { cwd: repository, encoding: 'utf8', maxBuffer: 2_000_000 });
const schema = show('model/domain.schema');
const manifest = importSourceManifest(repository, commit);
const sourceBlobs = Object.fromEntries([...editableSourcePaths].map(path => [path, show(path)]));
const store = new WorkspaceStore(database);
const workspace = store.create({ title: 'Scripted demonstration - synthetic maintenance', baselineCommit: commit, schema, sourceManifest: manifest, sourceBlobs });
const token = randomBytes(32).toString('hex');
const service = createHttpService({ store, token, workspaceId: workspace.id, pairingCode, repository, python: process.env.CHARGEWEAVE_PYTHON, staticDirectory: resolve(process.env.CHARGEWEAVE_WEB_DIST ?? '../website/dist') });
const client = new Client({ name: 'scripted-maintenance-demonstration', version: '1' });
let prompt;
try {
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  const origin = `http://127.0.0.1:${service.address().port}`;
  console.log('Scripted demonstration (synthetic data; not a live Codex session).');
  console.log(`Workspace ${workspace.id}; baseline ${commit}.`);
  if (interactive) {
    console.log(`Open ${origin}/charge-weave-app/modelling/ and pair using your configured code.`);
    prompt = createInterface({ input: stdin, output: stdout });
    await prompt.question('Press Enter after the studio is connected. ');
  }
  await client.connect(new StreamableHTTPClientTransport(new URL(`${origin}/mcp`), { requestInit: { headers: { authorization: `Bearer ${token}` } } }));
  const result = await runMaintenanceDemo(client, workspace.id, {
    validate: !quick,
    log: message => console.log(message),
    waitForEdit: interactive ? async () => { await prompt.question('Optionally edit the proposal in the studio, then press Enter. '); } : undefined,
  });
  console.log(`Current revision ${result.revision}; source digest ${result.sourceDigest}.`);
  console.log('Review and publication remain explicit reviewer actions; this script does not approve or publish.');
  if (interactive) await prompt.question('Press Enter to close this local demonstration service. ');
  if (!quick && (!result.job || result.job.status !== 'passed' || result.job.stale || !result.fixtureJob || result.fixtureJob.status !== 'passed' || result.fixtureJob.stale)) process.exitCode = 1;
} finally {
  prompt?.close();
  await client.close();
  await service.shutdown();
  store.close();
}
