import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createModelProvider } from "./provider.js";

const hash = (value) => createHash("sha256").update(value).digest("hex");
const response = (body) => ({
  ok: true,
  status: 200,
  arrayBuffer: async () => new TextEncoder().encode(body).buffer,
});

function fixtureProvider({ modelOverrides = {}, manifestOverrides = {}, tamperPackageBytes = false } = {}) {
  const graph = JSON.stringify({ "cd:ChargeSession": [["rdf:type", "owl:Class", "ontology.ttl"]] });
  const model = {
    packageId: "chargeweave",
    version: "1.0",
    sourceHash: "source-hash",
    triplesHash: hash(graph),
    triplesFile: "model-packages/pkg/triples.json",
    ...modelOverrides,
  };
  const modelJson = JSON.stringify(model);
  const manifest = {
    contractVersion: 1,
    packageId: "chargeweave",
    packagePath: "model-packages/pkg/model.json",
    packageHash: hash(modelJson),
    modelVersion: "1.0",
    sourceHash: "source-hash",
    triplesHash: hash(graph),
    ...manifestOverrides,
  };
  const files = new Map([
    ["http://localhost/model-packages/manifest.json", JSON.stringify(manifest)],
    [
      "http://localhost/model-packages/pkg/model.json",
      tamperPackageBytes ? JSON.stringify({ ...model, version: "tampered" }) : modelJson,
    ],
    ["http://localhost/model-packages/pkg/triples.json", graph],
  ]);
  const requests = [];
  const provider = createModelProvider({
    fetchImpl: async (url) => {
      requests.push(url);
      const body = files.get(url);
      return body ? response(body) : { ok: false, status: 404 };
    },
  });
  return { provider, requests };
}

test("static model provider loads and caches one immutable package and graph", async () => {
  const { provider, requests } = fixtureProvider();
  const [modelA, modelB] = await Promise.all([
    provider.loadModelPackage(),
    provider.loadModelPackage(),
  ]);
  const graph = await provider.loadOntologyGraph();
  assert.equal(modelA, modelB);
  assert.deepEqual(Object.keys(graph), ["cd:ChargeSession"]);
  assert.equal(requests.length, 3);
});

test("static model provider rejects manifest drift and retries after a failed load", async () => {
  const { provider } = fixtureProvider({ manifestOverrides: { sourceHash: "old-hash" } });
  await assert.rejects(provider.loadModelPackage(), /does not match its manifest/);
  await assert.rejects(provider.loadModelPackage(), /does not match its manifest/);
});

test("static model provider verifies package bytes and rejects unknown modes", async () => {
  const { provider } = fixtureProvider({ tamperPackageBytes: true });
  await assert.rejects(provider.loadModelPackage(), /integrity check failed/);
  assert.throws(
    () => createModelProvider({ mode: "database" }),
    /not registered: database/,
  );
});
