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
  // PNG color type with alpha is 6 (RGBA) or 4 (grayscale alpha) at IHDR byte 25.
  const colorType = buf[25];
  if (![4, 6].includes(colorType)) {
    console.error(`PNG is not alpha capable: ${file}`);
    process.exit(1);
  }
}
console.log('Alpha-clean asset checks passed.');
