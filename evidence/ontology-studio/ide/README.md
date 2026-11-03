# Synthetic studio visual evidence

These captures show the actual built modelling studio after selecting the synthetic `ChargingStation` concept in an isolated in-memory workspace. They were captured with headless Chromium 153 on Windows, using the working tree based on commit `f596f8b0abe0befe2cba4e49bc936ec34596b730` plus the compact tab, selected-navigation hover and diagram-legend contrast fixes committed with this evidence. They contain no real credentials or customer data.

Each `connected-{width}-{theme}.png` records the named CSS viewport width and light or dark system appearance. Desktop captures use 1280×800 and 1920×1080; compact captures use 390×844 and 320×800. The compact diagram and relationship list are opened and the page is scrolled by those interactions, so the screenshots are not the initial top of the mobile page. Reduced motion was requested for capture.

To reproduce, build the website and run `node scripts/capture-studio-evidence.mjs` from `website` with Playwright Chromium installed. The script creates a temporary loopback service and in-memory synthetic workspace and does not use an existing workspace database.

The visual review identified and fixed broken word wrapping in the 320px document tabs, low contrast on the selected compact-navigation hover state, and low contrast in the diagram legend in dark mode. The compact captures still require scrolling to reach the full diagram and list. These screenshots cover one connected-view scenario only; welcome, editor, dense view, Problems, Changes/Review, real browser zoom, assistive technology and independent human usability review remain outstanding.
