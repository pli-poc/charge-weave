import { createServer as createHttpServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from './mcp.js';

// A single locally provisioned bearer identifies this bounded draft-edit session.
// Browser origins are denied unless explicitly configured by the operator.
export function createHttpService({ store, token, allowedOrigin, repository, python }) {
  if (typeof token !== 'string' || Buffer.byteLength(token) < 32) throw new Error('A bearer token of at least 32 bytes is required');
  const secret = Buffer.from(token);
  return createHttpServer(async (req, res) => {
    if (!/^127\.0\.0\.1(?::\d+)?$/.test(req.headers.host ?? '')) { res.writeHead(403).end('Host forbidden'); return; }
    const origin = req.headers.origin;
    if (origin && origin !== allowedOrigin) { res.writeHead(403).end('Origin forbidden'); return; }
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept, MCP-Protocol-Version, Last-Event-ID');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    }
    if (req.method === 'OPTIONS' && origin) { res.writeHead(204).end(); return; }
    const authorization = req.headers.authorization ?? '';
    const supplied = Buffer.from(authorization.startsWith('Bearer ') ? authorization.slice(7) : '');
    if (supplied.length !== secret.length || !timingSafeEqual(supplied, secret)) { res.writeHead(401).end('Unauthorized'); return; }
    const url = new URL(req.url, 'http://127.0.0.1');
    if (url.pathname === '/events' && req.method === 'GET') {
      const workspaceId = url.searchParams.get('workspaceId');
      const cursor = req.headers['last-event-id'] ?? url.searchParams.get('after') ?? '0';
      if (!/^[0-9a-f-]{36}$/i.test(workspaceId ?? '') || !/^\d{1,15}$/.test(cursor)) { res.writeHead(400).end('Invalid event cursor'); return; }
      let sequence = Number(cursor);
      try { store.get(workspaceId); } catch { res.writeHead(404).end('Workspace not found'); return; }
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no' });
      const send = () => {
        try {
          const events = store.events(workspaceId, sequence);
          for (const event of events) {
            sequence = event.sequence;
            res.write(`id: ${sequence}\nevent: workspace-change\ndata: ${JSON.stringify(event)}\n\n`);
          }
        } catch { res.end(); }
      };
      send();
      const timer = setInterval(send, 500);
      const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 15000);
      res.on('close', () => { clearInterval(timer); clearInterval(heartbeat); });
      return;
    }
    if (req.url !== '/mcp' || req.method !== 'POST') { res.writeHead(404).end('Not found'); return; }
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    const server = createServer(store, 'local-draft-session', { repository, python });
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
