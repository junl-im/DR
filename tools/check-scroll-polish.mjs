import { readFileSync } from 'node:fs';

const main = readFileSync('src/main.ts', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const required = [
  [main.includes('let dragLocked = false') && main.includes('dy > 5') && main.includes('elapsed < 900'), 'lobby drag guard thresholds were not updated'],
  [css.includes('scroll-padding-bottom') && css.includes('body.is-lobby-dragging .mission-card *'), 'lobby scroll/tap conflict styles missing'],
  [css.includes('-webkit-tap-highlight-color: transparent'), 'mobile tap highlight polish missing'],
  [css.includes('rank-source-note') && main.includes('Cloud 기록과 기기 기록을 함께 표시합니다.') || main.includes('Cloud</strong>와 <strong>Local</strong>'), 'ranking source note polish missing']
];
const failed = required.filter(([ok]) => !ok).map(([, message]) => message);
if (failed.length) {
  console.error(`Scroll polish policy failed: ${failed.join('; ')}`);
  process.exit(1);
}
console.log('Scroll, tap and ranking polish policy passed for v1.0.26.');
