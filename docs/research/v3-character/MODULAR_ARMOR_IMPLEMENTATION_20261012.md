# Dungeon zero — modular V3 armor proof of concept (2026-10-12)

## Status and safety boundary
- Preview-only prototype, **not a gameplay equipment/ownership system**.
- Uses existing System G6 / Qoma CC0 GLB variants. Nothing from Lineage/Elbera is copied.
- No schemaVersion migration, ownership grant, inventory slot mutation, stats, marketplace, online server, Firebase rule change or publication.
- Base client appearance and 24-slot inventory remain unchanged. `client/art-lab.html` is the isolated preview for mixing pieces.

## Exact source inspection
- All three V3 files have 43 identical skin joints in the same order and the exact same inverse-bind matrix bytes; `client/src/local/armor-asset-structure.spec.ts` now verifies both conditions.
- `traveler.glb`: hair, default hands, bare head, light armor, boots.
- `knight.glb`: head, heavy armor/boots/gloves/helmet.
- `ranger.glb`: head, medium armor/boots/gloves/helmet. Importantly medium armor has **two primitives**, so the loaded component is typically a Group, not a single SkinnedMesh.

## Implementation
- `client/src/scene/creature/modular-armor.ts`: `prepareModularArmor(travelerRoot)` returns `setPart('helmet'|'body'|'gloves'|'boots', 'traveler'|'ranger'|'knight')`, `reset`, and `snapshot`.
- Validates source bones, all inverse bind matrices, bind matrices and existing components *before* mutating the live traveler root. A nonmatching asset aborts without a partial equipment change.
- Copies the complete visual node hierarchy under each named component (including multi-primitive Groups) and binds *all* new SkinnedMeshes to the original traveler's Skeleton. No 2nd skeleton/mixer. Mesh geometry/material is immutable and shared with cached source templates.
- Keeps the original traveler outfit invisible only in the replaced slot; a helmet hides base hair, while the face/head skin stays present. Reset restores originals.
- `client/src/scene/creature/modular-armor.spec.ts`: checks four independent switches, multi-primitive medium armor, shared active skeleton, reset, invalid selection, and incompatible rig rejection.
- `client/art-lab.html` offers four armor selects on the **existing 4th canvas** (no 5th WebGL context). Other 3 canvases show canonical KayKit/knight/ranger visual comparison. The equipment window already links to this lab.

## Limits and required future work
- Matching inverse-binds makes valid geometry binding possible but is **not a screenshot quality guarantee**. Body overlap, clipping and head/helmet seams, draw calls, GPU performance and camera occlusion remain to be visually inspected.
- CI validates TypeScript/Node, asset integrity and static build; it does not replace real browser screenshot testing.
- Manual local Playwright browser navigation was blocked by this runtime's URL security rules (`ERR_BLOCKED_BY_ADMINISTRATOR`), not by an app error. No visual acceptance claim.
- To turn this into real gameplay: design authorized item catalog, slot ownership and equip/unequip, level restrictions, stats/loot/currency, optional backward-compatible serialized fields; then test IndexedDB/Firestore save compatibility, transactions and multiplayer authority before integrating.
- Maintain public-site and online path unchanged until peer review, browser verification and explicit merge/deploy decision.

## Backups
- This branch's GitHub workflow now archives tracked source as an additional CI artifact `dungeon-zero-source` (beside the web artifact `dream-library-web`). A build artifact is not a source archive.
- Always confirm both artifacts exist, and separately verify Google Drive uploads. Do not claim Drive backup until fetching it back.
