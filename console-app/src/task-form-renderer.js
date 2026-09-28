const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character]);

function attributes(field) {
  return [
    field.required ? "required" : "",
    field.min != null ? `min="${escapeHtml(field.min)}"` : "",
    field.max != null ? `max="${escapeHtml(field.max)}"` : "",
    field.step != null ? `step="${escapeHtml(field.step)}"` : "",
    field.minLength != null ? `minlength="${escapeHtml(field.minLength)}"` : "",
    field.maxLength != null ? `maxlength="${escapeHtml(field.maxLength)}"` : "",
    field.pattern ? `pattern="${escapeHtml(field.pattern)}"` : "",
    field.placeholder ? `placeholder="${escapeHtml(field.placeholder)}"` : "",
  ].filter(Boolean).join(" ");
}

function controlMarkup(field, value, hintId) {
  const id = `task-${field.id}`;
  const common = `id="${id}" name="${escapeHtml(field.id)}" aria-describedby="${hintId}" ${attributes(field)}`;
  if (field.control === "select") {
    const options = (field.options ?? []).map((option) => `<option value="${escapeHtml(option.value)}"${value === option.value ? " selected" : ""}>${escapeHtml(option.label)}</option>`).join("");
    return `<select ${common}><option value="">Choose ${escapeHtml(field.label.toLowerCase())}</option>${options}</select>`;
  }
  if (field.control === "textarea") {
    return `<textarea ${common} rows="4">${escapeHtml(value)}</textarea>`;
  }
  if (field.control === "checkbox") {
    return `<input ${common} type="checkbox" value="true"${value === true || value === "true" ? " checked" : ""}>`;
  }
  const inputTypes = { quantity: "number", decimal: "text", money: "text", date: "date", time: "time", datetime: "datetime-local", email: "email", url: "url", masked: "text" };
  const type = inputTypes[field.control] ?? "text";
  const inputMode = field.control === "decimal" || field.control === "money" || field.control === "quantity" ? "decimal" : field.control === "masked" ? "text" : null;
  const mask = field.control === "masked" ? `data-mask="${escapeHtml(field.mask ?? "")}" autocomplete="off"` : "";
  const input = `<input ${common} type="${type}"${inputMode ? ` inputmode="${inputMode}"` : ""} value="${escapeHtml(value)}" ${mask}>`;
  if (field.control === "quantity" || field.control === "money") {
    return `<span class="generated-control-with-unit">${input}<span>${escapeHtml(field.unit ?? field.currency ?? "EUR")}</span></span>`;
  }
  return input;
}

/** Render an ontology-linked task form descriptor using the console design system. */
export function renderGeneratedTaskForm(form, values = {}) {
  const fields = form.fields.map((field) => {
    const value = values[field.id] ?? "";
    const hintId = `task-${field.id}-hint`;
    const wide = field.span === "wide" ? " is-wide" : "";
    return `<div class="generated-task-field${wide}" data-concept="${escapeHtml(field.concept)}">
      <label for="task-${escapeHtml(field.id)}">${escapeHtml(field.label)}${field.required ? ' <span aria-hidden="true">*</span>' : ""}</label>
      ${controlMarkup(field, value, hintId)}
      <small id="${hintId}">${escapeHtml(field.help ?? "")}</small>
    </div>`;
  }).join("");
  return `<div class="generated-task-form-grid">${fields}</div>`;
}

