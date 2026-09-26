import { useMemo, useState } from "react";
import { Activity, ArrowDownToLine, Check, CirclePlay, Database, GitBranch, RotateCcw } from "lucide-react";
import { DEFAULT_COMPOSITION, PROTOCOL_PROFILES, SCENARIOS, runtimeFactory, runSimulation } from "./simulation/runtime.js";
import { STORE_TYPES } from "./simulation/stores.js";
import "./simulation.css";

const storeNames = {
  semantic: "Semantic graph",
  operational: "Operational state",
  temporal: "Temporal events",
  telemetry: "Telemetry series",
  evidence: "Evidence payloads",
};

function formatMoney(amount, currency) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(amount);
}

function downloadRun(result) {
  const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${result.run.id.toLowerCase()}-replay.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function AdapterSelect({ label, value, options, onChange, disabled = false }) {
  return (
    <label className="sim-adapter-row">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled || options.length < 2}>
        {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
      </select>
      <small>{options.length > 1 ? `${options.length} registered adapters` : "one adapter registered"}</small>
    </label>
  );
}

function TimelinePanel({ result }) {
  return (
    <div className="sim-table-wrap">
      <table className="sim-timeline-table">
        <thead><tr><th>Virtual time</th><th>Step</th><th>Process observation</th><th>Result</th></tr></thead>
        <tbody>
          {result.timeline.map((item, index) => (
            <tr key={`${item.kind}-${index}`}>
              <td><time>{new Date(item.at).toISOString().slice(11, 19)}Z</time></td>
              <td><span className={`sim-kind sim-kind-${item.kind}`}>{item.kind}</span></td>
              <td><strong>{item.title}</strong><small>{item.detail}</small></td>
              <td><span className={`sim-result sim-result-${item.status}`}>{item.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      {!result.timeline.length && <p className="sim-empty">No process events were produced.</p>}
    </div>
  );
}

function ProtocolPanel({ result }) {
  const [protocol, setProtocol] = useState("ocpp");
  const entries = result.protocols[protocol];
  return (
    <div className="sim-panel-stack">
      <div className="sim-subnav" aria-label="Protocol trace">
        <button type="button" aria-pressed={protocol === "ocpp"} onClick={() => setProtocol("ocpp")}>OCPP · {entries.length}</button>
        <button type="button" aria-pressed={protocol === "ocpi"} onClick={() => setProtocol("ocpi")}>OCPI · {result.protocols.ocpi.length}</button>
      </div>
      <p className="sim-profile-line">{protocol === "ocpp" ? PROTOCOL_PROFILES.ocpp : PROTOCOL_PROFILES.ocpi}</p>
      <div className="sim-trace-list">
        {entries.map((entry) => (
          <details key={entry.id} className="sim-trace-card">
            <summary>
              <time>{new Date(entry.at).toISOString().slice(11, 19)}Z</time>
              {protocol === "ocpp" ? <><b>{entry.messageType}</b><span>{entry.direction}</span><code>{entry.action}</code></> : <><b>{entry.method}</b><span>{entry.from}</span><code>{entry.path}</code></>}
            </summary>
            <pre>{JSON.stringify(protocol === "ocpp" ? entry.frame : { request: entry.request, response: entry.response }, null, 2)}</pre>
          </details>
        ))}
        {!entries.length && <p className="sim-empty">No messages were generated for this profile.</p>}
      </div>
      <p className="sim-note">These are local JSON fixtures. The simulator does not open a WebSocket or send HTTP requests.</p>
    </div>
  );
}

function TemporalQuery({ records }) {
  const energyRows = records.filter((row) => row.key?.endsWith(":energy"));
  const knownTimes = [...new Set(energyRows.map((row) => row.recordedAt))].sort();
  const effectiveTimes = [...new Set(energyRows.map((row) => row.validAt))].sort();
  const [knownAt, setKnownAt] = useState("");
  const effectiveAt = effectiveTimes.at(-1) ?? "";
  const selectedKnownAt = knownTimes.includes(knownAt) ? knownAt : knownTimes.at(-1) ?? "";
  const result = energyRows
    .filter((row) => row.validAt <= effectiveAt && row.recordedAt <= selectedKnownAt)
    .sort((a, b) => a.validAt.localeCompare(b.validAt) || a.recordedAt.localeCompare(b.recordedAt))
    .at(-1);

  return (
    <div className="sim-temporal-query">
      <div><strong>Bitemporal read</strong><small>Value effective at {effectiveAt ? new Date(effectiveAt).toISOString().slice(11, 19) + "Z" : "—"}</small></div>
      <label htmlFor="sim-known-at">Known by
        <select id="sim-known-at" aria-label="Temporal knowledge time" value={selectedKnownAt} onChange={(event) => setKnownAt(event.target.value)} disabled={!knownTimes.length}>
          {knownTimes.map((time) => <option key={time} value={time}>{new Date(time).toISOString().slice(11, 19)}Z</option>)}
        </select>
      </label>
      <output className="sim-temporal-query-output">{result ? <><strong>{Number(result.value).toFixed(3)} kWh</strong><small>recorded at {new Date(result.recordedAt).toISOString().slice(11, 19)}Z</small></> : "No energy record at this point in the run."}</output>
    </div>
  );
}

function StoresPanel({ result }) {
  const [store, setStore] = useState("semantic");
  return (
    <div className="sim-panel-stack">
      <div className="sim-store-tabs" aria-label="Simulated store inspector">
        {STORE_TYPES.map((type) => (
          <button key={type} type="button" aria-pressed={store === type} onClick={() => setStore(type)}>
            {storeNames[type]} <span>{result.stores[type].length}</span>
          </button>
        ))}
      </div>
      <div className="sim-store-summary">
        <Database size={17} />
        <span>{storeNames[store]} · {result.stores[store].length} records · provider <code>{result.run.composition.stores[store]}</code></span>
      </div>
      {store === "temporal" && <TemporalQuery records={result.stores.temporal} />}
      <pre className="sim-json-panel">{JSON.stringify(result.stores[store], null, 2)}</pre>
      {store === "evidence" && <p className="sim-note">Fixture fingerprints help compare replays; they are not cryptographic digests or production evidence signatures.</p>}
      {store === "temporal" && <p className="sim-note">Each record keeps valid time (when it applied) and recorded time (when the simulator received it).</p>}
    </div>
  );
}

function RecordPanel({ result }) {
  return (
    <div className="sim-record-grid">
      <section className="sim-record-checks">
        <h3>Local contract checks</h3>
        <ul>{result.checks.map((check) => <li key={check.id}><Check size={15} data-passed={check.passed} /><span><strong>{check.id}</strong><small>{check.detail}</small></span></li>)}</ul>
      </section>
      <section>
        <h3>Replay record</h3>
        <pre className="sim-json-panel">{JSON.stringify(result.run, null, 2)}</pre>
        <p className="sim-note">The run fingerprint uses a deterministic non-cryptographic fixture hash. Replays compare the complete configuration, trace and store snapshots.</p>
      </section>
    </div>
  );
}

export default function SimulationWorkbench() {
  const adapters = useMemo(() => runtimeFactory.availableAdapters(), []);
  const [seed, setSeed] = useState("4242");
  const [scenario, setScenario] = useState("happy-path");
  const [composition, setComposition] = useState(DEFAULT_COMPOSITION);
  const [activePanel, setActivePanel] = useState("timeline");
  const [result, setResult] = useState(() => runSimulation({ seed: "4242", scenario: "happy-path" }));
  const [runError, setRunError] = useState("");

  function changeInput(boundary, id) {
    setComposition((current) => ({ ...current, inputs: { ...current.inputs, [boundary]: id } }));
  }

  function changeStore(type, id) {
    setComposition((current) => ({ ...current, stores: { ...current.stores, [type]: id } }));
  }

  function run() {
    try {
      setResult(runSimulation({ seed, scenario, composition }));
      setRunError("");
      setActivePanel("timeline");
    } catch (error) {
      setRunError(error.message);
    }
  }

  function reset() {
    setSeed("4242");
    setScenario("happy-path");
    setComposition(DEFAULT_COMPOSITION);
    setResult(runSimulation({ seed: "4242", scenario: "happy-path" }));
    setRunError("");
    setActivePanel("timeline");
  }

  return (
    <section className="container sim-workbench" aria-label="Browser simulation workbench">
      <div className="sim-workbench-intro">
        <div>
          <p className="eyebrow">Executable browser prototype</p>
          <h2>Run a journey. Inspect every boundary.</h2>
          <p>Compose a seeded roaming charge, then inspect local protocol frames, process decisions and five independent simulated stores. The full run is synchronous browser code.</p>
        </div>
        <div className="sim-run-stamp"><Activity size={17} /><span>Local synthetic runtime</span><small>No API, socket or database calls</small></div>
      </div>

      <div className="sim-workbench-grid">
        <aside className="sim-controls">
          <div className="sim-control-heading"><div><p className="eyebrow">Configure a run</p><h3>Factory switchboard</h3></div><GitBranch size={21} /></div>
          <label className="sim-form-field" htmlFor="sim-seed"><span>Random seed</span><input id="sim-seed" value={seed} onChange={(event) => setSeed(event.target.value)} maxLength={48} /><small>Same seed, scenario, versions and adapters produce the same run.</small></label>
          <label className="sim-form-field" htmlFor="sim-scenario"><span>Process scenario</span><select id="sim-scenario" value={scenario} onChange={(event) => setScenario(event.target.value)}>{SCENARIOS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><small>{SCENARIOS.find((item) => item.id === scenario)?.description}</small></label>
          <div className="sim-adapter-group">
            <h4>Protocol and feed inputs</h4>
            {[["ocpp", "OCPP ingress"], ["ocpi", "OCPI exchange"], ["grid", "Grid and tariff"]].map(([boundary, label]) => (
              <AdapterSelect key={boundary} label={label} value={composition.inputs[boundary]} options={adapters.inputs[boundary]} onChange={(id) => changeInput(boundary, id)} />
            ))}
            <AdapterSelect label="Process engine" value={composition.process} options={adapters.process} onChange={(id) => setComposition((current) => ({ ...current, process: id }))} />
          </div>
          <div className="sim-adapter-group">
            <h4>Independent store providers</h4>
            {STORE_TYPES.map((type) => (
              <AdapterSelect key={type} label={storeNames[type]} value={composition.stores[type]} options={adapters.stores[type]} onChange={(id) => changeStore(type, id)} />
            ))}
          </div>
          <div className="sim-controls-actions">
            <button className="sim-run-button" type="button" onClick={run}><CirclePlay size={17} /> Run simulation</button>
            <button className="sim-reset-button" type="button" onClick={reset}><RotateCcw size={16} /> Reset</button>
          </div>
          {runError && <p className="sim-error" role="alert">{runError}</p>}
          <p className="sim-unavailable"><strong>Live adapters:</strong> none are registered yet. Future adapters appear here only after their boundary contracts are implemented.</p>
        </aside>

        <div className="sim-output">
          <div className="sim-outcome-card" data-status={result.summary.status}>
            <div className="sim-outcome-top"><div><p className="eyebrow">Last deterministic run</p><h3>{result.summary.status === "completed" ? "Journey completed" : "Journey rejected"}</h3></div><span className="sim-outcome-pill">{result.run.scenario}</span></div>
            <div className="sim-metric-grid">
              <div><span>Session energy</span><strong>{result.summary.energyKwh.toFixed(3)} <small>kWh</small></strong></div>
              <div><span>Synthetic energy cost</span><strong>{formatMoney(result.summary.totalCost, result.summary.currency)}</strong></div>
              <div><span>OCPP messages</span><strong>{result.protocols.ocpp.length}</strong></div>
              <div><span>Store records</span><strong>{Object.values(result.summary.storageRows).reduce((sum, count) => sum + count, 0)}</strong></div>
            </div>
            <p className="sim-run-identity">Run <code>{result.run.id}</code><span>Seed <code>{result.run.seed}</code></span><span>Hash <code>{result.run.fingerprint}</code></span></p>
          </div>

          <div className="sim-result-heading"><div><p className="eyebrow">Inspect the run</p><h3>Process trace and state</h3></div><button type="button" onClick={() => downloadRun(result)}><ArrowDownToLine size={16} /> Export replay JSON</button></div>
          <div className="sim-panel-tabs" role="tablist" aria-label="Simulation result panels">
            {[["timeline", "Timeline"], ["protocols", "Protocol trace"], ["stores", "Store inspector"], ["record", "Run record"]].map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={activePanel === id} onClick={() => setActivePanel(id)}>{label}</button>)}
          </div>
          <div className="sim-panel-content">
            {activePanel === "timeline" && <TimelinePanel result={result} />}
            {activePanel === "protocols" && <ProtocolPanel result={result} />}
            {activePanel === "stores" && <StoresPanel result={result} />}
            {activePanel === "record" && <RecordPanel result={result} />}
          </div>
          <div className="sim-standards-note"><strong>Standards boundary</strong><p>Versioned OCPP and OCPI fixtures cover selected exchanges used by these journeys. They are not exhaustive schemas, live protocol stacks, partner interoperability tests or certification evidence.</p></div>
        </div>
      </div>
    </section>
  );
}
