# Model package provider

**Status:** Static web provider implemented for the browser explorer. Database or service-backed providers are future adapters.

## Purpose

Model-driven features need a controlled way to load the definitions they use. The model provider retrieves a coherent, versioned package containing the ontology catalogue, declared rules, temporal policy, vocabulary metadata and RDF graph. Consumers request the package through a small interface instead of choosing where files live.

The package contains shared definitions. It does not contain tenant-owned business records, work items, workflow instances or access grants. Those have separate domain, workflow, identity and storage boundaries.

## Current request path

The website build derives a package from the model sources and publishes a manifest plus immutable JSON assets under `website/public/model-packages/`. The browser's `static-web` provider loads the manifest, verifies the package and graph SHA-256 hashes, checks that their model version and source revision agree, and caches the loaded package for the page session. The ontology explorer consumes metadata synchronously after application startup and requests the graph through the same provider.

```text
model sources → package builder → manifest + immutable artifacts
                                  ↓
browser model consumers ← ModelProvider ← static web assets
```

`website/src/model/provider.js` exposes `createModelProvider()` with these operations:

| Operation | Result |
|---|---|
| `loadModelPackage()` | Versioned metadata, classes, rules, temporal settings and graph reference |
| `loadOntologyGraph()` | Parsed subject index for the same pinned package |

The provider rejects unknown modes, incomplete manifests, mismatched revisions and invalid artifact hashes. Failed fetches clear their cache so the next attempt can retry. The browser includes the generated snapshot only as a network-free fallback for Node-based tests and developer tooling; production browser consumers resolve the published package at startup.

## Provider matrix

| Provider mode | Backing source | Status | Intended use |
|---|---|---|---|
| `static-web` | Manifest and immutable JSON assets deployed with the site | Implemented | Current public model explorer and browser app |
| `model-service` or database registry | Authorized API backed by a package registry or database | Future | Governed publishing, tenant-aware package access and server-side consumers |

The future provider should return the same immutable package contract. The database is an implementation detail behind that port; model consumers should not issue direct database queries. A service-backed implementation will additionally need authentication, publication lifecycle, tenant/package visibility, compatibility checks, cache invalidation and retention for historical workflow references.

## Pinning and compatibility

The active manifest points at one package revision. Workflow and task definitions should pin the compatible model, shapes and rule-set revisions when they are published. A running workflow must keep using its pinned revisions even after a newer package becomes active. The current explorer loads one active package and does not yet provide multi-version workflow resolution; that belongs in the future workflow host and model registry contract.

Hashes detect accidental or inconsistent asset changes; they do not establish who published a package. Production publication needs a trusted deployment or signed registry record, plus server-side authorization. Client validation is useful for feedback and consistency but never grants access or authorizes a business write.

## Source and generated files

- Editable model sources: `model/`, `ontology/`, `validation/`, `queries/`.
- Builder: `website/scripts/build-model.mjs`.
- Provider interface and static implementation: `website/src/model/provider.js`.
- Browser model access: `website/src/model-utils.js`.
- Generated compatibility snapshot: `website/src/generated/model.json`.
- Published package manifest and assets: `website/public/model-packages/`.
- Provider contract tests: `website/src/model/provider.test.js`.

Run the website build to regenerate the static package. Do not hand-edit generated package artifacts. The ontology verification pipeline remains authoritative for model and business-rule correctness; the provider integrity checks only prove that the loaded artifacts match their manifest.
