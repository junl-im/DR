import { findPath, snapToNearestWalkable } from '@nj/game-core';
import { DUNGEON_GATE } from './first-dungeon';

export interface GatePoint { x:number; z:number }
export const GATE_INTERACT_RADIUS = 1.15;
/** Visually stop in front of the ruin instead of snapping inside the doorway. */
export const GATE_APPROACH_DISTANCE = 3.4;

/** Choose a reachable point around the near side of the ruin gate. The world
 * uses its normal A* path and walkability; never teleport or change save data.
 */
export function findDungeonApproach(from:GatePoint):GatePoint|null{
  if(!Number.isFinite(from.x)||!Number.isFinite(from.z))return null;
  const angle=Math.atan2(from.z-DUNGEON_GATE.z,from.x-DUNGEON_GATE.x);
  const bearings=[0,-.35,.35,-.7,.7,-1.12,1.12,Math.PI];
  let best:{point:GatePoint;score:number}|null=null;
  for(const offset of bearings){
    const x=DUNGEON_GATE.x+Math.cos(angle+offset)*GATE_APPROACH_DISTANCE;
    const z=DUNGEON_GATE.z+Math.sin(angle+offset)*GATE_APPROACH_DISTANCE;
    const point=snapToNearestWalkable(x,z,2);
    if(!point || Math.hypot(point.x-DUNGEON_GATE.x,point.z-DUNGEON_GATE.z)>5.2)continue;
    const direct=Math.hypot(from.x-point.x,from.z-point.z);
    const path=findPath(from,point);
    if(direct>GATE_INTERACT_RADIUS && path.length===0)continue;
    const score=path.reduce((sum,p,i)=>i===0
      ?sum+Math.hypot(p.x-from.x,p.z-from.z)
      :sum+Math.hypot(p.x-path[i-1].x,p.z-path[i-1].z),0)
      +Math.abs(offset)*.2;
    if(!best || score<best.score)best={point,score};
  }
  return best?.point ?? null;
}

export function hasArrivedAtDungeonApproach(player:GatePoint,point:GatePoint):boolean{
  return Number.isFinite(player.x)&&Number.isFinite(player.z)&&
    Math.hypot(player.x-point.x,player.z-point.z)<=GATE_INTERACT_RADIUS&&
    Math.hypot(player.x-DUNGEON_GATE.x,player.z-DUNGEON_GATE.z)<=5.5;
}
