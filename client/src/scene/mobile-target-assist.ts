import * as THREE from 'three';

/** Optional screen-space assistance for small 3D targets.
 * Genuine geometry ray hits always take priority. This is not world collision
 * and never changes attack range, health or target visibility rules.
 */
export interface TapMob {
  id: string;
  x: number; y: number; z: number;
  hp: number;
  barY?:number;
}
export interface TapCandidateInput {
  mobs:readonly TapMob[];
  camera:THREE.Camera;
  tapX:number;tapY:number;
  canvasWidth:number;canvasHeight:number;
  playerX:number;playerZ:number;
  touch:boolean;
}
export function selectMobNearScreenTap(input:TapCandidateInput):string|null {
  const {mobs,camera,tapX,tapY,canvasWidth,canvasHeight,playerX,playerZ,touch}=input;
  if(![tapX,tapY,canvasWidth,canvasHeight,playerX,playerZ].every(Number.isFinite) ||
     canvasWidth<=0||canvasHeight<=0||tapX<0||tapX>canvasWidth||tapY<0||tapY>canvasHeight)return null;
  const radius=touch?25:13;
  const maxWorldDistance=touch?22:18;
  let bestId:string|null=null,bestSq=radius*radius;
  camera.updateMatrixWorld();
  const point=new THREE.Vector3();
  for(const mob of mobs) {
    if(mob.hp<=0||!Number.isFinite(mob.hp)||![mob.x,mob.y,mob.z].every(Number.isFinite))continue;
    if(Math.hypot(mob.x-playerX,mob.z-playerZ)>maxWorldDistance)continue;
    // Feet-to-head and hp bar are both common tap areas; keep this pixel-space
    // only so the GLB mesh and existing Three.js raycast stay authoritative.
    for(const dy of [.85,mob.barY??1.55]) {
      point.set(mob.x,mob.y+dy,mob.z).project(camera);
      if(![point.x,point.y,point.z].every(Number.isFinite)||point.z< -1||point.z>1)continue;
      const px=(point.x+1)*canvasWidth/2,py=(1-point.y)*canvasHeight/2;
      const sq=(px-tapX)**2+(py-tapY)**2;
      if(sq<bestSq){bestSq=sq;bestId=mob.id;}
    }
  }
  return bestId;
}
