import test from "node:test";
import assert from "node:assert/strict";
import { createRelay } from "./server.mjs";
const token = "test-session-token-at-least-24-characters";
test("relay authenticates, enforces feature/model/tool budgets and keeps upstream credentials server-side", async () => {
  const seen = [];
  const server = createRelay({ apiKey: "server-only-secret", accessToken: token, models: ["allowed-model"], origins: ["https://host.example"], fetch: async (url, init) => { seen.push({ url, init }); return new Response(JSON.stringify({ status: "completed", output: [] }), { headers: { "content-type": "application/json" } }); } });
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  try {
    const url = `http://127.0.0.1:${server.address().port}/ai`;
    const headers = { Origin: "https://host.example", Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    assert.equal((await fetch(`${url}/capabilities`, { headers: { Origin: "https://host.example" } })).status, 401);
    assert.equal((await fetch(`${url}/capabilities`, { headers: { ...headers, Origin: "https://other.example" } })).status, 403);
    const capabilities = await (await fetch(`${url}/capabilities`, { headers })).json(); assert.deepEqual(capabilities.models, ["allowed-model"]);
    const body = { model: "allowed-model", input: [], tools: [], store: false, stream: false, max_output_tokens: 999999 };
    const post = b => fetch(`${url}/responses`, { method: "POST", headers, body: JSON.stringify(b) });
    assert.equal((await post({ ...body, model: "not-allowed" })).status, 400);
    assert.equal((await post({ ...body, tools: [{ type: "web_search" }] })).status, 400);
    assert.equal((await post({ ...body, previous_response_id: "hidden-state" })).status, 400);
    assert.equal((await post({ ...body, max_output_tokens: "unbounded" })).status, 400);
    const r = await post(body); assert.equal(r.status, 200); assert.ok(!(await r.text()).includes("server-only-secret"));
    assert.equal(seen[0].url, "https://api.openai.com/v1/responses"); assert.equal(JSON.parse(seen[0].init.body).max_output_tokens, 5000);
    assert.equal(seen[0].init.headers.Authorization, "Bearer server-only-secret");
  } finally { await new Promise(r => server.close(r)); }
});
test("relay quota rejection never silently invokes an upstream provider", async () => {
  let requests = 0;
  const server = createRelay({ apiKey: "server-only-secret", accessToken: token, models: ["m"], origins: ["https://host.example"], maxRequests: 1, fetch: async () => { requests++; return new Response('{}'); } });
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  try {
    const url = `http://127.0.0.1:${server.address().port}/ai/responses`, init = { method: "POST", headers: { Origin: "https://host.example", Authorization: `Bearer ${token}` }, body: JSON.stringify({ model: "m", input: [] }) };
    assert.equal((await fetch(url, init)).status, 200); assert.equal((await fetch(url, init)).status, 429); assert.equal(requests, 1);
  } finally { await new Promise(r => server.close(r)); }
});
