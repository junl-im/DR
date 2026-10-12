import {describe,expect,it,vi} from 'vitest';
import {createAutoHunt,nextTargetId,orderedTargets,AUTO_HUNT_LEASH} from './auto-hunt';
import type {LocalGameSession} from './session';

function fakeSession(x=45,z=20){
  const record:Array<string>=[];
  const session={
    state:{player:{x,z,level:1,hp:100,dungeon:{inside:false}}},
    mobs:[
      {id:'local-b',x:x+5,z,hp:10},
      {id:'local-a',x:x+5,z,hp:10},
      {id:'local-far',x:x+70,z,hp:10},
      {id:'dungeon-0-0',x:x+1,z,hp:10},
    ],
    target:null as string|null,
    attacking:false,
    dispatch:vi.fn((intent:{type:string;id?:string})=>{
      record.push(intent.type+(intent.id?':'+intent.id:''));
      if(intent.type==='target')session.target=intent.id??null;
      if(intent.type==='attack')session.attacking=!session.attacking;
    }),
  };
  return {session:session as unknown as LocalGameSession,record,raw:session};
}
describe('Tab targeting',()=>{
  it('cycles by distance then stable ID, wrapping without dungeon targets',()=>{
    const {raw}=fakeSession();
    expect(orderedTargets(raw.mobs,raw.state.player,false).map(m=>m.id)).toEqual([
      'local-a','local-b'
    ]);
    expect(nextTargetId(raw.mobs,raw.state.player,false,null)).toBe('local-a');
    expect(nextTargetId(raw.mobs,raw.state.player,false,'local-a')).toBe('local-b');
    expect(nextTargetId(raw.mobs,raw.state.player,false,'local-b')).toBe('local-a');
  });
  it('filters dead, far, invalid coordinates and other-instance mobs',()=>{
    const {raw}=fakeSession();
    raw.mobs[0].hp=0;
    raw.mobs.push({id:'broken',x:NaN,z:0,hp:5});
    expect(nextTargetId(raw.mobs,raw.state.player,false,null)).toBe('local-a');
    expect(nextTargetId(raw.mobs,raw.state.player,true,null)).toBe('dungeon-0-0');
    expect(nextTargetId([],raw.state.player,false,null)).toBeNull();
  });
});
describe('explicit opt-in local auto hunt',()=>{
  it('refuses safe village, dungeon and critically low health',()=>{
    const {session,raw}=fakeSession(0,0);
    const auto=createAutoHunt(session);
    expect(auto.start().ok).toBe(false);
    expect(auto.enabled).toBe(false);
    raw.state.player.x=45;raw.state.player.dungeon.inside=true;
    expect(auto.start().ok).toBe(false);
    raw.state.player.dungeon.inside=false;raw.state.player.hp=10;
    expect(auto.start().ok).toBe(false);
  });
  it('targets/attacks closest field mob, cycles on kill, stops without reviving or reusing save flags',()=>{
    const {session,raw,record}=fakeSession();
    const auto=createAutoHunt(session);
    expect(auto.start().ok).toBe(true);
    expect(auto.enabled).toBe(true);
    auto.tick(.05);
    expect(record).toEqual(['target:local-a','attack']);
    raw.mobs[1].hp=0;raw.attacking=false;raw.target=null;
    auto.tick(.2);auto.tick(.2);
    expect(record).toContain('target:local-b');
    expect(raw.attacking).toBe(true);
    auto.stop();
    expect(raw.attacking).toBe(false);
    expect(record.at(-1)).toBe('attack');
    expect(auto.enabled).toBe(false);
    auto.tick(.1);
    expect(record.at(-1)).toBe('attack');
  });
  it('halts upon low HP, dungeon transition or exceeding the start leash',()=>{
    const {session,raw}=fakeSession();
    const auto=createAutoHunt(session);
    auto.start();auto.tick(.05);raw.state.player.hp=30;
    expect(auto.tick(.05)).toContain('30%');
    expect(auto.enabled).toBe(false);
    raw.state.player.hp=100;
    auto.start();raw.state.player.dungeon.inside=true;
    expect(auto.tick(.05)).toContain('던전');
    expect(auto.enabled).toBe(false);
    raw.state.player.dungeon.inside=false;
    auto.start();raw.state.player.x+=AUTO_HUNT_LEASH+1;
    expect(auto.tick(.05)).toContain('멀어');
    expect(auto.enabled).toBe(false);
  });
  it('does not attack during hidden page and never auto-uses skill/potion',()=>{
    const {session,record}=fakeSession();
    const auto=createAutoHunt(session);
    auto.start();
    auto.tick(.05,true);
    expect(record).toEqual([]);
    auto.tick(.05,false);
    expect(record).toEqual(['target:local-a','attack']);
    expect(record).not.toContain('skill');
    expect(record).not.toContain('potion');
    expect(auto.toggle().message).toContain('OFF');
  });
});
