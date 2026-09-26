import { test, expect } from "@playwright/test";

const mockedMapTile = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" fill="#1b2934"/><g fill="none" stroke="#526271" stroke-width="2" opacity=".8"><path d="M-20 70 280 190M-30 220 270 45M45-20 180 280M215-20 80 280"/><path d="M-20 130H280M128-20V280" stroke-width="1" opacity=".7"/></g><g fill="#d3dde5" font-family="sans-serif" font-size="8"><text x="24" y="112">MAP TILE TEST</text></g></svg>`;

test("the isolated console is published under the corporate site and presents the European owned network", async ({ page }, testInfo) => {
  const errors = [];
  const externalRequests = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (!request.url().startsWith("http://127.0.0.1")) externalRequests.push(request.url());
  });

  await page.goto("app/");
  await expect(page).toHaveTitle("Operations console — ChargeWeave");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Network overview");
  await expect(page.getByText("Owned charging operations in the Netherlands and Belgium", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sites & parking", exact: true })).toBeVisible();
  await expect(page.locator(".kpi-grid")).toContainText(/€\s?2\.463,04/);
  if (testInfo.project.name === "desktop") {
    const screenshot = testInfo.outputPath("operations-overview.png");
    await page.screenshot({ path: screenshot, fullPage: true });
    await testInfo.attach("operations overview", { path: screenshot, contentType: "image/png" });
  }
  const orderBefore = await page.locator(".dashboard-panel").evaluateAll((panels) => panels.map((panel) => panel.dataset.panel));
  await page.getByRole("button", { name: "Arrange panels" }).click();
  await page.getByRole("button", { name: "Move Chargecard roaming up" }).click();
  const orderAfter = await page.locator(".dashboard-panel").evaluateAll((panels) => panels.map((panel) => panel.dataset.panel));
  expect(orderAfter.indexOf("roaming")).toBe(orderBefore.indexOf("roaming") - 1);

  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  if (testInfo.project.name === "mobile") await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Chargecard roaming", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Chargecard roaming" })).toBeVisible();
  await expect(page.locator(".table-wrap")).toContainText("Germany");
  await expect(page.locator(".table-wrap")).toContainText("France");
  await expect(page.locator(".table-wrap")).toContainText("€");

  if (testInfo.project.name === "mobile") await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Data explorer", exact: true }).click();
  await page.getByRole("tab", { name: "Table" }).click();
  await expect(page.locator(".data-canvas-content")).toContainText("Amount (EUR)");
  await expect(page.locator(".data-inspector")).toContainText("Recorded time");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  expect(externalRequests).toEqual([]);
});

test("the console navigation and country filter work at desktop and mobile sizes", async ({ page }, testInfo) => {
  await page.goto("app/");
  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "Open navigation" }).click();
  }
  await page.getByRole("button", { name: "Sites & parking", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Sites & parking" })).toBeVisible();
  await page.getByRole("button", { name: "BE Belgium", exact: true }).click();
  await expect(page.locator(".table-wrap")).toContainText("Antwerpen");
  await expect(page.locator(".table-wrap")).not.toContainText("Rotterdam");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("the geographic view connects owned sites and European Chargecard roaming", async ({ page }, testInfo) => {
  const errors = [];
  const externalRequests = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (!request.url().startsWith("http://127.0.0.1")) externalRequests.push(request.url());
  });
  await page.route("https://tile.openstreetmap.org/**", (route) => route.fulfill({
    status: 200,
    contentType: "image/svg+xml",
    body: mockedMapTile,
  }));

  await page.goto("app/#geography");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Geographic network");
  await expect(page.locator(".leaflet-container")).toBeVisible();
  await expect(page.locator(".leaflet-control-attribution")).toContainText("OpenStreetMap contributors");
  await expect(page.locator(".leaflet-tile")).not.toHaveCount(0);
  await expect(page.locator(".map-marker-owned")).toHaveCount(8);
  await expect(page.locator(".geo-location-row")).toHaveCount(8);
  await page.locator('.geo-location-row[data-map-site="NL-RTM-01"]').click();
  await expect(page.locator(".geo-details-pane")).toContainText("Maasboulevard 100, 3063 NS Rotterdam");
  await expect(page.locator('.geo-details-pane a[href="https://www.openstreetmap.org/node/2805477332"]')).toBeVisible();
  await page.getByRole("button", { name: "BE Belgium", exact: true }).click();
  await expect(page.locator(".map-marker-owned")).toHaveCount(4);
  await expect(page.locator(".geo-location-list")).toContainText("Antwerpen");
  await expect(page.locator(".geo-location-list")).not.toContainText("Rotterdam");

  await page.locator('[data-map-scope="roaming"]').click();
  await expect(page.locator(".map-marker-roaming")).toHaveCount(6);
  await page.locator('.map-marker-roaming[data-map-roaming="RC-2026-091702"]').click();
  await expect(page.locator(".geo-details-pane")).toContainText("Copenhagen Metro");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  expect(externalRequests.length).toBeGreaterThan(0);
  expect(externalRequests.every((url) => url.startsWith("https://tile.openstreetmap.org/"))).toBe(true);

  if (testInfo.project.name === "desktop") {
    const screenshot = testInfo.outputPath("geographic-network.png");
    await page.screenshot({ path: screenshot, fullPage: true });
    await testInfo.attach("geographic network view", { path: screenshot, contentType: "image/png" });
  }
});
