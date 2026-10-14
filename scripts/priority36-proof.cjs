const {expect}=require('@playwright/test');
exports.setup=async page=>page.addInitScript(()=>{
 const open=IDBFactory.prototype.open;
 IDBFactory.prototype.open=function(...args){
  const request=open.apply(this,args);
  if(window.__SAVE_LATENCY__&&args[0]==='dream-library-local-v1')request.addEventListener('success',event=>{
   event.stopImmediatePropagation();
   (window.__SAVE_OPENS__??=[]).push(()=>request.dispatchEvent(new Event('success')));
  },{once:true});
  return request;
 };
});
exports.travel=async(page,row,stage)=>{
 await expect(page.locator('#auto-mode')).toHaveText('이동');
 await expect(page.locator('#auto-hunt')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#auto-hunt')).toHaveAttribute('aria-label',/자동이동 중/);
 (row.travelStates??=[]).push({stage,label:await page.locator('#auto-mode').textContent()});
};
exports.selectArmor=async(page,row,width,out)=>{
 await page.locator('#inventory').click();
 await page.locator('[data-craft-armor="body:1"]').click();
 const before=await page.evaluate(()=>window.__DREAM_SESSION__.state.player.armor.equipped.body);
 await page.locator('[data-armor-bag="body:1"]').click();
 expect(await page.evaluate(()=>window.__DREAM_SESSION__.state.player.armor.equipped.body)).toBe(before);
 await expect(page.locator('.item-detail')).toContainText('경갑 갑옷');
 await expect(page.locator('.equipment-comparison')).toContainText('방어력');
 await expect(page.locator('[data-armor-bag="body:1"]')).toHaveAttribute('aria-pressed','true');
 await page.locator('#toggle-armor').click();
 expect(await page.evaluate(()=>window.__DREAM_SESSION__.state.player.armor.equipped.body)).toBe(1);
 await page.screenshot({path:out+'/'+width+'-armor-detail.png'});
 await page.locator('[data-filter="all"]').click();
 await page.locator('[data-item="weapon"]').last().click();
 await page.evaluate(()=>window.__DREAM_SAVE__());
 await page.evaluate(()=>{window.__SAVE_OPENS__=[];window.__SAVE_LATENCY__=true;});
 await page.locator('#toggle-equipment').click();
 await page.waitForFunction(()=>window.__SAVE_OPENS__?.length>0);
 await page.locator('#toggle-equipment').click();
 expect(await page.evaluate(()=>window.__DREAM_SESSION__.state.player.weaponEquipped)).toBe(true);
 await page.evaluate(()=>{window.__SAVE_LATENCY__=false;for(const release of window.__SAVE_OPENS__)release();return window.__DREAM_SAVE__();});
 await page.reload();await page.locator('#continue').click();await page.waitForFunction(()=>window.__DREAM_SESSION__);
 const restored=await page.evaluate(()=>({weaponEquipped:window.__DREAM_SESSION__.state.player.weaponEquipped,armor:window.__DREAM_SESSION__.state.player.armor.equipped.body,quest:window.__DREAM_SESSION__.state.player.quest}));
 expect(restored.weaponEquipped).toBe(true);expect(restored.armor).toBe(1);expect(restored.quest).toEqual({stage:3,progress:0});
 row.priority36={restored};
};
exports.finishDungeon=async(page,row,width,out)=>{
 await page.locator('#panel-close').click();await page.locator('#hunt-config-toggle').click();
 await page.locator('#auto-potion').selectOption('0.65');await page.locator('#hunt-close').click();
 await page.locator('#quest-mini').click();
 for(let wave=0;wave<3;wave++){
  await expect(page.locator('#dungeon-hunt')).toBeEnabled();await page.locator('#dungeon-hunt').click();
  await page.waitForFunction(({wave,required})=>{const d=window.__DREAM_SESSION__.state.player.dungeon;return d.inside&&d.wave===wave&&d.kills===required;},{wave,required:wave===2?1:2},{timeout:150000});
  await expect(page.locator('#auto-hunt')).toHaveAttribute('aria-pressed','false');
  await page.locator('#quest-mini').click();
  await expect(page.locator('#dungeon-hunt')).toBeDisabled();
  if(wave<2){await expect(page.locator('#dungeon-guidance')).toContainText('다음 구역');await expect(page.locator('#dungeon-next')).toBeEnabled();await page.locator('#dungeon-next').click();}
 }
 const before=await page.evaluate(()=>structuredClone(window.__DREAM_SESSION__.state.player));
 await expect(page.locator('#dungeon-guidance')).toContainText('보상');await page.locator('#dungeon-claim').click();
 const after=await page.evaluate(()=>structuredClone(window.__DREAM_SESSION__.state.player));
 expect(after.gold).toBe(before.gold+120);expect(after.dungeon.clears).toBe(before.dungeon.clears+1);expect(after.dungeon.inside).toBe(false);
 await page.evaluate(()=>window.__DREAM_SAVE__());await page.reload();await page.locator('#continue').click();await page.waitForFunction(()=>window.__DREAM_SESSION__);
 expect(await page.evaluate(()=>window.__DREAM_SESSION__.state.player.dungeon.clears)).toBe(after.dungeon.clears);
 row.priority36.dungeon={clears:after.dungeon.clears,rewardGold:after.gold-before.gold};
 await page.locator('#hunt-config-toggle').click();await page.locator('#dungeon-journal').click();
 await page.locator('#panel').evaluate(async el=>{await Promise.all(el.getAnimations().map(a=>a.finished));});
 await page.screenshot({path:out+'/'+width+'-dungeon-clear.png'});
};
