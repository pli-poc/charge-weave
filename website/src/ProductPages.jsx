import { lazy, Suspense } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Network,
  Check,
  Clock3,
  Layers,
  Braces,
  ShieldCheck,
  Zap,
} from "lucide-react";
const ArchitectureScene3D = lazy(() => import("./ArchitectureScene3D.jsx"));
import { capabilities, useCases } from "./Home";
import summary from "./generated/summary.json";
import "./architecture-3d.css";
const base = import.meta.env.BASE_URL,
  repo = "https://github.com/pli-poc/charge-weave";
const explore = (name) => `${base}ontology/?class=${name}`;
const sections = {
  operations: {
    headline: "A session is more than a start and a stop.",
    body: "Operations needs to connect the physical asset, the authorization decision and the evidence that a charging session actually happened. The model separates those responsibilities so incomplete or delayed events can be reconciled explicitly.",
    classes: [
      "ChargingStation",
      "ChargingUnit",
      "ChargingSession",
      "WorkOrder",
    ],
    example:
      "When a charger loses its connection, an unknown outcome must remain distinguishable from a rejected command or a completed session.",
    boundary:
      "Live device connections, remote commands and operational recovery are planned implementation work.",
  },
  energy: {
    headline: "Keep commercial intentions within physical limits.",
    body: "Grid connections, site constraints and charging schedules belong in the same picture. The model captures the applied schedule and its evidence, while keeping local electrical safety separate from cloud coordination.",
    classes: [
      "GridConnection",
      "PowerConstraint",
      "ChargingSchedule",
      "ControlDecision",
    ],
    example:
      "A schedule can change as available capacity changes. Its application, override authority and delivery evidence remain distinct records.",
    boundary:
      "Real-time control, forecasting and hardware integrations are planned. A semantic model does not enforce physical safety.",
  },
  commercial: {
    headline: "Make every amount explainable.",
    body: "A session points to the tariff version that applied. Rating inputs, rounding policies, invoice lines and payment outcomes have separate identities, allowing later corrections to retain a traceable commercial context.",
    classes: ["TariffVersion", "RatingCalculation", "Invoice", "PaymentIntent"],
    example:
      "A corrected charge should preserve the original evidence and lead to an explicit adjustment, with reconciliation of the financial result.",
    boundary:
      "The repository models these contracts and checks. Billing execution, payment processing and accounting integrations are planned.",
  },
  roaming: {
    headline: "Put partner responsibilities in the model.",
    body: "Roaming connects organizations with different agreements, protocols and commercial roles. Those relationships are represented independently from each technical exchange and from the charging record being exchanged.",
    classes: [
      "RoamingParty",
      "RoamingModuleAgreement",
      "RoamingExchange",
      "ChargeDetailRecord",
    ],
    example:
      "A successful network connection does not imply that every protocol module has been agreed or that a partner has accepted a charging record.",
    boundary:
      "Protocol adapters and end-to-end interoperability remain planned; no certification or complete protocol support is claimed.",
  },
  history: {
    headline: "Explain a decision in its original context.",
    body: "The model separates business time from the history of what the system knew. Immutable scope snapshots and executable reference queries preserve the original context of corrections and decisions.",
    classes: ["TimeWindow", "TariffVersion", "SourceEvent", "AuditEntry"],
    example:
      "A late tariff correction may apply to an earlier business date. The reference temporal query distinguishes the corrected view from the view available before the correction.",
    boundary:
      "The reference writer and fixture demonstrate the temporal contract. Production storage and service integration remain planned.",
  },
  integrations: {
    headline: "Share meaning across system boundaries.",
    body: "The ontology defines the concepts, the class contracts constrain their structure, and business rules express declared invariants. Future APIs and adapters can map external data into that shared contract.",
    classes: [
      "IntegrationConnection",
      "ProtocolEndpoint",
      "ProtocolProfile",
      "EventDelivery",
    ],
    example:
      "A protocol transaction and a canonical charging session represent different things. An adapter must preserve their correlation and their separate identities.",
    boundary:
      "The explorer reads a static repository snapshot. It is not a live GraphQL API, SPARQL endpoint or operational management console.",
  },
};
function Intro({ eyebrow, title, description, children }) {
  return (
    <div className="container detail-intro">
      <a className="back-overview" href={base}>
        Overview <span>/</span>
      </a>
      <div className="detail-intro-grid">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
function CapabilityPage() {
  return (
    <main id="main">
      <Intro
        eyebrow="Planned platform capabilities"
        title={
          <>
            The whole business.
            <br />
            <span>Connected by design.</span>
          </>
        }
        description="Explore the operational, energy and commercial responsibilities behind ChargeWeave—and the definitions that connect them."
      >
        <div className="intro-aside">
          <Layers size={28} />
          <strong>
            The model is available.
            <br />
            The runtime is being designed.
          </strong>
          <p>Inspect the foundation directly in the ontology explorer.</p>
          <a href={`${base}ontology/`}>
            Explore the definitions <ArrowRight size={17} />
          </a>
        </div>
      </Intro>
      <div
        className="container capability-jump-links"
        aria-label="Capability sections"
      >
        {capabilities.map((c) => (
          <a key={c.id} href={"#" + c.id}>
            {c.title}
          </a>
        ))}
      </div>
      <div className="container capability-sections">
        {capabilities.map(({ id, title, icon: Icon, points, number }) => {
          const s = sections[id];
          return (
            <section className="capability-deep-dive" key={id} id={id}>
              <div className="capability-index">
                <Icon size={26} />
                <span>
                  {number} / {title}
                </span>
              </div>
              <div className="capability-story">
                <h2>{s.headline}</h2>
                <p>{s.body}</p>
                <ul>
                  {points.map((p) => (
                    <li key={p}>
                      <Check size={16} />
                      {p}
                    </li>
                  ))}
                </ul>
                <div className="scenario-note">
                  <span>In practice</span>
                  <p>{s.example}</p>
                </div>
              </div>
              <aside className="definition-links">
                <p className="eyebrow">Explore the model</p>
                {s.classes.map((n) => (
                  <a key={n} href={explore(n)}>
                    <code>{n}</code>
                    <ArrowUpRight size={15} />
                  </a>
                ))}
                <p>{s.boundary}</p>
              </aside>
            </section>
          );
        })}
      </div>
      <section className="use-cases-detail">
        <div className="container">
          <p className="eyebrow">Charging in context</p>
          <h2>
            Different journeys.
            <br />
            Shared definitions.
          </h2>
          <div className="scenario-columns">
            {useCases.map((c) => (
              <article key={c.name}>
                <span>{c.name}</span>
                <h3>{c.title}</h3>
                <p>{c.description}</p>
                <ol>
                  {c.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </div>
      </section>
      <NextPage
        title="See how the pieces are designed to work together."
        href={`${base}architecture/`}
        label="Explore the architecture"
      />
    </main>
  );
}
function Architecture3DShowcase() {
  const mobileLayers = [
    ["Channels & insight", "Drivers & fleets · CPO operations · Finance & partners · Energy teams"],
    ["Business services", "Identity & access · Sessions & metering · Pricing & billing · Roaming & settlement"],
    ["Partners & devices", "Chargers & meters · Mobility partners · Payments · Energy & grid"],
    ["Shared meaning", "Party · Site · Session · Tariff · Evidence · Settlement"],
    ["Records & analytics", "Business records · Events & replay · Telemetry · Evidence"],
  ];
  const steps = [
    ["01", "A charge begins", "Driver, asset and accepted offer are connected."],
    ["02", "Evidence arrives", "Session events and meter readings retain their source."],
    ["03", "The business check", "Usage, price, tax and responsibility are brought together."],
    ["04", "Settle and learn", "Charge records connect to partners, finance and analysis."],
  ];
  return (
    <section className="container cw3-section" aria-labelledby="cw3-heading">
      <div className="cw3-section-heading">
        <div>
          <p className="eyebrow">Proposed system · business view</p>
          <h2 id="cw3-heading">One charge journey.<br /><span>Shared business meaning.</span></h2>
        </div>
        <p>
          Services keep their boundaries. ChargeWeave connects the concepts,
          evidence and responsibilities that make their data understandable
          across the platform.
        </p>
      </div>
      <div className="cw3-frame">
        <div className="cw3-canvas-panel">
          <div className="cw3-frame-meta">
            <span><i /> Isometric system map</span>
            <span>Drag to rotate</span>
          </div>
          <Suspense fallback={<div className="cw3-scene-loading" aria-label="Loading 3D system map" />}>
            <ArchitectureScene3D />
          </Suspense>
          <div className="cw3-flow-caption">
            <span className="cw3-flow-dot" />
            <strong>Charging event → validated record → business insight</strong>
          </div>
        </div>
        <aside className="cw3-journey-panel" aria-label="Example business journey">
          <p className="cw3-panel-kicker">A journey through the layers</p>
          <h3>From charge to settlement</h3>
          <p className="cw3-panel-intro">
            A session links the party, site, offer and meter evidence. If a
            reading is corrected later, the reason and financial outcome stay
            connected through settlement.
          </p>
          <div className="cw3-concept-strip">
            <span>Shared business concepts</span>
            <p>Party · Site · Session · Tariff · Evidence · Settlement</p>
          </div>
          <ol>
            {steps.map(([number, title, body]) => (
              <li key={number}>
                <span>{number}</span>
                <div><strong>{title}</strong><p>{body}</p></div>
              </li>
            ))}
          </ol>
          <div className="cw3-crosscut">
            <ShieldCheck size={18} />
            <p><strong>Across every layer</strong><br />Identity · access · tenant boundaries · audit</p>
          </div>
          <p className="cw3-disclaimer">
            The ontology and validation model exist. The runtime shown here is
            a design direction, not a deployed service.
          </p>
        </aside>
      </div>
      <div className="cw3-mobile-layers" aria-label="System layer roles">
        {mobileLayers.map(([title, roles]) => (
          <div key={title}><strong>{title}</strong><span>{roles}</span></div>
        ))}
      </div>
    </section>
  );
}
function ArchitecturePage() {
  return (
    <main id="main">
      <Intro
        eyebrow="High-level design · Platform architecture"
        title={
          <>
            Meaning is shared.
            <br />
            <span>Work has boundaries.</span>
          </>
        }
        description="The shared business meaning, service boundaries and design principles that shape the ChargeWeave platform."
      >
        <div className="intro-aside">
          <Network size={28} />
          <strong>High-level design (HLD)</strong>
          <p>
            This page is the platform-level design reference. The ontology,
            shapes and rules are in the repository; operational services remain
            a target design.
          </p>
          <a href={`${base}ontology/`}>
            Inspect the semantic foundation <ArrowRight size={17} />
          </a>
        </div>
      </Intro>
      <Architecture3DShowcase />
      <section className="container architecture-detail">
        <div className="architecture-map">
          <div className="architecture-map-heading">
            <span>APPLICATION ACCESS</span>
            <strong>Authorized application APIs</strong>
            <p>
              Scoped queries and commands with explicit tenant and temporal
              context.
            </p>
          </div>
          <div className="architecture-down">
            <ArrowRight size={18} />
            <span>Application service boundary</span>
          </div>
          <div className="architecture-service-grid">
            <article>
              <Zap />
              <h3>Operations & sessions</h3>
              <p>
                Identity, authorization, session lifecycle and recovery
                evidence.
              </p>
            </article>
            <article>
              <Clock3 />
              <h3>Energy coordination</h3>
              <p>
                Constraints, schedules, application outcomes and local safety
                boundaries.
              </p>
            </article>
            <article>
              <Layers />
              <h3>Commercial services</h3>
              <p>
                Rating, billing, ledger entries, correction and reconciliation.
              </p>
            </article>
          </div>
          <div className="architecture-storage-grid">
            <article>
              <span>System of record</span>
              <h3>Transactional business store</h3>
              <p>
                Business records and financial writes with the transaction and
                history guarantees each operation requires.
              </p>
            </article>
            <article>
              <span>Event transport</span>
              <h3>Durable event transport</h3>
              <p>
                Ingestion, replay and decoupled consumers. Event delivery is
                not the same as business completion.
              </p>
            </article>
            <article>
              <span>Analytical projection</span>
              <h3>Telemetry and analytics stores</h3>
              <p>
                High-volume measurements and analytical views with declared
                source revisions and processing watermarks.
              </p>
            </article>
          </div>
          <div className="architecture-contract">
            <Braces size={26} />
            <div>
              <strong>RDF · OWL · SHACL · SPARQL</strong>
              <p>
                Shared business meaning, bounded graph validation and semantic
                queries over governed projections.
              </p>
            </div>
          </div>
        </div>
        <p className="architecture-note">
          This map groups responsibilities. It does not imply that every service
          synchronously calls every component.
        </p>
      </section>
      <section className="container architecture-principles hld-principles">
        <div>
          <p className="eyebrow">High-level design principles</p>
          <h2>
            One platform model.
            <br />
            Clear owners for every decision.
          </h2>
          <p className="hld-principles-intro">
            These principles guide the service boundaries, data contracts and
            operational choices. The Developer guide explains how each is
            applied in the current prototype and proposed runtime.
          </p>
        </div>
        <div className="principle-list">
          <article>
            <span>01</span>
            <div>
              <h3>Share business meaning across bounded capabilities.</h3>
              <p>
                Use stable identifiers and domain terms across services and
                partner exchanges. Each capability owns its policy,
                transactions and operational decisions.
              </p>
            </div>
          </article>
          <article>
            <span>02</span>
            <div>
              <h3>Validate changes at the boundary that owns them.</h3>
              <p>
                Use SHACL for explicit data constraints and deterministic rules
                for business invariants against affected records and required
                reference data. Keep whole-tenant analysis off real-time paths.
              </p>
            </div>
          </article>
          <article>
            <span>03</span>
            <div>
              <h3>Let workflows orchestrate; let domain services own effects.</h3>
              <p>
                Versioned workflow definitions describe process sequence and
                outcomes. The runtime routes to registered capabilities; domain
                services authorize and perform authoritative changes.
              </p>
            </div>
          </article>
          <article>
            <span>04</span>
            <div>
              <h3>Preserve evidence and explain the history.</h3>
              <p>
                Retain source identity, correlation, event time, recorded time
                and provenance. Link corrections to prior assertions or
                compensating records so decisions can be reconstructed.
              </p>
            </div>
          </article>
          <article>
            <span>05</span>
            <div>
              <h3>Make writes transactional and replay-safe.</h3>
              <p>
                Couple business changes with event intent where possible. Use
                idempotency, expected revisions and reconciliation so retries
                do not repeat business effects.
              </p>
            </div>
          </article>
          <article>
            <span>06</span>
            <div>
              <h3>Enforce identity and tenant access at service boundaries.</h3>
              <p>
                APIs and stores authorize each read and write. A tenant fact
                records ownership; it does not grant permission. Keep secrets
                outside the semantic graph.
              </p>
            </div>
          </article>
          <article>
            <span>07</span>
            <div>
              <h3>Choose storage by workload and expose projection freshness.</h3>
              <p>
                Choose stores with the transaction, history or measurement
                guarantees each workload needs. Projections expose revisions
                and watermarks so consumers can see what has arrived.
              </p>
            </div>
          </article>
          <article>
            <span>08</span>
            <div>
              <h3>Keep protocol and infrastructure edges replaceable.</h3>
              <p>
                Version adapters and storage ports, map exchanges to canonical
                events, and replace one boundary at a time. Prove behavior with
                deterministic synthetic journeys before enabling live systems.
              </p>
            </div>
          </article>
          <article>
            <span>09</span>
            <div>
              <h3>Generate human task experiences from explicit contracts.</h3>
              <p>
                Ontology concepts give task fields meaning and constraints. A
                versioned task profile selects the authorized inputs and
                outcomes; a shared renderer turns them into accessible forms
                and business-level progress. The trusted host validates every
                submission before a domain capability commits a change.
              </p>
            </div>
          </article>
        </div>
      </section>
      <section className="temporal-architecture">
        <div className="container">
          <p className="eyebrow">Evidence and time</p>
          <h2>
            “When did it apply?”
            <br />
            <span>“What did we know then?”</span>
          </h2>
          <div className="temporal-architecture-grid">
            <article>
              <span>Business time</span>
              <h3>When a fact applies</h3>
              <p>
                Keep the effective date or interval distinct from when the
                platform received or recorded the fact.
              </p>
              <a href={`${base}developer/storage/`}>
                Read storage contracts <ArrowUpRight size={15} />
              </a>
            </article>
            <article>
              <span>Recorded time</span>
              <h3>What the platform knew</h3>
              <p>
                Preserve source, provenance and correction history so an
                earlier decision can be explained against the evidence then
                available.
              </p>
              <a href={`${repo}/blob/main/docs/temporal-contract.md`} target="_blank" rel="noreferrer">
                Read the temporal contract <ArrowUpRight size={15} />
              </a>
            </article>
          </div>
          <div className="semantic-boundary">
            <ShieldCheck size={21} />
            <p>
              <strong>Meaning, validation and authority stay separate.</strong>
              The ontology connects business concepts; explicit constraints
              check data; authorized domain services decide and commit changes.
            </p>
          </div>
        </div>
      </section>
      <section className="container architecture-detail-index">
        <div className="architecture-detail-index-heading">
          <p className="eyebrow">Developer detail</p>
          <h2>Read how each boundary is applied.</h2>
          <p>
            The HLD sets the platform-wide rules. These guides cover specific
            runtime contracts, prototypes and design proposals.
          </p>
        </div>
        <div className="architecture-detail-links">
          {[
            ["Workflow runtime", `${base}developer/platform/`, "Generic XFlow definitions, validation, XState execution and evidence."],
            ["Human task forms", `${base}developer/human-tasks/`, "Model-driven operator work items, task-scoped forms and guarded corrections."],
            ["Protocol adapters", `${base}developer/protocols/`, "Versioned OCPP, OCPI and vehicle-to-equipment boundaries."],
            ["Simulator", `${base}developer/simulator/`, "Seeded journeys and fault conditions across runtime boundaries."],
            ["Runtime switchboard", `${base}developer/switchboard/`, "Select virtual, observe, hybrid or future live adapters explicitly."],
            ["Storage contracts", `${base}developer/storage/`, "Semantic, operational, temporal, telemetry and evidence stores."],
            ["Deterministic replay", `${base}developer/replay/`, "Repeatable runs, virtual time and fault injection."],
          ].map(([title, href, description]) => (
            <a className="architecture-detail-link" href={href} key={title}>
              <span>
                <strong>{title}</strong>
                <small>{description}</small>
              </span>
              <ArrowRight size={17} />
            </a>
          ))}
        </div>
        <a
          className="architecture-hld-source"
          href={`${repo}/blob/main/docs/runtime-architecture.md`}
          target="_blank"
          rel="noreferrer"
        >
          Read the complete HLD source <ArrowUpRight size={15} />
        </a>
      </section>
      <NextPage
        title="Explore the contracts behind this architecture."
        href={`${base}ontology/`}
        label="Open ontology explorer"
      />
    </main>
  );
}
function RoadmapPage() {
  const stages = [
    {
      state: "Available in the repository",
      title: "The semantic foundation",
      text: "Class definitions, relationships, controlled vocabularies, structural validation and declared business invariants. The explorer presents the published main-branch model snapshot.",
      items: [
        `${summary.classes} classes across ${summary.modules} modules`,
        `${summary.rules} declared SPARQL business rules`,
        "Fixtures and verification in GitHub Actions",
      ],
      href: repo,
      label: "View source and evidence",
    },
    {
      state: "Current product exploration",
      title: "Make the system understandable",
      text: "The presentation site and read-only ontology explorer connect the product story to its actual definitions. This stage establishes the navigation and inspection experience.",
      items: [
        "Capability and architecture pages",
        "Relationship, field and triple inspection",
        "Temporal design examples",
      ],
      href: `${base}ontology/`,
      label: "Explore the model",
    },
    {
      state: "Planned implementation",
      title: "Build an executable core",
      text: "Translate the business contracts into authorized service boundaries, transactional data, event processing and temporal query behavior.",
      items: [
        "Transactional write path and outbox",
        "Bitemporal storage and application queries",
        "Bounded validation and correction flows",
      ],
    },
    {
      state: "Planned integration & verification",
      title: "Connect to the real world",
      text: "Add protocol adapters and operational workflows, then verify behavior against the equipment, partners and business scenarios they must support.",
      items: [
        "Version-specific protocol adapters",
        "Operator workflows and analytical views",
        "Failure recovery and end-to-end evidence",
      ],
    },
  ];
  return (
    <main id="main">
      <Intro
        eyebrow="Development roadmap"
        title={
          <>
            Build the foundation.
            <br />
            <span>Prove each next step.</span>
          </>
        }
        description="A staged path from explicit system definitions to an operational charging platform. Delivery dates will follow validated implementation scope."
      >
        <div className="intro-aside">
          <ShieldCheck size={28} />
          <strong>Evidence before claims</strong>
          <p>
            The current semantic model is version {summary.version}. The
            runtime, protocol support and operational performance remain
            implementation work.
          </p>
          <a href={`${repo}/actions`} target="_blank" rel="noreferrer">
            Review verification runs <ArrowUpRight size={17} />
          </a>
        </div>
      </Intro>
      <div className="container detailed-roadmap">
        {stages.map((s, i) => (
          <section key={s.title}>
            <div className="roadmap-number">0{i + 1}</div>
            <div>
              <p className={"stage-status " + (i < 2 ? "available" : "")}>
                {s.state}
              </p>
              <h2>{s.title}</h2>
              <p>{s.text}</p>
            </div>
            <aside>
              <ul>
                {s.items.map((item) => (
                  <li key={item}>
                    <Check size={16} />
                    {item}
                  </li>
                ))}
              </ul>
              {s.href && (
                <a href={s.href}>
                  {s.label}
                  <ArrowUpRight size={15} />
                </a>
              )}
            </aside>
          </section>
        ))}
      </div>
      <section className="container evidence-links">
        <p className="eyebrow">Read the evidence</p>
        <h2>An open view of progress.</h2>
        <div>
          {[
            [
              "Domain dictionary",
              "docs/domain-dictionary.md",
              "Class definitions and structural contracts.",
            ],
            [
              "Business-domain audit",
              "docs/business-domain-audit.md",
              "Declared requirements, journeys and boundaries.",
            ],
            [
              "Runtime architecture",
              "docs/runtime-architecture.md",
              "Service responsibilities and implementation considerations.",
            ],
          ].map(([title, path, desc]) => (
            <a
              href={`${repo}/blob/main/${path}`}
              target="_blank"
              rel="noreferrer"
              key={title}
            >
              <h3>
                {title}
                <ArrowUpRight size={18} />
              </h3>
              <p>{desc}</p>
            </a>
          ))}
        </div>
        <p className="evidence-note">
          Verification establishes specific model properties and fixture
          outcomes. It does not establish an implemented, certified or
          universally complete production platform.
        </p>
      </section>
      <NextPage
        title="Start with the connections that matter."
        href={`${base}capabilities/`}
        label="Explore capabilities"
      />
    </main>
  );
}
function NextPage({ title, href, label }) {
  return (
    <section className="container next-page">
      <h2>{title}</h2>
      <a className="button primary" href={href}>
        {label}
        <ArrowRight size={17} />
      </a>
    </section>
  );
}
export default function ProductPages({ route }) {
  return route === "capabilities" ? (
    <CapabilityPage />
  ) : route === "architecture" ? (
    <ArchitecturePage />
  ) : route === "roadmap" ? (
    <RoadmapPage />
  ) : (
    <main id="main" className="container detail-intro">
      <h1>Page not found</h1>
      <p>
        <a className="text-link" href={base}>
          Return to ChargeWeave <ArrowRight size={16} />
        </a>
      </p>
    </main>
  );
}
