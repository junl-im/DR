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
    if(errors.length||bad.length)throw new Error('Browser errors '+JSON.stringify({errors,bad}));
    fs.writeFileSync(out+'/report.json',JSON.stringify({selection,errors,bad,screenshots:4,limit:'Software renderer only; not device FPS or visual design approval'},null,2));
    console.log('Armor visual smoke success',selection);
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
