# Independent modelling-studio walkthrough

This guide prepares the human usability observation required by the [IDE plan](ontology-modelling-ide-ux-plan.md). It is not a completed review or an approval to publish. Ask a modeller who did not implement the interface to perform the tasks; an observer records what happens without supplying navigation instructions unless the participant is stuck.

## Preparation

1. Record the implementation commit, browser and version, operating system, display size, zoom level, theme and whether a mouse, keyboard or assistive technology is used. Do not record pairing codes, tokens or personal data.
2. Build the website and launch the isolated scripted maintenance demonstration using the setup in [the authoring runbook](../ontology-authoring/README.md). Use a fresh disposable demo database and its synthetic workspace; do not use a live workspace or production credentials. The observer can perform pairing before timing begins. The demo's automated agent simulation is distinct from a live Codex session.
3. Confirm the participant can see the connected workspace and that the synthetic maintenance proposal and its checks are available. If setup or a check fails, record that separately and stop rather than substituting a screenshot or fabricated result.
4. Give the participant the task statements below, one at a time. Do not explain which controls to use. Start timing when each task is given; exclude service startup and time spent waiting for checks to run, but record those waits separately.

## Participant tasks

1. Find the `WorkOrder` concept, inspect its definition and explain how it relates to a planned maintenance interval.
2. Find the proposed maintenance concept and identify its new station relationship. Inspect the responsible party and the temporal information; say what is explicitly mapped and what is unknown.
3. Make a small correction to a definition and add a relationship to an existing concept. Explain which model and draft will receive the change before applying it.
4. Find a reported validation problem in the synthetic scenario, inspect its cause, correct it and rerun the relevant check. If the fixture has not been deliberately prepared to fail, the observer should prepare it in a separate disposable workspace; do not represent an unfailed check as a failure.
5. Review the changes and check evidence. Explain the difference between accepting a draft and publishing it to GitHub. Do not accept or publish as part of this observation.
6. Reconnect or reload, then determine which acknowledged changes and unsaved input remain. Open two views, switch between them and describe whether their context was preserved.
7. Repeat the core find, select and edit actions using only a keyboard. If available, repeat with the participant's usual screen reader and note its version and configuration.

The plan's targets are 60 seconds to locate and inspect a concept, three minutes to add a relationship, and two minutes to find the cause of a mapped validation failure, excluding check execution time. These are targets, not passing results; use the exact task definitions and record timing conditions alongside the results.

## Observation record

| Task | Outcome and elapsed time | Wrong turns, hesitation or assistance | Lost input, ambiguity or defect |
|---|---|---|---|
| 1–7 | Not observed | Not observed | Not observed |

Record the number of participants and their relevant modelling experience without identifying them. For each task, record completed, completed with assistance, failed or not attempted; distinguish product wait time from participant time. Record concrete reproduction steps for any severe lost-input, ambiguous write-target, accidental-publication or blocked-core-task issue. Link fixes and retest evidence in the [execution ledger](ontology-modelling-ide-ux-status.md). A single participant or device does not establish accessibility across environments.
