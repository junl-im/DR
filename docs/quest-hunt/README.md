# Quest and auto-hunt improvement — 2026-10-13

Baseline main ac71822 (PR #13). Current village quest objective now has a dedicated target finder (nearest living matching mob in the existing 75m selection radius, field only). Finding a target does not start an attack or teleport the player. Targets outside patrol radius explicitly require approaching them before automatic hunting.

An opt-in `quest` priority selects only the active village objective within the existing anchor/player radius limits. The label explicitly includes elites; third-stage sentinel hunting is deliberate, not normal-only mode. Low-HP, zone, radius, blocked-path safety and finite potion opt-in/cooldown remain. Quest mode stops on objective completion before consuming any optional potion on the next tick. Claiming rewards remains manual at the village board. A new hunt must be enabled manually after claiming the next quest.

HUD displays the actual objective, ready-to-claim reminder, searching/blocked/hunting activity and quest-related stop reasons. Existing nearest/weakest/normal-only choices remain available. No additional quest definitions, reward amounts, save schema fields, backend/rules or assets are introduced.

Validation: 94 local tests pass, including five new cases for species filtering, elite/dungeon exclusion, completion before potion consumption, an actual final combat kill with no automatic/duplicate reward, and no eligible target/all-quests-complete/dungeon safe stop. Typecheck and production build pass.

PC 1440 and mobile-emulated 390 Chromium: controlled fixture starts at 2/3 objectives with a 1HP slime and player positioned beside it, clearing queued movement state. Real targeting + auto-hunt/combat completes the final kill, stops with quest-ready message; gold 11 is ordinary kill loot only. Manual town reward adds exactly 28 (gold39), stage1 progress0 persists after save/reload, hunting remains OFF. Browser errors and asset failures are empty. This is not a full natural three-kill run or physical Android performance measurement. scripts/quest-hunt-smoke.cjs runs in WebGL CI.
