import { existsSync, readFileSync, statSync } from 'node:fs';

const files = {
  html: readFileSync('index.html', 'utf8'),
  main: readFileSync('src/main.ts', 'utf8'),
  renderer: readFileSync('src/rendering/DreamPixiRenderer.ts', 'utf8'),
  css: readFileSync('src/styles.css', 'utf8'),
  difficulty: readFileSync('src/game/difficulty.js', 'utf8'),
  sw: readFileSync('public/sw.js', 'utf8'),
  vite: readFileSync('vite.config.js', 'utf8'),
  pages: readFileSync('.github/workflows/github-pages.yml', 'utf8'),
  quality: readFileSync('.github/workflows/quality-check.yml', 'utf8'),
  handoff: existsSync('AI_HANDOFF_DR.md') ? readFileSync('AI_HANDOFF_DR.md', 'utf8') : '',
  readme: readFileSync('README.md', 'utf8'),
  pkgText: readFileSync('package.json', 'utf8'),
  pkg: JSON.parse(readFileSync('package.json', 'utf8'))
};

const errors = [];
const requireIncludes = (name, text, token) => {
  if (!text.includes(token)) errors.push(`${name} missing ${token}`);
};

if (!['1.0.81', '1.0.82', '1.0.83'].includes(files.pkg.version)) errors.push(`package version must stay in the supported v1.0.81-v1.0.82 range, got ${files.pkg.version}`);
requireIncludes('package.json', files.pkgText, 'check:camera-status-image-budget');
requireIncludes('index.html', files.html, 'data-real-device-camera-feel="v1081-real-device-camera-feel"');
requireIncludes('index.html', files.html, 'data-boss-status-priority="v1081-boss-status-priority"');
requireIncludes('index.html', files.html, 'data-image-boot-budget="v1081-image-boot-budget"');
requireIncludes('src/main.ts', files.main, "const REAL_DEVICE_CAMERA_FEEL_PATCH = 'v1081-real-device-camera-feel'");
requireIncludes('src/main.ts', files.main, "const BOSS_STATUS_PRIORITY_PATCH = 'v1081-boss-status-priority'");
requireIncludes('src/main.ts', files.main, "const IMAGE_BOOT_BUDGET_PATCH = 'v1081-image-boot-budget'");
requireIncludes('src/rendering/DreamPixiRenderer.ts', files.renderer, "const REAL_DEVICE_CAMERA_FEEL_PATCH = 'v1081-real-device-camera-feel'");
requireIncludes('src/rendering/DreamPixiRenderer.ts', files.renderer, 'getPanStartThreshold');
requireIncludes('src/rendering/DreamPixiRenderer.ts', files.renderer, 'resolveGestureAxis');
requireIncludes('src/rendering/DreamPixiRenderer.ts', files.renderer, 'pinchSettledAt');
requireIncludes('src/rendering/DreamPixiRenderer.ts', files.renderer, 'distanceDelta < 16');
requireIncludes('src/rendering/DreamPixiRenderer.ts', files.renderer, 'Math.abs(ratio - 1) < 0.065');
requireIncludes('src/rendering/DreamPixiRenderer.ts', files.renderer, 'event.shiftKey && absY > 0');
requireIncludes('src/styles.css', files.css, 'v1.0.81 real-device camera feel, boss status priority and image boot budget');
requireIncludes('src/styles.css', files.css, 'grid-template-columns: 40px minmax(0, 1fr) 34px');
requireIncludes('src/styles.css', files.css, 'touch-pan-threshold pinch-warmup-guard pixi-chunk-follow-up');
requireIncludes('src/game/difficulty.js', files.difficulty, 'storybook-login.webp');
requireIncludes('src/game/difficulty.js', files.difficulty, 'dream-library-25d.webp');
requireIncludes('src/game/difficulty.js', files.difficulty, 'texture-atlas-manifest-v1.0.81.json');
requireIncludes('public/sw.js', files.sw, 'dream-library-cache-v1.0.81');
requireIncludes('public/sw.js', files.sw, 'storybook-login.webp');
requireIncludes('public/sw.js', files.sw, 'texture-atlas-manifest-v1.0.81.json');
requireIncludes('vite.config.js', files.vite, 'vendor-pixi-core-v1081');
requireIncludes('vite.config.js', files.vite, 'vendor-pixi-scene-v1081');
requireIncludes('github-pages.yml', files.pages, 'npm run check:camera-status-image-budget');
requireIncludes('quality-check.yml', files.quality, 'npm run check:camera-status-image-budget');
requireIncludes('README.md', files.readme, 'v1.0.81');
requireIncludes('AI_HANDOFF_DR.md', files.handoff, 'v1.0.81');

const webpTargets = [
  ['public/assets/backgrounds/storybook-login.webp', 'public/assets/backgrounds/storybook-login.png'],
  ['public/assets/backgrounds/dream-library-25d.webp', 'public/assets/backgrounds/dream-library-25d.png']
];
for (const [webp, png] of webpTargets) {
  if (!existsSync(webp)) errors.push(`missing compressed background ${webp}`);
  if (!existsSync(png)) errors.push(`missing fallback background ${png}`);
  if (existsSync(webp) && existsSync(png) && statSync(webp).size >= statSync(png).size * 0.45) {
    errors.push(`${webp} must be materially smaller than png fallback`);
  }
}
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.81.json')) errors.push('missing v1.0.81 texture atlas manifest');

for (const banned of ['data-boss-layout="statusbar-icon-right-v1046"', 'board-minimap', '보기 맞춤', '드래그 이동', '손가락 시작', 'data-legacy-role-copy']) {
  if (`${files.html}\n${files.main}\n${files.css}`.includes(banned)) errors.push(`Removed or legacy UI token returned: ${banned}`);
}

if (errors.length) {
  console.error(`Camera/status/image budget QA failed: ${errors.join('; ')}`);
  process.exit(1);
}
console.log('Camera/status/image budget QA passed for supported v1.0.81-v1.0.82 range.');
