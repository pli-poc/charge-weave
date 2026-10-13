import { clone, sha256, stable, validate } from "./contracts.js";
export const MCP_VERSION = "2026-07-28";
// Bounded subset of the pinned, request-scoped Streamable HTTP revision. No legacy
// initialize/session fallback or automatic server-granted authority is inferred.
export function createMCPProvider({ endpoint, authorization, fetch = globalThis.fetch, name = "external", maxBytes = 1000000 }) {
  const url = new URL(endpoint);
  if (url.protocol !== "https:" && !["127.0.0.1", "localhost"].includes(url.hostname)) throw Error("MCP provider requires HTTPS");
  let request = 0, pinned = null;
  async function rpc(method, params, signal) {
    const id = ++request;
    const body = { jsonrpc: "2.0", id, method, params: { ...params, _meta: { "io.modelcontextprotocol/protocolVersion": MCP_VERSION, "io.modelcontextprotocol/clientInfo": { name: "syntriq-engineering", version: "1.0.0" }, "io.modelcontextprotocol/clientCapabilities": {} } } };
    const boundedSignal = signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000);
    const r = await fetch(url.href, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", "MCP-Protocol-Version": MCP_VERSION, "Mcp-Method": method, ...(params.name ? { "Mcp-Name": params.name } : {}), ...(authorization ? { Authorization: `Bearer ${authorization}` } : {}) }, body: JSON.stringify(body), signal: boundedSignal });
    if (!r.ok) throw Error(`MCP provider rejected request (${r.status}); pinned protocol ${MCP_VERSION}`);
    const reader = r.body.getReader(), decoder = new TextDecoder(); let text = "", size = 0;
    try { while (true) { const next = await reader.read(); if (next.done) break; size += next.value.byteLength; if (size > maxBytes) throw Error("MCP response budget exceeded"); text += decoder.decode(next.value, { stream: true }); } }
    finally { await reader.cancel().catch(() => {}); }
    let response;
    if (r.headers.get("content-type")?.includes("text/event-stream")) {
      for (const frame of text.replaceAll("\r\n", "\n").split("\n\n")) {
        const data = frame.split("\n").filter(l => l.startsWith("data:")).map(l => l.slice(5).trimStart()).join("\n");
        if (!data) continue; const item = JSON.parse(data);
        if (item.id === id) response = item; else if (item.method && item.id !== undefined) throw Error("Unexpected server request");
      }
    } else response = JSON.parse(text);
    if (!response || response.jsonrpc !== "2.0" || response.id !== id || response.error) throw Error(response?.error?.message ?? "Missing or mismatched MCP response");
    if (response.result?.resultType !== "complete") throw Error("External provider requires input or an unsupported continuation");
    return response.result;
  }
  async function list(signal) {
    const tools = []; let cursor;
    for (let page = 0; page < 5; page++) {
      const result = await rpc("tools/list", cursor ? { cursor } : {}, signal);
      if (!Array.isArray(result.tools) || tools.length + result.tools.length > 100) throw Error("Invalid provider catalogue");
      tools.push(...result.tools); cursor = result.nextCursor;
      if (!cursor) return tools.sort((a,b) => a.name.localeCompare(b.name));
    }
    throw Error("Provider catalogue page budget exceeded");
  }
  return {
    async discover(signal) { const tools = await list(signal); pinned = { tools, digest: await sha256(tools) }; return { name, protocolVersion: MCP_VERSION, catalogDigest: pinned.digest, tools: clone(tools) }; },
    async call(toolName, args, signal) {
      if (!pinned) throw Error("Provider discovery required");
      const current = await list(signal); if (await sha256(current) !== pinned.digest) throw Error("Provider contract changed; reconnect before invocation");
      const tool = pinned.tools.find(t => t.name === toolName);
      if (!tool?.inputSchema || !tool?.outputSchema) throw Error("Explicit input/output schemas required");
      validate(tool.inputSchema, args);
      const result = await rpc("tools/call", { name: toolName, arguments: args }, signal);
      if (result.isError || !result.structuredContent) throw Error("External tool failed or lacks structured evidence");
      validate(tool.outputSchema, result.structuredContent, "external-result");
      return clone(result.structuredContent);
    },
  };
}
export async function registerMCPReadTools({ broker, provider, allowedTools, signal }) {
  const catalogue = await provider.discover(signal);
  const accepted = [];
  for (const name of allowedTools) {
    const tool = catalogue.tools.find(t => t.name === name);
    if (!tool?.outputSchema || !/^[a-z][a-z0-9_]*$/.test(name)) throw Error("Unsupported selected MCP tool");
    // Only tools with an explicitly supported schema profile enter the broker.
    function schemaCheck(schema) {
      const keys = ["type", "properties", "required", "additionalProperties", "items", "enum", "minimum", "maximum", "minLength", "maxLength", "minItems", "maxItems", "description"];
      if (Object.keys(schema).some(k => !keys.includes(k))) throw Error("MCP tool schema is outside the supported profile");
      Object.values(schema.properties ?? {}).forEach(schemaCheck); if (schema.items) schemaCheck(schema.items);
    }
    schemaCheck(tool.inputSchema); schemaCheck(tool.outputSchema);
    const id = `external.mcp.${name}`;
    broker.register({ id, description: `Selected external read: ${tool.description ?? name}`, effect: "read", inputSchema: tool.inputSchema, outputSchema: tool.outputSchema, implementationVersion: `${MCP_VERSION}:${catalogue.catalogDigest}` }, (args, host) => provider.call(name, args, host.signal));
    accepted.push(id);
  }
  return { protocolVersion: MCP_VERSION, catalogDigest: catalogue.catalogDigest, registered: accepted };
}
export function createVerificationProvider({ url, expectedRepository, fetch = globalThis.fetch }) {
  const endpoint = new URL(url, globalThis.location?.href ?? "http://localhost");
  if (endpoint.protocol !== "https:" && !["127.0.0.1", "localhost"].includes(endpoint.hostname)) throw Error("Verification source requires HTTPS");
  return { async inspect({ commit, candidateDigest }, signal) {
    if (!/^[a-f0-9]{40}$/.test(commit) || !/^[a-f0-9]{64}$/.test(candidateDigest)) throw Error("Pinned commit and candidate digest required");
    const r = await fetch(endpoint.href, { cache: "no-store", signal }); if (!r.ok) throw Error(`Verification provider unavailable (${r.status})`);
    const report = await r.json();
    if (report.format !== 1 || report.repository !== expectedRepository || report.commit !== commit || !report.packages?.includes(candidateDigest)) throw Error("Verification evidence belongs to a different source or candidate");
    const required = ["runtime", "relay", "console", "browser", "protected-build"];
    const missing = required.filter(id => report.checks?.[id] !== "passed");
    return { ...clone(report), verified: missing.length === 0, missing, scope: "deployed-commit-checks" };
  } };
}
