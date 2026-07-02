import { readFileSync, existsSync } from 'node:fs';

const files = {
  html: readFileSync('index.html', 'utf8'),
  main: readFileSync('src/main.ts', 'utf8'),
  renderer: readFileSync('src/rendering/DreamPixiRenderer.ts', 'utf8'),
  css: readFileSync('src/styles.css', 'utf8'),
  pkg: JSON.parse(readFileSync('package.json', 'utf8')),
  sw: readFileSync('public/sw.js', 'utf8'),
  difficulty: readFileSync('src/game/difficulty.js', 'utf8'),
  pages: readFileSync('.github/workflows/github-pages.yml', 'utf8'),
  quality: readFileSync('.github/workflows/quality-check.yml', 'utf8'),
  handoff: existsSync('AI_HANDOFF_DR.md') ? readFileSync('AI_HANDOFF_DR.md', 'utf8') : ''
};

const errors = [];
const requireIncludes = (name, text, token) => {
  if (!text.includes(token)) errors.push(`${name} missing ${token}`);
};

if (!['1.0.78', '1.0.79', '1.0.80', '1.0.81', '1.0.82', '1.0.83', '1.0.84'].includes(files.pkg.version)) errors.push(`package version must be 1.0.78 or 1.0.79, got ${files.pkg.version}`);
requireIncludes('package.json', JSON.stringify(files.pkg), 'check:combat-hud-touch-clearance');
requireIncludes('index.html', files.html, 'data-combat-hud-touch-clearance="v1078-combat-hud-touch-clearance"');
requireIncludes('index.html', files.html, 'data-boss-status-readability="v1078-boss-statusbar-readability"');
requireIncludes('index.html', files.html, 'data-action-role="hint"');
requireIncludes('index.html', files.html, 'data-action-role="shuffle"');
requireIncludes('index.html', files.html, 'data-action-role="restart"');
requireIncludes('src/main.ts', files.main, "const COMBAT_HUD_TOUCH_CLEARANCE_PATCH = 'v1078-combat-hud-touch-clearance'");
requireIncludes('src/main.ts', files.main, "const BOSS_STATUSBAR_READABILITY_PATCH = 'v1078-boss-statusbar-readability'");
requireIncludes('src/main.ts', files.main, "const LOW_END_RENDER_BUDGET_GUARD_PATCH = 'v1078-low-end-render-budget-guard'");
requireIncludes('src/main.ts', files.main, 'function syncCombatHudTouchClearance');
requireIncludes('src/main.ts', files.main, 'data-board-action-clearance');
requireIncludes('src/rendering/DreamPixiRenderer.ts', files.renderer, "const LOW_END_RENDER_BUDGET_GUARD_PATCH = 'v1078-low-end-render-budget-guard'");
requireIncludes('src/rendering/DreamPixiRenderer.ts', files.renderer, 'particleCap: 11');
requireIncludes('src/rendering/DreamPixiRenderer.ts', files.renderer, 'spriteStride: 3');
requireIncludes('src/rendering/DreamPixiRenderer.ts', files.renderer, 'host.dataset.lowEndRenderGuard');
requireIncludes('src/styles.css', files.css, 'v1.0.78 combat HUD density');
requireIncludes('src/styles.css', files.css, '.game-actions[data-combat-hud-touch-clearance="v1078-combat-hud-touch-clearance"]');
requireIncludes('src/styles.css', files.css, 'position: sticky');
requireIncludes('src/styles.css', files.css, 'v1078-boss-statusbar-readability');
requireIncludes('public/sw.js', files.sw, 'dream-library-cache-v1.0.78');
requireIncludes('public/sw.js', files.sw, 'texture-atlas-manifest-v1.0.78.json');
requireIncludes('src/game/difficulty.js', files.difficulty, 'texture-atlas-manifest-v1.0.78.json');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.78.json')) errors.push('missing v1.0.78 texture atlas manifest');
requireIncludes('github-pages.yml', files.pages, 'npm run check:combat-hud-touch-clearance');
requireIncludes('quality-check.yml', files.quality, 'npm run check:combat-hud-touch-clearance');
requireIncludes('AI_HANDOFF_DR.md', files.handoff, 'v1.0.78');

if (files.html.includes('data-boss-layout="statusbar-icon-right-v1046"')) errors.push('legacy right-side boss layout returned in active HTML.');
if (/\.boss-lane\[data-boss-layout="statusbar-icon-right-v1046"\]\s*\{/.test(files.css)) errors.push('legacy right-side boss CSS returned as active rule.');
for (const banned of ['board-minimap', '보기 맞춤', '드래그 이동', '손가락 시작']) {
  if (`${files.html}\n${files.main}\n${files.css}`.includes(banned)) errors.push(`Removed UI token returned: ${banned}`);
}

if (errors.length) {
  console.error(`Combat HUD touch clearance QA failed: ${errors.join('; ')}`);
  process.exit(1);
}
console.log('Combat HUD touch clearance QA passed for v1.0.78.');
