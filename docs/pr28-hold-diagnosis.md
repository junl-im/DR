# PR #28 mobile hold diagnosis (2026-10-13)

Original failing run: 38365365730, commit 567d6801502c94e0ad61f6e948ceafb42037b7ce. The compact HUD assertion saw `quest card` rather than `hunt-settings-open`. It did not record input events, so that run's exact scheduling/cancellation history cannot be recovered.

The later gear-tap substitution did not exercise the failed gesture. Restore a real CDP 750ms touch hold, release, following short taps, visible settings controls, gear toggle, and inventory isolation. Both Windows Chromium and a new Linux CI run passed the normal gesture without changing product code: the original failure is not consistently reproducible.

Confirmed product defect: `pointerup` unconditionally cancelled the 650ms timer without checking elapsed input time. If a busy event loop delays the timer callback until after release, a physical long press becomes an ordinary hunt toggle. An actual Chromium touch test delaying only the 650ms callback reproduced the old implementation's failure: the finger hit the A child of the 44px button, the quest stayed `quest card`, and hunt became ON. A deterministic unit regression also fails on the old source (settings callback called zero times).

Fix: track pointer identity and input-event timestamps; recognize an elapsed hold on release if its timer has not run. Trigger settings at most once. Preserve movement/cancellation suppression, and suppress touch-generated detail-zero clicks without blocking keyboard activation. Keep the global secondary-button input restrictions and the separate gear button unchanged.

The browser proof now runs real touch input in both normal and controlled delayed-timer modes. The fixture changes timer scheduling only; it never changes quest classes or calls the settings handler directly. The delayed fixture demonstrates a confirmed failure mode, not proof that the historical CI run had that exact delay. Whole-game CI and public-site verification remain required.

PR #22 preservation: remote `codex/hud-state-feedback` remains at 9f06524ba3086cb644a63170ae8cf1d051c2ace2. Its three-file change is preserved as a separate patch and Drive backup. A non-destructive merge-tree against main ad4b1e6be764f73f4e12610c9ef27e31a04096fc reports a content conflict in `client/src/local/local-main.ts`. Do not reset that branch, replace current main with its old base, or claim it was merged. Re-evaluate the conflict against the final merged main.
