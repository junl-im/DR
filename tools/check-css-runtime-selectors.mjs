import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const css = readFileSync('src/styles.css', 'utf8');
const html = readFileSync('index.html', 'utf8');
const runtimeParts = [html];

function collectRuntimeFiles(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) collectRuntimeFiles(path);
    else if ((path.endsWith('.ts') || path.endsWith('.js')) && !path.endsWith('styles.css')) runtimeParts.push(readFileSync(path, 'utf8'));
  }
}
collectRuntimeFiles('src');
const runtime = runtimeParts.join('\n');

const deletedSelectorTokens = [
  'clear-status-v1043',
  'v1043-readable',
  'statusbar-right-portrait-v1044',
  'clear-status-v1044',
  'v1044-readable',
  'v1044-statusbar-right',
  'v1045-stage-ladder-42',
  'statusbar-chip-right-v1045',
  'statusbar-chip-v1045',
  'v1045-readable-chip',
  'v1045-statusbar-chip-right',
  'v1045-deep-drag-rescue',
  'next-goal-v1046',
  'v1046-difficulty-tempo-wide-ladder',
  'v1046-gesture-final-rescue',
  'v1048-summer-live-balance-pass',
  'next-goal-v1048-summer-pass',
  'v1048-campaign-gesture-fluid',
  'v1048-summer-live-balance',
  'v1049-compact-chapter-carousel',
  'v1049-boss-season-polish',
  'v1049-season-vfx-gesture-qa',
  'v1050-summer-finale-event-vfx',
  'v1050-summer-season-shop',
  'v1050-finale-compact-carousel',
  'v1050-boss-finale-polish',
  'v1050-summer-design-gesture-qa',
  'v1051-mobile-design-density-qa',
  'current-chapter-v1051',
  'v1051-boss-season-icon-readability',
  'v1051-mobile-design-gesture-final',
  'v1051-auto-focus-compact-carousel',
  'v1053-season-shop-history-burst',
  'v1053-finale-boss-cooldown-cutin',
  'v1053-history-density-gesture-qa',
  'v1053-season-store-claim-history',
  'v1053-mobile-ui-density-overlap-qa',
  'v1053-finale-cutin-cooldown-priority',
  'v1053-claimed-boss-icon-polish',
  'v1054 legacy check compatibility anchors'
];

const errors = [];
for (const token of deletedSelectorTokens) {
  if (css.includes(token)) errors.push(`Deleted dead CSS selector token came back: ${token}`);
}

const selectorValuePattern = /\[[^\]]*?=["']([^"']*(?:v10\d{2}|stable-atlas)[^"']*)["'][^\]]*\]/g;
const missingRuntimeValues = new Map();
for (const match of css.matchAll(selectorValuePattern)) {
  const value = match[1];
  if (!runtime.includes(value)) {
    const line = css.slice(0, match.index).split('\n').length;
    if (!missingRuntimeValues.has(value)) missingRuntimeValues.set(value, line);
  }
}
for (const [value, line] of missingRuntimeValues) {
  errors.push(`CSS selector value has no runtime dataset/source producer: ${value} at src/styles.css:${line}`);
}

const livePairs = [
  ['statusbar-left-icon-safe-v1077', 'current boss statusbar layout'],
  ['v1054-engine-design-gesture-qa', 'current lobby drag rescue'],
  ['v1054-season-store-collection-link', 'current season shop panel'],
  ['v1084-mobile-rank-chip-wrap', 'current rank chip wrap']
];
for (const [token, label] of livePairs) {
  if (!runtime.includes(token)) errors.push(`Runtime missing live token for ${label}: ${token}`);
  if (!css.includes(token)) errors.push(`CSS missing live selector for ${label}: ${token}`);
}

if (errors.length) {
  console.error(`CSS runtime selector cleanup check failed:\n${errors.join('\n')}`);
  process.exit(1);
}

console.log('CSS runtime selector cleanup passed: dead version selectors are deleted and remaining versioned CSS selectors have live runtime producers.');
