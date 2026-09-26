import React, { useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Zap,
  Network,
  Wallet,
  History,
  Cable,
  SlidersHorizontal,
  Menu,
  X,
  Plus,
  Check,
  Github,
  ArrowDown,
} from "lucide-react";

const repository = "https://github.com/pli-poc/charge-weave";
export const capabilities = [
  {
    id: "operations",
    icon: Zap,
    number: "01",
    title: "Charging operations",
    summary: "Keep assets, sessions and service connected.",
    detail:
      "A shared view of sites, stations, connectors and charging sessions, with explicit ownership and lifecycle rules.",
    points: [
      "Asset onboarding and configuration",
      "Session authorization and reconciliation",
      "Incidents, recovery and maintenance",
    ],
  },
  {
    id: "energy",
    icon: SlidersHorizontal,
    number: "02",
    title: "Energy management",
    summary: "Coordinate charging with the energy available.",
    detail:
      "Model site limits, meters and charging schedules together, with clear boundaries between cloud coordination and local electrical safety.",
    points: [
      "Site capacity and charging constraints",
      "Schedules and flexibility delivery",
      "Meter evidence and fallback policies",
    ],
  },
  {
    id: "commercial",
    icon: Wallet,
    number: "03",
    title: "Tariffs and billing",
    summary: "Follow the value from session to settlement.",
    detail:
      "Connect the applicable tariff and agreement to rated session lines, invoices and corrections, preserving the evidence behind each amount.",
    points: [
      "Versioned tariffs and pricing policies",
      "Billing, payments and reimbursements",
      "Corrections and financial reconciliation",
    ],
  },
  {
    id: "roaming",
    icon: Network,
    number: "04",
    title: "Roaming and settlement",
    summary: "Make partner relationships part of the picture.",
    detail:
      "Represent operator and mobility-provider responsibilities, negotiated integrations and the commercial records exchanged between partners.",
    points: [
      "Partner agreements and capabilities",
      "Charging records and exchange tracking",
      "Allocations, payouts and exceptions",
    ],
  },
  {
    id: "history",
    icon: History,
    number: "05",
    title: "History and traceability",
    summary: "Understand what changed. And when.",
    detail:
      "The temporal contract separates when a fact applied from when it was recorded, with executable correction and history examples.",
    points: [
      "Effective time and recorded time",
      "Historical policies and evidence lineage",
      "Analytics with explicit data freshness",
    ],
  },
  {
    id: "integrations",
    icon: Cable,
    number: "06",
    title: "Open integrations",
    summary: "Give every system a common language.",
    detail:
      "A shared semantic model provides a contract for future application APIs and protocol adapters. Integration support will be verified as adapters are built.",
    points: [
      "Planned GraphQL application API",
      "OWL model and SHACL validation",
      "Version-specific protocol adapters",
    ],
  },
];
export const useCases = [
  {
    name: "Public networks",
    title: "From the first connection to the final settlement.",
    description:
      "Bring the operational and commercial life of a charging network into one coherent model. Trace a session across authorization, charging, pricing and partner responsibilities.",
    tags: ["Charge point operators", "Mobility service providers"],
    steps: [
      "Connect the site",
      "Authorize the session",
      "Record the energy",
      "Reconcile the value",
    ],
  },
  {
    name: "Fleet & workplace",
    title: "Charging that fits the way a fleet works.",
    description:
      "Connect vehicle access, workplace policies and site constraints with the cost of charging. Model who can charge, under which agreement, and how the energy is allocated.",
    tags: ["Fleet operators", "Workplace charging"],
    steps: [
      "Define access",
      "Apply site limits",
      "Track the session",
      "Allocate the cost",
    ],
  },
  {
    name: "Home & reimbursement",
    title: "A clear path from home charging to repayment.",
    description:
      "Link home charging evidence with employer policies and reimbursement decisions. Keep responsibility, calculation inputs and correction history together.",
    tags: ["Employers", "Home charging programs"],
    steps: [
      "Link the agreement",
      "Capture evidence",
      "Apply the policy",
      "Reimburse the driver",
    ],
  },
];
function Mark() {
  return (
    <svg
      className="brand-mark"
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 8h14L7 32h14M19 8h14L19 32h14"
        stroke="currentColor"
        strokeWidth="2.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export default function Home() {
  const [useCase, setUseCase] = useState(0);
  const current = useCases[useCase];
  return (
    <>
      <main id="main">
        <section className="hero" id="platform" aria-labelledby="hero-heading">
          <div className="hero-image">
            <img
              src={`${import.meta.env.BASE_URL}charging-campus.webp`}
              alt="Architectural concept of an electric vehicle charging campus at night, with solar canopies and connected energy systems"
              width="1672"
              height="941"
              fetchPriority="high"
            />
          </div>
          <div className="container hero-content">
            <p className="eyebrow">
              <span className="status-dot" /> Platform in development
            </p>
            <h1 id="hero-heading">
              Connect the
              <br />
              whole charging
              <br />
              <span>business.</span>
            </h1>
            <p className="hero-description">
              Charging operations, energy and commercial flows. Designed to work
              together.
            </p>
            <div className="hero-actions">
              <a className="button primary" href="#capabilities">
                Explore the platform <ArrowRight size={18} />
              </a>
              <a className="text-link" href="#roadmap">
                View the roadmap <ArrowUpRight size={17} />
              </a>
            </div>
            <div className="hero-note">
              <span className="fine-line" /> One shared model. Every connection
              in context.
            </div>
          </div>
          <span className="image-caption">
            A connected charging future · Concept visualization
          </span>
        </section>
        <div className="principles">
          <div className="container principles-inner">
            <span className="principles-intro">
              Built around the whole picture
            </span>
            <span>Operations</span>
            <span>Energy</span>
            <span>Commercial</span>
            <span>Trust</span>
          </div>
        </div>
        <section
          className="section container"
          id="capabilities"
          aria-labelledby="capabilities-heading"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">Planned capabilities</p>
              <h2 id="capabilities-heading">
                A clearer view of
                <br />
                every connection.
              </h2>
            </div>
            <p>
              The charging business doesn’t stop at the charger. Explore the
              connected capabilities we’re designing into ChargeWeave.
            </p>
          </div>
          <div className="capability-grid">
            {capabilities.map(
              ({ id, icon: Icon, number, title, summary, detail, points }) => (
                <details
                  className="capability"
                  key={id}
                  id={`capability-${id}`}
                >
                  <summary>
                    <div className="card-top">
                      <Icon size={25} strokeWidth={1.4} />
                      <span>{number}</span>
                    </div>
                    <h3>{title}</h3>
                    <p>{summary}</p>
                    <span className="capability-action">
                      Explore capability <Plus size={17} />
                    </span>
                  </summary>
                  <div className="capability-detail">
                    <p>{detail}</p>
                    <ul>
                      {points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                    <span className="planned-label">Planned product scope</span>
                  </div>
                </details>
              ),
            )}
          </div>
        </section>
        <section className="foundation-section">
          <div className="container foundation-layout">
            <div>
              <p className="eyebrow">The ChargeWeave foundation</p>
              <h2>
                One language.
                <br />A connected business.
              </h2>
              <p className="section-copy">
                A charger, a tariff and a settlement are parts of the same
                story. ChargeWeave starts with a shared business model that
                makes those relationships explicit.
              </p>
              <a
                className="text-link mint"
                href={`${import.meta.env.BASE_URL}ontology/`}
              >
                Open the ontology explorer <ArrowUpRight size={17} />
              </a>
            </div>
            <div
              className="model-visual"
              aria-label="A shared model connects charging sessions with assets, energy, agreements, tariffs and settlement"
            >
              <div className="model-row">
                <span>Assets</span>
                <span>Energy</span>
                <span>Agreements</span>
              </div>
              <div className="model-connectors" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
              <div className="model-center">
                <Mark />
                <div>
                  <strong>Shared business model</strong>
                  <span>Meaning · Relationships · Rules</span>
                </div>
              </div>
              <div className="model-connectors" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
              <div className="model-row">
                <span>Sessions</span>
                <span>Tariffs</span>
                <span>Settlement</span>
              </div>
              <p>Semantic foundation available in the repository</p>
            </div>
          </div>
          <div className="container foundation-benefits">
            <div>
              <Check size={17} />
              <span>Explicit ownership and responsibility</span>
            </div>
            <div>
              <Check size={17} />
              <span>Rules that can be validated</span>
            </div>
            <div>
              <Check size={17} />
              <span>History with business context</span>
            </div>
          </div>
        </section>
        <section
          className="section container"
          id="use-cases"
          aria-labelledby="use-cases-heading"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">One foundation. Different realities.</p>
              <h2 id="use-cases-heading">
                Built around your
                <br />
                charging world.
              </h2>
            </div>
            <p>
              From public networks to the workplace and home, every charging
              journey brings its own agreements, constraints and
              responsibilities.
            </p>
          </div>
          <div
            className="use-case-buttons"
            role="group"
            aria-label="Choose a use case"
          >
            {useCases.map((item, i) => (
              <button
                key={item.name}
                aria-pressed={useCase === i}
                aria-controls="use-case-content"
                onClick={() => setUseCase(i)}
              >
                {item.name}
                <ArrowUpRight size={17} />
              </button>
            ))}
          </div>
          <div
            className="use-case-content"
            id="use-case-content"
            aria-live="polite"
          >
            <div>
              <div className="tags">
                {current.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <h3>{current.title}</h3>
              <p>{current.description}</p>
            </div>
            <ol className="journey">
              {current.steps.map((step, i) => (
                <li key={step}>
                  <span>0{i + 1}</span>
                  {step}
                  {i < 3 && <ArrowDown size={16} className="journey-arrow" />}
                </li>
              ))}
            </ol>
          </div>
        </section>
        <section className="time-section">
          <div className="container time-layout">
            <div>
              <p className="eyebrow">Time is part of the model</p>
              <h2>
                Know what was true.
                <br />
                <span>And what was known.</span>
              </h2>
              <p className="section-copy">
                A tariff changes. A meter reading arrives late. A session is
                corrected. The temporal reference contract preserves both
                business time and recorded time, so the past remains
                explainable.
              </p>
              <a className="text-link mint" href="#architecture">
                See the proposed architecture <ArrowRight size={17} />
              </a>
            </div>
            <div className="time-example">
              <div className="example-heading">
                <History size={18} />
                <span>Illustrative correction</span>
              </div>
              <div className="time-event">
                <span className="time-date">01 MAY</span>
                <div>
                  <h3>A tariff takes effect</h3>
                  <p>Business time: when it applies.</p>
                </div>
              </div>
              <div className="time-event">
                <span className="time-date">03 MAY</span>
                <div>
                  <h3>The correction is recorded</h3>
                  <p>Recorded time: when it becomes known.</p>
                </div>
              </div>
              <div className="time-question">
                “What applied on 1 May, based on what we knew on 2 May?”
              </div>
            </div>
          </div>
        </section>
        <section
          className="section container"
          id="architecture"
          aria-labelledby="architecture-heading"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">Proposed architecture</p>
              <h2 id="architecture-heading">
                Shared meaning.
                <br />
                Purpose-built engines.
              </h2>
            </div>
            <p>
              A semantic foundation for clarity, transactional storage for
              business records, and a dedicated analytics engine for high-volume
              measurements.
            </p>
          </div>
          <div className="architecture">
            <div className="architecture-layer">
              <span className="layer-label">APPLICATION ACCESS</span>
              <div>
                <strong>GraphQL</strong>
                <p>ASP.NET Core + GraphQL.NET · Planned application API</p>
              </div>
            </div>
            <div className="architecture-engines">
              <article>
                <span>Business records</span>
                <h3>MariaDB</h3>
                <p>
                  Transactional data with business-time and system-time history.
                </p>
              </article>
              <article>
                <span>Events & replay</span>
                <h3>Apache Kafka</h3>
                <p>Durable event ingestion and decoupled processing.</p>
              </article>
              <article>
                <span>Telemetry & analytics</span>
                <h3>ClickHouse</h3>
                <p>Time-series measurements and analytical projections.</p>
              </article>
            </div>
            <div className="architecture-layer semantic-layer">
              <span className="layer-label">SEMANTIC CONTRACT</span>
              <div>
                <strong>OWL + SHACL</strong>
                <p>
                  Apache Jena validation · Ontop for read-only SPARQL access to
                  business records
                </p>
              </div>
            </div>
          </div>
          <p className="architecture-note">
            Design direction, not a deployed runtime. Protocol support and
            performance will be established as implementation progresses.
          </p>
        </section>
        <section className="roadmap-section" id="roadmap">
          <div className="container">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Building in the open</p>
                <h2>
                  From a clear foundation
                  <br />
                  to a working platform.
                </h2>
              </div>
              <a
                className="text-link mint"
                href={`${import.meta.env.BASE_URL}roadmap/`}
              >
                Explore the development roadmap <ArrowUpRight size={17} />
              </a>
            </div>
            <ol className="roadmap">
              <li>
                <span className="roadmap-status current">
                  Current foundation
                </span>
                <h3>Model the business</h3>
                <p>
                  Shared concepts, business rules, validation fixtures and
                  documented responsibility boundaries.
                </p>
              </li>
              <li>
                <span className="roadmap-status">Planned</span>
                <h3>Make it executable</h3>
                <p>
                  Transactional services, temporal records, event processing and
                  the application API.
                </p>
              </li>
              <li>
                <span className="roadmap-status">Planned</span>
                <h3>Connect the real world</h3>
                <p>
                  Protocol adapters, operator workflows, analytics and
                  end-to-end operational verification.
                </p>
              </li>
            </ol>
            <div className="roadmap-footnote">
              This site presents the product direction. The current repository
              contains the semantic foundation; the operational platform is in
              development.
            </div>
          </div>
        </section>
        <section className="closing container">
          <Mark />
          <h2>
            Every connection matters.
            <br />
            <span>Let’s make them work together.</span>
          </h2>
          <a
            className="button primary"
            href={repository}
            target="_blank"
            rel="noreferrer"
          >
            Explore ChargeWeave <ArrowUpRight size={18} />
          </a>
        </section>
      </main>
    </>
  );
}
