const {chromium,expect}=require('@playwright/test');
const fs=require('node:fs');
(async()=>{
 const b=await chromium.launch({headless:true,executablePath:process.env.DREAM_CHROMIUM||'C:/Users/JUN/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try {
  const p=await b.newPage({viewport:{width:1440,height:900}}),errors=[];p.on('pageerror',e=>errors.push(String(e)));
  await p.goto('http://127.0.0.1:4300/');await p.locator('#start').click();await p.waitForFunction(()=>window.__DREAM_SESSION__);
  await p.locator('#sign-journey').click();await expect(p.locator('#panel-content')).toContainText('모험 안내');await p.locator('#panel-close').click();
  await p.locator('#sign-equipment').click();await expect(p.locator('#panel-content')).toContainText('장비와 소지품');await p.locator('#panel-close').click();
  await p.screenshot({path:'artifacts/Dungeon-zero-0.2-town.png'});
  await p.locator('#hunt-guide').click();await p.locator('.combat-number.damage').first().waitFor({timeout:60000});
  await p.locator('[data-intent=skill]').click();await expect(p.locator('[data-intent=skill]')).toHaveClass(/cooling/);await p.screenshot({path:'artifacts/Dungeon-zero-0.2-combat.png'});
  await p.waitForFunction(()=>window.__DREAM_SESSION__.state.player.kills>=1,{timeout:30000});await p.locator('#hunt-guide').click();await p.waitForFunction(()=>window.__DREAM_SESSION__.state.player.kills>=2,{timeout:60000});
  await expect(p.locator('#log-lines')).toContainText('처치 · 경험치 +30');await expect(p.locator('#log-lines')).toContainText('레벨 2 달성');await expect(p.locator('#xp-caption')).toContainText('EXP');
  await p.locator('[data-intent=recall]').click();await expect(p.locator('.chapter')).toContainText('안전 지역');
  await p.setViewportSize({width:390,height:844});await p.screenshot({path:'artifacts/Dungeon-zero-0.2-mobile.png'});expect(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);expect(errors).toEqual([]);
  const report={version:'0.2.0',errors,checks:['town help and equipment signs','damage numbers','skill cooldown','loot and level logs together','XP counter','safe zone label','mobile overflow none']};fs.writeFileSync('docs/update-0.2-verification.json',JSON.stringify(report,null,2));console.log(report);
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
