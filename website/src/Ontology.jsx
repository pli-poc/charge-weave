import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Search,
  Network,
  ListTree,
  Braces,
  ShieldCheck,
  Clock3,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  RotateCcw,
  Download,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  ExternalLink,
  X,
} from "lucide-react";
import {
  model,
  cardinality,
  words,
  ancestors,
  fieldsFor,
  rulesFor,
  triplesFor,
  downloadTriples,
  loadSubjects,
} from "./model-utils";
import "./ontology.css";
import { isTime, isTimeLink, timeRole } from "./temporal-utils";
const base = import.meta.env.BASE_URL,
  repo = "https://github.com/pli-poc/charge-weave";
const sourceLink = (path) => repo + "/blob/main/" + path;

function Chip({ children, tone = "" }) {
  return <span className={"explorer-chip " + tone}>{children}</span>;
}
function TimeInspector({ name, relationship }) {
  const fields = fieldsFor(name),
    times = fields.filter((f) => isTime(f) && f.property !== "createdAt"),
    windows = fields.filter(isTimeLink);
  const [validAt, setValidAt] = useState("2026-05-02"),
    [knownAt, setKnownAt] = useState("2026-05-02");
  const value =
    !validAt ||
    !knownAt ||
    validAt < "2026-05-01" ||
    validAt >= "2026-06-01" ||
    knownAt < "2026-05-01"
      ? null
      : knownAt < "2026-05-03"
        ? "€0.30"
        : "€0.35";
  return (
    <>
      {relationship?.type === "object" && (
        <div className="inspector-section temporal-context">
          <p className="inspector-label">Relationship context</p>
          <code>{relationship.owner}.{relationship.property} → {name}</code>
          <p className="inspector-copy">
            Showing the target definition. Its time fields do not by themselves
            establish the history of this relationship.
          </p>
          <a className="inspector-link" href={base + "ontology/?class=" + relationship.owner}>
            Inspect declaring class {relationship.owner}
          </a>
        </div>
      )}
      <div className="inspector-section temporal-fields">
        <p className="inspector-label">Declared time fields · {name}</p>
        {times.length ? (
          times.map((f) => (
            <div className="time-field" key={f.property}>
              <code>{f.property}</code>
              <span>
                {cardinality[f.cardinality]} · {f.range} · {timeRole(f)}
              </span>
            </div>
          ))
        ) : (
          <p className="inspector-copy">
            This class declares no dedicated date or time field beyond inherited
            record metadata.
          </p>
        )}
        <p className="inspector-hint">
          Field meaning follows the class contract. Event timestamps and
          validity windows serve different purposes.
        </p>
      </div>
      {windows.length > 0 && (
        <div className="inspector-section temporal-windows">
          <p className="inspector-label">Linked temporal definitions</p>
          {windows.map((f) => (
            <div className="linked-time" key={f.owner + "." + f.property}>
              <a className="inspector-link" href={base + "ontology/?class=" + f.range}>
                {f.property} → {f.range}
              </a>
              <p className="inspector-hint">
                {cardinality[f.cardinality]} · declared on {f.owner} · {f.range === "TimeWindow"
                  ? "startsAt ≤ instant < endsAt; the referenced interval is half-open."
                  : "Local start/end, weekday, timezone and exception windows; DST expansion is a runtime responsibility."}
              </p>
            </div>
          ))}
        </div>
      )}
      <div className="inspector-section">
        <p className="inspector-label">Record provenance</p>
        {fields
          .filter((f) => ["createdAt", "revision"].includes(f.property))
          .map((f) => (
            <div className="time-field" key={f.property}>
              <code>{f.property}</code>
              <span>from {f.owner}</span>
            </div>
          ))}
        <p className="inspector-copy">
          Creation time and a revision number do not establish a complete
          system-time history.
        </p>
      </div>
      <div className="inspector-section temporal-coverage">
        <p className="inspector-label">System-time history</p>
        <Chip tone="amber">Not defined in model {model.version}</Chip>
        <p className="inspector-copy">
          This schema has no shared system-time interval or validAt / knownAt
          snapshot contract. Revision and receipt timestamps cannot supply that history.
          Queries and validation use standard SPARQL; a SPARQL-T engine is not implemented.
        </p>
        <a className="inspector-link" href={sourceLink("docs/temporal-model-review.md")} target="_blank" rel="noreferrer">
          Read the whole-model temporal review <ArrowUpRight size={14} />
        </a>
      </div>
      <div className="inspector-section temporal-lab">
        <Chip tone="amber">Illustration · not selected-class data</Chip>
        <h3>Two questions. Two times.</h3>
        <p className="inspector-copy">
          Explore a synthetic tariff correction. These controls illustrate the
          planned query semantics.
        </p>
        <label>
          Effective on
          <input
            type="date"
            value={validAt}
            onChange={(e) => setValidAt(e.target.value)}
          />
        </label>
        <label>
          Known on
          <input
            type="date"
            value={knownAt}
            onChange={(e) => setKnownAt(e.target.value)}
          />
        </label>
        <div className="temporal-result" aria-live="polite">
          <span>Illustrative energy rate</span>
          <strong>
            {value ? (
              <>
                {value}
                <small> / kWh</small>
              </>
            ) : (
              "No example value"
            )}
          </strong>
        </div>
        <p className="inspector-hint">
          Valid during May 2026. A rate of €0.30 is known on 1 May; a correction
          to €0.35 is recorded on 3 May, effective from 1 May. No live query or
          current bitemporal store is involved.
        </p>
      </div>
    </>
  );
}
function RelationshipGraph({
  name,
  selectedField,
  onSelectField,
  onNavigate,
  includeInherited,
}) {
  const [page, setPage] = useState(0),
    [zoom, setZoom] = useState(1),
    [direction, setDirection] = useState("both");
  const viewport = useRef(null);
  useEffect(() => {
    setPage(0);
    setZoom(1);
  }, [name, includeInherited, direction]);
  const outgoing = fieldsFor(name)
    .filter((f) => f.type === "object" && (includeInherited || !f.inherited))
    .map((f) => ({
      from: name,
      to: f.range,
      property: f.property,
      cardinality: f.cardinality,
      owner: f.owner,
    }));
  const priority = [
    "selectedTariff",
    "chargingUnit",
    "customer",
    "authorizationDecision",
  ];
  outgoing.sort(
    (a, b) =>
      (priority.includes(a.property) ? priority.indexOf(a.property) : 99) -
      (priority.includes(b.property) ? priority.indexOf(b.property) : 99),
  );
  const incoming = model.relations
    .filter((r) => r.to === name)
    .map((r) => ({ ...r, owner: r.from }));
  incoming.sort(
    (a, b) =>
      ([
        "SessionEvent",
        "ChargeDetailRecord",
        "SessionEndEvidence",
        "MeterObservation",
      ].includes(a.from)
        ? 0
        : 1) -
      ([
        "SessionEvent",
        "ChargeDetailRecord",
        "SessionEndEvidence",
        "MeterObservation",
      ].includes(b.from)
        ? 0
        : 1),
  );
  const left =
      direction === "outgoing" ? [] : incoming.slice(page * 4, page * 4 + 4),
    right =
      direction === "incoming" ? [] : outgoing.slice(page * 4, page * 4 + 4);
  const pages = Math.max(
    1,
    Math.ceil(
      Math.max(
        direction === "outgoing" ? 0 : incoming.length,
        direction === "incoming" ? 0 : outgoing.length,
      ) / 4,
    ),
  );
  const edges = [
    ...left.map((r, i) => ({ ...r, side: "left", y: 40 + i * 116 })),
    ...right.map((r, i) => ({ ...r, side: "right", y: 40 + i * 116 })),
  ];
  const active = (r) =>
    selectedField?.property === r.property && selectedField?.owner === r.owner;
  const choose = (r) =>
    onSelectField({
      ...model.classes[r.owner].fields.find((f) => f.property === r.property),
      owner: r.owner,
      inherited: r.owner !== name,
    });
  return (
    <>
      <div className="graph-toolbar">
        <span>
          <span className="legend-dot" /> Object relationships
        </span>
        <label className="sr-only" htmlFor="relationship-direction">
          Relationship direction
        </label>
        <select
          id="relationship-direction"
          value={direction}
          onChange={(e) => setDirection(e.target.value)}
        >
          <option value="both">Both directions</option>
          <option value="outgoing">Outgoing only</option>
          <option value="incoming">Incoming only</option>
        </select>
        <div className="zoom-controls">
          <button
            aria-label="Zoom out"
            disabled={zoom <= 0.8}
            onClick={() => setZoom((z) => Math.max(0.8, +(z - 0.1).toFixed(1)))}
          >
            <Minus size={15} />
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            aria-label="Zoom in"
            disabled={zoom >= 1.4}
            onClick={() => setZoom((z) => Math.min(1.4, +(z + 0.1).toFixed(1)))}
          >
            <Plus size={15} />
          </button>
          <button
            aria-label="Reset graph view"
            onClick={() => {
              setZoom(1);
              viewport.current.scrollTo(0, 0);
            }}
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>
      <div
        className="graph-viewport"
        ref={viewport}
        tabIndex={0}
        aria-label="Relationship graph. Scroll to explore, or use the relationship list below."
      >
        <div
          className="graph-space"
          style={{ width: 860 * zoom, height: 528 * zoom }}
        >
          <div className="graph-canvas" style={{ transform: `scale(${zoom})` }}>
            <div className="graph-column-label left">Referenced by</div>
            <div className="graph-column-label right">Connects to</div>
            <svg
              className="graph-lines"
              viewBox="0 0 860 528"
              aria-hidden="true"
            >
              <defs>
                <marker
                  id="relation-arrow"
                  markerWidth="6"
                  markerHeight="6"
                  refX="5"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0 0L6 3L0 6" fill="#588d7d" />
                </marker>
                <marker
                  id="relation-active"
                  markerWidth="6"
                  markerHeight="6"
                  refX="5"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0 0L6 3L0 6" fill="#9aefc7" />
                </marker>
              </defs>
              {edges.map((r, i) => (
                <path
                  key={i}
                  d={
                    r.side === "left"
                      ? `M195 ${r.y + 45} C270 ${r.y + 45},270 266,329 266`
                      : `M531 266 C592 266,592 ${r.y + 45},665 ${r.y + 45}`
                  }
                  className={active(r) ? "selected" : ""}
                  markerEnd={
                    active(r) ? "url(#relation-active)" : "url(#relation-arrow)"
                  }
                />
              ))}
            </svg>
            <div
              className="graph-node focus-node"
              style={{ left: 330, top: 216 }}
            >
              <span>Selected class</span>
              <strong>{name}</strong>
              <small>{words(model.classes[name].module)}</small>
            </div>
            {edges.map((r, i) => (
              <React.Fragment key={`${r.side}-${i}`}>
                <button
                  className={
                    "graph-node " + (active(r) ? "related-active" : "")
                  }
                  style={{ left: r.side === "left" ? 12 : 666, top: r.y }}
                  onClick={() => onNavigate(r.side === "left" ? r.from : r.to)}
                  title={"Explore " + (r.side === "left" ? r.from : r.to)}
                >
                  <span>
                    {words(
                      model.classes[r.side === "left" ? r.from : r.to].module,
                    )}
                  </span>
                  <strong>{r.side === "left" ? r.from : r.to}</strong>
                  <small>
                    Explore class <ArrowUpRight size={12} />
                  </small>
                </button>
                <button
                  className={"edge-label " + (active(r) ? "selected" : "")}
                  style={{ left: r.side === "left" ? 199 : 534, top: r.y + 12 }}
                  title={`${r.from} → ${r.property} → ${r.to}`}
                  aria-label={`Inspect ${r.from}.${r.property}`}
                  onClick={() => choose(r)}
                >
                  <span>{r.property}</span>
                  <small>
                    {cardinality[r.cardinality]} <ArrowRight size={11} />
                  </small>
                </button>
              </React.Fragment>
            ))}
            {!edges.length && (
              <p className="graph-empty">No relationships in this direction.</p>
            )}
          </div>
        </div>
      </div>
      <div className="graph-pagination">
        <span>
          {incoming.length} incoming · {outgoing.length} outgoing · 4 per side
          per page
        </span>
        <div>
          <button
            aria-label="Previous relationships"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <span>
            {page + 1} / {pages}
          </span>
          <button
            aria-label="Next relationships"
            disabled={page >= pages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <details className="relationship-list">
        <summary>Browse relationships as a list</summary>
        {[...incoming, ...outgoing].map((r, i) => (
          <button key={i} onClick={() => choose(r)}>
            <code>{r.from}</code>
            <span>{r.property} →</span>
            <code>{r.to}</code>
            <Chip>{cardinality[r.cardinality]}</Chip>
          </button>
        ))}
      </details>
    </>
  );
}
function TripleTable({ name, field }) {
  const [query, setQuery] = useState(""),
    [page, setPage] = useState(0),
    [source, setSource] = useState("all");
  useEffect(() => {
    setQuery("");
    setPage(0);
  }, [name, field?.property, field?.owner]);
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let current = true;
    setLoading(true);
    setError("");
    setAll([]);
    loadSubjects()
      .then((subjects) => {
        if (current) {
          setAll(triplesFor(name, field, subjects));
          setLoading(false);
        }
      })
      .catch(() => {
        if (current) {
          setError("Schema triples could not be loaded.");
          setLoading(false);
        }
      });
    return () => {
      current = false;
    };
  }, [name, field, retry]);
  const rows = all.filter(
    (t) =>
      (source === "all" ||
        (source === "owl"
          ? t.source.startsWith("ontology")
          : t.source.startsWith("validation"))) &&
      [t.s, t.p, t.o].some((v) =>
        v.toLowerCase().includes(query.toLowerCase()),
      ),
  );
  const blankNames = useMemo(() => {
    const m = new Map();
    for (const t of all)
      for (const term of [t.s, t.o])
        if (term.startsWith("_:") && !m.has(term))
          m.set(term, "_:b" + (m.size + 1));
    return m;
  }, [all]);
  const display = (term) => blankNames.get(term) || term;
  if (loading)
    return (
      <div className="empty-message" role="status">
        Loading schema triples…
      </div>
    );
  if (error)
    return (
      <div className="empty-message" role="alert">
        {error}
        <button className="small-button" onClick={() => setRetry((n) => n + 1)}>
          Try again
        </button>
      </div>
    );
  return (
    <div className="triples-view">
      <div className="table-toolbar">
        <label className="search-control">
          <Search size={16} />
          <input
            aria-label="Filter schema triples"
            placeholder="Filter subject, predicate, object…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
          />
        </label>
        <select
          aria-label="Triple source"
          value={source}
          onChange={(e) => {
            setSource(e.target.value);
            setPage(0);
          }}
        >
          <option value="all">OWL + SHACL</option>
          <option value="owl">OWL ontology</option>
          <option value="shacl">SHACL structure</option>
        </select>
        <button
          className="small-button"
          onClick={() =>
            downloadTriples(rows, name + (field ? "-" + field.property : ""))
          }
        >
          <Download size={15} /> Export .nt
        </button>
      </div>
      <p className="table-note">
        Actual schema triples from the repository, including referenced blank
        nodes.{" "}
        {field
          ? "Showing the selected property contract."
          : "Includes inherited definitions."}{" "}
        Blank-node labels are shortened for display; exports preserve their
        identifiers.
      </p>
      <div className="data-table-scroll">
        <table className="data-table triples-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Predicate</th>
              <th>Object</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(page * 20, page * 20 + 20).map((t, i) => (
              <tr key={i}>
                <td>
                  <code title={t.s}>{display(t.s)}</code>
                </td>
                <td>
                  <code>{t.p}</code>
                </td>
                <td>
                  <code title={t.o}>{display(t.o)}</code>
                  <a
                    className="triple-source"
                    href={sourceLink(t.source)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t.source.startsWith("ontology") ? "OWL" : "SHACL"}{" "}
                    <ExternalLink size={10} />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && (
        <p className="empty-message">No triples match this filter.</p>
      )}
      <div className="graph-pagination">
        <span>{rows.length} triples</span>
        <div>
          <button
            aria-label="Previous triples"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <span>
            {page + 1} / {Math.max(1, Math.ceil(rows.length / 20))}
          </span>
          <button
            aria-label="Next triples"
            disabled={(page + 1) * 20 >= rows.length}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
export default function Ontology() {
  const initial = new URLSearchParams(location.search).get("class");
  const [name, setName] = useState(
    model.classes[initial] ? initial : "ChargingSession",
  );
  const [query, setQuery] = useState(""),
    [module, setModule] = useState("all"),
    [view, setView] = useState("relationships"),
    [inspector, setInspector] = useState("semantic"),
    [includeInherited, setIncludeInherited] = useState(false),
    [browseOpen, setBrowseOpen] = useState(false);
  const [selectedField, setSelectedField] = useState(() => {
    const n = model.classes[initial] ? initial : "ChargingSession";
    const f = model.classes[n].fields.find(
      (f) => f.property === "selectedTariff",
    );
    return f ? { ...f, owner: n, inherited: false } : null;
  });
  const definition = model.classes[name],
    allFields = fieldsFor(name),
    fields = allFields.filter((f) => includeInherited || !f.inherited),
    rules = rulesFor(name);
  const found = Object.entries(model.classes)
    .filter(
      ([n, c]) =>
        (module === "all" || c.module === module) &&
        [n, c.definition, ...c.fields.map((f) => f.property)].some((x) =>
          x.toLowerCase().includes(query.toLowerCase()),
        ),
    )
    .sort(([a], [b]) => a.localeCompare(b));
  function navigate(next) {
    setName(next);
    setSelectedField(null);
    setQuery("");
    setModule("all");
    setBrowseOpen(false);
    const url = new URL(location.href);
    url.searchParams.set("class", next);
    history.replaceState(null, "", url);
  }
  function inspect(f) {
    setSelectedField(f);
    setInspector("semantic");
    if (matchMedia("(max-width: 1349px)").matches) {
      requestAnimationFrame(() =>
        document.querySelector(".inspector")?.scrollIntoView({
          block: "start",
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        }),
      );
    }
  }
  const temporalName =
    selectedField?.type === "object" ? selectedField.range : selectedField?.owner || name;
  const tabs = [
    ["relationships", Network, "Relationships"],
    ["triples", Braces, "Triples"],
    ["fields", ListTree, "Fields"],
    ["rules", ShieldCheck, "Rules"],
  ];
  return (
    <main id="main" className="ontology-page">
      <div className="explorer-heading">
        <div>
          <p className="eyebrow">The definitions behind the platform</p>
          <h1>
            Ontology explorer
            <span className="beta-label">Read-only preview</span>
          </h1>
          <p>Follow a relationship. Inspect its meaning. See how time fits.</p>
        </div>
        <div className="model-badge">
          <Layers size={18} />
          <div>
            <strong>Model {model.version}</strong>
            <span>
              {Object.keys(model.classes).length} classes ·{" "}
              {model.modules.length} modules
            </span>
          </div>
        </div>
      </div>
      <div className="explorer-workspace">
        <aside
          className={"definition-browser " + (browseOpen ? "browse-open" : "")}
          aria-label="Definition browser"
        >
          <div className="browser-heading">
            <h2>Browse definitions</h2>
            <button
              className="mobile-browser-close"
              aria-label="Close definitions"
              onClick={() => setBrowseOpen(false)}
            >
              <X size={18} />
            </button>
          </div>
          <label className="search-control">
            <Search size={16} />
            <input
              aria-label="Search definitions"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search classes or fields…"
            />
          </label>
          <label className="module-label" htmlFor="module-filter">
            Domain module
          </label>
          <select
            id="module-filter"
            value={module}
            onChange={(e) => setModule(e.target.value)}
          >
            <option value="all">All modules ({model.modules.length})</option>
            {model.modules.map((m) => (
              <option key={m} value={m}>
                {words(m)}
              </option>
            ))}
          </select>
          <div className="browser-count">{found.length} definitions</div>
          <div className="definition-list">
            {found.map(([n, c]) => (
              <button
                key={n}
                className={n === name ? "active" : ""}
                aria-pressed={n === name}
                onClick={() => navigate(n)}
              >
                <span className="class-dot" />
                <span>
                  {words(n)}
                  <small>{words(c.module)}</small>
                </span>
                {n === name && <ChevronRight size={14} />}
              </button>
            ))}
            {!found.length && (
              <p className="empty-message">
                No matching definitions.
                <button
                  onClick={() => {
                    setQuery("");
                    setModule("all");
                  }}
                >
                  Clear filters
                </button>
              </p>
            )}
          </div>
          <a
            className="browser-source"
            href={sourceLink("model/domain.schema")}
            target="_blank"
            rel="noreferrer"
          >
            View source model <ArrowUpRight size={14} />
          </a>
        </aside>
        <section className="explorer-center" aria-label="Selected class">
          <div className="class-heading">
            <div className="class-breadcrumb">
              <button
                className="browse-toggle"
                onClick={() => setBrowseOpen(!browseOpen)}
                aria-expanded={browseOpen}
              >
                {browseOpen ? (
                  <PanelLeftClose size={16} />
                ) : (
                  <PanelLeftOpen size={16} />
                )}{" "}
                Definitions
              </button>
              <span>{words(definition.module)}</span>
              <ChevronRight size={13} />
              <code>{name}</code>
            </div>
            <div className="selected-class-title">
              <h2>{words(name)}</h2>
              <Chip>OWL class</Chip>
            </div>
            <p>{definition.definition}</p>
            <div className="class-meta">
              <span>{definition.fields.length} declared fields</span>
              <span>
                {
                  model.relations.filter(
                    (r) => r.from === name || r.to === name,
                  ).length
                }{" "}
                declared connections
              </span>
              {definition.parent && (
                <button onClick={() => navigate(definition.parent)}>
                  extends {definition.parent} <ArrowUpRight size={12} />
                </button>
              )}
            </div>
          </div>
          <div
            className="explorer-tabs"
            role="group"
            aria-label="Ontology view"
          >
            {tabs.map(([id, Icon, label]) => (
              <button
                key={id}
                aria-pressed={view === id}
                onClick={() => setView(id)}
              >
                <Icon size={16} />
                {label}
                {id === "rules" && <span>{rules.length}</span>}
              </button>
            ))}
          </div>
          <div className="view-options">
            <p>
              {view === "relationships"
                ? "Class contracts · arrows follow property direction"
                : view === "triples"
                  ? "RDF schema · source-backed assertions"
                  : view === "fields"
                    ? "Property contracts · structural requirements"
                    : "Declared validation rules · not executed here"}
            </p>
            {view !== "triples" && view !== "rules" && (
              <label>
                <input
                  type="checkbox"
                  checked={includeInherited}
                  onChange={(e) => setIncludeInherited(e.target.checked)}
                />{" "}
                Inherited fields
              </label>
            )}
            {view === "triples" && selectedField && (
              <button onClick={() => setSelectedField(null)}>
                Show full class <X size={13} />
              </button>
            )}
          </div>
          {view === "relationships" && (
            <RelationshipGraph
              name={name}
              selectedField={selectedField}
              onSelectField={inspect}
              onNavigate={navigate}
              includeInherited={includeInherited}
            />
          )}
          {view === "fields" && (
            <div className="data-table-scroll">
              <table className="data-table fields-table">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Range</th>
                    <th>Count</th>
                    <th>Declared on</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((f) => (
                    <tr
                      key={f.owner + f.property}
                      className={
                        selectedField?.property === f.property
                          ? "row-selected"
                          : ""
                      }
                    >
                      <td>
                        <button onClick={() => inspect(f)}>{f.property}</button>
                        <small>
                          {f.type === "object"
                            ? "Relationship"
                            : f.type === "enum"
                              ? "Controlled vocabulary"
                              : f.type === "iri"
                                ? "IRI"
                                : "Literal value"}
                        </small>
                      </td>
                      <td>
                        {model.classes[f.range] ? (
                          <button
                            className="range-link"
                            onClick={() => navigate(f.range)}
                          >
                            {f.range}
                            <ArrowUpRight size={12} />
                          </button>
                        ) : (
                          <code>{f.range}</code>
                        )}
                      </td>
                      <td>
                        <Chip>{cardinality[f.cardinality]}</Chip>
                      </td>
                      <td>{f.owner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {view === "triples" && (
            <TripleTable name={name} field={selectedField} />
          )}
          {view === "rules" && (
            <div className="rules-view">
              <p className="table-note">
                Rules targeting this class and its ancestors. Structural field
                constraints are shown under Fields. OWL describes meaning; SHACL
                checks conformance. This viewer does not run a reasoner or
                validator.
              </p>
              {rules.map((r) => (
                <details className="rule-card" key={r.id}>
                  <summary>
                    <span>{r.id}</span>
                    <div>
                      {r.message}
                      <small>
                        Target: {r.target}
                        {r.target !== name ? " · inherited" : ""}
                      </small>
                    </div>
                    <Plus size={16} />
                  </summary>
                  <pre>{r.query}</pre>
                  <a
                    href={sourceLink("queries/" + r.id + ".rq")}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open source query <ArrowUpRight size={13} />
                  </a>
                </details>
              ))}
              {!rules.length && (
                <p className="empty-message">
                  No targeted business rules in this snapshot. Inspect Fields
                  for structural constraints.
                </p>
              )}
            </div>
          )}
          <div className="canvas-note">
            <ShieldCheck size={15} />
            <p>
              These are system definitions, not operational records. A class
              relationship summarizes its field contract; it is not an instance
              triple.
            </p>
          </div>
        </section>
        <aside
          className="inspector"
          aria-label="Semantic and temporal inspector"
        >
          <div className="inspector-heading">
            <span>Inspector</span>
            <Chip tone="mint">Definition</Chip>
          </div>
          <div className="inspected-name">
            <span>
              {selectedField
                ? "Property on " + selectedField.owner
                : "Selected class"}
            </span>
            <h2>{selectedField?.property || name}</h2>
          </div>
          <div
            className="inspector-tabs"
            role="group"
            aria-label="Inspector view"
          >
            <button
              aria-pressed={inspector === "semantic"}
              onClick={() => setInspector("semantic")}
            >
              <Braces size={14} /> Semantic
            </button>
            <button
              aria-pressed={inspector === "temporal"}
              onClick={() => setInspector("temporal")}
            >
              <Clock3 size={14} /> Temporal
            </button>
          </div>
          {inspector === "semantic" ? (
            <>
              <div className="inspector-section">
                <p className="inspector-label">Semantic contract</p>
                {selectedField ? (
                  <>
                    <dl className="contract-facts">
                      <div>
                        <dt>Property type</dt>
                        <dd>
                          {selectedField.type === "datatype"
                            ? "Datatype property"
                            : "Object property"}
                        </dd>
                      </div>
                      <div>
                        <dt>Range / values</dt>
                        <dd>{selectedField.range}</dd>
                      </div>
                      <div>
                        <dt>Cardinality</dt>
                        <dd>
                          <Chip tone="mint">
                            {cardinality[selectedField.cardinality]}
                          </Chip>
                        </dd>
                      </div>
                      <div>
                        <dt>Declared on</dt>
                        <dd>{selectedField.owner}</dd>
                      </div>
                    </dl>
                    {selectedField.values && (
                      <div className="enum-values">
                        {selectedField.values.map((v) => (
                          <Chip key={v}>{v}</Chip>
                        ))}
                      </div>
                    )}
                    {selectedField.type === "object" && (
                      <>
                        <button
                          className="inspector-link"
                          onClick={() => navigate(selectedField.range)}
                        >
                          Explore {words(selectedField.range)}{" "}
                          <ArrowRight size={14} />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <p className="inspector-copy">{definition.definition}</p>
                    <dl className="contract-facts">
                      <div>
                        <dt>Parent</dt>
                        <dd>{definition.parent || "Root class"}</dd>
                      </div>
                      <div>
                        <dt>Inherited from</dt>
                        <dd>{ancestors(name).join(" → ") || "None"}</dd>
                      </div>
                      <div>
                        <dt>Namespace</dt>
                        <dd className="namespace-value">{model.namespace}</dd>
                      </div>
                    </dl>
                    <p className="inspector-hint">
                      The namespace is a development placeholder. Term
                      identities are preserved from the source model.
                    </p>
                  </>
                )}
              </div>
              <div className="inspector-section">
                <p className="inspector-label">
                  <Clock3 size={13} /> Time at a glance
                </p>
                <strong className="temporal-class-name">{temporalName}</strong>
                <div className="temporal-tags">
                  {fieldsFor(temporalName)
                    .filter(isTime)
                    .map((f) => (
                      <button
                        key={f.property}
                        onClick={() => setInspector("temporal")}
                      >
                        {f.property}
                      </button>
                    ))}
                </div>
                <div className="inspector-copy">
                  {fieldsFor(temporalName).filter(isTimeLink).map((f) => (
                    <button className="inspector-link" key={f.property} onClick={() => setInspector("temporal")}>
                      {f.property} → {f.range}
                    </button>
                  ))}
                  No shared system-time history is defined. Open Temporal for field meanings and coverage.
                </div>
                <button
                  className="inspector-link"
                  onClick={() => setInspector("temporal")}
                >
                  Inspect temporal design <ArrowRight size={14} />
                </button>
              </div>
              <div className="inspector-section">
                <p className="inspector-label">
                  Evidence, not a live validation
                </p>
                {selectedField && (
                  <details className="code-contract">
                    <summary>SHACL field shape</summary>
                    <code>
                      cd:{selectedField.owner}_{selectedField.property}Shape
                    </code>
                    <p>
                      {["!", "+"].includes(selectedField.cardinality)
                        ? "At least one value required."
                        : "No minimum count required."}{" "}
                      {["!", "?"].includes(selectedField.cardinality)
                        ? "At most one value."
                        : "No maximum count specified."}
                    </p>
                  </details>
                )}
                {selectedField?.type === "object" && (
                  <p className="inspector-copy">
                    {model.classes[selectedField.range].definition}
                  </p>
                )}
                <p className="inspector-copy">
                  Cardinality comes from the class contract. Additional
                  constraints and business rules remain in the linked SHACL and
                  SPARQL sources.
                </p>
                <button
                  className="inspector-link"
                  onClick={() => setView("triples")}
                >
                  View schema triples <Braces size={14} />
                </button>
                <a
                  className="inspector-link"
                  href={sourceLink("validation/structure.shacl.ttl")}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open SHACL source <ArrowUpRight size={14} />
                </a>
              </div>
            </>
          ) : (
            <TimeInspector name={temporalName} relationship={selectedField} />
          )}
        </aside>
      </div>
      <div className="explorer-provenance">
        <span>
          <Layers size={14} /> Model {model.version} · source schema SHA-256{" "}
          {model.sourceHash.slice(0, 12)}
        </span>
        <span>
          Read-only · OWL + SHACL + SPARQL definitions · No operational data
        </span>
      </div>
      <section className="concept-preview">
        <details>
          <summary>
            View the original explorer design concept <ArrowUpRight size={15} />
          </summary>
          <p>
            A visual direction study. The interactive explorer above uses the
            repository definitions.
          </p>
          <a
            href={`${base}ontology-concept.webp`}
            target="_blank"
            rel="noreferrer"
          >
            <img
              src={`${base}ontology-concept.webp`}
              alt="Original ChargeWeave ontology explorer concept showing a relationship canvas, definitions browser, triples table and semantic and temporal inspector"
              loading="lazy"
            />
          </a>
        </details>
      </section>
    </main>
  );
}
