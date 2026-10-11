import './inventory.css';
import { createInventoryWindow } from './inventory-window';
import './local.css';
import { applyClassicScene } from './classic-scene';
import { classicIcon } from './classic-icons';
import { TOWN_SIGNS, buildTownDetails } from './town';
import { createCombatFeedback } from './feedback';
import * as THREE from 'three';
import { snapEntityY, EntityAction } from '@nj/game-core';
import { createRenderer, type GameRenderer } from '../scene/renderer';
import { initGameState, setReady, setConnected, setPlayer, getGameState } from '../test-hook';
import { POTION_PRICE, canUsePotionShop, LocalGameSession, newSave, maxHp, xpNeeded, type Save, type Intent } from './session';
import { readSave, writeSave } from './saves';

const root = document.createElement('main'); root.id = 'dream-ui'; document.body.append(root);
const $ = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
let session: LocalGameSession;
let game: GameRenderer;
let saveTask: Promise<void> | undefined;
let replacingSave = false;
let cloud: typeof import('./cloud') | undefined;
let remembered: Save | null = null;
let inventoryWindow: ReturnType<typeof createInventoryWindow> | undefined;
let dead = new Set<string>();
let garden: THREE.Group | undefined;
let gardenLevel = -1;
let lastLog = '';
let logFilter = 'all';
function addLog(text: string, personal = false) {
  const lines = root.querySelector<HTMLElement>('#log-lines'); if (!lines) return;
  const row = document.createElement('p'); row.dataset['kind'] = /처치|공격|피해|강화|강타|레벨/.test(text) ? 'combat' : 'system';
  if(personal) row.className='self';
  const time = document.createElement('time'); time.textContent=new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'}); row.append(time,document.createTextNode((personal?'[개인] ':'')+text));
  row.hidden = logFilter==='combat' && row.dataset['kind']!=='combat';lines.append(row);while(lines.children.length>80)lines.firstElementChild?.remove();lines.scrollTop=lines.scrollHeight;
}
function toast(text: string) { const node = root.querySelector<HTMLElement>('#notice'); if (node) node.textContent = text; if(text && text!==lastLog){addLog(text);lastLog=text;} }
function errorText(e: unknown) { return e instanceof Error ? e.message : String(e); }
async function save(): Promise<void> {
  if (replacingSave || !session) return;
  if (saveTask) return saveTask;
  saveTask = (async () => {
    try { await writeSave(session.snapshot()); $('#save-status').textContent = '기기 저장 · ' + new Date().toLocaleTimeString('ko-KR', {hour:'2-digit',minute:'2-digit'}); }
    catch(e) { $('#save-status').textContent = '저장 실패'; session.message = '저장하지 못했습니다. 파일 백업을 이용하세요. ' + errorText(e); toast(session.message); }
    finally { saveTask = undefined; }
  })();
  return saveTask;
}
async function replaceSave(state: Save): Promise<void> {
  replacingSave = true;
  try { await saveTask; await writeSave(state); location.reload(); }
  catch(e) { replacingSave = false; throw e; }
}
async function boot() {
  initGameState();
  let storageError = '';
  try { remembered = await readSave(); } catch(e) { storageError = errorText(e); }
  root.innerHTML = `<section class="entry"><div class="entry-card"><span class="eyebrow">THE FIRST CHAPTER</span><h1>던전<br><em>zero</em></h1><p class="entry-lead">마을을 나서면 모험이 시작된다.</p><div class="entry-divider"></div><p>시작의 마을을 탐험하고, 골드를 모아<br>나만의 영지를 가꾸세요.</p><label>여행자의 이름<input id="name" maxlength="20" value="모험가" autocomplete="nickname"></label><label>모험의 길<select id="class"><option value="0">수호자 · 검과 방패</option><option value="10">별의 학자 · 마법</option><option value="18">숲의 방랑자 · 탐험</option></select></label><button id="start" class="primary">${remembered ? '새로운 여행 만들기' : '모험 시작하기'} <span>↗</span></button>${remembered ? '<button id="continue">이전 여행 이어하기</button>' : ''}${storageError ? '<button id="recover">백업 슬롯 복구</button>' : ''}<p id="entry-status" role="status"></p><small>단독 플레이 · 이 기기에 자동 저장<br>클라우드 저장은 입장 후 선택할 수 있습니다.</small></div></section>`;
  $('#entry-status').textContent = storageError;
  $('#start').onclick = () => { if (remembered && !confirm('기존 여행을 백업 슬롯에 보존하고 새로운 여행을 시작할까요?')) return; void enter(newSave($<HTMLInputElement>('#name').value, Number($<HTMLSelectElement>('#class').value))); };
  root.querySelector<HTMLElement>('#continue')?.addEventListener('click', () => void enter(remembered!));
  root.querySelector<HTMLElement>('#recover')?.addEventListener('click', () => { void readSave('backup').then(s => { if (!s) throw new Error('백업 슬롯이 없습니다.'); return enter(s); }).catch(e => { $('#entry-status').textContent = errorText(e); }); });
}
async function enter(state: Save) {
  const entryStatus = root.querySelector<HTMLElement>('#entry-status'); if (entryStatus) entryStatus.textContent = '시작의 마을을 펼치고 있습니다…';
  root.querySelectorAll<HTMLButtonElement>('.entry button').forEach(b => b.disabled = true);
  try {
    session = new LocalGameSession(state);
    game = await createRenderer(document.getElementById('game') as HTMLCanvasElement, {cameraOffset:{x:26,y:34,z:26},cameraFov:38,lockCamera:true});
    const classicScene=applyClassicScene(game.scene);
    buildTownDetails(game.scene);
    game.renderer.setPixelRatio(Math.min(devicePixelRatio, matchMedia('(max-width: 700px)').matches ? 1.1 : 1.5));
    game.renderer.shadowMap.enabled = !matchMedia('(max-width: 700px)').matches;
    game.setLocalPlayerName(session.state.player.name);
    mountHud();
    game.setMoveIntentHandler(i => session.dispatch({ type: 'move', x: i.targetX, z: i.targetZ }));
    game.setMobTargetHandler(id => { session.dispatch({type:'target',id}); game.setVfxTargetMobId(id); });
    const canvas = game.renderer.domElement;
    const feedback=createCombatFeedback(root,game.camera,canvas);
    mountTownSigns();
    let pointerStart: { x: number; y: number } | null = null;
    canvas.addEventListener('pointerdown', e => { pointerStart = {x:e.clientX,y:e.clientY}; });
    canvas.addEventListener('pointerup', e => { if (pointerStart && Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)<12) game.handleClick(e); pointerStart=null; });
    // Fixed diagonal camera: wheel and Q/E never orbit the scene.
    function resizeViewport() { const dock = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dock')) || 156; const height = Math.max(180, innerHeight-dock); game.renderer.setSize(innerWidth,height); game.camera.aspect=innerWidth/height;game.camera.updateProjectionMatrix(); }
    resizeViewport();
    window.addEventListener('resize', resizeViewport);
    window.addEventListener('keydown', e => {
      if ((e.target as HTMLElement).matches('input,select,textarea') || e.repeat) return;
      if(e.key==='Escape') { $('#panel').hidden=true; return; }
      if(e.key.toLowerCase()==='i') { e.preventDefault();showPanel('inventory');return; }
      const keys: Record<string, Intent['type']> = { ' ': 'attack', '1':'attack', '2':'skill', '3':'potion', 'r':'recall' };
      if(keys[e.key]) { e.preventDefault(); session.dispatch({type:keys[e.key]} as Intent); }

    });
    setConnected(false); setReady(true);
    Object.assign(window, { __DREAM_SESSION__:session, __DREAM_SAVE__:save });
    let last=performance.now(), accumulator=0, uiTime=0;
    function frame(now: number) {
      const elapsed=Math.min((now-last)/1000,.25); last=now; accumulator+=elapsed;
      while(accumulator>=.05) { session.tick(.05); accumulator-=.05; }
      syncScene(); game.tick(Math.min(elapsed,.05));classicScene.tick();const events=session.drainEvents();feedback.push(events);for(const event of events){addLog(event.text);if(event.text===session.message)lastLog=event.text;}feedback.tick(elapsed);positionTownSigns(); game.render();
      uiTime+=elapsed; if(uiTime>.15) { updateHud(); uiTime=0; }
      requestAnimationFrame(frame);
    }
    syncScene(); updateHud(); requestAnimationFrame(frame);
    await save(); setInterval(()=>void save(),15000);
    document.addEventListener('visibilitychange',()=>{ if(document.hidden) void save(); });
  } catch(e) { if(entryStatus?.isConnected) { entryStatus.textContent=`입장 실패: ${errorText(e)}`; root.querySelectorAll<HTMLButtonElement>('.entry button').forEach(b=>b.disabled=false); } else toast(`입장 실패: ${errorText(e)}`); }
}
function syncScene() {
  const p=session.state.player, y=snapEntityY(p.x,p.z);
  setPlayer({...getGameState().player,...p,y,powerStrikeCooldownEndMs:0});
  game.syncLocalPlayer(p.x,y,p.z,session.action,session.actionSeq,undefined,p.classId,0);
  game.syncPlayerVfx({hp:p.hp,level:p.level,action:session.action,actionSeq:session.actionSeq,x:p.x,y,z:p.z});
  for(const m of session.mobs) {
    if(m.hp===0) { if(!dead.has(m.id)) { game.removeMob(m.id); dead.add(m.id); } continue; }
    dead.delete(m.id);
    const snapshot={...m,y:snapEntityY(m.x,m.z)}; game.syncMob(snapshot); game.syncMobVfx(snapshot);
  }
  if(session.state.territory.garden!==gardenLevel) {
    gardenLevel=session.state.territory.garden;
    if(garden) { game.scene.remove(garden); garden.traverse(o=>{ if(o instanceof THREE.Mesh) {o.geometry.dispose(); (o.material as THREE.Material).dispose();} }); }
    garden=new THREE.Group();
    for(let i=0;i<gardenLevel;i++) {
      const soil=new THREE.Mesh(new THREE.BoxGeometry(2,.3,2),new THREE.MeshStandardMaterial({color:'#614832'})); soil.position.set(-10+i*3,snapEntityY(-10+i*3,-12)-.6,-12);
      const plant=new THREE.Mesh(new THREE.IcosahedronGeometry(.7),new THREE.MeshStandardMaterial({color:'#a3e2c4',emissive:'#387756',emissiveIntensity:.5})); plant.position.copy(soil.position).add(new THREE.Vector3(0,1,0)); garden.add(soil,plant);
    } game.scene.add(garden);
  }
}
function mountHud() {
  root.innerHTML=`<header class="top"><a class="brand" href="#">던전 zero</a><div class="chapter"><strong>시작의 마을</strong></div><button id="menu" aria-label="저장과 설정 열기">☰</button></header>
<section class="vitals card" aria-label="캐릭터 상태"><div class="player-line"><strong id="player-name"></strong><span id="level"></span></div><div class="bar hp"><i id="hp-bar"></i><span id="hp"></span></div><div class="bar mp"><i id="mp-bar"></i><span id="mp"></span></div><div class="bar xp" aria-label="경험치"><i id="xp-bar"></i></div><div id="xp-caption" class="xp-caption"></div></section>
<div class="wallet"><span>골드 <b id="gold">0</b></span><span>목재 <b id="wood">0</b></span></div>
<section class="classic-log card" aria-label="시스템과 개인 기록"><div class="log-tabs"><button data-log-filter="all" class="active">전체 기록</button><button data-log-filter="combat">전투</button><small>단독 모험</small></div><div id="log-lines" class="log-lines" role="log" aria-live="polite"></div><form id="log-form" class="log-compose"><label for="log-input">개인 기록</label><input id="log-input" maxlength="120" autocomplete="off" placeholder="기록할 내용을 입력하세요"><button type="submit">기록</button></form></section>
<section class="quest card"><h2>초보 사냥</h2><div id="quest-progress"></div><button id="hunt-guide">가까운 몬스터 찾기</button></section><section id="target" class="target" hidden></section>
<div class="bottom"><div class="hotbar-title"><span>단축 슬롯</span><span>FIXED VIEW</span></div><nav class="actions" aria-label="모험 행동"><button data-intent="attack" title="공격 전환 (1 또는 Space)">${classicIcon('sword')}<span>공격</span><small>1</small></button><button data-intent="skill" title="강타 (2)">${classicIcon('strike')}<span>강타</span><small id="skill-cooldown">2</small></button><button data-intent="potion" title="회복 물약 (3)">${classicIcon('potion')}<span id="potions">물약</span><small>3</small></button><button data-intent="recall" title="마을 귀환 (R)"><b>⌂</b><span>귀환</span><small>R</small></button><button id="estate"><b>♧</b><span>영지</span></button><button id="inventory">${classicIcon('armor')}<span>장비</span></button></nav><p class="control-hint">땅 클릭 이동 · 몬스터 선택 후 1 공격</p></div>
<div id="notice" role="status"></div><aside id="panel" class="panel card" hidden><button id="panel-close" class="close" aria-label="패널 닫기">×</button><div id="panel-content"></div></aside><footer id="save-status">저장 준비 중</footer>`;
  root.querySelectorAll<HTMLButtonElement>('[data-intent]').forEach(b=>b.onclick=()=>{session.dispatch({type:b.dataset['intent']} as Intent); updateHud();});
  $('#menu').onclick=()=>showPanel('save'); $('#estate').onclick=()=>showPanel('estate'); $('#inventory').onclick=()=>showPanel('inventory');
  $('#panel-close').onclick=()=>$('#panel').hidden=true;
  const panel=$('#panel');let drag:{x:number;y:number;left:number;top:number}|undefined;
  panel.addEventListener('pointerdown',e=>{if(innerWidth<=550||!(e.target as HTMLElement).closest('.inventory-heading'))return;const rect=panel.getBoundingClientRect();drag={x:e.clientX,y:e.clientY,left:rect.left,top:rect.top};panel.style.height=rect.height+'px';panel.style.bottom='auto';panel.setPointerCapture(e.pointerId);});
  panel.addEventListener('pointermove',e=>{if(!drag)return;panel.style.left=Math.max(0,Math.min(innerWidth-panel.offsetWidth,drag.left+e.clientX-drag.x))+'px';panel.style.top=Math.max(0,Math.min(innerHeight-panel.offsetHeight,drag.top+e.clientY-drag.y))+'px';panel.style.right='auto';});
  panel.addEventListener('pointerup',()=>{drag=undefined;});panel.addEventListener('pointercancel',()=>{drag=undefined;});
  window.addEventListener('resize',()=>{panel.style.left='';panel.style.top='';panel.style.right='';panel.style.height='';panel.style.bottom='';});
  $('#hunt-guide').onclick=()=>{
    const p=session.state.player;
    const m=session.mobs.filter(m=>m.hp>0).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];
    if(m) { session.dispatch({type:'target',id:m.id}); game.setVfxTargetMobId(m.id); session.dispatch({type:'attack'}); }
  };
  $('#log-form').onsubmit=e=>{e.preventDefault();const input=$<HTMLInputElement>('#log-input');if(input.value.trim())addLog(input.value.trim(),true);input.value='';};
  root.querySelectorAll<HTMLButtonElement>('[data-log-filter]').forEach(button=>button.onclick=()=>{logFilter=button.dataset['logFilter']!;root.querySelectorAll('[data-log-filter]').forEach(b=>b.classList.toggle('active',b===button));$('#log-lines').querySelectorAll<HTMLElement>('p').forEach(p=>p.hidden=logFilter==='combat'&&p.dataset['kind']!=='combat');});
  $('.brand').onclick=e=>e.preventDefault();
}
function updateHud() {
  const p=session.state.player;
  $('#player-name').textContent=p.name; $('#level').textContent=`Lv. ${p.level}`;
  $('#hp').textContent=`${p.hp} / ${maxHp(p)}`; $('#mp').textContent=`${p.mp} / 60`;
  $('#hp-bar').style.width=`${p.hp/maxHp(p)*100}%`; $('#mp-bar').style.width=`${p.mp/60*100}%`; $('#xp-bar').style.width=`${p.xp/xpNeeded(p)*100}%`;
  $('#xp-caption').textContent=`EXP ${p.xp} / ${xpNeeded(p)}`;
  $('.chapter strong').textContent=Math.hypot(p.x,p.z)<=24?'시작의 마을 · 안전 지역':'동쪽 사냥터 · 전투 지역';
  const skillButton=root.querySelector<HTMLButtonElement>('[data-intent="skill"]')!;$('#skill-cooldown').textContent=session.skillCooldown>.05?`${session.skillCooldown.toFixed(1)}s`:'2';skillButton.classList.toggle('cooling',session.skillCooldown>.05);skillButton.style.setProperty('--remaining',`${session.skillCooldown/4*100}%`);skillButton.title=`강타 · MP 12${session.skillCooldown>.05?' · 재사용 대기 중':''}`;
  $('#gold').textContent=p.gold.toLocaleString(); $('#wood').textContent=String(p.wood);
  $('#potions').textContent=`물약 ${p.potions}`; $('#quest-progress').textContent=`처치 ${p.kills} · 레벨 ${p.level} · 정원 ${session.state.territory.garden}단계`;
  const m=session.mobs.find(m=>m.id===session.target&&m.hp>0);
  $('#target').hidden=!m; if(m) $('#target').textContent=`${m.name} · HP ${m.hp} / ${m.maxHp}`;
  root.querySelector<HTMLButtonElement>('[data-intent="attack"]')!.classList.toggle('active',session.attacking);
  toast(session.message);
  if(!$('#panel').hidden) inventoryWindow?.refresh();
}
const signPoint=new THREE.Vector3();
function mountTownSigns(){const layer=document.createElement('div');layer.id='town-signs';for(const sign of TOWN_SIGNS){const button=document.createElement('button');button.id='sign-'+sign.id;button.textContent=sign.name;button.onclick=()=>{if(Math.hypot(session.state.player.x-sign.x,session.state.player.z-sign.z)>12){session.message='안내판 가까이 이동해주세요.';updateHud();return;}showPanel(sign.panel);};layer.append(button);}root.append(layer);}
function positionTownSigns(){const canvas=game.renderer.domElement.getBoundingClientRect();for(const sign of TOWN_SIGNS){const button=$('#sign-'+sign.id);signPoint.set(sign.x,snapEntityY(sign.x,sign.z)+2.1,sign.z).project(game.camera);button.hidden=signPoint.z>1||signPoint.z< -1||Math.abs(signPoint.x)>1||Math.abs(signPoint.y)>1;button.style.left=(canvas.left+(signPoint.x+1)*canvas.width/2)+'px';button.style.top=(canvas.top+(1-signPoint.y)*canvas.height/2)+'px';}}
function panelAction(id:string, type:Intent['type'], page:'estate'|'inventory') { $('#'+id).onclick=()=>{ session.dispatch({type} as Intent); showPanel(page); updateHud(); void save(); }; }
function showPanel(kind:'estate'|'inventory'|'save'|'help'|'shop') {
  $('#panel').hidden=false;
  inventoryWindow=undefined;
  if(kind!=='inventory'){const panel=$('#panel');panel.style.left='';panel.style.top='';panel.style.right='';panel.style.height='';panel.style.bottom='';}
  $('#panel').classList.toggle('inventory-panel',kind==='inventory');
  $('#panel').setAttribute('aria-label',kind==='inventory'?'장비와 소지품':'게임 메뉴');
  if(kind==='shop') {
    const p=session.state.player;
    $('#panel-content').innerHTML=`<span class="eyebrow">마을 보급 상점</span><h2>모험을 준비하세요</h2><div class="equipment-icon">${classicIcon('potion')}</div><h3>회복 물약</h3><p>체력 55 회복 · 최대 체력을 넘지 않습니다.</p><div class="stat-line">보유 골드 <b>${p.gold}</b></div><div class="stat-line">보유 물약 <b>${p.potions}개</b></div><button id="buy-one">1개 구매 · 골드 ${POTION_PRICE}</button><button id="buy-five">5개 구매 · 골드 ${POTION_PRICE*5}</button><p role="status" id="shop-message"></p><small>마을 보급 상점 근처에서 이용할 수 있습니다.</small>`;
    for(const [id,quantity] of [['buy-one',1],['buy-five',5]] as const){
      $<HTMLButtonElement>('#'+id).disabled=!canUsePotionShop(p)||p.gold<POTION_PRICE*quantity||p.potions+quantity>1000000;
      $('#'+id).onclick=()=>{session.dispatch({type:'buy-potion',quantity});const result=session.message;addLog(result);lastLog=result;showPanel('shop');$('#shop-message').textContent=result;updateHud();void save();};
    }
  } else if(kind==='help') {
    $('#panel-content').innerHTML='<span class="eyebrow">모험 안내</span><h2>시작의 마을</h2><p>땅을 클릭하여 이동합니다. 동쪽 사냥터에서 몬스터를 선택하고 1 키로 공격하세요.</p><p>2 강타 · 3 물약 · R 마을 귀환<br>마을 반경 안에서는 체력이 회복됩니다.</p><p>처치 보상으로 장비를 강화하고 목재를 모아 영지 정원을 건설할 수 있습니다.</p><button id="help-hunt">사냥터로 출발</button><small>여행은 15초마다 기기에 저장됩니다.</small>';
    $('#help-hunt').onclick=()=>{$('#panel').hidden=true;$('#hunt-guide').click();};
  } else if(kind==='estate') {
    const t=session.state.territory;
    $('#panel-content').innerHTML=`<span class="eyebrow">MY LITTLE TERRITORY</span><h2>영지 정원</h2><p>목재를 모아 정원을 가꾸면<br>플레이하는 동안 골드가 자랍니다.</p><div class="estate-illustration">♧ <span>✦</span> ♧</div><div class="stat-line">정원 단계 <b>${t.garden} / 5</b></div><div class="stat-line">수확 가능한 골드 <b>${Math.floor(t.stored)}</b></div><button id="gather">목재 채집 +3 · 마을 근처</button><button id="garden" class="primary">정원 ${t.garden?'확장':'건설'} · 목재 ${12+t.garden*6}</button><button id="collect">골드 수확</button><small>생산량은 최대 120개까지 보관됩니다.</small>`;
    panelAction('gather','gather','estate'); panelAction('garden','garden','estate'); panelAction('collect','collect','estate');
  } else if(kind==='inventory') {
    inventoryWindow=createInventoryWindow($('#panel-content'),()=>session.state.player,intent=>{session.dispatch(intent);updateHud();void save();},()=>showPanel('shop'));
  } else {
    $('#panel-content').innerHTML=`<span class="eyebrow">YOUR JOURNEY, KEPT SAFE</span><h2>여행 기록</h2><p>15초마다 이 기기에 저장합니다.<br>Google 로그인으로 다른 기기에 기록을 옮길 수 있습니다.</p><button id="save-now" class="primary">지금 기기에 저장</button><button id="export">저장 파일 내려받기</button><label class="import-label">저장 파일 가져오기<input id="import" type="file" accept="application/json"></label><div class="entry-divider"></div><p id="account">Google 계정 연결</p><button id="login">Google 로그인</button><button id="cloud-save">클라우드에 저장</button><button id="cloud-load">클라우드에서 불러오기</button><button id="logout">로그아웃</button><p id="cloud-status" role="status"></p><small>단독 모험 기록입니다. 온라인 랭킹·거래와 공유되지 않습니다.</small>`;
    $('#save-now').onclick=()=>void save();
    $('#export').onclick=()=>{const blob=new Blob([JSON.stringify({...session.snapshot(),updatedAt:Date.now()},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a'); a.href=url; a.download='Dungeon-zero-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
    $<HTMLInputElement>('#import').onchange=async e=>{try{const f=(e.target as HTMLInputElement).files?.[0];if(!f)return;if(f.size>50000)throw new Error('저장 파일이 너무 큽니다.'); const {validateSave}=await import('./session'); const s=validateSave(JSON.parse(await f.text())); if(confirm('현재 여행을 백업하고 파일의 여행으로 바꿀까요?')) {await replaceSave(s);}}catch(e){toast(errorText(e));}};
    const action=async(fn:(c:typeof import('./cloud'))=>Promise<void>)=>{try{cloud??=await import('./cloud');await fn(cloud);$('#account').textContent=cloud.auth.currentUser?.displayName??'Google 계정 연결';}catch(e){$('#cloud-status').textContent=errorText(e);}};
    $('#login').onclick=()=>void action(c=>c.login()); $('#logout').onclick=()=>void action(c=>c.logout());
    $('#cloud-save').onclick=()=>void action(async c=>{ const remote=await c.cloudLoad(); if(remote&&!confirm('클라우드의 기존 여행 기록을 현재 여행으로 덮어쓸까요?'))return;await c.cloudSave(session.snapshot());$('#cloud-status').textContent='클라우드 저장 완료'; });
    $('#cloud-load').onclick=()=>void action(async c=>{const s=await c.cloudLoad();if(!s)throw new Error('클라우드에 저장된 기록이 없습니다.');if(confirm('현재 여행을 기기에 백업하고 클라우드 기록으로 바꿀까요?')){await replaceSave(s);}});
  }
}
void boot();
