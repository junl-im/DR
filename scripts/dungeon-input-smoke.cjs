// Hardware-style browser interaction QA for Dungeon ZERO's local/production build.
// Real SwiftShader WebGL. Verify the gate dialog only opens after the player walks.
const {chromium,expect}=require('@playwright/test');
const fs=require('node:fs');
const out='artifacts/dungeon-input-proof';fs.mkdirSync(out,{recursive:true});
const base=process.env.DUNGEON_INPUT_BASE_URL||'http://127.0.0.1:4300/';
(async()=>{
 const b=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 const report={base,viewports:[],error:null};
 try{
  for(const width of [1440,390]){
   const device=width===1440?'desktop':'mobile';
   const context=await b.newContext({viewport:{width,height:width===1440?900:844},hasTouch:width===390,isMobile:width===390});
   const p=await context.newPage();const errors=[];
   p.on('pageerror',e=>errors.push(String(e)));
   await p.goto(base,{waitUntil:'domcontentloaded',timeout:60000});
   await p.locator('#start').click();
   await p.waitForFunction(()=>window.__DREAM_SESSION__&&document.querySelector('#sign-dungeon'),null,{timeout:90000});
   await p.waitForTimeout(300);
   const first=await p.evaluate(()=>({x:window.__DREAM_SESSION__.state.player.x,z:window.__DREAM_SESSION__.state.player.z}));
   // An actual UI click (not test-state teleportation) must initiate walk.
   await p.locator('#sign-dungeon').click({timeout:20000});
   const immediate=await p.locator('#panel').isVisible();
   expect(immediate,'world gate must not open the panel on a distant click').toBe(false);
   await expect(p.locator('#dungeon-enter')).toBeVisible({timeout:18000});
   const arrived=await p.evaluate(()=>{
     const v=window.__DREAM_SESSION__.state.player;
     return {x:v.x,z:v.z,distToGate:Math.hypot(v.x+7,v.z+5)};
   });
   expect(Math.hypot(arrived.x-first.x,arrived.z-first.z),'character must physically approach').toBeGreaterThan(2);
   expect(arrived.distToGate,'must end near gate').toBeLessThan(5.5);
   await expect(p.locator('#dungeon-enter')).toBeDisabled(); // quest gate unchanged.
   const label=await p.locator('#player-overhead-name').evaluate(el=>{
     const style=getComputedStyle(el),rect=el.getBoundingClientRect();
     return{transform:style.transform,visible:!el.hidden,y:rect.y,text:el.textContent};
   });
   expect(label.visible,'head nameplate must exist').toBe(true);
   await p.locator('#panel-close').click();
   const rightBefore=await p.evaluate(()=>({
     x:window.__DREAM_SESSION__.state.player.x,z:window.__DREAM_SESSION__.state.player.z
   }));
   const rect=await p.locator('#auto-hunt').boundingBox();
   await p.mouse.click(rect.x+rect.width/2,rect.y+rect.height/2,{button:'right'});
   await expect(p.locator('.quest')).not.toHaveClass(/hunt-settings-open/);
   const blocked=await p.evaluate(()=>{
     const area=document.querySelector('.player-line'),name=document.querySelector('#player-name');
     const context=new MouseEvent('contextmenu',{button:2,bubbles:true,cancelable:true});
     area.dispatchEvent(context);
     const drag=new Event('dragstart',{bubbles:true,cancelable:true});
     document.querySelector('#menu').dispatchEvent(drag);
     const select=new Event('selectstart',{bubbles:true,cancelable:true});
     name.dispatchEvent(select);
     const editable=new Event('selectstart',{bubbles:true,cancelable:true});
     document.querySelector('#log-input').dispatchEvent(editable);
     return {context:context.defaultPrevented,drag:drag.defaultPrevented,
       select:select.defaultPrevented,editableAllowed:!editable.defaultPrevented,
       overflow:document.documentElement.scrollWidth>innerWidth};
   });
   expect(blocked).toEqual({context:true,drag:true,select:true,editableAllowed:true,overflow:false});
   await p.waitForTimeout(200);
   const rightAfter=await p.evaluate(()=>({
     x:window.__DREAM_SESSION__.state.player.x,z:window.__DREAM_SESSION__.state.player.z
   }));
   expect(Math.hypot(rightAfter.x-rightBefore.x,rightAfter.z-rightBefore.z)).toBeLessThan(.2);
   await p.screenshot({path:out+'/'+device+'-dungeon-arrival.png'});
   expect(errors).toEqual([]);
   report.viewports.push({device,width,first,immediate,arrived,label,blocked,errors});
   await context.close();
  }
  console.log('DUNGEON ARRIVAL + BROWSER INPUT GUARD VERIFIED: PC and mobile');
 }catch(e){report.error=String(e);throw e;}
 finally{fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
