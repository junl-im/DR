async function openHuntSettings(page){
 if(await page.locator('#panel').isVisible())await page.locator('#panel-close').click();
 await page.locator('#hunt-config-toggle').click();
 await page.locator('.quest.hunt-settings-open').waitFor({state:'visible',timeout:6000});
}
const {chromium,expect}=require('@playwright/test');
const fs=require('fs');
const out='artifacts/quest-hunt-proof';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.DREAM_CHROMIUM,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});const reports=[];
 try{for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:width===390?844:900},hasTouch:width===390,isMobile:width===390});
  const page=await context.newPage(),errors=[],bad=[];page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)bad.push([r.status(),r.url()]);});
  await page.goto('http://127.0.0.1:4300/?art=traveler');await page.locator('#start').click();await page.waitForFunction(()=>window.__DREAM_SESSION__,null,{timeout:60000});
  // Controlled fixture: final objective kill; all damage/rewards still run through real combat.
  await page.evaluate(()=>{const s=window.__DREAM_SESSION__,m=s.mobs.find(m=>m.npcId===20001);for(const other of s.mobs)other.hp=0;m.hp=1;Object.assign(s.state.player,{x:m.x-1,z:m.z,hp:100,quest:{stage:0,progress:2}});s.stopMovement();});
  await openHuntSettings(page);await page.locator('#quest-target').click();expect(await page.evaluate(()=>{const s=window.__DREAM_SESSION__;return s.mobs.find(m=>m.id===s.target)?.npcId;})).toBe(20001);
  await page.locator('#auto-config').evaluate(el=>el.open=!el.open);await page.locator('#auto-config').evaluate(el=>el.open=true);await page.locator('#auto-priority').selectOption('quest');await expect(page.locator('#auto-potion')).toHaveValue('0');
  await page.locator('#auto-hunt').click();await page.waitForFunction(()=>window.__DREAM_SESSION__.state.player.quest.progress===3,null,{timeout:20000}).catch(async e=>{console.log(await page.evaluate(()=>({player:window.__DREAM_SESSION__.state.player,target:window.__DREAM_SESSION__.target,attacking:window.__DREAM_SESSION__.attacking,status:document.querySelector('#auto-status').textContent,message:window.__DREAM_SESSION__.message})));await page.screenshot({path:out+'/failure.png'});throw e;});
  await expect(page.locator('#auto-hunt')).toHaveAttribute('aria-pressed','false');await expect(page.locator('#auto-status')).toContainText('의뢰 목표 달성');
  const before=await page.evaluate(()=>structuredClone(window.__DREAM_SESSION__.state.player));expect(before.quest.stage).toBe(0);expect(before.kills).toBe(1);
  await page.locator('#auto-config').evaluate(el=>el.open=!el.open);await page.locator('.quest').evaluate(e=>e.scrollTop=e.scrollHeight);
  await page.screenshot({path:`${out}/quest-ready-${width}.png`});
  await page.locator('[data-intent=recall]').click();await page.locator('#hunt-close').click();await page.locator('#quest-mini').click();await expect(page.locator('#quest-claim')).toBeEnabled();await page.locator('#quest-claim').click();
  const claimed=await page.evaluate(()=>structuredClone(window.__DREAM_SESSION__.state.player));expect(claimed.quest).toEqual({stage:1,progress:0});expect(claimed.gold).toBe(before.gold+28);expect(claimed.potions).toBe(before.potions+1);
  await page.screenshot({path:`${out}/quest-claimed-${width}.png`});await page.evaluate(()=>window.__DREAM_SAVE__());await page.reload();await page.locator('#continue').click();await page.waitForFunction(()=>window.__DREAM_SESSION__);
  const restored=await page.evaluate(()=>structuredClone(window.__DREAM_SESSION__.state.player));expect(restored.quest).toEqual(claimed.quest);expect(restored.gold).toBe(claimed.gold);await expect(page.locator('#auto-hunt')).toHaveAttribute('aria-pressed','false');
  await openHuntSettings(page);await page.locator('#auto-hunt').click();await expect(page.locator('#auto-hunt')).toHaveAttribute('aria-pressed','true');await page.locator('#hunt-guide').click();await expect(page.locator('#auto-hunt')).toHaveAttribute('aria-pressed','false');
  expect(errors).toEqual([]);expect(bad).toEqual([]);reports.push({width,before:{quest:before.quest,kills:before.kills,gold:before.gold},claimed:{quest:claimed.quest,gold:claimed.gold},restored:{quest:restored.quest,gold:restored.gold},errors,bad});await context.close();
 }fs.writeFileSync(out+'/report.json',JSON.stringify({reports,limits:'Controlled final-kill fixture; software Chromium, not physical Android performance.'},null,2));console.log(JSON.stringify(reports));}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
