import {describe,it,expect} from 'vitest';
import {findDungeonApproach,hasArrivedAtDungeonApproach,GATE_INTERACT_RADIUS} from './dungeon-approach';
import {findPath} from '@nj/game-core';
import {DUNGEON_GATE} from './first-dungeon';

describe('dungeon world click approaches before dialog',()=>{
 it('plans a real walkable route from the village spawn',()=>{
   const start={x:0,z:0},target=findDungeonApproach(start);
   expect(target).not.toBeNull();
   expect(Math.hypot(target!.x-DUNGEON_GATE.x,target!.z-DUNGEON_GATE.z)).toBeLessThan(5.5);
   expect(findPath(start,target!).length).toBeGreaterThan(0);
   expect(hasArrivedAtDungeonApproach(start,target!)).toBe(false);
   expect(hasArrivedAtDungeonApproach(target!,target!)).toBe(true);
 });
 it('never opens when too far or crossing the target only on one axis',()=>{
   const destination={x:DUNGEON_GATE.x+3,z:DUNGEON_GATE.z};
   expect(hasArrivedAtDungeonApproach({x:destination.x+GATE_INTERACT_RADIUS+.1,z:destination.z},destination)).toBe(false);
   expect(hasArrivedAtDungeonApproach({x:200,z:200},destination)).toBe(false);
 });
 it('rejects invalid coordinates without attempting an A* traversal',()=>{
   expect(findDungeonApproach({x:NaN,z:0})).toBeNull();
 });
});
