import { existsSync, readFileSync } from 'node:fs';

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

if (!['1.0.83', '1.0.84'].includes(files.pkg.version)) errors.push(`package version must be 1.0.83 or 1.0.84, got ${files.pkg.version}`);
requireIncludes('package.json', files.pkgText, 'check:rank-copy-webp-atlas');

for (const token of ['v1083-rank-ui-copy-polish', 'v1083-webp-fallback-qa', 'v1083-boss-atlas-resolve-guard']) {
  requireIncludes('index.html', files.html, token);
  requireIncludes('src/main.ts', files.main, token);
  requireIncludes('src/styles.css', files.css, token);
  requireIncludes('README.md', files.readme, token);
  requireIncludes('AI_HANDOFF_DR.md', files.handoff, token);
}

requireIncludes('src/main.ts', files.main, 'function getRankStatusCopy');
requireIncludes('src/main.ts', files.main, 'function getRankSourceSummary');
requireIncludes('src/main.ts', files.main, 'RANK_STATUS_COPY_KEY');
requireIncludes('src/main.ts', files.main, '클라우드와 기기 기록');
requireIncludes('src/main.ts', files.main, '무료 보호 중');
requireIncludes('src/main.ts', files.main, 'syncImageFallbackCapability');
requireIncludes('src/main.ts', files.main, 'data-webp-fallback-qa');
requireIncludes('src/main.ts', files.main, 'data-boss-atlas-resolve-guard');

requireIncludes('src/styles.css', files.css, 'boss-atlas-no-hardcoded-dr-url');
requireIncludes('src/styles.css', files.css, 'html[data-webp-fallback-qa="v1083-webp-fallback-qa"]');
requireIncludes('src/styles.css', files.css, '.rank-source-note[data-rank-ui-copy-polish="v1083-rank-ui-copy-polish"]');
if (files.css.includes("url('/DR/assets/atlas/boss-frames-v2")) errors.push('hardcoded /DR boss atlas CSS URL returned and may trigger resolve warnings');

requireIncludes('public/sw.js', files.sw, 'dream-library-cache-v1.0.83');
requireIncludes('public/sw.js', files.sw, 'texture-atlas-manifest-v1.0.83.json');
requireIncludes('src/game/difficulty.js', files.difficulty, 'texture-atlas-manifest-v1.0.83.json');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.83.json')) errors.push('missing v1.0.83 texture atlas manifest');

for (const token of ['vendor-firebase-firestore-v1083', 'vendor-firebase-auth-v1083', 'vendor-firebase-app-v1083']) {
  requireIncludes('vite.config.js', files.vite, token);
}
requireIncludes('github-pages.yml', files.pages, 'npm run check:rank-copy-webp-atlas');
requireIncludes('quality-check.yml', files.quality, 'npm run check:rank-copy-webp-atlas');

for (const banned of ['data-boss-layout="statusbar-icon-right-v1046"', 'board-minimap', '보기 맞춤', '드래그 이동', '손가락 시작', 'data-legacy-role-copy']) {
  if (`${files.html}\n${files.main}\n${files.css}`.includes(banned)) errors.push(`Removed or legacy UI token returned: ${banned}`);
}

if (errors.length) {
  console.error(`Rank copy/WebP/boss atlas QA failed: ${errors.join('; ')}`);
  process.exit(1);
}
console.log('Rank copy, WebP fallback and boss atlas resolve QA passed for v1.0.83.');
