import * as THREE from 'three';
import {createMeshCharacter, KAYKIT_CLIP_MAP} from '../scene/creature/mesh-character';
import {ART_TRIALS} from './art-trial';
import type {AnimationClip} from '@nj/game-core';

const entries=[{displayName:'현재 모델 · Knight',model:'/models/characters/Knight.glb',scale:1,clipMap:KAYKIT_CLIP_MAP},...Object.values(ART_TRIALS)];
const views=entries.map(entry=>{
 const card=document.createElement('article');card.innerHTML='<h2></h2><canvas></canvas><p>모델 읽는 중…</p>';card.querySelector('h2')!.textContent=entry.displayName;document.querySelector('#models')!.append(card);
 const canvas=card.querySelector('canvas')!,renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#1c2520');const camera=new THREE.PerspectiveCamera(30,1,.01,100);
 scene.add(new THREE.HemisphereLight('#fff3d8','#35402e',2));const sun=new THREE.DirectionalLight('#fff0ce',3);sun.position.set(3,5,4);scene.add(sun);const rim=new THREE.DirectionalLight('#9ac4db',1.6);rim.position.set(-3,2,-2);scene.add(rim);
 const character=createMeshCharacter(entry.model,{scale:entry.scale,clipMap:entry.clipMap});scene.add(character.object);
 const resize=()=>{const rect=canvas.getBoundingClientRect();renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();};new ResizeObserver(resize).observe(canvas);resize();
 const ready=character.ready.then(()=>{character.play('idle');character.setTime(0);character.object.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(character.object),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());character.object.position.y-=box.min.y;camera.position.set(center.x+size.y*.9,size.y*.58,size.y*2.6);camera.lookAt(center.x,size.y*.52,0);card.querySelector('p')!.textContent='대기 · 동일 조명 · 실제 GLB';return {name:entry.displayName,model:entry.model,height:size.y};});
 return {renderer,scene,camera,character,ready,card};
});
let selected:AnimationClip='idle';function play(){for(const view of views){view.character.play(selected==='idle'?'move':'idle');view.character.play(selected);view.character.setTime(0);view.card.querySelector('p')!.textContent=`${selected} · 실제 GLB 애니메이션`;}}
document.querySelector<HTMLSelectElement>('#animation')!.onchange=e=>{selected=(e.target as HTMLSelectElement).value as AnimationClip;play();};document.querySelector<HTMLButtonElement>('#replay')!.onclick=play;
Promise.all(views.map(v=>v.ready)).then(models=>Object.assign(window,{__ART_LAB__:{ready:true,models}}));
let last=performance.now();function tick(now:number){const dt=Math.min(.05,(now-last)/1000);last=now;for(const v of views){v.character.update(dt);v.renderer.render(v.scene,v.camera);}requestAnimationFrame(tick);}requestAnimationFrame(tick);

