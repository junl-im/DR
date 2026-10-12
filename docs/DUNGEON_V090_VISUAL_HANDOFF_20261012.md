# Dungeon zero v0.9.0 — Visual fidelity / geometry and lighting handoff

Draft PR #2, unmerged. Built on verified v0.8.0 (`50c80bb8`); Codex PR #1, `main`, deployed Firebase site and PC server remain untouched.

## Implemented
1. **Dungeon-only atmosphere:** two procedural torch fixtures with a maximum of two nonshadow point lights on PC (only one on mobile). All lights start with intensity 0 and turn on only while `player.dungeon.inside` is true. Outside the dungeon the torch group is hidden and intensities return to zero. The geometry is explicitly non-raycastable and changes no navigation or collision. No new external textures, shaders or ripped client assets.
2. **Arena paving clarity:** deterministic three-tone `InstancedMesh.setColorAt` colors on the same original 196 stone tiles, independently textured/colored floor material. Preserves positions, movement geometry and draw-call count.
3. **Player silhouette:** a small transparent, click-through ground-contact disk beneath the player avatar. Does not cast/receive shadows and disposes its own geometry and material on avatar teardown. Existing V3 modular outfits and animation clips remain untouched to avoid unmeasured offsets or clipping regressions.
4. **Visual pose evidence:** Chromium proof now photographs the V3 four-piece outfit while attacking, casting and running, plus a PC interior with dungeon-only lights; baseline inventory, IndexedDB resume, the 3 dungeon waves, boss warning variants and mobile screenshots remain.

## Explicit limits
- These are lighting/readability passes, **not** replacement AAA hero/monster models or universal correction of wrist/ankle seams. The pose captures make later manual seam checks possible; fixing offsets requires observing each actual GLB and animation.
- No assertion of actual phone GPU FPS, touch responsiveness or thermal durability. Browser screenshots use software WebGL.
- Saves remain `schemaVersion:1`; new `gameVersion:0.9.0` and package/lock metadata `0.9.0` are not schema changes.

## Release gates
- Only accept a specific commit after both Github CI (unit/typecheck/assets/build) and Chromium WebGL QA succeed. Ensure no new 400/500 asset responses, browser errors, mobile horizontal scroll, dungeon/wave reward duplicate, or regressions in avatar recreation.
- New unit tests: dungeon light budget/activation and click-through torches, player contact mesh lifetime, deterministic paving coloration.
- Evidence expected: 15 screenshots + report.json; 12 previous plus cast, move, and desktop lit chamber.

## Next priority
- Visually inspect pose captures frame by frame: helmet hair/ears; chest armor vs glove wrists; boots vs trousers; palm_R weapon grip and animation clipping. Apply *measured* fixes only.
- Distinguishable licensed boss mesh/SFX and room geometry with clear readable navigation, then actual Android/desktop profiling and touch playtests.
- Do not merge PR, deploy to Firebase or enable client-authoritative online item trading without explicit review.
