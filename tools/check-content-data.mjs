import { readFileSync } from 'node:fs';

const stages = readFileSync('src/game/stages.js', 'utf8');
const main = readFileSync('src/main.ts', 'utf8');
const requiredStageTokens = ['getDailyChallenge', 'modifiers', 'fog', 'locked', 'timeSeal', 'bossPressure'];
const requiredMainTokens = ['renderRestoration', 'renderDailyPanel', 'dream-library-inventory', 'modifier-strip'];
const missing = [...requiredStageTokens.filter((token) => !stages.includes(token)), ...requiredMainTokens.filter((token) => !main.includes(token))];
if (missing.length) {
  console.error(`Content data check failed. Missing: ${missing.join(', ')}`);
  process.exit(1);
}
console.log('Content data policy passed.');
