# Quest, combat continuity and character window

## Problems and behavior
- A completed field quest had a disabled claim button outside the village. An open journal also kept stale progress and disabled state. The journal now refreshes during combat. Its explicit return-and-claim button uses ordinary recall, then the existing village-only, exactly-once reward handler. Gold, wood, potions and fragments are unchanged. In-flight autosaves finish before the reward snapshot is persisted.
- Both hotbar and keyboard skill/potion handlers stopped the auto controller. They now preserve it, including movement toward quest targets and reacquisition after a skill kills the current mob. Movement, recall and manual attack retain manual control.
- Real hurt events carry their attacker ID. Initial on-hit defense starts an anchored hunt and selects that living attacker, respecting zone, range and the 22% HP safety cutoff. Manual OFF and controller safety stops disarm on-hit defense. A settings checkbox can rearm it; starting auto also rearms it. This is session-local, not a save-schema migration.
- The top-left status card opens a live character window by touch/click or Enter/Space. It shows actual combat stats and equipment state. User-supplied names are rendered with textContent. Mobile uses the window close button when the window covers the card.
- Quest claiming also explicitly rejects the dungeon zone, instead of relying only on coordinates.

## Verification
- combat-link.spec.ts: real incoming-hit metadata, manual/safety stop, skill-kill reacquisition, potion continuity, stale/wrong-zone/low-HP rejection, village-only and exactly-once reward/reload.
- combat-quest-smoke.cjs: PC 1440x900 and mobile 390x844, real travel and three kills, open-journal updates, UI/keyboard skills, all reward resource deltas, saved reload, ordinary path movement into a naturally attacking monster, manual OFF after subsequent hits, and character UI/keyboard controls.
- Included in the full WebGL workflow with a separate evidence artifact. This is software Chromium/mobile emulation, not physical Android or Kakao performance certification.
- PR #22 remains a separate preserved branch; this change does not merge or replace it.
