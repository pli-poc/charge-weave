import { test, expect } from "@playwright/test";

test("analytics filters, ranking, drill-down and result evidence share one calculation", async ({ page }, testInfo) => {
  const errors = []; page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("app/#analytics");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Analytics");
  await page.getByLabel("Measure", { exact: true }).selectOption("availability");
  await expect(page.locator('.analytics-summary [data-measure="availability"]')).toContainText("98,46%");
  await page.getByLabel("Show", { exact: true }).selectOption("Change");
  await page.getByLabel("Rank direction").selectOption("Ascending");
  await page.getByLabel("Result limit").selectOption("3");
  await expect(page.locator(".analytics-explorer .analytics-bar-row")).toHaveCount(3);
  await expect(page.locator(".analytics-explorer .analytics-bar-row").first()).toContainText("Arena parking P2");
  await page.getByRole("button", { name: "Table", exact: true }).click();
  await expect(page.locator(".analytics-explorer tbody tr")).toHaveCount(3);
  await expect(page.locator(".analytics-explorer")).toContainText("pp");
  await page.getByRole("button", { name: "Arena parking P2", exact: true }).click();
  await expect(page.getByLabel("Site", { exact: true })).toHaveValue("NL-AMS-02");
  await expect(page.getByLabel("Group by")).toHaveValue("month");
  await page.getByRole("button", { name: "Trend", exact: true }).click();
  await expect(page.locator(".analytics-line svg")).toBeVisible();
  await page.getByText("How this result was calculated", { exact: true }).click();
  await expect(page.locator(".analytics-evidence")).toContainText("RatioOfSums");
  await expect(page.locator(".analytics-evidence")).toContainText("eligible point-seconds");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export result and calculation evidence" }).click();
  expect((await download).suggestedFilename()).toBe("chargeweave-analytical-result.json");
  await page.getByRole("button", { name: "Reset filters" }).click();
  await page.getByLabel("Country", { exact: true }).selectOption("BE");
  await expect(page.locator(".analytics-explorer")).not.toContainText("Maasboulevard");
  await expect(page.locator(".analytics-explorer .analytics-bar-row")).toHaveCount(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  const screenshot = testInfo.outputPath(`analytics-${testInfo.project.name}.png`);
  await page.screenshot({ path: screenshot, fullPage: true });
  await testInfo.attach("analytics workspace", { path: screenshot, contentType: "image/png" });
});

test("knowledge cutoffs retain late corrections and incomplete periods stay explicit", async ({ page }) => {
  await page.goto("app/#analytics");
  await page.getByLabel("Reporting period").selectOption("september");
  await page.getByLabel("Site", { exact: true }).selectOption("NL-RTM-01");
  const correctedValue = await page.locator('.analytics-summary [data-measure="energy"] .kpi-value').textContent();
  await page.getByLabel("Knowledge cutoff").selectOption("2026-10-01T00:00:00Z");
  expect(await page.locator('.analytics-summary [data-measure="energy"] .kpi-value').textContent()).not.toBe(correctedValue);
  await page.getByLabel("Reporting period").selectOption("year");
  await expect(page.getByRole("status")).toContainText("incomplete");
  await page.getByLabel("Knowledge cutoff").selectOption("2027-01-05T00:00:00Z");
  await expect(page.getByRole("status")).toHaveCount(0);
  await expect(page.locator('.analytics-summary [data-measure="energy"]')).toContainText("365 measured site-days");
});

test("overview pane visibility and ordering persist independently from analytics filters", async ({ page }) => {
  await page.goto("app/");
  await page.getByText("Choose dashboard panes", { exact: true }).click();
  await page.getByLabel("Energy through the period", { exact: true }).uncheck();
  await expect(page.locator('.dashboard-panel[data-panel="trend"]')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.dashboard-panel[data-panel="trend"]')).toHaveCount(0);
  await page.getByText("Choose dashboard panes", { exact: true }).click();
  await page.getByLabel("Energy through the period", { exact: true }).check();
  await expect(page.locator('.dashboard-panel[data-panel="trend"]')).toBeVisible();
  const allValue = await page.locator('[data-measure="energy"] .kpi-value').textContent();
  await page.getByLabel("Country", { exact: true }).selectOption("NL");
  expect(await page.locator('[data-measure="energy"] .kpi-value').textContent()).not.toBe(allValue);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
