# Dungeon ZERO — local hunt controls & GPU budget (2026-10-12)

## Player controls
- Tab or **다음 타깃 · Tab**: cycles live monsters in the current world/dungeon, closest first, 75m range.
- H or **자동사냥 ON/OFF**: toggles local auto-hunt. Explicitly opt-in every session.
- **자동사냥 설정** is collapsed until opened. Radius presets 12m, 20m, 28m (default 28m); target rule nearest (default), weakest HP percentage or *normal-only* (elite and first-dungeon boss excluded).
- Auto potion defaults **OFF**; enable for HP <=35%, 50% or 65%. Uses the same save-backed potion dispatch, 5-second throttle, zero auto-restocking. Stops at HP <22% **before** any potion use.
- Automatic chase is constrained to the starting patrol radius. Auto mode cancels on critical HP, boundary exit, zone change, manual movement/target/combat, H OFF, opening dungeon panel, pressing Escape, and page backgrounding; cancellation also resets pending movement waypoints.
- Autohunt does not auto-enter/advance/claim dungeons, create XP, move across zones or modify game-core stats. Selection/preferences and action status are not persisted; save schema remains 1.

## Rendering performance
- On viewports narrower than 800 CSS pixels or coarse pointer devices, the WebGL renderer disables costly framebuffer MSAA; desktop keeps AA.
- Mobile already disables dynamic sunlight shadow maps. On desktop a 2.5-second sampling cadence disables dynamic shadows after 2 consecutive <38 FPS/low-DPR samples and restores only after 4 consecutive >53 FPS samples with DPR >=1.1. This avoids flipping shaders every frame.
- Existing dynamic resolution governor continues to control DPR; the quality HUD shows sampled FPS / DPR / GPU draw calls. Scene geometry and raycasts do not change.
- This is an automatic *software browser* test only. Real Android physical FPS, battery, temperature and touch QA still require hands-on testing.

## Validation
- New tests cover priority/radius validation, optional consumable use and cooldown, high-risk elite filtering, patrol / zone / HP stops, pending path cancellation, mobile AA selection, shadow hysteresis, and existing regression tests.
- Chromium software WebGL captures 27 scenes, including actual expanded mobile hunt options and live Tab/H/button navigation; avoid claiming real-device performance.
- No Firestore rules or production data migrations.
