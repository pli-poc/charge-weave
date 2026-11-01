import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { lstat, readFile, realpath } from 'node:fs/promises';
import { join, relative, isAbsolute, sep } from 'node:path';

const exec = promisify(execFile);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const listScript = "import json,sys; from pathlib import Path; sys.path.insert(0, 'tools'); from check_generated import generated_paths; print(json.dumps(sorted(generated_paths(Path('.')))))";

// Use the baseline's own generated-output catalogue; no model text is executed.
export async function captureGeneratedArtifacts(directory, python) {
  const output = await exec(python, ['-c', listScript], { cwd: directory, timeout: 30000, maxBuffer: 1024 * 1024, env: { ...process.env, PYTHONUTF8: '1' } });
  const paths = JSON.parse(output.stdout);
  if (!Array.isArray(paths) || paths.length > 5000) throw new Error('Invalid generated artifact catalogue');
  const root = await realpath(directory), entries = [];
  let totalSize = 0;
  for (const raw of paths) {
    const path = typeof raw === 'string' ? raw.replaceAll('\\', '/') : '';
    if (!/^[A-Za-z0-9._/-]+$/.test(path) || path.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('Unsafe generated artifact path');
    const full = join(directory, ...path.split('/'));
    let info;
    try { info = await lstat(full); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    if (!info.isFile() || info.isSymbolicLink() || info.size > 32 * 1024 * 1024) throw new Error(`Unsupported generated artifact: ${path}`);
    const resolved = await realpath(full), within = relative(root, resolved);
    if (!within || within === '..' || within.startsWith(`..${sep}`) || isAbsolute(within)) throw new Error('Generated artifact escapes the candidate');
    totalSize += info.size;
    if (totalSize > 128 * 1024 * 1024) throw new Error('Generated artifacts exceed the capture limit');
    const bytes = await readFile(full);
    entries.push({ path, sha256: digest(bytes), bytes: bytes.length });
  }
  entries.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  if (new Set(entries.map(item => item.path)).size !== entries.length) throw new Error('Duplicate generated artifact path');
  return entries;
}

export function summarizeGeneratedArtifacts(before, after) {
  const old = new Map(before.map(item => [item.path, item])), next = new Map(after.map(item => [item.path, item]));
  const changed = [...new Set([...old.keys(), ...next.keys()])].sort().flatMap(path => {
    const previous = old.get(path), current = next.get(path);
    if (previous?.sha256 === current?.sha256) return [];
    return [{ path, kind: !previous ? 'added' : !current ? 'removed' : 'changed', beforeSha256: previous?.sha256 ?? null, afterSha256: current?.sha256 ?? null, beforeBytes: previous?.bytes ?? null, afterBytes: current?.bytes ?? null }];
  });
  return { comparison: 'exact-bytes', baselineManifestSha256: digest(JSON.stringify(before)), candidateManifestSha256: digest(JSON.stringify(after)),
    baselineFiles: before.length, candidateFiles: after.length, changedCount: changed.length, changes: changed.slice(0, 250), omitted: Math.max(0, changed.length - 250),
    note: 'Exact byte differences may include serialization or line-ending changes. This summary is not a generated patch, independent acceptance evidence or publication authorization.' };
}
