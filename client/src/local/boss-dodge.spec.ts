import {describe,expect,it} from 'vitest';
import {bossHit,type BossThreat} from './boss-pattern';
import {findBossDodgeDestination} from './boss-dodge';
import {DUNGEON_ARENA,DUNGEON_RADIUS} from './first-dungeon';
import {LocalGameSession,newSave} from './session';

const identitySnap=(x:number,z:number)=>({x,z});
const directRoute=(_from:{x:number;z:number},to:{x:number;z:number})=>[to];

describe('manual dodge from real elite attack warning',()=>{

 function realGuardianFight(sweep:boolean){
   const save=newSave('회피 검증',0);
   save.player.quest={stage:3,progress:0};
   save.player.dungeon={inside:true,wave:2,kills:0,clears:0};
   const s=new LocalGameSession(save),p=s.state.player;
   const boss=s.mobs.find(m=>m.id==='dungeon-2-0')!;
   boss.x=p.x+1;boss.z=p.z;boss.cooldown=0;
   if(sweep)boss.bossCasts=1;
   s.tick(.05);
   expect(s.bossThreat?.move).toBe(sweep?'ground-sweep':'aimed-strike');
   return {s,boss};
 }
 for(const sweep of [false,true]){
   it('actually walks out of '+(sweep?'sweep':'aimed')+' damage using original game movement and hit logic',()=>{
     const {s,boss}=realGuardianFight(sweep);
     const p=s.state.player,hp=p.hp,start={x:p.x,z:p.z};
     const threat=s.bossThreat!;
     const destination=findBossDodgeDestination(threat,p,true);
     expect(destination).not.toBeNull();
     // No direct state mutation; only the same player MOVE intent as world taps.
     s.dispatch({type:'move',x:destination!.x,z:destination!.z});
     for(let i=0;i<Math.ceil((threat.seconds+.15)/.05);i++)s.tick(.05);
     expect(Math.hypot(p.x-start.x,p.z-start.z)).toBeGreaterThan(1);
     expect(Math.hypot(p.x-destination!.x,p.z-destination!.z)).toBeLessThan(2);
     expect(p.hp).toBe(hp);
     expect(s.bossThreat).toBeNull();
     expect(s.snapshot().schemaVersion).toBe(1);
   });
 }

 it('walks just beyond a targeted blast instead of teleporting/invulnerability',()=>{
  const t:BossThreat={name:'정예',move:'aimed-strike',x:0,z:0,radius:2.3,seconds:1.25};
  const player={x:.2,z:0};
  const pos=findBossDodgeDestination(t,player,false,directRoute,identitySnap);
  expect(pos).not.toBeNull();
  expect(Math.hypot(pos!.x-player.x,pos!.z-player.z)).toBeLessThan(10);
  expect(bossHit(t.move,0,0,0,0,pos!.x,pos!.z)).toBe(false);
  expect(player).toEqual({x:.2,z:0});
 });
 it('routes outside the 5.5m guardian sweep while respecting dungeon perimeter',()=>{
  const {x,z}=DUNGEON_ARENA;
  const t:BossThreat={name:'폐허의 파수꾼',move:'ground-sweep',x,z,radius:5.5,seconds:1.65};
  const pos=findBossDodgeDestination(t,{x:x+1,z},true,directRoute,identitySnap);
  expect(pos).not.toBeNull();
  expect(Math.hypot(pos!.x-x,pos!.z-z)).toBeGreaterThan(5.5);
  expect(Math.hypot(pos!.x-x,pos!.z-z)).toBeLessThan(DUNGEON_RADIUS-1);
 });
 it('rejects stale tells, paths that are blocked or too long for the actual windup',()=>{
  const t:BossThreat={name:'정예',move:'aimed-strike',x:0,z:0,radius:2.3,seconds:1.25};
  expect(findBossDodgeDestination(null,{x:0,z:0},false,directRoute,identitySnap)).toBeNull();
  expect(findBossDodgeDestination({...t,seconds:0},{x:0,z:0},false,directRoute,identitySnap)).toBeNull();
  expect(findBossDodgeDestination({...t,seconds:.25},{x:0,z:0},false,directRoute,identitySnap)).toBeNull();
  expect(findBossDodgeDestination(t,{x:4,z:0},false,directRoute,identitySnap)).toBeNull();
  expect(findBossDodgeDestination(t,{x:0,z:0},false,()=>[],identitySnap)).toBeNull();
  expect(findBossDodgeDestination(t,{x:0,z:0},false,directRoute,()=>null)).toBeNull();
 });
 it('uses the genuine walkability route and falls back to the next legal angle',()=>{
  const t:BossThreat={name:'정예',move:'aimed-strike',x:0,z:0,radius:2.3,seconds:1.25};
  const route=(_f:{x:number;z:number},to:{x:number;z:number})=>
    to.x>3?[]:[to];
  const pos=findBossDodgeDestination(t,{x:0,z:0},false,route,identitySnap);
  expect(pos).not.toBeNull();
  expect(pos!.x).toBeLessThanOrEqual(3);
  expect(bossHit(t.move,0,0,0,0,pos!.x,pos!.z)).toBe(false);
 });
});
