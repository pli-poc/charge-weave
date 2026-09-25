# Adversarial semantic review — v1.1.1

The first business audit passed its tests, but six business-first challenges exposed six real cross-record validation gaps. This review strengthens the existing invariants; it does not expand the class count or claim that all possible CPMS cases are now covered.

## Observed baseline

The unchanged model at commit `d4348146fec3bc054a8a869c731f9d1c130d6a27` accepted **all six contradictory snapshots**. Their six initial legitimate counterparts also passed. Each observation ran the full structural and business SHACL validator, not just the rule expected to catch the error.

Exact initial cases, their SHA-256 digest and the full-graph observations are preserved under [`evidence/adversarial-v1.1/`](../evidence/adversarial-v1.1/). These reports intentionally contain failed expectations. They are historical evidence of the gaps, not release-gate successes.

The initial allowance fixture did not explicitly identify the session customer. The review corrected that attribution and repeated full validation against the unchanged model in a detached worktree. The explicit customer mismatch still passed. The dunning case was also repeated with a GBP 125 overdue invoice, matching line totals, a nonzero outstanding position and escalation after the due date; it still passed. Both replays and their exact case registries are retained alongside the original observations.

## Findings and fixes

| Case | Business contradiction accepted before the fix | Strengthened invariant |
|---|---|---|
| Access | A disabled principal receives a permit using a still-active, unexpired grant | B157 blocks current operational permits for disabled identities; denied decisions remain valid |
| Credit | Two distinct full credit CDRs each reverse the same GBP 4.84 debit, producing GBP 9.68 of reversals | B133 allows at most one full credit per original debit; different debits can each be credited |
| Allowance | Usage and reservation totals balance, but the owning customer differs from the charging-session customer | B171 checks customer attribution as well as allowance, period and arithmetic |
| Dunning | An unresolved dispute exists against the liability's source invoice, but the escalation omits the optional dispute link | B143 searches recorded disputes against both the position and source record; unrelated disputes do not block it |
| History | Individually allowed suspend/resume transitions at the same timestamp refer back to one another | B164 rejects cycles in predecessor history while retaining a valid acyclic sequence at equal timestamps |
| Hold | An active hold directly names the account being disposed of, but the disposition omits its optional hold link | B154 checks independently recorded account-wide holds; a hold on another account does not block disposition |

The findings map to existing requirements BR-157, BR-133, BR-171, BR-143, BR-164 and BR-154. Their requirement records, generated documentation and rule queries have been updated together.

## Regression evidence

`tests/adversarial-cases.json` now contains **14 full-graph cases across six families**: the original 12 and two additional positive boundaries. The extra boundaries permit credits against different originals and allow a denied decision for a disabled identity. They guard against fixes that simply reject every multi-credit or disabled-identity graph.

The test runner applies explicit mutations to committed complete snapshots, preserves types and mandatory fields, assigns distinct canonical IDs to cloned records, and runs every structural/business constraint. Invalid cases must report the intended rule. Each family runs in its own Actions job. Packaging requires all six fresh reports in addition to the existing gates. Current results are in [GitHub Actions](https://github.com/pli-poc/charge-weave/actions/workflows/ontology-ci.yml).

## Policy and review limits

These are authored synthetic cases, not customer datasets or independently collected production traces. Business questions were framed separately from the earlier acceptance tests, but the same implementation agent performed this review. It is not external assurance or stakeholder sign-off.

Authorization follows the existing current operational snapshot profile: grants and principals must currently permit access. Historical authorization evidence must be evaluated with the state applicable at the decision time; mixing present disabled/revoked state with old decisions is not that snapshot. This review does not add a temporal authorization service.

The hold fix covers explicit disposition links and holds directly scoped to the subject account. It does not infer that every hold on a single invoice applies to all account data. Record-level disposal scope, legal applicability and actual erasure remain distinct implementation and policy questions.

The allowance profile attributes a charging session to the balance's customer. Cross-account sponsorship needs an explicit entitlement/beneficiary contract; an arbitrary different customer is not silently accepted. Full Credit CDRs are distinct from partial invoice credit notes and refunds.

This round challenges six interactions. It does not certify tariff/tax calculation across jurisdictions, settlement across multiple intermediaries, DST pricing, metrology corrections, concurrent commits, late financial postings after termination, or protocol behavior under equipment failure. Those require further cases and, for executable behavior, actual services. The six demonstrated loopholes are fixed and retained as regressions; exhaustive business completeness remains unproved.
