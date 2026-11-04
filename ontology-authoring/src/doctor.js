import { execFileSync } from 'node:child_process';
import { createServer } from 'node:net';
import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function diagnose(env = process.env) {
  const checks = [];
  const add = (name, ok, detail) => checks.push({ name, ok, detail });
  const node = process.versions.node.split('.').map(Number);
  add('Node.js', node[0] > 22 || (node[0] === 22 && node[1] >= 18), 'Install Node.js 22.18 or newer.');
  const repository = resolve(env.CHARGEWEAVE_REPOSITORY ?? '..');
  try {
    const commit = execFileSync('git', ['rev-parse', '--verify', 'HEAD'], { cwd: repository, encoding: 'utf8', timeout: 10000 }).trim();
    const origin = execFileSync('git', ['remote', 'get-url', 'origin'], { cwd: repository, encoding: 'utf8', timeout: 10000 }).trim();
    const canonical = /^https:\/\/(?:[^/@]+@)?github\.com\/pli-poc\/charge-weave(?:\.git)?\/?$/i.test(origin) || /^git@github\.com:pli-poc\/charge-weave(?:\.git)?$/i.test(origin);
    add('Repository', /^[a-f0-9]{40}$/.test(commit) && canonical, 'Set CHARGEWEAVE_REPOSITORY to the canonical ChargeWeave checkout.');
  } catch { add('Repository', false, 'Install Git and set CHARGEWEAVE_REPOSITORY to the canonical checkout.'); }
  try {
    execFileSync(env.CHARGEWEAVE_PYTHON || 'python', ['-c', 'import rdflib, pyshacl, owlready2, tzdata'], { timeout: 10000, stdio: 'ignore' });
    add('Python dependencies', true, 'Pinned validation dependencies are importable.');
  } catch { add('Python dependencies', false, 'Install requirements.txt in Python and set CHARGEWEAVE_PYTHON if needed.'); }
  try {
    execFileSync('java', ['-version'], { timeout: 10000, stdio: 'ignore' });
    checks.push({ name: 'Java', ok: true, optional: true, detail: 'Java is available for OWL checks.' });
  } catch { checks.push({ name: 'Java', ok: false, optional: true, detail: 'Install Java for OWL consistency checks.' }); }
  const database = resolve(env.CHARGEWEAVE_WORKSPACE_DB ?? 'workspaces.sqlite');
  try { await access(dirname(database), constants.W_OK); add('Workspace directory', true, 'Database directory is writable.'); }
  catch { add('Workspace directory', false, 'Set CHARGEWEAVE_WORKSPACE_DB to a path in a writable private directory.'); }
  try { await access(resolve(env.CHARGEWEAVE_WEB_DIST ?? '../website/dist', 'index.html'), constants.R_OK); add('Studio build', true, 'Local studio files are available.'); }
  catch { add('Studio build', false, 'Install website dependencies and run npm run build --prefix ../website.'); }
  add('Workspace grant', /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(env.CHARGEWEAVE_WORKSPACE_ID ?? ''), 'Create a workspace and set CHARGEWEAVE_WORKSPACE_ID.');
  add('Draft credential', typeof env.CHARGEWEAVE_DRAFT_TOKEN === 'string' && Buffer.byteLength(env.CHARGEWEAVE_DRAFT_TOKEN) >= 32, 'Set CHARGEWEAVE_DRAFT_TOKEN to a random secret of at least 32 bytes.');
  const port = Number(env.CHARGEWEAVE_PORT ?? 4317);
  if (!Number.isInteger(port) || port < 1 || port > 65535) add('Loopback port', false, 'Set CHARGEWEAVE_PORT to a valid available port.');
  else {
    const available = await new Promise(resolvePort => {
      const server = createServer();
      server.once('error', () => resolvePort(false));
      server.listen(port, '127.0.0.1', () => server.close(() => resolvePort(true)));
    });
    add('Loopback port', available, 'Stop the existing service or choose another CHARGEWEAVE_PORT.');
  }
  return checks;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const checks = await diagnose();
  for (const check of checks) console.log(`${check.ok ? 'OK' : check.optional ? 'OPTIONAL' : 'FIX'} ${check.name}: ${check.detail}`);
  if (checks.some(check => !check.ok && !check.optional)) process.exitCode = 1;
}
