# ChargeWeave presentation website

React + Vite marketing mockup using the Midnight Network direction. This is a static presentation of the product direction, not the operational platform. Capabilities and architecture are explicitly identified as planned; the semantic foundation is linked to the existing project documentation.

## Develop and verify

Use Node.js 24 and npm:

```sh
cd website
npm ci
npm run dev
npm run build
npx playwright install chromium
npm test
```

The site is served at `/charge-weave/`, matching its GitHub Pages project path. Navigation uses section anchors so direct links work on static hosting without server rewrites. Capability details use native disclosure controls; use-case selectors and the mobile menu are React interactions. There are no accounts, forms, analytics, external API calls or live charging functions.

## Deployment

`.github/workflows/website-pages.yml` installs locked dependencies, builds, checks the production site on desktop and mobile Chromium, and deploys the verified artifact to GitHub Pages on `main`. Pull requests run the same build and browser checks without deploying. Test screenshots and reports are retained as workflow artifacts.

One-time repository setup: **Settings → Pages → Build and deployment → Source → GitHub Actions**. The GitHub connector used to author files does not expose Pages administration. The deployment job requires `pages: write` and `id-token: write`; the build has read-only repository access.

Expected public URL: https://pli-poc.github.io/charge-weave/

For a custom domain or renamed repository, update `base` in `vite.config.js` and the canonical Open Graph URL in `index.html` together. The generated charging-campus concept image is committed as compressed WebP. It illustrates the design direction and does not depict an operating ChargeWeave installation. Manrope fonts are served locally from the npm package. No customer logos, scale claims or certifications are implied.
