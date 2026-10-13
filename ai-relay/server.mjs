import { createServer } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
const TOOL_NAMES = new Set(["capability_search", "context_catalog", "context_search", "context_read", "context_related", "candidate_inspect", "candidate_apply_change", "candidate_reset", "model_compile_supported", "model_capability_report", "scenario_list", "scenario_run", "evidence_read", "evidence_compare"]);
function equal(a, b) { const x = Buffer.from(a ?? ""), y = Buffer.from(b ?? ""); return x.length === y.length && x.length > 0 && timingSafeEqual(x, y); }
export function createRelay({ apiKey, accessToken, models, origins, fetch = globalThis.fetch, maxRequests = 30, maxConcurrent = 2, maxBytes = 180000, promptCache = false, compaction = false, extraFunctionNames = [], now = () => Date.now() }) {
  if (!apiKey || !accessToken || accessToken.length < 24 || !models?.length || !origins?.length) throw Error("Relay requires server credentials, a strong session token, allowed models and origins");
  let active = 0, windowAt = now(), requests = 0;
  const send = (res, status, value) => { res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" }); res.end(JSON.stringify(value)); };
  return createServer(async (req, res) => {
    const origin = req.headers.origin;
    if (!origins.includes(origin)) return send(res, 403, { error: "Origin is not enabled" });
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
    if (!equal(req.headers.authorization, `Bearer ${accessToken}`)) return send(res, 401, { error: "Authentication required" });
    if (req.method === "GET" && req.url === "/ai/capabilities") return send(res, 200, { version: "1.0.0", provider: "openai-responses", models, features: { promptCache, compaction, hostedTools: false, decisions: false }, limits: { maxRequestsPerMinute: maxRequests, maxConcurrent, maxBytes, maxOutputTokens: 5000 } });
    const routes = { "/ai/responses": "responses", ...(compaction ? { "/ai/compact": "responses/compact" } : {}) };
    if (req.method !== "POST" || !routes[req.url]) return send(res, 404, { error: "Endpoint not enabled" });
    if (now() - windowAt > 60000) { windowAt = now(); requests = 0; }
    if (requests >= maxRequests || active >= maxConcurrent) return send(res, 429, { error: "Relay budget exhausted" });
    requests++; active++;
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 120000);
    res.on("close", () => controller.abort());
    try {
      const chunks = []; let size = 0;
      for await (const c of req) { size += c.length; if (size > maxBytes) { send(res, 413, { error: "Request budget exceeded" }); return; } chunks.push(c); }
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      if (body.max_output_tokens !== undefined && (!Number.isSafeInteger(body.max_output_tokens) || body.max_output_tokens < 1)) return send(res, 400, { error: "Invalid output-token budget" });
      const allowedKeys = new Set(routes[req.url] === "responses/compact" ? ["model", "input"] : ["model", "store", "stream", "parallel_tool_calls", "max_output_tokens", "input", "tools", "text", ...(promptCache ? ["prompt_cache_options"] : [])]);
      if (Object.keys(body).some(k => !allowedKeys.has(k)) || !models.includes(body.model) || !Array.isArray(body.input) || body.input.length > 240 || body.store !== undefined && body.store !== false) return send(res, 400, { error: "Request contract rejected" });
      if (body.tools && (!Array.isArray(body.tools) || body.tools.length > 30 || body.tools.some(t => t.type !== "function" || !(TOOL_NAMES.has(t.name) || extraFunctionNames.includes(t.name)) || t.strict !== true))) return send(res, 400, { error: "Tool is not enabled" });
      if (!promptCache && body.input.some(i => i.content?.some?.(c => c.prompt_cache_breakpoint))) return send(res, 400, { error: "Prompt-cache feature is not enabled" });
      const upstream = { ...body, ...(routes[req.url] === "responses" ? { store: false, max_output_tokens: Math.min(5000, Math.max(1, body.max_output_tokens ?? 5000)), parallel_tool_calls: false } : {}) };
      const r = await fetch(`https://api.openai.com/v1/${routes[req.url]}`, { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify(upstream), signal: controller.signal });
      if (!r.ok) return send(res, r.status, { error: "OpenAI rejected the relay request", requestId: r.headers.get("x-request-id") ?? null });
      res.writeHead(200, { "Content-Type": r.headers.get("content-type") ?? "application/json", "Cache-Control": "no-store", "X-Accel-Buffering": "no" });
      let outputBytes = 0;
      for await (const chunk of r.body) {
        outputBytes += chunk.byteLength; if (outputBytes > 8000000) throw Error("Upstream output budget exceeded");
        if (!res.write(chunk)) await new Promise((resolve, reject) => { res.once("drain", resolve); res.once("close", () => reject(Error("Disconnected"))); });
      }
      res.end();
    } catch {
      if (!res.headersSent) send(res, 502, { error: "Relay request failed or was interrupted" }); else res.destroy();
    } finally { clearTimeout(timer); active--; }
  });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const split = s => (s ?? "").split(",").map(s => s.trim()).filter(Boolean);
  const server = createRelay({ apiKey: process.env.OPENAI_API_KEY, accessToken: process.env.WORKBENCH_ACCESS_TOKEN, models: split(process.env.OPENAI_ALLOWED_MODELS), origins: split(process.env.WORKBENCH_ALLOWED_ORIGINS), promptCache: process.env.OPENAI_PROMPT_CACHE === "true", compaction: process.env.OPENAI_COMPACTION === "true", extraFunctionNames: split(process.env.WORKBENCH_EXTRA_FUNCTIONS) });
  server.listen(Number(process.env.PORT ?? 8787), "0.0.0.0", () => console.log("Engineering AI relay listening"));
}
