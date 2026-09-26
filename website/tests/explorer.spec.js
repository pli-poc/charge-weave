import { test, expect } from "@playwright/test";
import { Parser } from "n3";
import fs from "node:fs";

for (const [route, title] of [
  ["ontology", "Ontology explorer"],
  ["capabilities", "The whole business.Connected by design."],
  ["architecture", "Meaning is shared.Work has boundaries."],
  ["roadmap", "Build the foundation.Prove each next step."],
]) {
  test(`${route} has a direct static entry and navigation`, async ({
    page,
  }, testInfo) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const response = await page.goto(route + "/");
    expect(response.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(title);
    await expect(page).toHaveTitle(
      new RegExp(
        route === "ontology"
          ? "Ontology explorer"
          : route === "roadmap"
            ? "Development roadmap"
            : route === "capabilities"
              ? "Platform capabilities"
              : "Architecture",
      ),
    );
    await page.evaluate(() => document.fonts.ready);
    if (route === "ontology" && testInfo.project.name === "desktop") {
      await expect(
        page.getByRole("button", { name: "validFrom", exact: true }),
      ).toBeInViewport();
      await expect(page.locator(".focus-node")).toBeInViewport();
    }
    await expect(page.locator('.nav a[aria-current="page"]')).toHaveAttribute(
      "href",
      `/charge-weave/${route}/`,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(route + ".png") });
    await testInfo.attach(route, {
      path: testInfo.outputPath(route + ".png"),
      contentType: "image/png",
    });
    expect(errors).toEqual([]);
  });
}

test("ontology relationships, real triples, inheritance and temporal inspector work", async ({
  page,
}, testInfo) => {
  await page.goto("ontology/?class=ChargingSession");
  await expect(page.locator(".inspected-name h2")).toHaveText("selectedTariff");
  await page
    .getByRole("button", {
      name: "Inspect ChargingSession.selectedTariff",
      exact: true,
    })
    .click();
  await expect(page.locator(".contract-facts")).toContainText("TariffVersion");
  await expect(page.locator(".contract-facts")).toContainText("0..1");
  await page.getByRole("button", { name: "Temporal", exact: true }).click();
  await expect(
    page.locator(".time-field").filter({ hasText: "validFrom" }),
  ).toBeVisible();
  await expect(page.locator(".temporal-result")).toContainText("€0.30");
  await page.getByLabel("Known on", { exact: true }).fill("2026-05-04");
  await expect(page.locator(".temporal-result")).toContainText("€0.35");
  await page.getByLabel("Effective on", { exact: true }).fill("2026-05-16");
  await page.getByLabel("Known on", { exact: true }).fill("2026-05-06");
  await expect(page.locator(".temporal-result")).toContainText("€0.32");
  await page.getByText("Selected snapshot evidence", { exact: true }).click();
  await expect(page.locator(".snapshot-evidence")).toContainText("offset 3");
  await expect(page.locator(".snapshot-evidence")).toContainText("urn:chargeweave:payload:");
  await page.getByLabel("Effective on", { exact: true }).fill("2026-05-18");
  await page.getByLabel("Known on", { exact: true }).fill("2026-05-08");
  await expect(page.locator(".temporal-result")).toContainText("Explicitly withdrawn");
  await page.getByLabel("Effective on", { exact: true }).fill("2026-05-19");
  await expect(page.locator(".temporal-result")).toContainText("€0.32");
  await page.getByText("Business time × knowledge history", { exact: true }).click();
  await expect(page.locator(".temporal-timeline tbody tr")).toHaveCount(4);
  await page.getByText("Reproduce with SPARQL", { exact: true }).click();
  await expect(page.locator(".temporal-query pre")).toContainText("SELECT");
  await page.screenshot({ path: testInfo.outputPath("temporal-evidence.png"), fullPage: true });
  await testInfo.attach("temporal-evidence", { path: testInfo.outputPath("temporal-evidence.png"), contentType: "image/png" });
  await page.getByLabel("Effective on", { exact: true }).fill("2026-06-01");
  await expect(page.locator(".temporal-result")).toContainText(
    "No example value",
  );
  await page.getByRole("button", { name: "Triples", exact: true }).click();
  await expect(page.locator(".triples-table")).toContainText(
    "owl:ObjectProperty",
  );
  await expect(page.locator(".triples-table")).toContainText("sh:maxCount");
  // Export must be real parseable RDF, with the selected class's actual field shape.
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export .nt" }).click();
  const download = await downloadPromise;
  const triples = new Parser({ format: "N-Triples" }).parse(
    fs.readFileSync(await download.path(), "utf8"),
  );
  expect(
    triples.some(
      (q) =>
        q.subject.value.endsWith("ChargingSession_selectedTariffShape") &&
        q.predicate.value.endsWith("#maxCount") &&
        q.object.value === "1",
    ),
  ).toBe(true);
  expect(
    triples.some(
      (q) =>
        q.subject.value.endsWith("#ChargingSession") &&
        q.predicate.value.endsWith("#selectedTariff"),
    ),
  ).toBe(false);
  await page.getByRole("button", { name: "Fields", exact: true }).click();
  await page.getByRole("checkbox", { name: "Inherited fields" }).check();
  await expect(
    page.locator(".fields-table tr").filter({ hasText: "canonicalId" }),
  ).toContainText("Record");
  await page.getByRole("button", { name: /^Rules/ }).click();
  await page
    .locator(".rule-card summary")
    .filter({
      hasText: "Completed sessions require end time and end evidence.",
    })
    .click();
  await expect(page.locator(".rule-card[open] pre")).toContainText(
    "SELECT $this",
  );
  if (testInfo.project.name === "mobile")
    await page
      .getByRole("button", { name: "Definitions", exact: true })
      .click();
  await page
    .getByRole("textbox", { name: "Search definitions" })
    .fill("no-such-domain-definition");
  await expect(page.getByText("No matching definitions.")).toBeVisible();
  await page
    .getByRole("textbox", { name: "Search definitions" })
    .fill("TariffVersion");
  await page
    .locator(".definition-list")
    .getByRole("button", { name: /^Tariff Version/ })
    .click();
  await expect(page.locator(".selected-class-title h2")).toHaveText(
    "Tariff Version",
  );
  await expect(page).toHaveURL(/class=TariffVersion/);
  await page.reload();
  await expect(page.locator(".selected-class-title h2")).toHaveText(
    "Tariff Version",
  );
  // A class reached from a capability page must also exist in the published model.
  await page.goto("capabilities/");
  const targets = await page
    .locator(".definition-links a")
    .evaluateAll((links) =>
      links.map((a) => new URL(a.href).searchParams.get("class")),
    );
  const catalog = JSON.parse(fs.readFileSync("../model/catalog.json", "utf8"));
  expect(targets.every((name) => Boolean(catalog[name]))).toBe(true);
});

test("temporal inspector exposes interval links, time roles and coverage boundaries", async ({ page }, testInfo) => {
  for (const [name, link, range] of [
    ["ChargingInterval", "interval", "TimeWindow"],
    ["Booking", "bookingWindow", "TimeWindow"],
    ["GridConnection", "effectiveWindow", "TimeWindow"],
    ["ChargingSite", "openingWindow", "RecurringWindow"],
  ]) {
    await page.goto(`ontology/?class=${name}`);
    await page.getByRole("button", { name: "Temporal", exact: true }).click();
    await expect(page.locator(".temporal-windows")).toContainText(`${link} → ${range}`);
    await expect(page.locator(".temporal-windows a").filter({ hasText: `${link} → ${range}` })).toHaveAttribute("href", `/charge-weave/ontology/?class=${range}`);
    await expect(page.locator(".temporal-coverage")).toContainText("Shared snapshot contract");
    await expect(page.locator(".temporal-lab")).toContainText("independent of the selected class");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.goto("ontology/?class=SourceEvent");
  await page.getByRole("button", { name: "Temporal", exact: true }).click();
  await expect(page.locator(".time-field").filter({ hasText: "occurredAt" })).toContainText("Event / observation time");
  await expect(page.locator(".time-field").filter({ hasText: "receivedAt" })).toContainText("Receipt time");
  await page.goto("ontology/?class=ChargingSession");
  await page.getByRole("button", { name: "Temporal", exact: true }).click();
  await expect(page.locator(".temporal-context")).toContainText("ChargingSession.selectedTariff → TariffVersion");
  await expect(page.locator(".temporal-context")).toContainText("do not by themselves establish the history of this relationship");
  await page.screenshot({ path: testInfo.outputPath("temporal-review.png"), fullPage: true });
  await testInfo.attach("temporal-review", { path: testInfo.outputPath("temporal-review.png"), contentType: "image/png" });
});
