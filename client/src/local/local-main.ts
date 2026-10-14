import {bindPcMovement,gameKey,isTypingTarget} from './pc-controls';
import './game-scrollbars.css';
import {createGameScrollbars} from './game-scrollbars';
import {bindHuntButton} from './hunt-button';
import './inventory.css';
import { createInventoryWindow } from './inventory-window';
import './local.css';
import './hud-refresh.css';
import './mobile-shell.css';
import './entry-screen.css';
import './compact-hud.css';
import './unified-interface.css';
import './game-input-polish.css';
import './game-ui-feedback.css';
import './compact-windows.css';
import './ingame-layout.css';
import './mmorpg-interface.css';
import {nextWheelZoom} from './camera-wheel-zoom';
import {PinchZoomGesture} from './camera-pinch-zoom';
import {bindHotbarClickFeedback,flashActionSlot} from './hotbar-feedback';
import {fitEntryScreen} from './entry-fit';
import {entryScreen,ENTRY_CHARACTERS} from './entry-screen';
import {createMobileShell} from './mobile-shell';
import { pickTownFacility } from './town-interaction';
import {findDungeonApproach,hasArrivedAtDungeonApproach,type GatePoint} from './dungeon-approach';
import { ART_TRIALS } from './art-trial';
import { equippedWeaponVisualId } from './equipment-visual';
import { armorOutfitSelection, armorDefense } from './armor-economy';
import { activeQuest, canClaimQuest, questSummary, nearQuestBoard, validateQuest, } from './adventure-quests';
import { DUNGEON_GATE, DUNGEON_WAVES, DUNGEON_REWARD, dungeonSummary, dungeonWaveDone, dungeonBossDone, nearDungeonGate } from './first-dungeon';
import { buildFirstDungeonArt } from '../scene/first-dungeon-art';
import { createRuinAtmosphere } from '../scene/ruin-atmosphere';
import { buildFieldGroundCover } from '../scene/field-detail';
import {preloadMobVisualTemplates} from '../scene/mobs';
import { createBossThreatVisual } from '../scene/boss-threat-visual';
import { createResolutionGovernor } from './resolution-governor';
import {AutoHuntController,nextTabTarget,type HuntPriority} from './auto-hunt';
import {findBossDodgeDestination} from './boss-dodge';
import {createAdaptiveShadowGovernor} from './render-budget';
import {nameplateScreenPoint} from './screen-name-anchor';
import { fixedFrameForViewport } from './fixed-framing';
import { applyClassicScene } from './classic-scene';
import { classicIcon } from './classic-icons';
import { TOWN_SIGNS, buildTownDetails } from './town';
import { createCombatFeedback } from './feedback';
import * as THREE from 'three';
import { snapEntityY, EntityAction } from '@nj/game-core';
import { createRenderer, type GameRenderer } from '../scene/renderer';
import { initGameState, setReady, setConnected, setPlayer, getGameState } from '../test-hook';
import { isWeaponEquipped, POTION_PRICE, canUsePotionShop, LocalGameSession, newSave, maxHp, xpNeeded, attackPower, type Save, type Intent } from './session';
import { readSave, writeSave } from './saves';
import {createLatestSaveQueue} from './latest-save-queue';
const queuedSaves=createLatestSaveQueue(writeSave);

const root = document.createElement('main'); root.id = 'dream-ui'; document.body.append(root);
const $ = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
const requestedArt = new URLSearchParams(location.search).get('art') ?? 'original';
let artTrial = Object.hasOwn(ART_TRIALS, requestedArt) ? requestedArt : 'original';
let disposeEntryFit:(()=>void)|undefined;
let session: LocalGameSession;
let autoHunt:AutoHuntController|undefined;
let gameScrollbars:ReturnType<typeof createGameScrollbars>|undefined;
let pendingDungeonApproach:{point:GatePoint;startTime:number}|null=null;
let shownPanelKind:'estate'|'inventory'|'save'|'help'|'shop'|'dungeon'|'character'|null=null;
const mobileShell=createMobileShell({pause:()=>{if(autoHunt?.enabled||autoHunt?.approachingQuest)autoHunt.setEnabled(false);if(session){session.stopMovement();session.attacking=false;}},persist:async()=>{await saveTask;await writeSave(session.snapshot());}});
let game: GameRenderer;
let threatVisual:ReturnType<typeof createBossThreatVisual>|undefined;
let ruinAtmosphere:ReturnType<typeof createRuinAtmosphere>|undefined;
let saveTask: Promise<void> | undefined;
let saveRequest=0;
let replacingSave = false;
let cloud: typeof import('./cloud') | undefined;
let remembered: Save | null = null;
let inventoryWindow: ReturnType<typeof createInventoryWindow> | undefined;
let dead = new Set<string>();
let lastSceneMobIds=new Set<string>();
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
  const request=++saveRequest;
  const commit=queuedSaves.request(session.snapshot());
  const task = (async () => {
    try { await commit; $('#save-status').textContent = '기기 저장 · ' + new Date().toLocaleTimeString('ko-KR', {hour:'2-digit',minute:'2-digit'}); }
    catch(e) { $('#save-status').textContent = '저장 실패'; session.message = '저장하지 못했습니다. 파일 백업을 이용하세요. ' + errorText(e); toast(session.message); }
    finally { if(saveRequest===request)saveTask = undefined; }
  })();
  saveTask=task;
  return task;
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
  root.innerHTML=entryScreen(!!remembered,!!storageError);
  mobileShell.mountControls();
  disposeEntryFit=fitEntryScreen(root);
  $('#entry-status').textContent = storageError;
  const continueName=root.querySelector<HTMLElement>('#continue-name');if(continueName&&remembered)continueName.textContent=remembered.player.name;
  root.querySelectorAll<HTMLInputElement>('input[name="character"]').forEach(input=>input.addEventListener('change',()=>{
    const character=ENTRY_CHARACTERS.find(c=>c.id===Number(input.value))!;
    $('#selected-class-name').textContent=character.name;$('#selected-class-detail').textContent=character.detail;
  }));
  $<HTMLFormElement>('#entry-form').onsubmit=e=>{
    e.preventDefault();
    if(remembered&&!confirm('기존 여행을 백업 슬롯에 보존하고 새로운 여행을 시작할까요?'))return;
    const character=root.querySelector<HTMLInputElement>('input[name="character"]:checked')!;
    void enter(newSave($<HTMLInputElement>('#name').value,Number(character.value)));
  };
  root.querySelector<HTMLElement>('#continue')?.addEventListener('click', () => void enter(remembered!));
  root.querySelector<HTMLElement>('#recover')?.addEventListener('click', () => { void readSave('backup').then(s => { if (!s) throw new Error('백업 슬롯이 없습니다.'); return enter(s); }).catch(e => { $('#entry-status').textContent = errorText(e); }); });
}
async function enter(state: Save) {
  if(mobileShell.mobile)void mobileShell.fullscreen();
  const entryStatus = root.querySelector<HTMLElement>('#entry-status'); if (entryStatus) entryStatus.textContent = '시작의 마을을 펼치고 있습니다…';
  root.querySelectorAll<HTMLButtonElement>('.entry button').forEach(b => b.disabled = true);
  try {
    session = new LocalGameSession(state);
    // Request field monster rigs immediately, in parallel with terrain setup.
    const initialMobModels=preloadMobVisualTemplates(session.mobs);
    const fixedFrame=fixedFrameForViewport(innerWidth);
    game = await createRenderer(document.getElementById('game') as HTMLCanvasElement, {cameraOffset:fixedFrame.offset,cameraFov:fixedFrame.fov,lockCamera:true,playerManifest:ART_TRIALS[artTrial]});
    const classicScene=applyClassicScene(game.scene);
    buildTownDetails(game.scene);
    buildFirstDungeonArt(game.scene);
    buildFieldGroundCover(game.scene);
    threatVisual=createBossThreatVisual(game.scene);
    const mobile=matchMedia('(max-width: 700px)').matches;
    ruinAtmosphere=createRuinAtmosphere(game.scene,mobile);
    const quality=createResolutionGovernor(devicePixelRatio,mobile);
    const shadowBudget=createAdaptiveShadowGovernor(mobile);
    game.renderer.setPixelRatio(quality.dpr);
    game.renderer.shadowMap.enabled=shadowBudget.enabled;
    game.setLocalPlayerName(session.state.player.name);
    disposeEntryFit?.();disposeEntryFit=undefined;
    mountHud();
    mobileShell.mountControls();
    autoHunt=new AutoHuntController(session,id=>game.setVfxTargetMobId(id));
    const syncAutoButton=()=>{
      const button=root.querySelector<HTMLButtonElement>('#auto-hunt');
      if(!button)return;
      const travelling=!!autoHunt?.approachingQuest;
      const enabled=!!autoHunt?.enabled||travelling;
      const buttonText=travelling?'의뢰 자동이동 중 · 누르면 중단':enabled?'자동사냥 ON':'자동사냥 OFF';
      button.querySelector('#auto-mode')!.textContent=travelling?'이동':enabled?'ON':'OFF';
      button.setAttribute('aria-label',buttonText+' · 길게 눌러 설정');
      const pressed=String(enabled);
      if(button.getAttribute('aria-pressed')!==pressed)button.setAttribute('aria-pressed',pressed);
      button.classList.toggle('active',enabled);
      const status=root.querySelector<HTMLElement>('#auto-status');
      if(status){
        const reason=autoHunt?.stopReason;
        const progress=autoHunt?.progress;
        const elapsed=progress?.seconds??0;
        const duration=`${Math.floor(elapsed/60)}:${String(elapsed%60).padStart(2,'0')}`;
        const message=autoHunt?.approachingQuest?'의뢰 사냥터로 이동 중 · 다시 의뢰 버튼을 누르면 취소':enabled?`${autoHunt?.activity==='waiting'?autoHunt?.priority==='quest'?'의뢰 대상 리젠 대기':'범위 안 대상 대기':autoHunt?.activity==='blocked'?'막힌 경로 우회 대기':'사냥 중'} · ${autoHunt?.radius}m · ${autoHunt?.priority==='quest'?'현재 의뢰 대상':autoHunt?.priority==='normal-only'?'일반 몬스터 우선':autoHunt?.priority==='weakest'?'체력 낮은 몬스터':'가장 가까운 몬스터'} · ${duration} · 처치 ${progress?.kills??0} · +${progress?.gold??0}G`:
          reason==='dungeon-ready'?'구역 정리 완료 · 던전 안내에서 다음 행동을 선택하세요.':
          reason==='quest-ready'?'의뢰 목표 달성 · 자동사냥 중단 · 마을에서 보상을 받으세요.':
          reason==='quest-complete'?'마을 의뢰를 모두 완료했습니다. 다른 사냥 기준을 선택하세요.':
          reason==='quest-unavailable'?'마을 의뢰 사냥은 필드에서만 사용할 수 있습니다.':
          reason==='low-hp'?'체력이 부족해 자동사냥이 중단되었습니다.':
          reason==='range'?'설정한 사냥 범위를 벗어나 자동 중단되었습니다.':
          reason==='zone-change'?'필드·던전 전환으로 자동 중단되었습니다.':'';
        if(status.textContent!==message)status.textContent=message;
      }
    };
    const openHuntSettings=()=>{
      if(pendingDungeonApproach){pendingDungeonApproach=null;session.stopMovement();}
      $('#panel').hidden=true;$('.quest').classList.add('hunt-settings-open');
      $<HTMLDetailsElement>('#hunt-tools').open=true;$<HTMLDetailsElement>('#auto-config').open=true;$('.quest').scrollTop=0;
    };
    bindHuntButton($<HTMLButtonElement>('#auto-hunt'),()=>{
      pendingDungeonApproach=null;
      autoHunt!.setEnabled(autoHunt!.approachingQuest?false:!autoHunt!.enabled);
      syncAutoButton();
    },openHuntSettings);
    $<HTMLButtonElement>('#hunt-config-toggle').onclick=()=>{
      if($('.quest').classList.contains('hunt-settings-open'))$('.quest').classList.remove('hunt-settings-open');
      else openHuntSettings();
    };
    const readHuntOptions=()=>{
      autoHunt!.configure({
        radius:Number($<HTMLSelectElement>('#auto-radius').value),
        priority:$<HTMLSelectElement>('#auto-priority').value as HuntPriority,
        potionThreshold:Number($<HTMLSelectElement>('#auto-potion').value),
      });
      syncAutoButton();
    };
    for(const id of ['#auto-radius','#auto-priority','#auto-potion'])
      $(id).addEventListener('change',readHuntOptions);
    const manualStop=()=>{pendingDungeonApproach=null;if(autoHunt?.enabled||autoHunt?.approachingQuest){autoHunt.setEnabled(false);syncAutoButton();}};
    const keyboardMovement=bindPcMovement({window,blocked:()=>mobileShell.paused||!$('#panel').hidden||$('.quest').classList.contains('hunt-settings-open'),
      start:()=>{manualStop();session.stopMovement();},stop:()=>session.stopMovement(),
      move:direction=>{const p=session.state.player;session.dispatch({type:'move',x:p.x+direction.x*3.6,z:p.z+direction.z*3.6});}});
    game.renderer.domElement.addEventListener('pointerdown',()=>keyboardMovement.cancel());
    root.addEventListener('pointerdown',()=>keyboardMovement.cancel());
    game.setMoveIntentHandler(i => { manualStop();session.dispatch({ type: 'move', x: i.targetX, z: i.targetZ }); });
    game.setMobTargetHandler(id => { manualStop();session.dispatch({type:'target',id}); game.setVfxTargetMobId(id); });
    const canvas = game.renderer.domElement;
    const feedback=createCombatFeedback(root,game.camera,canvas);
    mountTownSigns();
    let cameraWheelZoom=1;
    const pinch=new PinchZoomGesture();
    let pointerStart: { x: number; y: number } | null = null;
    canvas.addEventListener('pointerdown', e => {
      pointerStart=e.isPrimary&&e.button===0?{x:e.clientX,y:e.clientY}:null;
      if(e.pointerType==='touch'&&pinch.pointerDown(e.pointerId,e.clientX,e.clientY))pointerStart=null;
    });
    canvas.addEventListener('pointermove',e=>{
      if(e.pointerType!=='touch')return;
      const next=pinch.pointerMove(e.pointerId,e.clientX,e.clientY,cameraWheelZoom);
      if(next===null||mobileShell.paused)return;
      cameraWheelZoom=next;
      game.setCameraZoom(cameraWheelZoom);
    });
    canvas.addEventListener('pointerup', e => {
      // Both fingers of a pinch must be released before a world tap is permitted.
      if(e.pointerType==='touch'&&pinch.pointerUp(e.pointerId)){pointerStart=null;return;}
      if(!e.isPrimary||e.button!==0){pointerStart=null;return;}
      const tapped=pointerStart && Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)<12;
      pointerStart=null;
      if(!tapped)return;
      const facility=session.state.player.dungeon!.inside?undefined:
        pickTownFacility(game.scene,game.camera,canvas.getBoundingClientRect(),e.clientX,e.clientY);
      if(facility){if(facility.id==='dungeon')requestDungeonApproach();else {manualStop();session.stopMovement();togglePanel(facility.panel);}}
      else game.handleClick(e);
    });
    canvas.addEventListener('pointercancel',e=>{
      if(e.pointerType==='touch')pinch.pointerUp(e.pointerId);
      pointerStart=null;
    });
    canvas.addEventListener('wheel',e=>{
      e.preventDefault();
      if(mobileShell.paused)return;
      cameraWheelZoom=nextWheelZoom(cameraWheelZoom,e.deltaY);
      game.setCameraZoom(cameraWheelZoom);
    },{passive:false});
    // Q/E never orbit the scene; wheel only changes bounded distance.
    let lastCameraMode=innerWidth<=700?'mobile':'desktop';
    function resizeViewport() {
      const height=Math.max(180,innerHeight);
      game.renderer.setSize(innerWidth,height);
      game.camera.aspect=innerWidth/height;game.camera.updateProjectionMatrix();
      const mode=innerWidth<=700?'mobile':'desktop';
      if(mode!==lastCameraMode){
        lastCameraMode=mode;
        const next=fixedFrameForViewport(innerWidth);
        game.setCameraFraming?.(next.offset,next.fov);
      }
    }
    resizeViewport();
    window.addEventListener('resize', resizeViewport);
    window.visualViewport?.addEventListener('resize',resizeViewport);
    window.addEventListener('keydown', e => {
      if(mobileShell.paused)return;
      if (isTypingTarget(e.target) || e.repeat) return;
      const key=gameKey(e);if(!key)return;
      if((e.key===' '||e.key==='Enter')&&(e.target as HTMLElement).closest('button,[role=button]'))return;
      if(key==='escape') { keyboardMovement.cancel();pendingDungeonApproach=null;$('.quest').classList.remove('hunt-settings-open'); manualStop(); $('#panel').hidden=true; return; }
      if(key==='i'||key==='b') { e.preventDefault();keyboardMovement.cancel();togglePanel('inventory');return; }
      const panels={c:'character',j:'help',o:'save',t:'estate'} as const;
      if(Object.hasOwn(panels,key)){e.preventDefault();keyboardMovement.cancel();togglePanel(panels[key as keyof typeof panels]);return;}
      if(!$('#panel').hidden||$('.quest').classList.contains('hunt-settings-open'))return;
      if(key==='q'){e.preventDefault();keyboardMovement.cancel();dodgeBossAttack();return;}
      if(key==='tab'){e.preventDefault();keyboardMovement.cancel();manualStop();const id=nextTabTarget(session);if(id){session.dispatch({type:'target',id});game.setVfxTargetMobId(id);}updateHud();return;}
      if(key==='h'){e.preventDefault();keyboardMovement.cancel();autoHunt!.setEnabled(autoHunt!.approachingQuest?false:!autoHunt!.enabled);syncAutoButton();updateHud();return;}
      const keys: Record<string, Intent['type']> = { ' ': 'attack', '1':'attack', '2':'skill', '3':'potion', 'r':'recall' };
      if(keys[key]) { e.preventDefault(); if(keys[key]!=='skill'&&keys[key]!=='potion'){keyboardMovement.cancel();manualStop();}flashActionSlot(root.querySelector<HTMLElement>('[data-intent="'+keys[key]+'"]'));session.dispatch({type:keys[key]} as Intent); }

    });
    // Normally make the starting field GLBs ready before enabling play.
    // A slow/offline asset service cannot trap the user on the entry screen.
    await Promise.race([initialMobModels,new Promise<void>(resolve=>setTimeout(resolve,3000))]);
    setConnected(false); setReady(true);
    Object.assign(window, { __DREAM_SESSION__:session, __DREAM_SAVE__:save,
      __DREAM_MOB_RENDER_STATUS__:()=>game.getMobRenderStatus(),
       __DREAM_CAMERA_ZOOM__:()=>cameraWheelZoom });
    let last=performance.now(), accumulator=0, uiTime=0,shadowTime=0;
    function frame(now: number) {
      const elapsed=Math.min((now-last)/1000,.25); last=now; accumulator+=elapsed;
      if(mobileShell.paused)accumulator=0;
      while(accumulator>=.05) { keyboardMovement.tick(.05);autoHunt?.tick(.05);session.tick(.05); accumulator-=.05; }
      syncAutoButton();
      if(pendingDungeonApproach){
        const approach=pendingDungeonApproach,p=session.state.player;
        if(p.hp<=0||p.dungeon!.inside||!$('#panel').hidden){pendingDungeonApproach=null;}
        else if(hasArrivedAtDungeonApproach(p,approach.point)){
          pendingDungeonApproach=null;session.stopMovement();showPanel('dungeon');
        }else if(performance.now()-approach.startTime>24000){
          pendingDungeonApproach=null;session.stopMovement();
          session.message='관문까지 도착하지 못했습니다. 길을 다시 선택해 주세요.';
        }
      }
      const perf=quality.sample(elapsed);
      if(perf.changed)game.renderer.setPixelRatio(perf.dpr);
      shadowTime+=elapsed;
      if(shadowTime>=2.5){
        shadowTime=0;
        const decision=shadowBudget.sample(perf.fps,perf.dpr);
        if(decision.changed)game.renderer.shadowMap.enabled=decision.enabled;
        const label=root.querySelector<HTMLElement>('#quality-info');
        if(label)label.textContent=`AUTO ${Math.round(perf.fps)} FPS · ${perf.dpr.toFixed(2)}× · ${game.renderer.info.render.calls} calls`;
      }
      syncScene(); game.tick(Math.min(elapsed,.05));classicScene.tick();const events=session.drainEvents();feedback.push(events);for(const event of events){if(!keyboardMovement.active)autoHunt?.handleHit(event);addLog(event.text);if(event.text===session.message)lastLog=event.text;}feedback.tick(elapsed);positionTownSigns(); positionPlayerOverheadName();game.render();
      uiTime+=elapsed; if(uiTime>.15) { updateHud(); uiTime=0; }
      requestAnimationFrame(frame);
    }
    mobileShell.arm();
    syncScene(); updateHud(); requestAnimationFrame(frame);
    await save(); setInterval(()=>void save(),15000);
    document.addEventListener('visibilitychange',()=>{ if(document.hidden){manualStop();void save();} });
  } catch(e) { if(entryStatus?.isConnected) { entryStatus.textContent=`입장 실패: ${errorText(e)}`; root.querySelectorAll<HTMLButtonElement>('.entry button').forEach(b=>b.disabled=false); } else toast(`입장 실패: ${errorText(e)}`); }
}
function syncScene() {
  const p=session.state.player, y=snapEntityY(p.x,p.z);
  ruinAtmosphere?.setActive(p.dungeon!.inside);
  threatVisual?.update(session.bossThreat);
  setPlayer({...getGameState().player,...p,y,powerStrikeCooldownEndMs:0});
  game.syncLocalPlayer(p.x,y,p.z,session.action,session.actionSeq,equippedWeaponVisualId(p),p.classId,0,armorOutfitSelection(p.armor));
  game.syncPlayerVfx({hp:p.hp,level:p.level,action:session.action,actionSeq:session.actionSeq,x:p.x,y,z:p.z});
  const seen=new Set<string>();
  for(const m of session.mobs) {
    seen.add(m.id);
    if(m.hp===0) { if(!dead.has(m.id)) { game.removeMob(m.id); dead.add(m.id); } continue; }
    dead.delete(m.id);
    const snapshot={...m,y:snapEntityY(m.x,m.z)}; game.syncMob(snapshot); game.syncMobVfx(snapshot);
  }
  for(const id of lastSceneMobIds)if(!seen.has(id)){game.removeMob(id);dead.delete(id);}
  lastSceneMobIds=seen;
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
function dodgeBossAttack():void {
  pendingDungeonApproach=null;
  if(autoHunt?.enabled||autoHunt?.approachingQuest)autoHunt.setEnabled(false);
  const p=session.state.player;
  const destination=findBossDodgeDestination(session.bossThreat,p,!!p.dungeon?.inside);
  if(destination)session.dispatch({type:'move',x:destination.x,z:destination.z});
  else session.message=session.bossThreat
    ?'회피 경로가 없거나 공격까지 시간이 부족합니다. 직접 이동하세요.'
    :'정예 몬스터가 공격을 준비할 때 사용할 수 있습니다.';
  updateHud();
}
/** World and sign clicks walk to the entrance before opening the dialog.
 * The manual journal button can still show quest information from anywhere.
 */
function requestDungeonApproach():void{
  pendingDungeonApproach=null;
  if(autoHunt?.enabled||autoHunt?.approachingQuest)autoHunt.setEnabled(false);
  session.stopMovement();
  const p=session.state.player;
  const distance=Math.hypot(p.x-DUNGEON_GATE.x,p.z-DUNGEON_GATE.z);
  if(distance<=4.0){togglePanel('dungeon');return;}
  const point=findDungeonApproach(p);
  if(!point){
    session.message='관문까지 걸어갈 수 있는 길을 찾지 못했습니다.';
    updateHud();return;
  }
  $('#panel').hidden=true;
  session.dispatch({type:'move',x:point.x,z:point.z});
  pendingDungeonApproach={point,startTime:performance.now()};
  session.message='폐허 관문으로 이동 중 · 도착하면 입장창이 열립니다.';
  updateHud();
}
function mountHud() {
  root.innerHTML=`<header class="top" aria-label="게임 옵션"><button id="menu" aria-label="게임 옵션 열기" title="게임 옵션">${classicIcon('settings')}</button></header>
<section class="vitals card" role="button" tabindex="0" aria-label="캐릭터 상세 정보 열기" title="캐릭터 상세 정보"><div class="player-line"><strong id="player-name"></strong><span id="level"></span></div><div class="bar hp"><i id="hp-bar"></i><span id="hp"></span></div><div class="bar mp"><i id="mp-bar"></i><span id="mp"></span></div><div class="bar xp" aria-label="경험치"><i id="xp-bar"></i></div><div id="xp-caption" class="xp-caption"></div></section>
<div class="wallet"><span>골드 <b id="gold">0</b></span><span>목재 <b id="wood">0</b></span><span>방어력 <b id="defense">0</b></span></div>
<section class="classic-log card" aria-label="시스템과 개인 기록"><div class="log-tabs"><button data-log-filter="all" class="active">전체 기록</button><button data-log-filter="combat">전투</button><small>단독 모험</small></div><div id="log-lines" class="log-lines" role="log" aria-live="polite"></div><form id="log-form" class="log-compose"><label for="log-input">개인 기록</label><input id="log-input" maxlength="120" autocomplete="off" placeholder="기록할 내용을 입력하세요"><button type="submit">기록</button></form></section>
<section class="quest card" aria-label="의뢰 및 사냥 설정"><button id="quest-mini" type="button" title="의뢰 현황 열기"></button><button id="hunt-close" type="button" aria-label="사냥 설정 닫기">×</button><h2>사냥 설정</h2><div id="quest-progress"></div><button id="quest-journal">의뢰 현황 · 보상</button><button id="dungeon-journal">폐허의 시련</button><details id="hunt-tools"><summary>사냥 보조</summary><div class="hunt-tools-body"><button id="quest-target">의뢰 자동이동 · 사냥</button><button id="hunt-guide">가까운 몬스터 찾기</button><button id="next-target" type="button" title="Tab 키와 동일한 다음 몬스터 선택">다음 타깃 · Tab</button>
 <details id="auto-config"><summary>자동사냥 설정</summary><div class="auto-config-fields">
 <label for="auto-retaliate"><input id="auto-retaliate" type="checkbox" checked> 피격 시 자동사냥 · 수동 중단 시 해제</label>
 <label for="auto-radius">사냥 반경<select id="auto-radius"><option value="12">12m</option><option value="20">20m</option><option value="28" selected>28m</option></select></label>
 <label for="auto-priority">타깃 기준<select id="auto-priority"><option value="nearest">가까운 적</option><option value="weakest">체력 낮은 적</option><option value="normal-only">정예 제외</option><option value="quest">현재 의뢰 대상 · 정예 포함</option></select></label>
 <label for="auto-potion">물약 자동 사용<select id="auto-potion"><option value="0" selected>사용 안 함</option><option value="0.35">HP 35% 이하</option><option value="0.5">HP 50% 이하</option><option value="0.65">HP 65% 이하</option></select></label>
 </div></details></div></details><div id="auto-status" role="status" aria-live="polite"></div></section><section id="target" class="target" hidden></section><section id="boss-warning" class="boss-warning" role="status" hidden></section><button id="boss-dodge" type="button" title="Q 키 · 기존 이동 속도로 공격 예고 범위 벗어나기" hidden>회피 · Q</button>
<div class="auto-control"><button id="hunt-config-toggle" type="button" title="자동사냥 설정 열기" aria-label="사냥 설정 열기">⚙</button><button id="auto-hunt" type="button" aria-pressed="false" aria-label="자동사냥 OFF · 길게 눌러 설정" title="터치: ON/OFF · 길게 누르기: 설정 · H: 전환"><b aria-hidden="true">A</b><span id="auto-mode" aria-hidden="true">OFF</span></button></div><div class="bottom"><div class="hotbar-title"><span>단축 슬롯</span><span id="quality-info" aria-label="화질 자동 조절">AUTO</span></div><nav class="actions" aria-label="모험 행동"><button data-intent="attack" title="공격 전환 (1 또는 Space)">${classicIcon('sword')}<span>공격</span><small>1</small></button><button data-intent="skill" title="강타 (2)">${classicIcon('strike')}<span>강타</span><small id="skill-cooldown">2</small></button><button data-intent="potion" title="회복 물약 (3)">${classicIcon('potion')}<span id="potions">물약</span><small>3</small></button><button data-intent="recall" title="마을 귀환 (R)">${classicIcon('recall')}<span>귀환</span><small>R</small></button><button id="estate">${classicIcon('estate')}<span>영지</span></button><button id="inventory">${classicIcon('armor')}<span>장비</span></button></nav><p class="control-hint">WASD / 방향키 이동 · Space 공격 · Tab 대상 · H 자동사냥</p></div>
<div id="player-overhead-name" aria-hidden="true" hidden></div><div id="notice" role="status"></div><aside id="panel" class="panel card" hidden><button id="panel-close" class="close" aria-label="패널 닫기">×</button><div id="panel-content"></div></aside><div id="screen-status" role="status"></div><footer id="save-status">저장 준비 중</footer>`;
  bindHotbarClickFeedback(root);
  root.querySelectorAll<HTMLButtonElement>('[data-intent]').forEach(b=>b.onclick=()=>{if(b.dataset['intent']!=='skill'&&b.dataset['intent']!=='potion'){pendingDungeonApproach=null;autoHunt?.setEnabled(false);}session.dispatch({type:b.dataset['intent']} as Intent); updateHud();});
  $('.vitals').onclick=()=>togglePanel('character');
  $('.vitals').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();togglePanel('character');}};
  $<HTMLInputElement>('#auto-retaliate').onchange=e=>{if(autoHunt)autoHunt.retaliateOnHit=(e.target as HTMLInputElement).checked;};
  $('#menu').onclick=()=>togglePanel('save'); $('#estate').onclick=()=>togglePanel('estate'); $('#inventory').onclick=()=>togglePanel('inventory');
  $('#panel-close').onclick=()=>$('#panel').hidden=true;
  const panel=$('#panel'); // Fixed in-game window; native mouse dragging is disabled.
  window.addEventListener('resize',()=>{panel.style.left='';panel.style.top='';panel.style.right='';panel.style.height='';panel.style.bottom='';});
  $('#boss-dodge').onclick=dodgeBossAttack;
  $('#quest-mini').onclick=()=>togglePanel(session.state.player.dungeon!.inside?'dungeon':'help');
  $('#hunt-close').onclick=()=>{$('.quest').classList.remove('hunt-settings-open');$('#auto-hunt').focus();};
  $('#quest-journal').onclick=()=>togglePanel('help');
  $('#dungeon-journal').onclick=()=>togglePanel('dungeon');
  $('#next-target').onclick=()=>{
    if(autoHunt?.enabled||autoHunt?.approachingQuest)autoHunt.setEnabled(false);
    const id=nextTabTarget(session);
    if(id){session.dispatch({type:'target',id});game.setVfxTargetMobId(id);}
    updateHud();
  };
  $('#quest-target').onclick=()=>{
    if(autoHunt?.approachingQuest||(autoHunt?.enabled&&autoHunt.priority==='quest')){
      autoHunt.setEnabled(false);
      session.message='의뢰 자동이동·사냥을 중단했습니다.';
    }else{
      pendingDungeonApproach=null;
      autoHunt?.startQuestHunt();
    }
    updateHud();
  };
  $('#hunt-guide').onclick=()=>{
    if(autoHunt?.enabled||autoHunt?.approachingQuest)autoHunt.setEnabled(false);
    const p=session.state.player;
    const m=session.mobs.filter(m=>m.hp>0 && (session.state.player.dungeon!.inside===m.id.startsWith('dungeon-'))).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];
    if(m) { session.dispatch({type:'target',id:m.id}); game.setVfxTargetMobId(m.id); session.dispatch({type:'attack'}); }
  };
  $('#log-form').onsubmit=e=>{e.preventDefault();const input=$<HTMLInputElement>('#log-input');if(input.value.trim())addLog(input.value.trim(),true);input.value='';};
  root.querySelectorAll<HTMLButtonElement>('[data-log-filter]').forEach(button=>button.onclick=()=>{logFilter=button.dataset['logFilter']!;root.querySelectorAll('[data-log-filter]').forEach(b=>b.classList.toggle('active',b===button));$('#log-lines').querySelectorAll<HTMLElement>('p').forEach(p=>p.hidden=logFilter==='combat'&&p.dataset['kind']!=='combat');});
  gameScrollbars=createGameScrollbars(root);gameScrollbars.update();
}
function updateHud() {
  $<HTMLInputElement>('#auto-retaliate').checked=autoHunt?.retaliateOnHit??true;
  if(autoHunt)$<HTMLSelectElement>('#auto-priority').value=autoHunt.priority;
  if(!$('#panel').hidden&&shownPanelKind==='help')refreshQuestPanel();
  if(!$('#panel').hidden&&shownPanelKind==='dungeon')refreshDungeonPanel();
  if(!$('#panel').hidden&&shownPanelKind==='character')refreshCharacterPanel();
  const p=session.state.player;
  $('#player-name').textContent=p.name; $('#level').textContent=`Lv. ${p.level}`;
  const overhead=root.querySelector<HTMLElement>('#player-overhead-name');if(overhead&&overhead.textContent!==p.name)overhead.textContent=p.name;
  $('#hp').textContent=`${p.hp} / ${maxHp(p)}`; $('#mp').textContent=`${p.mp} / 60`;
  $('#hp-bar').style.width=`${p.hp/maxHp(p)*100}%`; $('#mp-bar').style.width=`${p.mp/60*100}%`; $('#xp-bar').style.width=`${p.xp/xpNeeded(p)*100}%`;
  $('#xp-caption').textContent=`EXP ${p.xp} / ${xpNeeded(p)}`;
  const skillButton=root.querySelector<HTMLButtonElement>('[data-intent="skill"]')!;$('#skill-cooldown').textContent=session.skillCooldown>.05?`${session.skillCooldown.toFixed(1)}s`:'2';skillButton.classList.toggle('cooling',session.skillCooldown>.05);skillButton.style.setProperty('--remaining',`${session.skillCooldown/4*100}%`);skillButton.title=`${isWeaponEquipped(p)?'강타 · MP 12':'강타 · 무기 장착 필요'}${session.skillCooldown>.05?' · 재사용 대기 중':''}`;
  $('#gold').textContent=p.gold.toLocaleString(); $('#wood').textContent=String(p.wood); $('#defense').textContent=String(armorDefense(p.armor));
  $('#potions').textContent=`물약 ${p.potions}`; $('#quest-progress').textContent=p.dungeon!.inside?dungeonSummary(p.dungeon!):`${questSummary(validateQuest(p.quest))} · ${canClaimQuest(p.quest!)?'목표 달성 · 마을 보상 수령':activeQuest(p.quest!)?.description??'폐허의 시련에 도전하세요.'}`;
  $('#quest-mini').title=p.dungeon!.inside?'현재 던전 진행 열기':activeQuest(p.quest!)?.description??'폐허 관문으로 이동해 첫 던전에 도전하세요.';
  $('#quest-mini').textContent=p.dungeon!.inside?dungeonSummary(p.dungeon!):canClaimQuest(p.quest!)?'의뢰 달성 · 마을에서 보상 받기':questSummary(validateQuest(p.quest))+' · '+(activeQuest(p.quest!)?.description??'완료');
  const warning=session.bossWarning;$('#boss-warning').hidden=!warning;$('#boss-warning').textContent=warning;
  $('#boss-dodge').hidden=!warning;
  if(warning){
    // Fixed top offsets overlapped the compact HUD, especially at 320px.
    const rootTop=root.getBoundingClientRect().top;
    const hudBottom=Math.max($('.vitals').getBoundingClientRect().bottom,$('#quest-mini').getBoundingClientRect().bottom);
    $('#boss-warning').style.top=(hudBottom-rootTop+8)+'px';
    $('#boss-dodge').style.top=($('#boss-warning').getBoundingClientRect().bottom-rootTop+8)+'px';
  }
  const m=session.mobs.find(m=>m.id===session.target&&m.hp>0);
  $('#target').hidden=!m; $('#target').classList.toggle('elite-target',!!m&&m.name==='숲의 정예 감시자'); if(m) $('#target').textContent=`${m.name==='숲의 정예 감시자'?'정예 · ':''}${m.name} · HP ${m.hp} / ${m.maxHp}`;
  root.querySelector<HTMLButtonElement>('[data-intent="attack"]')!.classList.toggle('active',session.attacking);
  toast(session.message);
  if(!$('#panel').hidden) inventoryWindow?.refresh();
  gameScrollbars?.update();
}
const signPoint=new THREE.Vector3();
const overheadPoint=new THREE.Vector3();
/** Screen-constant 14–15px text fixes unreadable perspective-scaled 3D sprites.
 * Uses the existing avatar nameplate's exact world transform as the anchor.
 * Pointer clicks still pass through to the world, and online avatars keep
 * their original 3D sprite rendering (this is local mode only).
 */
function positionPlayerOverheadName():void{
  const label=root.querySelector<HTMLElement>('#player-overhead-name');
  const avatar=game.scene.getObjectByName('player-avatar');
  const sprite=avatar?.getObjectByName('nameplate');
  if(!label||!sprite){if(label)label.hidden=true;return;}
  sprite.visible=false;
  sprite.getWorldPosition(overheadPoint).project(game.camera);
  const bounds=game.renderer.domElement.getBoundingClientRect();
  const pixel=nameplateScreenPoint(overheadPoint,bounds);
  label.hidden=!pixel;
  if(!pixel)return;
  const left=pixel.x+'px',top=pixel.y+'px';
  if(label.style.left!==left)label.style.left=left;
  if(label.style.top!==top)label.style.top=top;
}

function mountTownSigns(){const layer=document.createElement('div');layer.id='town-signs';for(const sign of TOWN_SIGNS){const button=document.createElement('button');button.id='sign-'+sign.id;button.textContent=sign.name;button.onclick=()=>{if(sign.id==='dungeon')requestDungeonApproach();else {pendingDungeonApproach=null;if(autoHunt?.enabled||autoHunt?.approachingQuest)autoHunt.setEnabled(false);session.stopMovement();togglePanel(sign.panel);}};layer.append(button);}root.append(layer);}
function positionTownSigns(){const canvas=game.renderer.domElement.getBoundingClientRect();for(const sign of TOWN_SIGNS){const button=$('#sign-'+sign.id);signPoint.set(sign.x,snapEntityY(sign.x,sign.z)+2.1,sign.z).project(game.camera);button.hidden=session.state.player.dungeon!.inside||signPoint.z>1||signPoint.z< -1||Math.abs(signPoint.x)>1||Math.abs(signPoint.y)>1;button.style.left=(canvas.left+(signPoint.x+1)*canvas.width/2)+'px';button.style.top=(canvas.top+(1-signPoint.y)*canvas.height/2)+'px';}}
function refreshCharacterPanel(){
  const p=session.state.player,node=$('#character-stats');if(!node)return;
  const rows=[['이름',p.name],['레벨',p.level],['HP',p.hp+' / '+maxHp(p)],['MP',p.mp+' / 60'],['경험치',p.xp+' / '+xpNeeded(p)],['공격력',attackPower(p)],['방어력',armorDefense(p.armor)],['무기',isWeaponEquipped(p)?'장착 · +'+p.weapon:'미장착'],['처치',p.kills],['골드',p.gold],['물약',p.potions]];
  // Names originate in user saves: render all values as text, never HTML.
  node.replaceChildren(...rows.map(([label,value])=>{const row=document.createElement('div');row.className='stat-line';const key=document.createElement('span'),val=document.createElement('b');key.textContent=String(label);val.textContent=String(value);row.append(key,val);return row;}));
}
function refreshQuestPanel(){
  const p=session.state.player,q=p.quest!,quest=activeQuest(q);
  if($('#panel-content').dataset['questStage']!==String(q.stage)){showPanel('help');return;}
  $('#quest-detail').textContent=quest?q.progress+' / '+quest.required:'3 / 3';
  const claim=root.querySelector<HTMLButtonElement>('#quest-claim');
  if(claim){claim.disabled=!canClaimQuest(q);claim.textContent=nearQuestBoard(p.x,p.z)&&!p.dungeon!.inside?'의뢰 보상 수령':'마을 귀환 후 보상 수령';}
  const next=$('#help-quest-target');
  if(next){
    const hunting=autoHunt?.approachingQuest||(autoHunt?.enabled&&autoHunt.priority==='quest');
    next.textContent=p.dungeon!.inside?'현재 던전 진행 보기':!quest?'폐허 관문으로 자동이동':canClaimQuest(q)?'보상 수령 · 다음 의뢰':hunting?'의뢰 자동이동·사냥 중단':'의뢰 자동이동 · 사냥';
    next.classList.toggle('primary',!hunting);
    next.setAttribute('aria-label',next.textContent);
  }
}
function refreshDungeonPanel(){
  const p=session.state.player,d=p.dungeon!,ready=dungeonWaveDone(d),boss=dungeonBossDone(d);
  const phase=String(d.inside)+':'+d.wave+':'+p.quest!.stage;
  if($('#panel-content').dataset['dungeonPhase']!==phase){showPanel('dungeon');return;}
  const progress=$('#dungeon-progress');if(progress)progress.textContent=d.inside?d.kills+' / '+DUNGEON_WAVES[d.wave].enemies.length:'누적 정복 '+d.clears+'회';
  const guide=$('#dungeon-guidance');if(guide)guide.textContent=d.inside?boss?'보스를 처치했습니다. 보상을 받고 마을로 귀환하세요.':ready?'구역 정리 완료 · 다음 구역 문을 여세요.':'남은 적 '+(DUNGEON_WAVES[d.wave].enemies.length-d.kills)+'마리 · 자동사냥으로 구역을 정리하세요.':p.quest!.stage===3?'폐허 관문 가까이에서 입장할 수 있습니다.':'마을 의뢰 3개의 보상을 먼저 수령하세요.';
  const next=root.querySelector<HTMLButtonElement>('#dungeon-next'),claim=root.querySelector<HTMLButtonElement>('#dungeon-claim'),hunt=root.querySelector<HTMLButtonElement>('#dungeon-hunt');
  if(next){next.disabled=!ready||boss;next.classList.toggle('primary',ready&&!boss);}
  if(claim){claim.disabled=!boss;claim.classList.toggle('primary',boss);}
  if(hunt)hunt.disabled=ready;
}
function panelAction(id:string, type:Intent['type'], page:'estate'|'inventory') { $('#'+id).onclick=()=>{ session.dispatch({type} as Intent); showPanel(page); updateHud(); void save(); }; }
function positionWindowBelowQuest(){
  const mini=$('#quest-mini');if(!mini)return;
  root.style.setProperty('--window-top',Math.max(110,mini.getBoundingClientRect().bottom+10)+'px');
}
window.addEventListener('resize',positionWindowBelowQuest);
function togglePanel(kind:'estate'|'inventory'|'save'|'help'|'shop'|'dungeon'|'character') {
  if(!$('#panel').hidden&&shownPanelKind===kind){$('#panel').hidden=true;return;}
  showPanel(kind);
}
function showPanel(kind:'estate'|'inventory'|'save'|'help'|'shop'|'dungeon'|'character') {
  shownPanelKind=kind;
  $('#panel').dataset['window']=kind;
  pendingDungeonApproach=null;
  $('.quest').classList.remove('hunt-settings-open');
  $('#panel').hidden=false;
  positionWindowBelowQuest();
  inventoryWindow=undefined;
  if(kind!=='inventory'){const panel=$('#panel');panel.style.left='';panel.style.top='';panel.style.right='';panel.style.height='';panel.style.bottom='';}
  $('#panel').classList.toggle('inventory-panel',kind==='inventory');
  $('#panel').setAttribute('aria-label',kind==='inventory'?'장비와 소지품':'게임 메뉴');
  if(kind==='character'){
    $('#panel-content').innerHTML='<span class="eyebrow">CHARACTER</span><h2>캐릭터 정보</h2><div id="character-stats"></div><button id="character-equipment">장비와 소지품</button>';
    refreshCharacterPanel();$('#character-equipment').onclick=()=>showPanel('inventory');
  } else if(kind==='dungeon') {
    if(autoHunt?.enabled||autoHunt?.approachingQuest)autoHunt.setEnabled(false);
    const p=session.state.player,d=p.dungeon!,wave=DUNGEON_WAVES[d.wave];
    const ready=dungeonWaveDone(d),boss=dungeonBossDone(d),unlocked=p.quest!.stage===3;
    $('#panel-content').innerHTML=`<span class="eyebrow">첫 번째 던전 · 시작의 마을</span><h2>폐허의 시련</h2>
      <p>${d.inside?'봉인된 회랑에서 적을 처치하고 다음 문을 여세요.':'마을 의뢰 3개를 마치면 관문이 열립니다.'}</p>
      <div class="stat-line"><span>상태</span><b>${d.inside?wave.title:unlocked?'진입 가능':'의뢰 완료 필요'}</b></div>
      <div class="stat-line"><span>진행</span><b id="dungeon-progress">${d.inside?d.kills+' / '+wave.enemies.length:'누적 정복 '+d.clears+'회'}</b></div>
      <p>최종 보상 · 골드 ${DUNGEON_REWARD.gold} · 목재 ${DUNGEON_REWARD.wood} · 파편 ${DUNGEON_REWARD.fragments}</p>
      ${d.inside?
        `<button id="dungeon-hunt" class="primary">현재 구역 자동사냥</button><button id="dungeon-next" ${!ready||boss?'disabled':''}>다음 구역 열기</button>
         <button id="dungeon-claim" ${!boss?'disabled':''}>보스 보상 수령 · 귀환</button>
         <button id="dungeon-leave">던전 포기하고 귀환</button>`:
        `<button id="dungeon-enter" ${!unlocked||!nearDungeonGate(p.x,p.z)?'disabled':''}>던전 입장</button>
         <small>폐허 관문 가까이 다가가 입장할 수 있습니다.</small>`}
      <p id="dungeon-guidance" class="adventure-guidance"></p><p id="dungeon-status" role="status"></p>`;
    $('#panel-content').dataset['dungeonPhase']=String(d.inside)+':'+d.wave+':'+p.quest!.stage;
    $('#dungeon-hunt')?.addEventListener('click',()=>{if(!session.state.player.dungeon!.inside||dungeonWaveDone(session.state.player.dungeon!))return;autoHunt?.configure({priority:'nearest'});autoHunt?.setEnabled(true);$('#panel').hidden=true;updateHud();});
    refreshDungeonPanel();
    for(const [id,type] of [
      ['dungeon-enter','enter-dungeon'],['dungeon-next','advance-dungeon'],
      ['dungeon-claim','claim-dungeon'],['dungeon-leave','leave-dungeon']
    ] as const) {
      $('#'+id)?.addEventListener('click',()=>{
        session.dispatch({type});
        const result=session.message;lastLog=result;showPanel('dungeon');
        $('#dungeon-status').textContent=result;updateHud();void save();
      });
    }
  } else if(kind==='shop') {
    const p=session.state.player;
    $('#panel-content').innerHTML=`<span class="eyebrow">마을 보급 상점</span><h2>모험을 준비하세요</h2><div class="equipment-icon">${classicIcon('potion')}</div><h3>회복 물약</h3><p>체력 55 회복 · 최대 체력을 넘지 않습니다.</p><div class="stat-line">보유 골드 <b>${p.gold}</b></div><div class="stat-line">보유 물약 <b>${p.potions}개</b></div><button id="buy-one">1개 구매 · 골드 ${POTION_PRICE}</button><button id="buy-five">5개 구매 · 골드 ${POTION_PRICE*5}</button><p role="status" id="shop-message"></p><small>마을 보급 상점 근처에서 이용할 수 있습니다.</small>`;
    for(const [id,quantity] of [['buy-one',1],['buy-five',5]] as const){
      $<HTMLButtonElement>('#'+id).disabled=!canUsePotionShop(p)||p.gold<POTION_PRICE*quantity||p.potions+quantity>1000000;
      $('#'+id).onclick=()=>{session.dispatch({type:'buy-potion',quantity});const result=session.message;addLog(result);lastLog=result;showPanel('shop');$('#shop-message').textContent=result;updateHud();void save();};
    }
  } else if(kind==='help') {
    const questState=validateQuest(session.state.player.quest),quest=activeQuest(questState);
    const finished=quest?canClaimQuest(questState):false;
    $('#panel-content').innerHTML=`<span class="eyebrow">모험 의뢰 게시판</span><h2>${quest?quest.title:'마을의 의뢰 완료'}</h2>
      <p>${quest?quest.description:'마을의 3개 의뢰를 모두 완료했습니다. 폐허 관문으로 이동해 첫 던전에 도전하세요.'}</p>
      <div class="stat-line">의뢰 진행 <b id="quest-detail">${quest?questState.progress+' / '+quest.required:'3 / 3'}</b></div>
      ${quest?`<p>보상 · 골드 ${quest.reward.gold} · 목재 ${quest.reward.wood} · 물약 ${quest.reward.potions} · 파편 ${quest.reward.fragments}</p>
      <button id="quest-claim" ${!finished?'disabled':''}>${nearQuestBoard(session.state.player.x,session.state.player.z)&&!session.state.player.dungeon!.inside?'의뢰 보상 수령':'마을 귀환 후 보상 수령'}</button>`:''}
      <p role="status" id="quest-status"></p>
      <p>WASD·방향키 또는 땅 클릭으로 이동 · Tab으로 대상을 선택하고 Space·1로 공격하세요.</p>
      <p>2 강타 · 3 물약 · Q 회피 · H 자동사냥 · R 귀환 · I/B 장비 · C 캐릭터 · J 의뢰 · T 영지 · O 옵션 · Esc 닫기. 마을 주변에서는 체력이 회복됩니다.</p>
      <button id="help-quest-target">의뢰 자동이동 · 사냥</button><button id="help-hunt">가까운 몬스터 사냥</button>
      <small>목표 달성 후 보상 버튼을 누르면 필요할 때 마을로 귀환해 1번만 수령합니다.</small>`;
    $('#panel-content').dataset['questStage']=String(questState.stage);
    $('#quest-claim')?.addEventListener('click',()=>{if(!canClaimQuest(session.state.player.quest!))return;autoHunt?.setEnabled(false);pendingDungeonApproach=null;if(session.state.player.dungeon!.inside||!nearQuestBoard(session.state.player.x,session.state.player.z))session.dispatch({type:'recall'});session.dispatch({type:'claim-quest'});const result=session.message;lastLog=result;showPanel('help');$('#quest-status').textContent=result;updateHud();void (async()=>{await saveTask;await save();})();});
    $('#help-quest-target').onclick=()=>{
      const p=session.state.player;
      if(p.dungeon!.inside){showPanel('dungeon');return;}
      if(!activeQuest(p.quest!)){requestDungeonApproach();return;}
      if(canClaimQuest(p.quest!)){$('#quest-claim')?.click();return;}
      $('#panel').hidden=true;$('#quest-target').click();
    };
    refreshQuestPanel();
    $('#help-hunt').onclick=()=>{$('#panel').hidden=true;$('#hunt-guide').click();};
  } else if(kind==='estate') {
    const t=session.state.territory;
    $('#panel-content').innerHTML=`<span class="eyebrow">MY LITTLE TERRITORY</span><h2>영지 정원</h2><p>목재를 모아 정원을 가꾸면<br>플레이하는 동안 골드가 자랍니다.</p><div class="estate-illustration">♧ <span>✦</span> ♧</div><div class="stat-line">정원 단계 <b>${t.garden} / 5</b></div><div class="stat-line">수확 가능한 골드 <b>${Math.floor(t.stored)}</b></div><button id="gather">목재 채집 +3 · 마을 근처</button><button id="garden" class="primary">정원 ${t.garden?'확장':'건설'} · 목재 ${12+t.garden*6}</button><button id="collect">골드 수확</button><small>생산량은 최대 120개까지 보관됩니다.</small>`;
    panelAction('gather','gather','estate'); panelAction('garden','garden','estate'); panelAction('collect','collect','estate');
  } else if(kind==='inventory') {
    inventoryWindow=createInventoryWindow($('#panel-content'),()=>session.state.player,intent=>{session.dispatch(intent);updateHud();void save();},()=>showPanel('shop'));
  } else {
    $('#panel-content').innerHTML=`<span class="eyebrow">SYSTEM · PREFERENCES</span><h2>게임 옵션</h2><p class="settings-lead">화면, 여행 기록과 계정 연결을 관리하세요.</p>
      <section class="settings-section"><h3>화면 및 플레이</h3><p>WASD / 방향키 이동 · Space / 1 공격 · 2 강타 · 3 물약 · Q 회피 · Tab 대상 · H 자동사냥 · R 귀환<br>I/B 장비 · C 캐릭터 · J 의뢰 · T 영지 · O 옵션 · Esc 닫기</p><p>화질은 기기 성능에 맞춰 자동으로 조절됩니다.</p><div class="settings-grid"><button id="fullscreen-toggle" type="button" aria-pressed="false">전체화면</button><button id="game-exit" type="button">저장하고 종료</button></div><p>모바일에서 전체화면이 제한되면 Chrome 또는 홈 화면 실행을 이용하세요.</p><div id="browser-help" hidden><p>카카오 메뉴 → 다른 브라우저로 열기. 기록은 브라우저마다 별도로 저장됩니다.</p><button id="external-browser">다른 브라우저로 열기</button><button id="copy-game-url">게임 주소 복사</button><input id="game-url" readonly hidden aria-label="복사할 게임 주소"></div></section>
      <section class="settings-section"><h3>여행 기록</h3><p>15초마다 이 기기에 자동 저장합니다.</p><button id="save-now" class="primary">지금 기기에 저장</button><details><summary>저장 파일 백업 · 복구</summary><button id="export">저장 파일 내려받기</button><label class="import-label">저장 파일 가져오기<input id="import" type="file" accept="application/json"></label></details></section>
      <section class="settings-section"><h3>계정 및 클라우드</h3><p id="account">Google 계정 연결</p><button id="login">Google 로그인</button><details><summary>클라우드 저장 · 불러오기</summary><p>기기 사이에 단독 모험 기록을 옮깁니다.</p><button id="cloud-save">클라우드에 저장</button><button id="cloud-load">클라우드에서 불러오기</button><button id="logout">로그아웃</button></details><p id="cloud-status" role="status"></p></section><small>단독 모험 기록은 온라인 랭킹·거래와 공유되지 않습니다.</small>`;
    mobileShell.mountControls();
    $('#save-now').onclick=()=>void save();
    $('#export').onclick=()=>{const blob=new Blob([JSON.stringify({...session.snapshot(),updatedAt:Date.now()},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a'); a.href=url; a.download='Dungeon-zero-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
    $<HTMLInputElement>('#import').onchange=async e=>{try{const f=(e.target as HTMLInputElement).files?.[0];if(!f)return;if(f.size>50000)throw new Error('저장 파일이 너무 큽니다.'); const {validateSave}=await import('./session'); const s=validateSave(JSON.parse(await f.text())); if(confirm('현재 여행을 백업하고 파일의 여행으로 바꿀까요?')) {await replaceSave(s);}}catch(e){toast(errorText(e));}};
    const action=async(fn:(c:typeof import('./cloud'))=>Promise<void>)=>{try{cloud??=await import('./cloud');await fn(cloud);$('#account').textContent=cloud.auth.currentUser?.displayName??'Google 계정 연결';}catch(e){$('#cloud-status').textContent=errorText(e);}};
    $('#login').onclick=()=>void action(c=>c.login()); $('#logout').onclick=()=>void action(c=>c.logout());
    $('#cloud-save').onclick=()=>void action(async c=>{ const remote=await c.cloudLoad(); if(remote&&!confirm('클라우드의 기존 여행 기록을 현재 여행으로 덮어쓸까요?'))return;await c.cloudSave(session.snapshot());$('#cloud-status').textContent='클라우드 저장 완료'; });
    $('#cloud-load').onclick=()=>void action(async c=>{const s=await c.cloudLoad();if(!s)throw new Error('클라우드에 저장된 기록이 없습니다.');if(confirm('현재 여행을 기기에 백업하고 클라우드 기록으로 바꿀까요?')){await replaceSave(s);}});
  }
  // Group adjacent actions without changing their handlers or reading order.
  if(kind!=='inventory'){
    const content=$('#panel-content');
    for(const child of Array.from(content.children)){
      if(child.tagName!=='BUTTON'||child.parentElement!==content)continue;
      const next=child.nextElementSibling;
      if(next?.tagName!=='BUTTON')continue;
      const group=document.createElement('div');group.className='window-actions';
      content.insertBefore(group,child);group.append(child);
      while(group.nextElementSibling?.tagName==='BUTTON')group.append(group.nextElementSibling);
    }
  }
  $('#panel').scrollTop=0;
}
void boot();
