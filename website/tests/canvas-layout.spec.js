import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WorkspaceStore } from '../../ontology-authoring/src/workspace.js';
import { createHttpService } from '../../ontology-authoring/src/http.js';

async function setup(page, { failFirstWorker = false, delayWorker = false, recordWorker = false } = {}) {
  const store = new WorkspaceStore(':memory:');
  const workspace = store.create({ title: 'Layout', baselineCommit: 'a'.repeat(40), schema: 'MODULE|foundation\nRecord|root|A record.|\nDevice|Record|A device.|peer:Record?\n' });
  const pairingCode = 'synthetic-pairing-code-'.repeat(2);
  const service = createHttpService({ store, token: 'test-token-'.repeat(4), pairingCode, workspaceId: workspace.id, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)) });
  service.listen(0, '127.0.0.1'); await once(service, 'listening');
  await page.addInitScript(({ id, fail, delay, record }) => {
    sessionStorage.setItem(`chargeweave.canvas.v2.${id}.default`, JSON.stringify({ Device: { x: 700, y: 500 }, Record: { x: 0, y: 0 }, HiddenRecord: { x: 1200, y: 200 } }));
    if (fail || delay || record) {
      const OriginalWorker = window.Worker;
      let first = true;
      window.Worker = class extends OriginalWorker {
        constructor(...args) { if (fail && first) { first = false; throw new Error('Synthetic worker startup failure'); } super(...args); }
        postMessage(...args) {
          if (record) window.lastLayoutRequest = args[0];
          if (delay && first) {
            first = false;
            this.addEventListener('message', () => { window.layoutReplyReceived = true; }, { once: true });
            window.releaseLayoutRequest = () => super.postMessage(...args);
          } else super.postMessage(...args);
        }
      };
    }
  }, { id: workspace.id, fail: failFirstWorker, delay: delayWorker, record: recordWorker });
  await page.goto(`http://127.0.0.1:${service.address().port}/charge-weave-app/modelling/`);
  await page.getByLabel('Pairing code').fill(pairingCode);
  await page.getByRole('button', { name: 'Pair local studio' }).click();
  await page.getByLabel('Search model').fill('Device');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByRole('button', { name: 'Device', exact: true }).click();
  return { store, workspace, service };
}

test('explicit layout sends measured card dimensions to the worker', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The desktop canvas provides explicit layout; mobile has a list-first view.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const { store, service } = await setup(page, { recordWorker: true });
  try {
    const canvas = page.getByRole('region', { name: 'Relationships for Device' });
    await expect(canvas).toHaveAttribute('data-layout', 'ready');
    await page.addStyleTag({ content: '.studio-flow .studio-flow-node { width: 320px !important; height: 160px !important; }' });
    await expect.poll(() => canvas.locator('.react-flow__node[data-id="Device"]').evaluate(node => node.offsetWidth)).toBe(320);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await canvas.getByRole('button', { name: 'Focus selected concept' }).click();
    await expect.poll(() => canvas.evaluate(element => {
      const pane = element.querySelector('.react-flow__pane').getBoundingClientRect();
      const node = element.querySelector('.react-flow__node[data-id="Device"]').getBoundingClientRect();
      return Math.max(Math.abs(node.left + node.width / 2 - (pane.left + pane.width / 2)), Math.abs(node.top + node.height / 2 - (pane.top + pane.height / 2)));
    })).toBeLessThan(2);
    await canvas.getByText('Layout', { exact: true }).click();
    await canvas.getByRole('button', { name: 'Arrange visible concepts' }).click();
    const requested = await page.evaluate(() => window.lastLayoutRequest.nodes);
    expect(requested.find(node => node.id === 'Device')).toMatchObject({ width: 320, height: 160 });
    await expect(canvas).toHaveAttribute('data-layout', 'ready');
    const boxes = await canvas.locator('.react-flow__node').evaluateAll(elements => elements.map(element => {
      const rect = element.getBoundingClientRect(); return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
    }));
    expect(boxes.length).toBe(2);
    expect(boxes[0].right <= boxes[1].left || boxes[1].right <= boxes[0].left || boxes[0].bottom <= boxes[1].top || boxes[1].bottom <= boxes[0].top).toBe(true);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('explicit layout rearranges visible concepts without changing the model or hidden positions', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The desktop canvas provides explicit layout; mobile has a list-first view.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const { store, workspace, service } = await setup(page);
  try {
    const canvas = page.getByRole('region', { name: 'Relationships for Device' });
    await expect(canvas).toHaveAttribute('data-layout', 'ready');
    await canvas.getByText('Layout', { exact: true }).click();
    await expect(canvas.getByText(/hidden concepts are unchanged/)).toBeVisible();
    await canvas.getByRole('button', { name: 'Arrange visible concepts' }).click();
    await expect(canvas).toHaveAttribute('data-layout', 'ready');
    await expect(canvas.getByText(/Visible concepts arranged locally/)).toBeVisible();
    const positions = await page.evaluate(id => JSON.parse(sessionStorage.getItem(`chargeweave.canvas.v2.${id}.default`)), workspace.id);
    expect(positions.Device).not.toEqual({ x: 700, y: 500 });
    expect(positions.HiddenRecord).toEqual({ x: 1200, y: 200 });
    expect(store.get(workspace.id).revision).toBe(0);
    await expect(page.getByRole('region', { name: 'Workspace status' })).toContainText('View changed locally');
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('dragging while layout is pending preserves the user position', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The desktop canvas provides explicit layout; mobile has a list-first view.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const { store, workspace, service } = await setup(page, { delayWorker: true });
  try {
    const canvas = page.getByRole('region', { name: 'Relationships for Device' });
    await expect(canvas).toHaveAttribute('data-layout', 'ready');
    await canvas.getByRole('button', { name: 'Focus selected concept' }).click();
    await expect(canvas.locator('.react-flow__viewport')).toHaveAttribute('style', /scale\(1\)/);
    await canvas.getByText('Layout', { exact: true }).click();
    await canvas.getByRole('button', { name: 'Arrange visible concepts' }).click();
    await expect(canvas).toHaveAttribute('data-layout', 'pending');
    await canvas.getByText('Layout', { exact: true }).click();
    const node = canvas.locator('.react-flow__node[data-id="Device"]');
    await node.scrollIntoViewIfNeeded();
    const box = await node.boundingBox();
    const target = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('.react-flow__node')?.getAttribute('data-id'), { x: box.x + box.width / 2, y: box.y + box.height / 2 });
    expect(target).toBe('Device');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + 70, box.y + box.height / 2 + 45, { steps: 6 }); await page.mouse.up();
    await expect(canvas.getByText('Layout cancelled because you moved a concept.')).toBeVisible();
    const moved = await node.getAttribute('style');
    await page.evaluate(() => window.releaseLayoutRequest());
    await expect.poll(() => page.evaluate(() => window.layoutReplyReceived)).toBe(true);
    await expect(node).toHaveAttribute('style', moved);
    expect(store.get(workspace.id).revision).toBe(0);
  } finally { await page.close(); await service.shutdown(); store.close(); }
});

test('layout can retry after a worker startup failure', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The desktop canvas provides explicit layout; mobile has a list-first view.');
  const { store, service } = await setup(page, { failFirstWorker: true });
  try {
    const canvas = page.getByRole('region', { name: 'Relationships for Device' });
    await expect(canvas).toHaveAttribute('data-layout', 'unavailable');
    await canvas.getByText('Layout', { exact: true }).click();
    await canvas.getByRole('button', { name: 'Retry automatic layout' }).click();
    await expect(canvas).toHaveAttribute('data-layout', 'ready');
    await expect(canvas.getByRole('button', { name: 'Arrange visible concepts' })).toBeEnabled();
  } finally { await page.close(); await service.shutdown(); store.close(); }
});
