# V3 armor rig audit & equipment-visual handoff — 2026-10-12

## Source-of-truth / scope

- Current main development reference: Notion MASTER and Codex PR #1 at `de88805a`.
- This candidate work stays on GitHub PR #2; no merge, production deployment, Firebase rules, PC server, or save schema changes.
- Licensed System G6/Qoma `Modular RPG Characters` (CC0). Asset hashes independently checked against the actual build ZIP.
- The game currently has **a real equipped/unequipped starter weapon** and **cosmetic V3 trial models**, but **no owned/equipped head/body/gloves/boots armor system**. A comparison screen is not equivalent to item ownership.

## Binary GLB inspection

| Model | File size | SHA256 | Skins | Skin joints | Meshes | Animations |
| --- | ---: | --- | ---: | ---: | ---: | ---: |
| V3 knight | 1,481,808 B | `c5cbb244a7c505ee21b2cd1e35ba75a0675541c4b8caa7262dbdf640c4a4dd7c` | 1 | 43 | 5 | 5 |
| V3 ranger | 1,668,388 B | `80d9c575669fde52f138910009559ef7953e3a1033b69fb05bfa632264896ab5` | 1 | 43 | 5 | 5 |
| V3 traveler | 1,487,248 B | `1288df589643030f7e2d6efc18206d08e50eafbda237271062c4314b7d1749a5` | 1 | 43 | 5 | 5 |
| Starter Squire sword | 326,360 B | `c418a2debc459a19071e5f1aef9f9ce4409bb440d8d93b303f83440326ba412f` | 0 | 0 | 1 | 0 |

- The three V3 rigs contain the **same 43 named joints in the same order**, including `palm_R`/`palm_L`. This is necessary, but **not sufficient**, for interoperable body-piece swapping: per-piece bind matrices, skinned mesh transforms, clipping, draw calls and occlusion must still be inspected in a real runtime.
- Mesh names: knight has `human_male_heavy_armor`, `human_male_heavy_boots`, `human_male_heavy_gloves`, `human_male_heavy_helmet`, `human_male_head_default`. Ranger has medium armor/boots/gloves/helmet and head. Traveler has light_armor_2/light_boots_2, hands_default, head_default and hair_1.
- The original KayKit Knight GLB uses `handslot.r` in raw glTF. Runtime conversion may sanitize this name. The mounting code now accepts `handslotr`, `handslot.r`, `handslot_r` and G6 `palm_R`. Do not blindly assume that raw GLB node names equal runtime names.
- SquireSword POSITION raw bounding box min [-0.13328,-0.20808,-0.03270] max [0.13328,0.92409,0.03270] (~1.132 model units along local Y). This does not establish a visually correct grip for any animation by itself.

## Changes and test gates

- `client/src/scene/creature/weapon-visual.ts`: transition generation token prevents stale promise A→0→A from mounting an old weapon. Caches one attempt per equipment transition and recognizes both rig naming conventions.
- `client/src/scene/creature/weapon-visual.spec.ts`: covers bone candidates, equip/unequip, delayed loading, same-ID re-equip race and incompatible skeleton.
- `client/art-lab.html` + `client/src/local/art-lab.ts`: four actual renderers, temporary sword toggle and per-model X/Y/Z translations, Euler rotations and scale sliders; displayed JSON can be copied for future manifest calibration. No gameplay save changes.
- `client/src/local/armor-asset-structure.spec.ts`: actual GLB binary contract for shared V3 skeleton and named outfit components. Do not weaken the test to allow mismatched rigs silently.
- Inventory includes a **3D visual comparison** link, marked as preview-only. It must not grant items or alter stats.

## Next implementation, in order

1. Visually verify weapon grip on real characters at idle / move / attack; capture pixel-accurate PC 1440×900 and mobile 390×844 evidence before freezing calibration. The automated Node tests do not prove rendered accuracy.
2. Expose **owned equipment slots** only after agreeing on item catalog, economy and backward-compatible optional save fields. An entire V3 GLB variant is not an independent helmet/glove/boot equip system.
3. Build modular skinned-piece binding against the character's common skeleton; account for clothing baseline (hair/skin under headgear), clipping, attachment sockets, material variants and GPU/draw-call budgets.
4. Update equipment slots and persisted ownership atomically; test legacy saved games, equip restrictions, level/price/distance/currency and IndexedDB + Firestore envelope compatibility.
5. Improve village buildings/roads/terrain texture and validate click-to-move navmesh consistency plus mobile performance.

## Validation limits

- GitHub Actions runs tests, typechecks, asset audits and production static build. It does **not** perform a screenshot-based WebGL pose/collision check; live device tests remain open.
- The user-facing production site and original Codex PR #1 remain unchanged until explicit integration.
