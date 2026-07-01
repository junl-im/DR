import { readFileSync } from 'node:fs';

const renderer = readFileSync('src/rendering/DreamPixiRenderer.ts', 'utf8');
const main = readFileSync('src/main.ts', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const packageJson = readFileSync('package.json', 'utf8');
const workflows = readFileSync('.github/workflows/github-pages.yml', 'utf8') + '\n' + readFileSync('.github/workflows/quality-check.yml', 'utf8');
const errors = [];

for (const token of ['TILE_GEOMETRY_GUARD_LABEL', 'TILE_GEOMETRY_EPSILON', 'enforceTileBodyGeometry', 'assertTileBodyGeometry', 'createTileHitArea']) {
  if (!renderer.includes(token)) errors.push(`Missing hard tile geometry guard token: ${token}`);
}
if (!renderer.includes('view.root.hitArea') || !renderer.includes('tile-body-geometry-locked')) errors.push('Tile hit area and visible geometry guard labels must be locked to the cell.');
if (!renderer.includes('document.querySelector<HTMLElement>(\'.battle-stage\')?.setAttribute(\'data-tile-geometry\', \'locked\')')) errors.push('Battle stage must expose locked tile geometry state for visual QA.');
if (/to\(\[a\.root\.scale, b\.root\.scale\]/.test(renderer) || /x:\s*1\.0[1-9]/.test(renderer)) errors.push('Match or selection flow must not animate tile root scale above natural size.');
if (renderer.includes("this.applyTileStateTexture(view, 'selected')")) errors.push('Selected texture path must stay disabled.');
if (!main.includes('getHudDensity') || !main.includes("'micro'") || !main.includes('data-hud-density')) errors.push('HUD density must include a micro mode for small screens.');
if (!main.includes('dataset.comboTier') || !main.includes('boss-finisher-pop') || !main.includes('dataset.bossId')) errors.push('Boss cut-in must have boss-specific/tier-specific polish hooks.');
for (const token of ['data-tile-geometry="locked"', 'data-combo-tier="finisher"', 'data-hud-density="micro"', 'bossFinisherHalo']) {
  if (!css.includes(token)) errors.push(`Missing v1.0.47 CSS hook: ${token}`);
}
for (const banned of ['board-minimap', '보드 레이더', '레이더 탭']) {
  if (`${renderer}\n${main}\n${css}`.includes(banned)) errors.push(`Minimap must stay removed: ${banned}`);
}
if (!packageJson.includes('"version": "1.0.47"') && !packageJson.includes('"version": "1.0.48"') && (!packageJson.includes('"version": "1.0.49"') && !packageJson.includes('"version": "1.0.51"') && !packageJson.includes('"version": "1.0.52"') && (!packageJson.includes('"version": "1.0.53"') && (!packageJson.includes('"version": "1.0.54"') && (!packageJson.includes('"version": "1.0.55"') && (!packageJson.includes('"version": "1.0.56"') && (!packageJson.includes('"version": "1.0.57"') && (!packageJson.includes('"version": "1.0.58"') && (!packageJson.includes('"version": "1.0.59"') && (!packageJson.includes('"version": "1.0.60"') && (!packageJson.includes('"version": "1.0.61"') && (!packageJson.includes('"version": "1.0.62"') && !packageJson.includes('"version": "1.0.63"') && !packageJson.includes('"version": "1.0.64"') && (!packageJson.includes('"version": "1.0.65"') && (!packageJson.includes('"version": "1.0.66"') && (!packageJson.includes('"version": "1.0.67"') && (!packageJson.includes('"version": "1.0.68"') && (!packageJson.includes('"version": "1.0.69"') && (!packageJson.includes('"version": "1.0.70"') && (!packageJson.includes('\"version\": \"1.0.71\"') && (!packageJson.includes('\"version\": \"1.0.72\"') && (!packageJson.includes('\"version\": \"1.0.73\"') && (!packageJson.includes('\"version\": \"1.0.74\"') && !packageJson.includes('\"version\": \"1.0.75\"') && !packageJson.includes('\"version\": \"1.0.76\"') && !packageJson.includes('\"version\": \"1.0.77\"') && !packageJson.includes('\"version\": \"1.0.78\"'))))))))))))))))))))))) errors.push('package.json version must be 1.0.47+ compatibility range through 1.0.77.');
if (!workflows.includes('npm run check:tile-geometry-hud')) errors.push('Workflow must run tile geometry HUD QA check.');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Tile geometry HUD check passed: tile body is cell-locked, boss cut-in is polished and micro HUD is active.');
