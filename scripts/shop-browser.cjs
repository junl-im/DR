const {chromium,expect}=require('@playwright/test');
const fs=require('fs');
(async()=>{const b=await chromium.launch({headless:true,executablePath:'C:/Users/JUN/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
const p=await b.newPage({viewport:{width:1440,height:900}}),errors=[];p.on('pageerror',e=>errors.push(String(e)));
await p.goto('http://127.0.0.1:4300/');await p.locator('#start').click();await p.waitForFunction(()=>window.__DREAM_SESSION__);
await p.locator('#sign-shop').click();await expect(p.locator('#buy-one')).toBeDisabled();await p.locator('#panel-close').click();
// Earn the actual purchase price through the game's hunting flow.
await p.locator('#hunt-guide').click();await p.waitForFunction(()=>window.__DREAM_SESSION__.state.player.kills>=1,{timeout:60000});
await p.locator('[data-intent=recall]').click();await p.locator('#inventory').click();await p.locator('#open-shop').click();
const before=await p.evaluate(()=>({...window.__DREAM_SESSION__.state.player}));await p.locator('#buy-one').click();
await expect(p.locator('#shop-message')).toContainText('1개 구매');
const after=await p.evaluate(()=>({...window.__DREAM_SESSION__.state.player}));expect(after.gold).toBe(before.gold-8);expect(after.potions).toBe(before.potions+1);
await expect(p.locator('#save-status')).toContainText('기기 저장');await p.screenshot({path:'artifacts/Dungeon-zero-0.3-shop.png'});
await p.reload();await p.locator('#continue').click();await p.waitForFunction(()=>window.__DREAM_SESSION__);const restored=await p.evaluate(()=>({...window.__DREAM_SESSION__.state.player}));expect(restored.gold).toBe(after.gold);expect(restored.potions).toBe(after.potions);
await p.setViewportSize({width:390,height:844});await p.locator('#inventory').click();await p.locator('#open-shop').click();expect(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
await p.screenshot({path:'artifacts/Dungeon-zero-0.3-mobile-shop.png'});expect(errors).toEqual([]);
const report={version:'0.3.0',errors,before,after,restored,checks:['zero-gold purchase disabled','actual hunt reward funds purchase','buy-one costs 8 and grants one potion','IndexedDB reload restores transaction','mobile no horizontal overflow']};fs.writeFileSync('docs/update-0.3-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
