# Focused modelling test matrix

The **Focused modelling matrix** workflow provides separately named, parallel
pull-request feedback on common modelling regressions. It is additive: the
existing Ontology CI, Ontology authoring and protected website build remain the
verification authorities, with their full checks and publication safeguards.
Passing this matrix alone does not prove a release is ready.

| Axis | Jobs | Coverage |
| --- | --- | --- |
| Model | Generated consistency; business rules | Source-to-generated drift and business rule fixtures |
| Backend | Ubuntu 24.04; Windows Server 2022 | Workspace, MCP, HTTP and pairing contracts |
| Browser | Desktop; mobile emulation on Ubuntu | A small set of modelling journeys using the existing Chromium Playwright projects |

The workflow runs on pull requests and can also be launched with **Run workflow**. Each job checks out the pull-request
head SHA (or the dispatched SHA). Matrix failures do not cancel sibling jobs.
Browser traces and reports are retained on failure. The tests use synthetic or
in-memory workspaces; they do not publish a model or call a production account.

These focused checks duplicate a subset of existing jobs during evaluation, so
they increase Actions consumption. Parallelism can shorten time to a focused
signal but cannot shorten the time to the existing required checks. Measure the
results before considering any consolidation, and preserve the protected site
artifact and exact-commit verification if those workflows are later changed.

Desktop and mobile currently both use Chromium. Firefox, WebKit, additional
viewport sizes and scheduled stress or performance checks are not configured by
this workflow; they need browser-specific validation before becoming gates.
The existing full suites cover more cases than this smoke matrix.
