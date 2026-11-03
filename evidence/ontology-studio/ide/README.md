# Synthetic studio visual evidence

These captures show the actual built modelling studio after selecting the synthetic `ChargingStation` concept in an isolated in-memory workspace. They were captured with headless Chromium 153 on Windows, using the working tree based on commit `f596f8b0abe0befe2cba4e49bc936ec34596b730` plus the compact tab, selected-navigation hover and diagram-legend contrast fixes committed with this evidence. They contain no real credentials or customer data.

Each `connected-{width}-{theme}.png` records the named CSS viewport width and light or dark system appearance. Desktop captures use 1280×800 and 1920×1080; compact captures use 390×844 and 320×800. The compact diagram and relationship list are opened and the page is scrolled by those interactions, so the screenshots are not the initial top of the mobile page. Reduced motion was requested for capture.

To reproduce, build the website and run `node scripts/capture-studio-evidence.mjs` from `website` with Playwright Chromium installed. The script creates a temporary loopback service and in-memory synthetic workspace and does not use an existing workspace database.

The visual review identified and fixed broken word wrapping in the 320px document tabs, low contrast on the selected compact-navigation hover state, and low contrast in the diagram legend in dark mode. The compact captures still require scrolling to reach the full diagram and list.

The additional `welcome`, `relationship-editor`, `problems` and `review` images capture light and dark 1280×800 views from a separate in-memory synthetic workspace. The failed check and its output are simulated. These were captured using the working tree based on `43bf2ddea7543c8e4c5b0bec6f0d565403f16f2f` plus the inspector-table fix committed with them; rerun `node scripts/capture-studio-workflows.mjs` from `website` after building to reproduce. The inspector table now retains readable column widths with keyboard-accessible horizontal scrolling; its actions may require scrolling. Some screenshots show a scrolled position reached during the scenario.

These captures are partial visual evidence, not acceptance: equivalent workflow views at 1920px, Changes, dense-view and other required scenarios, real browser zoom, assistive technology and independent human usability review remain outstanding.
