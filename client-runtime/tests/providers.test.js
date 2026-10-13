import test from "node:test";
import assert from "node:assert/strict";
import { createMCPProvider, createVerificationProvider, MCP_VERSION } from "../src/engineering/providers.js";
import { object, string } from "../src/engineering/contracts.js";
test("pinned MCP provider uses per-request metadata, validates results and detects changed schemas", async () => {
  let changed = false; const seen = [];
  const provider = createMCPProvider({ endpoint: "https://provider.example/mcp", fetch: async (url, init) => {
    const body = JSON.parse(init.body); seen.push({ body, headers: init.headers });
    const result = body.method === "tools/list" ? { resultType: "complete", tools: [{ name: "research", inputSchema: object({ query: string }), outputSchema: object({ source: string }), description: changed ? "changed" : "Read" }] } : { resultType: "complete", isError: false, structuredContent: { source: "A cited original passage" } };
    return new Response(JSON.stringify({ jsonrpc: "2.0", id: body.id, result }), { headers: { "content-type": "application/json" } });
  } });
  await provider.discover(); assert.equal((await provider.call("research", { query: "standards" })).source, "A cited original passage");
  assert.equal(seen[0].headers["MCP-Protocol-Version"], MCP_VERSION); assert.equal(seen[0].body.params._meta["io.modelcontextprotocol/protocolVersion"], MCP_VERSION);
  assert.equal(seen.at(-1).headers["Mcp-Name"], "research"); changed = true;
  await assert.rejects(provider.call("research", { query: "standards" }), /contract changed/);
});
test("verification provider rejects stale/mis-scoped commit evidence and keeps skipped checks visible", async () => {
  const commit = "a".repeat(40), candidateDigest = "b".repeat(64);
  let report = { format: 1, repository: "example/source", commit, packages: [candidateDigest], checks: { runtime: "passed", relay: "passed", console: "passed", browser: "skipped", "protected-build": "passed" } };
  const provider = createVerificationProvider({ url: "https://verified.example/evidence.json", expectedRepository: "example/source", fetch: async () => new Response(JSON.stringify(report)) });
  const partial = await provider.inspect({ commit, candidateDigest }); assert.equal(partial.verified, false); assert.deepEqual(partial.missing, ["browser"]);
  report.checks.browser = "passed"; assert.equal((await provider.inspect({ commit, candidateDigest })).verified, true);
  await assert.rejects(provider.inspect({ commit: "c".repeat(40), candidateDigest }), /different source/);
});
