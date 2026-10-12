import {findPath,snapToNearestWalkable} from '@nj/game-core';
import {bossHit,type BossThreat} from './boss-pattern';
import {DUNGEON_ARENA,DUNGEON_RADIUS} from './first-dungeon';

export const DODGE_EXTRA_MARGIN_M=1.1;
export const DODGE_MAX_ROUTE_M=11;

/** Dodge is honest walkable movement, never teleport, invulnerability or free damage.
 * Refuse if the telegraph is already gone or the walking distance exceeds
 * remaining windup time at the existing player speed (9 m/s).
 */
export function findBossDodgeDestination(
  threat:BossThreat|null,
  player:{x:number;z:number},
  insideDungeon:boolean,
  route:(from:{x:number;z:number},to:{x:number;z:number})=>readonly {x:number;z:number}[]=findPath,
  snap:(x:number,z:number)=>{x:number;z:number}|null=snapToNearestWalkable,
):{x:number;z:number}|null{
  if(!threat||!Number.isFinite(threat.seconds)||threat.seconds<=.15||
     ![player.x,player.z,threat.x,threat.z,threat.radius].every(Number.isFinite)||
     threat.radius<=0)return null;
  if(!bossHit(threat.move,threat.x,threat.z,threat.x,threat.z,player.x,player.z))return null;
  const cx=threat.x,cz=threat.z;
  const deltaX=player.x-cx,deltaZ=player.z-cz;
  const baseAngle=deltaX===0&&deltaZ===0?0:Math.atan2(deltaZ,deltaX);
  // First choose the shortest radial exit; rotate options only if an obstruction
  // or dungeon boundary makes the obvious path inaccessible.
  const turns=[0,Math.PI/4,-Math.PI/4,Math.PI/2,-Math.PI/2,3*Math.PI/4,-3*Math.PI/4,Math.PI];
  let best:{x:number;z:number;cost:number}|null=null;
  for(const turn of turns){
    const angle=baseAngle+turn;
    const radius=threat.radius+DODGE_EXTRA_MARGIN_M;
    const desired=snap(cx+Math.cos(angle)*radius,cz+Math.sin(angle)*radius);
    if(!desired)continue;
    if(insideDungeon&&Math.hypot(desired.x-DUNGEON_ARENA.x,desired.z-DUNGEON_ARENA.z)>DUNGEON_RADIUS-1)continue;
    if(bossHit(threat.move,cx,cz,cx,cz,desired.x,desired.z))continue;
    const points=route(player,desired);
    if(!points.length)continue;
    let cost=0,last=player;
    for(const point of points){
      cost+=Math.hypot(point.x-last.x,point.z-last.z);
      last=point;
    }
    if(cost>DODGE_MAX_ROUTE_M||cost>=threat.seconds*9*.95)continue;
    if(!best||cost<best.cost)best={x:desired.x,z:desired.z,cost};
  }
  return best?{x:best.x,z:best.z}:null;
}
