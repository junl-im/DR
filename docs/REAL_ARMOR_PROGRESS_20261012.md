# Dungeon zero local real armor progression — 2026-10-12

## Boundaries and status
- Code stays in draft PR #2; main, the Codex reference PR #1 and the public Firebase Pages/hosting version remain unchanged.
- This is **single-player local prototype progression**, not a trustworthy multiplayer economy. Neither on-client saves nor Firestore string payloads can prevent a malicious client from editing resource counts; server-authoritative validation would be required for online exchange.
- Save `schemaVersion=1`, existing Firestore document envelope and IndexedDB keys remain unchanged. `player.armor` is a new optional nested field. Older saves lacking it are upgraded in memory with **zero owned equipment**, not granted items.

## Item catalog
- Four slots: helmet / body / gloves / boots.
- Each has two craftable tiers: medium (+1 defense) and heavy (+2 defense), for 8 unique non-stackable items.
- `owned[slot]` bit 1 (medium), bit 2 (heavy). `equipped[slot]` 0 (unarmored), 1, or 2. Storage validates slot names, integer bounds, ownership before equip and rejects unexpected keys.
- Local monsters drop one armor fragment every 2 actual kills (deterministic, no extra PRNG calls). Costs: medium 24 gold +3 wood+2 fragments; heavy 90 gold+10 wood+8 fragments, each crafted once at the existing supply-shop radius.
- Armor defense sums tiers, reducing existing local NPC contact damage `max(1, 7-defense)`. With no equipped gear, damage remains 7. No weapon attack modifications.
- Craft/equip/unequip are dispatched as typed intents; resource costs are taken atomically after validation, duplicate craft and unowned equip rejected, unequip does not destroy items.

## Integration
- HUD shows armor defense, inventory shows 4 slot statuses and crafting actions. Real earned armor appears inside the existing 24-slot bag; armor icons mark equipped pieces with E.
- V3 `knight/ranger/traveler` avatars are all compatible with four-slot skin swaps on one animated skeleton. Render bridge maps tiers 0/1/2 to traveler/ranger/knight visual components. Other original KayKit avatars continue gameplay stats, but do not yet show V3 armor geometry; we do not silently replace the player's chosen character rig.
- The existing V3 art lab remains a visual-only editor; owned items cannot be granted from that lab.
- Existing mob reward RNG, combat animation, movement navmesh, home teleport and gardening progression are preserved.

## Validation and risks
- Automated game-core/client, TypeScript, assets and static build gates verify the code. Visual WebGL screenshot checks were attempted but restricted by the browser sandbox (`ERR_BLOCKED_BY_ADMINISTRATOR`).
- The optional `player.armor` nested field is checked by client-side `validateSave`; Firebase Firestore rule continues to validate the same outer envelope `uid/schemaVersion/mode/payload/updatedAt`. Server cannot inspect or vouch for JSON nested economics.
- Never merge or deploy before PC/mobile screenshot verification, collision/clipping pass, and an end-to-end saved-game restoration smoke test on a controlled staging browser.

## Next release candidates
1. Base KayKit outfit-compatible armor geometry or explicit user-triggered appearance conversion, with valid licensing and rigging.
2. Real NPC smith UI, richer materials/recipes and equipment drop rarity after the four-slot tier economy is balanced.
3. Town road/decorative texture art, fixture screenshots across PC/mobile and performance measurements.
4. For multiplayer: authenticated authoritative equipment inventory, server-verified craft/drop/purchase transactions and abuse prevention; the current Firebase local-save envelope is not sufficient for this.
