# Contributing to ChargeWeave

All project work belongs in [pli-poc/charge-weave](https://github.com/pli-poc/charge-weave).
Commit source changes, generated schemas, meaningful tests and documentation together.
See [the development guide](docs/development.md) for source ownership and commands.

Use a focused subject and a commit body describing why the change is needed,
what it changes, which checks ran, and remaining limitations. Push completed
commits to GitHub and inspect the resulting Actions run. Never call a queued or
running workflow successful. Respect repository branch protection if enabled.

For model changes, regenerate with `python tools/build_all.py`. Inspect the
semantic change, not serialization order or random blank-node IDs. The isolated
build gate checks RDF graph equivalence and exact non-RDF outputs. Include a
counterexample for each new invariant and positive/boundary coverage as needed.

GitHub Actions runs all current ontology gates on pushes, pull requests and manual
runs. Reports are uploaded even when a gate fails; the verified package is emitted
only when every gate succeeds. CI is configured; merge restrictions are a separate
GitHub repository setting and are not implied by this workflow.

Keep historical benchmark evidence clearly dated. A resource mapping is not proof
of field parity, implemented behavior, business completeness, or legal compliance.
