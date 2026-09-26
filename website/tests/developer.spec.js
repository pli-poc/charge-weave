import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const websiteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const routeCases = [
  { route: "developer/", title: "Developer guide", active: "Runtime", marker: "Runtime factory" },
  { route: "developer/protocols/", title: "Protocol simulation", active: "Protocols", marker: "OCPP 2.1" },
  { route: "developer/switchboard/", title: "Runtime switchboard", active: "Switchboard", marker: "Observe" },
  { route: "developer/storage/", title: "Simulated storage", active: "Storage", marker: "Temporal event store" },
  { route: "developer/replay/", title: "Deterministic replay", active: "Replay", marker: "chargeweave-rng-v1" },
];

test("developer guide routes load directly with page-specific metadata", async () => {
  for (const { route, title } of routeCases) {
    const entry = path.join(websiteDir, "dist", route, "index.html");
    expect(fs.existsSync(entry), `${route} has a static Pages entry`).toBe(true);
    const html = fs.readFileSync(entry, "utf8");
    expect(html).toContain(`<title>${title} — ChargeWeave</title>`);
    expect(html).toContain("property=\"og:url\"");
    expect(html).toContain(`https://pli-poc.github.io/charge-weave/${route}`);
  }
});

test("developer pages explain the proposed runtime and keep guide navigation in sync", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  for (const { route, active, marker } of routeCases) {
    await page.goto(route);
    await expect(page.locator(".dev-guide-hero h1")).toBeVisible();
    await expect(page.locator(".dev-guide-content")).toContainText(marker);
    await expect(
      page.getByRole("navigation", { name: "Developer guide pages" })
        .getByRole("link", { name: active, exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await expect(page.locator(".header .nav a[aria-current='page']"))
      .toHaveText("Developer guide");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      `${route} fits the ${page.viewportSize()?.width}px viewport`,
    ).toBe(true);
  }

  expect(pageErrors).toEqual([]);
});

test("switchboard keeps protocol inputs and simulated stores independently configurable", async ({ page }) => {
  await page.goto("developer/switchboard/");
  const config = page.locator(".dev-code").first();
  await expect(config).toContainText('"ocpp": "virtual"');
  await expect(config).toContainText('"process": "synthetic"');
  await expect(config).toContainText('"temporal": "memory"');
  await expect(page.locator(".dev-table-wrap")).toContainText("OCPP source only");
  await expect(page.locator(".dev-table-wrap")).toContainText("Always-on protocol gateway");
});
