import { readFile, realpath, stat } from 'node:fs/promises';
import { extname, relative, resolve, sep } from 'node:path';

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.json': 'application/json; charset=utf-8', '.ttl': 'text/turtle; charset=utf-8' };
const base = '/charge-weave-app/';

export async function serveStudio(req, res, directory) {
  if (!directory || req.method !== 'GET') return false;
  const url = new URL(req.url, 'http://127.0.0.1');
  if (!url.pathname.startsWith(base)) return false;
  let path;
  try { path = decodeURIComponent(url.pathname.slice(base.length)); }
  catch { res.writeHead(400).end('Invalid path'); return true; }
  if (path.includes('\\') || path.split('/').some(part => part === '..' || part === '.') || path.includes('\0')) { res.writeHead(400).end('Invalid path'); return true; }
  if (!path || ['modelling', 'modelling/', 'modelling/index.html', 'developer/modeler', 'developer/modeler/', 'developer/modeler/index.html', 'developer/modeler/studio', 'developer/modeler/studio/', 'developer/modeler/studio/index.html'].includes(path)) path = 'index.html';
  const type = types[extname(path).toLowerCase()];
  if (!type) { res.writeHead(404).end('Not found'); return true; }
  try {
    const root = await realpath(directory);
    const file = await realpath(resolve(root, path));
    const rel = relative(root, file);
    if (!rel || rel === '..' || rel.startsWith(`..${sep}`) || resolve(root, rel) !== file) throw new Error('Outside static root');
    const info = await stat(file);
    if (!info.isFile() || info.size > 16 * 1024 * 1024) throw new Error('Unsupported file');
    const bytes = await readFile(file);
    res.writeHead(200, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': path === 'index.html' ? 'no-store' : 'public, max-age=3600', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'" });
    res.end(bytes);
  } catch { res.writeHead(404).end('Not found'); }
  return true;
}
