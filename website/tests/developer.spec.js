import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const websiteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const routeCases = [
  { route: "developer/", title: "Developer guide", active: "Runtime", marker: "Runtime factory" },
  { route: "developer/simulator/", title: "Simulation workbench", active: "Simulator", marker: "Run a journey. Inspect every boundary." },
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

test("browser simulator replays seeded scenarios and exposes protocol and store traces", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("developer/simulator/");
  await expect(page.getByRole("heading", { name: "Journey completed" })).toBeVisible();
  await expect(page.getByText("No API, socket or database calls")).toBeVisible();

  await page.getByLabel("Random seed").fill("pw-replay-42");
  await page.getByLabel("Process scenario").selectOption("duplicate-event");
  await page.getByRole("button", { name: "Run simulation" }).click();
  await expect(page.locator(".sim-result-duplicate")).toHaveText("duplicate");
  await expect(page.locator(".sim-metric-grid")).toContainText("1");
  const fingerprint = await page.locator(".sim-run-identity span").last().innerText();
  await page.getByRole("button", { name: "Run simulation" }).click();
  await expect(page.locator(".sim-run-identity span").last()).toHaveText(fingerprint);

  await page.getByRole("tab", { name: "Protocol trace" }).click();
  await expect(page.locator(".sim-trace-list")).toContainText("TransactionEvent");
  await page.locator(".sim-subnav").getByRole("button", { name: /OCPI/ }).click();
  await expect(page.locator(".sim-trace-list")).toContainText("START_SESSION");

  await page.getByLabel("Process scenario").selectOption("cdr-correction");
  await page.getByRole("button", { name: "Run simulation" }).click();
  await page.getByRole("tab", { name: "Store inspector" }).click();
  await page.getByRole("button", { name: /Temporal events/ }).click();
  await expect(page.locator(".sim-json-panel")).toContainText("recordedAt");
  await expect(page.locator(".sim-json-panel")).toContainText("correctionOf");
  const correctedValue = await page.locator(".sim-temporal-query-output").innerText();
  await page.getByLabel("Temporal knowledge time").selectOption({ index: 1 });
  const previouslyKnownValue = await page.locator(".sim-temporal-query-output").innerText();
  expect(previouslyKnownValue).not.toBe(correctedValue);
  await expect(page.locator(".sim-standards-note")).toContainText("not exhaustive schemas");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(pageErrors).toEqual([]);
});
