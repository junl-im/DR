import * as THREE from 'three';
import {createMeshCharacter, loadGltfTemplate, KAYKIT_CLIP_MAP} from '../scene/creature/mesh-character';
import {ART_TRIALS} from './art-trial';
import type {AnimationClip} from '@nj/game-core';
import { createWeaponVisualState, findWeaponHand, syncWeaponVisual } from '../scene/creature/weapon-visual';
import { sampleWeaponGrip } from '../scene/creature/grip-diagnostics';
import { prepareModularArmor, type ModularArmorController, type ArmorSlot, type ArmorOutfit } from '../scene/creature/modular-armor';

const entries=[{displayName:'현재 모델 · Knight',model:'/models/characters/Knight.glb',scale:1,clipMap:KAYKIT_CLIP_MAP},...Object.values(ART_TRIALS)];
const views=entries.map(entry=>{
 const card=document.createElement('article');card.innerHTML='<h2></h2><canvas></canvas><p>모델 읽는 중…</p>';card.querySelector('h2')!.textContent=entry.displayName;document.querySelector('#models')!.append(card);
 const canvas=card.querySelector('canvas')!,renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#1c2520');const camera=new THREE.PerspectiveCamera(30,1,.01,100);
 scene.add(new THREE.HemisphereLight('#fff3d8','#35402e',2));const sun=new THREE.DirectionalLight('#fff0ce',3);sun.position.set(3,5,4);scene.add(sun);const rim=new THREE.DirectionalLight('#9ac4db',1.6);rim.position.set(-3,2,-2);scene.add(rim);
 const character=createMeshCharacter(entry.model,{scale:entry.scale,clipMap:entry.clipMap});scene.add(character.object);
 const weaponState=createWeaponVisualState();
 const clipDurations:Partial<Record<AnimationClip,number>>={};
 const resize=()=>{const rect=canvas.getBoundingClientRect();renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();};new ResizeObserver(resize).observe(canvas);resize();
 const ready=character.ready.then(async()=>{
   // Read the real GLB clip lengths, not guessed seconds per animation.
   const template=await loadGltfTemplate(entry.model);
   for(const clip of ['idle','move','attack','cast','die'] as const) {
     clipDurations[clip]=template.animations.find(a=>a.name===entry.clipMap[clip])?.duration??0;
   }
   character.play('idle');character.setTime(0);character.object.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(character.object),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());character.object.position.y-=box.min.y;camera.position.set(center.x+size.y*.9,size.y*.58,size.y*2.6);camera.lookAt(center.x,size.y*.52,0);card.querySelector('p')!.textContent='대기 · 동일 조명 · 실제 GLB';return {name:entry.displayName,model:entry.model,height:size.y};});
 return {renderer,scene,camera,character,ready,card,weaponState,clipDurations};
});
let selected:AnimationClip='idle';
let poseFrozen=false;
const poseSlider=document.querySelector<HTMLInputElement>('#pose-progress')!;
const poseStatus=document.querySelector<HTMLElement>('#pose-status')!;
const poseDiagnostics=document.querySelector<HTMLElement>('#pose-diagnostics')!;
function sampleSelectedPose() {
  const index=selectedGripIndex();
  const view=views[index];
  const handName=findWeaponHand(view.character.object,'handslotr');
  const sample=handName?sampleWeaponGrip(view.character.object,view.weaponState.prop,handName):null;
  const rounded=(tuple:THREE.Vector3Tuple)=>tuple.map(n=>Number(n.toFixed(4)));
  return {
    model:entries[index].displayName,clip:selected,
    clipDurationSeconds:Number((view.clipDurations[selected]??0).toFixed(4)),
    frozen:poseFrozen,percent:Number(poseSlider.value),handBone:handName,
    ...(sample?{hand:rounded(sample.hand),hilt:rounded(sample.hilt),tip:rounded(sample.tip),
      gripGap:Number(sample.gripGap.toFixed(4)),bladeLength:Number(sample.bladeLength.toFixed(4))}:{hand:null,hilt:null,tip:null,gripGap:null,bladeLength:null}),
  };
}
function updatePoseDiagnostics():void {
  poseDiagnostics.textContent=JSON.stringify(sampleSelectedPose(),null,2);
}
function freezePose():void {
  poseFrozen=true;
  const fraction=Number(poseSlider.value)/100;
  for(const view of views) {
    const duration=view.clipDurations[selected]??0;
    // One-shot clips may have stopped during live preview. Re-arm the exact
    // action before seeking, otherwise a finished attack stays in bind pose.
    view.character.play(selected==='idle'?'move':'idle');
    view.character.play(selected);
    if(duration>0) view.character.setTime(duration*fraction);
    view.character.object.updateMatrixWorld(true);
  }
  poseStatus.textContent=`정지 ${poseSlider.value}% · 실제 GLB 프레임`;
  updatePoseDiagnostics();
}
poseSlider.addEventListener('input',freezePose);
document.querySelector<HTMLButtonElement>('#pose-resume')!.onclick=()=>play();
Object.assign(window,{__POSE_LAB__:{read:sampleSelectedPose,get paused(){return poseFrozen;}}});
function play(){poseFrozen=false;poseStatus.textContent='원본 애니메이션 재생 중';for(const view of views){view.character.play(selected==='idle'?'move':'idle');view.character.play(selected);view.character.setTime(0);view.card.querySelector('p')!.textContent=`${selected} · 실제 GLB 애니메이션`;}}
document.querySelector<HTMLSelectElement>('#animation')!.onchange=e=>{selected=(e.target as HTMLSelectElement).value as AnimationClip;play();};document.querySelector<HTMLButtonElement>('#replay')!.onclick=play;
const weaponToggle=document.querySelector<HTMLInputElement>('#weapon-visual')!;
weaponToggle.onchange=()=>{
  // The lab is visual only: do not change any player equipment or saved state.
  for(const view of views) {
    void view.ready.then(()=>syncWeaponVisual(view.character.object,weaponToggle.checked ? 2369 : 0,view.weaponState));
  }
};

type GripAxis = 'x' | 'y' | 'z' | 'rx' | 'ry' | 'rz' | 'scale';
type GripPose = Record<GripAxis, number>;
const newGripPose = (): GripPose => ({x:0,y:0,z:0,rx:0,ry:0,rz:0,scale:1});
const gripSettings = views.map(() => newGripPose());
const gripModel = document.querySelector<HTMLSelectElement>('#grip-model')!;
const gripValues = document.querySelector<HTMLElement>('#grip-values')!;
const gripStatus = document.querySelector<HTMLElement>('#grip-status')!;
const gripInputs = Array.from(document.querySelectorAll<HTMLInputElement>('[data-grip]'));
const selectedGripIndex = (): number => Number(gripModel.value);
const readableGrip = (index: number) => ({
  model: entries[index].displayName,
  position: [gripSettings[index].x,gripSettings[index].y,gripSettings[index].z],
  rotationDegrees: [gripSettings[index].rx,gripSettings[index].ry,gripSettings[index].rz],
  scale: gripSettings[index].scale,
});
function updateGripReadout(): void {
  const index = selectedGripIndex();
  const pose = gripSettings[index];
  gripValues.textContent = JSON.stringify(readableGrip(index),null,2);
  const state = views[index].weaponState;
  gripStatus.textContent = !weaponToggle.checked ? '검을 부착하면 보정 결과를 확인할 수 있습니다.' :
    state.prop ? '손뼈에 부착됨 · 실제 외형을 확인하세요.' :
    state.loading ? '무기 모델을 읽는 중입니다.' : '손뼈 부착 실패 또는 아직 준비되지 않았습니다.';
  for(const input of gripInputs) {
    const axis=input.dataset['grip'] as GripAxis;
    input.value=String(pose[axis]);
  }
}
function applyGrip(index: number): void {
  const prop = views[index].weaponState.prop;
  if (!prop) { if(index===selectedGripIndex()) updateGripReadout(); return; }
  const pose = gripSettings[index];
  prop.position.set(pose.x,pose.y,pose.z);
  prop.rotation.set(
    THREE.MathUtils.degToRad(pose.rx),
    THREE.MathUtils.degToRad(pose.ry),
    THREE.MathUtils.degToRad(pose.rz)
  );
  prop.scale.setScalar(pose.scale);
  if (index===selectedGripIndex()) {updateGripReadout();updatePoseDiagnostics();}
}
for (const input of gripInputs) {
  input.addEventListener('input',()=>{
    const key = input.dataset['grip'] as GripAxis;
    gripSettings[selectedGripIndex()][key] = Number(input.value);
    applyGrip(selectedGripIndex());
  });
}
gripModel.addEventListener('change',()=>{updateGripReadout();updatePoseDiagnostics();});
document.querySelector<HTMLButtonElement>('#grip-reset')!.onclick=()=>{
  gripSettings[selectedGripIndex()] = newGripPose();
  applyGrip(selectedGripIndex());
};
document.querySelector<HTMLButtonElement>('#grip-copy')!.onclick=()=>{
  const value=JSON.stringify(readableGrip(selectedGripIndex()),null,2);
  if(navigator.clipboard?.writeText) {
    void navigator.clipboard.writeText(value).then(()=>{gripStatus.textContent='보정값을 복사했습니다.';}).catch(()=>{gripStatus.textContent='복사 권한이 없습니다. 표시된 JSON을 직접 선택하세요.';});
  } else gripStatus.textContent='표시된 JSON을 직접 선택하세요.';
};
weaponToggle.addEventListener('change',()=>{
  views.forEach((view,index)=>{
    void view.ready.then(()=>{
      const active=view.weaponState.loading;
      if(active) return active.then(()=>applyGrip(index));
      applyGrip(index);
    });
  });
  updateGripReadout();
});
updateGripReadout();


/** Cosmetic-only V3 outfit fitting on the existing traveler renderer.
 * Reusing its WebGL context avoids a fifth context on low-memory phones. */
const armorView = views[views.length-1];
const armorStatus = document.querySelector<HTMLElement>('#armor-status')!;
const armorValues = document.querySelector<HTMLElement>('#armor-values')!;
const armorInputs = Array.from(document.querySelectorAll<HTMLSelectElement>('[data-armor-slot]'));
for (const select of armorInputs) select.disabled = true;
let armorController: ModularArmorController | null = null;
function renderArmorReadout(): void {
  armorValues.textContent = armorController ? JSON.stringify(armorController.snapshot(),null,2) : '';
}
const armorReady = armorView.ready.then(async () => {
  armorController = await prepareModularArmor(armorView.character.object);
  for(const input of armorInputs) {
    armorController.setPart(input.dataset['armorSlot'] as ArmorSlot, input.value as ArmorOutfit);
    input.disabled = false;
  }
  renderArmorReadout();
  armorStatus.textContent='방어구 4부위 교체 준비 완료 · 4번째 여행자 캐릭터에서 확인하세요.';
  Object.assign(window, {__ARMOR_LAB__:{ready:true,read:()=>armorController?.snapshot()}});
}).catch(error=>{
  armorStatus.textContent='방어구 시험 로드 실패: '+String(error);
  Object.assign(window, {__ARMOR_LAB__:{ready:false,error:String(error)}});
});
armorInputs.forEach(input=>input.addEventListener('change',()=>{
  if(!armorController) return;
  armorController.setPart(input.dataset['armorSlot'] as ArmorSlot,input.value as ArmorOutfit);
  renderArmorReadout();
}));
document.querySelector<HTMLButtonElement>('#armor-reset')!.onclick=()=>{
  if(!armorController) return;
  armorController.reset();
  for(const input of armorInputs) input.value='traveler';
  renderArmorReadout();
};
// Keep this as a separate readiness flag; all four base models remain in
// __ART_LAB__ and are tested independently of optional modular fitting.
void armorReady;

Promise.all(views.map(v=>v.ready)).then(models=>{
  poseSlider.disabled=false;
  poseStatus.textContent='원본 애니메이션 재생 중 · 슬라이더로 프레임 고정';
  updatePoseDiagnostics();
  Object.assign(window,{__ART_LAB__:{ready:true,models}});
});
let last=performance.now();function tick(now:number){const dt=Math.min(.05,(now-last)/1000);last=now;for(const v of views){if(!poseFrozen)v.character.update(dt);v.renderer.render(v.scene,v.camera);}requestAnimationFrame(tick);}requestAnimationFrame(tick);

