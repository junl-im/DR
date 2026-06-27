import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(process.cwd(), '.github', 'workflows');
const files = readdirSync(dir).filter((file) => file.endsWith('.yml') || file.endsWith('.yaml'));
const errors = [];
let pushMainCount = 0;
for (const file of files) {
  const text = readFileSync(join(dir, file), 'utf8');
  if (/npm\s+ci/.test(text)) errors.push(`${file}: npm ci is disabled for GitHub runner stability.`);
  if (!/npm config set registry https:\/\/registry\.npmjs\.org/.test(text)) errors.push(`${file}: expected explicit public npm registry config.`);
  if (/node-version:\s*22/.test(text)) errors.push(`${file}: use Node 20 LTS for stable Actions.`);
  if (/push:[\s\S]*branches:[\s\S]*- main/.test(text)) pushMainCount += 1;
}
if (pushMainCount !== 1) errors.push(`Expected exactly one push main workflow, found ${pushMainCount}.`);
const pagesWorkflow = readFileSync(join(dir, 'github-pages.yml'), 'utf8');
const qualityWorkflow = readFileSync(join(dir, 'quality-check.yml'), 'utf8');
if (!pagesWorkflow.includes('npm run check:background-optimization')) errors.push('github-pages.yml: expected background optimization check.');
if (!pagesWorkflow.includes('npm run check:boss-atlas')) errors.push('github-pages.yml: expected boss atlas check.');
if (!pagesWorkflow.includes('npm run check:mobile-layout')) errors.push('github-pages.yml: expected mobile layout QA check.');
if (!pagesWorkflow.includes('npm run check:scroll-polish')) errors.push('github-pages.yml: expected scroll polish check.');
if (!pagesWorkflow.includes('npm run check:boss-atlas-rendering')) errors.push('github-pages.yml: expected boss atlas rendering check.');
if (!pagesWorkflow.includes('npm run check:asset-compression')) errors.push('github-pages.yml: expected asset compression check.');
if (!pagesWorkflow.includes('npm run check:interaction-polish')) errors.push('github-pages.yml: expected interaction polish check.');
if (!pagesWorkflow.includes('npm run check:kakao-lobby-rotation')) errors.push('github-pages.yml: expected Kakao lobby rotation check.');
if (!pagesWorkflow.includes('npm run check:display-copy')) errors.push('github-pages.yml: expected silent display copy check.');
if (!pagesWorkflow.includes('npm run check:tile-readability')) errors.push('github-pages.yml: expected tile readability check.');
if (!pagesWorkflow.includes('npm run check:board-camera')) errors.push('github-pages.yml: expected board camera check.');
if (!pagesWorkflow.includes('npm run check:no-minimap-topbar')) errors.push('github-pages.yml: expected no-minimap topbar check.');
if (!qualityWorkflow.includes('npm run check:no-minimap-topbar')) errors.push('quality-check.yml: expected no-minimap topbar check.');
if (!pagesWorkflow.includes('npm run check:space-reclaim-back-options')) errors.push('github-pages.yml: expected space reclaim back options check.');
if (!qualityWorkflow.includes('npm run check:space-reclaim-back-options')) errors.push('quality-check.yml: expected space reclaim back options check.');
if (!pagesWorkflow.includes('npm run check:mobile-playability')) errors.push('github-pages.yml: expected mobile playability check.');
if (!pagesWorkflow.includes('npm run check:selection-stability')) errors.push('github-pages.yml: expected selection stability check.');
if (!pagesWorkflow.includes('npm run check:objective-camera-boss')) errors.push('github-pages.yml: expected objective camera boss check.');
if (!qualityWorkflow.includes('npm run check:objective-camera-boss')) errors.push('quality-check.yml: expected objective camera boss check.');
if (!pagesWorkflow.includes('npm run check:tile-geometry-hud')) errors.push('github-pages.yml: expected tile geometry HUD check.');
if (!qualityWorkflow.includes('npm run check:tile-geometry-hud')) errors.push('quality-check.yml: expected tile geometry HUD check.');
if (!pagesWorkflow.includes('npm run check:real-device-selection')) errors.push('github-pages.yml: expected real device selection QA check.');
if (!qualityWorkflow.includes('npm run check:real-device-selection')) errors.push('quality-check.yml: expected real device selection QA check.');
if (!pagesWorkflow.includes('npm run check:boss-pattern-density')) errors.push('github-pages.yml: expected boss pattern density check.');
if (!qualityWorkflow.includes('npm run check:boss-pattern-density')) errors.push('quality-check.yml: expected boss pattern density check.');
if (!pagesWorkflow.includes('npm run check:board-focus-tempo-cache')) errors.push('github-pages.yml: expected board focus tempo cache check.');
if (!qualityWorkflow.includes('npm run check:board-focus-tempo-cache')) errors.push('quality-check.yml: expected board focus tempo cache check.');

if (errors.length) {
  console.error(`Workflow policy failed: ${errors.join('; ')}.`);
  process.exit(1);
}
console.log('Workflow policy passed: one main push workflow, Node 20, safe npm registry, retry install, v1.0.42 QA checks.');
