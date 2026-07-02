import { existsSync, readFileSync, statSync } from 'node:fs';

const files = {
  html: readFileSync('index.html', 'utf8'),
  main: readFileSync('src/main.ts', 'utf8'),
  css: readFileSync('src/styles.css', 'utf8'),
  difficulty: readFileSync('src/game/difficulty.js', 'utf8'),
  sw: readFileSync('public/sw.js', 'utf8'),
  vite: readFileSync('vite.config.js', 'utf8'),
  pages: readFileSync('.github/workflows/github-pages.yml', 'utf8'),
  quality: readFileSync('.github/workflows/quality-check.yml', 'utf8'),
  pkgText: readFileSync('package.json', 'utf8'),
  pkg: JSON.parse(readFileSync('package.json', 'utf8')),
  readme: readFileSync('README.md', 'utf8'),
  handoff: existsSync('AI_HANDOFF_DR.md') ? readFileSync('AI_HANDOFF_DR.md', 'utf8') : ''
};

const errors = [];
const requireIncludes = (name, text, token) => {
  if (!text.includes(token)) errors.push(`${name} missing ${token}`);
};

if (files.pkg.version !== '1.0.85') errors.push(`package version must be 1.0.85, got ${files.pkg.version}`);
requireIncludes('package.json', files.pkgText, 'check:mobile-rank-fallback-anchor');

for (const token of ['v1084-mobile-rank-chip-wrap', 'v1084-asset-fallback-load-polish', 'v1084-lobby-anchor-settle-qa', 'v1084-boss-atlas-build-verify']) {
  requireIncludes('index.html', files.html, token);
  if (token !== 'v1084-boss-atlas-build-verify') requireIncludes('src/main.ts', files.main, token);
  requireIncludes('src/styles.css', files.css, token);
  requireIncludes('README.md', files.readme, token);
  requireIncludes('AI_HANDOFF_DR.md', files.handoff, token);
}

requireIncludes('src/main.ts', files.main, 'MOBILE_RANK_CHIP_WRAP_PATCH');
requireIncludes('src/main.ts', files.main, 'ASSET_FALLBACK_LOAD_POLISH_PATCH');
requireIncludes('src/main.ts', files.main, 'LOBBY_ANCHOR_SETTLE_QA_PATCH');
requireIncludes('src/main.ts', files.main, 'data-rank-chip-wrap');
requireIncludes('src/main.ts', files.main, 'compactSourceLabel');
requireIncludes('src/main.ts', files.main, '방금</i>');
requireIncludes('src/main.ts', files.main, 'outside = nodeRect.top < dockRect.top + 18');
requireIncludes('src/main.ts', files.main, 'data-asset-fallback-load-polish');
requireIncludes('src/main.ts', files.main, '--imported-moon-library-url');
requireIncludes('src/main.ts', files.main, '--frame-library-v2-url');

requireIncludes('src/styles.css', files.css, '.rank-row[data-rank-chip-wrap="v1084-mobile-rank-chip-wrap"]');
requireIncludes('src/styles.css', files.css, '@media (max-width: 430px)');
requireIncludes('src/styles.css', files.css, '.lobby-panel-dock[data-lobby-anchor-settle-qa="v1084-lobby-anchor-settle-qa"]');
requireIncludes('src/styles.css', files.css, 'imported-moon-library-webp frame-library-webp boss-atlas-build-verify');
if (files.css.includes("url('/DR/assets/atlas/boss-frames-v2")) errors.push('hardcoded /DR boss atlas CSS URL returned and may trigger resolve warnings');

for (const asset of [
  ['public/assets/backgrounds/imported-moon-library.webp', 'public/assets/backgrounds/imported-moon-library.png'],
  ['public/assets/ui/frame-library-v2.webp', 'public/assets/ui/frame-library-v2.png']
]) {
  const [webp, png] = asset;
  if (!existsSync(webp)) errors.push(`missing ${webp}`);
  if (!existsSync(png)) errors.push(`missing ${png}`);
  if (existsSync(webp) && existsSync(png) && statSync(webp).size >= statSync(png).size * 0.45) {
    errors.push(`${webp} must be materially smaller than PNG fallback`);
  }
  requireIncludes('src/game/difficulty.js', files.difficulty, webp.replace('public/', ''));
  requireIncludes('public/sw.js', files.sw, webp.replace('public/', './'));
}

requireIncludes('public/sw.js', files.sw, 'dream-library-cache-v1.0.85');
requireIncludes('public/sw.js', files.sw, 'texture-atlas-manifest-v1.0.85.json');
requireIncludes('src/game/difficulty.js', files.difficulty, 'texture-atlas-manifest-v1.0.85.json');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.85.json')) errors.push('missing v1.0.85 texture atlas manifest');

for (const token of ['vendor-firebase-firestore-v1083', 'vendor-pixi-core-v1081']) {
  requireIncludes('vite.config.js', files.vite, token);
}
requireIncludes('github-pages.yml', files.pages, 'npm run check:mobile-rank-fallback-anchor');
requireIncludes('quality-check.yml', files.quality, 'npm run check:mobile-rank-fallback-anchor');

for (const banned of ['data-boss-layout="statusbar-icon-right-v1046"', 'board-minimap', '보기 맞춤', '드래그 이동', '손가락 시작', 'data-legacy-role-copy']) {
  if (`${files.html}\n${files.main}\n${files.css}`.includes(banned)) errors.push(`Removed or legacy UI token returned: ${banned}`);
}

if (errors.length) {
  console.error(`Mobile rank/fallback/lobby anchor QA failed: ${errors.join('; ')}`);
  process.exit(1);
}
console.log('Mobile rank chip, asset fallback and lobby anchor QA passed for v1.0.85.');
