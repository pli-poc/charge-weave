# Pre-fix adversarial observations

These six reports were captured against model commit `d4348146fec3bc054a8a869c731f9d1c130d6a27` before changing any ontology or validation source. The test harness and cases were new uncommitted inputs. `cases.json` contains that exact initial registry, matching each report's `caseDigest`.

Each family had a legitimate and a contradictory full snapshot. Both conformed, so one of two business expectations failed in every family. This is deliberately preserved failure evidence, not a current passing release report.

To reproduce, check out the stated commit in a separate worktree, copy the current `tools/test_adversarial.py` into its tools directory, and copy this `cases.json` to its `tests/adversarial-cases.json`. Install the pinned dependencies and run `python tools/test_adversarial.py --family FAMILY --capture-baseline` for access, credit, allowance, dunning, history and hold. Baseline capture records observations and intentionally exits successfully even when business expectations fail. Release CI never uses that mode.

The current registry adds two legitimate boundary cases. Fresh release reports are produced by Actions, not by editing these historical observations.

## Refined replays

The initial allowance fixture omitted the explicit session customer. `allowance-recheck-cases.json` adds that attribution, and its recheck report confirms the cross-customer contradiction still passed the unchanged model. `dunning-recheck-cases.json` uses a nonzero overdue invoice and matching line/position values; its recheck also confirms the bypass. Each replay was performed in a detached worktree at the same original commit. `index.json` maps every report to the exact registry matching its digest. To reproduce either replay, copy the corresponding registry instead of `cases.json`.
