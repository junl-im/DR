# Dungeon ZERO v0.12.3 — full manual dodge execution QA

2026-10-12 follow-up from PR #8, without changing authoritative game combat, drop economy, or save schema.

## Why
Previous browser smoke only proved the boss warning and 120×44 CSS dodge button existed. It did not click the button, use the real movement system or prove the player's HP survived. This edition adds:
- Unit/integration tests: a real local-dungeon guardian aimed strike and area sweep against LocalGameSession's normal path, MOVE intent, 9m/s movement ticks, attack windup, boss hit test and HP. The dodge destination must be reachable, player must move via dispatch and the original strike must miss.
- Chromium software WebGL smoke: open the dungeon via UI, progress via standard combat, place the boss into a deterministic aiming fixture, click the **actual Q dodge touch button**, verify real movement of >1.2m and no HP loss after the aimed attack. Repeat with keyboard **Q** against an actual sweep hit zone, checking the player's final position is outside the 5.5m radius and HP unchanged.
- Explicit longer windup (1.65s and 2.1s) on browser QA fixture to avoid test-runner screenshot/click scheduling variance; **real gameplay windups are not modified**. Unit integration covers normal boss windup.
- Two additional browser evidence PNGs (32 total rather than 30), with captured before/after world coords and HP in report.json.

## Constraints
No automation of dungeon entry/rewards, free dodge immunity, altered monster damage, Firebase Firestore changes or PC server. Physical Android touch/heat/FPS is separate QA. Merge only when both GitHub CI and software WebGL are green.
