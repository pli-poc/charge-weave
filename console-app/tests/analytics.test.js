import { test } from "node:test";
import assert from "node:assert/strict";
import { ownSites } from "../src/data.js";
import { createAnalyticsDataset } from "../src/analytics/fixture.js";
import { createQuery, executeAnalytics } from "../src/analytics/engine.js";
import { renderChart, renderPane } from "../src/components/analytics-panes.js";
import { defaultAnalyticsState, normalizeAnalyticsState } from "../src/analytics/dashboard.js";

const dataset = createAnalyticsDataset(ownSites);
const query = (options = {}) => createQuery(options);
const daily = (measure = "energy") => ({ ...query({ measure, comparison: "None" }), time: { start: "2026-01-01T00:00:00Z", end: "2026-01-02T00:00:00Z", knownAt: dataset.recordedThrough, timezone: "UTC", bucket: "Day" } });
const copied = () => structuredClone(dataset);

test("synthetic history covers every site/day with one explicit delayed correction", () => {
  assert.equal(dataset.rows.length, 365 * 8 + 1);
  assert.deepEqual(dataset, createAnalyticsDataset(ownSites));
  assert.ok(dataset.rows.every((row) => row.start < row.end && row.energyKwh >= 0 && row.eligibleSeconds >= row.availableSeconds));
});

test("availability combines eligible time rather than averaging site percentages", () => {
  const toy = copied(); toy.sites = ownSites.slice(0, 2);
  toy.rows = toy.rows.filter((row) => row.day === "2026-01-01" && toy.sites.some((site) => site.id === row.siteId));
  Object.assign(toy.rows[0], { availableSeconds: 100, eligibleSeconds: 100 });
  Object.assign(toy.rows[1], { availableSeconds: 0, eligibleSeconds: 900 });
  const result = executeAnalytics(toy, daily("availability"));
  assert.equal(result.total.value, 10);
  assert.equal(result.rows.reduce((sum, row) => sum + row.value, 0) / 2, 50);
});

test("filters, grouping and totals agree; ranking does not change the total population", () => {
  const country = executeAnalytics(dataset, query({ dimension: "country" }));
  const nl = executeAnalytics(dataset, query({ country: "NL" }));
  assert.equal(country.rows.find((row) => row.key === "NL").value, nl.total.value);
  const all = executeAnalytics(dataset, query()), top = executeAnalytics(dataset, query({ limit: 3 }));
  assert.equal(top.rows.length, 3); assert.equal(top.totalGroups, 8); assert.equal(top.total.value, all.total.value);
  assert.equal(all.evidence.population, 8 * 92);
});

test("a delayed correction is unavailable before its knowledge time and counted once afterward", () => {
  const options = { period: "september", comparison: "None", country: "NL", site: ownSites[0].id };
  const old = executeAnalytics(dataset, query({ ...options, knownAt: "2026-10-01T00:00:00Z" }));
  const latest = executeAnalytics(dataset, query(options));
  assert.ok(Math.abs(latest.total.value - old.total.value - 120) < 1e-8);
  assert.equal(latest.total.count, old.total.count);
  assert.equal(latest.evidence.selectedRevisions.find((row) => row.id.endsWith("2026-09-15")).revision, 2);
});

test("incomplete periods, missing daily population and missing measurements cannot become zero", () => {
  assert.throws(() => executeAnalytics(dataset, query({ period: "year", knownAt: "2026-10-01T00:00:00Z" })), /incomplete/);
  const missingDay = copied(); missingDay.rows.splice(0, 1);
  assert.throws(() => executeAnalytics(missingDay, daily()), /population is incomplete/);
  const missingValue = copied(); delete missingValue.rows[0].energyKwh;
  assert.throws(() => executeAnalytics(missingValue, daily()), /measurement is missing/);
});

test("zero denominators and zero baselines produce explicit unavailable values", () => {
  const toy = copied(); toy.rows.filter((row) => row.day === "2026-01-01").forEach((row) => Object.assign(row, { availableSeconds: 0, eligibleSeconds: 0 }));
  assert.equal(executeAnalytics(toy, daily("availability")).total.value, null);
  const q = daily(); q.comparison = { kind: "Target", target: 0 };
  assert.equal(executeAnalytics(dataset, q).total.percentChange, null);
});

test("duplicate transport records do not multiply energy; conflicting revisions are rejected", () => {
  const duplicate = copied(); duplicate.rows.push({ ...duplicate.rows[0] });
  assert.equal(executeAnalytics(duplicate, daily()).total.value, executeAnalytics(dataset, daily()).total.value);
  duplicate.rows.at(-1).energyKwh += 1;
  assert.throws(() => executeAnalytics(duplicate, daily()), /Conflicting duplicate/);
});

test("currency mixing needs an explicit conversion contract", () => {
  const mixed = copied(); mixed.rows[0].currency = "GBP";
  assert.throws(() => executeAnalytics(mixed, daily("value")), /Mixed currencies/);
});

test("tenant and site scope are applied before analytical grouping", () => {
  assert.throws(() => executeAnalytics(dataset, daily(), { tenant: "other" }), /not authorized/);
  const scoped = executeAnalytics(dataset, daily(), { siteIds: [ownSites[0].id] });
  assert.equal(scoped.total.count, 1); assert.equal(scoped.rows.length, 1);
  assert.equal(scoped.rows[0].key, ownSites[0].id);
});

test("typed filters, operators, comparison windows and ranking constraints reject unsafe intent", () => {
  const q = query(); q.filters = [{ dimension: "country", operator: "Equal", values: [42], datatype: "decimal", stage: "BeforeAggregation" }];
  assert.throws(() => executeAnalytics(dataset, q), /typed filter/);
  assert.throws(() => executeAnalytics(dataset, { ...query(), dimension: "invoice.line.amount" }), /Unknown measure or dimension/);
  assert.throws(() => executeAnalytics(dataset, query({ limit: -1 })), /ranking constraint/);
  assert.throws(() => executeAnalytics(dataset, query({ comparison: "None", operator: "Change" })), /needs a comparison/);
  const overlapping = query(); overlapping.comparison.window = overlapping.time;
  assert.throws(() => executeAnalytics(dataset, overlapping), /non-overlapping/);
});

test("ranking ties are stable and post-aggregation filtering changes rows only", () => {
  const toy = copied(); toy.rows.filter((row) => row.day === "2026-01-01").forEach((row) => { row.energyKwh = 10; });
  const q = daily(); q.ranking.limit = 1;
  assert.equal(executeAnalytics(toy, q).rows[0].key, [...ownSites.map((site) => site.id)].sort()[0]);
  q.having = { operator: "LessThan", value: 9 };
  const result = executeAnalytics(toy, q); assert.equal(result.rows.length, 0); assert.equal(result.total.value, 80);
});

test("calendar comparisons align month positions and preserve period-specific day counts", () => {
  const result = executeAnalytics(dataset, query({ dimension: "month", operator: "Change" }));
  assert.equal(result.rows.length, 3);
  const april = executeAnalytics(dataset, { ...query({ comparison: "None", dimension: "" }), time: { ...query().time, start: "2026-04-01T00:00:00Z", end: "2026-05-01T00:00:00Z" } });
  assert.equal(result.rows.find((row) => row.key === "2026-07").reference, april.total.value);
});

test("shared chart renderers handle negative changes, unavailable results and escaped labels", () => {
  const result = executeAnalytics(dataset, query({ measure: "availability", operator: "Change" }));
  assert.match(renderChart(result), /is-negative/);
  result.rows[0].label = '<img src=x onerror="alert(1)">';
  assert.doesNotMatch(renderChart(result), /<img/);
  assert.match(renderChart(result, { kind: "line" }), /role="img"/);
  assert.match(renderPane({ id: "test", title: "Test", kind: "table" }, { resolve: () => result }), /Exact values/);
  assert.throws(() => renderPane({ id: "bad", renderer: "bad" }), /Unknown pane renderer/);
});

test("changing reporting period or measure normalizes incompatible comparison controls", () => {
  const state = { ...defaultAnalyticsState, period: "year", operator: "Change" };
  normalizeAnalyticsState(state); assert.equal(state.comparison, "None"); assert.equal(state.operator, "Value");
});
