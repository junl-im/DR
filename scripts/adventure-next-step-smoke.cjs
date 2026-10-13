// Extends the original PR22 real-combat proof; no duplicated browser harness.
const {expect}=require('@playwright/test');
exports.claim=async page=>{
  await expect(page.locator('#help-quest-target')).toHaveText('보상 수령 · 다음 의뢰');
  await page.locator('#help-quest-target').click();
};
exports.afterQuestLine=async(page,row,width,out)=>{
      await page.locator('#quest-mini').click();
      await expect(page.locator('#help-quest-target')).toHaveText('폐허 관문으로 자동이동');
      await page.locator('#help-quest-target').click();
      await page.waitForFunction(() => !document.querySelector('#panel').hidden && document.querySelector('#dungeon-enter') && !document.querySelector('#dungeon-enter').disabled, null, {timeout:90000});
      await page.locator('#dungeon-enter').click();
      await page.waitForFunction(() => window.__DREAM_SESSION__.state.player.dungeon.inside);
      await page.locator('#panel-close').click();
      await page.locator('#quest-mini').click();
      await expect(page.locator('#dungeon-leave')).toBeVisible();
      await expect(page.locator('#help-quest-target')).toHaveCount(0);
      await page.locator('#panel').evaluate(async el=>{await Promise.all(el.getAnimations().map(a=>a.finished));});
      await expect(page.locator('#panel')).toHaveCSS('opacity','1');
      row.dungeonGuidance=true;
      await page.screenshot({path:out+'/'+width+'-dungeon-guidance.png'});
      await page.locator('#dungeon-leave').click();
      await page.locator('#panel-close').click();
};
