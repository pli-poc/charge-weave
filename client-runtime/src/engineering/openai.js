import { clone } from "./contracts.js";
import { PRIMER, RESULT_SCHEMA } from "./coordinator.js";
export async function readResponseStream(response, { onEvent = () => {}, maxBytes = 8000000 } = {}) {
  if (!response.ok) throw Error(`AI relay rejected request (${response.status})`);
  if (!response.headers.get("content-type")?.includes("text/event-stream")) {
    const value = await response.json(); if (!value.output) throw Error("Invalid relay response"); return value;
  }
  const reader = response.body.getReader(), decoder = new TextDecoder();
  let buffer = "", bytes = 0, completed = null;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      bytes += value.byteLength; if (bytes > maxBytes) throw Error("Response stream budget exceeded");
      buffer += decoder.decode(value, { stream: true }).replaceAll("\r\n", "\n");
      let end;
      while ((end = buffer.indexOf("\n\n")) >= 0) {
        const frame = buffer.slice(0, end); buffer = buffer.slice(end + 2);
        const data = frame.split("\n").filter(l => l.startsWith("data:")).map(l => l.slice(5).trimStart()).join("\n");
        if (!data || data === "[DONE]") continue;
        const event = JSON.parse(data); onEvent(event);
        if (["error", "response.failed", "response.incomplete"].includes(event.type)) throw Error(event.error?.message ?? event.response?.error?.message ?? "AI stream failed or incomplete");
        if (event.type === "response.completed") completed = event.response;
      }
    }
  } finally { await reader.cancel().catch(() => {}); }
  if (!completed) throw Error("Interrupted stream: completed response missing");
  return completed;
}
export function createOpenAIAdapter({ endpoint, model, authorization, fetch = globalThis.fetch, onEvent, cache = false, compact = false }) {
  const url = new URL(endpoint, globalThis.location?.href ?? "http://localhost");
  if (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname)) throw Error("AI relay requires HTTPS");
  const base = url.href.replace(/\/$/, "");
  const headers = () => ({ "Content-Type": "application/json", ...(authorization ? { Authorization: `Bearer ${authorization}` } : {}) });
  let capabilities;
  async function connect() {
    const r = await fetch(`${base}/capabilities`, { headers: headers(), credentials: "include" });
    if (!r.ok) throw Error(`AI connection failed (${r.status})`);
    capabilities = await r.json();
    if (!capabilities.models?.includes(model)) throw Error("Model is not enabled by this relay");
    return clone(capabilities);
  }
  return {
    id: `openai:${model}`, connect,
    get canCompact() { return compact && capabilities?.features?.compaction === true; },
    async next({ task, packet, tools, signal }) {
      if (!capabilities) await connect();
      const input = [
        { role: "developer", content: [{ type: "input_text", text: PRIMER, ...(cache && capabilities.features?.promptCache ? { prompt_cache_breakpoint: { mode: "explicit" } } : {}) }] },
        ...task.continuation,
        { role: "user", content: JSON.stringify(packet) },
      ];
      const body = { model, store: false, stream: true, parallel_tool_calls: false, max_output_tokens: 5000, input, tools, text: { format: { type: "json_schema", name: "engineering_result", strict: true, schema: RESULT_SCHEMA } }, ...(cache && capabilities.features?.promptCache ? { prompt_cache_options: { mode: "implicit" } } : {}) };
      return readResponseStream(await fetch(`${base}/responses`, { method: "POST", headers: headers(), credentials: "include", body: JSON.stringify(body), signal }), { onEvent });
    },
    async compact(input, signal) {
      if (!compact || !capabilities?.features?.compaction) throw Error("Compaction is not enabled");
      const r = await fetch(`${base}/compact`, { method: "POST", headers: headers(), credentials: "include", body: JSON.stringify({ model, input }), signal });
      if (!r.ok) throw Error(`Compaction failed (${r.status})`);
      const result = await r.json(); if (!Array.isArray(result.output)) throw Error("Invalid compaction window");
      return clone(result.output);
    },
  };
}
