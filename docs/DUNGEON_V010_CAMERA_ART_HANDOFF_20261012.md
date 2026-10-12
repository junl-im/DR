# Dungeon zero v0.10.0 — fixed-camera readability / dungeon architecture

This is an **unmerged development candidate**, not a v1.0 shipping claim. It follows the verified v0.9.0 draft PR #2 (commit df63e47b). The Codex PR #1, production main, Firebase rules and PC-server deferral remain untouched.

## Background from actual WebGL images
The verified 1440x900 dungeon screenshot showed that player, goblins and armor were visually too small compared with the 196-tile floor. The camera was positioned 26m x / 34m y / 26m z from the player at FOV 38. Scaling character meshes directly would misalign GLB armor, palm_R sword anchors, HP bars and physics hit targets. The change is therefore **camera-only**.

## Changes
1. Added fixed camera policy `client/src/local/fixed-framing.ts`. PC: (21,28,21) x/y/z; mobile <=700px: (23,30,23). Both retain FOV38, locked diagonal follow, current 3D world positions, character/mob models, hit boxes and navigation. Mobile retains a slightly wider battlefield than PC because of the action dock.
2. In the first dungeon, added 20 original/procedural low wall fragments as **one instanced mesh**, outside the central fight, using existing stone materials. The meshes are explicitly not raycast targets, do not cast shadows and do not modify collision/navigation. Existing 196 floor tiles, boss telegraphs, pillars, torches and 48 debris stones stay intact.
3. Updated version labels to `gameVersion:0.10.0` and package/lock `0.10.0`, while keeping save `schemaVersion:1`. No economy, stats, cloud envelope or player-location schema changes.

## Safety/test contracts
- `fixed-framing.spec.ts` covers fixed camera alignment, valid slope/FOV, conservative zoom, desktop/mobile threshold and wider mobile context.
- `first-dungeon-art.spec.ts` enforces 20 instanced wall fragments, raycast bypass and finite transforms. The old draw-count test still applies.
- The original 16 screenshots/Chromium software WebGL suite (equipment grip, attack/cast/run poses, 3 dungeon waves, IndexedDB save/reload and final boss, mobile viewport) is preserved and will be rerun on the **final commit** before declaring this version tested.
- Zoom is not a replacement for actual-device touch/FPS/battery profiling or frame-by-frame examination of armor/glove/boot clipping and weapon pivot offsets.
- Resize/orientation transitions across the 700px breakpoint switch between desktop/mobile camera offsets through an optional, validated renderer API. The projection aspect is updated first, and the camera preserves its locked diagonal. Unit tests cover live reframing and invalid request rejection.
- Next steps: inspect the fresh desktop and mobile screenshots against v0.9.0, tune framing conservatively if combat visibility suffers; then assess measured V3 glove/weapon clipping and mobile real hardware performance.

Keep this handoff as source-truth alongside GitHub CI and the signed Drive ZIP snapshot. Do not publish or merge until all gates pass.
