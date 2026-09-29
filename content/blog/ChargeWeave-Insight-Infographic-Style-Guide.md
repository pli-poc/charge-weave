# ChargeWeave Insight Infographic Style Guide

**Version:** 1.1  
**Purpose:** Reusable visual system for ChargeWeave website articles and future Insight publications.

## Design intent

Make complex EV charging, energy and platform relationships clear, credible and useful to CPO decision makers. Each graphic should explain one idea, show why the relationships matter, and remain readable on a mobile screen.

This guide extends the existing ChargeWeave Presentation & Infographic Style Guide for editorial use. It keeps the same visual grammar while adapting composition and export sizes for web articles.

## Brand system

| Meaning | Color | Hex |
|---|---|---|
| Structure, titles, governance | Deep navy | #062D49 |
| Dark canvas, strong contrast | Midnight navy | #041D30 |
| Energy, action, positive state | Energy green | #4CD964 |
| Data, connectivity, semantics | Teal | #00B4A6 |
| Selective emphasis | Lime | #7ED321 |
| Editorial canvas | Off-white | #F7FAFB |
| Supporting text | Slate | #607785 |
| Dividers and chart guides | Pale blue-grey | #D6E1E6 |
| Caution, pending, assumption | Amber | #D9932E |
| Failure or violation only | Red | #C94B4B |

Navy should dominate. Green means energy, active action or positive state. Teal means data, communication or semantic relationships. Amber indicates a pending decision, constraint or assumption. Red is reserved for a genuine failure or violation.

## Editorial canvas and exports

- Standard infographic: **1600 × 900 px**, 16:9 landscape.
- Provide an accessible, editable SVG source and matching 1600 × 900 PNG for broad CMS support.
- Use an off-white background for charts, comparisons, market explainers and journeys.
- Use a midnight-navy background only when a dark architecture or energy-flow visual improves understanding.
- Keep essential content within 80 px of canvas edges.
- Use Inter or Manrope, with system sans-serif fallbacks.
- Keep titles concise; allow two lines. Use short labels, not body paragraphs.
- Do not use the ChargeWeave logo unless the approved asset is supplied. Do not redraw the logo.

## Select the visual form that fits the point

| Article need | Preferred form |
|---|---|
| Explain an operating service | Journey or process diagram |
| Explain a platform concept | Rich editorial infographic |
| Show market figures | Data callouts or chart |
| Explain a forecast | Scenario chart that separates modeled future from observed history |
| Explain grid flexibility | Energy-flow or control diagram |
| Explain interoperability | Protocol flow with adapters and validation |
| Compare businesses | Separate metric panels; avoid implying different models are comparable |
| Show grid capacity | Scaled bars plus scope note for geography, date and connection level |
| Explain EMS choices | Strategy map or decision tree |

Vary composition to fit the information. Do not force every image into a grid of cards. Richness comes from meaningful relationships and evidence, not decoration.

## Chart and evidence rules

1. Every numeric visual states unit, period, geography and source.
2. Mark values as observed, company-reported, modeled, estimated or illustrative where relevant.
3. Never use one axis for quantities that cannot be compared.
4. Do not truncate an axis to exaggerate differences; label any non-zero baseline.
5. Put a short source note in the graphic and full links in the article.
6. Separate actual historical values from forecasts and theoretical potential.
7. Do not turn association into causation or a pilot result into a universal outcome.
8. For company metrics, identify the reporting entity and segment.
9. Avoid unsupported savings, efficiency, market-size or AI-accuracy claims.
10. Retain exact values in the article even when the graphic rounds for readability.

## AI and roadmap language

Visuals may explain ChargeWeave's product direction: a shared domain model, workflows, simulation, adapter boundaries and bounded AI assistance. Mark roadmap or conceptual capabilities as **proposed**, **in development** or **to validate** when necessary. Never depict an unbuilt product as a live feature or customer result. Show AI inside a governed workflow, with rules, evidence and human approval visible where actions have consequences.

## Light and dark mode

The editable SVG is the preferred website asset. Each SVG carries its own light and dark palette rules using `prefers-color-scheme`; this works when the file is served as an embedded image such as `<img src="/assets/infographics/example.svg">`. The matching PNG remains a static light-palette fallback.

For the SVG to follow a site-level theme toggle, the selected theme must be reflected in the page's CSS `color-scheme` on an ancestor of the image. A `data-theme` attribute or dark background by itself does not tell an external SVG which palette to use. For a typical attribute-based theme switch, expose the selection like this:

```css
html[data-theme="light"] { color-scheme: light; }
html[data-theme="dark"]  { color-scheme: dark; }
```

Then use the SVG as the image source. The page can keep its existing `data-theme` styling; the `color-scheme` declaration also passes that choice to the embedded SVG. Test the theme toggle in the site's supported browsers, including an explicit dark toggle while the operating system is set to light. If the site cannot expose its theme through `color-scheme`, use inline SVG or switch between light and dark asset variants from the site's theme state.

Do not force a dark palette into the SVG with an external stylesheet: an SVG loaded through `<img>` is a separate image document, so the page's normal descendant CSS selectors do not reach into it. Keep the theme rules inside the SVG.

## Accessibility and responsive use

- Use text and color together to communicate status; color alone is insufficient.
- Ensure strong contrast and avoid tiny labels.
- Write concise alt text describing the message, not decoration.
- Add a short article caption when context is needed.
- The key takeaway should remain understandable at about 360 px wide.
- Prefer direct labels over legends; use a readable source note.

## Reusable article visual pattern

Each ChargeWeave Insight article should usually have one main graphic after the opening or first explanatory section:

1. A short headline stating the point.
2. One organizing structure: flow, comparison, timeline, map or chart.
3. Three to seven meaningful labels or evidence points.
4. A concise takeaway or scope note.
5. A source note for data-driven visuals.

A second graphic is justified only when it explains a different question. Do not add graphics merely to decorate a page.

## Quality check

- Does it make one primary point within a few seconds?
- Are units, dates, scopes and evidence types explicit?
- Are future estimates visibly distinct from observed facts?
- Does each color follow its defined meaning?
- Is it legible on mobile?
- Does it support rather than repeat the article?
- Are ChargeWeave capabilities accurately marked as live or proposed?
- Are sources linked in the article?
- Is the SVG source included for future edits?

**Core principle:** ChargeWeave graphics should make complex charging, energy and platform relationships feel structured and understandable. Richness comes from meaningful relationships and evidence, not visual decoration.
