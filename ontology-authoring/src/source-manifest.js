import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

export const generatedInputs = new Set([
  'model/catalog.json', 'model/property-types.json', 'model/rules.json', 'model/transitions.json', 'model/competency-questions.json', 'model/temporal-example.json',
  'benchmark/resource-coverage.json', 'benchmark/endpoint-coverage.json', 'benchmark/event-catalog.json', 'benchmark/capture.json', 'benchmark/pricing-field-crosswalk.json', 'tests/journey-snapshots.json',
]);
// Only these declared source owners may be materialized as draft overlays.
export const editableSourcePaths = new Set([
  'model/audit-rules.json', 'model/authoring-example-overrides.json', 'model/temporal-policy.json',
  'model/responsibility-bindings.json',
  'requirements/business-requirements.json', 'tests/business-acceptance.json', 'tests/negative-cases.json',
]);
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

export function importSourceManifest(repository, commit) {
  if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error('Invalid baseline commit');
  const listing = execFileSync('git', ['ls-tree', '-r', '-z', commit, '--', 'model', 'benchmark', 'requirements', 'tests', 'tools', 'requirements.txt'], { cwd: repository, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  const entries = [];
  for (const line of listing.split('\0').filter(Boolean)) {
    const match = /^(\d{6}) (\w+) ([a-f0-9]{40})\t(.+)$/.exec(line);
    if (!match || match[2] !== 'blob' || !['100644', '100755'].includes(match[1])) throw new Error('Unsupported tracked source type');
    const path = match[4];
    if (generatedInputs.has(path)) continue;
    const bytes = execFileSync('git', ['show', `${commit}:${path}`], { cwd: repository, maxBuffer: 8 * 1024 * 1024 });
    entries.push({ path, sha256: sha256(bytes) });
  }
  return entries.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
}
