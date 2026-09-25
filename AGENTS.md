# ChargeWeave working agreement

- The canonical repository is https://github.com/pli-poc/charge-weave.
- Commit completed work and push it to GitHub. Do not leave the deliverable only in a local workspace or ZIP archive. Respect branch protection; use a pull request if direct pushes are disallowed. Never force-push shared branches.
- Use descriptive commit subjects and bodies explaining the problem, changes, validation, and any remaining limitations.
- GitHub Actions is the shared verification authority. Run the relevant checks locally when useful, then inspect the workflow for the pushed commit. Fix failures and distinguish pending checks from passing checks.
- Keep model sources, generators, generated schemas, validation rules, tests, research evidence, and documentation together. Regenerate derived artifacts after changing a source; use `python tools/check_generated.py` to detect drift.
- Use `model/domain.schema` for class contracts, `tools/build_rules.py` for business rules, and the other generators documented in `docs/development.md`. Do not edit only a generated artifact.
- For a new business invariant, add a deliberate violation to `tests/negative-cases.json` and suitable positive or boundary coverage. Preserve the all-class positive fixture.
- Do not equate OWL consistency, SHACL conformance, or AMPECO endpoint mapping with business completeness. An independent actor/journey/lifecycle/exception audit is still required; track its evidence as described in `docs/business-domain-audit.md`.
- Keep the existing development IRIs stable until an explicit namespace migration is agreed and implemented consistently. The product name is ChargeWeave; the inherited `cd:` prefix is not a production namespace registration.
- Never commit credentials, customer data, local environments, caches, or machine-specific paths. CI requires no production accounts or secrets.
