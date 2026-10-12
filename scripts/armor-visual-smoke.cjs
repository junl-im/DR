const {chromium} = require('@playwright/test');
const fs = require('node:fs');
const out = 'artifacts/armor-visual-proof';
fs.mkdirSync(out,{recursive:true});
(async()=>{
  const browser=await chromium.launch({
    headless:true,
    args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'],
  });
  try {
    const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
    const errors=[],bad=[];
    page.on('pageerror',e=>errors.push(String(e)));
    page.on('response',r=>{if(r.status()>=400)bad.push([r.status(),r.url()]);});
    await page.goto('http://127.0.0.1:4300/art-lab.html',{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForFunction(()=>window.__ART_LAB__?.ready===true&&window.__ARMOR_LAB__?.ready===true,null,{timeout:120000});
    await page.screenshot({path:out+'/v3-initial-desktop.png',fullPage:true});
    await page.locator('[data-armor-slot=helmet]').selectOption('knight');
    await page.locator('[data-armor-slot=body]').selectOption('ranger');
    await page.locator('[data-armor-slot=gloves]').selectOption('knight');
    await page.locator('[data-armor-slot=boots]').selectOption('ranger');
    const selection=await page.evaluate(()=>window.__ARMOR_LAB__?.read());
    if(JSON.stringify(selection)!==JSON.stringify({helmet:'knight',body:'ranger',gloves:'knight',boots:'ranger'}))
      throw new Error('Armor controller/UI mismatch '+JSON.stringify(selection));
    await page.screenshot({path:out+'/v3-mixed-armor-desktop.png',fullPage:true});
    await page.locator('#animation').selectOption('attack');
    await page.waitForTimeout(250);
    await page.screenshot({path:out+'/v3-mixed-armor-attack.png',fullPage:true});
    await page.setViewportSize({width:390,height:844});
    await page.waitForTimeout(200);
    if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error('Mobile horizontal overflow');
    await page.screenshot({path:out+'/v3-mixed-armor-mobile.png',fullPage:true});

    // Verify real game-screen equipment and persistence, not just the lab.
    const game=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
    game.on('pageerror',e=>errors.push('game '+String(e)));
    game.on('response',r=>{if(r.status()>=400)bad.push([r.status(),r.url()]);});
    await game.goto('http://127.0.0.1:4300/?art=traveler',{waitUntil:'domcontentloaded',timeout:60000});
    await game.locator('#start').click();
    await game.waitForFunction(()=>window.__DREAM_SESSION__?.state?.player?.armor!==undefined,null,{timeout:90000});
    await game.evaluate(()=>{
      const p=window.__DREAM_SESSION__.state.player;
      p.gold=40;p.wood=5;p.armor.fragments=4;
    });
    await game.locator('#inventory').click();
    await game.locator('[data-craft-armor="body:1"]').click();
    await game.locator('[data-equip-armor="body:1"]').click();
    await game.waitForFunction(()=>window.__DREAM_SESSION__?.state?.player?.armor?.equipped?.body===1);
    await game.locator('#panel-close').click();
    await game.waitForTimeout(1200);
    await game.screenshot({path:out+'/game-crafted-armor-desktop.png',fullPage:true});
    await game.locator('#menu').click();
    await game.locator('#save-now').click();
    await game.waitForTimeout(450);
    await game.reload({waitUntil:'domcontentloaded'});
    await game.locator('#continue').click();
    await game.waitForFunction(()=>window.__DREAM_SESSION__?.state?.player?.armor?.equipped?.body===1,null,{timeout:90000});
    if(await game.evaluate(()=>window.__DREAM_SESSION__.state.player.armor.owned.body)!==1)throw new Error('Reloaded armor ownership lost');
    await game.setViewportSize({width:390,height:844});
    await game.waitForTimeout(1200);
    if(await game.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error('Mobile game horizontal overflow');
    await game.screenshot({path:out+'/game-saved-armor-mobile.png',fullPage:true});
    // Actual local combat progression: 3 qualifying slime kills, each through
    // target/skill/damage, then claim once at the nearby village quest board.
    await game.evaluate(()=>{
      const s=window.__DREAM_SESSION__;
      for(const idx of [0,3,6]){
        const m=s.mobs[idx];
        m.x=s.state.player.x+1;m.z=s.state.player.z;m.hp=1;
        s.state.player.mp=60;
        s.dispatch({type:'target',id:m.id});
        s.dispatch({type:'skill'});
        for(let j=0;j<81;j++)s.tick(.05);
      }
    });
    await game.waitForFunction(()=>window.__DREAM_SESSION__?.state?.player?.quest?.progress===3);
    await game.locator('#quest-journal').click();
    await game.locator('#quest-claim').click();
    await game.waitForFunction(()=>window.__DREAM_SESSION__?.state?.player?.quest?.stage===1);
    await game.waitForFunction(()=>[...document.querySelectorAll('#log-lines p')].some(node=>node.textContent.includes('마을의 첫 의뢰 완료')));
    const claimEntries=await game.locator('#log-lines p').filter({hasText:'마을의 첫 의뢰 완료'}).count();
    if(claimEntries!==1)throw new Error('Quest reward was logged more than once: '+claimEntries);
    await game.screenshot({path:out+'/game-quest-claimed-mobile.png',fullPage:true});

    // Dungeon visual/progression fixture. The prior 3 village quests are
    // marked claimed as a controlled prerequisite; all dungeon kills/rewards
    // below go through real session combat, save and UI handlers.
    await game.locator('#panel-close').click();
    await game.evaluate(()=>{
      const s=window.__DREAM_SESSION__;
      s.dispatch({type:'recall'});
      s.state.player.quest={stage:3,progress:0};
      s.state.player.mp=60;s.state.player.hp=200;
    });
    await game.locator('#dungeon-journal').click();
    await game.locator('#dungeon-enter').click();
    await game.waitForFunction(()=>window.__DREAM_SESSION__?.state?.player?.dungeon?.inside===true);
    await game.locator('#panel-close').click();
    await game.waitForTimeout(1200);
    await game.screenshot({path:out+'/ruin-entry-mobile.png',fullPage:true});
    const dungeonKill=async id=>{
      await game.evaluate(mobId=>{
        const s=window.__DREAM_SESSION__;
        const mob=s.mobs.find(m=>m.id===mobId);
        if(!mob)throw new Error('Missing dungeon monster '+mobId);
        mob.x=s.state.player.x+1;mob.z=s.state.player.z;mob.hp=1;
        s.state.player.mp=60;s.state.player.hp=200;
        s.dispatch({type:'target',id:mobId});s.dispatch({type:'skill'});
        for(let j=0;j<81;j++)s.tick(.05);
      },id);
    };
    await dungeonKill('dungeon-0-0');
    await game.waitForFunction(()=>window.__DREAM_SESSION__?.state?.player?.dungeon?.kills===1);
    await game.locator('#menu').click();
    await game.locator('#save-now').click();
    await game.reload({waitUntil:'domcontentloaded'});
    await game.locator('#continue').click();
    await game.waitForFunction(()=>window.__DREAM_SESSION__?.state?.player?.dungeon?.inside===true && window.__DREAM_SESSION__?.state?.player?.dungeon?.kills===1,{timeout:90000});
    if(await game.evaluate(()=>window.__DREAM_SESSION__.mobs.some(m=>m.id==='dungeon-0-0')))throw new Error('A defeated dungeon monster respawned after reload');
    await dungeonKill('dungeon-0-1');
    const next=async()=>{
      await game.locator('#dungeon-journal').click();
      await game.locator('#dungeon-next').click();
      await game.locator('#panel-close').click();
    };
    await next();
    for(const id of ['dungeon-1-0','dungeon-1-1'])await dungeonKill(id);
    await next();
    await game.waitForFunction(()=>window.__DREAM_SESSION__?.state?.player?.dungeon?.wave===2);
    await game.screenshot({path:out+'/ruin-boss-mobile.png',fullPage:true});
    await dungeonKill('dungeon-2-0');
    await game.locator('#dungeon-journal').click();
    await game.locator('#dungeon-claim').click();
    await game.waitForFunction(()=>window.__DREAM_SESSION__?.state?.player?.dungeon?.clears===1 && !window.__DREAM_SESSION__?.state?.player?.dungeon?.inside);
    await game.screenshot({path:out+'/ruin-clear-mobile.png',fullPage:true});
    await game.close();
    if(errors.length||bad.length)throw new Error('Browser errors '+JSON.stringify({errors,bad}));
    fs.writeFileSync(out+'/report.json',JSON.stringify({selection,errors,bad,screenshots:10,limit:'Software renderer only; not device FPS or visual design approval'},null,2));
    console.log('Armor visual smoke success',selection);
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
