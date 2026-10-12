// Real headless Chromium + software WebGL smoke, using built game pages.
// Require HTTP-loaded GLBs and actual mesh replacement, not a logical mob list.
const {chromium}=require('@playwright/test');
const fs=require('node:fs');
const base=process.env.MONSTER_BASE_URL||'http://127.0.0.1:4300/';
const variant=process.env.MONSTER_QA_VARIANT||'firebase-root';
const out='artifacts/monster-visibility-proof';
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 const report={variant,base,requests:[],bad:[],errors:[],screenshots:[]};
 try{
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
   const device=viewport.width===390?'mobile':'desktop';
   const page=await browser.newPage({viewport,deviceScaleFactor:1});
   page.on('pageerror',e=>report.errors.push(device+': '+String(e)));
   page.on('response',r=>{
    if(r.url().includes('/models/monsters/'))report.requests.push({device,url:r.url(),status:r.status()});
    if(r.status()>=400)report.bad.push({device,url:r.url(),status:r.status()});
   });
   await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});
   await page.locator('#start').click();
   await page.waitForFunction(()=>typeof window.__DREAM_MOB_RENDER_STATUS__==='function',null,{timeout:90000});
   await page.waitForFunction(()=>{
    const mobs=window.__DREAM_MOB_RENDER_STATUS__();
    return mobs.some(m=>m.id==='local-0'&&m.rendered&&m.modelReady)
      && mobs.some(m=>m.id==='local-1'&&m.rendered&&m.modelReady);
   },null,{timeout:25000});
   const approach=await page.evaluate(()=>{
    const s=window.__DREAM_SESSION__,p=s.state.player,m=s.mobs.find(m=>m.id==='local-0');
    s.dispatch({type:'move',x:m.x-3,z:m.z+1});
    for(let i=0;i<400&&Math.hypot(p.x-m.x,p.z-m.z)>8;i++)s.tick(.05);
    return{distance:Math.hypot(p.x-m.x,p.z-m.z),hp:p.hp,mobHp:m.hp};
   });
   if(approach.distance>8||approach.hp<=0||approach.mobHp<=0)
     throw new Error('Unable to approach a living field monster: '+JSON.stringify(approach));
   await page.waitForTimeout(650);
   const state=await page.evaluate(()=>({
    mobs:window.__DREAM_MOB_RENDER_STATUS__().filter(m=>m.id.startsWith('local-')),
    overflow:document.documentElement.scrollWidth>innerWidth,
    selected:window.__DREAM_SESSION__.target,
   }));
   const mob=state.mobs.find(m=>m.id==='local-0');
   if(!mob||!mob.rendered||!mob.modelReady||mob.hp<=0||state.overflow)
     throw new Error('Field monster is still capsule/invisible: '+JSON.stringify(state));
   await page.keyboard.press('Tab');
   if(!await page.evaluate(()=>!!window.__DREAM_SESSION__?.target))
     throw new Error('Tab did not select living monster');
   const shot=variant+'-field-'+device+'.png';
   await page.screenshot({path:out+'/'+shot,fullPage:true});
   report.screenshots.push({device,shot,approach,state});
   await page.close();
  }
  for(const device of ['desktop','mobile'])
   for(const model of ['Gremlin.glb','Goblin.glb']){
    if(!report.requests.some(r=>r.device===device&&r.status===200&&r.url.endsWith('/models/monsters/'+model)))
      throw new Error('No successful '+device+' '+model+' request for '+variant);
   }
  if(report.errors.length||report.bad.some(r=>r.url.includes('/models/')))
    throw new Error('Browser error or GLB fetch failure '+JSON.stringify({errors:report.errors,bad:report.bad}));
  console.log('MONSTER LIVE WEBGL VERIFIED: '+variant+' '+report.screenshots.length+' field scenes');
 }catch(e){
  report.failure=String(e);
  throw e;
 }finally{
  fs.writeFileSync(out+'/'+variant+'-report.json',JSON.stringify(report,null,2));
  await browser.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1});
