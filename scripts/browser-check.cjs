const {chromium,expect}=require('@playwright/test');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.DREAM_CHROMIUM||'C:/Users/JUN/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try {
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],bad=[],sockets=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)bad.push(`${r.status()} ${r.url()}`)});page.on('websocket',w=>sockets.push(w.url()));
 await page.goto('http://127.0.0.1:4300/');await page.screenshot({path:'artifacts/entry-desktop.png'});await page.locator('#start').click();await page.waitForFunction(()=>window.__DREAM_SESSION__);
 for(let kills=1;kills<=2;kills++){await page.locator('#hunt-guide').click();await page.waitForFunction(n=>window.__DREAM_SESSION__.state.player.kills>=n,kills,{timeout:60000});}
 expect(await page.evaluate(()=>window.__DREAM_SESSION__.state.player.level)).toBe(2);
 await page.locator('[data-intent="recall"]').click();await page.locator('#estate').click();
 for(let i=0;i<4;i++){const old=await page.evaluate(()=>window.__DREAM_SESSION__.state.player.wood);await expect.poll(async()=>{await page.locator('#gather').click();return page.evaluate(()=>window.__DREAM_SESSION__.state.player.wood)},{timeout:10000,intervals:[300]}).toBe(old+3);}
 await page.locator('#garden').click();expect(await page.evaluate(()=>window.__DREAM_SESSION__.state.territory.garden)).toBe(1);await page.locator('#panel-close').click();
 await page.locator('#inventory').click();const gold=await page.evaluate(()=>window.__DREAM_SESSION__.state.player.gold);if(gold>=20){await page.locator('#upgrade').click();expect(await page.evaluate(()=>window.__DREAM_SESSION__.state.player.weapon)).toBe(1);}await page.locator('#panel-close').click();
 await page.evaluate(()=>window.__DREAM_SAVE__());const before=await page.evaluate(()=>window.__DREAM_SESSION__.snapshot());await page.screenshot({path:'artifacts/game-desktop.png'});await page.reload();await page.locator('#continue').click();await page.waitForFunction(()=>window.__DREAM_SESSION__);const after=await page.evaluate(()=>window.__DREAM_SESSION__.snapshot());
 for(const key of ['kills','level','xp','gold','wood','weapon'])expect(after.player[key]).toBe(before.player[key]);expect(after.territory.garden).toBe(1);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'artifacts/game-mobile.png'});const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);expect(overflow).toBe(false);expect(errors).toEqual([]);expect(bad).toEqual([]);expect(sockets).toEqual([]);
 const report={errors,bad,sockets,overflow,before,after,verified:['character','movement','two kills','level up','gather','garden','save/reload','mobile','no game server connection']};fs.writeFileSync('docs/browser-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
