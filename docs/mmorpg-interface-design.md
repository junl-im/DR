# Dungeon ZERO — MMORPG interface art direction

Figma: https://www.figma.com/design/lgh21KQe2JsFoRg8HUpk0f?node-id=3-36

The design uses obsidian surfaces, lightly textured leather, oxidized silver frames, old gold action accents, ruby health and blue mana. It draws on the information density and material hierarchy of classic MMORPG interfaces while using original project artwork.

The editable Figma direction board includes local aliased color variables, Noto Sans KR text styles, engraved-button variants and inventory-socket components. It is a component and layout specification, not a flattened screenshot of the game. The live game adds the original vector frame, existing licensed icon atlas and responsive layout.

Implementation:
- `client/src/local/mmorpg-interface.css`: shared window, title bar, button, item dossier, HUD and entry-screen treatment; mobile 44px controls and reduced-motion support.
- `client/public/art/mmorpg-frame.svg`: newly authored vector nine-slice frame. Original project asset, distributed under the repository MIT license. No Lineage/Elbera UI image or texture is included.
- `client/src/local/inventory-window.ts`: original equipment silhouette; selected-item information and actions appear directly below the bag instead of after the crafting list. Existing crafting, equipment, filters and save rules are preserved.

Reference: https://github.com/elberacasa/Lineage2Elbera (visual direction only).

Validation includes existing integrated HUD/UI checks, desktop/mobile window geometry and touch targets, inventory crafting/equip/unequip regressions, full code CI and WebGL regression before release. Figma fonts and editable layer structure are inspected independently.
