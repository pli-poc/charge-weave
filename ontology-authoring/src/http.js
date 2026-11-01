import { createServer as createHttpServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from './mcp.js';

// A single locally provisioned bearer identifies this bounded draft-edit session.
// Browser origins are denied unless explicitly configured by the operator.
export function createHttpService({ store, token, allowedOrigin }) {
  if (typeof token !== 'string' || Buffer.byteLength(token) < 32) throw new Error('A bearer token of at least 32 bytes is required');
  const secret = Buffer.from(token);
  return createHttpServer(async (req, res) => {
    if (!/^127\.0\.0\.1(?::\d+)?$/.test(req.headers.host ?? '')) { res.writeHead(403).end('Host forbidden'); return; }
    const origin = req.headers.origin;
    if (origin && origin !== allowedOrigin) { res.writeHead(403).end('Origin forbidden'); return; }
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept, MCP-Protocol-Version');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    }
    if (req.method === 'OPTIONS' && origin) { res.writeHead(204).end(); return; }
    const authorization = req.headers.authorization ?? '';
    const supplied = Buffer.from(authorization.startsWith('Bearer ') ? authorization.slice(7) : '');
    if (supplied.length !== secret.length || !timingSafeEqual(supplied, secret)) { res.writeHead(401).end('Unauthorized'); return; }
    if (req.url !== '/mcp' || req.method !== 'POST') { res.writeHead(404).end('Not found'); return; }
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    const server = createServer(store, 'local-draft-session');
    res.on('close', () => { void server.close(); });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch {
      if (!res.headersSent) res.writeHead(500).end('MCP request failed');
      else res.end();
    }
  });
}
