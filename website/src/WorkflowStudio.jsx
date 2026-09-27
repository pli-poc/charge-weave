import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
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
    // A timeout is already represented by its event in `on`; keep one edge per
    // executable transition and let the timeout metadata describe the timer.
    return Object.entries(step.on ?? {}).map(([event, transition]) => ({ event, target: transition.target }));
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

const GRAPH = {
  width: 1400,
  height: 1000,
  nodeWidth: 220,
  nodeHeight: 84,
  bottomLane: 950,
  positions: {
    awaitingEvidence: { x: 55, y: 60 },
    evidenceReceived: { x: 55, y: 180 },
    verifyingEvidence: { x: 55, y: 300 },
    reconcilingUsage: { x: 55, y: 420 },
    assessingReadiness: { x: 55, y: 540 },
    readinessDecision: { x: 55, y: 660 },
    quarantined: { x: 405, y: 60 },
    awaitingApproval: { x: 405, y: 180 },
    approvalDecision: { x: 405, y: 300 },
    ratingDecision: { x: 405, y: 420 },
    recalculatingRating: { x: 405, y: 540 },
    awaitingAdditionalEvidence: { x: 405, y: 780 },
    manualReview: { x: 755, y: 60 },
    declined: { x: 755, y: 180 },
    completedNoChange: { x: 755, y: 300 },
    issuingCredit: { x: 755, y: 540 },
    issuingCorrectedCdr: { x: 1105, y: 540 },
    propagatingCorrection: { x: 1105, y: 660 },
    completed: { x: 1105, y: 780 },
  },
};

function cloneSteps(steps) {
  return JSON.parse(JSON.stringify(steps));
}

function stepPosition(step, index) {
  return GRAPH.positions[step.id] ?? {
    x: 55 + (Math.floor(index / 7) * 350),
    y: 60 + ((index % 7) * 120),
  };
}

function edgeGeometry(source, target, index) {
  const { nodeWidth, nodeHeight, bottomLane } = GRAPH;
  const sx = source.x;
  const sy = source.y;
  const tx = target.x;
  const ty = target.y;
  const sourceCenter = sy + nodeHeight / 2;
  const targetCenter = ty + nodeHeight / 2;
  if (sx === tx && sy === ty) {
    const startY = sourceCenter - 11;
    const endY = sourceCenter + 13;
    const loopX = sx + nodeWidth + 42;
    return {
      d: `M ${sx + nodeWidth} ${startY} C ${loopX} ${startY - 25}, ${loopX} ${endY + 25}, ${sx + nodeWidth} ${endY}`,
      labelX: loopX + 4,
      labelY: sourceCenter + ((index % 3) - 1) * 11,
    };
  }
  if (sx === tx) {
    if (Math.abs(sy - ty) <= nodeHeight + 40) {
      const downward = ty > sy;
      const startY = downward ? sy + nodeHeight : sy;
      const endY = downward ? ty : ty + nodeHeight;
      return {
        d: `M ${sx + nodeWidth / 2} ${startY} V ${endY}`,
        labelX: sx + nodeWidth / 2,
        labelY: (startY + endY) / 2 + 3,
      };
    }
    const useRightGutter = sx + nodeWidth + 35 < GRAPH.width;
    const laneX = useRightGutter ? sx + nodeWidth + 35 : sx - 35;
    const startX = useRightGutter ? sx + nodeWidth : sx;
    const endX = useRightGutter ? tx + nodeWidth : tx;
    return {
      d: `M ${startX} ${sourceCenter} H ${laneX} V ${targetCenter} H ${endX}`,
      labelX: laneX,
      labelY: (sourceCenter + targetCenter) / 2 + ((index % 3) - 1) * 11,
    };
  }
  const forward = tx > sx;
  const adjacentColumn = Math.abs(tx - sx) <= nodeWidth + 150;
  if (forward && adjacentColumn) {
    const startX = sx + nodeWidth;
    const endX = tx;
    const laneX = (startX + endX) / 2;
    return {
      d: `M ${startX} ${sourceCenter} H ${laneX} V ${targetCenter} H ${endX}`,
      labelX: laneX,
      labelY: (sourceCenter + targetCenter) / 2 + ((index % 3) - 1) * 11,
    };
  }
  const startGutter = sx + nodeWidth + 35;
  const targetGutter = tx + nodeWidth + 35;
  const startX = sx + nodeWidth;
  const endX = tx + nodeWidth;
  return {
    d: `M ${startX} ${sourceCenter} H ${startGutter} V ${bottomLane} H ${targetGutter} V ${targetCenter} H ${endX}`,
    labelX: (startGutter + targetGutter) / 2,
    labelY: bottomLane - 8 - (index % 3) * 12,
  };
}

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
  const [draftSteps, setDraftSteps] = useState(() => cloneSteps(correctionWorkflowDefinition.steps));
  const [approvalThreshold, setApprovalThreshold] = useState(correctionWorkflowDefinition.initialContext.approvalThresholdKwh);
  const [approvalTimeout, setApprovalTimeout] = useState(correctionWorkflowDefinition.initialContext.approvalTimeoutMs / 1000);
  const [billingInputsComplete, setBillingInputsComplete] = useState(true);
  const [evidenceMode, setEvidenceMode] = useState("valid");
  const [editing, setEditing] = useState(false);
  const definitionChanged = useMemo(
    () => JSON.stringify(draftSteps) !== JSON.stringify(correctionWorkflowDefinition.steps),
    [draftSteps],
  );
  const definition = useMemo(() => ({
    ...correctionWorkflowDefinition,
    version: definitionChanged ? `${correctionWorkflowDefinition.version}-draft` : correctionWorkflowDefinition.version,
    steps: draftSteps,
    initialContext: {
      ...correctionWorkflowDefinition.initialContext,
      approvalThresholdKwh: Number(approvalThreshold),
      approvalTimeoutMs: Number(approvalTimeout) * 1000,
      billingInputsComplete,
    },
  }), [draftSteps, approvalThreshold, approvalTimeout, billingInputsComplete, definitionChanged]);
  const definitionKey = useMemo(() => JSON.stringify(definition), [definition]);
  const definitionErrors = useMemo(() => runtime.validate(definition), [runtime, definition]);
  const [snapshot, setSnapshot] = useState(null);
  const [started, setStarted] = useState(false);
  const [selectedStep, setSelectedStep] = useState(definition.initialStep);
  const [timeline, setTimeline] = useState([]);
  const [checkpoint, setCheckpoint] = useState(null);
  const [restoredCheckpoint, setRestoredCheckpoint] = useState(null);
  const [actorRevision, setActorRevision] = useState(0);
  const actorRef = useRef(null);
  const clockRef = useRef(null);
  const lastStateRef = useRef(null);
  const timelineCounter = useRef(0);

  const updateStep = (stepId, patch) => {
    setDraftSteps((steps) => steps.map((step) => step.id === stepId ? { ...step, ...patch } : step));
  };

  const updateTransitionTarget = (stepId, event, target) => {
    setDraftSteps((steps) => steps.map((step) => {
      if (step.id !== stepId) return step;
      if (step.kind === "decision") {
        return event === "otherwise"
          ? { ...step, defaultTarget: target }
          : { ...step, routes: step.routes.map((route) => route.guard === event ? { ...route, target } : route) };
      }
      if (step.kind === "serviceTask") {
        const key = event === "success" ? "onDone" : "onError";
        return { ...step, [key]: { ...step[key], target } };
      }
      if (step.timeout?.event === event) {
        return {
          ...step,
          timeout: { ...step.timeout, target },
          on: { ...step.on, [event]: { ...step.on[event], target } },
        };
      }
      return { ...step, on: { ...step.on, [event]: { ...step.on[event], target } } };
    }));
  };

  const resetGraphDraft = () => {
    setDraftSteps(cloneSteps(correctionWorkflowDefinition.steps));
    setSelectedStep(correctionWorkflowDefinition.initialStep);
  };

  const addTimeline = (kind, text, stepId) => {
    const clock = clockRef.current;
    timelineCounter.current += 1;
    setTimeline((items) => [
      ...items,
      { id: timelineCounter.current, elapsed: clock?.now ?? 0, kind, text, ...(stepId ? { stepId } : {}) },
    ].slice(-60));
  };

  useEffect(() => {
    const clock = makeVirtualClock();
    clockRef.current = clock;
    lastStateRef.current = null;
    const snapshotToRestore = restoredCheckpoint?.definitionKey === definitionKey
      ? restoredCheckpoint.snapshot
      : null;
    const actor = runtime.createActor(definition, {
      clock,
      ...(snapshotToRestore ? { snapshot: snapshotToRestore } : {}),
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
          stepId: state,
        }].slice(-60));
      }
    });
    if (snapshotToRestore) {
      actor.start();
      setStarted(true);
      addTimeline("checkpoint", `Restored actor snapshot for workflow ${definition.version}`);
    } else {
      setStarted(false);
    }
    return () => {
      subscription.unsubscribe();
      actor.stop();
      if (actorRef.current === actor) actorRef.current = null;
    };
  }, [runtime, definition, definitionKey, actorRevision, restoredCheckpoint]);

  useEffect(() => {
    setCheckpoint((saved) => saved?.definitionKey === definitionKey ? saved : null);
    setRestoredCheckpoint((saved) => saved?.definitionKey === definitionKey ? saved : null);
  }, [definitionKey]);

  const state = currentState(snapshot);
  const context = snapshot?.context ?? {};
  const successfulTerminal = state === "completed" || state === "completedNoChange";
  const selected = definition.steps.find((step) => step.id === selectedStep) ?? definition.steps[0];
  const waitingForApproval = state === "awaitingApproval";
  const waitingForEvidence = state === "awaitingEvidence";
  const waitingToValidate = state === "evidenceReceived";
  const waitingForBilling = state === "awaitingAdditionalEvidence";
  const waitingForReview = state === "manualReview";
  const visited = new Set(timeline.filter((entry) => entry.kind === "state").map((entry) => entry.stepId).filter(Boolean));
  const checkpointIsCurrent = checkpoint?.definitionKey === definitionKey;
  const records = asRecords(snapshot);
  const graphNodes = definition.steps.map((step, index) => ({ step, index, position: stepPosition(step, index) }));
  const graphNodeById = new Map(graphNodes.map((node) => [node.step.id, node]));
  const graphEdges = graphNodes.flatMap(({ step, index, position }) => outgoing(step).flatMap((edge, edgeIndex) => {
    const target = graphNodeById.get(edge.target);
    if (!target) return [];
    return [{
      ...edge,
      source: step,
      target: target.step,
      geometry: edgeGeometry(position, target.position, index + edgeIndex),
    }];
  }));

  const startRun = () => {
    if (started || definitionErrors.length) return;
    setEditing(false);
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
    const waitingStep = definition.steps.find((step) => step.id === currentState(actorRef.current?.getSnapshot()));
    const timeout = waitingStep?.timeout;
    if (!timeout || !actorRef.current) return;
    const amount = runtime.resolveDelay(timeout.after, actorRef.current.getSnapshot().context);
    addTimeline("clock", `Advanced virtual time by ${Math.round(amount / 1000)} seconds`);
    clockRef.current?.advanceBy(amount);
    addTimeline("event", `Timer host delivered ${timeout.event} for ${waitingStep.label}`);
    actorRef.current.send({ type: timeout.event });
  };

  const resetRun = () => {
    setRestoredCheckpoint(null);
    setCheckpoint(null);
    setTimeline([]);
    setStarted(false);
    setEditing(false);
    setSelectedStep(definition.initialStep);
    lastStateRef.current = null;
    setActorRevision((value) => value + 1);
  };

  const saveCheckpoint = () => {
    const persisted = actorRef.current?.getPersistedSnapshot();
    if (!persisted) return;
    setCheckpoint({ snapshot: JSON.parse(JSON.stringify(persisted)), definitionKey });
    addTimeline("checkpoint", "Saved a JSON-serializable XState actor checkpoint");
  };

  const restoreCheckpoint = () => {
    if (!checkpointIsCurrent) return;
    setRestoredCheckpoint(checkpoint);
    setActorRevision((value) => value + 1);
  };

  return (
    <div className="wf-studio-wrap container">
      <section className="wf-studio-intro">
        <div>
          <p className="eyebrow">XFlow studio · J07 + J08</p>
          <h2>Correct a charging bill without erasing its history.</h2>
          <p>
            Edit a visual workflow graph, adjust its policy, inject late meter evidence, and test that same
            versioned definition through the XState actor runtime.
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
          <button className="wf-primary-button" onClick={startRun} disabled={started || definitionErrors.length > 0}><Play size={15} />Start run</button>
          <button onClick={injectCorrection} disabled={!started || !waitingForEvidence}><Activity size={15} />Inject correction</button>
          <button onClick={() => send({ type: "evidence.validate" }, "Requested evidence validation")} disabled={!started || !waitingToValidate}><ShieldAlert size={15} />Validate</button>
          <button onClick={() => send({ type: "evidence.supplemented", evidence: { id: "BILLING-EVIDENCE-J08-01" } }, "Supplemental billing evidence received")} disabled={!started || !waitingForBilling}><FileCheck2 size={15} />Add billing evidence</button>
          <button onClick={() => send({ type: waitingForApproval ? "approval.granted" : "review.approved", approval: { by: "billing-operator", approvedAt: "virtual-now" } }, "Billing correction approved")} disabled={!started || (!waitingForApproval && !waitingForReview)}><Check size={15} />Approve</button>
          <button onClick={() => send({ type: waitingForApproval ? "approval.rejected" : "review.rejected" }, "Billing correction rejected")} disabled={!started || (!waitingForApproval && !waitingForReview)}><ShieldAlert size={15} />Reject</button>
          <button onClick={advanceTime} disabled={!started || !waitingForApproval}><Clock3 size={15} />Advance time</button>
          <button onClick={resetRun}><RotateCcw size={15} />Reset</button>
        </div>
        <div className="wf-status" data-status={successfulTerminal ? "done" : state}>
          <span />
          <div><small>Current state</small><strong>{definition.steps.find((step) => step.id === state)?.label ?? state}</strong></div>
        </div>
      </section>

      <section className="wf-studio-grid">
        <article className="wf-panel wf-graph-panel">
          <header className="wf-panel-heading">
            <div><p className="eyebrow">Workflow graph</p><h3>Correction process</h3></div>
            <div className="wf-graph-actions">
              <span>{definition.steps.length} steps · {graphEdges.length} routes</span>
              {definitionChanged && <small className="wf-draft-indicator">Draft edited</small>}
              <button className={editing ? "wf-edit-button is-editing" : "wf-edit-button"} aria-pressed={editing} onClick={() => setEditing((value) => !value)} disabled={started}>
                {editing ? "Done editing" : "Edit flow"}
              </button>
              {definitionChanged && <button className="wf-reset-draft" onClick={resetGraphDraft} disabled={started}>Reset graph</button>}
            </div>
          </header>
          <p className={editing ? "wf-editor-note" : "wf-canvas-hint"}>
            {editing
              ? "Select a node, then change its label, description or route destination. The diagram and next test run use this browser draft."
              : "Scroll in both directions to explore branches. Select a node to inspect it, or choose Edit flow to change labels, descriptions and routes."}
          </p>
          {definitionErrors.length > 0 && <p className="wf-definition-error" role="alert">Fix the workflow definition before starting a run: {definitionErrors.join(" ")}</p>}
          <div className={`wf-graph wf-canvas-scroll ${editing ? "is-editing" : ""}`} aria-label="XFlow visual workflow">
            <div className="wf-flow-canvas" style={{ width: GRAPH.width, height: GRAPH.height }}>
              <svg className="wf-edge-layer" viewBox={`0 0 ${GRAPH.width} ${GRAPH.height}`} aria-hidden="true">
                <defs>
                  <marker id="wf-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" />
                  </marker>
                  <marker id="wf-arrow-active" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" />
                  </marker>
                </defs>
                {graphEdges.map((edge) => (
                  <g className={`wf-edge ${state === edge.source.id ? "is-active" : ""}`} key={`${edge.source.id}:${edge.event}:${edge.target.id}`}>
                    <path d={edge.geometry.d} markerEnd={`url(#${state === edge.source.id ? "wf-arrow-active" : "wf-arrow"})`} />
                    <text x={edge.geometry.labelX} y={edge.geometry.labelY} textAnchor="middle">{edge.event}</text>
                  </g>
                ))}
              </svg>
              <ol className="wf-sr-only" aria-label="Workflow transitions">
                {graphEdges.map((edge, index) => <li key={`${edge.source.id}:${edge.event}:${edge.target.id}:accessible:${index}`}>
                  {edge.source.label}: {edge.event} → {edge.target.label}
                </li>)}
              </ol>
              {graphNodes.map(({ step, index, position }) => {
              const active = state === step.id;
              const isVisited = visited.has(step.id);
              return (
                <button
                  key={step.id}
                  data-step-id={step.id}
                  className={`wf-node wf-node--${step.kind} ${active ? "is-active" : ""} ${isVisited ? "is-visited" : ""} ${selectedStep === step.id ? "is-selected" : ""} ${step.kind === "end" ? "is-end" : ""}`}
                  style={{ left: position.x, top: position.y, width: GRAPH.nodeWidth, height: GRAPH.nodeHeight }}
                  aria-pressed={selectedStep === step.id}
                  aria-label={`${step.label}, ${kindLabels[step.kind]}`}
                  onClick={() => setSelectedStep(step.id)}
                >
                  <span className="wf-node-icon">{active ? <CircleDot size={16} /> : isVisited ? <Check size={16} /> : <span>{String(index + 1).padStart(2, "0")}</span>}</span>
                  <span className="wf-node-copy"><strong>{step.label}</strong><small>{kindLabels[step.kind]}</small></span>
                  <ArrowRight className="wf-node-open" size={15} />
                </button>
              );
              })}
            </div>
          </div>
        </article>

        <aside className="wf-side-column">
          <article className="wf-panel wf-inspector">
            <header className="wf-panel-heading"><div><p className="eyebrow">Step inspector</p><h3>{selected?.label}</h3></div><Code2 size={20} /></header>
            <span className="wf-kind-pill">{kindLabels[selected?.kind]}</span>
            {editing ? (
              <div className="wf-editor-fields">
                <label><span>Step label</span><input aria-label="Step label" value={selected?.label ?? ""} onChange={(event) => updateStep(selected.id, { label: event.target.value })} /></label>
                <label><span>Description</span><textarea aria-label="Step description" rows="4" value={selected?.description ?? ""} onChange={(event) => updateStep(selected.id, { description: event.target.value })} /></label>
              </div>
            ) : <p>{selected?.description}</p>}
            {outgoing(selected ?? {}).length > 0 && <div className="wf-inspector-transitions">
              <div className="wf-inspector-transitions-heading"><span>Route destinations</span><small>{outgoing(selected).length} routes</small></div>
              {outgoing(selected).map((edge) => (
                <label key={`${edge.event}:${edge.target}`}>
                  <span>{edge.event}</span>
                  {editing ? (
                    <select aria-label={`Destination for ${edge.event}`} value={edge.target} onChange={(event) => updateTransitionTarget(selected.id, edge.event, event.target.value)}>
                      {definition.steps.map((target) => <option key={target.id} value={target.id}>{target.label}</option>)}
                    </select>
                  ) : <strong>{definition.steps.find((target) => target.id === edge.target)?.label ?? edge.target}</strong>}
                </label>
              ))}
            </div>}
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
            <p>Checkpoint this actor snapshot and restore it only while the exact workflow definition still matches.</p>
            <div className="wf-checkpoint-actions">
              <button onClick={saveCheckpoint} disabled={!started}><Save size={14} />Save checkpoint</button>
              <button onClick={restoreCheckpoint} disabled={!checkpointIsCurrent}><RotateCcw size={14} />Restore</button>
            </div>
            <small>{checkpointIsCurrent ? "Checkpoint saved for this exact workflow definition." : "No checkpoint saved for this workflow definition."}</small>
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
