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
