import { test, expect } from '@playwright/test';
import { copyFile } from 'node:fs/promises';

test('record guided correction presentation', async ({ browser }, info) => {
  test.skip(info.project.name !== 'desktop', 'Desktop presentation only');
  test.setTimeout(120000);
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: info.outputDir, size: { width: 1440, height: 900 } } });
  const page = await context.newPage();
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const cursor = document.createElement('div');
      cursor.style.cssText = 'position:fixed;z-index:2147483647;pointer-events:none;width:18px;height:18px;border:3px solid white;background:#0b1821;border-radius:50%;box-shadow:0 0 0 3px #54d5ac;left:-40px;top:-40px;transform:translate(-50%,-50%)';
      document.body.appendChild(cursor);
      document.addEventListener('mousemove', e => { cursor.style.left=e.clientX+'px'; cursor.style.top=e.clientY+'px'; });
      document.addEventListener('mousedown', () => { cursor.style.background='#54d5ac'; });
      document.addEventListener('mouseup', () => { cursor.style.background='#0b1821'; });
    });
  });
  const moveClick = async locator => { await locator.scrollIntoViewIfNeeded(); const b=await locator.boundingBox(); await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:25}); await page.waitForTimeout(400); await page.mouse.click(b.x+b.width/2,b.y+b.height/2); };
  const smoothTo = async locator => { await locator.evaluate(e=>e.scrollIntoView({behavior:'smooth',block:'center'})); await page.waitForTimeout(1500); };
  try {
    await page.goto('http://127.0.0.1:4173/charge-weave-app/app/');
    const dashboard=page.getByRole('region',{name:'Correction operations dashboard'});
    await expect(dashboard).toContainText('13 CASES');
    await page.waitForTimeout(5500);
    await moveClick(dashboard.getByRole('button',{name:'Start demonstration'}));
    await page.getByLabel('Decision note').fill('Synthetic evidence checked against the accepted register.');
    await moveClick(page.getByRole('button',{name:/Validate evidence/}));
    await expect(page.getByRole('heading',{name:'Approve the billing correction'})).toBeVisible();
    await smoothTo(page.locator('.process-overview'));
    await page.waitForTimeout(3000);
    const review=page.locator('.process-overview-step').filter({hasText:'Review'});
    await moveClick(review.locator('summary'));
    await expect(review.getByRole('list',{name:'Routes from Approve the billing correction'})).toContainText('Deadline expired');
    await page.waitForTimeout(4500);
    await moveClick(review.locator('summary'));
    await smoothTo(page.getByText('Billing impact',{exact:true}));
    await expect(page.getByText('Billing impact',{exact:true}).locator('..')).toContainText('3,39');
    await page.waitForTimeout(6500);
    await page.getByRole('combobox',{name:'Decision',exact:true}).selectOption('approve');
    await page.getByLabel('Decision note').fill('Evidence and calculated amount reviewed.');
    await moveClick(page.getByRole('button',{name:/Record decision/}));
    await expect(page.getByRole('heading',{name:'Billing adjustment prepared'})).toBeVisible();
    await page.waitForTimeout(2000);
    await moveClick(page.getByRole('button',{name:'Overview',exact:true}));
    await expect(dashboard).toContainText('Correction completed');
    await page.waitForTimeout(4000);
  } finally {
    const video=page.video(); await context.close();
    if(video) await copyFile(await video.path(),info.outputPath('guided-correction.webm'));
  }
});
