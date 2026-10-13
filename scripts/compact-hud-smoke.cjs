const fs=require('fs'),out='artifacts/compact-hud-proof';fs.mkdirSync(out,{recursive:true});
const {chromium,expect}=require('@playwright/test');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.DREAM_CHROMIUM,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 let page;
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(()=>{window.__HOLD_TRACE__=[];for(const type of ['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture','contextmenu','click'])document.addEventListener(type,event=>{window.__HOLD_TRACE__.push({type,t:performance.now(),stamp:event.timeStamp,target:event.target.id,button:event.button,detail:event.detail,primary:event.isPrimary,pointerType:event.pointerType});},true);});
  await page.goto(process.env.COMPACT_BASE_URL||'http://127.0.0.1:4300/');await page.locator('#start').click();await page.waitForFunction(()=>window.__DREAM_SESSION__,null,{timeout:60000});
  const auto=page.locator('#auto-hunt'),box=await auto.boundingBox(),cdp=await context.newCDPSession(page);
  await page.evaluate(()=>window.__HOLD_TRACE__=[]);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2}]});
  await page.waitForTimeout(750);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect(page.locator('.quest')).toHaveClass(/hunt-settings-open/);
  await expect(auto).toHaveAttribute('aria-pressed','false');await expect(page.locator('#auto-radius')).toBeVisible();
  await page.screenshot({path:out+'/compact-settings.png'});await page.locator('#hunt-close').tap();
  await auto.tap();await expect(auto).toHaveAttribute('aria-pressed','true');await auto.tap();await expect(auto).toHaveAttribute('aria-pressed','false');
  await page.locator('#hunt-config-toggle').tap();await expect(page.locator('.quest')).toHaveClass(/hunt-settings-open/);
  await page.locator('#hunt-config-toggle').tap();await expect(page.locator('.quest')).not.toHaveClass(/hunt-settings-open/);
  await page.locator('#inventory').tap();await expect(page.locator('#panel')).toBeVisible();expect(await page.locator('#panel a[target="_blank"]').count()).toBe(0);
  await page.screenshot({path:out+'/compact-inventory.png'});expect(errors).toEqual([]);
  fs.writeFileSync(out+'/hold-report.json',JSON.stringify({holdMs:750,trace:await page.evaluate(()=>window.__HOLD_TRACE__),errors},null,2));console.log('Actual mobile hold/release, following tap, gear toggle and inventory: PASS');
 }catch(error){if(page){const diagnosis=await page.evaluate(()=>{const b=document.querySelector('#auto-hunt'),r=b?.getBoundingClientRect();return {events:window.__HOLD_TRACE__,box:r?.toJSON(),hit:r&&document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.outerHTML,quest:document.querySelector('.quest')?.className,on:b?.getAttribute('aria-pressed')};});fs.writeFileSync(out+'/hold-failure.json',JSON.stringify(diagnosis,null,2));console.error('HOLD DIAGNOSIS',JSON.stringify(diagnosis));await page.screenshot({path:out+'/hold-failure.png'});}throw error;}finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
