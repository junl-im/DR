import { readFileSync } from 'node:fs';

const files = {
  html: readFileSync('index.html', 'utf8'),
  main: readFileSync('src/main.ts', 'utf8'),
  css: readFileSync('src/styles.css', 'utf8'),
  sw: readFileSync('public/sw.js', 'utf8'),
  difficulty: readFileSync('src/game/difficulty.js', 'utf8'),
  pkg: readFileSync('package.json', 'utf8'),
  pages: readFileSync('.github/workflows/github-pages.yml', 'utf8'),
  quality: readFileSync('.github/workflows/quality-check.yml', 'utf8')
};
const runtime = `${files.html}\n${files.main}\n${files.css}\n${files.sw}\n${files.difficulty}`;
const errors = [];

for (const token of [
  'LEGACY_QA_CACHE_ANCHORS',
  'LEGACY_AUTH_MODAL_CACHE_SLIM_POLICY',
  'CACHE_SLIM_POLICY',
  'PREVIOUS_CACHE_SLIM_POLICY',
  'retired-shell-actions',
  'retired-direct-lobby-entry',
  'retired-inline-email-form',
  'id="back-button"',
  'id="open-settings-button"',
  'id="enter-lobby-button"',
  'id="email-form"',
  'id="email-input"',
  'id="password-input"',
  'id="email-signup-button"',
  '#back-button',
  'backButton:',
  'openSettingsButton:',
  'enterLobbyButton:',
  'emailForm:',
  'emailInput:',
  'passwordInput:',
  'emailSignupButton:',
  'runEmailLoginFromInlineFallback',
  'runEmailSignupFromInlineFallback'
]) {
  if (runtime.includes(token)) errors.push(`Deleted compatibility/dead token came back: ${token}`);
}

for (const [fileName, token] of [
  ['package.json', '"version": "1.0.86"'],
  ['public/sw.js', "dream-library-cache-v1.0.86"],
  ['public/sw.js', 'texture-atlas-manifest-v1.0.86.json'],
  ['src/game/difficulty.js', 'texture-atlas-manifest-v1.0.86.json'],
  ['index.html', 'id="email-auth-modal"'],
  ['src/main.ts', 'openEmailAuthModal'],
  ['src/main.ts', 'runEmailLoginFromModal'],
  ['src/main.ts', 'runEmailSignupFromModal'],
  ['index.html', 'id="exit-options-button"'],
  ['src/main.ts', 'openOptionsFromExitSheet'],
  ['package.json', 'check:cleanup-live-paths'],
  ['.github/workflows/github-pages.yml', 'npm run check:cleanup-live-paths'],
  ['.github/workflows/quality-check.yml', 'npm run check:cleanup-live-paths']
]) {
  const text = files[fileName === 'package.json' ? 'pkg' : fileName === 'public/sw.js' ? 'sw' : fileName === 'src/game/difficulty.js' ? 'difficulty' : fileName === 'index.html' ? 'html' : fileName === 'src/main.ts' ? 'main' : fileName.includes('github-pages') ? 'pages' : 'quality'];
  if (!text.includes(token)) errors.push(`${fileName} missing live-path token: ${token}`);
}

if (errors.length) {
  console.error(`Cleanup live paths check failed:\n${errors.join('\n')}`);
  process.exit(1);
}
console.log('Cleanup live paths check passed: deleted compatibility mounts stay removed and live modal/back-sheet/cache paths remain connected.');
