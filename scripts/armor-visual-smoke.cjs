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
    await page.locator('#weapon-visual').check();
    await page.waitForTimeout(1000);
    if(!await page.locator('#weapon-visual').isChecked())throw new Error('Weapon grip preview not enabled');
    await page.screenshot({path:out+'/v3-mixed-armor-weapon-attack-desktop.png',fullPage:true});
    // Freeze a *real* frame of the shared GLB attack clip and inspect sword
    // versus animated palm_R in world space, rather than relying on time 0.
    await page.locator('#grip-model').selectOption('3');
    await page.waitForFunction(()=>{
      const r=window.__POSE_LAB__?.read();
      return r && r.handBone==='palm_R' && r.hilt && r.tip && r.clipDurationSeconds>0;
    },null,{timeout:30000});
    await page.locator('#pose-progress').evaluate(el=>{
      el.value='10';el.dispatchEvent(new Event('input',{bubbles:true}));
    });
    const poseA=await page.evaluate(()=>window.__POSE_LAB__.read());
    await page.locator('#pose-progress').evaluate(el=>{
      el.value='60';el.dispatchEvent(new Event('input',{bubbles:true}));
    });
    const poseB=await page.evaluate(()=>window.__POSE_LAB__.read());
    if(!poseB.frozen || poseB.percent!==60 || !poseB.hand || !poseB.hilt ||
      poseB.bladeLength<0.2 || poseB.bladeLength>2 ||
      !Number.isFinite(poseB.gripGap) || poseB.gripGap>0.02)
      throw new Error('Weapon pose diagnostic failed '+JSON.stringify(poseB));
    const displacement=Math.hypot(...poseB.tip.map((n,i)=>n-poseA.tip[i]));
    if(displacement<0.005)throw new Error('Animation scrub did not move sword tip: '+JSON.stringify({poseA,poseB}));
    await page.screenshot({path:out+'/v3-weapon-attack-frozen-60pc-desktop.png',fullPage:true});
    // Inspect the *same* frozen attack pose from several true camera axes.
    // These are the hand/gauntlet seam close-ups missing from full-body QA.
    await page.locator('#inspect-focus').selectOption('hands');
    await page.locator('#inspect-angle').selectOption('front');
    await page.waitForTimeout(150);
    const cameraFront=await page.evaluate(()=>window.__CAMERA_LAB__.read());
    if(cameraFront.focus!=='hands'||cameraFront.angle!=='front' ||
      Math.hypot(...cameraFront.target.map((v,i)=>v-poseB.hand[i]))>1e-3)
      throw new Error('Front wrist camera not tracking animated hand '+JSON.stringify({cameraFront,poseB}));
    await page.locator('#models').screenshot({path:out+'/v3-hand-front-attack-frozen.png'});
    await page.locator('#inspect-angle').selectOption('side');
    await page.waitForTimeout(150);
    const cameraSide=await page.evaluate(()=>window.__CAMERA_LAB__.read());
    if(cameraSide.position[0]<=cameraSide.target[0])
      throw new Error('Side camera failed to rotate to positive X '+JSON.stringify(cameraSide));
    await page.locator('#models').screenshot({path:out+'/v3-hand-side-attack-frozen.png'});
    await page.locator('#inspect-angle').selectOption('back');
    await page.waitForTimeout(150);
    const cameraBack=await page.evaluate(()=>window.__CAMERA_LAB__.read());
    if(cameraBack.position[2]>=cameraBack.target[2])
      throw new Error('Back camera failed to rotate to negative Z '+JSON.stringify(cameraBack));
    await page.locator('#models').screenshot({path:out+'/v3-hand-back-attack-frozen.png'});
    await page.locator('#inspect-focus').selectOption('feet');
    await page.locator('#inspect-angle').selectOption('side');
    await page.waitForTimeout(150);
    await page.locator('#models').screenshot({path:out+'/v3-boot-side-attack-frozen.png'});
    await page.locator('#inspect-focus').selectOption('head');
    await page.locator('#inspect-angle').selectOption('front');
    await page.waitForTimeout(150);
    await page.locator('#models').screenshot({path:out+'/v3-helmet-front-attack-frozen.png'});
    if(JSON.stringify(await page.evaluate(()=>window.__ARMOR_LAB__.read()))!==JSON.stringify(selection))
      throw new Error('Preview camera unexpectedly mutated four-slot armor selection');
    await page.locator('#inspect-focus').selectOption('full');
    await page.locator('#inspect-angle').selectOption('three-quarter');

    await page.locator('#pose-resume').click();
    if(await page.evaluate(()=>window.__POSE_LAB__.paused))
      throw new Error('Pose resume did not restart animation');

    await page.locator('#animation').selectOption('cast');
    await page.waitForTimeout(250);
    await page.screenshot({path:out+'/v3-mixed-armor-cast-desktop.png',fullPage:true});
    await page.locator('#animation').selectOption('move');
    await page.waitForTimeout(350);
    await page.screenshot({path:out+'/v3-mixed-armor-run-desktop.png',fullPage:true});
    await page.locator('#animation').selectOption('attack');
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
      s.state.player.mp=60;s.state.player.hp=100;
    });
    await game.locator('#dungeon-journal').click();
    await game.locator('#dungeon-enter').click();
    await game.waitForFunction(()=>window.__DREAM_SESSION__?.state?.player?.dungeon?.inside===true);
    await game.locator('#panel-close').click();
    await game.setViewportSize({width:1440,height:900});
    await game.waitForTimeout(850);
    await game.screenshot({path:out+'/ruin-entry-desktop-lit.png',fullPage:true});
    await game.setViewportSize({width:390,height:844});
    await game.waitForTimeout(400);
    await game.screenshot({path:out+'/ruin-entry-mobile.png',fullPage:true});
    const dungeonKill=async id=>{
      await game.evaluate(mobId=>{
        const s=window.__DREAM_SESSION__;
        const mob=s.mobs.find(m=>m.id===mobId);
        if(!mob)throw new Error('Missing dungeon monster '+mobId);
        mob.x=s.state.player.x+1;mob.z=s.state.player.z;mob.hp=1;
        s.state.player.mp=60;s.state.player.hp=100;
        s.dispatch({type:'target',id:mobId});s.dispatch({type:'skill'});
        for(let j=0;j<81;j++)s.tick(.05);
      },id);
    };
    await dungeonKill('dungeon-0-0');
    await game.waitForFunction(()=>window.__DREAM_SESSION__?.state?.player?.dungeon?.kills===1);
    await game.locator('#menu').click();
    await game.locator('#save-now').click();
    // Save is asynchronous. Reloading immediately races the IndexedDB write.
    // Wait for the persisted checkpoint, not an unrelated status label.
    await game.waitForFunction(async()=>{
      const db=await new Promise((resolve,reject)=>{
        const request=indexedDB.open('dream-library-local-v1',1);
        request.onsuccess=()=>resolve(request.result);
        request.onerror=()=>reject(request.error);
      });
      try {
        const saved=await new Promise((resolve,reject)=>{
          const request=db.transaction('saves').objectStore('saves').get('current');
          request.onsuccess=()=>resolve(request.result);
          request.onerror=()=>reject(request.error);
        });
        return saved?.player?.dungeon?.inside===true&&saved.player.dungeon.kills===1;
      }finally{db.close();}
    },null,{timeout:30000,polling:250});
    await game.reload({waitUntil:'domcontentloaded'});
    await game.locator('#continue').click();
    await game.waitForFunction(()=>window.__DREAM_SESSION__?.state?.player?.dungeon?.inside===true && window.__DREAM_SESSION__?.state?.player?.dungeon?.kills===1,null,{timeout:90000});
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
    // Verify both real boss tells are visible and use the right radius.
    await game.evaluate(()=>{
      const s=window.__DREAM_SESSION__,p=s.state.player;
      const boss=s.mobs.find(m=>m.id==='dungeon-2-0');
      boss.x=p.x+1;boss.z=p.z;boss.cooldown=0;
      s.tick(.05);
    });
    await game.waitForFunction(()=>window.__DREAM_SESSION__?.bossThreat?.move==='aimed-strike');
    await game.waitForFunction(()=>document.querySelector('#boss-warning')?.hidden===false);
    await game.screenshot({path:out+'/ruin-boss-aimed-warning-mobile.png',fullPage:true});
    await game.evaluate(()=>{
      const s=window.__DREAM_SESSION__,p=s.state.player,b=s.mobs.find(m=>m.id==='dungeon-2-0');
      // Move the boss away so the first cast is safely dodged.
      b.x=p.x+9;b.z=p.z;
      for(let i=0;i<26;i++)s.tick(.05);
      b.x=p.x+1;b.z=p.z;b.cooldown=0;
      s.tick(.05);
    });
    await game.waitForFunction(()=>window.__DREAM_SESSION__?.bossThreat?.move==='ground-sweep');
    await game.waitForFunction(()=>document.querySelector('#boss-warning')?.textContent.includes('원형 휩쓸기'));
    await game.screenshot({path:out+'/ruin-boss-sweep-warning-mobile.png',fullPage:true});
    await dungeonKill('dungeon-2-0');
    await game.locator('#dungeon-journal').click();
    await game.locator('#dungeon-claim').click();
    await game.waitForFunction(()=>window.__DREAM_SESSION__?.state?.player?.dungeon?.clears===1 && !window.__DREAM_SESSION__?.state?.player?.dungeon?.inside);
    await game.screenshot({path:out+'/ruin-clear-mobile.png',fullPage:true});
    await game.close();
    if(errors.length||bad.length)throw new Error('Browser errors '+JSON.stringify({errors,bad}));
    fs.writeFileSync(out+'/report.json',JSON.stringify({selection,poseProof:{poseA,poseB,displacement,cameraFront,cameraSide,cameraBack},errors,bad,screenshots:22,limit:'Software renderer only; not device FPS or visual design approval'},null,2));
    console.log('Armor visual smoke success',selection);
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
