import { readFileSync } from 'node:fs';

const errors = [];
const main = readFileSync('src/main.ts', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const html = readFileSync('index.html', 'utf8');
const selectedTitleCount = (html.match(/id="selected-stage-title"/g) || []).length;
const selectedSubtitleCount = (html.match(/id="selected-stage-subtitle"/g) || []).length;
if (selectedTitleCount !== 1 || selectedSubtitleCount !== 1) errors.push('selected stage card must not contain duplicated title/subtitle IDs.');
if (!main.includes('initButtonStateFeedback') || !main.includes('data-pointer-state')) errors.push('button/card pointer feedback runtime is missing.');
if (!css.includes('button[data-pointer-state="pressed"]') || !css.includes('buttonReleaseGlow')) errors.push('button/card pointer feedback CSS is missing.');
if (!css.includes('overscroll-behavior: contain') || !css.includes('touch-action: pan-y pinch-zoom')) errors.push('lobby scroll polish rules are missing.');
if ((main.match(/restorationDetailCloseButton/g) || []).length !== 2) errors.push('restoration detail close binding should appear once in el map and once in event binding.');
if (errors.length) {
  console.error(`Interaction polish policy failed: ${errors.join('; ')}`);
  process.exit(1);
}
console.log('Interaction polish policy passed for v1.0.24.');
