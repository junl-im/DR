# Title screen — 2026-10-13

Based on main c86333e. User requested a full-screen representative illustration and a real game entrance with only character name, character choice and start. Existing local save continuation and recovery remain available.

## Design and implementation

Original ruined portal/castle illustration, cold teal lighting and amber bronze accents. Three portrait radio cards replace dropdowns: existing class IDs 0, 10 and 18. Selection updates the description; the native form supports keyboard submission. Experimental appearance selection is removed from the product form; internal art query fixtures remain for QA. Saved names use textContent. No save schema or world model change.

## Asset provenance

Both images generated specifically for Dungeon zero using OpenAI imagegen on 2026-10-13. No Lineage or third-party game artwork copied. Original concepts: portal, cloaked adventurer, remote castle; guardian, scholar and ranger triptych. Sharp WebP quality 85, effort 6 encoding. These illustrations represent title/selection artwork; playable models are unchanged.

- title-hero-v1.webp: 233034 bytes; SHA-256 458b7185de0ae5ea3d25a83c27f25ed883c28105860a3d947b34527324210f72
- character-portraits-v1.webp: 357092 bytes; SHA-256 6d6b14e36c6675b3fda90eb6b176a62bbb0bb6d2408b1f7d24f192f012f1d4f4

## Verification

Typecheck and Firebase build passed. scripts/title-screen-smoke.cjs covers layouts at 1440×900, 390×844, 320×568 and 844×390, no horizontal overflow, both image URLs, three radios and no dropdowns. Desktop and mobile create class 10 named 새벽의학자, save, reload and continue with original name/class intact. Browser screenshots and report: artifacts/title-screen-proof. Small and short screens scroll to keep all controls reachable. Existing mobile fullscreen/back/save failure smoke and CI verify regression flows. Final CI/merge/deployment evidence is recorded in Notion.
