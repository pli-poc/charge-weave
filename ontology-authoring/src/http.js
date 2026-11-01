import { createServer as createHttpServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from './mcp.js';
import { runGenerator } from './validation.js';
import { runPublicationCommit, runPublicationPreview } from './publication-candidate.js';
import { runPublicationPush } from './publication-push.js';
import { runPublicationPullRequest } from './publication-pr.js';
import { serveStudio } from './static.js';
import { PairingSessions } from './pairing.js';

// A single locally provisioned bearer identifies this bounded draft-edit session.
// Browser origins are denied unless explicitly configured by the operator.
export function createHttpService({ store, token, reviewerToken, pairingCode, allowedOrigin, repository, python, workspaceId, staticDirectory, validationRunner = runGenerator, publicationFixture, ciFetch, pullRequestFetch, allowPublish = false, githubToken }) {
  if (typeof token !== 'string' || Buffer.byteLength(token) < 32) throw new Error('A bearer token of at least 32 bytes is required');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(workspaceId ?? '')) throw new Error('A specific workspace grant is required');
  store.get(workspaceId);
  if (reviewerToken !== undefined && (typeof reviewerToken !== 'string' || Buffer.byteLength(reviewerToken) < 32 || reviewerToken === token)) throw new Error('Reviewer token must be distinct and at least 32 bytes');
  if (pairingCode && (pairingCode === token || pairingCode === reviewerToken)) throw new Error('Pairing code must be distinct from bearer credentials');
  if (allowPublish && !publicationFixture && (typeof githubToken !== 'string' || githubToken.length < 20 || /[\r\n\0]/.test(githubToken))) throw new Error('Publisher permission requires a GitHub token');
  const secret = Buffer.from(token);
  const reviewerSecret = reviewerToken ? Buffer.from(reviewerToken) : null;
  const pairing = pairingCode ? new PairingSessions(pairingCode) : null;
  const scopedStore = new Proxy(store, {
    get(target, property) {
      const member = target[property];
      if (typeof member !== 'function') return member;
      return (...args) => {
        const requested = ['apply', 'applyReviewerCase', 'undo'].includes(property) ? args[0]?.workspaceId : args[0];
        if (requested !== workspaceId) throw new Error('Workspace not authorized');
        return member.apply(target, args);
      };
    },
  });
  const activeJobs = new Map();
  let stopping = false;
  const service = createHttpServer(async (req, res) => {
    if (stopping) { res.writeHead(503).end('Service is stopping'); return; }
    if (!/^127\.0\.0\.1(?::\d+)?$/.test(req.headers.host ?? '')) { res.writeHead(403).end('Host forbidden'); return; }
    const origin = req.headers.origin;
    if (origin && origin !== allowedOrigin && origin !== `http://${req.headers.host}`) { res.writeHead(403).end('Origin forbidden'); return; }
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept, MCP-Protocol-Version, Last-Event-ID');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    }
    if (req.method === 'OPTIONS' && origin) { res.writeHead(204).end(); return; }
    if (await serveStudio(req, res, staticDirectory)) return;
    const url = new URL(req.url, 'http://127.0.0.1');
    const localOrigin = `http://${req.headers.host}`;
    if (url.pathname === '/pair' && req.method === 'POST') {
      if (!pairing || origin !== localOrigin || !/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] ?? '')) { res.writeHead(403).end('Pairing unavailable'); return; }
      let body = '';
      try {
        for await (const chunk of req) { body += chunk.toString('utf8'); if (Buffer.byteLength(body) > 1024) throw new Error('Too large'); }
        const data = JSON.parse(body);
        const session = pairing.pair(data.code);
        if (!session) { res.writeHead(403).end('Invalid or expired pairing code'); return; }
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Set-Cookie': `cw_studio=${session.id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800` });
        res.end(JSON.stringify({ workspaceId, csrf: session.csrf }));
      } catch { if (!res.headersSent) res.writeHead(400).end('Invalid pairing request'); }
      return;
    }
    const cookies = (req.headers.cookie ?? '').split(';').map(item => item.trim()).filter(item => item.startsWith('cw_studio='));
    const sessionId = cookies.length === 1 ? cookies[0].slice('cw_studio='.length) : '';
    const session = /^[A-Za-z0-9_-]{43}$/.test(sessionId) ? pairing?.get(sessionId) : null;
    if (url.pathname === '/session' && req.method === 'GET') {
      if (!session || req.headers['sec-fetch-site'] !== 'same-origin' || (origin && origin !== localOrigin)) { res.writeHead(403).end('Session unavailable'); return; }
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ workspaceId, csrf: session.csrf })); return;
    }
    const authorization = req.headers.authorization ?? '';
    const supplied = Buffer.from(authorization.startsWith('Bearer ') ? authorization.slice(7) : '');
    const matches = candidate => candidate && supplied.length === candidate.length && timingSafeEqual(supplied, candidate);
    const csrfHeader = req.headers['x-csrf-token'];
    const csrfBytes = Buffer.from(typeof csrfHeader === 'string' ? csrfHeader : '');
    const expectedCsrf = session ? Buffer.from(session.csrf) : null;
    const csrfValid = expectedCsrf && csrfBytes.length === expectedCsrf.length && timingSafeEqual(csrfBytes, expectedCsrf);
    const cookieAuthorized = session && (!origin || origin === localOrigin) && csrfValid && (req.method !== 'POST' || origin === localOrigin);
    const role = matches(secret) ? 'draft' : matches(reviewerSecret) ? 'reviewer' : cookieAuthorized ? 'reviewer' : null;
    if (!role) { res.writeHead(401).end('Unauthorized'); return; }
    if (url.pathname === '/session' && req.method === 'DELETE' && cookieAuthorized) {
      pairing.revoke(sessionId); res.writeHead(204, { 'Set-Cookie': 'cw_studio=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0', 'Cache-Control': 'no-store' }).end(); return;
    }
    if (url.pathname === '/events' && req.method === 'GET') {
      const requestedWorkspace = url.searchParams.get('workspaceId');
      const cursor = req.headers['last-event-id'] ?? url.searchParams.get('after') ?? '0';
      if (!/^[0-9a-f-]{36}$/i.test(requestedWorkspace ?? '') || !/^\d{1,15}$/.test(cursor)) { res.writeHead(400).end('Invalid event cursor'); return; }
      if (requestedWorkspace !== workspaceId) { res.writeHead(403).end('Workspace not authorized'); return; }
      let sequence = Number(cursor);
      try { store.get(workspaceId); } catch { res.writeHead(404).end('Workspace not found'); return; }
      if (!store.hasCursor(workspaceId, sequence)) { res.writeHead(409).end('Event cursor unavailable; reload workspace snapshot'); return; }
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no' });
      res.flushHeaders();
      const send = () => {
        try {
          const events = store.events(workspaceId, sequence);
          for (const event of events) {
            sequence = event.sequence;
            if (!res.write(`id: ${sequence}\nevent: workspace-change\ndata: ${JSON.stringify(event)}\n\n`)) { res.end(); return; }
          }
        } catch { res.end(); }
      };
      send();
      const timer = setInterval(send, 500);
      const heartbeat = setInterval(() => { if (!res.write(': heartbeat\n\n')) res.end(); }, 15000);
      res.on('close', () => { clearInterval(timer); clearInterval(heartbeat); });
      return;
    }
    if (req.url !== '/mcp' || req.method !== 'POST') { res.writeHead(404).end('Not found'); return; }
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true, maxRequestBodySize: 512 * 1024 });
    const startValidation = (workspace, job) => {
      const controller = new AbortController();
      const task = validationRunner(store, workspace, job, repository, python, controller.signal);
      activeJobs.set(job.id, { task, controller });
      void task.then(() => activeJobs.delete(job.id), () => activeJobs.delete(job.id));
    };
    const cancelValidation = jobId => activeJobs.get(jobId)?.controller.abort();
    const startPublication = (id, reviewId, job) => {
      const controller = new AbortController();
      const task = runPublicationPreview(store, id, reviewId, job, repository, python, controller.signal);
      activeJobs.set(job.id, { task, controller });
      void task.then(() => activeJobs.delete(job.id), () => activeJobs.delete(job.id));
    };
    const startCommit = (id, publicationId, job) => {
      const task = runPublicationCommit(store, id, publicationId, job, repository, python);
      activeJobs.set(job.id, { task, controller: new AbortController() });
      void task.then(() => activeJobs.delete(job.id), () => activeJobs.delete(job.id));
    };
    const startPush = (id, publicationId, job) => {
      const task = runPublicationPush(store, id, publicationId, job, repository, githubToken, publicationFixture);
      activeJobs.set(job.id, { task, controller: new AbortController() });
      void task.then(() => activeJobs.delete(job.id), () => activeJobs.delete(job.id));
    };
    const startPullRequest = (id, publicationId, job) => {
      const task = runPublicationPullRequest(store, id, publicationId, job, githubToken, pullRequestFetch);
      activeJobs.set(job.id, { task, controller: new AbortController() });
      void task.then(() => activeJobs.delete(job.id), () => activeJobs.delete(job.id));
    };
    const server = createServer(scopedStore, role === 'reviewer' ? 'local-reviewer' : 'local-draft-session', { repository, python, role, startValidation, startPublication, startCommit, startPush, startPullRequest, cancelValidation, publicationFixture, ciFetch, pullRequestFetch, allowPublish, githubToken });
    res.on('close', () => { void server.close(); });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch {
      if (!res.headersSent) res.writeHead(500).end('MCP request failed');
      else res.end();
    }
  });
  service.shutdown = async () => {
    stopping = true;
    const closed = new Promise(resolve => service.close(resolve));
    service.closeAllConnections();
    await closed;
    await Promise.allSettled([...activeJobs.values()].map(item => item.task));
  };
  return service;
}
