import * as THREE from 'three';
import {FEET_OFFSET,snapEntityY} from '@nj/game-core';
import type {BossThreat} from '../local/boss-pattern';
/** One reusable warning decal, purely cosmetic and click-through. */
export function createBossThreatVisual(scene:THREE.Scene) {
  const group=new THREE.Group();group.name='dungeon-boss-telegraph';
  group.visible=false;
  const material=new THREE.MeshBasicMaterial({
    color:0xffb55a,transparent:true,opacity:.62,side:THREE.DoubleSide,
    depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,
  });
  const ring=new THREE.Mesh(new THREE.RingGeometry(.93,1,64),material);
  ring.name='danger-ring';
  ring.rotation.x=-Math.PI/2;
  ring.renderOrder=7;
  ring.raycast=()=>{};
  ring.userData['decorative']=true;
  group.add(ring);scene.add(group);
  return {
    group,
    update(threat:BossThreat|null):void {
      group.visible=!!threat;
      if(!threat)return;
      const y=snapEntityY(threat.x,threat.z)-FEET_OFFSET+.17;
      group.position.set(threat.x,y,threat.z);
      ring.scale.set(threat.radius,threat.radius,1);
      material.color.set(threat.move==='ground-sweep'?0xff7249:0xffc46a);
      material.opacity=threat.seconds<.42?.82:.56;
    },
    dispose():void {
      scene.remove(group);ring.geometry.dispose();material.dispose();
    },
  };
}
