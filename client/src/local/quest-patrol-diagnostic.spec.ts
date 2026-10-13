import { it, expect } from 'vitest';
import { LocalGameSession, newSave } from './session';
import { AutoHuntController } from './auto-hunt';
import { QUESTS, matchesQuestTarget } from './adventure-quests';
for (const radius of [12, 20, 28])
  it(
    'patrols distinct real-spawn objectives through all three quests at ' +
      radius +
      'm',
    () => {
      const s = new LocalGameSession(newSave('의뢰 순찰', 0)),
        a = new AutoHuntController(s, () => {});
      a.configure({ radius });
      for (let stage = 0; stage < 3; stage++) {
        expect(a.startQuestHunt()).toBe(true);
        let ticks = 0;
        const defeated = new Set<string>();
        while ((a.enabled || a.approachingQuest) && ticks++ < 3600) {
          a.tick(0.05);
          const target = s.target,
            before = s.state.player.quest!.progress;
          s.tick(0.05);
          if (s.state.player.quest!.progress > before) {
            expect(target).toBeTruthy();
            const mob = s.mobs.find((m) => m.id === target)!;
            expect(matchesQuestTarget(mob, QUESTS[stage].target)).toBe(true);
            defeated.add(target!);
          }
          for (const e of s.drainEvents()) a.handleHit(e);
        }
        expect(a.stopReason).toBe('quest-ready');
        expect(defeated.size).toBe(QUESTS[stage].required);
        expect(s.state.player.quest).toEqual({
          stage,
          progress: QUESTS[stage].required,
        });
        const gold = s.state.player.gold;
        s.dispatch({ type: 'recall' });
        s.dispatch({ type: 'claim-quest' });
        expect(s.state.player.gold).toBe(gold + QUESTS[stage].reward.gold);
        expect(s.state.player.quest).toEqual({ stage: stage + 1, progress: 0 });
      }
      expect(s.state.player.quest).toEqual({ stage: 3, progress: 0 });
    },
  );
