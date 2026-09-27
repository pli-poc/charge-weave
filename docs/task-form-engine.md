# Reusable task-form engine

The task-form engine provides a shared compiler, validator and React renderer for ontology-guided XFlow HumanTask forms. Each workflow still supplies its own versioned form profile. The engine does not turn ontology classes into CRUD screens or grant authority to edit a record.

## Module boundaries

| Module | Responsibility |
| --- | --- |
| `website/src/task-forms/engine.js` | Compile a pinned profile against a HumanTask and ontology fields; infer controls; validate values and constraints; create initial values; project only fields active for the submitted outcome; mask sensitive display values. |
| `website/src/components/task-forms/TaskFormRenderer.jsx` | Render compiled input or display fields and declared outcome buttons using shared controls and accessible labels/errors. |
| `website/src/simulation/simulated-task-host.js` | Exercise role, task-state, revision, validation and idempotency checks against an in-memory XState actor. This adapter is a demo, not a production service. |
| `website/src/simulation/correction-approval-form.js` | Supply one task's role, ontology bindings, labels, constraints, permitted references, masked context path and outcome names. |

## Compile and render

Compile only after the workflow and profile versions agree with the HumanTask pin:

```js
const form = compileTaskForm({ definition, profile });
```

The renderer accepts the compiled form, value map, current workflow context, selected outcome, validation errors and callbacks. `mode="input"` renders editable task fields; `mode="display"` renders read-only values, applying masking when the profile marks a field sensitive. `idPrefix` lets a page render the same form more than once without duplicate control IDs.

```jsx
<TaskFormRenderer
  form={form}
  mode="input"
  values={values}
  errors={errors}
  context={workflowContext}
  outcome={selectedOutcome}
  onChange={(fieldId, value) => updateValue(fieldId, value)}
  onOutcome={(eventType) => submitTask(eventType)}
/>
```

The outcome callback is limited to events declared by the compiled task. A host must still call `validateTaskSubmission` (or repeat equivalent checks server-side) and enforce current identity, role, task version, state, correlation and idempotency. The browser validation is feedback, not a security boundary.

## Profile controls and constraints

The ontology field range supplies the base widget: controlled values become selects, object properties become class-limited references, evidence references use evidence pickers, and scalar ranges map to text, boolean, numeric and temporal controls. A profile may choose compatible presentation overrides for long text, exact-decimal money or masked display. The override never changes the ontology range or authorization scope.

Profiles declare `activeOn` and `shape.required` / `shape.requiredOn` to scope fields to allowed outcomes. Additional constraints include string length/pattern, numeric bounds, money currencies and precision, contextual money ceilings, and an explicit allowlist of reference options. Sensitive display values are masked again at render time, even if the context unexpectedly contains the unmasked value, and display-only values are excluded from submitted fields.

The task host emits `{ type: eventType, taskSubmission }` for every workflow. The workflow's registered XState actions decide how that neutral submission is applied to domain context or capabilities. The form engine does not assume approval/rejection property names or business event semantics.

## Add another task

1. Pin a new profile id and version on the intended XFlow HumanTask.
2. Bind only fields that task may expose or edit to ontology class/property pairs.
3. Add labels, help text, compatible control hints, explicit constraints and task-scoped references.
4. Declare outcomes that already exist on that HumanTask and set outcome-specific required/active fields.
5. Compile and validate the profile in tests, then use `TaskFormRenderer` with that workflow's context and host callback.
6. Implement task-specific behavior in the workflow actions or registered service capabilities; keep authorization, SHACL validation, audit persistence and domain writes in a trusted host.

The correction profile and simulated host are the first example. They exercise the reusable modules but do not yet provide a durable inbox, production authorization, API persistence, live reference resolution, or general record editing.
