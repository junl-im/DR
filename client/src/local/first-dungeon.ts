/** DUNGEON ZERO — first private instance. No online/server authority.
 * Only a fixed checkpoint (wave + defeated count) is saved, never enemy HP.
 * Reconstructed encounters therefore cannot respawn already-killed enemies.
 */
export interface DungeonProgress { inside: boolean; wave: number; kills: number; clears: number }
export interface DungeonEnemy { npcId: number; name: string; hp: number }
export interface DungeonWave { title: string; enemies: readonly DungeonEnemy[] }
export const DUNGEON_GATE = { x: -7, z: -5, radius: 12 } as const;
export const DUNGEON_ARENA = { x: -88, z: -68 } as const;
export const DUNGEON_RADIUS = 24;
export const DUNGEON_WAVES: readonly DungeonWave[] = [
  {title:'1구역 · 봉인된 회랑',enemies:[
    {npcId:20001,name:'회랑의 잉크 슬라임',hp:54},
    {npcId:20001,name:'회랑의 잉크 슬라임',hp:54},
  ]},
  {title:'2구역 · 망각의 경비병',enemies:[
    {npcId:20003,name:'유적 경비병',hp:78},
    {npcId:20003,name:'유적 경비병',hp:78},
  ]},
  {title:'심층 · 폐허의 파수꾼',enemies:[
    {npcId:20003,name:'폐허의 파수꾼',hp:180},
  ]},
] as const;
export const DUNGEON_REWARD = { gold:120, wood:8, fragments:6 } as const;
export const emptyDungeon = ():DungeonProgress=>({inside:false,wave:0,kills:0,clears:0});
export function validateDungeon(value:unknown):DungeonProgress {
  if(value===undefined)return emptyDungeon();
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('던전 저장 정보가 올바르지 않습니다.');
  const d=value as DungeonProgress;
  if(typeof d.inside!=='boolean' || !Number.isInteger(d.wave) || d.wave<0 || d.wave>=DUNGEON_WAVES.length ||
     !Number.isInteger(d.kills) || d.kills<0 || d.kills>DUNGEON_WAVES[d.wave].enemies.length ||
     !Number.isInteger(d.clears) || d.clears<0 || d.clears>1000000 ||
     (!d.inside && (d.wave!==0||d.kills!==0)) ||
     Object.keys(d).some(key=>!['inside','wave','kills','clears'].includes(key))) {
    throw new Error('던전 진행 정보가 올바르지 않습니다.');
  }
  return {...d};
}
export const dungeonWaveDone=(d:DungeonProgress)=>d.inside&&d.kills===DUNGEON_WAVES[d.wave].enemies.length;
export const dungeonBossDone=(d:DungeonProgress)=>dungeonWaveDone(d)&&d.wave===DUNGEON_WAVES.length-1;
export function dungeonSummary(d:DungeonProgress):string {
  if(!d.inside)return '폐허의 시련 · 누적 정복 '+d.clears+'회';
  const w=DUNGEON_WAVES[d.wave];
  return w.title+' · '+d.kills+' / '+w.enemies.length;
}
export function nearDungeonGate(x:number,z:number):boolean {
  return Number.isFinite(x)&&Number.isFinite(z)&&Math.hypot(x-DUNGEON_GATE.x,z-DUNGEON_GATE.z)<=DUNGEON_GATE.radius;
}
