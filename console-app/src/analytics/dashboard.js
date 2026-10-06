import { createQuery, profile } from "./engine.js";
import { escapeHtml as e, renderChart, renderKpi, renderResultTable, renderPane, formatMeasure } from "../components/analytics-panes.js";

export const defaultAnalyticsState = { period: "q3", measure: "energy", dimension: "site", country: "all", site: "all", setting: "all",
  comparison: "PreviousPeriod", operator: "Value", limit: "0", direction: "Descending", knownAt: profile.knowledgeCutoffs[0].id, chart: "bar" };
export const overviewDescriptors = profile.dashboards.overview.panes;
function select(label, field, options, state) {
  return `<label>${e(label)}<select data-analytics-field="${field}">${options.map((item) => `<option value="${e(item.id)}"${String(state[field]) === String(item.id) ? " selected" : ""}>${e(item.label)}</option>`).join("")}</select></label>`;
}

export function analyticsControls(state, sites, { compact = false } = {}) {
  const measure = profile.measures.find((item) => item.id === state.measure);
  const period = profile.periods.find((item) => item.id === state.period);
  const countries = [...new Set(sites.map((site) => site.country))];
  const comparisons = [{ id: "None", label: "No comparison" }, ...(period.reference ? [{ id: "PreviousPeriod", label: "Previous calendar period" }] : []),
    ...(!compact && measure.target != null ? [{ id: "Target", label: `Target (${measure.target}%)` }] : [])];
  return `<form class="analytics-controls${compact ? " is-compact" : ""}" aria-label="Analytics controls">${select("Reporting period", "period", profile.periods, state)}${select("Country", "country", [{ id: "all", label: "All owned countries" }, ...countries.map((id) => ({ id, label: id === "NL" ? "Netherlands" : "Belgium" }))], state)}
    ${compact ? "" : select("Measure", "measure", profile.measures, state) + select("Group by", "dimension", profile.dimensions, state)}
    ${select("Comparison", "comparison", comparisons, state)}${compact ? "" : select("Show", "operator", profile.operators.filter((item) => state.comparison !== "None" || item.id === "Value"), state)
      + select("Site", "site", [{ id: "all", label: "All owned sites" }, ...sites.filter((site) => state.country === "all" || site.country === state.country).map((site) => ({ id: site.id, label: site.name }))], state)
      + select("Site setting", "setting", [{ id: "all", label: "All settings" }, ...[...new Set(sites.map((site) => site.setting))].map((id) => ({ id, label: id }))], state)
      + select("Rank direction", "direction", [{ id: "Descending", label: "Highest first" }, { id: "Ascending", label: "Lowest first" }], state)
      + select("Result limit", "limit", [{ id: "0", label: "All groups" }, { id: "3", label: "Top / bottom 3" }, { id: "5", label: "Top / bottom 5" }, { id: "10", label: "Top / bottom 10" }], state)}
    ${select("Knowledge cutoff", "knownAt", profile.knowledgeCutoffs, state)}
    <button class="quiet-button" type="button" data-action="reset-analytics">Reset filters</button></form>`;
}

export function normalizeAnalyticsState(state) {
  const period = profile.periods.find((item) => item.id === state.period);
  const measure = profile.measures.find((item) => item.id === state.measure);
  if ((state.comparison === "PreviousPeriod" && !period.reference) || (state.comparison === "Target" && measure.target == null)) state.comparison = "None";
  if (state.comparison === "None") state.operator = "Value";
}

export function resolveResult(provider, state, overrides = {}) {
  return provider.queryAnalytics(createQuery({ ...state, ...overrides }));
}

export function renderOverviewAnalytics(provider, state, { order, hidden, controls, arrange, custom } = {}) {
  const kpis = profile.dashboards.overview.kpis.map((measure) => renderKpi(resolveResult(provider, state, { measure, dimension: "", operator: "Value", comparison: state.comparison === "Target" ? "None" : state.comparison, limit: 0 })));
  const descriptors = new Map(overviewDescriptors.map((pane) => [pane.id, pane]));
  const panes = order.filter((id) => descriptors.has(id) && !hidden.includes(id)).map((id) => renderPane(descriptors.get(id), {
    resolve: (pane) => resolveResult(provider, state, { ...pane, operator: "Value", comparison: state.comparison === "Target" ? "None" : state.comparison }),
    controls, arrange, custom,
  }));
  return `<section class="kpi-grid" aria-label="Measured network performance">${kpis.join("")}</section><div class="dashboard-grid${arrange ? " is-arranging" : ""}" id="dashboard-grid">${panes.join("") || '<p class="analytics-empty">All panes are hidden. Choose panes below to restore them.</p>'}</div>`;
}

export function renderPanePreferences(hidden) {
  return `<details class="analytics-pane-preferences"><summary>Choose dashboard panes</summary><div>${overviewDescriptors.map((pane) => `<label><input type="checkbox" data-pane-visible="${pane.id}"${hidden.includes(pane.id) ? "" : " checked"}>${e(pane.title)}</label>`).join("")}</div></details>`;
}

export function renderAnalyticsPage(provider, state) {
  let result;
  try { result = resolveResult(provider, state); }
  catch (error) { return `${analyticsControls(state, provider.getSites())}<div class="analytics-empty" role="status">${e(error.message)}</div>`; }
  const total = result.total;
  return `${analyticsControls(state, provider.getSites())}<div class="analytics-question"><span class="eyebrow">OWNED NETWORK PERFORMANCE</span><h2>${e(result.measure.label)} by ${e(result.dimension?.label ?? "population").toLowerCase()}</h2><p>${e(result.measure.description)}</p><span>${result.evidence.population} site-days · ${result.rows.length} of ${result.totalGroups} groups · UTC reporting days</span></div>
    <div class="analytics-summary">${renderKpi(result)}<article><span>Comparison value</span><strong>${e(formatMeasure(total.reference, result.measure))}</strong><small>Same authorized site population</small></article><article><span>Absolute change</span><strong>${e(formatMeasure(total.change, result.measure, "Change"))}</strong><small>${e(result.query.comparison.kind === "PreviousPeriod" ? "Calendar periods; totals not normalized by day count" : "Declared comparison")}</small></article></div>
    <section class="panel analytics-explorer"><header class="panel-heading"><h2>${e(result.measure.label)} distribution</h2><div class="segmented-control" role="group" aria-label="Chart view">${[["bar", "Bars"], ["line", "Trend"], ["table", "Table"]].map(([id, label]) => `<button type="button" data-analytics-chart="${id}" class="${state.chart === id ? "is-active" : ""}" aria-pressed="${state.chart === id}">${label}</button>`).join("")}</div></header><div class="panel-content">${renderChart(result, { kind: state.chart, id: "analytics-explorer" })}</div></section>
    ${state.chart === "table" ? "" : `<details class="analytics-table-details"><summary>Exact values and comparisons</summary>${renderResultTable(result)}</details>`}
    <details class="analytics-evidence"><summary>How this result was calculated</summary><dl><dt>Source</dt><dd>${e(result.evidence.source)} · synthetic year · source v${e(result.evidence.sourceVersion)}</dd><dt>Metric / profile version</dt><dd>${e(result.evidence.metricVersion)} / ${e(result.evidence.profileVersion)}</dd><dt>Calculation grain</dt><dd>${e(result.evidence.grain)}</dd><dt>Aggregation</dt><dd>${e(result.measure.aggregation)}${total.denominator == null ? "" : ` · ${e(total.numerator)} available / ${e(total.denominator)} eligible point-seconds`}</dd><dt>Reporting interval</dt><dd>${e(result.query.time.start)} → ${e(result.query.time.end)} (end excluded)</dd><dt>Knowledge cutoff</dt><dd>${e(result.evidence.knownAt)}</dd><dt>Complete through</dt><dd>${e(result.evidence.completeThrough)}</dd><dt>Comparison alignment</dt><dd>${e(result.evidence.comparisonAlignment)}</dd><dt>Data scope</dt><dd>Owned NL/BE sites; event-time grouping. Roaming and live sessions have separate populations.</dd></dl><button class="secondary-button" type="button" data-action="export-analytics">Export result and calculation evidence</button></details>
    <p class="workspace-footnote">Illustrative synthetic data for learning and demonstration. Full-year figures include simulated future days. Values are computed from the selected facts; no live metering, billing or identity service is connected.</p>`;
}
