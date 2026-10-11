import * as THREE from 'three';
import { snapEntityY } from '@nj/game-core';
import type { GameEvent } from './session';

export function createCombatFeedback(root:HTMLElement,camera:THREE.Camera,canvas:HTMLCanvasElement){
  const layer=document.createElement('div');layer.id='combat-feedback';layer.setAttribute('aria-hidden','true');root.append(layer);
  const active:{element:HTMLSpanElement;event:GameEvent;age:number}[]=[];
  const point=new THREE.Vector3();
  return {
    push(events:GameEvent[]){for(const event of events){if(event.kind==='loot')continue;const element=document.createElement('span');element.className=`combat-number ${event.kind}`;element.textContent=event.kind==='level'?`LEVEL UP · ${event.amount}`:event.kind==='heal'?`+${event.amount}`:`${event.amount}`;layer.append(element);active.push({element,event,age:0});if(active.length>18)active.shift()?.element.remove();}},
    tick(dt:number){camera.updateMatrixWorld();const rect=canvas.getBoundingClientRect();for(let i=active.length-1;i>=0;i--){const item=active[i];item.age+=dt;if(item.age>1.3){item.element.remove();active.splice(i,1);continue;}point.set(item.event.x,snapEntityY(item.event.x,item.event.z)+2.1,item.event.z).project(camera);item.element.hidden=point.z>1||point.z< -1;item.element.style.left=`${rect.left+(point.x+1)*rect.width/2}px`;item.element.style.top=`${rect.top+(1-point.y)*rect.height/2-item.age*27}px`;item.element.style.opacity=String(Math.min(1,(1.3-item.age)*2));}},
  };
}
