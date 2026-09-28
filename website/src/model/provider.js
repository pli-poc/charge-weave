const CONTRACT_VERSION = 1;
const isSha256 = (value) => typeof value === "string" && /^[a-f0-9]{64}$/i.test(value);
const isNonEmptyString = (value) => typeof value === "string" && value.length > 0;

const digest = async (bytes) => {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Model package integrity checks require Web Crypto.");
  }
  const hash = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const readJson = async (fetchImpl, url, expectedHash) => {
  const response = await fetchImpl(url);
  if (!response.ok) throw new Error(`Model package could not be loaded (${response.status}).`);
  const bytes = await response.arrayBuffer();
  if (expectedHash && (await digest(bytes)) !== expectedHash) {
    throw new Error("Model package integrity check failed.");
  }
  return JSON.parse(new TextDecoder().decode(bytes));
};

/**
 * Provider contract for immutable model packages. Providers load semantic
 * definitions and constraints; domain records and workflow run state use
 * separate service and storage ports.
 */
export function createModelProvider({
  mode = "static-web",
  baseUrl = "/",
  fetchImpl = globalThis.fetch,
} = {}) {
  if (mode !== "static-web") {
    throw new Error(`Model provider mode is not registered: ${mode}`);
  }
  if (typeof fetchImpl !== "function") {
    throw new Error("The static-web model provider requires fetch.");
  }

  let packagePromise;
  let graphPromise;
  let packageInfo;
  const url = (path) => new URL(path, new URL(baseUrl, globalThis.location?.origin ?? "http://localhost")).toString();

  const loadModelPackage = () => {
    if (!packagePromise) {
      packagePromise = (async () => {
        const manifest = await readJson(fetchImpl, url("model-packages/manifest.json"));
        if (
          manifest.contractVersion !== CONTRACT_VERSION ||
          manifest.packageId !== "chargeweave" ||
          !isNonEmptyString(manifest.packagePath) ||
          !isSha256(manifest.packageHash) ||
          !isNonEmptyString(manifest.modelVersion) ||
          !isSha256(manifest.sourceHash) ||
          !isSha256(manifest.triplesHash)
        ) {
          throw new Error("Unsupported or incomplete model package manifest.");
        }
        const model = await readJson(
          fetchImpl,
          url(manifest.packagePath),
          manifest.packageHash,
        );
        if (
          model.packageId !== manifest.packageId ||
          !isNonEmptyString(model.version) ||
          !isSha256(model.sourceHash) ||
          !isSha256(model.triplesHash) ||
          !isNonEmptyString(model.triplesFile) ||
          model.version !== manifest.modelVersion ||
          model.sourceHash !== manifest.sourceHash ||
          model.triplesHash !== manifest.triplesHash
        ) {
          throw new Error("Model package does not match its manifest.");
        }
        packageInfo = manifest;
        return model;
      })().catch((error) => {
        packagePromise = undefined;
        throw error;
      });
    }
    return packagePromise;
  };

  const loadOntologyGraph = () => {
    if (!graphPromise) {
      graphPromise = (async () => {
        const model = await loadModelPackage();
        const manifest = packageInfo;
        const graph = await readJson(fetchImpl, url(model.triplesFile), manifest.triplesHash);
        return graph;
      })().catch((error) => {
        graphPromise = undefined;
        throw error;
      });
    }
    return graphPromise;
  };

  return Object.freeze({
    mode,
    loadModelPackage,
    loadOntologyGraph,
  });
}

export const modelProvider = createModelProvider({
  baseUrl: import.meta.env?.BASE_URL ?? "/",
});
