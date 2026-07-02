import { readFileSync } from 'node:fs';

const files = {
  html: readFileSync('index.html', 'utf8'),
  main: readFileSync('src/main.ts', 'utf8'),
  renderer: readFileSync('src/rendering/DreamPixiRenderer.ts', 'utf8'),
  css: readFileSync('src/styles.css', 'utf8'),
  pkg: JSON.parse(readFileSync('package.json', 'utf8')),
  pages: readFileSync('.github/workflows/github-pages.yml', 'utf8'),
  quality: readFileSync('.github/workflows/quality-check.yml', 'utf8')
};

const errors = [];
const requireIncludes = (name, text, token) => {
  if (!text.includes(token)) errors.push(`${name} missing ${token}`);
};

if (!['1.0.77', '1.0.78', '1.0.79', '1.0.80', '1.0.81', '1.0.82', '1.0.83', '1.0.85', '1.0.86'].includes(files.pkg.version)) errors.push(`package version must stay in the supported v1.0.77-v1.0.82 range, got ${files.pkg.version}`);
requireIncludes('package.json', JSON.stringify(files.pkg), 'check:boss-board-clearance');
requireIncludes('index.html', files.html, 'data-boss-board-clearance="v1077-boss-board-clearance"');
requireIncludes('index.html', files.html, 'data-boss-layout="statusbar-left-icon-safe-v1077"');
requireIncludes('index.html', files.html, 'id="boss-lane-echo"');
requireIncludes('index.html', files.html, 'id="boss-lane-echo-sprite"');
if (!/id="boss-core"[\s\S]*class="boss-info"[\s\S]*id="boss-lane-echo"/.test(files.html)) {
  errors.push('boss-core must be first in boss lane, then boss-info, then boss-lane-echo.');
}
if (files.html.includes('data-boss-layout="statusbar-icon-right-v1046"')) errors.push('active HTML must not keep the old right-side boss icon layout.');
requireIncludes('src/main.ts', files.main, "const BOSS_BOARD_CLEARANCE_PATCH = 'v1077-boss-board-clearance'");
requireIncludes('src/main.ts', files.main, 'bossLaneEcho');
requireIncludes('src/main.ts', files.main, 'boss-echo-frame-scale');
requireIncludes('src/main.ts', files.main, "setAttribute('data-boss-layout', 'statusbar-left-icon-safe-v1077')");
if (files.main.includes("setAttribute('data-boss-layout', 'statusbar-icon-right-v1046')")) errors.push('main must not restore old right-side boss icon layout.');
requireIncludes('DreamPixiRenderer.ts', files.renderer, "const BOSS_BOARD_CLEARANCE_PATCH = 'v1077-boss-board-clearance'");
requireIncludes('DreamPixiRenderer.ts', files.renderer, 'laneEchoEnabled');
requireIncludes('DreamPixiRenderer.ts', files.renderer, "host.dataset.bossLayer = 'pixi'");
requireIncludes('DreamPixiRenderer.ts', files.renderer, "host.dataset.bossLayerPlacement = laneEchoEnabled ? 'statusbar-echo-v1077' : 'board-corner'");
requireIncludes('DreamPixiRenderer.ts', files.renderer, 'this.bossLayerSprite.visible = !laneEchoEnabled');
requireIncludes('src/styles.css', files.css, '.boss-lane-echo');
requireIncludes('src/styles.css', files.css, 'statusbar-left-icon-safe-v1077');
requireIncludes('src/styles.css', files.css, 'v1077-boss-board-clearance');
requireIncludes('src/styles.css', files.css, 'boss-echo-frame-scale');
requireIncludes('github-pages.yml', files.pages, 'npm run check:boss-board-clearance');
requireIncludes('quality-check.yml', files.quality, 'npm run check:boss-board-clearance');

for (const banned of ['board-minimap', '보기 맞춤', '드래그 이동', '손가락 시작']) {
  if (`${files.html}\n${files.main}\n${files.css}`.includes(banned)) errors.push(`Removed UI token returned: ${banned}`);
}

if (errors.length) {
  console.error(`Boss board clearance QA failed: ${errors.join('; ')}`);
  process.exit(1);
}
console.log('Boss board clearance QA passed for supported v1.0.77-v1.0.82 range.');
