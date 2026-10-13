const {chromium,expect}=require('@playwright/test');
const fs=require('fs');
const out='artifacts/mobile-review-proof';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.DREAM_CHROMIUM,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const report=[];try{
 for(const [width,height] of [[390,844],[320,568],[844,390]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto((process.env.MOBILE_BASE_URL||'http://127.0.0.1:4300/')+'?art=traveler');await page.locator('#start').click();await page.waitForFunction(()=>window.__DREAM_SESSION__,null,{timeout:60000});
  await page.locator('#auto-hunt').click({button:'right'});await page.locator('#next-target').tap();await page.waitForFunction(()=>window.__DREAM_SESSION__.target);
  await page.locator('#auto-config').evaluate(el=>el.open=!el.open);await page.locator('#auto-config').evaluate(el=>el.open=true);await page.locator('#auto-radius').selectOption('12');await page.locator('#auto-config').evaluate(el=>el.open=true);await page.locator('#auto-priority').selectOption('weakest');
  await expect(page.locator('#auto-potion')).toHaveValue('0');
  await page.locator('#auto-hunt').tap();await expect(page.locator('#auto-hunt')).toHaveAttribute('aria-pressed','true');
  await page.locator('#auto-hunt').tap();await expect(page.locator('#auto-hunt')).toHaveAttribute('aria-pressed','false');
  await page.locator('#auto-config').evaluate(el=>el.open=!el.open);
  await page.locator('#hunt-close').tap();
  const metrics=await page.evaluate(()=>{const q=document.querySelector('.quest').getBoundingClientRect(),t=document.querySelector('#target').getBoundingClientRect(),dock=document.querySelector('.classic-log').getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth,questBottom:q.bottom,dockTop:dock.top,targetOverlap:Math.max(0,Math.min(q.right,t.right)-Math.max(q.left,t.left))*Math.max(0,Math.min(q.bottom,t.bottom)-Math.max(q.top,t.top)),controls:[...document.querySelectorAll('#menu,.actions button,.quest button,.quest summary,.quest select,#auto-hunt')].filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return {id:e.id||e.dataset.intent||e.tagName,width:r.width,height:r.height};})};});
  expect(metrics.overflow).toBe(false);expect(metrics.targetOverlap).toBe(0);expect(metrics.questBottom).toBeLessThan(metrics.dockTop);
  for(const control of metrics.controls){expect(control.height,control.id).toBeGreaterThanOrEqual(44);expect(control.width,control.id).toBeGreaterThanOrEqual(44);}
  expect(errors).toEqual([]);
  await page.screenshot({path:`${out}/mobile-review-${width}.png`});report.push({width,height,...metrics,errors});await context.close();
 }fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
