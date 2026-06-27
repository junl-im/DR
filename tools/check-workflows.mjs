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
if (!pagesWorkflow.includes('npm run check:background-optimization')) errors.push('github-pages.yml: expected background optimization check.');
if (!pagesWorkflow.includes('npm run check:boss-atlas')) errors.push('github-pages.yml: expected boss atlas check.');
if (!pagesWorkflow.includes('npm run check:mobile-layout')) errors.push('github-pages.yml: expected mobile layout QA check.');
if (!pagesWorkflow.includes('npm run check:scroll-polish')) errors.push('github-pages.yml: expected scroll polish check.');
if (!pagesWorkflow.includes('npm run check:boss-atlas-rendering')) errors.push('github-pages.yml: expected boss atlas rendering check.');
if (!pagesWorkflow.includes('npm run check:asset-compression')) errors.push('github-pages.yml: expected asset compression check.');
if (!pagesWorkflow.includes('npm run check:interaction-polish')) errors.push('github-pages.yml: expected interaction polish check.');
if (!pagesWorkflow.includes('npm run check:kakao-lobby-rotation')) errors.push('github-pages.yml: expected Kakao lobby rotation check.');
if (errors.length) {
  console.error(`Workflow policy failed: ${errors.join('; ')}.`);
  process.exit(1);
}
console.log('Workflow policy passed: one main push workflow, Node 20, safe npm registry, retry install, v1.0.25 QA checks.');
