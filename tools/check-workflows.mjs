import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(process.cwd(), '.github', 'workflows');
const files = readdirSync(dir).filter((file) => file.endsWith('.yml') || file.endsWith('.yaml'));
const errors = [];
let pushMainCount = 0;
for (const file of files) {
  const text = readFileSync(join(dir, file), 'utf8');
  if (/npm\s+ci/.test(text)) errors.push(`${file}: npm ci is disabled for GitHub runner stability in v1.0.11.`);
  if (/node-version:\s*22/.test(text)) errors.push(`${file}: use Node 20 LTS for stable Actions.`);
  if (/push:[\s\S]*branches:[\s\S]*- main/.test(text)) pushMainCount += 1;
}
if (pushMainCount !== 1) errors.push(`Expected exactly one push main workflow, found ${pushMainCount}.`);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Workflow policy passed: one main push workflow, Node 20, safe install.');
