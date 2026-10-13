async function openHuntSettings(page){
 if(await page.locator('#panel').isVisible())await page.locator('#panel-close').click();
 await page.locator('#hunt-config-toggle').click();
 await page.locator('.quest.hunt-settings-open').waitFor({state:'visible',timeout:6000});
}
const {chromium,expect}=require('@playwright/test'),fs=require('fs');
(async()=>{const b=await chromium.launch({headless:true,executablePath:process.env.DREAM_CHROMIUM||'C:/Users/JUN/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
const p=await b.newPage({viewport:{width:1500,height:850}}),errors=[],bad=[];p.on('pageerror',e=>errors.push(String(e)));p.on('response',r=>{if(r.status()>=400)bad.push([r.status(),r.url()]);});
await p.goto('http://127.0.0.1:4300/art-lab.html');await p.waitForFunction(()=>window.__ART_LAB__?.ready,undefined,{timeout:60000});await p.screenshot({path:'artifacts/Dungeon-zero-V3-character-comparison.png'});const models=await p.evaluate(()=>window.__ART_LAB__);
await p.locator('#animation').selectOption('move');await p.waitForTimeout(500);await p.screenshot({path:'artifacts/Dungeon-zero-V3-character-run.png'});await p.locator('#animation').selectOption('attack');await p.waitForTimeout(150);await p.screenshot({path:'artifacts/Dungeon-zero-V3-character-attack.png'});
await p.goto('http://127.0.0.1:4300/?art=knight');await expect(p.locator('input[name=character]')).toHaveCount(3);await p.locator('#start').click();await p.waitForFunction(()=>window.__DREAM_SESSION__);await p.waitForTimeout(1500);await p.screenshot({path:'artifacts/Dungeon-zero-V3-knight-town.png'});await openHuntSettings(p);await p.locator('#hunt-guide').click();await p.waitForFunction(()=>window.__DREAM_SESSION__.state.player.kills>=1,undefined,{timeout:60000});await p.screenshot({path:'artifacts/Dungeon-zero-V3-knight-combat.png'});
await p.locator('[data-intent=recall]').click();await p.setViewportSize({width:390,height:844});expect(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);await p.screenshot({path:'artifacts/Dungeon-zero-V3-knight-mobile.png'});expect(errors).toEqual([]);expect(bad).toEqual([]);
const report={models,errors,bad,checks:['four actual GLB models rendered in shared lighting comparison','Idle/Run/Attack selected and captured','knight trial enters actual game','actual hunt kill with existing combat','mobile no horizontal overflow'],limits:['no device performance target measured','outfits are appearance trials, not earned armor','no attached weapon model yet']};fs.writeFileSync('docs/research/v3-character/browser-verification.json',JSON.stringify(report,null,2));console.log(report);
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});

