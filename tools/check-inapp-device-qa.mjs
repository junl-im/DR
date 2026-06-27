import { readFileSync } from 'node:fs';
const errors = [];
const viewport = readFileSync('src/platform/viewportFrame.js', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
if (!viewport.includes('portrait-fit-landscape') || !viewport.includes('dataset.inappDeviceQa')) errors.push('viewport frame must expose in-app fit-landscape QA state');
if (!viewport.includes('fit-landscape') || !viewport.includes('stable-portrait')) errors.push('viewport QA states must distinguish fit-landscape and stable-portrait');
if (!css.includes('html.portrait-fit-landscape') || !css.includes('body[data-inapp-device-qa="fit-landscape"]')) errors.push('in-app device QA CSS states are missing');
if (viewport.includes('requestFullscreen(') || viewport.includes('orientation.lock(')) errors.push('viewport frame must not call hard fullscreen/orientation APIs');
if (errors.length) { console.error(`In-app device QA policy failed: ${errors.join('; ')}`); process.exit(1); }
console.log('In-app device QA policy passed for v1.0.26.');
