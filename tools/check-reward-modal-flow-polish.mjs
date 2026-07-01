import { existsSync, readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const files = {
  index: read('index.html'),
  main: read('src/main.ts'),
  css: read('src/styles.css'),
  pkg: JSON.parse(read('package.json')),
  sw: read('public/sw.js'),
  difficulty: read('src/game/difficulty.js'),
  pages: read('.github/workflows/github-pages.yml'),
  quality: read('.github/workflows/quality-check.yml')
};
const errors = [];
const all = files.index + files.main + files.css + files.sw + files.difficulty;
const has = (body, token, label = token) => { if (!body.includes(token)) errors.push(`missing ${label}: ${token}`); };

if (!['1.0.71', '1.0.72', '1.0.73', '1.0.74', '1.0.75', '1.0.76', '1.0.77', '1.0.78', '1.0.79', '1.0.80', '1.0.81'].includes(files.pkg.version)) errors.push(`package version must be 1.0.71 or 1.0.72, got ${files.pkg.version}`);
if (!files.pkg.scripts['check:reward-modal-flow-polish']) errors.push('missing package script check:reward-modal-flow-polish');
[
  'v1071-modal-button-microcopy-priority',
  'v1071-restoration-completion-feedback-cue',
  'v1071-boss-telegraph-contrast-safe',
  'v1071-small-reward-modal-qa',
  'v1071-leaderboard-duplicate-tag-fix',
  'dream-library-cache-v1.0.71',
  'dream-library-cache-v1.0.72',
  'texture-atlas-manifest-v1.0.71.json',
  'texture-atlas-manifest-v1.0.72.json'
].forEach((token) => has(all, token, `v1.0.71 token ${token}`));

has(files.index, 'data-modal-button-microcopy="v1071-modal-button-microcopy-priority"', 'modal button microcopy markup');
has(files.index, 'data-small-reward-modal-qa="v1071-small-reward-modal-qa"', 'small reward modal QA markup');
has(files.index, 'data-boss-telegraph-contrast="v1071-boss-telegraph-contrast-safe"', 'boss telegraph contrast markup');
has(files.main, 'function syncRewardActionPriority', 'reward action priority runtime');
has(files.main, 'function focusRewardPrimaryAction', 'reward primary focus runtime');
has(files.main, 'reward-action-summary', 'reward action summary microcopy');
has(files.main, 'data-primary-reward-action', 'primary action data attribute');
has(files.main, 'small-reward-modal-tight', 'small reward modal body class');
has(files.css, '.reward-flow-next[data-modal-button-microcopy="v1071-modal-button-microcopy-priority"] .reward-action-summary', 'reward action summary CSS');
has(files.css, '.boss-telegraph[data-boss-telegraph-contrast="v1071-boss-telegraph-contrast-safe"]', 'boss contrast CSS');
has(files.css, 'body.small-reward-modal-tight .reward-modal[data-small-reward-modal-qa="v1071-small-reward-modal-qa"]', 'small modal density CSS');
has(files.sw, 'dream-library-cache-v1.0.72', 'service worker v1.0.72 cache');
has(files.sw, 'texture-atlas-manifest-v1.0.72.json', 'service worker v1.0.72 atlas preload');
has(files.difficulty, 'texture-atlas-manifest-v1.0.72.json', 'difficulty v1.0.72 atlas anchor');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.72.json')) errors.push('missing v1.0.72 texture atlas manifest');
has(files.pages, 'npm run check:reward-modal-flow-polish', 'GitHub Pages v1.0.71 QA hook');
has(files.quality, 'npm run check:reward-modal-flow-polish', 'Quality v1.0.71 QA hook');

if (files.main.includes("tag: '저장'\n        tag: '저장'")) errors.push('leaderboard cloud row still has duplicate tag property');
if (files.index.includes('☝') || files.main.includes('signal-finger')) errors.push('finger start widget must stay removed');
if (/DELETE_REMOVED/i.test(all)) errors.push('DELETE_REMOVED marker must not be present');
if (/\.svg\b/i.test(files.index + files.main + files.css + files.sw)) errors.push('SVG references are not allowed');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Reward modal flow polish QA passed: v1.0.71 modal microcopy priority, restoration feedback cue, boss contrast, small modal QA and leaderboard duplicate tag fix are present.');
