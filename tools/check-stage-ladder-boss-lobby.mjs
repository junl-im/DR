import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const index = read('index.html');
const main = read('src/main.ts');
const stages = read('src/game/stages.js');
const difficulty = read('src/game/difficulty.js');
const css = read('src/styles.css');
const pkg = JSON.parse(read('package.json'));
const sw = read('public/sw.js');

const requireText = (haystack, needle, label) => {
  if (!haystack.includes(needle)) throw new Error(`[v1.0.45] missing ${label}: ${needle}`);
};

requireText(index, 'stage-ladder-summary', 'stage ladder summary mount');
requireText(index, 'statusbar-chip-right-v1045', 'boss chip-right layout');
requireText(main, 'renderStageLadderSummary', 'stage ladder renderer');
requireText(main, 'v1045-stage-ladder-42', 'stage ladder patch token');
requireText(main, 'v1045-deep-drag-rescue', 'lobby deep drag rescue token');
requireText(main, 'data-difficulty', 'stage node difficulty chip');
requireText(difficulty, "growth: {", 'growth difficulty');
requireText(difficulty, "expert: {", 'expert difficulty');
requireText(stages, 'chapter-07', 'seven chapter campaign');
requireText(stages, "stage('c7-06'", '42nd stage');
requireText(css, '.stage-ladder-summary', 'stage ladder CSS');
requireText(css, 'statusbar-chip-right-v1045', 'boss chip CSS');
requireText(css, 'data-lobby-drag-rescue="v1045-deep-drag-rescue"', 'lobby drag CSS hook');
requireText(sw, 'dream-library-cache-v1.0.45', 'service worker v1.0.45 cache');
requireText(sw, 'texture-atlas-manifest-v1.0.45.json', 'v1.0.45 manifest cache');
if (pkg.version !== '1.0.45') throw new Error(`[v1.0.45] package version mismatch: ${pkg.version}`);
if (!pkg.scripts['check:stage-ladder-boss-lobby']) throw new Error('[v1.0.45] missing package script check:stage-ladder-boss-lobby');

const stageMatches = [...stages.matchAll(/stage\('/g)].length;
if (stageMatches < 42) throw new Error(`[v1.0.45] expected at least 42 stage definitions, got ${stageMatches}`);

const forbidden = ['보기 맞춤', '중앙으로', '드래그 이동 도움말', 'board radar', 'minimap'];
for (const word of forbidden) {
  if (index.includes(word)) throw new Error(`[v1.0.45] forbidden UI copy remains: ${word}`);
}

console.log('[v1.0.45] stage ladder, boss chip-right layout and lobby drag rescue checks passed');
