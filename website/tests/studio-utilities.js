import { expect } from '@playwright/test';

async function openMoreMenu(page) {
  const menu = page.locator('.studio-tools-menu');
  if (!await menu.evaluate(element => element.open)) {
    await page.getByText('More', { exact: true }).click();
  }
}

export async function openDraftContext(page) {
  const panel = page.locator('details.studio-context-tools');
  if (await panel.evaluate(element => element.open)) return;
  await openMoreMenu(page);
  await page.getByRole('button', { name: 'Draft context and history' }).click();
  await expect(panel).toHaveJSProperty('open', true);
}

export async function closeDraftContext(page) {
  const panel = page.locator('details.studio-context-tools');
  if (await panel.evaluate(element => element.open)) {
    await panel.locator(':scope > summary').click({ force: true });
    await expect(panel).toHaveJSProperty('open', false);
  }
}

export async function openMoreMenuForAction(page, name) {
  await openMoreMenu(page);
  return page.getByRole('button', { name, exact: true });
}
