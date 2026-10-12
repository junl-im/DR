import type {LocalGameSession,Mob} from './session';

export const AUTO_HUNT_RADIUS=28;
export const AUTO_HUNT_STOP_HP_RATIO=.22;
export const TAB_TARGET_RADIUS=75;

export function selectableMobs(session:LocalGameSession,radius=TAB_TARGET_RADIUS):Mob[] {
  const p=session.state.player,inside=!!p.dungeon?.inside;
  return session.mobs.filter(m=>
    m.hp>0 && m.id.startsWith('dungeon-')===inside &&
    Math.hypot(m.x-p.x,m.z-p.z)<=radius
  ).sort((a,b)=>{
    const da=Math.hypot(a.x-p.x,a.z-p.z),db=Math.hypot(b.x-p.x,b.z-p.z);
    return da-db||a.id.localeCompare(b.id);
  });
}

export function nextTabTarget(session:LocalGameSession):string|null {
  const mobs=selectableMobs(session);
  if(!mobs.length)return null;
  const current=mobs.findIndex(m=>m.id===session.target);
  return mobs[(current+1)%mobs.length].id;
}

export class AutoHuntController {
  enabled=false;
  private anchor:{x:number;z:number}|null=null;
  private lastTarget:string|null=null;
  constructor(
    private readonly session:LocalGameSession,
    private readonly onTarget:(id:string|null)=>void,
  ){}
  setEnabled(value:boolean):boolean{
    this.enabled=!!value && this.session.state.player.hp>0;
    const p=this.session.state.player;
    this.anchor=this.enabled?{x:p.x,z:p.z}:null;
    this.lastTarget=null;
    if(!this.enabled&&this.session.attacking)this.session.dispatch({type:'attack'});
    return this.enabled;
  }
  tick():void {
    if(!this.enabled||!this.anchor)return;
    const s=this.session,p=s.state.player;
    if(!p.hp || p.hp/Math.max(1,100+(p.level-1)*18)<AUTO_HUNT_STOP_HP_RATIO ||
      Math.hypot(p.x-this.anchor.x,p.z-this.anchor.z)>AUTO_HUNT_RADIUS+.5){
      this.setEnabled(false);return;
    }
    const inside=!!p.dungeon?.inside;
    const valid=(m:Mob)=>m.hp>0 && m.id.startsWith('dungeon-')===inside &&
      Math.hypot(m.x-this.anchor!.x,m.z-this.anchor!.z)<=AUTO_HUNT_RADIUS &&
      Math.hypot(m.x-p.x,m.z-p.z)<=AUTO_HUNT_RADIUS;
    const current=s.mobs.find(m=>m.id===s.target&&valid(m));
    const next=current??selectableMobs(s,AUTO_HUNT_RADIUS)
      .filter(valid).sort((a,b)=>
        Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z)||a.id.localeCompare(b.id))[0];
    if(!next){
      if(s.attacking)s.dispatch({type:'attack'});
      this.lastTarget=null;
      return;
    }
    if(s.target!==next.id || this.lastTarget!==next.id){
      s.dispatch({type:'target',id:next.id});
      this.onTarget(next.id);
      this.lastTarget=next.id;
    }
    if(!s.attacking)s.dispatch({type:'attack'});
  }
}
