import { readFileSync } from 'node:fs';

const main = readFileSync('src/main.ts', 'utf8');
const shisen = readFileSync('src/game/shisen.js', 'utf8');
const renderer = readFileSync('src/rendering/DreamPixiRenderer.ts', 'utf8');
const html = readFileSync('index.html', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const workflows = ['.github/workflows/github-pages.yml', '.github/workflows/quality-check.yml']
  .map((file) => readFileSync(file, 'utf8')).join('\n');

const required = [
  [main, 'handleSpecialTileGate'],
  [main, 'triggerBossTelegraph'],
  [main, 'applySpecialMatchRewards'],
  [main, 'bossPressure'],
  [shisen, 'revealSpecialTile'],
  [shisen, 'revealAllSpecial'],
  [shisen, 'countSpecialTiles'],
  [renderer, 'createSpecialBadge'],
  [renderer, 'spawnVfxSprite'],
  [html, 'boss-telegraph'],
  [css, '.boss-telegraph'],
  [workflows, 'npm config set fetch-retries 5']
];
const missing = required.filter(([text, token]) => !text.includes(token)).map(([, token]) => token);
if (missing.length) {
  console.error(`Special rule check failed. Missing: ${missing.join(', ')}`);
  process.exit(1);
}
console.log('Special tile and boss telegraph policy passed for v1.0.12.');
