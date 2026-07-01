import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const files = {
  html: readFileSync('index.html', 'utf8'),
  main: readFileSync('src/main.ts', 'utf8'),
  css: readFileSync('src/styles.css', 'utf8'),
  pkg: JSON.parse(readFileSync('package.json', 'utf8')),
  sw: readFileSync('public/sw.js', 'utf8'),
  difficulty: readFileSync('src/game/difficulty.js', 'utf8'),
  pages: readFileSync('.github/workflows/github-pages.yml', 'utf8'),
  quality: readFileSync('.github/workflows/quality-check.yml', 'utf8'),
  handoff: existsSync('AI_HANDOFF_DR.md') ? readFileSync('AI_HANDOFF_DR.md', 'utf8') : '',
  readme: readFileSync('README.md', 'utf8')
};

const errors = [];
const requireIncludes = (name, text, token) => {
  if (!text.includes(token)) errors.push(`${name} missing ${token}`);
};

if (!['1.0.79', '1.0.80'].includes(files.pkg.version)) errors.push(`package version must be 1.0.79 or 1.0.80, got ${files.pkg.version}`);
requireIncludes('package.json', JSON.stringify(files.pkg), 'check:modal-focus-rank-budget');

for (const token of ['v1079-modal-focus-return', 'v1079-firebase-free-read-budget', 'v1079-vendor-effects-split', 'v1079-image-optimization-candidates']) {
  requireIncludes('index.html', files.html, token);
  requireIncludes('src/main.ts', files.main, token);
  requireIncludes('src/styles.css', files.css, token);
  requireIncludes('README.md', files.readme, token);
  requireIncludes('AI_HANDOFF_DR.md', files.handoff, token);
}

requireIncludes('src/main.ts', files.main, 'import type { DreamPixiRenderer, BoardPoint }');
requireIncludes('src/main.ts', files.main, "import('./rendering/DreamPixiRenderer')");
requireIncludes('vite.config.js', readFileSync('vite.config.js', 'utf8'), 'vendor-motion-v1079');
requireIncludes('vite.config.js', readFileSync('vite.config.js', 'utf8'), 'vendor-spine-v1079');
requireIncludes('src/main.ts', files.main, 'function loadRendererRuntime');
requireIncludes('src/main.ts', files.main, 'function rememberModalReturnFocus');
requireIncludes('src/main.ts', files.main, 'function restoreModalReturnFocus');
requireIncludes('src/main.ts', files.main, 'function canUseFirebaseRankRead');
requireIncludes('src/main.ts', files.main, 'RANKING_CACHE_TTL_MS');
requireIncludes('src/main.ts', files.main, 'FIREBASE_RANK_DAILY_READ_LIMIT');
requireIncludes('src/main.ts', files.main, 'RANKING_GLOBAL_CACHE_KEY');
requireIncludes('src/main.ts', files.main, 'RANKING_DAILY_CACHE_KEY');
requireIncludes('index.html', files.html, 'data-modal-focus-return="v1079-modal-focus-return"');
requireIncludes('index.html', files.html, 'data-firebase-free-read-budget="v1079-firebase-free-read-budget"');
requireIncludes('src/styles.css', files.css, 'modalFocusReturnPulse1079');
requireIncludes('src/styles.css', files.css, 'body[data-vendor-effects-split^="v1079-vendor-effects-split"]');
requireIncludes('public/sw.js', files.sw, 'dream-library-cache-v1.0.79');
requireIncludes('public/sw.js', files.sw, 'texture-atlas-manifest-v1.0.79.json');
requireIncludes('src/game/difficulty.js', files.difficulty, 'texture-atlas-manifest-v1.0.79.json');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.79.json')) errors.push('missing v1.0.79 texture atlas manifest');
requireIncludes('github-pages.yml', files.pages, 'npm run check:modal-focus-rank-budget');
requireIncludes('quality-check.yml', files.quality, 'npm run check:modal-focus-rank-budget');

if (files.main.includes("setAttribute('data-boss-layout', 'statusbar-icon-right-v1046')")) errors.push('legacy right-side boss icon layout returned in main.');
if (files.html.includes('data-boss-layout="statusbar-icon-right-v1046"')) errors.push('legacy right-side boss icon layout returned in HTML.');
for (const banned of ['board-minimap', '보기 맞춤', '드래그 이동', '손가락 시작']) {
  if (`${files.html}\n${files.main}\n${files.css}`.includes(banned)) errors.push(`Removed UI token returned: ${banned}`);
}

const bigImages = [];
walk(join(process.cwd(), 'public', 'assets'), (file) => {
  if (!/\.(png|jpe?g|webp)$/i.test(file)) return;
  const size = statSync(file).size;
  if (size > 1_200_000) bigImages.push(file.replace(process.cwd() + '/', ''));
});
if (bigImages.length < 1) errors.push('image optimization candidate audit should find or explicitly preserve large-image candidates.');

if (errors.length) {
  console.error(`Modal focus/rank budget QA failed: ${errors.join('; ')}`);
  process.exit(1);
}
console.log(`Modal focus/rank budget QA passed for v1.0.79. ${bigImages.length} image optimization candidates tracked.`);

function walk(dir, visitor) {
  for (const entry of readdirSync(dir)) {
    const file = join(dir, entry);
    const stat = statSync(file);
    if (stat.isDirectory()) walk(file, visitor);
    else visitor(file);
  }
}
