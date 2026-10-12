import type {LocalGameSession} from './session';
import {maxHp} from './session';

export const AUTO_HUNT_RADIUS = 24;
export const AUTO_HUNT_LEASH = 32;
export const AUTO_HUNT_LOW_HP_RATIO = .30;

type VisibleMob=Pick<LocalGameSession['mobs'][number],'id'|'x'|'z'|'hp'>;
type Location={x:number;z:number};

/** Deterministic tab order; no non-visible dungeon/field mobs, no dead mobs,
 * no selecting targets across the map. Equal-distance ties use stable IDs. */
export function orderedTargets(
  mobs:readonly VisibleMob[],
  at:Location,
  insideDungeon:boolean,
  radius=48
):VisibleMob[]{
  return mobs.filter(m=>m.hp>0&&Number.isFinite(m.x)&&Number.isFinite(m.z)&&
    m.id.startsWith('dungeon-')===insideDungeon&&
    Math.hypot(m.x-at.x,m.z-at.z)<=radius)
    .sort((a,b)=>Math.hypot(a.x-at.x,a.z-at.z)-Math.hypot(b.x-at.x,b.z-at.z)||
      a.id.localeCompare(b.id));
}

export function nextTargetId(
  mobs:readonly VisibleMob[],at:Location,insideDungeon:boolean,current:string|null,
):string|null {
  const eligible=orderedTargets(mobs,at,insideDungeon);
  if(!eligible.length)return null;
  const index=eligible.findIndex(m=>m.id===current);
  return eligible[(index+1)%eligible.length].id;
}

/** UI-only per-session auto-hunting (never serialized in schemaVersion1).
 * Exclusively field hunting. No dungeon boss automation, auto-potting or
 * self-revival. Manual input calls stop(); pause when tab is hidden.
 */
export function createAutoHunt(session:LocalGameSession){
  let enabled=false,home:Location|null=null,elapsed=0;
  const stop=():void=>{
    if(!enabled)return;
    enabled=false;home=null;elapsed=0;
    if(session.attacking)session.dispatch({type:'attack'});
  };
  const start=():{ok:boolean;message:string}=>{
    const p=session.state.player;
    if(p.dungeon?.inside)return{ok:false,message:'던전에서는 수동 전투만 가능합니다.'};
    if(Math.hypot(p.x,p.z)<=24)return{ok:false,message:'마을 밖 사냥터에서 자동사냥을 켜세요.'};
    if(p.hp<=maxHp(p)*AUTO_HUNT_LOW_HP_RATIO)return{ok:false,message:'체력이 낮습니다. 회복 후 시작하세요.'};
    if(!session.mobs.some(m=>orderedTargets([m],p,false,AUTO_HUNT_RADIUS).length))
      return{ok:false,message:'근처에 살아 있는 몬스터가 없습니다.'};
    enabled=true;home={x:p.x,z:p.z};elapsed=1;
    return{ok:true,message:'자동사냥 ON · 일반 필드, 최대 24m 탐색'};
  };
  const toggle=()=>enabled?(stop(),{ok:true,message:'자동사냥 OFF'}):start();
  const tick=(dt:number,hidden=false):string|null=>{
    if(!enabled||!Number.isFinite(dt)||dt<=0||dt>.25)return null;
    const p=session.state.player;
    // Browser background tabs are not permitted to keep killing enemies.
    // Suspend the active attack until the tab is visible again.
    if(hidden){if(session.attacking)session.dispatch({type:'attack'});return null;}
    if(p.dungeon?.inside){stop();return '던전 입장으로 자동사냥을 종료했습니다.';}
    if(p.hp<=maxHp(p)*AUTO_HUNT_LOW_HP_RATIO){stop();return '체력이 30% 이하라 자동사냥을 종료했습니다.';}
    if(!home||Math.hypot(p.x-home.x,p.z-home.z)>AUTO_HUNT_LEASH){
      stop();return '시작 위치에서 너무 멀어 자동사냥을 종료했습니다.';
    }
    elapsed+=dt;
    if(elapsed<.35)return null;
    elapsed=0;
    const current=session.mobs.find(m=>m.id===session.target&&m.hp>0&&
      !m.id.startsWith('dungeon-')&&
      Math.hypot(m.x-p.x,m.z-p.z)<=AUTO_HUNT_RADIUS&&
      Math.hypot(m.x-home!.x,m.z-home!.z)<=AUTO_HUNT_LEASH);
    const candidates=orderedTargets(session.mobs,p,false,AUTO_HUNT_RADIUS)
      .filter(m=>Math.hypot(m.x-home!.x,m.z-home!.z)<=AUTO_HUNT_LEASH);
    const next=current??candidates[0];
    if(!next){if(session.attacking)session.dispatch({type:'attack'});return null;}
    if(session.target!==next.id)session.dispatch({type:'target',id:next.id});
    if(!session.attacking)session.dispatch({type:'attack'});
    return null;
  };
  return {get enabled(){return enabled;},start,stop,toggle,tick};
}
