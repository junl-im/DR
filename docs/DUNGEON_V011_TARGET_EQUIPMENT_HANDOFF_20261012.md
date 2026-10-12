# Dungeon zero v0.11.0 — touch targeting / equipment integrity handoff (2026-10-12)

Status: **Draft PR #2**, not merged or deployed. Built from verified v0.10.0 `48770302`. Preserve original Codex PR #1, `main`, public Firebase, local save schemaVersion 1, and deferred PC server.

## 1. Practical mobile target selection
- Existing Three.js exact geometry raycast **always has first priority**.
- If a pointer misses every live visible mob geometry, screen-space selection checks just the local scene's currently rendered/live enemy snapshots. Candidate model body center (0.85 m above feet) and HP bar center are projected through the current camera; the nearest tap is selected only inside 25 CSS pixels for touch or 13 pixels for mouse.
- No invisible/invalid/dead mobs or offscreen projections may be chosen. Strict player-to-mob ground range cutoffs (22 m touch, 18 m mouse) prevent selecting across the map. Real combat range, damage, skill, movement and hitboxes remain unchanged.
- Exact ray intersections against already-defeated mobs are ignored; dead models in deferred death animation no longer swallow movement taps.
- `mobile-target-assist.spec.ts` tests small near-misses, distance/death/offscreen rejection and nearest-target ordering.

## 2. Equipment teardown and asynchronous safety
- On character appearance/class replacement, `disposeWeaponVisual` increments the outstanding request generation, removes any attached sword prop, resets the state and ignores cached GLB loads arriving later.
- Attached props share GLB cached geometry/materials; these resources are **not disposed** from the cache. Existing `prepareModularArmor` already releases only cloned derived armor material instances per avatar.
- `weapon-visual.spec.ts` proves no stale sword appears after an avatar swap and verifies that a settled equipped blade detaches when the avatar is retired.

## 3. Release boundaries
- Version metadata `0.11.0`; original save `schemaVersion:1`. No change to Firebase saved payload envelopes or trading/economy.
- Gameplay remains solo/local/optional personal save. No extraction of Lineage or commercial Elbera client assets.
- Full CI (Vitest, TS, asset audit and build) and Chromium/software-WebGL baseline are required **at the exact same final SHA** before accepting this candidate. The browser suite exercises existing dungeon waves, visual equipment, PC/mobile framing and boss warnings; separate phone touch hardware verification remains outstanding.
- Validate the UI screenshot for inadvertent tap movement or enlarged HP bar intercepting combat. The new selection helper is mathematical and deterministic but is **not** a replacement for an actual Android touchscreen playtest.

## Next focus
1. Compare exact weapon palm_R transform and right-hand grip across attack, run and cast with screenshot/bone-local position diagnostics; only modify offsets after real model evidence.
2. Add boss-only silhouette and field scene depth with licensed/procedural geometry, not borrowed commercial game assets.
3. Measure Android/PC FPS, thermal use and 390px touch accuracy on real hardware; future authoritative server economy only when multiplayer is scheduled.
