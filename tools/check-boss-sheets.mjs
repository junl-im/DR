import { statSync } from 'node:fs';

const required = [
  'public/assets/characters/boss-motion-v2/frame-01.png',
  'public/assets/characters/boss-motion-v2/frame-09.png',
  'public/assets/characters/boss-sticker-v2/frame-01.png',
  'public/assets/characters/boss-sticker-v2/frame-09.png'
];
for (const file of required) statSync(file);
const main = await import('node:fs').then((fs) => fs.readFileSync('src/main.ts', 'utf8'));
const bosses = await import('node:fs').then((fs) => fs.readFileSync('src/game/bosses.js', 'utf8'));
if (!main.includes('setBossFrame')) throw new Error('Boss frame switching is not wired.');
if (!bosses.includes('BOSS_FRAME_SETS')) throw new Error('Boss frame sets are missing.');
console.log('Boss sheet slicing check passed.');
