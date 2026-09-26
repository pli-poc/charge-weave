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
import { capabilities, useCases } from "./Home";
import summary from "./generated/summary.json";
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
    body: "Validity windows, event timestamps and record provenance are already represented where the domain requires them. The proposed storage architecture adds the ability to distinguish business time from the history of what the system knew.",
    classes: ["TimeWindow", "TariffVersion", "SourceEvent", "AuditEntry"],
    example:
      "A late tariff correction may apply to an earlier business date. A future temporal query should distinguish the corrected view from the view available before the correction.",
    boundary:
      "The current createdAt and revision fields are provenance. They are not, by themselves, a complete bitemporal storage implementation.",
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
function ArchitecturePage() {
  return (
    <main id="main">
      <Intro
        eyebrow="Proposed runtime architecture"
        title={
          <>
            Meaning is shared.
            <br />
            <span>Work has boundaries.</span>
          </>
        }
        description="An explicit business contract across transactional services, durable events and analytical projections."
      >
        <div className="intro-aside">
          <Network size={28} />
          <strong>Design direction</strong>
          <p>
            The ontology and validation definitions exist in the repository. The
            runtime components below are proposed.
          </p>
          <a href={`${base}ontology/`}>
            Inspect the semantic foundation <ArrowRight size={17} />
          </a>
        </div>
      </Intro>
      <section className="container architecture-detail">
        <div className="architecture-map">
          <div className="architecture-map-heading">
            <span>APPLICATION ACCESS</span>
            <strong>ASP.NET Core + GraphQL.NET</strong>
            <p>
              Authorized application queries and commands with explicit temporal
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
              <h3>MariaDB</h3>
              <p>
                Transactional business data with proposed business-time and
                system-time history.
              </p>
            </article>
            <article>
              <span>Event transport</span>
              <h3>Apache Kafka</h3>
              <p>
                Durable ingestion, replay and decoupled consumers. Event
                delivery is not the same as business completion.
              </p>
            </article>
            <article>
              <span>Analytical projection</span>
              <h3>ClickHouse</h3>
              <p>
                High-volume measurements and analytical views with a declared
                processing watermark.
              </p>
            </article>
          </div>
          <div className="architecture-contract">
            <Braces size={26} />
            <div>
              <strong>OWL + SHACL · Apache Jena · Ontop</strong>
              <p>
                Shared meaning, bounded validation and planned read-only SPARQL
                access over business records.
              </p>
            </div>
          </div>
        </div>
        <p className="architecture-note">
          This map groups responsibilities. It does not imply that every service
          synchronously calls every component.
        </p>
      </section>
      <section className="container architecture-principles">
        <div>
          <p className="eyebrow">From a fact to a decision</p>
          <h2>
            Keep the contract close
            <br />
            to the business action.
          </h2>
        </div>
        <div className="principle-list">
          <article>
            <span>01</span>
            <div>
              <h3>Validate a bounded business change</h3>
              <p>
                Check structural requirements and affected business rules
                against the reference data needed for that decision. A passing
                shape check is not authorization and does not guarantee
                completeness.
              </p>
            </div>
          </article>
          <article>
            <span>02</span>
            <div>
              <h3>Commit business records transactionally</h3>
              <p>
                The proposed transaction boundary includes the business change
                and its outbox record. Consumers handle duplicate delivery
                explicitly rather than assuming an event is delivered once.
              </p>
            </div>
          </article>
          <article>
            <span>03</span>
            <div>
              <h3>Make projection freshness visible</h3>
              <p>
                Analytics and semantic projections expose their source revisions
                and processing watermark, so queries can distinguish a complete
                snapshot from work still in flight.
              </p>
            </div>
          </article>
          <article>
            <span>04</span>
            <div>
              <h3>Preserve the reason for a correction</h3>
              <p>
                Keep source evidence and correction lineage. Financial
                corrections require explicit reconciliation; a historical value
                should not silently replace the evidence used for a previous
                decision.
              </p>
            </div>
          </article>
        </div>
      </section>
      <section className="temporal-architecture">
        <div className="container">
          <p className="eyebrow">Temporal query design</p>
          <h2>
            “When did it apply?”
            <br />
            <span>“When did we know?”</span>
          </h2>
          <div className="temporal-architecture-grid">
            <article>
              <span>Business time</span>
              <h3>Effective on</h3>
              <p>
                The date or interval when a fact applies in the business.
                Validity windows are already present in contracts such as
                TariffVersion.
              </p>
              <a href={explore("TariffVersion")}>
                Inspect TariffVersion <ArrowUpRight size={15} />
              </a>
            </article>
            <article>
              <span>System time · proposed storage</span>
              <h3>Known on</h3>
              <p>
                The history of when a stored fact was known to the system. This
                requires a storage design beyond createdAt and revision
                metadata.
              </p>
              <a href={`${base}ontology/`}>
                Try the temporal inspector <ArrowRight size={15} />
              </a>
            </article>
          </div>
          <div className="semantic-boundary">
            <ShieldCheck size={21} />
            <p>
              <strong>GraphQL is the API language.</strong> Temporal behavior
              comes from resolver contracts and the storage beneath them. OWL
              defines meaning; SHACL checks data conformance. None of these
              alone supplies the entire runtime.
            </p>
          </div>
        </div>
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
