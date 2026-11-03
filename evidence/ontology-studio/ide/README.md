# Synthetic studio visual evidence

These captures show the actual built modelling studio after selecting the synthetic `ChargingStation` concept in an isolated in-memory workspace. They were captured with headless Chromium 153 on Windows, using the working tree based on commit `f596f8b0abe0befe2cba4e49bc936ec34596b730` plus the compact tab, selected-navigation hover and diagram-legend contrast fixes committed with this evidence. They contain no real credentials or customer data.

Each `connected-{width}-{theme}.png` records the named CSS viewport width and light or dark system appearance. Desktop captures use 1280×800 and 1920×1080; compact captures use 390×844 and 320×800. The compact diagram and relationship list are opened and the page is scrolled by those interactions, so the screenshots are not the initial top of the mobile page. Reduced motion was requested for capture.

To reproduce, build the website and run `node scripts/capture-studio-evidence.mjs` from `website` with Playwright Chromium installed. The script creates a temporary loopback service and in-memory synthetic workspace and does not use an existing workspace database.

The visual review identified and fixed broken word wrapping in the 320px document tabs, low contrast on the selected compact-navigation hover state, and low contrast in the diagram legend in dark mode. The compact captures still require scrolling to reach the full diagram and list.

The additional `welcome`, `relationship-editor`, `problems` and `review` images capture light and dark views at 1280×800 and 1920×1080 from a separate in-memory synthetic workspace. The failed check and its output are simulated. These were recaptured using the working tree based on `347b602eff16120483324f09da4aae4bf560800e` plus the welcome-card changes committed with them. After building, run `node scripts/capture-studio-workflows.mjs` from `website` for 1280px or add `--wide` for 1920px. The inspector table retains readable column widths with keyboard-accessible horizontal scrolling; its actions may require scrolling. Some screenshots show a scrolled position reached during the scenario.

The `changes` images show a synthetic description edit and its source patch at both desktop widths and themes. They were generated from commit `352253d4496a2499d1c6301fba743f7fc20d29fc` with `node scripts/capture-studio-workflows.mjs --changes` and a second run adding `--wide`.

The `dense` images show a synthetic 151-node, 200-edge view after using the explicit fit control, at both desktop widths and themes. They were recaptured from the working tree based on `f7498672954fcc2fe837c5ef4e31963f00a9b06e` plus the zoom-bound and overview-guidance changes committed with them, using `node scripts/measure-canvas.mjs --capture-dense`. A browser geometry check confirmed that the node bounds fit inside the canvas at 1280px, and the Focus selected control returned to 100%. The resulting overview is approximately 2% zoom and its labels are unreadable; the UI advises zooming or focusing a concept. This does not demonstrate that the dense-neighbourhood usability target is met.

These captures are partial visual evidence, not acceptance: other required scenarios, real browser zoom, assistive technology and independent human usability review remain outstanding.
