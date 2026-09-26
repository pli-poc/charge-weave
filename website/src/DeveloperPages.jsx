import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  Braces,
  Check,
  Clock3,
  Database,
  FileKey2,
  GitBranch,
  Layers3,
  Network,
  PlugZap,
  Radio,
  RotateCcw,
  ShieldCheck,
  Shuffle,
  Waypoints,
} from "lucide-react";
import SimulationWorkbench from "./SimulationWorkbench.jsx";
import "./developer.css";

const base = import.meta.env.BASE_URL;
const developerUrl = (slug = "") => `${base}developer/${slug ? slug + "/" : ""}`;
const pages = [
  { id: "runtime", route: "developer", label: "Runtime" },
  { id: "simulator", route: "developer/simulator", label: "Simulator" },
  { id: "protocols", route: "developer/protocols", label: "Protocols" },
  { id: "switchboard", route: "developer/switchboard", label: "Switchboard" },
  { id: "storage", route: "developer/storage", label: "Storage" },
  { id: "replay", route: "developer/replay", label: "Replay" },
];

function GuideLayout({ page, title, description, children }) {
  return (
    <main id="main" className="dev-guide-page">
      <div className="container">
        <div className="dev-breadcrumb">
          <a href={base}>Overview</a>
          <span>/</span>
          <a href={developerUrl()}>Developer guide</a>
          <span>/</span>
          <span>{pages.find((item) => item.id === page)?.label}</span>
        </div>
        <header className="dev-guide-hero">
          <div>
            <p className="eyebrow">Developer design · Browser prototype</p>
            <h1>{title}</h1>
            <p className="dev-hero-description">{description}</p>
          </div>
          <aside className="dev-status-card">
            <span className="dev-status-dot" />
            <strong>Browser-hosted synthetic runtime</strong>
            <p>
              Run deterministic process fixtures before selecting or deploying
              infrastructure.
            </p>
            <span className="dev-status-label">Live adapters not registered</span>
          </aside>
        </header>
        <nav className="dev-guide-nav" aria-label="Developer guide pages">
          {pages.map((item) => (
            <a
              key={item.id}
              href={developerUrl(item.route === "developer" ? "" : item.id)}
              aria-current={page === item.id ? "page" : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="dev-guide-content">{children}</div>
    </main>
  );
}

function SectionTitle({ eyebrow, title, children }) {
  return (
    <div className="dev-section-title">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  );
}

function PageLink({ to, children }) {
  return (
    <a className="dev-page-link" href={developerUrl(to)}>
      <span>{children}</span>
      <ArrowRight size={17} />
    </a>
  );
}

function RuntimePage() {
  const stages = [
    {
      number: "01",
      icon: <Braces />,
      title: "Scenario and run record",
      text: "Choose actors, protocol profiles, virtual time and optional fault injections.",
    },
    {
      number: "02",
      icon: <Shuffle />,
      title: "Runtime factory",
      text: "Compose virtual or later live adapters independently from process logic and stores.",
    },
    {
      number: "03",
      icon: <Waypoints />,
      title: "Shared process model",
      text: "Map protocol exchanges into ontology-aligned events and business transitions.",
    },
    {
      number: "04",
      icon: <Database />,
      title: "Simulated store ports",
      text: "Record semantic, operational, temporal, telemetry and evidence views in the browser.",
    },
  ];
  const links = [
    ["simulator", "Simulator", "Run a seeded charge and inspect protocol and store output."],
    ["protocols", "Protocol adapters", "Versioned exchanges and actor boundaries."],
    ["switchboard", "Switchboard", "Change one source without changing every store."],
    ["storage", "Storage contracts", "Test distinct storage behavior without database products."],
    ["replay", "Deterministic replay", "Repeat the same process run from a saved seed."],
  ];
  return (
    <>
      <section className="container dev-runtime-section">
        <SectionTitle eyebrow="One runtime, replaceable boundaries" title="Exercise the process in the browser.">
          The synthetic runtime exercises protocol-shaped inputs, process rules
          and storage behavior together, with no cloud services, message broker
          or database required.
        </SectionTitle>
        <div className="dev-runtime-flow" aria-label="Synthetic runtime flow">
          {stages.map((stage) => (
            <article key={stage.number}>
              <div className="dev-flow-topline">
                <span>{stage.number}</span>
                {stage.icon}
              </div>
              <h3>{stage.title}</h3>
              <p>{stage.text}</p>
            </article>
          ))}
        </div>
        <div className="dev-callout">
          <ShieldCheck size={24} />
          <div>
            <strong>Executable simulator; live systems remain unconnected</strong>
            <p>
              The browser runs a deterministic subset of virtual OCPP and OCPI
              exchanges against five in-memory store contracts. These fixtures
              test process behavior; they do not establish protocol certification.
            </p>
          </div>
        </div>
      </section>
      <section className="dev-scenario-band">
        <div className="container">
          <SectionTitle eyebrow="A process to prove" title="Follow one roaming charge from request to correction.">
            A single journey can test partner exchange, station behavior,
            metering, temporal history and commercial evidence.
          </SectionTitle>
          <ol className="dev-journey-list">
            {[
              "An eMSP requests a charging start through its simulated OCPI adapter.",
              "The CPO issues a station action through the selected OCPP adapter.",
              "The virtual station reports transaction changes and meter readings.",
              "The process rates the session, records a CDR and shares the result.",
              "A duplicate or late reading tests recovery without erasing prior evidence.",
            ].map((step, index) => (
              <li key={step}>
                <span>0{index + 1}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="container dev-page-index">
        <SectionTitle eyebrow="Developer guide" title="Read the design by boundary." />
        <div className="dev-link-grid">
          {links.map(([to, title, text]) => (
            <article key={to}>
              <p className="eyebrow">{title}</p>
              <p>{text}</p>
              <PageLink to={to}>Open {title.toLowerCase()}</PageLink>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function ProtocolsPage() {
  const protocols = [
    {
      icon: <PlugZap />,
      name: "OCPP",
      boundary: "Charge point ↔ CSMS / CPO",
      text: "A virtual station exchanges versioned messages for connection, authorization, transaction updates, meter values and charging control.",
      profile: "Browser fixture baseline: OCPP 2.1 Edition 1, limited to selected station startup, authorization, remote-start and transaction-event shapes.",
      href: "https://openchargealliance.org/protocols/ocpp-protocols/",
      source: "Open Charge Alliance protocol editions",
    },
    {
      icon: <Network />,
      name: "OCPI",
      boundary: "eMSP ↔ CPO / roaming hub",
      text: "Virtual participants exercise version discovery, credentials and selected module exchanges for tokens, locations, sessions, tariffs, commands and CDRs.",
      profile: "Browser fixture baseline: OCPI 2.3.0 Core Commands, Sessions and CDRs for the shown roaming journey.",
      href: "https://github.com/ocpi/ocpi",
      source: "OCPI specification and release branches",
    },
    {
      icon: <Radio />,
      name: "ISO 15118",
      boundary: "EV ↔ EV supply equipment",
      text: "Keep vehicle-to-equipment communication as its own optional simulation boundary for selected identification, Plug & Charge or energy-transfer scenarios.",
      profile: "Add only the use cases that the selected process needs. Do not treat an OCPP exchange as a substitute for this boundary.",
      href: "https://www.iso.org/standard/69113.html",
      source: "ISO 15118-1 overview",
    },
  ];
  return (
    <>
      <section className="container dev-protocol-section">
        <SectionTitle eyebrow="Protocol boundaries" title="Simulate the exchange. Keep business meaning separate.">
          Each adapter validates its declared message profile, then maps the
          exchange to canonical domain events. A protocol transaction and a
          ChargeWeave business session remain related but distinct records.
        </SectionTitle>
        <div className="dev-protocol-grid">
          {protocols.map((protocol) => (
            <article key={protocol.name} className="dev-protocol-card">
              <div className="dev-card-icon">{protocol.icon}</div>
              <p className="eyebrow">{protocol.boundary}</p>
              <h3>{protocol.name}</h3>
              <p>{protocol.text}</p>
              <div className="dev-profile-note">
                <strong>Profile selection</strong>
                <p>{protocol.profile}</p>
              </div>
              <a href={protocol.href} target="_blank" rel="noreferrer">
                {protocol.source} <ArrowUpRight size={15} />
              </a>
            </article>
          ))}
        </div>
      </section>
      <section className="dev-scenario-band">
        <div className="container">
          <SectionTitle eyebrow="Adapter responsibility" title="Translate at the edge; preserve the trace.">
            Every event keeps its source, protocol version, profile, correlation
            identifier and timestamps so a process result can be followed back
            to the exchange that informed it.
          </SectionTitle>
          <div className="dev-adapter-flow">
            {["Protocol envelope", "Versioned adapter", "Canonical event", "Process + stores"].map(
              (label, index) => (
                <div key={label}>
                  <span>0{index + 1}</span>
                  <strong>{label}</strong>
                </div>
              ),
            )}
          </div>
          <p className="dev-inline-note">
            The simulator can test protocol-shaped payloads and selected state
            transitions. It must not describe those scenarios as complete
            standard support or certification.
          </p>
        </div>
      </section>
      <section className="container dev-boundary-note">
        <Clock3 size={24} />
        <div>
          <h3>Later live connections have a different runtime boundary.</h3>
          <p>
            A browser can open a WebSocket client connection, but it cannot host
            the always-on OCPP server endpoint a charging station connects to.
            A future live-ingress adapter may therefore sit behind a small
            gateway; the browser simulator and its downstream process contract
            can stay the same.
          </p>
          <a
            href="https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API"
            target="_blank"
            rel="noreferrer"
          >
            Browser WebSocket API <ArrowUpRight size={15} />
          </a>
        </div>
      </section>
    </>
  );
}

function SwitchboardPage() {
  const modes = [
    ["Virtual", "Generated inputs, synthetic processes and simulated stores. The default development mode."],
    ["Observe", "Selected external input is inspected read-only; process output and stores remain synthetic."],
    ["Hybrid", "Choose real or virtual adapters per boundary while keeping the rest of the composition simulated."],
    ["Live", "A future deployment mode for explicitly enabled live adapters and their required service endpoints."],
  ];
  return (
    <>
      <section className="container dev-switch-section">
        <SectionTitle eyebrow="Runtime factory" title="Switch one boundary at a time.">
          A run is composed from source, process and store adapters. Choosing a
          live OCPP source does not silently replace OCPI, the process runtime or
          any storage adapter.
        </SectionTitle>
        <div className="dev-mode-grid">
          {modes.map(([name, description], index) => (
            <article key={name} className={index === 0 ? "is-default" : ""}>
              <span>0{index + 1}</span>
              <h3>{name}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="dev-scenario-band">
        <div className="container">
          <SectionTitle eyebrow="Composition example" title="Replace OCPP ingress; keep everything downstream synthetic.">
            The factory reads one serializable configuration for a run. These
            names describe adapter choices, not production products.
          </SectionTitle>
          <pre className="dev-code"><code>{`{
  "inputs": {
    "ocpp": "virtual",
    "ocpi": "virtual",
    "grid": "scenario"
  },
  "process": "synthetic",
  "stores": {
    "semantic": "memory",
    "operational": "memory",
    "temporal": "memory",
    "telemetry": "memory",
    "evidence": "memory"
  }
}`}</code></pre>
          <p className="dev-inline-note">
            A later composition can change only <code>inputs.ocpp</code> to a
            gateway-backed adapter. The process and store entries stay exactly
            as shown.
          </p>
        </div>
      </section>
      <section className="container dev-switch-matrix">
        <SectionTitle eyebrow="Independent controls" title="Each adapter has its own mode and status." />
        <div className="dev-table-wrap">
          <table>
            <thead>
              <tr><th>Boundary</th><th>Virtual mode</th><th>Switch scope</th><th>Live prerequisite</th></tr>
            </thead>
            <tbody>
              <tr><th>OCPP ingress</th><td>Virtual station and deterministic message stream</td><td>OCPP source only</td><td>Always-on protocol gateway for inbound station connections</td></tr>
              <tr><th>OCPI exchange</th><td>Virtual eMSP and CPO participants</td><td>OCPI source only</td><td>Approved partner endpoint and a suitable integration boundary</td></tr>
              <tr><th>Grid and tariff inputs</th><td>Scenario values and virtual clock</td><td>Each input feed separately</td><td>External feed adapter and mapped units/timestamps</td></tr>
              <tr><th>Storage ports</th><td>Browser-local simulated stores</td><td>Each store type separately</td><td>Store adapter that passes the same contract checks</td></tr>
            </tbody>
          </table>
        </div>
        <div className="dev-callout">
          <GitBranch size={23} />
          <div>
            <strong>One factory, explicit composition</strong>
            <p>
              The runtime factory rejects unsupported combinations and labels
              every run with the source mode of each input and store.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function StoragePage() {
  const stores = [
    {
      icon: <Layers3 />,
      name: "Semantic graph",
      role: "Concepts, facts and links",
      behavior: "Keep named graph scope, stable synthetic subjects and source provenance so semantic facts can be inspected independently.",
      probe: "Can the process preserve a stable subject and source link for each event?",
    },
    {
      icon: <Boxes />,
      name: "Operational state",
      role: "Current workflow records",
      behavior: "Store sessions and lifecycle state with a revision counter, allowed transitions and event idempotency.",
      probe: "Does replaying a command create a second business action?",
    },
    {
      icon: <Clock3 />,
      name: "Temporal event store",
      role: "What applied and what was known",
      behavior: "Append event and correction history with valid time and recorded time, and query what was known at an earlier point.",
      probe: "What did the platform know before a late meter correction arrived?",
    },
    {
      icon: <Radio />,
      name: "Telemetry series",
      role: "Meter readings and measurements",
      behavior: "Keep observation time, receipt time, unit, source, sequence and quality so duplicates and delayed samples can be tested.",
      probe: "Can a late reading be added without changing the event that first closed a session?",
    },
    {
      icon: <FileKey2 />,
      name: "Evidence objects",
      role: "Original protocol payloads and documents",
      behavior: "Retain original fixture payloads and a repeatable non-cryptographic fingerprint to test lineage from process decision to source evidence.",
      probe: "Can a CDR and settlement result be traced to the messages and tariff version used?",
    },
  ];
  return (
    <>
      <section className="container dev-storage-section">
        <SectionTitle eyebrow="Storage ports" title="Simulate storage behavior, not database brands.">
          Each store has a small contract and an in-browser test double. The
          runtime can replace one implementation later without changing the
          business journey that uses it.
        </SectionTitle>
        <div className="dev-storage-grid">
          {stores.map((store) => (
            <article key={store.name}>
              <div className="dev-card-icon">{store.icon}</div>
              <p className="eyebrow">{store.role}</p>
              <h3>{store.name}</h3>
              <p>{store.behavior}</p>
              <div className="dev-probe"><span>Contract probe</span><p>{store.probe}</p></div>
            </article>
          ))}
        </div>
      </section>
      <section className="dev-scenario-band">
        <div className="container">
          <SectionTitle eyebrow="Shared trace" title="One decision can be inspected across every store." />
          <div className="dev-trace-row">
            {[
              ["Protocol evidence", "OCPP frame + fixture fingerprint"],
              ["Canonical event", "Stable event ID + provenance"],
              ["Temporal record", "Valid and recorded time"],
              ["Meter series", "Unit + arrival time + sequence"],
            ].map(([title, text], index) => (
              <article key={title}>
                <span>0{index + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
          <p className="dev-inline-note">
            Browser memory is enough for fresh-run tests. Browser-local persistence
            can be added for saved replays; neither option implies a production
            database choice.
          </p>
        </div>
      </section>
      <section className="container dev-boundary-note">
        <ShieldCheck size={24} />
        <div>
          <h3>Contract tests define the safe replacement point.</h3>
          <p>
            Before a real store is connected, it must pass the same checks for
            identity, temporal semantics, idempotency, provenance and correction
            behavior that the simulated store passes.
          </p>
        </div>
      </section>
    </>
  );
}

function ReplayPage() {
  return (
    <>
      <section className="container dev-replay-section">
        <SectionTitle eyebrow="Repeatable process tests" title="Random-looking data, exactly replayable runs.">
          A seed controls generated identifiers, actors, readings and injected
          failures. A virtual clock and stable event scheduler remove dependence
          on wall time or browser timing.
        </SectionTitle>
        <pre className="dev-code"><code>{`{
  "scenario": "roaming-cdr-correction",
  "scenarioVersion": 1,
  "seed": 4242,
  "prngVersion": "chargeweave-xorshift32-v1",
  "clock": {
    "mode": "virtual",
    "startAt": "2026-09-26T08:00:00Z"
  },
  "profiles": {
    "ocpp": "OCPP 2.1 Edition 1 / transaction basics fixture subset",
    "ocpi": "OCPI 2.3.0 Core / Commands + Sessions + CDRs"
  },
  "composition": {
    "inputs": { "ocpp": "virtual", "ocpi": "virtual", "grid": "scenario" },
    "process": "synthetic",
    "stores": {
      "semantic": "memory",
      "operational": "memory",
      "temporal": "memory",
      "telemetry": "memory",
      "evidence": "memory"
    }
  },
  "faults": ["cdr-correction"]
}`}</code></pre>
        <div className="dev-callout">
          <RotateCcw size={23} />
          <div>
            <strong>Replay the run record, not just the seed</strong>
            <p>
              The saved record also includes scenario version, random generator
              version, protocol profiles, adapter grid, initial state and fault
              plan. It can be rerun and compared as a complete process trace.
            </p>
          </div>
        </div>
      </section>
      <section className="dev-scenario-band">
        <div className="container">
          <SectionTitle eyebrow="Determinism rules" title="Keep every source of variation under run control." />
          <div className="dev-rule-grid">
            {[
              ["Seeded PRNG", "Inject a versioned pseudo-random generator. Do not call Math.random() in domain simulation code."],
              ["Virtual clock", "Advance simulated time through the event scheduler; do not derive business timestamps from Date.now()."],
              ["Stable streams", "Derive separate deterministic random streams for actors, stations, meters and fault injection."],
              ["Ordered events", "Use stable event ordering and record input decisions so retries and delayed messages replay the same way."],
            ].map(([title, text], index) => (
              <article key={title}>
                <span>0{index + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="container dev-replay-outcomes">
        <SectionTitle eyebrow="What a replay proves" title="Compare the whole outcome, not a screenshot." />
        <ul>
          {[
            "Selected protocol envelope shapes and exchange order",
            "Canonical events and process state transitions",
            "Writes to each simulated store, including temporal corrections",
            "Evidence and tariff lineage for the final session and CDR",
          ].map((result) => (
            <li key={result}><Check size={17} />{result}</li>
          ))}
        </ul>
        <p className="dev-inline-note">
          The same seed is repeatable only with the same scenario, simulator and
          profile versions, initial configuration and event ordering.
        </p>
      </section>
    </>
  );
}

const pageCopy = {
  runtime: {
    title: <>Test the process<br /><span>before the infrastructure.</span></>,
    description: "A browser-hosted synthetic runtime composes protocol actors, process logic and simulated stores so a charging journey can be exercised end to end.",
  },
  simulator: {
    title: <>One seeded run.<br /><span>Every boundary inspectable.</span></>,
    description: "Run deterministic roaming-charge scenarios in the browser and inspect protocol-shaped messages, process decisions and five distinct simulated stores.",
  },
  protocols: {
    title: <>Protocol-shaped inputs.<br /><span>Shared business events.</span></>,
    description: "Model standards at explicit boundaries, then map the exchanges into the same process contracts used by virtual and later live adapters.",
  },
  switchboard: {
    title: <>Switch a source.<br /><span>Keep the rest in simulation.</span></>,
    description: "Compose a run from independent inputs, process behavior and storage adapters. Use observe and hybrid modes to test a controlled transition.",
  },
  storage: {
    title: <>Exercise storage contracts.<br /><span>Leave products undecided.</span></>,
    description: "Simulate semantic, operational, temporal, telemetry and evidence stores with just enough behavior to test real process rules.",
  },
  replay: {
    title: <>Same seed.<br /><span>Same process trace.</span></>,
    description: "Seeded generation, a virtual clock and versioned run records make synthetic process scenarios repeatable and reviewable.",
  },
};

export default function DeveloperPages({ route }) {
  const id = route === "developer" ? "runtime" : route.replace("developer/", "");
  const copy = pageCopy[id];
  if (!copy) {
    return (
      <main id="main" className="container detail-intro">
        <h1>Developer page not found</h1>
        <p><a className="text-link" href={developerUrl()}>Open the developer guide <ArrowRight size={16} /></a></p>
      </main>
    );
  }
  const content = {
    runtime: <RuntimePage />,
    simulator: <SimulationWorkbench />,
    protocols: <ProtocolsPage />,
    switchboard: <SwitchboardPage />,
    storage: <StoragePage />,
    replay: <ReplayPage />,
  }[id];
  return (
    <GuideLayout page={id} title={copy.title} description={copy.description}>
      {content}
    </GuideLayout>
  );
}
