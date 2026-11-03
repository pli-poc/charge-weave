import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

test('switching results panels starts at the beginning of the selected panel', async ({ page, isMobile }) => {
  if (isMobile) await page.setViewportSize({ width: 320, height: 800 });
  else await page.setViewportSize({ width: 1280, height: 800 });
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Results panel position', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  for (let revision = 0; revision < 10; revision++) store.apply({ workspaceId: workspace.id, actor: 'test', operationId: `edit-${revision}`, expectedRevision: revision, commands: [{ type: 'class.describe', name: 'Record', definition: `Record ${revision}.` }] });
  const output = Array.from({ length: 200 }, (_, index) => `Diagnostic ${index}`).join('\n');
  const validationRunner = async (target, input, job) => {
    target.startJobStep(job.id, 0, 'tools/example-check.py');
    target.finishJobStep(job.id, 0, 'failed', output);
    target.updateJob(job.id, 'failed', output);
  };
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, repository: '.', validationRunner, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await page.getByRole('button', { name: 'Check draft', exact: true }).click();
    await expect(page.getByText(/Latest structural operation: failed/)).toBeVisible();
    if (!isMobile) {
      const [actions, controls] = await Promise.all([page.locator('.studio-primary-actions').boundingBox(), page.locator('.studio-panel-controls').boundingBox()]);
      expect(Math.abs(actions.y - controls.y)).toBeLessThan(10);
      expect(actions.x + actions.width).toBeLessThanOrEqual(controls.x + 1);
    }
    if (isMobile) await page.getByRole('navigation', { name: 'Workspace sections' }).getByRole('button', { name: 'Results' }).click();
    const results = page.getByRole('region', { name: 'Workspace results' });
    await results.getByRole('button', { name: 'Activity', exact: true }).click();
    const content = results.getByRole('region', { name: 'Results content' });
    await expect(results.getByText('Showing the latest 10 of 10 loaded workspace events. The service retains up to 100 in this view.')).toBeVisible();
    await content.focus();
    await content.press('End');
    await expect.poll(() => content.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
    await results.getByRole('button', { name: 'Output', exact: true }).click();
    await expect.poll(() => content.evaluate(element => element.scrollTop)).toBe(0);
    await expect(results.getByRole('heading', { name: 'Job output' })).toBeInViewport();
    expect(store.get(workspace.id).revision).toBe(10);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('desktop workbench fits the viewport without the status bar covering workspace content', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop viewport shell geometry is not a compact-layout requirement.');
  await page.setViewportSize({ width: 1440, height: 1000 });
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Viewport shell', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, repository: '.', staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
    await page.getByLabel('Pairing code').fill(pairingCode);
    await page.getByRole('button', { name: 'Pair local studio' }).click();
    await expect(page.getByRole('region', { name: 'Workspace status' })).toBeVisible();
    const geometry = await page.evaluate(() => {
      const shell = document.querySelector('.modelling-studio');
      const workspace = document.querySelector('.studio-workspace');
      const status = document.querySelector('.studio-status-bar');
      const bounds = element => { const rect = element.getBoundingClientRect(); return { top: rect.top, bottom: rect.bottom, height: rect.height }; };
      return { viewport: window.innerHeight, document: document.documentElement.scrollHeight, shell: bounds(shell), workspace: bounds(workspace), status: bounds(status) };
    });
    expect(geometry.shell.top).toBe(0);
    expect(geometry.shell.bottom).toBeLessThanOrEqual(geometry.viewport);
    expect(geometry.document).toBeLessThanOrEqual(geometry.viewport + 1);
    expect(geometry.workspace.bottom).toBeLessThanOrEqual(geometry.status.top + 1);
    expect(geometry.status.bottom).toBeLessThanOrEqual(geometry.viewport);

    async function expectUtilityFits(menuName, selector) {
      const menu = page.locator('.studio-tools-menu');
      if (!await menu.evaluate(element => element.open)) await page.getByText('More', { exact: true }).click();
      const utility = page.locator(selector);
      await page.getByRole('button', { name: menuName }).click();
      await expect(utility).toHaveJSProperty('open', true);
      const bounds = await utility.evaluate(element => {
        const rect = element.getBoundingClientRect();
        return { position: getComputedStyle(element).position, left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, viewportWidth: innerWidth, viewportHeight: innerHeight, documentHeight: document.documentElement.scrollHeight };
      });
      expect(bounds.position).toBe('fixed');
      expect(bounds.left).toBeGreaterThanOrEqual(0);
      expect(bounds.top).toBeGreaterThanOrEqual(0);
      expect(bounds.right).toBeLessThanOrEqual(bounds.viewportWidth);
      expect(bounds.bottom).toBeLessThanOrEqual(bounds.viewportHeight);
      await utility.locator(':scope > summary').click({ force: true });
      await expect(utility).toHaveJSProperty('open', false);
    }

    await expectUtilityFits('Draft context and history', '.studio-context-tools');
    await expectUtilityFits('Connection and diagnostics', '.studio-connection-tools');
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
