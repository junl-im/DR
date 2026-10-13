// Desktop and mobile settings are opened by a dedicated primary-click button.
async function openHuntSettings(page){
 if(await page.locator('#panel').isVisible())await page.locator('#panel-close').click();
 await page.locator('#hunt-config-toggle').click();
 await page.locator('.quest.hunt-settings-open').waitFor({state:'visible',timeout:6000});
}
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
    await game.waitForFunction(()=>window.__GAME_STATE__?.environment?.loaded===true,null,{timeout:90000});
    await game.waitForFunction(()=>{
      const label=document.querySelector('#player-overhead-name');
      return label&&!label.hidden&&label.textContent?.trim().length>0;
    },null,{timeout:15000});
    const desktopFont=await game.locator('#player-overhead-name').evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
    if(desktopFont<15)throw new Error('Desktop overhead name is still too small: '+desktopFont);
    await game.screenshot({path:out+'/readable-name-desktop.png',fullPage:true});
    const villageState=await game.evaluate(()=>window.__GAME_STATE__.environment);
    if(villageState.buildings.count!==5||villageState.peaceZone.count!==1)
      throw new Error('Village environment stats changed '+JSON.stringify(villageState));
    await game.waitForTimeout(400);
    // Keyboard target cycle and accessible toggle work in the live Vite game.
    await game.keyboard.press('Tab');
    const tabTarget=await game.evaluate(()=>window.__DREAM_SESSION__?.target);
    if(!tabTarget)throw new Error('Tab did not select a visible living monster');
    await game.keyboard.press('Tab');
    const nextTabTarget=await game.evaluate(()=>window.__DREAM_SESSION__?.target);
    if(!nextTabTarget || tabTarget===nextTabTarget)throw new Error('Tab cycling stuck at one target');
    await openHuntSettings(game);await game.locator('#next-target').click();
    const buttonTarget=await game.evaluate(()=>window.__DREAM_SESSION__?.target);
    if(!buttonTarget||buttonTarget===nextTabTarget)
      throw new Error('Mobile next-target button did not cycle to another monster');
    await game.keyboard.press('h');
    if(await game.locator('#auto-hunt').getAttribute('aria-pressed')!=='true')
      throw new Error('H did not enable auto hunt');
    await game.screenshot({path:out+'/village-auto-hunt-desktop.png',fullPage:true});
    await game.locator('#auto-hunt').click();
    if(await game.locator('#auto-hunt').getAttribute('aria-pressed')!=='false')
      throw new Error('Auto hunt button did not disable the mode');
    if(await game.evaluate(()=>window.__DREAM_SESSION__.attacking))
      throw new Error('Turning off auto hunt did not stop active combat');
    // Real UI option changes must affect the session controller without
    // changing saved player stats or auto-starting background potion use.
    await game.locator('#auto-config').evaluate(el=>el.open=!el.open);
    await game.locator('#auto-config').evaluate(el=>el.open=true);await game.locator('#auto-radius').selectOption('12');
    await game.locator('#auto-config').evaluate(el=>el.open=true);await game.locator('#auto-priority').selectOption('normal-only');
    await game.locator('#auto-config').evaluate(el=>el.open=true);await game.locator('#auto-potion').selectOption('0.5');
    await game.locator('#auto-hunt').click();
    if(await game.locator('#auto-hunt').getAttribute('aria-pressed')!=='true')
      throw new Error('Options prevented auto hunt activation');
    await game.waitForFunction(()=>document.querySelector('#auto-status')?.textContent.includes('12m'));
    await game.screenshot({path:out+'/village-auto-settings-desktop.png',fullPage:true});
    await game.locator('#auto-hunt').click();
    await game.locator('#auto-config').evaluate(el=>el.open=true);await game.locator('#auto-radius').selectOption('28');
    await game.locator('#auto-config').evaluate(el=>el.open=true);await game.locator('#auto-priority').selectOption('nearest');
    await game.locator('#auto-config').evaluate(el=>el.open=true);await game.locator('#auto-potion').selectOption('0');
    await game.locator('#auto-config').evaluate(el=>el.open=!el.open);
    if(await game.evaluate(()=>window.__DREAM_SESSION__.attacking))
      throw new Error('Turning off configured auto hunt kept attacking');
    await game.screenshot({path:out+'/village-facades-desktop.png',fullPage:true});
    await game.setViewportSize({width:390,height:844});
    await game.waitForTimeout(300);
    const mobileName=await game.locator('#player-overhead-name').evaluate(el=>({
      hidden:el.hidden,font:parseFloat(getComputedStyle(el).fontSize),
      name:el.textContent,
      rect:el.getBoundingClientRect().toJSON(),
    }));
    if(mobileName.hidden||mobileName.font<14||!mobileName.name?.trim() ||
      mobileName.rect.width<20||mobileName.rect.height<14)
      throw new Error('Mobile overhead name not legible '+JSON.stringify(mobileName));
    await game.screenshot({path:out+'/readable-name-mobile.png',fullPage:true});
    if(await game.evaluate(()=>document.documentElement.scrollWidth>innerWidth))
      throw new Error('Village facade preview overflowed mobile viewport');
    if(!await game.locator('#quality-info').isVisible())
      throw new Error('Mobile GPU FPS / draw-call indicator must remain visible');
    await game.locator('#auto-config').evaluate(el=>el.open=!el.open);
    if(await game.evaluate(()=>document.documentElement.scrollWidth>innerWidth))
      throw new Error('Expanded mobile auto-hunt options overflowed the viewport');
    await game.screenshot({path:out+'/village-auto-settings-mobile.png',fullPage:true});
    await game.locator('#auto-config').evaluate(el=>el.open=!el.open);
    await game.screenshot({path:out+'/village-facades-mobile.png',fullPage:true});
    await game.locator('#hunt-close').click();
    // An actual selected monster must not cover mobile quest/touch buttons.
    await game.evaluate(()=>{
      const s=window.__DREAM_SESSION__;
      const m=s.mobs.find(m=>m.hp>0&&!m.id.startsWith('dungeon-'));
      s.dispatch({type:'target',id:m.id});
    });
    await game.waitForFunction(()=>document.querySelector('#target')?.hidden===false);
    const mobileTargetGeometry=await game.evaluate(()=>{
      const target=document.querySelector('#target').getBoundingClientRect();
      const quest=document.querySelector('.quest').getBoundingClientRect();
      return {target:target.toJSON(),quest:quest.toJSON(),
        overlap:Math.max(0,Math.min(target.right,quest.right)-Math.max(target.left,quest.left))*
          Math.max(0,Math.min(target.bottom,quest.bottom)-Math.max(target.top,quest.top))};
    });
    if(mobileTargetGeometry.overlap>0)
      throw new Error('Mobile monster HP overlays quest panel: '+JSON.stringify(mobileTargetGeometry));
    await game.screenshot({path:out+'/mobile-monster-target-no-overlay.png',fullPage:true});
    await game.setViewportSize({width:1440,height:900});
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
    await game.locator('#quest-mini').click();
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
    await openHuntSettings(game);await game.locator('#dungeon-journal').click();
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
      await openHuntSettings(game);await game.locator('#dungeon-journal').click();
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
    if(!await game.locator('#boss-dodge').isVisible())
      throw new Error('Q/mobile dodge control was not revealed during boss windup');
    const dodgeSize=await game.locator('#boss-dodge').evaluate(el=>({
      w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height
    }));
    if(dodgeSize.w<44||dodgeSize.h<44)
      throw new Error('Boss dodge touch area is smaller than 44px: '+JSON.stringify(dodgeSize));
    await game.screenshot({path:out+'/ruin-boss-manual-dodge-control-mobile.png',fullPage:true});
    await game.screenshot({path:out+'/ruin-boss-aimed-warning-mobile.png',fullPage:true});
    // Real Playwright mobile-layout button click must trigger the ordinary
    // movement/path system and survive the full cast without losing HP.
    const aimedBefore=await game.evaluate(()=>{
      const s=window.__DREAM_SESSION__,p=s.state.player;
      const boss=s.mobs.find(m=>m.id==='dungeon-2-0');
      boss.windup=s.clock+1.65; // controlled timing fixture, original hit logic
      boss.aimX=p.x;boss.aimZ=p.z;
      return{x:p.x,z:p.z,hp:p.hp,aimX:boss.aimX,aimZ:boss.aimZ};
    });
    await game.locator('#boss-dodge').click();
    await game.waitForFunction(start=>{
      const p=window.__DREAM_SESSION__?.state.player;
      return p && Math.hypot(p.x-start.x,p.z-start.z)>1.2;
    },aimedBefore,{timeout:4000,polling:40});
    await game.waitForFunction(()=>!window.__DREAM_SESSION__?.bossThreat,null,{timeout:5500});
    const aimedAfter=await game.evaluate(()=>{
      const s=window.__DREAM_SESSION__,p=s.state.player;
      return{x:p.x,z:p.z,hp:p.hp,message:s.message};
    });
    if(aimedAfter.hp!==aimedBefore.hp ||
       Math.hypot(aimedAfter.x-aimedBefore.aimX,aimedAfter.z-aimedBefore.aimZ)<=2.3)
      throw new Error('Real mobile boss dodge click did not escape damage: '+JSON.stringify({aimedBefore,aimedAfter}));
    await game.screenshot({path:out+'/ruin-boss-aimed-dodged-mobile.png',fullPage:true});
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
    const sweepBefore=await game.evaluate(()=>{
      const s=window.__DREAM_SESSION__,p=s.state.player,b=s.mobs.find(m=>m.id==='dungeon-2-0');
      b.windup=s.clock+2.1; // controlled mobile keyboard test on normal hit zone
      return{x:p.x,z:p.z,hp:p.hp,bossX:b.x,bossZ:b.z};
    });
    await game.keyboard.press('q');
    await game.waitForFunction(start=>{
      const p=window.__DREAM_SESSION__?.state.player;
      return p && Math.hypot(p.x-start.x,p.z-start.z)>1.2;
    },sweepBefore,{timeout:4000,polling:40});
    await game.waitForFunction(()=>!window.__DREAM_SESSION__?.bossThreat,null,{timeout:5500});
    const sweepAfter=await game.evaluate(()=>{
      const s=window.__DREAM_SESSION__,p=s.state.player;
      return{x:p.x,z:p.z,hp:p.hp,message:s.message};
    });
    if(sweepAfter.hp!==sweepBefore.hp||
       Math.hypot(sweepAfter.x-sweepBefore.bossX,sweepAfter.z-sweepBefore.bossZ)<=5.5)
      throw new Error('Real Q-key sweep dodge did not escape damage: '+JSON.stringify({sweepBefore,sweepAfter}));
    await game.screenshot({path:out+'/ruin-boss-sweep-dodged-mobile.png',fullPage:true});
    await dungeonKill('dungeon-2-0');
    await openHuntSettings(game);await game.locator('#dungeon-journal').click();
    await game.locator('#dungeon-claim').click();
    await game.waitForFunction(()=>window.__DREAM_SESSION__?.state?.player?.dungeon?.clears===1 && !window.__DREAM_SESSION__?.state?.player?.dungeon?.inside);
    await game.screenshot({path:out+'/ruin-clear-mobile.png',fullPage:true});
    await game.close();
    if(errors.length||bad.length)throw new Error('Browser errors '+JSON.stringify({errors,bad}));
    fs.writeFileSync(out+'/report.json',JSON.stringify({selection,poseProof:{poseA,poseB,displacement,cameraFront,cameraSide,cameraBack},villageState,tabTarget,nextTabTarget,buttonTarget,desktopFont,mobileName,dodgeSize,aimedBefore,aimedAfter,sweepBefore,sweepAfter,mobileTargetGeometry,errors,bad,screenshots:33,limit:'Software renderer only; not device FPS or visual design approval'},null,2));
    console.log('Armor visual smoke success',selection);
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
