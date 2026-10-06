import profile from "../../../model/analytics-profile.json" with { type: "json" };
export { profile };
const DAY = 86400000;
const permittedKeys = new Set(["subject", "measure", "dimension", "filters", "time", "comparison", "operator", "ranking", "having"]);

function requireThat(condition, message) { if (!condition) throw new Error(message); }
function timestamp(value) {
  requireThat(typeof value === "string" && /T.*(?:Z|[+-]\d\d:\d\d)$/.test(value), "Use a timestamp with a timezone.");
  const instant = Date.parse(value);
  requireThat(Number.isFinite(instant), "Invalid timestamp.");
  return instant;
}
function windowOf(window) {
  const start = timestamp(window?.start), end = timestamp(window?.end);
  requireThat(end > start && start % DAY === 0 && end % DAY === 0, "Select a positive interval of complete UTC days.");
  return { start, end };
}
function matches(row, filter) {
  const actual = row[profile.dimensions.find((item) => item.id === filter.dimension).field];
  return filter.operator === "Equal" ? actual === filter.values[0] : filter.values.includes(actual);
}
function aggregate(rows, measure) {
  if (!rows.length) return { value: null, numerator: null, denominator: null, count: 0 };
  const values = rows.map((row) => row[measure.field]);
  requireThat(values.every(Number.isFinite), "A required measurement is missing; the result is unavailable.");
  const numerator = measure.aggregation === "Maximum" ? Math.max(...values) : values.reduce((a, b) => a + b, 0);
  const denominator = measure.denominator ? rows.reduce((sum, row) => {
    requireThat(Number.isFinite(row[measure.denominator]) && row[measure.denominator] >= 0, "Invalid denominator.");
    return sum + row[measure.denominator];
  }, 0) : null;
  if (measure.aggregation === "RatioOfSums") {
    requireThat(rows.every((row) => row[measure.field] >= 0 && row[measure.field] <= row[measure.denominator]), "Available time must be within eligible time on every fact.");
    requireThat(numerator >= 0 && numerator <= denominator, "Available time must be within eligible time.");
  }
  return { value: measure.aggregation === "RatioOfSums" ? (denominator ? numerator / denominator * measure.scale : null) : numerator * measure.scale,
    numerator, denominator, count: rows.length };
}
function compare(current, reference) {
  const change = current == null || reference == null ? null : current - reference;
  return { change, percentChange: change == null || reference === 0 ? null : change / Math.abs(reference) * 100 };
}
function groupRows(rows, dimension) {
  const groups = new Map();
  for (const row of rows) {
    const key = dimension ? String(row[dimension.field]) : "network";
    if (!groups.has(key)) groups.set(key, { label: dimension ? String(row[dimension.labelField ?? dimension.field]) : "Owned network", rows: [] });
    groups.get(key).rows.push(row);
  }
  return groups;
}

export function createQuery({ measure = "energy", dimension = "site", period = "q3", country = "all", site = "all", setting = "all",
  operator = "Value", comparison = "PreviousPeriod", limit = 0, direction = "Descending", knownAt = profile.knowledgeCutoffs[0].id } = {}) {
  const selection = profile.periods.find((item) => item.id === period);
  requireThat(selection, "Unknown reporting period.");
  const definition = profile.measures.find((item) => item.id === measure);
  requireThat(definition, "Unknown measure.");
  const effectiveComparison = comparison === "PreviousPeriod" && !selection.reference ? "None" : comparison;
  return { subject: profile.subject.id, measure, dimension, operator,
    filters: [{ dimension: "country", value: country }, { dimension: "site", value: site }, { dimension: "setting", value: setting }]
      .filter((item) => item.value !== "all").map((item) => ({ dimension: item.dimension, operator: "Equal", values: [item.value], stage: "BeforeAggregation", datatype: "string" })),
    time: { start: selection.start, end: selection.end, knownAt, timezone: "UTC", bucket: "Day" },
    comparison: { kind: effectiveComparison, ...(effectiveComparison === "PreviousPeriod" ? { window: selection.reference } : effectiveComparison === "Target" ? { target: definition.target } : {}) },
    ranking: { by: operator, direction, limit: Number(limit), ties: "StableKey" },
  };
}

/** Approved flat analytical projection only. No arbitrary query code, evaluation or joins. */
export function executeAnalytics(dataset, query, { tenant = "cw-demo", siteIds = dataset.sites.map((site) => site.id) } = {}) {
  requireThat(dataset.tenant === tenant, "The requested tenant is not authorized.");
  requireThat(Object.keys(query).every((key) => permittedKeys.has(key)), "Unsupported query field.");
  requireThat(query.subject === profile.subject.id, "Unknown subject.");
  const measure = profile.measures.find((item) => item.id === query.measure);
  const dimension = query.dimension ? profile.dimensions.find((item) => item.id === query.dimension) : null;
  requireThat(measure && (!query.dimension || dimension), "Unknown measure or dimension.");
  requireThat(query.time.timezone === "UTC" && query.time.bucket === "Day", "This adapter supports UTC daily facts.");
  const window = windowOf(query.time), known = timestamp(query.time.knownAt);
  requireThat(known <= timestamp(dataset.recordedThrough), "Knowledge cutoff is beyond the retained synthetic snapshot.");
  const completeThrough = Math.min(known, timestamp(dataset.completeThrough));
  requireThat(window.start >= timestamp(dataset.start) && window.end <= completeThrough, "The reporting period is incomplete at this knowledge cutoff.");
  const ranking = query.ranking;
  requireThat(Number.isInteger(ranking?.limit) && ranking.limit >= 0 && ranking.limit <= 10000 && ranking.ties === "StableKey", "Invalid ranking constraint.");
  requireThat(["Ascending", "Descending"].includes(ranking.direction), "Unknown ranking direction.");
  requireThat(profile.operators.some((item) => item.id === query.operator) && ranking.by === query.operator, "Unknown analytical operator or ranking measure.");
  requireThat(Array.isArray(query.filters), "Filters must be explicit.");
  for (const filter of query.filters) {
    requireThat(profile.dimensions.some((item) => item.id === filter.dimension) && ["Equal", "In"].includes(filter.operator)
      && filter.datatype === "string" && filter.stage === "BeforeAggregation" && Array.isArray(filter.values)
      && filter.values.length > 0 && filter.values.every((value) => typeof value === "string")
      && (filter.operator !== "Equal" || filter.values.length === 1), "Unsupported or incorrectly typed filter.");
  }
  const comparison = query.comparison;
  requireThat(["None", "PreviousPeriod", "Target"].includes(comparison?.kind), "Unknown comparison.");
  requireThat(query.operator === "Value" || comparison.kind !== "None", "A change operator needs a comparison.");
  requireThat(comparison.kind === "PreviousPeriod" || !comparison.window, "Unexpected comparison window.");
  requireThat(comparison.kind === "Target" || comparison.target == null, "Unexpected comparison target.");
  if (comparison.kind === "Target") requireThat(Number.isFinite(comparison.target), "This measure has no fixed target.");
  const referenceWindow = comparison.kind === "PreviousPeriod" ? windowOf(comparison.window) : null;
  if (referenceWindow) requireThat(referenceWindow.start >= timestamp(dataset.start) && referenceWindow.end <= window.start,
    "Comparison must be a retained, non-overlapping previous period.");
  if (query.having) requireThat(["GreaterOrEqual", "LessThan"].includes(query.having.operator) && Number.isFinite(query.having.value), "Invalid post-aggregation filter.");

  const allowed = new Set(siteIds), latest = new Map();
  for (const row of dataset.rows) {
    if (row.tenant !== tenant || !allowed.has(row.siteId) || timestamp(row.recordedAt) > known) continue;
    const old = latest.get(row.id);
    if (old && row.revision === old.revision) requireThat(JSON.stringify(old) === JSON.stringify(row), "Conflicting duplicate fact revision.");
    if (!old || row.revision > old.revision) latest.set(row.id, row);
  }
  const selected = [...latest.values()].filter((row) => query.filters.every((filter) => matches(row, filter)));
  const rowsIn = (range) => selected.filter((row) => timestamp(row.start) >= range.start && timestamp(row.end) <= range.end);
  const currentRows = rowsIn(window), referenceRows = referenceWindow ? rowsIn(referenceWindow) : [];
  // The adapter attests complete inverse populations. Detect absent daily facts independently.
  const expectedSites = dataset.sites.filter((site) => allowed.has(site.id) && query.filters.filter((f) => ["site", "country", "setting"].includes(f.dimension)).every((filter) => matches({ siteId: site.id, ...site }, filter)));
  for (const range of [window, referenceWindow].filter(Boolean)) {
    const relevant = rowsIn(range);
    const timeFilters = query.filters.filter((f) => ["day", "month"].includes(f.dimension));
    const expected = [];
    for (let at = range.start; at < range.end; at += DAY) {
      const day = new Date(at).toISOString().slice(0, 10);
      if (timeFilters.every((filter) => matches({ day, month: day.slice(0, 7) }, filter))) for (const site of expectedSites) expected.push(`${site.id}:${day}`);
    }
    const present = new Set(relevant.map((row) => row.id));
    requireThat(relevant.length === expected.length && expected.every((id) => present.has(id)), "Source population is incomplete; missing days are unavailable.");
  }
  if (measure.currency) requireThat([...currentRows, ...referenceRows].every((row) => row.currency === measure.currency), "Mixed currencies need an explicit conversion policy.");
  const currentGroups = groupRows(currentRows, dimension), referenceGroups = groupRows(referenceRows, dimension);
  // Time comparisons align buckets by position within each explicitly selected calendar period.
  const aligned = dimension?.kind === "time" ? [...referenceGroups.values()] : null;
  let rows = [...currentGroups].map(([key, group], index) => {
    const current = aggregate(group.rows, measure);
    const reference = comparison.kind === "Target" ? comparison.target : comparison.kind === "PreviousPeriod"
      ? aggregate((aligned ? aligned[index] : referenceGroups.get(key))?.rows ?? [], measure).value : null;
    return { key, label: group.label, ...current, reference, ...compare(current.value, reference) };
  });
  const field = { Value: "value", Change: "change", PercentChange: "percentChange" }[query.operator];
  if (query.having) rows = rows.filter((row) => row[field] != null && (query.having.operator === "GreaterOrEqual" ? row[field] >= query.having.value : row[field] < query.having.value));
  rows.sort((a, b) => (a[field] == null ? (b[field] == null ? 0 : 1) : b[field] == null ? -1 : (a[field] - b[field]) * (ranking.direction === "Ascending" ? 1 : -1)) || a.key.localeCompare(b.key, "en"));
  const totalGroups = rows.length;
  if (ranking.limit) rows = rows.slice(0, ranking.limit);
  const total = aggregate(currentRows, measure);
  const reference = comparison.kind === "Target" ? comparison.target : referenceWindow ? aggregate(referenceRows, measure).value : null;
  return { measure, dimension, query, rows, total: { ...total, reference, ...compare(total.value, reference) }, field, totalGroups,
    evidence: { source: dataset.id, sourceVersion: dataset.version, profileVersion: profile.version, metricVersion: measure.version,
      grain: profile.subject.grain, population: currentRows.length, referencePopulation: referenceRows.length,
      knownAt: query.time.knownAt, completeThrough: new Date(completeThrough).toISOString(),
      selectedRevisions: currentRows.map((row) => ({ id: row.id, revision: row.revision, recordedAt: row.recordedAt })),
      referenceRevisions: referenceRows.map((row) => ({ id: row.id, revision: row.revision, recordedAt: row.recordedAt })),
      tenant, authorizedSites: [...allowed].sort(), comparisonAlignment: dimension?.kind === "time" ? "Ordinal calendar bucket; totals are not normalized for unequal period lengths" : "Same authorized site population",
      synthetic: true, formula: measure.description },
  };
}
