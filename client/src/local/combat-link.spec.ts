import { describe, it, expect } from 'vitest';
import { LocalGameSession, newSave, maxHp } from './session';
import { AutoHuntController } from './auto-hunt';
function setup() {
  const save = newSave('연계', 0);
  save.player.x = 34;
  save.player.z = -24;
  const s = new LocalGameSession(save);
  const m = s.mobs.find((m) => m.name === '잉크 슬라임')!;
  m.x = s.state.player.x;
  m.z = s.state.player.z;
  const a = new AutoHuntController(s, () => {});
  return { s, m, a };
}
describe('combat and quest links', () => {
  it('starts real retaliation only on a surviving hit and selects its attacker', () => {
    const { s, m, a } = setup();
    s.tick(0.05);
    const hit = s.drainEvents().find((e) => e.kind === 'hurt');
    expect(hit?.sourceId).toBe(m.id);
    a.handleHit(hit!);
    expect(a.enabled).toBe(true);
    expect(s.target).toBe(m.id);
    a.tick();
    expect(s.attacking).toBe(true);
  });
  it('manual OFF and safety stops cannot be undone by another hit', () => {
    const { s, m, a } = setup();
    a.setEnabled(true);
    a.setEnabled(false);
    a.handleHit({
      kind: 'hurt',
      sourceId: m.id,
      x: m.x,
      z: m.z,
      amount: 7,
      text: '',
    });
    expect(a.enabled).toBe(false);
    a.setEnabled(true);
    s.state.player.hp = 20;
    a.tick();
    s.state.player.hp = maxHp(s.state.player);
    a.handleHit({
      kind: 'hurt',
      sourceId: m.id,
      x: m.x,
      z: m.z,
      amount: 7,
      text: '',
    });
    expect(a.enabled).toBe(false);
  });
  it('manual skill and potion preserve controller state and reacquire after skill kill', () => {
    const { s, m, a } = setup();
    a.setEnabled(true);
    a.tick();
    m.hp = 1;
    s.dispatch({ type: 'skill' });
    expect(m.hp).toBe(0);
    expect(a.enabled).toBe(true);
    s.state.player.hp = 50;
    s.dispatch({ type: 'potion' });
    expect(a.enabled).toBe(true);
    a.tick();
    expect(s.target).not.toBe(m.id);
  });
  it('ignores stale, wrong-zone, safe-town and critically low HP hit events', () => {
    const { s, m, a } = setup();
    const hit = {
      kind: 'hurt' as const,
      sourceId: m.id,
      x: m.x,
      z: m.z,
      amount: 7,
      text: '',
    };
    s.state.player.hp = 20;
    a.handleHit(hit);
    expect(a.enabled).toBe(false);
    s.state.player.hp = 100;
    s.state.player.dungeon!.inside = true;
    a.handleHit(hit);
    expect(a.enabled).toBe(false);
    s.state.player.dungeon!.inside = false;
    s.dispatch({ type: 'recall' });
    a.handleHit(hit);
    expect(a.enabled).toBe(false);
  });
  it('claim requires village, grants exactly once and survives a save reload', () => {
    const { s } = setup();
    s.state.player.quest = { stage: 0, progress: 3 };
    const before = {
      gold: s.state.player.gold,
      wood: s.state.player.wood,
      potions: s.state.player.potions,
      fragments: s.state.player.armor!.fragments,
    };
    s.dispatch({ type: 'claim-quest' });
    expect(s.state.player.quest.stage).toBe(0);
    s.dispatch({ type: 'recall' });
    s.dispatch({ type: 'claim-quest' });
    expect(s.state.player.quest).toEqual({ stage: 1, progress: 0 });
    expect(s.state.player.gold).toBe(before.gold + 28);
    expect(s.state.player.wood).toBe(before.wood + 3);
    expect(s.state.player.potions).toBe(before.potions + 1);
    expect(s.state.player.armor!.fragments).toBe(before.fragments + 1);
    const loaded = new LocalGameSession(s.snapshot());
    loaded.dispatch({ type: 'claim-quest' });
    expect(loaded.state.player.gold).toBe(before.gold + 28);
    expect(loaded.state.player.quest!.stage).toBe(1);
  });
});
