# Dungeon ZERO v0.12.2 — chase watchdog and manual boss dodge (2026-10-12)

## Scope
- `auto-hunt.ts` monitors actual movement of the player's world position rather than assuming a queued target is reachable. If distance to target is greater than 2.8m and the character makes under 0.15m progress for 2.5s, stop its pending chase/attack, temporarily skip that mob for 12s, and select another living reachable candidate in the fixed patrol area. Does not add gold, XP, attacks, path teleportation, save fields or network traffic.
- `boss-dodge.ts` offers a real walkability-grid-based route out of the current elite/boss attack warning, bounded by actual remaining cast time, 9m/s movement speed and existing dungeon boundary. No dodge/roll invulnerability, no teleport. No attack warning means the manual Q action does not move the character.
- `local-main.ts`: Q keyboard action and mobile '회피 · Q' button only during elite windup; manual action first stops auto hunting; canceling follows existing movement. `local.css`: minimum 44px touch button and high contrast.
- Unit tests cover stuck chase recovery and progress reset; dodge route hit-zone exit, blocked paths, stale windup and dungeon perimeter. Software WebGL smoke checks mobile visibility and 44px target on actual boss warning.
- Firebase schemaVersion 1, existing combat cooldowns, HP, rewards, boss pattern, original NJ MMO source assets and persistent PC-server deferral remain unchanged.

## QA and safety
- PR tests must pass core/client, TypeScript, asset scan and Firebase/web static builds.
- Software Chromium WebGL proves scripted flows only; Android real-device touch/FPS/thermal is a separate validation task.
- Once PR is verified, merge into main and check `Publish Hosting ONLY` plus GitHub Pages separately. Record Notion and Google Drive backup artifacts.
