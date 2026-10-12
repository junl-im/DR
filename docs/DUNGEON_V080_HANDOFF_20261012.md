# Dungeon zero v0.8.0 development handoff · 2026-10-12

## Context and release boundary
- Starts from the **verified v0.7.0 candidate** (`49d050cc`, 800 existing automated tests).
- Work lives only on `chat/dungeon-zero-weapon-visual-20261012`, **draft PR #2**. Do not merge the original Codex PR #1 or deploy production hosting without separate review.
- Existing single-player save `schemaVersion: 1`, 3-stage village quests, first ruin's 3 waves, 4-slot equipment, and Firebase save envelope remain unchanged.
- Public multiplayer item authority, PvP, trading and a PC server are **not** included.

## Delivered in v0.8.0 source
1. **Boss attack readability** — reuse one central, unit-tested hit geometry for damage and warnings. Field sentinel retains its original aimed strike (1.25s, 16 base damage, 2.3m targeted radius); the final ruin guardian now alternates that strike with a longer 1.65s *ground sweep* (5.5m center radius, 12 base damage). Both use existing armorDefense mitigation and are dodgeable by stepping out of the dangerous area. No new random rolls or save fields.
2. **Real in-world attack warning** — reusable lightweight circular 3D mesh positioned at the actual threatened X/Z, radius and terrain height, rendered orange for aimed strike or red for sweep, no shadows/collision/raycast interception. Text warning retains accessible cues and countdown. Reuses its GPU geometry each frame instead of re-creating.
3. **Ruin perimeter visual polish** — 48 low-poly broken stones batched into one InstancedMesh, only around the outside of the current 3-wave arena. The center of the fight and pathfinding/collision model remain as before.
4. **Mobile dynamic resolution** — capped DPR, respects fixed-step combat simulation. Windowed frames-per-second governor takes two sustained slow windows to reduce pixel ratio and four high-FPS windows to increase it. Limits DPR to 0.72–1.1 on high-DPR mobile, 0.9–1.5 on desktop. Existing mobile shadow-off rendering is preserved; no extra network assets.
5. **Armor resource lifetime** — materials are cloned and cached by V3 source material and outfit *per character* rather than per render primitive. No shared source GLB textures or geometries are disposed; derived materials are released only when an avatar is replaced or its renderer shuts down. Async model loading checks whether an avatar was already disposed before late application.

## Validation gates
- Boss geometry, alternation, warning circle radius, real simulation dodge/armor, mobile DPR hysteresis, armor clone lifetime and texture ownership have new Vitest tests.
- The existing Chromium/Playwright smoke verifies the old 3-wave dungeon checkpoint, plus both boss warning variants on a 390px viewport with separate images.
- **Only a green GitHub CI + WebGL run on the exact final source SHA is a verified release candidate.** Production software-WebGL screenshots are not proof of actual phone FPS or the absence of every animation clipping problem.
- Real device power/thermals, texture seam checks, gesture handling, server-authoritative online inventory, custom boss geometry and the final visual ambition remain for subsequent stages.

## Follow-up order
- Visually inspect warning marker placement against player camera and screenshot. Tune occlusion, direction, fonts, depth overlay and sweep avoidance tutorial only if evidence calls for it.
- Test a range of real Android/Wi-Fi devices for frame pacing and battery; do not promise a universal FPS.
- Further licensed boss animation/SFX, room-based traps with navmesh-safe detection, equipment seam/weapon grip animation fixes.
- Keep repository as primary code reference and update Notion + Drive only after a passed commit and artifact checksum verification.
