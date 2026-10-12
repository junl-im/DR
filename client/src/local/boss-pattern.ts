/** Fixed, deterministic elite moves — local simulation, no new RNG/save fields.
 * Telegraph and hit zone share this contract so the warning matches damage.
 */
export type BossMove = 'aimed-strike' | 'ground-sweep';
export interface BossThreat {
  name:string; move:BossMove; x:number; z:number; seconds:number; radius:number;
}
export function selectBossMove(name:string,castCount:number):BossMove {
  // The ruin guardian alternates an aimed strike and an area sweep.
  return name==='폐허의 파수꾼' && castCount%2===1?'ground-sweep':'aimed-strike';
}
export function bossWindup(move:BossMove):number {return move==='ground-sweep'?1.65:1.25;}
export function bossDamage(move:BossMove):number {return move==='ground-sweep'?12:16;}
export function bossRadius(move:BossMove):number{return move==='ground-sweep'?5.5:2.3;}
export function bossHit(move:BossMove,bossX:number,bossZ:number,aimX:number,aimZ:number,
  playerX:number,playerZ:number):boolean {
  if(![bossX,bossZ,aimX,aimZ,playerX,playerZ].every(Number.isFinite))return false;
  const distance=Math.hypot(playerX-bossX,playerZ-bossZ);
  if(move==='ground-sweep')return distance<=5.5 && distance>=0;
  return distance<8 && Math.hypot(playerX-aimX,playerZ-aimZ)<=2.3;
}
export function bossWarningLabel(threat:BossThreat):string {
  return threat.move==='ground-sweep'
    ? '⚠ '+threat.name+' 공격 예고 · 원형 휩쓸기 '+threat.seconds.toFixed(1)+'초! 범위 밖으로 이동하세요!'
    : '⚠ '+threat.name+' 공격 예고 · 목표 지점 강타 '+threat.seconds.toFixed(1)+'초! 표시된 곳에서 벗어나세요!';
}
