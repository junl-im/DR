// Real PC/mobile WebGL proof for quest travel, repeat-click UI, hotbar feedback,
// game scrollbar skin and bounded wheel camera zoom.
const {chromium,expect}=require('@playwright/test');
const fs=require('node:fs');
const out='artifacts/gameplay-polish-proof';fs.mkdirSync(out,{recursive:true});
const base=process.env.GAMEPLAY_BASE_URL||'http://127.0.0.1:4300/';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 const report={base,viewports:[],error:null};
 try{
  for(const width of [1440,390]){
   const mobile=width<500;
   const context=await browser.newContext({viewport:{width,height:mobile?844:900},hasTouch:mobile,isMobile:mobile});
   const page=await context.newPage();const errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   const result={width,errors};
   try{
    await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});
    await page.locator('#start').click();
    await page.waitForFunction(()=>window.__DREAM_SESSION__&&typeof window.__DREAM_CAMERA_ZOOM__==='function',null,{timeout:90000});
    const initial=await page.evaluate(()=>({x:window.__DREAM_SESSION__.state.player.x,z:window.__DREAM_SESSION__.state.player.z,mobs:window.__DREAM_SESSION__.mobs.length}));
    expect(initial.mobs).toBe(18);
    for(const selector of ['#inventory','#estate','#menu']){
      await page.locator(selector).click();
      await expect(page.locator('#panel')).toBeVisible();
      await page.locator(selector).click();
      await expect(page.locator('#panel')).toBeHidden();
    }
    await page.locator('[data-intent="potion"]').click();
    await expect(page.locator('[data-intent="potion"]')).toHaveClass(/slot-activated/);
    result.skin=await page.locator('#panel').evaluate(el=>({
      width:getComputedStyle(el).scrollbarWidth,
      color:getComputedStyle(el).scrollbarColor
    }));
    expect(result.skin.width).toBe('none');
    await page.locator('#menu').click();await expect(page.locator('.game-scrollbar[data-scroll-for=panel]')).toBeVisible();
    const scrollbar=await page.locator('.game-scrollbar[data-scroll-for=panel]').evaluate(el=>({width:getComputedStyle(el).width,thumb:getComputedStyle(el.firstElementChild).backgroundImage}));
    expect(scrollbar.width).toBe('8px');expect(scrollbar.thumb).toContain('linear-gradient');result.skin.paint=scrollbar;await page.locator('#menu').click();

    const zoom=await page.locator('#game').evaluate(canvas=>{
      const before=window.__DREAM_CAMERA_ZOOM__();
      const ev=new WheelEvent('wheel',{deltaY:180,bubbles:true,cancelable:true});
      canvas.dispatchEvent(ev);
      return {before,after:window.__DREAM_CAMERA_ZOOM__(),prevented:ev.defaultPrevented};
    });
    expect(zoom.prevented).toBe(true);
    expect(zoom.after).toBeGreaterThan(zoom.before);
    result.zoom=zoom;

    // No shortcuts: click the real in-game quest journal / auto travel.
    await page.locator('#quest-mini').click();
    await expect(page.locator('#panel')).toBeVisible();
    await page.locator('#help-quest-target').click();
    await expect(page.locator('#panel')).toBeHidden();
    await page.waitForFunction(({x,z})=>{
      const p=window.__DREAM_SESSION__.state.player;
      return Math.hypot(p.x-x,p.z-z)>2;
    },{x:initial.x,z:initial.z},{timeout:16000});
    await page.waitForFunction(()=>window.__DREAM_SESSION__.state.player.quest.progress>=1,null,{timeout:42000});
    result.quest=await page.evaluate(()=>({
      quest:{...window.__DREAM_SESSION__.state.player.quest},
      player:{x:window.__DREAM_SESSION__.state.player.x,z:window.__DREAM_SESSION__.state.player.z},
      kills:window.__DREAM_SESSION__.state.player.kills,
      mobCount:window.__DREAM_SESSION__.mobs.length
    }));
    expect(result.quest.quest.progress).toBeGreaterThanOrEqual(1);
    expect(result.quest.kills).toBeGreaterThanOrEqual(1);
    await page.screenshot({path:out+'/'+(mobile?'mobile':'desktop')+'-quest-and-hud.png',fullPage:true});
    expect(errors).toEqual([]);
    result.passed=true;
   }catch(e){result.error=String(e);report.error=String(e);throw e;}
   finally{report.viewports.push(result);await context.close();}
  }
  console.log('REAL GAMEPLAY POLISH VERIFIED: desktop & mobile; quest kills, toggles, scroll skin, slot flash, zoom');
 }finally{
  fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
  await browser.close();
 }
})().catch(err=>{console.error(err);process.exitCode=1});
