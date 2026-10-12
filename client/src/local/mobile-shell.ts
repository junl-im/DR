export const mobileEnvironment=(ua:string)=>({kakao:/KAKAOTALK/i.test(ua),android:/Android/i.test(ua),ios:/iPhone|iPad|iPod/i.test(ua)});
export function externalBrowserUrl(href:string,android:boolean){
 const url=new URL(href);if(!/^https?:$/.test(url.protocol))throw new Error('Invalid browser URL');
 return android?`intent://${url.host}${url.pathname}${url.search}${url.hash}#Intent;scheme=${url.protocol.slice(0,-1)};action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;S.browser_fallback_url=${encodeURIComponent(url.href)};end`:`kakaotalk://web/openExternal?url=${encodeURIComponent(url.href)}`;
}
export function createMobileShell(options:{pause:()=>void;persist:()=>Promise<void>}){
 const env=mobileEnvironment(navigator.userAgent),mobile=matchMedia('(pointer:coarse)').matches||env.android||env.ios;
 let armed=false,paused=false,ended=false,wasFullscreen=false,manualRestore=false,saving=false,lastMessage="";
 const layer=document.createElement('div');layer.id='mobile-shell';
 layer.innerHTML=`<dialog id="exit-dialog" aria-labelledby="exit-heading"><h2 id="exit-heading">모험을 종료할까요?</h2><p>진행 상황을 이 기기에 저장한 뒤 종료합니다.</p><p id="exit-status" role="status"></p><div class="shell-actions"><button id="exit-stay" autofocus>계속 플레이</button><button id="exit-confirm">저장하고 종료</button></div></dialog><section id="game-ended" hidden><div><h2>모험을 종료했습니다</h2><p>진행 상황을 이 기기에 저장했습니다.</p><button id="game-reopen">다시 게임 열기</button><p>브라우저 메뉴로 탭을 닫을 수 있습니다.</p></div></section>`;
 document.body.append(layer);
 const dialog=layer.querySelector<HTMLDialogElement>('#exit-dialog')!,status=layer.querySelector<HTMLElement>('#exit-status')!;
 const message=(text:string)=>{lastMessage=text;const el=document.querySelector<HTMLElement>('#screen-status');if(el)el.textContent=text;};
 const sync=()=>{const button=document.querySelector<HTMLButtonElement>('#fullscreen-toggle');if(button){button.textContent=document.fullscreenElement?'화면 복원':'전체화면';button.setAttribute('aria-pressed',String(!!document.fullscreenElement));}};
 function askExit(){if(!armed||ended||dialog.open)return;paused=true;options.pause();status.textContent='';dialog.showModal();}
 function stay(){if(ended||saving)return;dialog.close();paused=false;}
 layer.querySelector('#exit-stay')!.addEventListener('click',stay);
 dialog.addEventListener('cancel',e=>{e.preventDefault();stay();});
 layer.querySelector('#exit-confirm')!.addEventListener('click',async()=>{
  const button=layer.querySelector<HTMLButtonElement>('#exit-confirm')!;button.disabled=true;saving=true;status.textContent='저장 중…';
  try{await options.persist();ended=true;armed=false;dialog.close();layer.querySelector<HTMLElement>('#game-ended')!.hidden=false;
   if(document.fullscreenElement){manualRestore=true;void document.exitFullscreen().catch(()=>{});}
   // Do not pretend a normal browser tab can always be closed by script.
   if(history.state?.dreamMobileGuard?.previous)history.go(-2);
  }catch{status.textContent='저장하지 못했습니다. 계속 플레이한 뒤 저장 메뉴에서 파일 백업을 이용하세요.';}
  finally{saving=false;button.disabled=false;}
 });
 layer.querySelector('#game-reopen')!.addEventListener('click',()=>location.reload());
 window.addEventListener('popstate',()=>{
  if(!armed||ended||!mobile)return;
  const previous=history.state?.dreamMobileBase?.previous??false;
  history.pushState({...history.state,dreamMobileGuard:{previous}},'',location.href);askExit();
 });
 document.addEventListener('fullscreenchange',()=>{
  const active=!!document.fullscreenElement;
  if(wasFullscreen&&!active&&!manualRestore&&mobile)askExit();
  wasFullscreen=active;manualRestore=false;sync();
 });
 async function fullscreen(){
  if(document.fullscreenElement){manualRestore=true;await document.exitFullscreen().catch(()=>{});return;}
  try{if(!document.documentElement.requestFullscreen)throw new Error('unsupported');await document.documentElement.requestFullscreen({navigationUI:'hide'});message('전체화면으로 플레이 중');}
  catch{message(env.kakao?'외부 브라우저 권장':env.ios?'홈 화면 실행 권장':'전체화면 제한');}
  sync();
 }
 function mountControls(){
  const button=document.querySelector<HTMLButtonElement>('#fullscreen-toggle');if(button)button.onclick=()=>void fullscreen();
  const exit=document.querySelector<HTMLButtonElement>('#game-exit');if(exit)exit.onclick=askExit;
  const notice=document.querySelector<HTMLElement>('#browser-help');if(notice){notice.hidden=!env.kakao;notice.querySelector<HTMLButtonElement>('#external-browser')!.onclick=()=>{message('열리지 않으면 카카오 메뉴의 다른 브라우저로 열기를 이용하세요.');const url=externalBrowserUrl(location.href,env.android);if(env.android)location.href=url;else window.open(url,'_blank','noopener');};
   notice.querySelector<HTMLButtonElement>('#copy-game-url')!.onclick=async()=>{try{await navigator.clipboard.writeText(location.href);message('게임 주소를 복사했습니다.');}catch{const input=notice.querySelector<HTMLInputElement>('#game-url')!;input.hidden=false;input.value=location.href;input.focus();input.select();message('주소를 길게 눌러 복사하세요.');}};
  }message(lastMessage);sync();
 }
 return {get paused(){return paused;},mobile,fullscreen,mountControls,arm(){armed=true;
  if(!mobile)return;
  if(!history.state?.dreamMobileGuard){const previous=history.length>1&&!!document.referrer;history.replaceState({...history.state,dreamMobileBase:{previous}},'',location.href);history.pushState({...history.state,dreamMobileGuard:{previous}},'',location.href);}
 },askExit};
}
