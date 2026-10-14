# Game pages and installation

Overflowing game windows now use fixed previous/next screen buttons with page counts. Pages overlap by the sticky heading height plus 96px so tall rows and actions are not lost at a cut. Options have three category tabs. Navigation is keyboard accessible with PageUp/PageDown and left/right arrows on the pager; no draggable rails are displayed. Inventory, item details, hunt settings and history reuse the same viewport paging.

The signature gateway/Z icon is original project SVG artwork, exported to 32,180,192,512 PNG and a safe-zone maskable icon. PWA manifest has a relative id/start/scope for Firebase root and GitHub /DR/. Install uses beforeinstallprompt when available, appinstalled tracking, iOS Safari home-screen instructions, and Kakao external-browser guidance. Installation is available from the title and options rather than covering combat controls.

A service worker is deliberately not registered in this update: installation does not require one; offline gameplay/download is not yet implemented. This avoids stale cached game builds and mixing API/account responses into caches. Reference: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable

Verification covers five desktop/mobile/landscape viewports, real icon HTTP responses, real option categories and last inventory shop action. The prompt callback uses a synthetic beforeinstallprompt fixture in headless Chromium; an actual OS install and real iOS/Kakao devices require device verification. Existing game/persistence/quest proofs are preserved and navigate the new category before saving.

Follow-up: real public 360px action-by-action proof exposed weapon/equipment controls skipped beneath the sticky title. Page travel now subtracts the measured sticky title plus 96px for the navigation and a complete touch action. Short landscape modals use the available viewport height. Every weapon/crafting/shop control must be fully exposed and hit-test visible during button-only paging; the proof explicitly navigates back to the shop when equipment follows it.
