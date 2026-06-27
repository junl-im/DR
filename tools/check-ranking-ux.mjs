import { readFileSync } from 'node:fs';

const main = readFileSync('src/main.ts', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const checks = [
  [main.includes('mergeRankRows'), 'cloud/local rank merge helper missing'],
  [main.includes('renderRankRows'), 'shared rank renderer missing'],
  [main.includes('rank-cloud') && main.includes('rank-local'), 'rank source classes missing'],
  [css.includes('.rank-row') && css.includes('.rank-cloud em') && css.includes('.rank-local em'), 'rank row source badge styles missing'],
  [css.includes('.rank-gold') && css.includes('.rank-silver') && css.includes('.rank-bronze'), 'top rank highlight styles missing']
];
const failed = checks.filter(([ok]) => !ok).map(([, msg]) => msg);
if (failed.length) {
  console.error(failed.join('\n'));
  process.exit(1);
}
console.log('Ranking UX policy passed for v1.0.21.');
