import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const files = fs.readdirSync(path.join(dist, 'assets'));
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const entry = html.match(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/)?.[1];
assert.ok(entry, 'production HTML must load a JavaScript entry');
const entrySegments = new URL(entry, 'https://chargeweave.invalid').pathname.split('/').filter(Boolean).slice(-2);
const entryPath = path.join(dist, ...entrySegments);
const entryCode = fs.readFileSync(entryPath, 'utf8');
assert.match(entryCode, /ModellingStudio-[\w-]+\.js/, 'the modelling studio must remain a lazy route chunk');
assert.ok(files.some(file => /^ArchitectureScene3D-[\w-]+\.js$/.test(file)), 'the 3D scene must remain a separate route chunk');
assert.ok(files.some(file => /^layout\.worker-[\w-]+\.js$/.test(file)), 'diagram layout must remain in its worker asset');

const preloads = [...html.matchAll(/<link\b(?=[^>]*\brel="modulepreload")[^>]*\bhref="([^"]+)"[^>]*>/g)].map(match => match[1]);
for (const href of preloads) {
  assert.doesNotMatch(href, /(?:ModellingStudio-|ArchitectureScene3D-|layout\.worker-|model-[\w-]+\.js)/, `homepage must not preload deferred feature asset ${href}`);
}

console.log(`Route splitting verified: ${preloads.length} eager module preloads; modelling, 3D, model and layout-worker assets remain deferred.`);
