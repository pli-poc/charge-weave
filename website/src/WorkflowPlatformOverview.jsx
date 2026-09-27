import "./workflow-platform-overview.css";

const stages = [
  { x: 184, title: "Author", subtitle: "Generic XFlow definition", detail: "steps · events · roles", accent: "neutral" },
  { x: 382, title: "Validate", subtitle: "XFlow SHACL shapes", detail: "domain bindings · constraints", accent: "teal" },
  { x: 580, title: "Compile", subtitle: "Supported graph + allowlist", detail: "named capabilities only", accent: "neutral" },
  { x: 778, title: "Execute", subtitle: "XState v5 actors", detail: "states · events · timers", accent: "mint" },
  { x: 976, title: "Connect", subtitle: "Replaceable ports", detail: "simulation or real adapters", accent: "neutral" },
];

function Arrow({ x1, x2, y = 160 }) {
  return <path className="wpo-arrow" d={`M ${x1} ${y} H ${x2}`} markerEnd="url(#wpo-arrow)" />;
}

export default function WorkflowPlatformOverview() {
  return (
    <section className="wpo-section" aria-labelledby="wpo-heading">
      <div className="wpo-heading">
        <p className="eyebrow">Generic platform model</p>
        <h2 id="wpo-heading">One workflow contract, from design to evidence.</h2>
        <p>
          XFlow describes the process. ChargeWeave supplies the business meaning.
          Validation checks their bindings before a compiled XState actor can run.
        </p>
      </div>
      <div className="wpo-scroll">
        <svg
          className="wpo-diagram"
          viewBox="0 0 1240 520"
          role="img"
          aria-labelledby="wpo-title wpo-description"
        >
          <title id="wpo-title">ChargeWeave generic workflow platform system overview</title>
          <desc id="wpo-description">
            External events enter a platform boundary and pass through generic XFlow authoring,
            SHACL validation against ChargeWeave business concepts, allowlisted compilation,
            XState execution, and replaceable ports. The ontology supplies meaning to design and
            validation, while business execution records retain the resulting evidence.
          </desc>
          <defs>
            <marker id="wpo-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0 0 L8 4 L0 8" fill="none" stroke="#769b9d" strokeWidth="1.4" />
            </marker>
            <marker id="wpo-arrow-mint" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0 0 L8 4 L0 8" fill="none" stroke="#9aefc7" strokeWidth="1.4" />
            </marker>
          </defs>

          <rect className="wpo-boundary" x="157" y="38" width="934" height="444" rx="2" />
          <text className="wpo-boundary-label" x="178" y="68">CHARGEWEAVE PLATFORM BOUNDARY</text>

          <g className="wpo-outside">
            <rect x="18" y="116" width="115" height="88" rx="2" />
            <text x="75" y="147" textAnchor="middle">Business</text>
            <text x="75" y="167" textAnchor="middle">events</text>
            <text x="75" y="187" textAnchor="middle">and requests</text>
            <path d="M133 160 H174" markerEnd="url(#wpo-arrow)" />
            <rect x="1115" y="116" width="116" height="88" rx="2" />
            <text x="1173" y="147" textAnchor="middle">Partner</text>
            <text x="1173" y="167" textAnchor="middle">systems and</text>
            <text x="1173" y="187" textAnchor="middle">devices</text>
            <path d="M1095 160 H1110" markerEnd="url(#wpo-arrow)" />
          </g>

          {stages.map((stage, index) => (
            <g className={`wpo-stage wpo-${stage.accent}`} key={stage.title}>
              <rect x={stage.x} y="111" width="174" height="98" rx="2" />
              <text className="wpo-stage-index" x={stage.x + 14} y="132">0{index + 1}</text>
              <text className="wpo-stage-title" x={stage.x + 14} y="157">{stage.title}</text>
              <text className="wpo-stage-copy" x={stage.x + 14} y="178">{stage.subtitle}</text>
              <text className="wpo-stage-copy" x={stage.x + 14} y="195">{stage.detail}</text>
            </g>
          ))}
          <Arrow x1={361} x2={376} />
          <Arrow x1={559} x2={574} />
          <Arrow x1={757} x2={772} />
          <Arrow x1={955} x2={970} />

          <path className="wpo-binding" d="M469 209 V246 H390 V267" />
          <path className="wpo-binding" d="M271 209 V246 H390" />
          <rect className="wpo-ontology" x="184" y="267" width="430" height="116" rx="2" />
          <text className="wpo-overline" x="203" y="292">SHARED DOMAIN MEANING</text>
          <text className="wpo-layer-title" x="203" y="320">ChargeWeave business ontology</text>
          <text className="wpo-layer-copy" x="203" y="344">CPO / CSMS concepts · roles · obligations · evidence</text>
          <text className="wpo-layer-copy" x="203" y="365">Workflow profiles reference these terms; SHACL checks structure and bindings</text>

          <path className="wpo-binding" d="M865 209 V245 H850 V267" markerEnd="url(#wpo-arrow-mint)" />
          <rect className="wpo-records" x="638" y="267" width="430" height="116" rx="2" />
          <text className="wpo-overline" x="658" y="292">BUSINESS EXECUTION AND AUDIT</text>
          <text className="wpo-layer-title" x="658" y="320">Canonical process records</text>
          <text className="wpo-layer-copy" x="658" y="344">ProcessExecution · ProcessStep · StateTransition</text>
          <text className="wpo-layer-copy" x="658" y="365">Workflow version, event history and evidence remain traceable</text>

          <path className="wpo-loop" d="M1012 210 V426 H398 V389" markerEnd="url(#wpo-arrow-mint)" />
          <rect className="wpo-loop-label" x="518" y="408" width="360" height="35" rx="2" />
          <text className="wpo-loop-copy" x="698" y="431" textAnchor="middle">Runtime outcomes feed validation and replay</text>

          <text className="wpo-note" x="184" y="462">
            Generic orchestration stays separate from the CPO / CSMS ontology; profiles bind them explicitly.
          </text>
        </svg>
      </div>
      <div className="wpo-explanation">
        <p><strong>Design and validate:</strong> the workflow references domain concepts and named rules; shapes reject unresolved or malformed bindings.</p>
        <p><strong>Compile and execute:</strong> only supported steps and registered capabilities become an XState machine. The host supplies clocks, adapters and persistence.</p>
        <p><strong>Keep the business record canonical:</strong> workflow mechanics live in the runtime store; significant business steps map to ontology-aligned execution and audit records.</p>
      </div>
    </section>
  );
}
