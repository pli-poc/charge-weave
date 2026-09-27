import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, FileCheck2, LockKeyhole, RotateCcw, ShieldCheck } from "lucide-react";
import TaskFormRenderer from "./components/task-forms/TaskFormRenderer.jsx";
import { correctionApprovalForm } from "./simulation/correction-approval-form.js";
import { createCorrectionWorkflowRuntime, correctionWorkflowDefinition } from "./simulation/correction-workflow.js";
import { compileTaskForm, createInitialTaskValues } from "./task-forms/engine.js";
import { createSimulatedTaskHost } from "./simulation/simulated-task-host.js";
import "./human-task-design.css";

const stages = [
  ["01", "Workflow enters a HumanTask", "The pinned XFlow version names the role, inputs, outcomes and permitted commands."],
  ["02", "Task contract narrows the model", "Ontology terms give fields meaning; task shapes and deterministic rules define acceptable values and references."],
  ["03", "Renderer presents a scoped form", "Read-only case facts stay separate from the few fields and actions this task allows the person to submit."],
  ["04", "Host validates and resumes", "Identity, task state, version, permissions and business constraints are checked before a correlated event reaches XState."],
];

const principal = { id: "operator-demo-17", label: "Jordan Lee", roles: ["BillingApprover"] };
const taskRevision = 4;

function stateLabel(snapshot) {
  if (!snapshot) return "Starting synthetic workflow";
  if (snapshot.matches("awaitingApproval")) return "Approval task open";
  if (snapshot.matches("completed")) return "Correction completed";
  if (snapshot.matches("declined")) return "Correction rejected";
  if (snapshot.matches("manualReview")) return "Escalated to manual review";
  return `Workflow · ${String(snapshot.value).replaceAll(/([a-z])([A-Z])/g, "$1 $2")}`;
}

function TaskFormPrototype() {
  const form = useMemo(() => compileTaskForm({ definition: correctionWorkflowDefinition, profile: correctionApprovalForm }), []);
  const [runId, setRunId] = useState(1);
  const [session, setSession] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [values, setValues] = useState(() => createInitialTaskValues(form));
  const [errors, setErrors] = useState([]);
  const [notice, setNotice] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [attemptedOutcome, setAttemptedOutcome] = useState(null);

  useEffect(() => {
    const runtime = createCorrectionWorkflowRuntime();
    const actor = runtime.createActor(correctionWorkflowDefinition, { context: { paymentReferenceMasked: "•••• •••• •••• 4242" } });
    const subscription = actor.subscribe(setSnapshot);
    actor.start();
    actor.send({
      type: "meter.corrected",
      evidence: {
        id: "METER-EVIDENCE-7781",
        signatureValid: true,
        sameRegisterEpoch: true,
        correctedEnergyKwh: 10,
        receivedAt: "2026-09-27T12:00:00.000Z",
      },
    });
    actor.send({ type: "evidence.validate" });
    setSession({ actor, host: null, runId });
    setValues({
      ...createInitialTaskValues(form),
      correctionKind: "Credit",
      correctionReason: "Signed meter evidence confirms the corrected usage.",
      correctionEvidence: "EVIDENCE-METER-7781",
      proposedCreditAmount: { amount: "0.19", currency: "EUR" },
    });
    setErrors([]);
    setNotice(null);
    setSubmitting(false);
    setAttemptedOutcome(null);
    return () => {
      subscription.unsubscribe();
      actor.stop();
    };
  }, [form, runId]);

  const host = useMemo(() => session ? createSimulatedTaskHost({ form, actor: session.actor, getTaskRevision: () => taskRevision }) : null, [form, session]);
  const context = snapshot?.context ?? {};
  const open = Boolean(snapshot?.matches("awaitingApproval"));
  const amount = context.rating?.grossDeltaEur ?? 0.19;

  function changeValue(id, nextValue) {
    setValues((current) => ({ ...current, [id]: nextValue }));
    setErrors([]);
    setNotice(null);
  }

  function submit(eventType) {
    if (!host || !open || submitting) return;
    setAttemptedOutcome(eventType);
    setSubmitting(true);
    const result = host.submit({
      eventType,
      values,
      principal,
      expectedRevision: taskRevision,
      idempotencyKey: `task-${runId}-${eventType}`,
    });
    setSubmitting(false);
    setErrors(result.errors ?? []);
    if (result.ok) {
      setNotice({
        tone: "success",
        text: eventType === "approval.granted"
          ? "Approval accepted by the task host. The workflow is applying its registered correction services."
          : "Rejection recorded. The workflow moved the case into its declared rejected state.",
      });
    } else {
      setNotice({ tone: "error", text: result.code === "forbidden" ? "This simulated principal is not assigned to the task." : result.code === "stale-task" ? "Task revision changed. Start a fresh run to load the current task." : "The task host did not accept this submission." });
    }
  }

  function reset() {
    setSnapshot(null);
    setSession(null);
    setRunId((current) => current + 1);
  }

  return (
    <section className="htd-interactive" aria-label="Interactive human task form prototype">
      <div className="htd-demo-heading">
        <div>
          <p className="eyebrow">Interactive prototype · synthetic data</p>
          <h2>Review a billing correction</h2>
          <p>Try the generated controls, change the proposed amount to see the task constraint, then approve or reject the open workflow task.</p>
        </div>
        <span className={`htd-task-state ${open ? "is-open" : snapshot?.matches("completed") ? "is-done" : ""}`} role="status">
          <span className="htd-state-dot" />{stateLabel(snapshot)}
        </span>
      </div>

      <div className="htd-task-meta" aria-label="Task assignment">
        <div><span>Assigned role</span><strong>Billing approver</strong></div>
        <div><span>Assignee</span><strong>{principal.label} · demo</strong></div>
        <div><span>Workflow</span><strong>Charge correction · v{correctionWorkflowDefinition.version}</strong></div>
        <div><span>Task revision</span><strong>{taskRevision}</strong></div>
      </div>

      <div className="htd-task-grid">
        <aside className="htd-case-panel" aria-label="Read-only case context">
          <div className="htd-case-panel-title"><LockKeyhole size={16} /><h3>Case context · read only</h3></div>
          <dl>
            <div><dt>Case</dt><dd>SESSION-DEMO-1042</dd></div>
            <div><dt>Original CDR</dt><dd>CDR-DEMO-1042</dd></div>
            <div><dt>Meter evidence</dt><dd>METER-EVIDENCE-7781 <span className="htd-verified">Signature verified</span></dd></div>
            <div><dt>Original energy</dt><dd>10.600 kWh</dd></div>
            <div><dt>Corrected energy</dt><dd>{context.reconciliation?.correctedEnergyKwh?.toFixed(3) ?? "10.000"} kWh</dd></div>
          </dl>
          <div className="htd-rating-summary">
            <span>Rating service · demo-tariff-v1</span>
            <div><span>Original charge</span><strong>€ 3.39</strong></div>
            <div><span>Re-rated charge</span><strong>€ {context.rating?.grossEur?.toFixed(2) ?? "3.20"}</strong></div>
            <div className="htd-delta"><span>Calculated adjustment ceiling</span><strong>€ {Number(amount).toFixed(2)}</strong></div>
          </div>
          <TaskFormRenderer
            form={form}
            mode="display"
            context={context}
            showOutcomes={false}
            idPrefix="case-context"
          />
          <p className="htd-readonly-note">The original CDR and meter event stay unchanged. The correction creates a linked record through registered workflow services.</p>
        </aside>

        <form className="htd-input-panel" onSubmit={(event) => event.preventDefault()} noValidate>
          <div className="htd-input-panel-title">
            <div><p className="eyebrow">Task contract · {form.id} v{form.version}</p><h3>Decision inputs</h3></div>
            <span>Only fields in this task are editable</span>
          </div>
          <TaskFormRenderer
            form={form}
            mode="input"
            values={values}
            errors={errors}
            context={context}
            outcome={attemptedOutcome}
            disabled={!open || submitting}
            onChange={changeValue}
            onOutcome={submit}
            showOutcomes
            idPrefix="approval-task"
          />
          {notice && <div className={`htd-submit-notice ${notice.tone}`} role="status">{notice.text}</div>}
          <div className="htd-outcome-actions">
            <button className="htd-reset-button" type="button" onClick={reset}><RotateCcw size={15} /> Start fresh run</button>
          </div>
          <p className="htd-host-boundary">This page simulates the task host in your browser. It demonstrates role, revision, shape, reference and idempotency checks; it does not call an API, persist data or provide production authorization.</p>
        </form>
      </div>

      {(snapshot?.matches("completed") || snapshot?.matches("declined")) && (
        <div className="htd-run-result" role="status">
          <Check size={18} />
          <div><strong>{snapshot.matches("completed") ? "Workflow completed" : "Workflow rejected"}</strong><p>{snapshot.matches("completed") ? `The workflow retained the approval record and created linked CDR ${snapshot.context.correctedCdr?.id ?? "through the registered correction service"}.` : "The rejection reason is retained in this synthetic workflow run."}</p></div>
        </div>
      )}
    </section>
  );
}

export default function HumanTaskDesign() {
  return (
    <div className="container htd-page">
      <section className="htd-proposal" aria-label="Prototype status">
        <span className="htd-status"><FileCheck2 size={15} /> INTERACTIVE PROTOTYPE</span>
        <p>
          The browser prototype compiles a task-scoped form from a versioned HumanTask, ontology field bindings and explicit input constraints. The task host is simulated; there is no durable inbox, API write or production authorization yet.
        </p>
      </section>

      <section className="htd-intro">
        <p className="eyebrow">Human task contract</p>
        <h2>Task-scoped forms, compiled from a validated contract.</h2>
        <p>
          A person sees the facts needed for the current decision and only the inputs or actions this workflow step explicitly permits. The form is a controlled way to submit a business event; it is not an editor for arbitrary ontology instances.
        </p>
      </section>

      <TaskFormPrototype />

      <section className="htd-flow" aria-label="Human task submission path">
        {stages.map(([number, title, description], index) => (
          <article key={number}>
            <span className="htd-number">{number}</span>
            <h3>{title}</h3>
            <p>{description}</p>
            {index < stages.length - 1 && <ArrowRight className="htd-arrow" size={18} aria-hidden="true" />}
          </article>
        ))}
      </section>

      <section className="htd-section">
        <div className="htd-section-heading">
          <p className="eyebrow">Responsibilities stay separate</p>
          <h2>Ontology guides the form; the task decides what can change.</h2>
        </div>
        <div className="htd-contract-grid">
          <article><h3>Business ontology</h3><p>Defines the meaning of fields and links: sessions, meter evidence, tariffs, CDRs, correction records, parties and roles.</p><span>What does this value mean?</span></article>
          <article><h3>SHACL and domain rules</h3><p>Constrain datatypes, cardinality, ranges, class references, controlled values and cross-record business invariants.</p><span>Is this submitted value valid?</span></article>
          <article><h3>Workflow task contract</h3><p>Declares the assignee role, visible context, editable bindings, allowed outcomes, commands, deadline and resulting events.</p><span>What may this person do now?</span></article>
          <article><h3>Presentation profile</h3><p>Supplies labels, grouping, help text and widget hints. These are versioned UI metadata, not business rules inferred from OWL.</p><span>How should the task be presented?</span></article>
        </div>
        <p className="htd-principle">OWL does not define a screen or close-world required fields. SHACL can constrain data, but it cannot decide which fields a particular task is authorized to expose or edit. The workflow contract makes that boundary explicit.</p>
      </section>

      <section className="htd-section htd-contract-spec">
        <div className="htd-section-heading">
          <p className="eyebrow">Declarative, versioned contract</p>
          <h2>The workflow selects a small, typed task surface.</h2>
          <p>The form profile is pinned to one workflow and HumanTask version. It binds selected ontology properties to task inputs, then applies task-specific shape constraints and presentation metadata.</p>
        </div>
        <div className="htd-contract-columns">
          <div><h3>Task definition declares</h3><ul><li>Responsible role and task correlation</li><li>Read-only context and editable input bindings</li><li>Allowed outcomes and named commands</li><li>Input shapes and validation rule references</li><li>Deadline, escalation and completion events</li><li>Presentation profile version</li></ul></div>
          <div><h3>Renderer derives, with limits</h3><ul><li>Text, number, date/time, boolean and enum controls from ontology ranges</li><li>Required state, bounds and patterns from explicit task shapes</li><li>Reference pickers restricted to permitted target classes</li><li>Money controls with exact decimal precision and allowed currencies</li><li>Masked display values that never enter editable payloads</li><li>No arbitrary JavaScript, SPARQL or unrestricted graph editing</li></ul></div>
        </div>
      </section>

      <section className="htd-section htd-example">
        <div className="htd-section-heading">
          <p className="eyebrow">First example · J07/J08 correction</p>
          <h2>Review evidence without rewriting history.</h2>
          <p>The charge-correction journey exercises evidence waits, a decision, approval, timeout and financial correction steps. The form only resumes the declared approval event.</p>
        </div>
        <div className="htd-example-grid">
          <article className="htd-readonly"><h3><LockKeyhole size={16} /> Read-only case context</h3><p>Original CDR, session, meter observations, tariff version, calculated difference and evidence provenance.</p></article>
          <article className="htd-editable"><h3><Check size={16} /> Permitted task inputs</h3><p>Correction kind, decision reason, selected supporting evidence and a bounded proposed adjustment.</p></article>
          <article className="htd-actions"><h3><ArrowRight size={16} /> Explicit outcomes</h3><p>Approve or reject. Each button maps to an event declared on the bound HumanTask; timeout remains controlled by the workflow host.</p></article>
        </div>
        <div className="htd-safety-note"><ShieldCheck size={20} /><p>A correction never silently edits the source meter event or original debit. The amount entered here is a proposal recorded with the decision. The rating service and registered domain capabilities determine posted financial records.</p></div>
      </section>

      <section className="htd-section">
        <div className="htd-section-heading"><p className="eyebrow">Submission is a guarded command</p><h2>Client validation helps; the host remains authoritative.</h2></div>
        <ol className="htd-validation-list">
          <li><b>Check task state:</b> confirm this task is still open on the pinned workflow definition and execution version.</li>
          <li><b>Check authority:</b> re-check tenant, principal, assigned role and allowed command at submission time.</li>
          <li><b>Validate payload:</b> enforce the declared shape, reference classes, temporal context and deterministic business rules.</li>
          <li><b>Protect against races:</b> use expected version, correlation and idempotency so stale or duplicate submissions cannot apply twice.</li>
          <li><b>Record and resume:</b> persist submitted values, outcome, reason, evidence references, validator/rule versions and actor context before delivering the declared event to XState.</li>
        </ol>
      </section>

      <section className="htd-boundary">
        <p className="eyebrow">Current implementation boundary</p>
        <p>The shared task-form engine and React renderer provide ontology-bound controls, outcome-scoped validation, exact-decimal money entry, safe masked display, reference options and a neutral task-submission event contract. The correction workflow is the first profile using those reusable pieces. Production still needs a trusted host that independently authenticates and authorizes users, resolves live references, validates SHACL and domain rules, persists an audit record, and commits the domain operation transactionally. A form-authoring studio can follow after those service boundaries are implemented.</p>
        <a href={`${import.meta.env.BASE_URL}developer/flows/`}>Open the current Workflow Studio <ArrowRight size={15} /></a>
      </section>
    </div>
  );
}
