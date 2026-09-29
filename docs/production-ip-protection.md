# Production IP protection

ChargeWeave is currently deployed as a fully client-side GitHub Pages application. Browser-delivered code can always be inspected by a determined user, so this build stage is an **IP-friction control**, not a secrecy boundary.

## Production pipeline

The Pages workflow performs these stages in order:

1. install locked website and console dependencies;
2. install the pinned CI-only `javascript-obfuscator@5.8.0` tool;
3. build the operations console and website with source maps disabled;
4. copy the console into `website/dist/app`;
5. obfuscate every JavaScript bundle in the assembled Pages artifact;
6. verify that every bundle was transformed and that no source maps, TypeScript/JSX files, source-map references, or obvious source paths are deployable;
7. run the normal built-content and Playwright browser tests against the protected `dist`;
8. upload and deploy that verified `dist` only when the main-branch build succeeds.

The protection report is written to `website/.production-protection-report.json`. It contains bundle paths, protection profile names, byte counts and SHA-256 values before and after transformation. It is uploaded with CI evidence but is intentionally outside `dist` and therefore is not published to Pages.

## Protection profiles

### Application bundles

Application-owned JavaScript receives the stronger profile:

- compact output;
- identifier mangling;
- deterministic control-flow flattening;
- number-to-expression transformation;
- split strings;
- encoded and shuffled string arrays;
- repeated string-array wrappers;
- source maps disabled.

### Vendor-like bundles

Third-party and embedded-console bundles receive a compatibility profile:

- compact output;
- identifier mangling;
- encoded/shuffled string arrays;
- source maps disabled.

Aggressive control-flow rewriting is intentionally disabled for these bundles because it can materially increase bundle size and break or slow third-party libraries.

## Deliberately disabled transformations

The build does **not** rename global names or object properties, inject anti-debugger loops, disable the console, use self-defending runtime tricks, or inject dead code. Those techniques have a higher risk of breaking React, XState, Three.js, Leaflet, serialization, RDF/model handling, dynamic module behavior, and browser diagnostics.

Right-click blocking and DevTools blocking are not security controls and are not used.

## Development behavior

`npm run dev` and the normal source tree stay readable. Obfuscation is a post-build production operation only.

The regular Vite build explicitly targets ES2019, minifies JavaScript and CSS, emits content-hashed asset names, and does not generate source maps. Vendor modules are separated where practical so production protection can use the safer vendor profile.

## Client-side security boundary

Obfuscation must never be treated as protection for credentials or secrets. Do not place API keys, private tokens, production credentials, signing material, or data that must remain confidential in any browser bundle.

At the current architecture stage, ontology/model packages, workflows, simulator logic and other client-side behavior can be made harder to copy but cannot be made secret. Anything that later requires a true secrecy boundary must move behind a service/API boundary.

## Verification commands

A local production-protection run requires the same pinned tool used by CI:

```bash
cd website
npm ci
npm install --no-save --package-lock=false javascript-obfuscator@5.8.0
npm run build --prefix ../console-app
npm run build
mkdir -p dist/app
cp -R ../console-app/dist/. dist/app/
npm run protect:build
npm run check:protection
npm test
```

The Pages workflow is the authoritative gate because it tests the exact assembled artifact that will be deployed.
