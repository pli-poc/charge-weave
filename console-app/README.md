# ChargeWeave operations console

An isolated, browser-only operations-console concept. Its separate `package.json` and lockfile keep its build and test lifecycle independent from the corporate presentation site.

## Run locally

```sh
npm ci
npm run dev
npm test
npm run build
```

The development server uses Node's built-in HTTP module and listens on port 4174 by default. The build copies the static app into `dist/`. The GitHub Pages workflow then publishes that output under `/charge-weave/app/` next to the corporate website.

## Data boundary

`src/provider.js` is the UI-facing provider contract. It currently registers only `synthetic` mode and returns the fixed fixture in `src/data.js`; the fixture ID is `cw-eu-2026-09`. The dataset is repeatable and contains no network calls. A future adapter can implement the same read methods while protocol and storage boundaries are introduced independently. No real OCPP, OCPI, roaming, payment, identity, or storage service is connected.

Owned locations are in the Netherlands and Belgium. Chargecard roaming examples represent partner sessions elsewhere in Europe. Financial values use EUR; any tax treatment is a label for workflow context, not a tax calculation.

## Guided CPO site launch

The **Site to revenue** workspace is a set of interactive application screens, not a static process illustration. It lets a presenter enter a site and site-host agreement, issue an installation work order, complete commissioning checks, enter session meter readings and tariff, calculate the rated amount, and issue a synthetic invoice. Each submission updates the case context shown beside the active screen. The site inventory's **Add site** action opens the same site-registration screen.

The final billing screen links to the developer guide's executable J07/J08 charge-record correction workflow, so the CPO business walkthrough leads into the existing billing exception demo. All mutations are in browser memory; resetting the demo restores the fixture. No real partner, station, meter, invoice, payment or backend is contacted. The sample calculation is usage multiplied by tariff and is not a tax or accounting calculation.

## Historical analytics

The overview and `/app/#analytics` share the canonical `model/analytics-profile.json`, a calculated synthetic 2026 year and reusable KPI/chart/table panes. Measures, periods, filters, comparisons, ranking and knowledge cutoffs drive the same engine. Pane visibility and ordering persist in browser preferences. See [the analytical contract](../docs/analytics-contract.md) for calculation semantics, synthetic data boundaries and validation.
