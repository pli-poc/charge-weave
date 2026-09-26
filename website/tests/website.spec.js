import { test, expect } from "@playwright/test";

test("the presentation loads at the Pages subpath and supports exploration", async ({
  page,
}, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const failedAssets = [];
  page.on("response", (response) => {
    if (response.status() >= 400 && response.url().includes("127.0.0.1"))
      failedAssets.push(response.url());
  });
  await page.goto("./");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Connect thewhole chargingbusiness.",
  );
  await expect(
    page.getByText("Platform in development", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".hero-image img")).toHaveJSProperty(
    "naturalWidth",
    1672,
  );
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: testInfo.outputPath("homepage.png"),
    fullPage: true,
  });
  await testInfo.attach("homepage", {
    path: testInfo.outputPath("homepage.png"),
    contentType: "image/png",
  });
  await page
    .getByRole("link", { name: "Explore the platform", exact: true })
    .click();
  await expect(page).toHaveURL(/#capabilities$/);
  await page.locator("#capability-history summary").click();
  await expect(page.locator("#capability-history")).toHaveAttribute("open", "");
  await expect(
    page.getByText("Effective time and recorded time", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Fleet & workplace", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Charging that fits the way a fleet works.",
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Home & reimbursement", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "A clear path from home charging to repayment.",
    }),
  ).toBeVisible();
  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "Open navigation" }).click();
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "Roadmap" })
      .click();
    await expect(
      page.getByRole("button", { name: "Open navigation" }),
    ).toHaveAttribute("aria-expanded", "false");
    await expect(page).toHaveURL(/\/roadmap\/$/);
  }
  const missingTargets = await page
    .locator('a[href^="#"]')
    .evaluateAll((links) =>
      links
        .map((a) => a.getAttribute("href"))
        .filter(
          (href) => href !== "#" && !document.getElementById(href.slice(1)),
        ),
    );
  expect(missingTargets).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  expect(failedAssets).toEqual([]);
});

test("the corporate navigation opens the co-hosted operations console", async ({ page }, testInfo) => {
  await page.goto("./");
  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "Open navigation" }).click();
  }
  const consoleLink = page.getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Operations console", exact: true });
  await expect(consoleLink).toHaveAttribute("href", "/charge-weave/app/");
  await consoleLink.click();
  await expect(page).toHaveURL(/\/charge-weave\/app\/$/);
  await expect(page.getByRole("heading", { name: "Network overview" })).toBeVisible();
});
