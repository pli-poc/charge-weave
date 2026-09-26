import { test, expect } from "@playwright/test";

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
  await expect(page.getByRole("button", { name: "Sites & parking" })).toBeVisible();
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
  await page.getByRole("button", { name: "Chargecard roaming" }).click();
  await expect(page.getByRole("heading", { name: "Chargecard roaming" })).toBeVisible();
  await expect(page.locator(".table-wrap")).toContainText("Germany");
  await expect(page.locator(".table-wrap")).toContainText("France");
  await expect(page.locator(".table-wrap")).toContainText("€");

  if (testInfo.project.name === "mobile") await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Data explorer" }).click();
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
  await page.getByRole("button", { name: "Sites & parking" }).click();
  await expect(page.getByRole("heading", { name: "Sites & parking" })).toBeVisible();
  await page.getByRole("button", { name: "BE Belgium" }).click();
  await expect(page.locator(".table-wrap")).toContainText("Antwerpen");
  await expect(page.locator(".table-wrap")).not.toContainText("Rotterdam");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
