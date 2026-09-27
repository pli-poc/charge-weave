import { ArrowRight, Check, FileCheck2, LockKeyhole, ShieldCheck } from "lucide-react";
import "./human-task-design.css";

const stages = [
  ["01", "Workflow enters a HumanTask", "The pinned XFlow version names the role, inputs, outputs, outcomes and permitted commands."],
  ["02", "Task contract narrows the model", "Ontology terms give fields meaning; SHACL shapes and deterministic rules define acceptable values and references."],
  ["03", "Renderer presents a scoped form", "Read-only case facts stay separate from the few fields and actions this task allows the person to submit."],
  ["04", "Host validates and resumes", "Identity, task state, version, permissions and business constraints are checked before a correlated event reaches XState."],
];

export default function HumanTaskDesign() {
  return (
    <div className="container htd-page">
      <section className="htd-proposal" aria-label="Design status">
        <span className="htd-status"><FileCheck2 size={15} /> DESIGN PROPOSAL</span>
        <p>
          This page describes a platform capability to design and validate before implementation.
          The current browser demo has human approval steps, but no generated task forms, durable
          task inbox or general record-editing surface.
        </p>
      </section>

      <section className="htd-intro">
        <p className="eyebrow">Human task contract</p>
        <h2>Task-scoped forms, generated from a validated contract.</h2>
        <p>
          A person should see the facts needed for the current decision and only the inputs or
          actions that this workflow step explicitly permits. The form is a controlled way to
          submit a business event; it is not an editor for arbitrary ontology instances.
        </p>
      </section>

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
          <article>
            <h3>Business ontology</h3>
            <p>Defines the meaning of fields and links: sessions, meter evidence, tariffs, CDRs, correction records, parties and roles.</p>
            <span>What does this value mean?</span>
          </article>
          <article>
            <h3>SHACL and domain rules</h3>
            <p>Constrain datatypes, cardinality, ranges, class references, controlled values and cross-record business invariants.</p>
            <span>Is this submitted value valid?</span>
          </article>
          <article>
            <h3>Workflow task contract</h3>
            <p>Declares the assignee role, visible context, editable bindings, allowed outcomes, commands, deadline and resulting events.</p>
            <span>What may this person do now?</span>
          </article>
          <article>
            <h3>Presentation profile</h3>
            <p>Supplies labels, grouping, help text and widget hints. These are versioned UI metadata, not business rules inferred from OWL.</p>
            <span>How should the task be presented?</span>
          </article>
        </div>
        <p className="htd-principle">
          OWL does not define a screen or close-world required fields. SHACL can constrain data,
          but it cannot decide which fields a particular task is authorized to expose or edit.
          The workflow contract makes that boundary explicit.
        </p>
      </section>

      <section className="htd-section htd-contract-spec">
        <div className="htd-section-heading">
          <p className="eyebrow">Declarative, versioned contract</p>
          <h2>The workflow selects a small, typed task surface.</h2>
          <p>
            A HumanTask would reference reusable input/output shapes and a presentation profile.
            It would select only the bindings and outcomes needed at this point in the journey.
          </p>
        </div>
        <div className="htd-contract-columns">
          <div>
            <h3>Task definition declares</h3>
            <ul>
              <li>Responsible role and task correlation</li>
              <li>Read-only context and editable input bindings</li>
              <li>Allowed outcomes and named commands</li>
              <li>Input/output shapes and validation rule references</li>
              <li>Deadline, escalation and completion events</li>
              <li>Presentation profile version</li>
            </ul>
          </div>
          <div>
            <h3>Renderer derives, with limits</h3>
            <ul>
              <li>Text, number, date/time, boolean and evidence controls from declared datatypes</li>
              <li>Units, bounds, required state and patterns from explicit shapes</li>
              <li>Ontology-backed pickers restricted to the permitted target classes</li>
              <li>Read-only summaries from canonical record references</li>
              <li>Labels, grouping and help text from the presentation profile</li>
              <li>No arbitrary JavaScript, SPARQL or unrestricted graph editing</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="htd-section htd-example">
        <div className="htd-section-heading">
          <p className="eyebrow">First example · J07/J08 correction</p>
          <h2>Review evidence without rewriting history.</h2>
          <p>
            The existing charge-correction journey is a useful first test because it already has
            evidence waits, a decision, approval, a timeout and financial correction steps.
          </p>
        </div>
        <div className="htd-example-grid">
          <article className="htd-readonly">
            <h3><LockKeyhole size={16} /> Read-only case context</h3>
            <p>Original CDR, session, meter observations, tariff version, calculated difference and evidence provenance.</p>
          </article>
          <article className="htd-editable">
            <h3><Check size={16} /> Permitted task inputs</h3>
            <p>Review outcome, structured reason, selected supporting evidence and—only where the task allows it—a proposed correction value.</p>
          </article>
          <article className="htd-actions">
            <h3><ArrowRight size={16} /> Explicit outcomes</h3>
            <p>Approve correction, request more evidence, reject into quarantine or escalate. Each outcome maps to a declared workflow event.</p>
          </article>
        </div>
        <div className="htd-safety-note">
          <ShieldCheck size={20} />
          <p>
            A correction never silently edits the source meter event or original debit. A permitted
            change creates a new, linked business record with its reason, evidence and provenance;
            registered domain services perform any financial side effect.
          </p>
        </div>
      </section>

      <section className="htd-section">
        <div className="htd-section-heading">
          <p className="eyebrow">Submission is a guarded command</p>
          <h2>Client validation helps; the host remains authoritative.</h2>
        </div>
        <ol className="htd-validation-list">
          <li><b>Check task state:</b> confirm this task is still open on the pinned workflow definition and execution version.</li>
          <li><b>Check authority:</b> re-check tenant, principal, assigned role and allowed command at submission time.</li>
          <li><b>Validate payload:</b> enforce the declared shape, reference classes, temporal context and deterministic business rules.</li>
          <li><b>Protect against races:</b> use expected version, correlation and idempotency so stale or duplicate submissions cannot apply twice.</li>
          <li><b>Record and resume:</b> persist the submitted values, outcome, reason, evidence references, validator/rule versions and actor before-after context; then deliver the declared event to XState.</li>
        </ol>
      </section>

      <section className="htd-boundary">
        <p className="eyebrow">Build boundary</p>
        <p>
          The first implementation should be a renderer for declared task contracts and one
          reconciliation task—not a general drag-and-drop form builder. A form-authoring studio can
          follow after the contract, validation path and audit record are proven. Draft task
          contracts and presentation profiles must be versioned; running tasks keep the versions
          they were created with.
        </p>
        <a href={`${import.meta.env.BASE_URL}developer/flows/`}>Open the current Workflow Studio <ArrowRight size={15} /></a>
      </section>
    </div>
  );
}
