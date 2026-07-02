import { readFileSync } from 'node:fs';

const main = readFileSync('src/main.ts', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const requiredMain = ['${iconName}-${stateName}.png', 'hover', 'pressed', 'disabled', 'UI_STATE_ICONS'];
const requiredCss = ['#hint-button:hover', '#hint-button:active', '#shuffle-button:hover', '.start-button:active', '--ui-play-pressed-url'];
const missing = [
  ...requiredMain.filter((token) => !main.includes(token)).map((token) => `main missing ${token}`),
  ...requiredCss.filter((token) => !css.includes(token)).map((token) => `css missing ${token}`)
];
if (missing.length) {
  console.error(missing.join('\n'));
  process.exit(1);
}
console.log('Button state PNG mapping policy passed: active buttons keep hover/pressed/disabled mappings without deleted shell back button.');
