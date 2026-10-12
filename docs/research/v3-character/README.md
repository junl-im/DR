# V3 character trial — 2026-10-12

System G6 / Qoma's Modular RPG Characters was selected from the V3 research. The original author page declares CC0. Archive SHA256 and each converted GLB are recorded in conversion.json.

Three male variants (heavy knight, green ranger, clothed traveler) are converted from the original Blender 2.79-era file using Blender 4.5.9 LTS with script execution disabled. Existing vertex weights were restored to armature modifiers; texture nodes were rebuilt. Five original actions were exported as Idle, Run, Attack, Cast and Death. The exporter normalizes the four strongest bone influences. Visual fidelity to every original action is not asserted.

## Run and reproduce

- `npm run build`, then serve dist/client locally. Open `/art-lab.html` for four actual GLB characters under shared lighting, including the current Knight. The views fit each character's height; this is a proportion comparison, not a world-scale measurement.
- Entry screen's appearance selector or `/?art=knight` enables the trial. Class, owned equipment, attack power and save schema are independent of this appearance choice.
- Original archive: https://opengameart.org/sites/default/files/modular_rpg_characters.7z
- Extract into a working directory containing `modular_rpg_characters/`. Run Blender with `--background --disable-autoexec --python-exit-code 1 --python export_character.py -- WORKING_DIRECTORY`. Converted outputs are written to `converted/`.
- `node scripts/art-browser.cjs` verifies a locally served build on port 4300. It uses the local Chromium path or DREAM_CHROMIUM.

## Verified

TypeScript, standard build, /DR/ base build, full client tests and asset structure audit pass. The audit covers 112 files / 67 GLBs with zero failures; it is not a complete provenance audit of older assets. Playwright rendered all four models, captured Idle/Run/Attack, entered the actual game with the new knight, achieved a hunt kill and checked 390px mobile horizontal overflow. No page errors or failed asset responses. See browser-verification.json.

## Remaining

This is a reversible art trial, not the final Lineage2Elbera quality target. There is no weapon attachment or earned armor appearance synchronization yet. Device performance targets and long mobile sessions remain unmeasured. Cast/Death clips are exported but not covered by the combat browser scenario. Public GitHub Pages has not been updated by this change. Existing source and online path remain available.
