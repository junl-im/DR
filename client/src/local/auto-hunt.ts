import {activeQuest,canClaimQuest,matchesQuestTarget} from './adventure-quests';
import {maxHp,type LocalGameSession,type Mob} from './session';

export const AUTO_HUNT_RADIUS=28;
export const AUTO_HUNT_RADII=[12,20,28] as const;
export const AUTO_POTION_THRESHOLDS=[0,.35,.5,.65] as const;
export const AUTO_HUNT_STOP_HP_RATIO=.22;
export const AUTO_POTION_COOLDOWN_S=5;
export const AUTO_STUCK_TIMEOUT_S=2.5;
export const AUTO_STUCK_RETRY_S=12;
export const TAB_TARGET_RADIUS=75;
export type HuntPriority='nearest'|'weakest'|'normal-only'|'quest';
export type HuntStopReason='manual'|'low-hp'|'range'|'zone-change'|'quest-ready'|'quest-complete'|'quest-unavailable';
export interface HuntProgress {seconds:number;kills:number;gold:number}

function distance(ax:number,az:number,bx:number,bz:number):number{
  return Math.hypot(ax-bx,az-bz);
}

/** Tab cycles actual living mobs in the current play zone, never corpse / next dungeon wave. */
export function selectableMobs(session:LocalGameSession,radius=TAB_TARGET_RADIUS):Mob[] {
  const p=session.state.player,inside=!!p.dungeon?.inside;
  return session.mobs.filter(m=>
    m.hp>0 && m.id.startsWith('dungeon-')===inside &&
    distance(m.x,m.z,p.x,p.z)<=radius
  ).sort((a,b)=>{
    const da=distance(a.x,a.z,p.x,p.z),db=distance(b.x,b.z,p.x,p.z);
    return da-db||a.id.localeCompare(b.id);
  });
}

export function nextTabTarget(session:LocalGameSession):string|null {
  const mobs=selectableMobs(session);
  if(!mobs.length)return null;
  const current=mobs.findIndex(m=>m.id===session.target);
  return mobs[(current+1)%mobs.length].id;
}

const elite=(m:Mob):boolean=>
  m.name==='숲의 정예 감시자'||m.name==='폐허의 파수꾼';

/**
 * Session-scoped, explicitly opt-in assistance; never persisted or networked.
 * Delegates all moving/damage/cooldown to LocalGameSession.tick/dispatch.
 */
export class AutoHuntController {
  enabled=false;
  activity:'idle'|'hunting'|'waiting'|'blocked'='idle';
  radius:typeof AUTO_HUNT_RADII[number]=AUTO_HUNT_RADIUS;
  priority:HuntPriority='nearest';
  potionThreshold:typeof AUTO_POTION_THRESHOLDS[number]=0;
  stopReason:HuntStopReason|null=null;
  private anchor:{x:number;z:number;inside:boolean}|null=null;
  private lastTarget:string|null=null;
  private potionCooldown=0;
  private elapsed=0;
  private startedAt=0;
  private startKills=0;
  private startGold=0;
  private stuckSeconds=0;
  private lastWalkPos:{x:number;z:number}|null=null;
  private readonly unreachableUntil=new Map<string,number>();
  constructor(
    private readonly session:LocalGameSession,
    private readonly onTarget:(id:string|null)=>void,
  ){}
  configure(options:{
    radius?:number;
    priority?:HuntPriority;
    potionThreshold?:number;
  }):void{
    if(options.radius!==undefined){
      if(!AUTO_HUNT_RADII.some(r=>r===options.radius))throw new RangeError('Invalid auto hunt radius');
      this.radius=options.radius as typeof AUTO_HUNT_RADII[number];
    }
    if(options.priority!==undefined){
      if(!(['nearest','weakest','normal-only','quest'] as string[]).includes(options.priority))throw new RangeError('Invalid target priority');
      this.priority=options.priority;
    }
    if(options.potionThreshold!==undefined){
      if(!AUTO_POTION_THRESHOLDS.some(t=>t===options.potionThreshold))throw new RangeError('Invalid auto potion threshold');
      this.potionThreshold=options.potionThreshold as typeof AUTO_POTION_THRESHOLDS[number];
    }
  }
  /** Transient hunt telemetry; totals reset each time the user enables hunting. */
  get progress():HuntProgress{
    const p=this.session.state.player;
    return {seconds:Math.max(0,Math.floor(this.elapsed-this.startedAt)),
      kills:Math.max(0,p.kills-this.startKills),gold:Math.max(0,p.gold-this.startGold)};
  }
  setEnabled(value:boolean,reason:HuntStopReason='manual'):boolean{
    const p=this.session.state.player;
    const wasEnabled=this.enabled;
    this.enabled=!!value && p.hp>0;
    this.anchor=this.enabled?{x:p.x,z:p.z,inside:!!p.dungeon?.inside}:null;
    this.lastTarget=null;
    this.stuckSeconds=0;
    this.lastWalkPos=null;
    this.unreachableUntil.clear();
    if(this.enabled){
      this.startedAt=this.elapsed;
      this.startKills=p.kills;
      this.startGold=p.gold;
      // A previously queued manual path must not move the new patrol anchor.
      if(!wasEnabled)this.session.stopMovement();
    }
    // Cooldown survives OFF/ON toggling: no consumable spam exploit.
    this.stopReason=this.enabled?null:reason;
    if(!this.enabled&&wasEnabled)this.session.stopMovement();
    return this.enabled;
  }
  tick(dt=.05):void {
    if(!this.enabled||!this.anchor||!Number.isFinite(dt)||dt<=0||dt>.25)return;
    this.elapsed+=dt;
    const s=this.session,p=s.state.player,inside=!!p.dungeon?.inside;
    if(inside!==this.anchor.inside){this.setEnabled(false,'zone-change');return;}
    if(distance(p.x,p.z,this.anchor.x,this.anchor.z)>this.radius+.5){
      this.setEnabled(false,'range');return;
    }
    const hpRatio=p.hp/Math.max(1,maxHp(p));
    if(!p.hp||hpRatio<AUTO_HUNT_STOP_HP_RATIO){
      this.setEnabled(false,'low-hp');return;
    }

    const quest=this.priority==='quest'?activeQuest(p.quest!):null;
    if(this.priority==='quest'){
      if(inside){this.setEnabled(false,'quest-unavailable');return;}
      if(!quest){this.setEnabled(false,'quest-complete');return;}
      if(canClaimQuest(p.quest!)){this.setEnabled(false,'quest-ready');return;}
    }

    // User must explicitly enable this: potions are finite/save-backed items.
    this.potionCooldown=Math.max(0,this.potionCooldown-dt);
    if(this.potionThreshold>0 && hpRatio<=this.potionThreshold &&
       this.potionCooldown===0 && p.potions>0 && p.hp<maxHp(p)){
      s.dispatch({type:'potion'});
      this.potionCooldown=AUTO_POTION_COOLDOWN_S;
    }

    const valid=(m:Mob):boolean=>m.hp>0&&m.id.startsWith('dungeon-')===inside&&
      distance(m.x,m.z,this.anchor!.x,this.anchor!.z)<=this.radius&&
      distance(m.x,m.z,p.x,p.z)<=this.radius&&
      (this.priority!=='normal-only'||!elite(m)) &&
      (this.priority!=='quest'||!!quest&&matchesQuestTarget(m,quest.target)) &&
      (this.unreachableUntil.get(m.id)??0)<=this.elapsed;
    const current=s.mobs.find(m=>m.id===s.target&&valid(m));
    const others=selectableMobs(s,this.radius).filter(valid);
    if(this.priority==='weakest')others.sort((a,b)=>
      a.hp/a.maxHp-b.hp/b.maxHp||
      distance(a.x,a.z,p.x,p.z)-distance(b.x,b.z,p.x,p.z)||a.id.localeCompare(b.id));
    const next=current??others[0];
    if(!next){
      this.activity=[...this.unreachableUntil.values()].some(until=>until>this.elapsed)?'blocked':'waiting';
      // The last mob may have died while a chase waypoint was still queued.
      // Waiting for respawn must never keep walking toward a corpse or leave
      // a stale target highlight on the screen.
      if(this.lastTarget!==null||s.target!==null||s.attacking){
        s.stopMovement();
        if(s.target!==null)s.dispatch({type:'target',id:''});
        this.onTarget(null);
      }
      this.lastTarget=null;
      this.lastWalkPos=null;
      this.stuckSeconds=0;
      return;
    }
    if(s.target!==next.id||this.lastTarget!==next.id){
      s.stopMovement(); // eliminate the old mob's pending chase waypoints
      s.dispatch({type:'target',id:next.id});
      this.onTarget(next.id);
      this.lastTarget=next.id;
      this.lastWalkPos={x:p.x,z:p.z};
      this.stuckSeconds=0;
    }
    this.activity='hunting';
    const dist=distance(next.x,next.z,p.x,p.z);
    if(dist>2.8 && this.lastWalkPos){
      if(distance(p.x,p.z,this.lastWalkPos.x,this.lastWalkPos.z)>=.15){
        this.stuckSeconds=0;
        this.lastWalkPos={x:p.x,z:p.z};
      }else{
        this.stuckSeconds+=dt;
      }
      if(this.stuckSeconds>=AUTO_STUCK_TIMEOUT_S){
        // This mob is blocked/unreachable. Do not pathfind to it every frame.
        // Retry after a short cooldown, allowing other living mobs in range.
        this.activity='blocked';
        this.unreachableUntil.set(next.id,this.elapsed+AUTO_STUCK_RETRY_S);
        s.stopMovement();
        s.dispatch({type:'target',id:''});
        this.onTarget(null);
        this.lastTarget=null;
        this.lastWalkPos=null;
        this.stuckSeconds=0;
        return;
      }
    }else{
      this.stuckSeconds=0;
      this.lastWalkPos={x:p.x,z:p.z};
    }
    if(!s.attacking)s.dispatch({type:'attack'});
  }
}
