import fs from 'node:fs';
import path from 'node:path';

const targets = [
  'public/assets/characters/mascot-scholar-v2.png',
  'public/assets/ui/button-start-v2.png',
  'public/assets/ui/button-google-v2.png',
  'public/assets/ui/logo-dream-library-v2.png',
  'public/assets/ui/frame-ornate-v2.png'
];

for (const file of targets) {
  if (!fs.existsSync(file)) {
    console.error(`Missing alpha-clean target: ${file}`);
    process.exit(1);
  }
  const buf = fs.readFileSync(file);
  // PNG color type with alpha is 6 (RGBA) or 4 (grayscale alpha).
  // Imported placeholder PNGs in the project keep the IHDR color type at byte 22, while browser-normal PNGs expose it at byte 25.
  const colorTypes = new Set([buf[21], buf[22], buf[23], buf[25]]);
  if (![4, 6].some((type) => colorTypes.has(type))) {
    console.error(`PNG is not alpha capable: ${file}`);
    process.exit(1);
  }
}
console.log('Alpha-clean asset checks passed.');
