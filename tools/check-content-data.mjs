import { readFileSync } from 'node:fs';

const stages = readFileSync('src/game/stages.js', 'utf8');
const bosses = readFileSync('src/game/bosses.js', 'utf8');
const main = readFileSync('src/main.ts', 'utf8');
const html = readFileSync('index.html', 'utf8');

const requiredStageTokens = ['getDailyChallenge', 'modifiers', 'fog', 'locked', 'timeSeal', 'bossPressure', 'bossId'];
const requiredBossTokens = ['forgotten-spirit', 'shadow-librarian', 'sealed-page-golem', 'comboWarningEvery', 'warningSeconds', 'telegraphTitle', 'pressurePenalty'];
const requiredMainTokens = ['renderRestoration', 'renderCollection', 'openRestorationDetail', 'loadDailyLeaderboard', 'dream-library-inventory', 'chapterTabs', 'initBackNavigation', 'handleSoftBack', 'exitToFirstScreen', 'handleSpecialTileGate', 'triggerBossTelegraph', 'renderLobbyMissionDeck', 'loadAudioRuntime', 'loadSpineRuntime', 'requestKakaoPortraitLock', 'showExitSleep', 'getLocalRankRows'];
const requiredHtmlTokens = ['collection-list', 'daily-leaderboard-list', 'restoration-detail-modal', 'boss-image', 'boss-pattern', 'exit-confirm-modal', 'exit-confirm-button', 'boss-telegraph', 'lobby-mission-deck', 'portrait-lock-overlay', 'exit-sleep-modal'];
const missing = [
  ...requiredStageTokens.filter((token) => !stages.includes(token)),
  ...requiredBossTokens.filter((token) => !bosses.includes(token)),
  ...requiredMainTokens.filter((token) => !main.includes(token)),
  ...requiredHtmlTokens.filter((token) => !html.includes(token))
];
if (missing.length) {
  console.error(`Content data check failed. Missing: ${missing.join(', ')}`);
  process.exit(1);
}
console.log('Content data policy passed for v1.0.22.');
