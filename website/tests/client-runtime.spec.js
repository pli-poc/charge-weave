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
  await page.getByRole("combobox", { name: "Decision", exact: true }).selectOption("approve");
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
  await page.getByRole('combobox', { name: 'Decision', exact: true }).selectOption('reject');
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

test('capture the connected correction journey with checkpoint provenance', async ({ page }, info) => {
  await page.goto('app/');
  const dashboard = page.getByRole('region', { name: 'Correction operations dashboard' });
  await expect(dashboard).toContainText('Awaiting corrected evidence');
  const historicalPanel = page.locator('.dashboard-panel').first();
  await expect(historicalPanel).toBeVisible();
  const historicalBefore = await historicalPanel.innerText();
  await page.screenshot({ path: info.outputPath('correction-dashboard-before.png'), fullPage: true });
  await dashboard.getByRole('button', { name: 'Start demonstration' }).click();
  await page.getByLabel('Decision note').fill('Synthetic evidence checked against the accepted register.');
  await page.getByRole('button', { name: /Validate evidence/ }).click();
  await expect(page.getByRole('heading', { name: 'Approve the billing correction' })).toBeVisible();
  await page.screenshot({ path: info.outputPath('correction-approval.png'), fullPage: true });
  await page.getByText('View process diagram').click();
  await expect(page.locator('.case-graph-node.is-current title')).toContainText('Approve the billing correction');
  await page.getByRole('button', { name: 'Focus current step' }).click();
  const currentNode = page.locator('.case-graph-node.is-current');
  await currentNode.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.case-graph-inspector')).toContainText('Approve the billing correction');
  await page.screenshot({ path: info.outputPath('correction-process.png'), fullPage: true });
  await page.getByRole('combobox', { name: 'Decision', exact: true }).selectOption('approve');
  await page.getByLabel('Decision note').fill('The evidence and calculated amount have been reviewed.');
  await page.getByRole('button', { name: /Record decision/ }).click();
  await expect(page.getByRole('heading', { name: 'Billing adjustment prepared' })).toBeVisible();
  await page.screenshot({ path: info.outputPath('correction-result.png'), fullPage: true });
  if (info.project.name === 'mobile') await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('button', { name: 'Overview', exact: true }).click();
  await expect(dashboard).toContainText('Correction completed');
  await expect(historicalPanel).toHaveText(historicalBefore);
  await page.screenshot({ path: info.outputPath('correction-dashboard-after.png'), fullPage: true });
  await info.attach('scenario-provenance.json', { body: Buffer.from(JSON.stringify({ scenario: 'correction.approval-restore', case: 'CW-BILL-0471', clock: '2026-10-13T08:00:00.000Z', commit: process.env.EXACT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? 'local', checkpoints: ['initial', 'awaitingApproval', 'completed'], basis: 'synthetic CPO CDR; EUR 0.32/kWh tax-inclusive; no fees' }, null, 2)), contentType: 'application/json' });
});

test('dashboard filter opens the same case and preserves scope after approval', async ({ page }, info) => {
  await page.goto('app/');
  const dashboard = page.getByRole('region', { name: 'Correction operations dashboard' });
  await dashboard.getByRole('button', { name: /Waiting for evidence/ }).click();
  await expect(dashboard).toContainText('Active filter: evidence');
  await dashboard.getByRole('button', { name: 'Inspect case' }).click();
  await expect(page.getByText('CW-BILL-0471', { exact: false }).first()).toBeVisible();
  await page.getByLabel('Decision note').fill('Synthetic meter evidence and register have been checked.');
  await page.getByRole('button', { name: /Validate evidence/ }).click();
  await page.getByRole('combobox', { name: 'Decision', exact: true }).selectOption('approve');
  await page.getByLabel('Decision note').fill('Evidence and the correction have been reviewed carefully.');
  await page.getByRole('button', { name: /Record decision/ }).click();
  await expect(page.getByRole('heading', { name: 'Billing adjustment prepared' })).toBeVisible();
  if (info.project.name === 'mobile') await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('button', { name: 'Overview', exact: true }).click();
  await expect(dashboard).toContainText('Active filter: evidence');
  await expect(dashboard).toContainText('No cases match this filter');
  await dashboard.getByRole('button', { name: 'Clear filter' }).click();
  await expect(dashboard).toContainText('Correction completed');
  await page.getByLabel('Correction dashboard view').selectOption('network');
  await expect(dashboard).toContainText('separate historical population');
});
