// Real browser regression: a transient 503 on the first monster GLB request
// must not strand an existing live mob in its capsule fallback forever.
// This runs against the built Firebase-root Vite preview with WebGL enabled.
const {chromium}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');

const BASE=process.env.MONSTER_BASE_URL||'http://127.0.0.1:4300/';
const OUT='artifacts/monster-retry-proof';
fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,args:[
   '--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'
 ]});
 const report={base:BASE,viewports:[],error:null};
 try{
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
   const device=viewport.width===390?'mobile':'desktop';
   const page=await browser.newPage({viewport,deviceScaleFactor:1});
   const record={device,failedRequests:0,successfulRequests:0,responses:[],errors:[],
     sawCapsule:false,ready:false,overflow:false};
   // Keep the successful retry pending until the real fallback is observed.
   // A fast retry can otherwise finish before the debug hook is published.
   let releaseRecovery,closing=false;
   const recoveryGate=new Promise(resolve=>{releaseRecovery=resolve;});
   await page.route('**/models/monsters/Gremlin.glb',async route=>{
     // Keep the first failure deterministic: no blocking of unrelated models.
     if(record.failedRequests===0){
       record.failedRequests++;
       await route.fulfill({status:503,contentType:'text/plain',body:'QA transient GLB error'});
     }else{
       await recoveryGate;
       if(closing)return;
       await route.continue();
     }
   });
   page.on('pageerror',error=>record.errors.push(String(error)));
   page.on('response',response=>{
     if(response.url().includes('/models/monsters/Gremlin.glb')){
       record.responses.push(response.status());
       if(response.status()===200)record.successfulRequests++;
     }
   });
   try{
     await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:60000});
     await page.locator('#start').click();
     await page.waitForFunction(()=>typeof window.__DREAM_MOB_RENDER_STATUS__==='function',{},{timeout:90000});
     await page.waitForFunction(()=>{
       const one=window.__DREAM_MOB_RENDER_STATUS__()?.find(m=>m.id==='local-0');
       return one&&one.rendered&&!one.modelReady&&one.hp>0;
     },null,{timeout:15000});
     record.sawCapsule=true;
     releaseRecovery();
     await page.waitForFunction(()=>{
       const one=window.__DREAM_MOB_RENDER_STATUS__()?.find(m=>m.id==='local-0');
       return one&&one.rendered&&one.modelReady&&one.hp>0;
     },null,{timeout:30000});
     record.ready=true;
     record.overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
     record.status=await page.evaluate(()=>window.__DREAM_MOB_RENDER_STATUS__()?.find(m=>m.id==='local-0'));
     const screenshot=path.join(OUT,`transient-retry-${device}.png`);
     await page.screenshot({path:screenshot,fullPage:true});
     record.screenshot=screenshot;
     if(!record.sawCapsule||!record.ready||record.failedRequests!==1||
        !record.successfulRequests||record.errors.length||record.overflow){
       throw new Error('Transient GLB recovery regression: '+JSON.stringify(record));
     }
   }finally{
     record.finalStatus=await page.evaluate(()=>window.__DREAM_MOB_RENDER_STATUS__?.()?.find(m=>m.id==='local-0')).catch(()=>null);
     closing=true;releaseRecovery();report.viewports.push(record);await page.close();
   }
  }
  console.log('MONSTER GLB FAULT-RECOVERY VERIFIED: desktop and mobile; first 503 then model ready');
 }catch(error){report.error=String(error);console.error(report.error);process.exitCode=1;}
 finally{
   fs.writeFileSync(path.join(OUT,'fault-recovery-report.json'),JSON.stringify(report,null,2));
   await browser.close();
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
