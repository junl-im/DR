# Dungeon ZERO verified hosting release — 2026-10-12

## Purpose

A no-gameplay-change release checkpoint following integration of Codex PR #1 and chat PR #2. Main baseline before this commit: `3637e1d4b74c66cd1e1b5065ee7d0cfed0597a86`.

## Trigger

`.github/workflows/publish-game.yml` runs on a push to `main` and supports manual `workflow_dispatch`. The verification job runs core/client tests, TypeScript validation, asset audit, builds both Firebase-root and GitHub Pages (/DR/) static content, and preserves an Actions artifact. GitHub Pages and Firebase Hosting are deployed separately.

## Hosting-only security guarantee

- Repository secret name required by the workflow: `FIREBASE_SERVICE_ACCOUNT_DREAM_LIBRARY_B732A`. **Never** put its JSON body in commits, logs, notes, screenshots or chat.
- Firebase project ID: `dream-library-b732a`; hosting URL: https://dream-library-b732a.web.app
- Hosting action targets `channelId: live` and only uploads the built web bundle. It does **not** deploy Firestore rules, indexes, or delete saved user data.
- The game remains a local/single-player browser prototype; do not enable an always-on PC server. Preserve `schemaVersion: 1` and the original NJ-MMO notices.
- If the Firebase secret is unavailable, the workflow marks Hosting as skipped even if its job reports success. Verify the **Publish Hosting ONLY** step itself succeeded.
- GitHub Pages fallback: https://junl-im.github.io/DR/

## After every release

1. Inspect the exact main SHA and the latest `Dungeon zero verified publish` run.
2. Verify all three jobs and that the Firebase publish step says `success` (not `skipped`).
3. Verify the public pages serve the new build with correct asset paths.
4. Archive the source/build/proof ZIP and publish the release note to Notion and Drive.
5. Check actual Android touch and thermal/FPS behavior separately; browser WebGL screenshots do not prove this.

If a hosting deployment fails, do not regenerate the service-account key or change Firestore rules automatically. Diagnose permissions/credentials first and revert the hosting release via the Firebase Hosting console if necessary.
