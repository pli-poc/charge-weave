import { test, expect } from '@playwright/test';
import { copyFile } from 'node:fs/promises';

test('record security ontology concepts', async ({ browser }, info) => {
 test.skip(info.project.name !== 'desktop'); test.setTimeout(120000);
 const context=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:info.outputDir,size:{width:1440,height:900}}}); const page=await context.newPage();
 await page.addInitScript(()=>document.addEventListener('DOMContentLoaded',()=>{const p=document.createElement('div');p.style.cssText='position:fixed;z-index:2147483647;pointer-events:none;width:18px;height:18px;border:3px solid white;background:#0b1821;border-radius:50%;box-shadow:0 0 0 3px #54d5ac;left:-40px;top:-40px;transform:translate(-50%,-50%)';document.body.appendChild(p);document.addEventListener('mousemove',e=>{p.style.left=e.clientX+'px';p.style.top=e.clientY+'px'});document.addEventListener('mousedown',()=>p.style.background='#54d5ac');document.addEventListener('mouseup',()=>p.style.background='#0b1821')}));
 const click=async loc=>{await loc.scrollIntoViewIfNeeded();const b=await loc.boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:22});await page.waitForTimeout(350);await page.mouse.click(b.x+b.width/2,b.y+b.height/2)};
 const choose=async(name,pattern,title)=>{const search=page.getByRole('textbox',{name:'Search definitions'});await click(search);await search.fill(name);await click(page.locator('.definition-list').getByRole('button',{name:pattern}));await expect(page.locator('.selected-class-title h2')).toHaveText(title)};
 try {
 await page.goto('http://127.0.0.1:4173/charge-weave-app/ontology/?class=Principal');await expect(page.locator('.selected-class-title h2')).toHaveText('Principal');await page.waitForTimeout(5000);
 await choose('AccessGrant',/^Access Grant/,'Access Grant');await page.waitForTimeout(5500);
 await choose('AccessDecision',/^Access Decision/,'Access Decision');await page.waitForTimeout(5500);
 await choose('AuditEntry',/^Audit Entry/,'Audit Entry');await page.waitForTimeout(6500);
 await click(page.getByRole('button',{name:'Fields',exact:true}));await page.waitForTimeout(6000);
 } finally {const video=page.video();await context.close();if(video)await copyFile(await video.path(),info.outputPath('security-ontology.webm'));}
});
