import { test, expect } from "@playwright/test";
async function openTask(page) {
  await page.goto("app/#work");
  await page
    .getByRole("button", { name: /Review corrected meter reading/ })
    .click();
}
test("local command is validated, saved and resumed without business network calls", async ({
  page,
}, info) => {
  const errors = [],
    external = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (!r.url().startsWith("http://127.0.0.1")) external.push(r.url());
  });
  await openTask(page);
  await page
    .getByLabel("Decision note")
    .fill("Signed partner evidence checked against the accepted register.");
  await page.getByLabel("Evidence reference").fill("EV-0000-0000");
  await page.getByRole("button", { name: /Validate evidence/ }).click();
  await expect(page.locator("#work-form-error")).toContainText("No verified");
  await page.getByLabel("Evidence reference").fill("EV-2026-4481");
  await page.getByRole("button", { name: /Validate evidence/ }).click();
  await expect(page.getByRole("heading", { name: "Approve the billing correction" })).toBeVisible();
  await expect(page.locator(".workspace-storage")).toContainText("Saved on this device");
  await page.reload();
  await page.getByRole("button", { name: /Review corrected meter reading/ }).click();
  await expect(page.getByRole("heading", { name: "Approve the billing correction" })).toBeVisible();
  await page.getByLabel("Decision", { exact: true }).selectOption("approve");
  await page.getByLabel("Decision note").fill("The evidence and calculated amount have been reviewed.");
  await page.getByRole("button", { name: /Record decision/ }).click();
  await expect(page.getByRole("heading", { name: "Billing adjustment prepared" })).toBeVisible();
  await expect(page.locator(".workspace-storage")).toContainText("Saved on this device");
  await page
    .getByRole("button", { name: "Save workspace", exact: true })
    .click();
  await expect(page.locator(".workspace-storage")).toContainText(
    "Saved on this device",
  );
  await page.reload();
  await page
    .getByRole("button", { name: /Review corrected meter reading/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Billing adjustment prepared" }),
  ).toBeVisible();
  await expect(page.locator(".workspace-storage")).toContainText(
    "Saved workspace restored",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto("developer/local/");
  await expect(page.getByTestId("saved-flow-state")).toHaveText("completed");
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
  await page.screenshot({
    path: info.outputPath("local-workspace.png"),
    fullPage: true,
  });
});

test('approval rejection and deadline escalation remain read-only after reload', async ({ page }) => {
  async function prepare() {
    await openTask(page);
    await page.getByLabel('Decision note').fill('Synthetic evidence checked against the accepted register.');
    await page.getByRole('button', { name: /Validate evidence/ }).click();
    await expect(page.getByRole('heading', { name: 'Approve the billing correction' })).toBeVisible();
  }
  await prepare();
  await page.getByLabel('Decision', { exact: true }).selectOption('reject');
  await page.getByLabel('Decision note').fill('The proposed evidence does not support this correction.');
  await page.getByRole('button', { name: /Record decision/ }).click();
  await expect(page.getByRole('heading', { name: 'No correction issued' })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: /Review corrected meter reading/ }).click();
  await expect(page.getByRole('heading', { name: 'No correction issued' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset workspace' }).click();
  await prepare();
  await page.getByText('Demonstrate deadline escalation').click();
  await page.getByRole('button', { name: 'Advance to deadline' }).click();
  await expect(page.getByRole('heading', { name: 'Escalated to manual review' })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: /Review corrected meter reading/ }).click();
  await expect(page.getByRole('heading', { name: 'Escalated to manual review' })).toBeVisible();
});
