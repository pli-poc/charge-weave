import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const paths = ['requirements/business-requirements.json', 'requirements/journeys.json', 'model/audit-rules.json', 'model/temporal-queries.json'];
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const fields = entity => new Map((entity?.fields || '').split(/\s+/).filter(Boolean).map(token => [token.split(':', 1)[0], token]));
const references = text => [...String(text || '').matchAll(/\bcd:([A-Za-z][A-Za-z0-9]*)\b/g)].map(match => match[1]);

// This is a bounded index of explicit baseline references, not dependency proof.
export function changeImpact(workspace, changes, repository) {
  if (workspace.digestVersion < 3 || !repository) throw new Error('Impact index requires a pinned source manifest and repository');
  const sources = new Map();
  for (const path of paths) {
    const expected = workspace.sourceManifest.find(item => item.path === path)?.sha256;
    if (!expected) throw new Error(`Impact source is not in the pinned source manifest: ${path}`);
    const bytes = Object.hasOwn(workspace.sourceOverlays || {}, path) ? Buffer.from(workspace.sourceOverlays[path], 'utf8') : execFileSync('git', ['show', `${workspace.baselineCommit}:${path}`], { cwd: repository, timeout: 15000, maxBuffer: 8 * 1024 * 1024 });
    if (digest(bytes) !== expected) throw new Error(`Pinned impact source does not match its manifest: ${path}`);
    sources.set(path, JSON.parse(bytes.toString('utf8')));
  }
  const classes = new Set(changes.map(item => item.name));
  const properties = new Set();
  for (const change of changes) {
    const before = fields(change.before), after = fields(change.after);
    for (const name of new Set([...before.keys(), ...after.keys()])) if (before.get(name) !== after.get(name)) properties.add(name);
  }
  const terms = new Set([...classes, ...properties]);
  const matching = values => [...new Set(values.filter(value => terms.has(value)))].sort();
  const results = [];
  for (const item of sources.get(paths[0])) {
    const termsFound = matching([...(item.classes || []), ...(item.relationships || []).flatMap(entry => [entry.class, ...(entry.properties || [])])]);
    if (termsFound.length) results.push({ kind: 'requirement', id: item.id, title: item.statement, terms: termsFound, source: paths[0] });
  }
  for (const item of sources.get(paths[1])) {
    const termsFound = matching(item.classes || []);
    if (termsFound.length) results.push({ kind: 'journey', id: item.id, title: item.title, terms: termsFound, source: paths[1] });
  }
  for (const item of sources.get(paths[2])) {
    const termsFound = matching([item.target, ...references(item.body)]);
    if (termsFound.length) results.push({ kind: 'rule', id: item.id, title: item.title, terms: termsFound, source: paths[2] });
  }
  for (const [id, query] of Object.entries(sources.get(paths[3]))) {
    const termsFound = matching(references(query));
    if (termsFound.length) results.push({ kind: 'temporal-query', id, title: id, terms: termsFound, source: paths[3] });
  }
  return { workspaceId: workspace.id, revision: workspace.revision, sourceDigest: workspace.sourceDigest, baselineCommit: workspace.baselineCommit,
    mappingVersion: 'chargeweave-explicit-impact-v1', changedClasses: [...classes].sort(), changedProperties: [...properties].sort(),
    references: results.slice(0, 200), omitted: Math.max(0, results.length - 200),
    coverage: 'partial', note: 'Only explicit references in four pinned sources and supported draft overlays are indexed. Other sources, dynamic dependencies and new requirements may be missing; this is not acceptance evidence.' };
}
