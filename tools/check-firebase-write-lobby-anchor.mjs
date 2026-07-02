import { existsSync, readFileSync } from 'node:fs';

const files = {
  html: readFileSync('index.html', 'utf8'),
  main: readFileSync('src/main.ts', 'utf8'),
  auth: readFileSync('src/auth.js', 'utf8'),
  css: readFileSync('src/styles.css', 'utf8'),
  pkgText: readFileSync('package.json', 'utf8'),
  pkg: JSON.parse(readFileSync('package.json', 'utf8')),
  sw: readFileSync('public/sw.js', 'utf8'),
  difficulty: readFileSync('src/game/difficulty.js', 'utf8'),
  pages: readFileSync('.github/workflows/github-pages.yml', 'utf8'),
  quality: readFileSync('.github/workflows/quality-check.yml', 'utf8'),
  readme: readFileSync('README.md', 'utf8'),
  handoff: existsSync('AI_HANDOFF_DR.md') ? readFileSync('AI_HANDOFF_DR.md', 'utf8') : ''
};

const errors = [];
const requireIncludes = (name, text, token) => {
  if (!text.includes(token)) errors.push(`${name} missing ${token}`);
};

if (!['1.0.82', '1.0.83', '1.0.85'].includes(files.pkg.version)) errors.push(`package version must be 1.0.82 or 1.0.83, got ${files.pkg.version}`);
requireIncludes('package.json', files.pkgText, 'check:firebase-write-lobby-anchor');

for (const token of ['v1082-firebase-free-write-budget', 'v1082-lobby-panel-anchor-stability', 'v1082-qa-output-wording-refresh']) {
  requireIncludes('index.html', files.html, token);
  requireIncludes('src/main.ts', files.main, token);
  requireIncludes('src/styles.css', files.css, token);
  requireIncludes('README.md', files.readme, token);
  requireIncludes('AI_HANDOFF_DR.md', files.handoff, token);
}

requireIncludes('src/main.ts', files.main, 'FIREBASE_RANK_DAILY_WRITE_LIMIT');
requireIncludes('src/main.ts', files.main, 'FIREBASE_RANK_WRITE_BUDGET_KEY');
requireIncludes('src/main.ts', files.main, 'FIREBASE_SCORE_DEDUPE_KEY');
requireIncludes('src/main.ts', files.main, 'function canUseFirebaseRankWrite');
requireIncludes('src/main.ts', files.main, 'shouldSkipDuplicateScoreWrite');
requireIncludes('src/main.ts', files.main, 'force-respects-budget-v1082');
requireIncludes('src/main.ts', files.main, 'score completion refreshes the relevant board first');
requireIncludes('src/main.ts', files.main, 'lobbyPanelScrollAnchor');
requireIncludes('src/main.ts', files.main, 'function getLobbyPanelAnchorSelector');
requireIncludes('src/main.ts', files.main, 'dream-library-lobby-panel-scroll-anchor-v1082');

if (files.main.includes('const allow = force || Number(state.firebaseRankReadBudget.reads || 0) < FIREBASE_RANK_DAILY_READ_LIMIT')) {
  errors.push('force refresh must not bypass Firebase read budget after v1.0.82.');
}
if (files.main.includes('Promise.allSettled([loadLeaderboard({ force: true }), loadDailyLeaderboard({ force: true })])')) {
  errors.push('legacy dual forced leaderboard refresh returned.');
}

requireIncludes('src/auth.js', files.auth, 'FIREBASE_PROFILE_WRITE_GUARD_PATCH');
requireIncludes('src/auth.js', files.auth, 'PROFILE_WRITE_TTL_MS');
requireIncludes('src/auth.js', files.auth, 'function canWriteUserProfile');
requireIncludes('src/auth.js', files.auth, 'data-firebase-profile-write-guard');

requireIncludes('public/sw.js', files.sw, 'dream-library-cache-v1.0.82');
requireIncludes('public/sw.js', files.sw, 'texture-atlas-manifest-v1.0.82.json');
requireIncludes('src/game/difficulty.js', files.difficulty, 'texture-atlas-manifest-v1.0.82.json');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.82.json')) errors.push('missing v1.0.82 texture atlas manifest');

requireIncludes('github-pages.yml', files.pages, 'npm run check:firebase-write-lobby-anchor');
requireIncludes('quality-check.yml', files.quality, 'npm run check:firebase-write-lobby-anchor');

for (const banned of ['data-boss-layout="statusbar-icon-right-v1046"', 'board-minimap', '보기 맞춤', '드래그 이동', '손가락 시작', 'data-legacy-role-copy']) {
  if (`${files.html}\n${files.main}\n${files.css}`.includes(banned)) errors.push(`Removed or legacy UI token returned: ${banned}`);
}

if (errors.length) {
  console.error(`Firebase write/lobby anchor QA failed: ${errors.join('; ')}`);
  process.exit(1);
}
console.log('Firebase write budget and lobby anchor QA passed for supported v1.0.82-v1.0.85 range.');
