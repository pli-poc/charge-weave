# Platform harness article — light business infographics

The four PNGs in this folder are the published artwork for `the-platform-as-a-harness.md`. Each is a separate 1024 × 1536 portrait image suitable for the article and manual upload to a LinkedIn article. Keep the public filenames stable.

## Approved art direction

White background; navy typography; pale steel-blue panels; restrained blue and teal accents. Meaningful software illustrations have shallow matte depth and soft shading. Keep labels large and horizontal, use vertical space, and avoid neon, luminous edges, dark backgrounds, cartoon robots and photographic dioramas.

The AI authoring and reasoning layer must be visible as a workspace above the model-driven runtime. It reads shared context, plans and composes supported changes, and uses scoped tools to validate and simulate drafts. Review and publication produce an approved version for the runtime. Business services continue to own operational writes.

## Artwork and generation briefs

- `platform-layers.png` — “Where AI shapes the platform.” The approved style reference. Human request; AI authoring and reasoning; review and version publication; shared definitions, executable work, connections and records, browser proving ground; independent adapter modes. Preserve ontology, constraints, policies, model packages, workflows/state, forms/tasks, services, adapters, data/history and evidence.
- `shared-harness.png` — “The same request. Two ways to build.” Vertically compare separate agent-assisted project outputs with one shared authoring workspace and reusable model, policy and capability contracts. Show duplicated assumptions and project-specific checks as risks of fragmentation, not inevitable properties of coding agents. Keep the explicit role for prototypes and new platform capabilities.
- `browser-proving-ground.png` — “Prove the software in the browser.” Illustrate a whole virtual journey, seeded data, virtual time, fault injection and replay. Show the short change/run/inspect/replay loop, AI-assisted endpoint mapping, and mode selection per boundary. Virtual, observe, hybrid and live are alternatives, not mandatory rollout stages. Retain the operational-testing qualification.
- `ai-extension-loop.png` — “One request. A coordinated platform change.” Follow supplier onboarding through model and policy changes, process composition, human task forms and risk-service mapping. Test complete, missing-evidence, delayed-response and rejected-approval scenarios. Inspect, approve and publish the proposal, then show policy, workflow, services and evidence operating with approved definitions.

These are AI-generated editorial illustrations produced with the built-in image-generation tool and reviewed visually. They explain concepts, not exact executable topology. The PNGs are the maintained assets; image generation is not pixel-deterministic. Git history retains earlier revisions. The previous Pillow renderer was removed because it generated an obsolete visual style and would overwrite this approved artwork.

For future edits, use the current PNG as the edit source, preserve the approved palette and typography, and inspect every label and relationship before replacing the file. A new companion should use `platform-layers.png` as its style reference. No generation step, credentials or image API call belongs in CI.

## Validation

Run `npm run check:blog --prefix website` and the normal website/console builds from the repository root. Then run `node scripts/check-blog-content.mjs --built` with `website/` as the working directory. GitHub Actions selects its article-only publishing path when all changes remain under `content/blog/`.

The article's Copy Markdown action supplies the public image links; upload the four PNGs individually when publishing on LinkedIn. There are no Markdown tables in this article.
