import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const websiteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const routeCases = [
  { route: "developer/", title: "Developer guide", active: "Runtime", marker: "Runtime factory" },
  { route: "developer/platform/", title: "Workflow runtime architecture", active: "Workflow runtime", marker: "One workflow contract, from design to evidence." },
  { route: "developer/human-tasks/", title: "Human task forms", active: "Human task forms", marker: "Task-scoped forms, compiled from a validated contract." },
  { route: "developer/simulator/", title: "Simulation workbench", active: "Simulator", marker: "Run a journey. Inspect every boundary." },
  { route: "developer/flows/", title: "Workflow Studio", active: "Workflow Studio", marker: "Correct a charging bill without erasing its history." },
  { route: "developer/protocols/", title: "Protocol simulation", active: "Protocols", marker: "OCPP 2.1" },
  { route: "developer/switchboard/", title: "Runtime switchboard", active: "Switchboard", marker: "Observe" },
  { route: "developer/storage/", title: "Simulated storage", active: "Storage", marker: "Temporal event store" },
  { route: "developer/replay/", title: "Deterministic replay", active: "Replay", marker: "chargeweave-xorshift32-v1" },
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
    await expect(page.getByRole("link", { name: /High-level architecture and design principles/ })).toHaveAttribute(
      "href",
      "/charge-weave/architecture/",
    );
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

test("workflow runtime page explains the generic workflow boundary in a 2D diagram", async ({ page }) => {
  await page.goto("developer/platform/");
  const diagram = page.getByRole("img", { name: "ChargeWeave workflow runtime from design to evidence" });
  await expect(diagram).toBeVisible();
  await expect(page.locator(".wpo-diagram")).toContainText("XState v5 actors");
  await expect(page.locator(".wpo-diagram")).toContainText("ChargeWeave business ontology");
  await expect(page.locator(".wpo-diagram")).toContainText("XFlow SHACL shapes");
  await expect(page.locator(".wpo-explanation")).toContainText("The host supplies clocks, adapters and persistence.");
});

test("human task form prototype keeps ontology guidance separate from task authority", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("developer/human-tasks/");
  await expect(page.getByText("INTERACTIVE PROTOTYPE", { exact: true })).toBeVisible();
  await expect(page.locator(".htd-contract-grid")).toContainText("Workflow task contract");
  await expect(page.locator(".htd-contract-grid")).toContainText("Presentation profile");
  await expect(page.locator(".htd-example")).toContainText("Review evidence without rewriting history.");
  await expect(page.locator(".htd-safety-note")).toContainText("original debit");
  await expect(page.getByRole("status").filter({ hasText: "Approval task open" })).toBeVisible();
  await expect(page.locator(".task-form-masked-value")).toHaveText("•••• 4242");
  await expect(page.getByLabel("Correction type")).toContainText("Credit");
  await expect(page.getByLabel("Supporting evidence")).toContainText("Signed meter correction");
  await expect(page.getByLabel("Proposed credit amount", { exact: true })).toHaveValue("0.19");

  await page.getByLabel("Proposed credit amount", { exact: true }).fill("0.20");
  await page.getByRole("button", { name: "Approve correction" }).click();
  await expect(page.getByRole("alert")).toContainText("cannot exceed the calculated 0.19 EUR adjustment");
  await expect(page.getByRole("status").filter({ hasText: "Approval task open" })).toBeVisible();

  await page.getByLabel("Proposed credit amount", { exact: true }).fill("0.19");
  await page.getByRole("button", { name: "Approve correction" }).click();
  await expect(page.getByText("Approval accepted by the task host.")).toBeVisible();
  await expect(page.getByText("Workflow completed")).toBeVisible();

  await page.getByRole("button", { name: "Start fresh run" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Approval task open" })).toBeVisible();
  await page.getByLabel("Decision reason").fill("The submitted source evidence does not verify the revised meter reading.");
  await page.getByRole("button", { name: "Reject and quarantine" }).click();
  await expect(page.getByText("Rejection recorded.")).toBeVisible();
  await expect(page.getByText("Workflow rejected")).toBeVisible();
  await expect(page.getByRole("link", { name: /Open the current Workflow Studio/ })).toHaveAttribute("href", "/charge-weave/developer/flows/");
  expect(pageErrors).toEqual([]);
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

test("workflow studio executes, inspects and restores a configurable correction flow", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("developer/flows/");
  await expect(page.getByRole("heading", { name: "Correct a charging bill without erasing its history." })).toBeVisible();
  await expect(page.locator(".wf-graph")).toContainText("Verify signature and register epoch");

  await page.getByRole("button", { name: "Start run" }).click();
  await page.getByRole("button", { name: "Inject correction" }).click();
  await page.getByRole("button", { name: "Validate" }).click();
  await expect(page.locator(".wf-status")).toContainText("Approve the billing correction");
  await expect(page.locator(".wf-execution-panel")).toContainText("0.600 kWh");
  await page.getByRole("button", { name: "Save checkpoint" }).click();
  await page.getByRole("button", { name: "Advance time" }).click();
  await expect(page.locator(".wf-status")).toContainText("Review an exception");
  await page.getByRole("button", { name: "Restore" }).click();
  await expect(page.locator(".wf-status")).toContainText("Approve the billing correction");
  await page.locator(".wf-run-controls").getByRole("button", { name: "Approve", exact: true }).click();
  await expect(page.locator(".wf-status")).toContainText("Correction completed");
  await expect(page.locator(".wf-status")).toHaveAttribute("data-status", "done");
  await expect(page.locator(".wf-execution-panel")).toContainText("CREDIT-CDR-DEMO-1042");
  await expect(page.locator(".wf-execution-panel")).toContainText("CDR-CDR-DEMO-1042-R1");
  await expect(page.locator(".wf-timeline-panel")).toContainText("Advanced virtual time by 60 seconds");

  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByRole("button", { name: "Restore" })).toBeDisabled();
  await page.getByLabel("Billing evidence status").selectOption("missing");
  await page.getByLabel("Approval threshold in kWh").fill("0.75");
  await page.getByRole("button", { name: "Start run" }).click();
  await page.getByRole("button", { name: "Inject correction" }).click();
  await page.getByRole("button", { name: "Validate" }).click();
  await expect(page.locator(".wf-status")).toContainText("Wait for billing evidence");
  await page.getByRole("button", { name: "Add billing evidence" }).click();
  await expect(page.locator(".wf-status")).toContainText("Correction completed");
  await expect(page.locator(".wf-execution-panel")).toContainText("CREDIT-CDR-DEMO-1042");

  await page.getByRole("button", { name: "Reset" }).click();
  await page.getByLabel("Meter evidence test").selectOption("invalid-signature");
  await page.getByRole("button", { name: "Start run" }).click();
  await page.getByRole("button", { name: "Inject correction" }).click();
  await page.getByRole("button", { name: "Validate" }).click();
  await expect(page.locator(".wf-status")).toContainText("Evidence quarantined");
  await expect(page.locator(".wf-status")).toHaveAttribute("data-status", "quarantined");
  await expect(page.locator(".wf-error-note")).toContainText("signature is invalid");
  await expect(page.locator(".wf-graph")).toContainText("Approve the billing correction");
  await expect(page.locator(".wf-studio-wrap")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(pageErrors).toEqual([]);
});

test("workflow graph edits change the routed path used by the next runtime run", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("developer/flows/");
  await expect(page.locator(".wf-flow-canvas")).toBeVisible();
  expect(await page.locator(".wf-edge-layer path").count()).toBeGreaterThan(20);
  expect(await page.locator(".wf-edge text").allTextContents()).toContain("timer.expired");
  expect(await page.locator(".wf-edge text").allTextContents()).not.toContain("timeout");
  expect(await page.locator(".wf-edge text").filter({ hasText: "timer.expired" }).count()).toBe(1);

  await page.getByRole("button", { name: "Edit flow" }).click();
  await page.locator(".wf-flow-canvas").getByRole("button", { name: /Approval required\?/ }).click();
  await expect(page.locator(".wf-inspector-transitions")).toContainText("otherwise");
  await page.getByLabel("Destination for otherwise").selectOption("declined");
  await expect(page.locator(".wf-graph-actions")).toContainText("Draft edited");
  await expect(page.locator(".wf-inspector-transitions")).toContainText("Correction declined");
  await expect(page.locator('ol[aria-label="Workflow transitions"]')).toContainText("Approval required?: otherwise → Correction declined");

  await page.locator('.wf-node[data-step-id="evidenceReceived"]').click();
  await page.getByLabel("Step label").fill("Repeated label");
  await page.locator('.wf-node[data-step-id="awaitingEvidence"]').click();
  await page.getByLabel("Step label").fill("Repeated label");

  await page.getByLabel("Approval threshold in kWh").fill("0.75");
  await page.getByRole("button", { name: "Start run" }).click();
  await page.getByRole("button", { name: "Inject correction" }).click();
  await page.getByRole("button", { name: "Validate" }).click();
  await expect(page.locator(".wf-status")).toContainText("Correction declined");
  await expect(page.locator(".wf-flow-canvas")).toContainText("Correction declined");
  await expect(page.locator('.wf-node[data-step-id="awaitingEvidence"]')).toHaveClass(/is-visited/);
  await expect(page.locator('.wf-node[data-step-id="evidenceReceived"]')).toHaveClass(/is-visited/);
  expect(pageErrors).toEqual([]);
});
