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

test("the Insights blog filters Markdown articles and copies a LinkedIn draft", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async (text) => { window.__copiedMarkdown = text; } },
    });
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./blog/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ideas for a more connected charging business.");
  await expect(page.getByRole("link", { name: /A charging network is an operating business/ })).toBeVisible();
  await page.getByRole("button", { name: "Platform architecture" }).click();
  const platformArticle = page.getByRole("link", { name: "Build AI into the platform, not around it" });
  await expect(platformArticle).toBeVisible();
  await platformArticle.click();
  await expect(page).toHaveURL(/\/blog\/the-platform-as-a-harness\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Build AI into the platform, not around it");
  const articleImages = page.locator(".insight-prose img");
  await expect(articleImages).toHaveCount(4);
  for (const image of await articleImages.all()) await expect(image).toHaveJSProperty("naturalWidth", 1080);
  await page.getByRole("button", { name: "Copy Markdown" }).click();
  await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
  const platformMarkdown = await page.evaluate(() => window.__copiedMarkdown);
  expect(platformMarkdown).toContain("# Build AI into the platform, not around it");
  expect(platformMarkdown).toContain("https://pli-poc.github.io/charge-weave/blog/assets/the-platform-as-a-harness/shared-harness.png");
  await page.getByRole("button", { name: "Charging operations" }).click();
  await page.getByRole("link", { name: /A charging network is an operating business/ }).click();
  await expect(page).toHaveURL(/\/blog\/operating-the-whole-charging-journey\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("A charging network is an operating business, not a map of sockets");
  await expect(page.locator(".insight-prose h2").first()).toHaveText("Connect the physical and commercial views");
  await expect(page.locator(".insight-prose img").first()).toHaveJSProperty("naturalWidth", 1440);
  await page.getByRole("button", { name: "Copy Markdown" }).click();
  await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
  const copied = await page.evaluate(() => window.__copiedMarkdown);
  expect(copied).toContain("# A charging network is an operating business, not a map of sockets");
  expect(copied).toContain("## Preserve evidence as the work moves");
  expect(copied).toContain("https://pli-poc.github.io/charge-weave/blog/assets/operating-the-whole-charging-journey/operating-journey.png");
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("A charging network is an operating business, not a map of sockets");
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
