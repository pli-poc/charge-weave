import manifest from "../../../model/apps/document-review.json" with { type: "json" };
import { compileApplicationBody } from "../../../client-runtime/src/compiler/application.js";
import { sha256, stable } from "../../../client-runtime/src/engineering/contracts.js";
import { documentAdapters } from "../../../client-runtime/src/profiles/document-review/scenarios.js";
export async function createDocumentApplication(runtimeDigest) {
  const id = "model/apps/document-review.json", text = JSON.stringify(manifest, null, 2);
  const compile = async sources => {
    const candidate = JSON.parse(sources[id]);
    if (stable(candidate.capabilities) !== stable(manifest.capabilities) || candidate.namespace !== manifest.namespace) throw Error("Changing registered capabilities or namespace requires a platform build");
    const body = compileApplicationBody({ ...candidate, inputDigest: await sha256({ sources, runtimeDigest }) });
    return { ...body, digest: await sha256(body) };
  };
  return { bundle: { version: "1.0.0", sources: [{ id, label: "Document-review application manifest", editable: true, dependencies: [], mediaType: "application/json", state: "implemented", text, hash: await sha256(text) }] }, initialPackage: await compile({ [id]: text }), compile, adapters: documentAdapters };
}
