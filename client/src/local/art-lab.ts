import * as THREE from 'three';
import {createMeshCharacter, KAYKIT_CLIP_MAP} from '../scene/creature/mesh-character';
import {ART_TRIALS} from './art-trial';
import type {AnimationClip} from '@nj/game-core';
import { createWeaponVisualState, syncWeaponVisual } from '../scene/creature/weapon-visual';

const entries=[{displayName:'현재 모델 · Knight',model:'/models/characters/Knight.glb',scale:1,clipMap:KAYKIT_CLIP_MAP},...Object.values(ART_TRIALS)];
const views=entries.map(entry=>{
 const card=document.createElement('article');card.innerHTML='<h2></h2><canvas></canvas><p>모델 읽는 중…</p>';card.querySelector('h2')!.textContent=entry.displayName;document.querySelector('#models')!.append(card);
 const canvas=card.querySelector('canvas')!,renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#1c2520');const camera=new THREE.PerspectiveCamera(30,1,.01,100);
 scene.add(new THREE.HemisphereLight('#fff3d8','#35402e',2));const sun=new THREE.DirectionalLight('#fff0ce',3);sun.position.set(3,5,4);scene.add(sun);const rim=new THREE.DirectionalLight('#9ac4db',1.6);rim.position.set(-3,2,-2);scene.add(rim);
 const character=createMeshCharacter(entry.model,{scale:entry.scale,clipMap:entry.clipMap});scene.add(character.object);
 const weaponState=createWeaponVisualState();
 const resize=()=>{const rect=canvas.getBoundingClientRect();renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();};new ResizeObserver(resize).observe(canvas);resize();
 const ready=character.ready.then(()=>{character.play('idle');character.setTime(0);character.object.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(character.object),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());character.object.position.y-=box.min.y;camera.position.set(center.x+size.y*.9,size.y*.58,size.y*2.6);camera.lookAt(center.x,size.y*.52,0);card.querySelector('p')!.textContent='대기 · 동일 조명 · 실제 GLB';return {name:entry.displayName,model:entry.model,height:size.y};});
 return {renderer,scene,camera,character,ready,card,weaponState};
});
let selected:AnimationClip='idle';function play(){for(const view of views){view.character.play(selected==='idle'?'move':'idle');view.character.play(selected);view.character.setTime(0);view.card.querySelector('p')!.textContent=`${selected} · 실제 GLB 애니메이션`;}}
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
  if (index===selectedGripIndex()) updateGripReadout();
}
for (const input of gripInputs) {
  input.addEventListener('input',()=>{
    const key = input.dataset['grip'] as GripAxis;
    gripSettings[selectedGripIndex()][key] = Number(input.value);
    applyGrip(selectedGripIndex());
  });
}
gripModel.addEventListener('change',updateGripReadout);
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

Promise.all(views.map(v=>v.ready)).then(models=>Object.assign(window,{__ART_LAB__:{ready:true,models}}));
let last=performance.now();function tick(now:number){const dt=Math.min(.05,(now-last)/1000);last=now;for(const v of views){v.character.update(dt);v.renderer.render(v.scene,v.camera);}requestAnimationFrame(tick);}requestAnimationFrame(tick);

