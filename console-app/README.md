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
