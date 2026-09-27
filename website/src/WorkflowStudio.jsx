import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  Check,
  CircleDot,
  Clock3,
  Code2,
  FileCheck2,
  GitBranch,
  Play,
  RotateCcw,
  Save,
  ShieldAlert,
} from "lucide-react";
import {
  correctionWorkflowDefinition,
  createCorrectionWorkflowRuntime,
} from "./simulation/correction-workflow.js";
import "./workflows.css";

function makeVirtualClock() {
  let now = 0;
  let nextId = 0;
  const tasks = new Map();
  return {
    setTimeout(callback, delay) {
      const id = ++nextId;
      tasks.set(id, { callback, at: now + Math.max(0, Number(delay) || 0) });
      return id;
    },
    clearTimeout(id) { tasks.delete(id); },
    advanceBy(milliseconds) {
      const until = now + milliseconds;
      while (true) {
        const next = [...tasks.entries()].sort((a, b) => a[1].at - b[1].at)[0];
        if (!next || next[1].at > until) break;
        now = next[1].at;
        tasks.delete(next[0]);
        next[1].callback();
      }
      now = until;
    },
    get now() { return now; },
  };
}

function currentState(snapshot) {
  return typeof snapshot?.value === "string" ? snapshot.value : "unknown";
}

function outgoing(step) {
  if (step.kind === "eventWait" || step.kind === "humanTask") {
    const edges = Object.entries(step.on ?? {}).map(([event, transition]) => ({ event, target: transition.target }));
    if (step.timeout) edges.push({ event: "timeout", target: step.timeout.target });
    return edges;
  }
  if (step.kind === "serviceTask") return [
    { event: "success", target: step.onDone.target },
    { event: "error", target: step.onError.target },
  ];
  if (step.kind === "decision") return [
    ...step.routes.map((route) => ({ event: route.guard, target: route.target })),
    { event: "otherwise", target: step.defaultTarget },
  ];
  return [];
}

const kindLabels = {
  eventWait: "Event wait",
  serviceTask: "Service task",
  decision: "Decision",
  humanTask: "Human task",
  end: "End",
};

function asRecords(snapshot) {
  const context = snapshot?.context ?? {};
  return [
    ["Meter evidence", context.verification?.evidenceId ?? context.meterEvidence?.id],
    ["Measured delta", context.reconciliation ? `${context.reconciliation.energyDeltaKwh.toFixed(3)} kWh` : null],
    ["Corrected charge", context.rating ? `€${context.rating.grossEur.toFixed(2)}` : null],
    ["Original credit", context.credit?.id],
    ["Corrected CDR", context.correctedCdr?.id],
  ].filter(([, value]) => value);
}

export default function WorkflowStudio() {
  const runtime = useMemo(() => createCorrectionWorkflowRuntime(), []);
  const [approvalThreshold, setApprovalThreshold] = useState(correctionWorkflowDefinition.initialContext.approvalThresholdKwh);
  const [approvalTimeout, setApprovalTimeout] = useState(correctionWorkflowDefinition.initialContext.approvalTimeoutMs / 1000);
  const [billingInputsComplete, setBillingInputsComplete] = useState(true);
  const [evidenceMode, setEvidenceMode] = useState("valid");
  const definition = useMemo(() => ({
    ...correctionWorkflowDefinition,
    initialContext: {
      ...correctionWorkflowDefinition.initialContext,
      approvalThresholdKwh: Number(approvalThreshold),
      approvalTimeoutMs: Number(approvalTimeout) * 1000,
      billingInputsComplete,
    },
  }), [approvalThreshold, approvalTimeout, billingInputsComplete]);
  const [snapshot, setSnapshot] = useState(null);
  const [started, setStarted] = useState(false);
  const [selectedStep, setSelectedStep] = useState(definition.initialStep);
  const [timeline, setTimeline] = useState([]);
  const [checkpoint, setCheckpoint] = useState(null);
  const [restoredSnapshot, setRestoredSnapshot] = useState(null);
  const [actorRevision, setActorRevision] = useState(0);
  const actorRef = useRef(null);
  const clockRef = useRef(null);
  const lastStateRef = useRef(null);
  const timelineCounter = useRef(0);

  const addTimeline = (kind, text) => {
    const clock = clockRef.current;
    timelineCounter.current += 1;
    setTimeline((items) => [
      ...items,
      { id: timelineCounter.current, elapsed: clock?.now ?? 0, kind, text },
    ].slice(-60));
  };

  useEffect(() => {
    const clock = makeVirtualClock();
    clockRef.current = clock;
    lastStateRef.current = null;
    const actor = runtime.createActor(definition, {
      clock,
      ...(restoredSnapshot ? { snapshot: restoredSnapshot } : {}),
    });
    actorRef.current = actor;
    setSnapshot(actor.getSnapshot());
    const subscription = actor.subscribe((next) => {
      setSnapshot(next);
      const state = currentState(next);
      if (state !== lastStateRef.current) {
        lastStateRef.current = state;
        setSelectedStep(state);
        timelineCounter.current += 1;
        setTimeline((items) => [...items, {
          id: timelineCounter.current,
          elapsed: clock.now,
          kind: "state",
          text: `Entered ${definition.steps.find((step) => step.id === state)?.label ?? state}`,
        }].slice(-60));
      }
    });
    if (restoredSnapshot) {
      actor.start();
      setStarted(true);
      addTimeline("checkpoint", "Restored actor snapshot with the same workflow version");
    } else {
      setStarted(false);
    }
    return () => {
      subscription.unsubscribe();
      actor.stop();
      if (actorRef.current === actor) actorRef.current = null;
    };
  }, [runtime, definition, actorRevision, restoredSnapshot]);

  const state = currentState(snapshot);
  const context = snapshot?.context ?? {};
  const selected = definition.steps.find((step) => step.id === selectedStep) ?? definition.steps[0];
  const waitingForApproval = state === "awaitingApproval";
  const waitingForEvidence = state === "awaitingEvidence";
  const waitingToValidate = state === "evidenceReceived";
  const waitingForBilling = state === "awaitingAdditionalEvidence";
  const waitingForReview = state === "manualReview";
  const visited = new Set(timeline.filter((entry) => entry.kind === "state").map((entry) => {
    const step = definition.steps.find((candidate) => `Entered ${candidate.label}` === entry.text);
    return step?.id;
  }).filter(Boolean));
  const records = asRecords(snapshot);

  const startRun = () => {
    if (started) return;
    addTimeline("event", "Run started");
    actorRef.current?.start();
    setStarted(true);
  };

  const send = (event, label) => {
    if (!started || !actorRef.current) return;
    addTimeline("event", label);
    actorRef.current.send(event);
  };

  const injectCorrection = () => {
    const valid = evidenceMode === "valid";
    send({
      type: "meter.corrected",
      evidence: {
        id: "METER-EVIDENCE-J07-1042-R1",
        signatureValid: evidenceMode !== "invalid-signature",
        sameRegisterEpoch: evidenceMode !== "register-reset",
        correctedEnergyKwh: 10.0,
        receivedAt: "2026-09-27T00:00:00.000Z",
      },
    }, `Corrected meter evidence received (${valid ? "signed, same epoch" : evidenceMode})`);
  };

  const advanceTime = () => {
    const amount = Math.max(1, Number(approvalTimeout)) * 1000;
    addTimeline("clock", `Advanced virtual time by ${Math.round(amount / 1000)} seconds`);
    clockRef.current?.advanceBy(amount);
    if (currentState(actorRef.current?.getSnapshot()) === "awaitingApproval") {
      addTimeline("event", "Timer host delivered timer.expired for the waiting approval");
      actorRef.current?.send({ type: "timer.expired" });
    }
  };

  const resetRun = () => {
    setRestoredSnapshot(null);
    setCheckpoint(null);
    setTimeline([]);
    setStarted(false);
    setSelectedStep(definition.initialStep);
    lastStateRef.current = null;
    setActorRevision((value) => value + 1);
  };

  const saveCheckpoint = () => {
    const persisted = actorRef.current?.getPersistedSnapshot();
    if (!persisted) return;
    setCheckpoint(JSON.parse(JSON.stringify(persisted)));
    addTimeline("checkpoint", "Saved a JSON-serializable XState actor checkpoint");
  };

  const restoreCheckpoint = () => {
    if (!checkpoint) return;
    setRestoredSnapshot(checkpoint);
    setActorRevision((value) => value + 1);
  };

  return (
    <div className="wf-studio-wrap container">
      <section className="wf-studio-intro">
        <div>
          <p className="eyebrow">XFlow studio · J07 + J08</p>
          <h2>Correct a charging bill without erasing its history.</h2>
          <p>
            Inspect the versioned workflow graph, adjust two policy settings, inject late meter evidence,
            and see the same definition execute through the XState actor runtime.
          </p>
        </div>
        <div className="wf-version-chip"><GitBranch size={15} />{definition.id} · v{definition.version}</div>
      </section>

      <section className="wf-config-bar" aria-label="Workflow draft settings">
        <label>
          <span>Approval threshold</span>
          <span className="wf-input-suffix"><input aria-label="Approval threshold in kWh" type="number" min="0" step="0.05" value={approvalThreshold} disabled={started} onChange={(event) => setApprovalThreshold(event.target.value)} /> kWh</span>
        </label>
        <label>
          <span>Approval deadline</span>
          <span className="wf-input-suffix"><input aria-label="Approval deadline in seconds" type="number" min="1" step="5" value={approvalTimeout} disabled={started} onChange={(event) => setApprovalTimeout(event.target.value)} /> sec</span>
        </label>
        <label>
          <span>Billing evidence</span>
          <select aria-label="Billing evidence status" value={billingInputsComplete ? "complete" : "missing"} disabled={started} onChange={(event) => setBillingInputsComplete(event.target.value === "complete")}>
            <option value="complete">Complete</option>
            <option value="missing">Missing tax / commercial proof</option>
          </select>
        </label>
        <label>
          <span>Meter evidence test</span>
          <select aria-label="Meter evidence test" value={evidenceMode} disabled={started} onChange={(event) => setEvidenceMode(event.target.value)}>
            <option value="valid">Valid signature · same epoch</option>
            <option value="invalid-signature">Invalid signature</option>
            <option value="register-reset">Register reset boundary</option>
          </select>
        </label>
      </section>

      <section className="wf-runbar" aria-label="Workflow controls">
        <div className="wf-run-controls">
          <button className="wf-primary-button" onClick={startRun} disabled={started}><Play size={15} />Start run</button>
          <button onClick={injectCorrection} disabled={!started || !waitingForEvidence}><Activity size={15} />Inject correction</button>
          <button onClick={() => send({ type: "evidence.validate" }, "Requested evidence validation")} disabled={!started || !waitingToValidate}><ShieldAlert size={15} />Validate</button>
          <button onClick={() => send({ type: "evidence.supplemented", evidence: { id: "BILLING-EVIDENCE-J08-01" } }, "Supplemental billing evidence received")} disabled={!started || !waitingForBilling}><FileCheck2 size={15} />Add billing evidence</button>
          <button onClick={() => send({ type: waitingForApproval ? "approval.granted" : "review.approved", approval: { by: "billing-operator", approvedAt: "virtual-now" } }, "Billing correction approved")} disabled={!started || (!waitingForApproval && !waitingForReview)}><Check size={15} />Approve</button>
          <button onClick={() => send({ type: waitingForApproval ? "approval.rejected" : "review.rejected" }, "Billing correction rejected")} disabled={!started || (!waitingForApproval && !waitingForReview)}><ShieldAlert size={15} />Reject</button>
          <button onClick={advanceTime} disabled={!started || !waitingForApproval}><Clock3 size={15} />Advance time</button>
          <button onClick={resetRun}><RotateCcw size={15} />Reset</button>
        </div>
        <div className="wf-status" data-status={terminal ? "done" : state}>
          <span />
          <div><small>Current state</small><strong>{definition.steps.find((step) => step.id === state)?.label ?? state}</strong></div>
        </div>
      </section>

      <section className="wf-studio-grid">
        <article className="wf-panel wf-graph-panel">
          <header className="wf-panel-heading">
            <div><p className="eyebrow">Workflow graph</p><h3>Correction process</h3></div>
            <span>{definition.steps.length} steps</span>
          </header>
          <div className="wf-graph" aria-label="XFlow workflow graph">
            {definition.steps.map((step, index) => {
              const active = state === step.id;
              const isVisited = visited.has(step.id);
              return (
                <div className="wf-node-row" key={step.id}>
                  <button
                    className={`wf-node ${active ? "is-active" : ""} ${isVisited ? "is-visited" : ""} ${step.kind === "end" ? "is-end" : ""}`}
                    aria-pressed={selectedStep === step.id}
                    onClick={() => setSelectedStep(step.id)}
                  >
                    <span className="wf-node-icon">{active ? <CircleDot size={16} /> : isVisited ? <Check size={16} /> : <span>{String(index + 1).padStart(2, "0")}</span>}</span>
                    <span className="wf-node-copy"><strong>{step.label}</strong><small>{kindLabels[step.kind]}</small></span>
                    <ArrowRight className="wf-node-open" size={15} />
                  </button>
                  <div className="wf-edge-list" aria-label={`Transitions from ${step.label}`}>
                    {outgoing(step).map((edge) => <span key={`${edge.event}:${edge.target}`}><b>{edge.event}</b><ArrowRight size={11} />{definition.steps.find((target) => target.id === edge.target)?.label ?? edge.target}</span>)}
                  </div>
                  {index < definition.steps.length - 1 && <ArrowDown className="wf-sequence-mark" size={15} aria-hidden="true" />}
                </div>
              );
            })}
          </div>
        </article>

        <aside className="wf-side-column">
          <article className="wf-panel wf-inspector">
            <header className="wf-panel-heading"><div><p className="eyebrow">Step inspector</p><h3>{selected?.label}</h3></div><Code2 size={20} /></header>
            <span className="wf-kind-pill">{kindLabels[selected?.kind]}</span>
            <p>{selected?.description}</p>
            {selected?.activity && <div className="wf-inspector-field"><span>Registered activity</span><code>{selected.activity}</code></div>}
            {selected?.assigneeRole && <div className="wf-inspector-field"><span>Responsible role</span><code>{selected.assigneeRole}</code></div>}
            {selected?.timeout && <div className="wf-inspector-field"><span>Escalation</span><code>{selected.timeout.after} → {selected.timeout.target}</code></div>}
            <div className="wf-inspector-field"><span>Business bindings</span><div className="wf-binding-list">{(selected?.domainBindings ?? []).map((binding) => <code key={binding}>cd:{binding}</code>)}</div></div>
          </article>

          <article className="wf-panel wf-execution-panel">
            <header className="wf-panel-heading"><div><p className="eyebrow">Execution context · synthetic</p><h3>Business context</h3></div><FileCheck2 size={20} /></header>
            <div className="wf-record-link"><span>Workflow run</span><strong>{context.sessionId ?? definition.initialContext.sessionId}</strong></div>
            <div className="wf-record-link"><span>Original debit</span><strong>{context.originalCdrId ?? definition.initialContext.originalCdrId} · €{Number(context.originalGrossEur ?? definition.initialContext.originalGrossEur).toFixed(2)}</strong></div>
            <div className="wf-context-results">
              {records.length ? records.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>) : <p>Inject and validate corrected meter evidence to create execution outputs.</p>}
            </div>
            {context.lastFailure && <p className="wf-error-note">{context.lastFailure}</p>}
          </article>

          <article className="wf-panel wf-checkpoint-panel">
            <header className="wf-panel-heading"><div><p className="eyebrow">Actor persistence</p><h3>Save and restore</h3></div><Save size={20} /></header>
            <p>Checkpoint this actor snapshot and restore the same waiting process at its pinned definition version.</p>
            <div className="wf-checkpoint-actions">
              <button onClick={saveCheckpoint} disabled={!started}><Save size={14} />Save checkpoint</button>
              <button onClick={restoreCheckpoint} disabled={!checkpoint}><RotateCcw size={14} />Restore</button>
            </div>
            <small>{checkpoint ? "Checkpoint saved in this Studio run." : "No checkpoint saved yet."}</small>
          </article>
        </aside>
      </section>

      <section className="wf-panel wf-timeline-panel">
        <header className="wf-panel-heading"><div><p className="eyebrow">Virtual clock · {Math.floor((clockRef.current?.now ?? 0) / 1000)} sec</p><h3>Event and state timeline</h3></div><Clock3 size={20} /></header>
        {timeline.length === 0 ? <p className="wf-empty-timeline">Start the actor to see process events, state entries and timer decisions.</p> : (
          <ol className="wf-timeline">
            {timeline.map((entry) => <li key={entry.id} data-kind={entry.kind}>
              <time>+{(entry.elapsed / 1000).toFixed(0)}s</time>
              <span className="wf-timeline-dot" />
              <div><small>{entry.kind}</small><p>{entry.text}</p></div>
            </li>)}
          </ol>
        )}
      </section>

      <section className="wf-model-note">
        <GitBranch size={20} />
        <p>
          This generic XFlow definition binds to ChargeWeave <code>ProcessExecution</code>, <code>ProcessStep</code>,
          <code> StateTransition</code> and the J07/J08 billing concepts. Studio run records are synthetic demo context;
          production hosts persist the business execution and technical actor snapshot separately.
        </p>
        <span><ArrowRight size={15} /> Same graph · browser demo host</span>
      </section>
    </div>
  );
}
