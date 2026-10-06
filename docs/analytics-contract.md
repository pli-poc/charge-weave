# Analytical contract and reusable dashboard

Version 1.3.0 adds 12 analytical classes, 12 invariants, three competency questions and requirement BR-185. The operations console now calculates historical KPIs and charts from a shared analytical profile. It replaces the fixed overview values, bar heights and decorative energy curve with an executable, repeatable calculation. The live-site inventory, work queue, roaming examples and financial ledger remain separate fixture populations.

## Shared ownership

`model/analytics-profile.json` owns approved subjects, measures, dimensions, periods, comparison choices and dashboard pane descriptors. The console imports this source directly. `tools/build_analytics.py` projects its bindings into `examples/analytics-profile.ttl`; `tools/test_analytics.py` verifies canonical classes/properties, hierarchy, pane bindings and SHACL conformance. Structural contracts come from the `analytics` module in `model/domain.schema`; business invariants B185–B196 come from `model/analytics-rules.json`.

| Analytical intent | Canonical contract | Browser adapter |
|---|---|---|
| Subject / population | AnalyticalSubject | Owned NL/BE network; one fact per site and UTC day |
| Measure | MeasureDefinition → MetricDefinition | Delivered energy, estimated net charging value, completed sessions, weighted availability |
| Operator | AnalyticalQuery.analyticalOperator | Measured value, absolute change, percentage change |
| Dimensions | DimensionDefinition | Site → country, day → month, site setting |
| Filters | AnalyticalFilter | Typed Equal/In predicates before aggregation; numeric threshold after aggregation through the reference API |
| Time | AnalyticalTimeContext | Positive half-open UTC day intervals and separate knowledge cutoff |
| Reference | AnalyticalComparison | Previous calendar period or the declared 98.5% availability target |
| Cardinality | AnalyticalRanking | All groups or strict top/bottom N; stable key breaks ties |
| Evidence | AnalyticalExecution / AnalyticalResult | Profile/source/metric versions, selected current and baseline revisions, population, cutoff, completeness and calculation components |
| Presentation | DashboardDefinition / DashboardPane | KPI, line, bar, table or registered operational renderer |

`MetricDefinition` remains compatible with its existing consumers. The new `MeasureDefinition` supplies structured numerator, denominator, aggregation, additivity, missing-value and financial policies instead of hiding these in a formula string.

## Calculation semantics

- Availability is `100 × sum(available point-seconds) / sum(eligible point-seconds)`. Planned downtime is included. Individual fact bounds are checked. The separate count of online charge points is a current snapshot, not historical availability.
- Energy and completed sessions are additive daily totals. Estimated charging value is energy multiplied by an illustrative **net** tariff and rounded to cents per site/day. It excludes VAT and does not model issued invoices, credits, costs or accounting revenue. Mixed currencies are rejected until an explicit conversion policy exists.
- Dimensions are captured on each synthetic fact at event time. Approved paths are many-to-one; the browser does not execute arbitrary joins. In particular, session quantities are never multiplied by invoice-line cardinality.
- Filtering and scope selection precede aggregation. Numeric post-aggregation thresholds affect grouped rows, not the population total. Ranking likewise limits the rows shown without changing network totals. Unavailable comparison values sort last. Ties use stable dimension keys and a strict limit.
- Calendar-period totals keep their actual day counts. Q3 versus Q2 and September versus August are not normalized to equal duration. Time-series comparisons align buckets by ordinal position within their periods; a missing reference bucket remains unavailable. Fixed targets use the selected measure's unit. Zero denominators and percentage changes against zero baselines remain unavailable.
- Fact identity is `siteId:day`. Identical duplicate revisions are deduplicated; conflicting duplicates fail. The latest revision available at `knownAt` is selected. A delayed 15 September correction recorded on 3 October illustrates this distinction.
- The adapter checks complete daily populations for both reporting and baseline windows. Missing facts, required measurements, unsupported intent or an incomplete reporting window are rejected and displayed explicitly; they are not filled with zeros.

## Synthetic dataset and runtime boundary

`console-app/src/analytics/fixture.js` derives 365 days from the eight existing owned sites: 2,920 site-day identities plus one delayed correction. Seasonal demand, weekday/weekend behavior and a recurring September outage are deterministic illustrations. It is a full synthetic 2026 year, including simulated future dates, with a final synthetic knowledge cutoff in January 2027. There are no employer records, network calls or production sources.

The provider exposes `queryAnalytics(query)`. `analytics/engine.js` is an approved flat projection adapter, not SPARQL execution, a database, an authorization service or a deployment of the temporal writer. Its tenant/site restrictions are executable reference behavior; trusted production services must enforce real identity and permissions. Source version and selected revisions are disclosed in JSON evidence; production immutable graph selection, durable checkpoints, cryptographic snapshot receipts and authorization decision evidence remain deployment obligations under the existing temporal contract. The JSON result is not claimed to be a fully populated RDF AnalyticalExecution.

Unsupported ontology possibilities are explicit: the browser adapter supports UTC daily reporting, the approved flat subject, the listed operators, fixed targets and previous-period comparisons. Peer cohorts, simulation scenarios, arbitrary expression languages, currency conversion and regional calendar bucketing need additional adapters and acceptance evidence. A declared schema capability alone does not implement them.

## Reusable presentation

`components/analytics-panes.js` renders chart geometry and accessible result tables from one executed result. It handles negative changes, absent values, single-point series and escaped labels. Exact values accompany overview charts. Chart selections drill into site/country/setting filters. The Analytics workspace exposes measure, grouping, period, comparison, ranking, country, site and knowledge cutoff, plus export of results and calculation evidence.

The overview uses profile-defined KPI and pane lists. The pane renderer registry isolates operational views from analytical charts. Pane visibility and order are saved independently in browser preferences; existing four-pane ordering is migrated without discarding the user's layout. Dark/light styling and responsive behavior follow the existing console.

## Acceptance evidence

| Requirement | Evidence |
|---|---|
| Weighted roll-up instead of mean percentages | Node case returns 10%, where an unweighted mean would return 50% |
| Duplicate facts and revision handling | Duplicate/conflict and delayed-correction Node cases |
| No silently missing populations | Missing-day, missing-measurement and cutoff cases |
| Controlled grouping, finance and scope | Country/group total equality, mixed-currency rejection, tenant/site cases |
| Deterministic comparison and cardinality | Calendar alignment, zero baseline, tie and post-filter cases |
| Shared canonical and UI definitions | Python profile/RDF gate, generated artifact consistency, CQ25–CQ27 |
| Ontology invariants | Every B185–B196 rule has a deliberate violation; the all-class fixture remains valid |
| User flow and responsive behavior | Desktop/mobile browser tests for filtering, ranking, drill-down, tables, export, cutoff and pane persistence |

GitHub Actions runs the Python analytical profile gate as part of ontology verification and requires its fresh report for packaging. The website workflow runs the console's Node acceptance cases and browser flows before publishing the protected build. Business scope, runtime integration and production deployment remain separate from these model/demo checks.
