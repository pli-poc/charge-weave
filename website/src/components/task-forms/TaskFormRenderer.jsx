import "./task-form-renderer.css";
import { maskSensitiveDisplayValue } from "../../task-forms/engine.js";

function getValue(source, path) {
  return String(path ?? "").split(".").filter(Boolean).reduce((current, key) => current?.[key], source);
}

function formatDisplayValue(value) {
  if (value === undefined || value === null || value === "") return "—";
  const label = (entry) => typeof entry === "object" && entry !== null
    ? entry.label ?? entry.name ?? entry.id ?? entry["@id"] ?? "Reference"
    : entry;
  return Array.isArray(value) ? value.map(label).join(", ") : String(label(value));
}

function fieldError(field, errors) {
  return errors.find((message) => message.toLowerCase().startsWith(field.label.toLowerCase()));
}

function TaskField({ field, value, onChange, error, context, outcome, idPrefix, disabled }) {
  const id = `${idPrefix}-${field.id}`;
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const appliesToOutcome = !outcome || !field.activeOn.length || field.activeOn.includes(outcome);
  const required = appliesToOutcome && (field.shape?.required === true || (outcome && (field.shape?.requiredOn ?? []).includes(outcome)));
  const common = {
    id,
    name: field.id,
    "aria-describedby": [field.help ? descriptionId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined,
    "aria-invalid": Boolean(error),
    required: Boolean(required),
    disabled: disabled || !appliesToOutcome,
  };

  if (field.mode === "display") {
    const rawValue = getValue(context, field.valuePath);
    return (
      <div className={`task-form-field task-form-field-readonly${field.control === "masked" ? " is-masked" : ""}`}>
        <span className="task-form-label">{field.label}<span className="task-form-readonly-tag">{field.control === "masked" ? "Masked · read only" : "Read only"}</span></span>
        <output className={`task-form-display-value${field.control === "masked" ? " task-form-masked-value" : ""}`} aria-label={field.label}>
          {field.control === "masked" ? maskSensitiveDisplayValue(rawValue) : formatDisplayValue(rawValue)}
        </output>
        {field.help && <small id={descriptionId}>{field.help}</small>}
      </div>
    );
  }

  let control;
  if (field.control === "select" || field.control === "evidence" || field.control === "reference") {
    const options = field.control === "select"
      ? field.allowedValues.map((option) => ({ id: option, label: option }))
      : field.options;
    control = (
      <select {...common} value={value ?? ""} onChange={(event) => onChange(field.id, event.target.value)}>
        <option value="">Choose {field.label.toLowerCase()}</option>
        {options.map((option) => <option key={option.id} value={option.id}>{option.label ?? option.id}</option>)}
      </select>
    );
  } else if (field.control === "textarea") {
    control = <textarea {...common} rows={4} maxLength={field.shape?.maxLength} value={value ?? ""} onChange={(event) => onChange(field.id, event.target.value)} />;
  } else if (field.control === "money") {
    const money = value && typeof value === "object" ? value : { amount: "", currency: field.currencies[0]?.code ?? "" };
    control = (
      <div className="task-form-money-control">
        <input
          {...common}
          id={`${id}-amount`}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          aria-label={field.label}
          aria-describedby={common["aria-describedby"]}
          aria-invalid={Boolean(error)}
          value={money.amount ?? ""}
          placeholder="0.00"
          onChange={(event) => onChange(field.id, { ...money, amount: event.target.value })}
        />
        <label className="task-form-visually-hidden" htmlFor={`${id}-currency`}>{field.label} currency</label>
        <select
          id={`${id}-currency`}
          aria-label={`${field.label} currency`}
          value={money.currency ?? ""}
          disabled={disabled || !appliesToOutcome}
          onChange={(event) => onChange(field.id, { ...money, currency: event.target.value })}
        >
          {field.currencies.map((currency) => <option key={currency.code} value={currency.code}>{currency.code}</option>)}
        </select>
      </div>
    );
  } else {
    const inputType = ({ decimal: "text", number: "number", date: "date", "datetime-local": "datetime-local", time: "time", url: "url", checkbox: "checkbox" })[field.control] ?? "text";
    control = <input {...common} type={inputType} inputMode={field.control === "decimal" ? "decimal" : undefined} checked={field.control === "checkbox" ? Boolean(value) : undefined} value={field.control === "checkbox" ? undefined : value ?? ""} onChange={(event) => onChange(field.id, field.control === "checkbox" ? event.target.checked : event.target.value)} />;
  }

  return (
    <div className={`task-form-field${error ? " has-error" : ""}`}>
      <label className="task-form-label" htmlFor={field.control === "money" ? `${id}-amount` : id}>
        {field.label}{required && <span className="task-form-required-mark" aria-hidden="true"> *</span>}
      </label>
      {control}
      {field.help && <small id={descriptionId}>{field.help}</small>}
      {error && <span className="task-form-field-error" id={errorId}>{error}</span>}
    </div>
  );
}

/** Render the ontology-compiled fields and allowed outcomes for any task profile. */
export default function TaskFormRenderer({
  form,
  values = {},
  errors = [],
  context = {},
  outcome = null,
  mode = "input",
  idPrefix = "task",
  disabled = false,
  onChange = () => {},
  onOutcome,
  showOutcomes = true,
  className = "",
}) {
  const fields = form.fields.filter((field) => mode === "all" || field.mode === mode);
  return (
    <div className={`task-form-renderer ${className}`.trim()}>
      {fields.map((field) => (
        <TaskField
          key={field.id}
          field={field}
          value={values[field.id]}
          onChange={onChange}
          error={fieldError(field, errors)}
          context={context}
          outcome={outcome}
          idPrefix={idPrefix}
          disabled={disabled}
        />
      ))}
      {errors.length > 0 && (
        <div className="task-form-errors" role="alert" aria-live="assertive">
          <strong>Review these task inputs</strong>
          <ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul>
        </div>
      )}
      {showOutcomes && onOutcome && form.outcomes.length > 0 && (
        <div className="task-form-outcomes" aria-label="Allowed task outcomes">
          {form.outcomes.map((taskOutcome) => (
            <button
              key={taskOutcome.eventType}
              className={`task-form-outcome-button ${taskOutcome.tone ?? ""}`}
              type="button"
              disabled={disabled}
              onClick={() => onOutcome(taskOutcome.eventType)}
            >
              {taskOutcome.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
