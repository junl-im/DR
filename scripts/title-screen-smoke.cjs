const {chromium,expect}=require('@playwright/test');
const fs=require('fs');
const out='artifacts/title-screen-proof';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.DREAM_CHROMIUM,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});const reports=[];try{
for(const [width,height] of [[1440,900],[390,844],[320,568],[844,390]]){
const context=await browser.newContext({viewport:{width,height},hasTouch:width<900,isMobile:width<600});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto('http://127.0.0.1:4300/?art=traveler');await expect(page.locator('#entry-form')).toBeVisible();await expect(page.locator('input[name=character]')).toHaveCount(3);await expect(page.locator('select')).toHaveCount(0);
expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
const titleDimensions=()=>page.locator('.title-entry').evaluate(el=>{
 const fit=el.querySelector('.entry-fit');
 const button=el.querySelector('#start')?.getBoundingClientRect();
 return {fits:el.scrollHeight<=el.clientHeight&&el.scrollWidth<=el.clientWidth,
   height:el.clientHeight,scrollHeight:el.scrollHeight,width:el.clientWidth,scrollWidth:el.scrollWidth,
   scale:getComputedStyle(fit).transform,
   buttonWithin:!!button&&button.top>=0&&button.bottom<=innerHeight};
});
// Fonts and browser viewport measurements can settle after entry-form mounts.
// Verify the settled state repeatedly rather than one unrelated initial frame.
await expect.poll(async()=>await titleDimensions(),{timeout:4500})
  .toMatchObject({fits:true,buttonWithin:true});
const initialDimensions=await titleDimensions();
expect(initialDimensions.fits,'title should never require hidden scroll space').toBe(true);
if(width===320){
 for(let probe=0;probe<4;probe++){
   await page.waitForTimeout(100);
   const current=await titleDimensions();
   expect(current.fits,'320px title must stay fitted after fonts and paints').toBe(true);
   expect(current.buttonWithin).toBe(true);
 }
}
const startBox=await page.locator('#start').boundingBox();expect(startBox.y).toBeGreaterThanOrEqual(0);expect(startBox.y+startBox.height).toBeLessThanOrEqual(height);
for(const asset of ['title-hero-v1.webp','character-portraits-v1.webp']){const response=await page.request.get('http://127.0.0.1:4300/art/'+asset);expect(response.status()).toBe(200);}
await page.locator('.character-card').nth(1).click();await expect(page.locator('input[value="10"]')).toBeChecked();await expect(page.locator('#selected-class-name')).toContainText('별의');await page.locator('#name').fill('새벽의학자');await page.mouse.move(0,0);await page.waitForTimeout(250);await page.screenshot({path:`${out}/title-${width}.png`,fullPage:true});
if(width===1440||width===390){await page.locator('#start').click();await page.waitForFunction(()=>window.__DREAM_SESSION__,null,{timeout:60000});const player=await page.evaluate(()=>window.__DREAM_SESSION__.state.player);expect(player.name).toBe('새벽의학자');expect(player.classId).toBe(10);await page.evaluate(()=>window.__DREAM_SAVE__());await page.reload();await expect(page.locator('#continue')).toBeVisible();await expect(page.locator('#continue-name')).toHaveText('새벽의학자');await page.screenshot({path:`${out}/resume-${width}.png`,fullPage:true});await page.locator('#continue').click();await page.waitForFunction(()=>window.__DREAM_SESSION__,null,{timeout:60000});const restored=await page.evaluate(()=>window.__DREAM_SESSION__.state.player);expect(restored.name).toBe('새벽의학자');expect(restored.classId).toBe(10);}
expect(errors).toEqual([]);reports.push({width,height,noHorizontalOverflow:true,selection:true,saveAndResume:width===1440||width===390,errors});await context.close();}
fs.writeFileSync(out+'/report.json',JSON.stringify(reports,null,2));console.log(reports);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
