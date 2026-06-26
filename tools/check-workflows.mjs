import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(process.cwd(), '.github', 'workflows');
const files = readdirSync(root).filter((file) => file.endsWith('.yml') || file.endsWith('.yaml'));
const pushMainFiles = [];
const errors = [];
for (const file of files) {
  const text = readFileSync(join(root, file), 'utf8');
  if (/node-version:\s*22\b/.test(text)) errors.push(`${file}: Node 22 is disabled for CI npm stability. Use Node 20.`);
  if (/run:\s*npm ci\s*$/m.test(text)) errors.push(`${file}: npm ci must use --no-audit --no-fund.`);
  if (/on:\s*[\s\S]*push:\s*[\s\S]*branches:\s*[\s\S]*-\s*main/.test(text)) pushMainFiles.push(file);
}
if (pushMainFiles.length !== 1 || pushMainFiles[0] !== 'github-pages.yml') {
  errors.push(`Exactly one workflow may run on push main, expected github-pages.yml only, found: ${pushMainFiles.join(', ') || 'none'}`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Workflow policy passed: one push-main action, no duplicate verify on push.');
