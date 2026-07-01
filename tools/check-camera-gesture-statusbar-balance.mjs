import { readFileSync, existsSync } from 'node:fs';

const files = {
  html: readFileSync('index.html', 'utf8'),
  main: readFileSync('src/main.ts', 'utf8'),
  renderer: readFileSync('src/rendering/DreamPixiRenderer.ts', 'utf8'),
  css: readFileSync('src/styles.css', 'utf8'),
  pkg: JSON.parse(readFileSync('package.json', 'utf8')),
  sw: readFileSync('public/sw.js', 'utf8'),
  difficulty: readFileSync('src/game/difficulty.js', 'utf8'),
  pages: readFileSync('.github/workflows/github-pages.yml', 'utf8'),
  quality: readFileSync('.github/workflows/quality-check.yml', 'utf8'),
  handoff: existsSync('AI_HANDOFF_DR.md') ? readFileSync('AI_HANDOFF_DR.md', 'utf8') : ''
};

const errors = [];
const requireIncludes = (name, text, token) => {
  if (!text.includes(token)) errors.push(`${name} missing ${token}`);
};

if (!['1.0.80', '1.0.81'].includes(files.pkg.version)) errors.push(`package version must be 1.0.80 or 1.0.81, got ${files.pkg.version}`);
requireIncludes('package.json', JSON.stringify(files.pkg), 'check:camera-gesture-statusbar-balance');
requireIncludes('index.html', files.html, 'data-camera-gesture-separation="v1080-camera-gesture-separation"');
requireIncludes('index.html', files.html, 'data-boss-status-balance="v1080-boss-statusbar-balance"');
requireIncludes('src/main.ts', files.main, "const BOSS_STATUSBAR_BALANCE_PATCH = 'v1080-boss-statusbar-balance'");
requireIncludes('src/main.ts', files.main, "const CAMERA_GESTURE_SEPARATION_PATCH = 'v1080-camera-gesture-separation'");
requireIncludes('src/main.ts', files.main, 'data-boss-status-balance');
requireIncludes('src/rendering/DreamPixiRenderer.ts', files.renderer, "const CAMERA_GESTURE_SEPARATION_PATCH = 'v1080-camera-gesture-separation'");
requireIncludes('src/rendering/DreamPixiRenderer.ts', files.renderer, "gestureMode: 'idle' | 'pan' | 'pinch' | 'wheel'");
requireIncludes('src/rendering/DreamPixiRenderer.ts', files.renderer, 'markCameraGestureState');
requireIncludes('src/rendering/DreamPixiRenderer.ts', files.renderer, 'panCameraBy');
requireIncludes('src/rendering/DreamPixiRenderer.ts', files.renderer, 'shouldTreatWheelAsPan');
if (!files.renderer.includes('distanceDelta < 10') && !files.renderer.includes('distanceDelta < 16')) errors.push('src/rendering/DreamPixiRenderer.ts missing pinch distance warmup guard');
requireIncludes('src/rendering/DreamPixiRenderer.ts', files.renderer, 'performance.now() < this.camera.panLockedUntil');
requireIncludes('src/styles.css', files.css, 'v1.0.80 camera gesture separation and boss statusbar balance');
requireIncludes('src/styles.css', files.css, 'wheel-horizontal-pan single-pointer-pan-no-zoom stable-right-status-slot');
requireIncludes('src/styles.css', files.css, '.boss-lane[data-boss-status-balance="v1080-boss-statusbar-balance"]');
requireIncludes('src/styles.css', files.css, 'grid-template-columns: 46px minmax(0, 1fr) 42px');
requireIncludes('src/styles.css', files.css, '.boss-lane-echo[data-boss-status-balance="v1080-boss-statusbar-balance"]');
requireIncludes('public/sw.js', files.sw, 'dream-library-cache-v1.0.80');
requireIncludes('public/sw.js', files.sw, 'texture-atlas-manifest-v1.0.80.json');
requireIncludes('src/game/difficulty.js', files.difficulty, 'texture-atlas-manifest-v1.0.80.json');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.80.json')) errors.push('missing v1.0.80 texture atlas manifest');
requireIncludes('github-pages.yml', files.pages, 'npm run check:camera-gesture-statusbar-balance');
requireIncludes('quality-check.yml', files.quality, 'npm run check:camera-gesture-statusbar-balance');
requireIncludes('AI_HANDOFF_DR.md', files.handoff, 'v1.0.80');

for (const banned of ['data-boss-layout="statusbar-icon-right-v1046"', 'board-minimap', '보기 맞춤', '드래그 이동', '손가락 시작']) {
  if (`${files.html}\n${files.main}\n${files.css}`.includes(banned)) errors.push(`Removed or legacy UI token returned: ${banned}`);
}

if (/wheel[\s\S]{0,180}zoomAt\(event\.clientX, event\.clientY/.test(files.renderer) && !files.renderer.includes('this.shouldTreatWheelAsPan(event)')) {
  errors.push('wheel zoom must pass through horizontal-pan guard first.');
}

if (errors.length) {
  console.error(`Camera gesture and boss statusbar balance QA failed: ${errors.join('; ')}`);
  process.exit(1);
}
console.log('Camera gesture and boss statusbar balance QA passed for v1.0.80.');
