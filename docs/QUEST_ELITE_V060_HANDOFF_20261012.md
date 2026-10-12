# Dungeon zero v0.6.0 — village quest and elite-loot development handoff

Source branch: `chat/dungeon-zero-weapon-visual-20261012`, Draft PR #2 (not merged).
Scope: single-player/local/Firebase-private-saves only. Original Codex PR #1, main, live hosting, Firestore rules, server/ and online client preserved.

## Implemented — 4 connected milestones
1. **Quest progression and migration.** Optional `player.quest={stage,progress}`, still save schemaVersion=1. Legacy absent quest starts stage0. Exact bounds/no extra properties, never auto awards reward. Finite chain: slime 3 → wanderer 4 → forest elite sentinel 1. Only current matching kill advances, capped.
2. **Elite field enemy and rewards.** Reuses permitted existing wanderer npcId=20003 for sentinel, id `local-11`, 120 HP, longer 35-sec respawn. Special XP (75), guaranteed extra 18 gold and 2 armor fragments subject to limits. Stable unique medium armor from helmet→body→gloves→boots on elite kill if unowned; **does not equip itself**. After collection complete, duplicate equipment is never created. Existing RNG gold/potion call ordering kept.
3. **Quest board and UI.** In-game HUD shows active quest progress and an accessible quest-journal button. Village guide shows description/progress/reward; complete quest claimed once only at the guide sign (x=-2,z=4,radius12). Rewards: first 28g/3wood/1potion/1fragment; second 55g/6wood/2potion/2fragments; third 100g/10wood/3potions/4fragments, all caps checked atomically. Elite boss targeted UI highlighted. Existing click-to-move, shop, garden and single-player combat remain.
4. **Tests and CI.** Unit tests for old saves, invalid/future progress, species-only tracking, sequential claim-once, distance gate, currency caps and permanent IndexedDB stage persistence. Browser Playwright fixture extends game flow to 3 *actual* slime skill kills → quest board claim on 390px viewport, alongside old 3D armor, mobile/PC and reload tests. Output includes a PNG and JSON evidence. CI workflows use concurrency to cancel superseded PR attempts; only latest SHA can be considered green.

## Compatibility and important limits
- User saves remain schemaVersion1; cloud envelope keys unchanged. `validateSave` strictly rejects corrupt quest fields and initializes older saves. No free quest rewards during migration.
- Quest coordinates overlap the town's existing 'journey' sign and use its established proximity, not a new invented NPC.
- All rewarded goods are single-player editable saves; do not treat as authoritative multiplayer money or shared inventory. Server validation must precede PvP, multiplayer economy or trade.
- Elite geometry is the *existing* wanderer rig/material; only game/UI rules distinguish it. Unique elite 3D art, safe spawn distribution, live-device FPS, encounter balancing and visual polish are future milestones. Never advertise Elbera-grade completion.
- Because elite spawns at existing `local-11` terrain point, collision/path/navigation source remains unchanged.

## Next ordered work
1. Staging visual proof and mobile touchscreen tests for boss/quest flow; inspect screenshot rather than relying only on CI success.
2. Distinct licensed elite VFX/mesh, cautious spawn-based combat tuning, boss telegraphs and boss-focused quest guidance.
3. Additional regional quests and a proper collection/quest journal; player-facing UI must not hide existing 24-slot inventory.
4. Town-building road detail and field/dungeon encounter mechanics; preserve FPS and navigation and capture baseline screenshots.
5. Only later: authenticated server-authoritative item transactions, login synchronization/dupe prevention, multiplayer/trade.
