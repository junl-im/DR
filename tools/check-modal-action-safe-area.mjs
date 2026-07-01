import { readFileSync, existsSync } from 'node:fs';

const files = {
  index: readFileSync('index.html', 'utf8'),
  main: readFileSync('src/main.ts', 'utf8'),
  css: readFileSync('src/styles.css', 'utf8'),
  pkg: JSON.parse(readFileSync('package.json', 'utf8')),
  sw: readFileSync('public/sw.js', 'utf8'),
  difficulty: readFileSync('src/game/difficulty.js', 'utf8'),
  pages: readFileSync('.github/workflows/github-pages.yml', 'utf8'),
  quality: readFileSync('.github/workflows/quality-check.yml', 'utf8')
};
const errors = [];
const has = (body, needle, label) => { if (!body.includes(needle)) errors.push(`missing ${label}: ${needle}`); };

if (!['1.0.70', '1.0.71', '1.0.72', '1.0.73', '1.0.74', '1.0.75', '1.0.76', '1.0.77'].includes(files.pkg.version)) errors.push(`package version must be 1.0.70 or 1.0.71, got ${files.pkg.version}`);
if (!files.pkg.scripts['check:modal-action-safe-area']) errors.push('missing package script check:modal-action-safe-area');
[
  'v1070-reward-action-accessibility-flow',
  'v1070-restoration-ceremony-feedback-cue',
  'v1070-boss-counter-line-polish',
  'v1070-mobile-safe-area-modal-qa',
  'v1070-compact-modal-action-flow',
  'dream-library-cache-v1.0.70',
  'texture-atlas-manifest-v1.0.70.json'
].forEach((token) => has(files.index + files.main + files.css + files.sw + files.difficulty, token, `v1.0.70 token ${token}`));
has(files.index, 'data-reward-action-accessibility="v1070-reward-action-accessibility-flow"', 'reward action accessibility markup');
has(files.index, 'data-mobile-safe-area-qa="v1070-mobile-safe-area-modal-qa"', 'mobile safe area markup');
has(files.index, 'data-boss-counter-line-polish="v1070-boss-counter-line-polish"', 'boss counter line markup');
has(files.main, 'function scheduleModalSafeAreaAudit', 'modal safe area scheduler');
has(files.main, 'function syncModalSafeAreaAudit', 'modal safe area sync');
has(files.main, 'boss-counter-route', 'boss counter line route markup');
has(files.main, 'reward-action-hint', 'reward action hint markup');
has(files.css, '.reward-actions[data-compact-modal-action-flow="v1070-compact-modal-action-flow"]', 'compact modal action CSS');
has(files.css, '.boss-attack-preview[data-boss-counter-line-polish="v1070-boss-counter-line-polish"]', 'boss counter line CSS');
has(files.css, '.restoration-ceremony-strip[data-restoration-ceremony-feedback="v1070-restoration-ceremony-feedback-cue"]', 'restoration feedback CSS');
has(files.sw, 'dream-library-cache-v1.0.70', 'service worker v1.0.70 cache');
has(files.sw, 'texture-atlas-manifest-v1.0.70.json', 'service worker v1.0.70 atlas preload');
has(files.difficulty, 'texture-atlas-manifest-v1.0.70.json', 'difficulty v1.0.70 atlas preload');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.70.json')) errors.push('missing v1.0.70 texture atlas manifest');
has(files.pages, 'npm run check:modal-action-safe-area', 'GitHub Pages v1.0.70 QA hook');
has(files.quality, 'npm run check:modal-action-safe-area', 'Quality v1.0.70 QA hook');
const duplicateCloseRewardHidden = files.main.includes("function closeReward() {\n  el.rewardModal.classList.add('hidden');\n  el.rewardModal.classList.add('hidden');");
if (duplicateCloseRewardHidden) errors.push('closeReward still duplicates hidden class addition');
if (files.index.includes('☝')) errors.push('finger start widget must stay removed');
if (/DELETE_REMOVED/i.test(files.index + files.css + files.main)) errors.push('DELETE_REMOVED marker must not be present');
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Modal action safe-area QA check passed: v1.0.70 improves reward action accessibility, restoration feedback cue, boss counter line, and compact modal safe-area flow.');
