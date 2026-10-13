const {chromium,expect}=require('@playwright/test'),fs=require('fs');const out='artifacts/monster-respawn-proof';fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({headless:true,executablePath:process.env.DREAM_CHROMIUM,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});const report=[];try{for(const width of [1440,390]){const p=await b.newPage({viewport:{width,height:900}}),errors=[],requests=[];p.on('pageerror',e=>errors.push(String(e)));p.on('request',r=>{if(r.url().endsWith('/Gremlin.glb'))requests.push(r.url());});await p.goto('http://127.0.0.1:4300/?art=traveler');await p.locator('#start').click();await p.waitForFunction(()=>window.__DREAM_MOB_RENDER_STATUS__?.().some(m=>m.id==='local-0'&&m.modelReady),null,{timeout:60000});
const baseline=await p.evaluate(()=>window.__DREAM_MOB_RENDER_STATUS__().find(m=>m.id==='local-0'));expect(baseline.bodyMinOpacity).toBe(1);const samples=[];
for(let cycle=0;cycle<2;cycle++){
await p.evaluate(()=>{const s=window.__DREAM_SESSION__,m=s.mobs.find(m=>m.id==='local-0'),pl=s.state.player;pl.x=m.x-1;pl.z=m.z;pl.hp=100;m.hp=1;s.dispatch({type:'target',id:m.id});s.dispatch({type:'attack'});for(let i=0;i<40&&m.hp>0;i++)s.tick(.05);});
await p.waitForFunction(()=>window.__DREAM_SESSION__.mobs.find(m=>m.id==='local-0').hp===0);await p.waitForTimeout(350);
const living=await p.evaluate(()=>window.__DREAM_MOB_RENDER_STATUS__().filter(m=>m.hp>0&&m.modelReady));expect(living.length).toBeGreaterThan(0);for(const m of living)expect(m.bodyMinOpacity).toBe(1);
await p.screenshot({path:`${out}/death-${width}-${cycle}.png`});
// Wait for the actual corpse/VFX retirement, then advance the unchanged game timer.
await p.waitForFunction(()=>!window.__DREAM_MOB_RENDER_STATUS__().some(m=>m.id==='local-0'),null,{timeout:15000});
const timer=await p.evaluate(()=>{const s=window.__DREAM_SESSION__,m=s.mobs.find(m=>m.id==='local-0');const before={clock:s.clock,deadline:m.respawn,hp:m.hp};for(let i=0;i<310;i++)s.tick(.05);return {before,after:{clock:s.clock,hp:m.hp}};});
expect(timer.before.hp).toBe(0);expect(timer.after.clock-timer.before.clock).toBeCloseTo(15.5,5);expect(timer.after.hp).toBeGreaterThan(0);
await p.waitForFunction(()=>window.__DREAM_MOB_RENDER_STATUS__().some(m=>m.id==='local-0'&&m.modelReady),null,{timeout:3000});
const respawn=await p.evaluate(()=>window.__DREAM_MOB_RENDER_STATUS__().find(m=>m.id==='local-0'));expect(respawn.bodyMinOpacity).toBe(1);samples.push({cycle,living,respawn,timer});await p.screenshot({path:`${out}/respawn-${width}-${cycle}.png`});}
expect(requests).toHaveLength(1);expect(errors).toEqual([]);report.push({width,samples,gremlinRequests:requests.length,errors});await p.close();}fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log(report.map(r=>({width:r.width,cycles:r.samples.length,gremlinRequests:r.gremlinRequests,errors:r.errors})));}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
