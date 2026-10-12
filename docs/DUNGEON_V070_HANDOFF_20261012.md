# Dungeon zero v0.7.0 — first ruin, boss combat, armor finishes and field art

Status: standalone GitHub draft PR #2, not merged or deployed. Built on the existing v0.6.0 single-player prototype. Original Codex PR #1, current public hosting, Firestore security rules, save envelope and PC-server deferral remain unchanged.

## Priority 1 — Ruin of Trials (first dungeon)
- Entrance at the new village sign `(-7,-5)`, gated behind the three completed village quests. The player must be near the portal.
- Private arena around `(-88,-68)`, using the existing fixed diagonal camera, GLB mobs and terrain/navigation. Decorative columns, portal, stone-tile instances and rune emblem; no new collision shapes, no paid/commercial franchise assets.
- Three stages: 2 ink slimes (54 HP), 2 sentries (78 HP), one 180-HP ruin guardian. Dungeon HUD/panel supports entry, next wave, boss reward and abandon/recall.
- Player save schemaVersion remains 1 with optional `player.dungeon={inside,wave,kills,clears}`. Validates strict range and no inconsistent inactive checkpoint; old saves initialize to outside, zero clears. Rebuilding from a checkpoint recreates only undefeated members of the current wave. Partial enemy HP is *not* persisted; it resets to full for undefeated enemies after reload.
- Defeated instance enemies never respawn during the current run. 120 gold, 8 wood, 6 armor fragments after boss defeat, claim once and leave; claim rejected if not eligible or wallet/cap overflow. Abandon resets unclaimed progress with no boss reward.
- Instance restricts new movement requests within a fixed radius and disables cross-area targeting; the legacy field mobs are not updated for combat while inside. **This is a local logical instance in the existing terrain, not a separate remotely hosted dungeon server.**
- All three stages/recovery/claim and scene art are covered by unit/browser regression tests. Staging browser uses a fixture to mark the earlier village quests complete; this does not imply the player can bypass the game gate in the public version.

## Priority 2 — Predictable elite attack
- Both field elite and dungeon boss wind up an aimed heavy strike for 1.25 seconds. The UI warns the player; leaving the target point by >2.3m or departing its 8m reach avoids the hit. Hit damage is `max(1,16-armorDefense)`, distinct from normal trash-mob contact damage. Cooldown ~2.8 seconds after resolution.
- Existing V3 rig animations use Cast during wind-up and Attack during impact. Mobile HUD warning uses text and high-contrast amber style, not color alone. Low-overhead gold rings distinguish elite mob instances.
- Tests cover wind-up-before-hit, cooldown, armor protection and dodge. The server-authoritative multiplayer version is **not** implemented.

## Priority 3 — Item visual quality
- Use existing licensed V3 G6 armor GLB materials and their texture maps. Cloned MeshStandardMaterial receives subtle per-outfit PBR metalness/roughness tuning (medium vs heavy) without changing cached GLB templates or another character's appearance.
- Existing 4-part skinned outfit rig and attack/cast remain. Must still visually inspect clipping, grip, wrists, face under helmets, and animation poses on actual hardware before calling it art complete.

## Priority 4 — Village and field
- New basalt portal sign structure, instanced 196-floor-tile room and four ruin pillars.
- Deterministic foliage/rocks (120 grass tufts + 48 moss stones, only two instanced meshes) placed outside village and the ruin encounter radius. Both instance meshes ignore raycasts. Decorative dungeon meshes also ignore raycasts to preserve click-to-move.
- Existing 5 village houses, 3D NPC props, town cobblestone, scatter forest, combat navmesh, 24-slot inventory and cloud-save ownership stay intact. No unlicensed Lineage/Elbera game files are included.

## Gates and limitations
- GitHub Actions tests, TypeScript, asset audit and build must all pass at the same commit. A separate Chromium/software WebGL workflow proves entrance/waves/save/checkpoint/boss claim, but is not an actual-phone FPS/battery/art-quality certificate.
- Browser QA uses controlled enemy positions/HP and pre-completed quest prerequisite, not a real-world 1-hour end-to-end playthrough.
- Do not merge PR or deploy without reviewing screenshots, testing both keyboard and touch, and ensuring the server model before multiplayer inventory trading.
