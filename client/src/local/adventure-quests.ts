/** Dungeon zero: finite, deterministic early-area quest line.
 * Save schema remains v1; old saves missing quest state start at stage 0.
 * Rewards are only claimable at the village board, exactly once per stage.
 */
export type HuntKind = 'slime' | 'wanderer' | 'sentinel';
export interface QuestProgress { stage: number; progress: number }
export interface QuestDefinition {
  id: string; title: string; description: string; target: HuntKind; required: number;
  reward: { gold: number; wood: number; potions: number; fragments: number };
}
export const QUESTS: readonly QuestDefinition[] = [
  { id:'village-safety', title:'마을의 첫 의뢰', description:'잉크 슬라임 3마리 처치',
    target:'slime',required:3,reward:{gold:28,wood:3,potions:1,fragments:1} },
  { id:'forest-patrol', title:'동쪽 순찰 기록', description:'숲의 방랑자 4마리 처치',
    target:'wanderer',required:4,reward:{gold:55,wood:6,potions:2,fragments:2} },
  { id:'sentinel-hunt',title:'사냥터 정예 토벌',description:'숲의 정예 감시자 1마리 처치',
    target:'sentinel',required:1,reward:{gold:100,wood:10,potions:3,fragments:4} },
] as const;
export const initialQuest = (): QuestProgress => ({stage:0,progress:0});
export function validateQuest(value:unknown):QuestProgress {
  if(value===undefined)return initialQuest();
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('의뢰 저장 정보가 올바르지 않습니다.');
  const q=value as QuestProgress;
  if(!Number.isInteger(q.stage)||q.stage<0||q.stage>QUESTS.length||
     !Number.isInteger(q.progress)||q.progress<0||
     (q.stage===QUESTS.length ? q.progress!==0 : q.progress>QUESTS[q.stage].required)||
     Object.keys(q).some(key=>key!=='stage'&&key!=='progress')) {
    throw new Error('의뢰 진행 기록이 올바르지 않습니다.');
  }
  return {stage:q.stage,progress:q.progress};
}
export function activeQuest(q:QuestProgress):QuestDefinition|null{return QUESTS[q.stage]??null;}
export function recordQuestKill(q:QuestProgress,kind:HuntKind):boolean {
  const quest=activeQuest(q);
  if(!quest||quest.target!==kind||q.progress>=quest.required)return false;
  q.progress++;
  return true;
}
export const canClaimQuest=(q:QuestProgress)=>{const quest=activeQuest(q);return !!quest&&q.progress===quest.required;};
export function questSummary(q:QuestProgress):string {
  const active=activeQuest(q);
  return active?active.title+' · '+q.progress+' / '+active.required:'마을 의뢰 완료 · 3 / 3';
}
export const QUEST_BOARD={x:-2,z:4,radius:12} as const;
export function nearQuestBoard(x:number,z:number):boolean{
  return Number.isFinite(x)&&Number.isFinite(z)&&Math.hypot(x-QUEST_BOARD.x,z-QUEST_BOARD.z)<=QUEST_BOARD.radius;
}
