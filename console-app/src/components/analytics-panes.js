export const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

export function formatMeasure(value, measure, operator = "Value") {
  if (value == null || !Number.isFinite(value)) return "Unavailable";
  const format = operator === "PercentChange" ? "percent" : measure.format;
  const text = new Intl.NumberFormat("nl-NL", { maximumFractionDigits: format === "integer" ? 0 : 2,
    ...(format === "currency" ? { style: "currency", currency: measure.currency } : {}) }).format(value);
  return `${text}${format === "percent" ? (operator === "Change" ? " pp" : "%") : format === "number" ? ` ${measure.unit}` : ""}`;
}

export function renderResultTable(result, { drill = true } = {}) {
  const e = escapeHtml, dim = result.dimension?.label ?? "Population";
  return `<div class="table-wrap analytics-result-table"><table aria-label="${e(result.measure.label)} results"><thead><tr><th>${e(dim)}</th><th>Measured value</th><th>Comparison</th><th>Change</th><th>Change %</th><th>Site-days</th></tr></thead><tbody>${result.rows.map((row) => `<tr><td>${drill && ["site", "country", "setting"].includes(result.dimension?.id) ? `<button class="table-primary" data-analytics-drill="${result.dimension.id}" data-key="${e(row.key)}" type="button">${e(row.label)}</button>` : e(row.label)}</td><td>${e(formatMeasure(row.value, result.measure))}</td><td>${e(formatMeasure(row.reference, result.measure))}</td><td>${e(formatMeasure(row.change, result.measure, "Change"))}</td><td>${e(formatMeasure(row.percentChange, result.measure, "PercentChange"))}</td><td>${row.count}</td></tr>`).join("") || `<tr><td colspan="6">No matching measured population.</td></tr>`}</tbody></table></div>`;
}

/** Shared result renderer. Geometry comes only from the executed result. */
export function renderChart(result, { kind = "bar", id = "chart", drill = true } = {}) {
  const e = escapeHtml;
  if (kind === "table") return renderResultTable(result, { drill });
  if (!result.rows.length) return '<p class="analytics-empty">No measurements match these filters.</p>';
  const rows = kind === "line" ? [...result.rows].sort((a, b) => a.key.localeCompare(b.key, "en")) : result.rows;
  const value = (row) => row[result.field], format = (number) => formatMeasure(number, result.measure, result.query.operator);
  const finite = rows.map(value).filter(Number.isFinite);
  if (!finite.length) return '<p class="analytics-empty">This comparison is unavailable for the selected population.</p>';
  if (kind === "bar") {
    const low = Math.min(0, ...finite), high = Math.max(0, ...finite), span = high - low || 1;
    const zero = -low / span * 100;
    return `<div class="analytics-bars" aria-label="${e(result.measure.label)} bar chart">${rows.map((row) => {
      const number = value(row), width = Number.isFinite(number) ? Math.abs(number) / span * 100 : 0;
      const left = number < 0 ? zero - width : zero;
      const canDrill = drill && ["site", "country", "setting"].includes(result.dimension?.id);
      return `<${canDrill ? "button" : "div"} ${canDrill ? `type="button" data-analytics-drill="${result.dimension.id}" data-key="${e(row.key)}"` : ""} class="analytics-bar-row" title="${e(`${row.label}: ${format(number)}; ${row.count} site-days`)}"><span>${e(row.label)}</span><span class="analytics-bar-track"><i class="analytics-zero" style="left:${zero}%"></i><i class="analytics-bar-fill${number < 0 ? " is-negative" : ""}" style="left:${left}%;width:${width}%"></i></span><strong>${e(format(number))}</strong></${canDrill ? "button" : "div"}>`;
    }).join("")}</div>`;
  }
  const showReference = result.query.operator === "Value" && result.query.comparison.kind !== "None";
  const reference = showReference ? rows.map((row) => row.reference).filter(Number.isFinite) : [];
  const low = Math.min(0, ...finite, ...reference), high = Math.max(...finite, ...reference, 0), span = high - low || 1;
  const x = (index) => rows.length === 1 ? 360 : 25 + index / (rows.length - 1) * 670;
  const y = (number) => 176 - (number - low) / span * 152;
  const path = (field) => {
    let pending = true;
    return rows.map((row, index) => {
      const number = row[field];
      if (!Number.isFinite(number)) { pending = true; return ""; }
      const point = `${pending ? "M" : "L"}${x(index).toFixed(2)},${y(number).toFixed(2)}`; pending = false; return point;
    }).join(" ");
  };
  return `<figure class="analytics-line"><div class="analytics-chart-scale"><span>${e(format(high))}</span><span>${e(format(low))}</span></div><svg viewBox="0 0 720 205" role="img" aria-labelledby="${e(id)}-title"><title id="${e(id)}-title">${e(result.measure.label)} by ${e(result.dimension?.label ?? "population")}; ${rows.length} measured groups. Exact values in the table.</title>${[0, .5, 1].map((step) => `<path class="analytics-grid-line" d="M25 ${24 + step * 152}H695"/>`).join("")}${showReference ? `<path class="analytics-reference-line" d="${path("reference")}"/>` : ""}<path class="analytics-value-line" d="${path(result.field)}"/>${rows.filter((row) => Number.isFinite(value(row))).map((row) => `<circle cx="${x(rows.indexOf(row))}" cy="${y(value(row))}" r="3.5"><title>${e(row.label)}: ${e(format(value(row)))}</title></circle>`).join("")}</svg><figcaption><span>${e(rows[0].label)}</span><span>${e(rows.at(-1).label)}</span></figcaption><div class="analytics-legend"><span><i></i>Selected period</span>${showReference ? '<span><i class="reference"></i>Aligned comparison</span>' : ""}</div></figure>`;
}

export function renderKpi(result) {
  const total = result.total;
  const change = total.percentChange;
  const beneficial = change == null ? "" : (change >= 0) === (result.measure.better === "higher") ? "delta-positive" : "delta-warn";
  return `<article class="kpi-card" data-measure="${result.measure.id}"><div class="kpi-top"><span>${escapeHtml(result.measure.label)}</span></div><strong class="kpi-value">${escapeHtml(formatMeasure(total.value, result.measure))}</strong><div class="kpi-caption">${change == null ? "No comparable baseline" : `<span class="${beneficial}">${change >= 0 ? "+" : ""}${escapeHtml(formatMeasure(change, result.measure, "PercentChange"))}</span> vs comparison`}<br>${total.count} measured site-days</div></article>`;
}

/** Descriptors own pane composition; custom operational views register by renderer key. */
export function renderPane(descriptor, { resolve, custom = {}, controls = () => "", arrange = false } = {}) {
  const result = descriptor.renderer ? null : resolve(descriptor);
  const content = descriptor.renderer ? custom[descriptor.renderer]?.() : renderChart(result, { kind: descriptor.kind, id: descriptor.id });
  if (content == null) throw new Error(`Unknown pane renderer: ${descriptor.renderer}`);
  return `<section class="panel dashboard-panel size-${escapeHtml(descriptor.size ?? "half")}" data-panel="${escapeHtml(descriptor.id)}" draggable="${arrange}"><header class="panel-heading"><div><h2>${escapeHtml(descriptor.title)}</h2>${result ? `<p>${escapeHtml(result.measure.label)} · ${escapeHtml(result.dimension?.label ?? "network")} · ${result.rows.length} of ${result.totalGroups} groups</p>` : ""}</div><div class="panel-tools">${controls(descriptor.id, descriptor.title)}</div></header><div class="panel-content">${content}${result ? `<details class="analytics-table-details"><summary>Exact values and comparisons</summary>${renderResultTable(result)}</details>` : ""}</div></section>`;
}
