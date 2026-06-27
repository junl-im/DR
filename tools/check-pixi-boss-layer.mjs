import { readFileSync } from 'node:fs';
const errors = [];
const renderer = readFileSync('src/rendering/DreamPixiRenderer.ts', 'utf8');
const main = readFileSync('src/main.ts', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
if (!renderer.includes('preloadBossFrameAtlas') || !renderer.includes('syncPixiBossLayer')) errors.push('renderer must expose boss atlas preload and Pixi boss layer sync helpers');
if (!renderer.includes('applyPixiBossLayer') || !renderer.includes('resolveBossFrameTexture')) errors.push('renderer must resolve and draw boss atlas frames on the Pixi layer');
if (!renderer.includes("host.dataset.bossLayer = 'pixi'") || !renderer.includes('bossLayerMood')) errors.push('Pixi boss layer must mark battle-stage dataset for QA');
if (!main.includes('renderer.preloadBossFrameAtlas') || !main.includes('renderer.syncPixiBossLayer')) errors.push('main must preload and sync Pixi boss layer frames');
if (!css.includes('[data-boss-layer="pixi"]') || !css.includes('data-boss-layer-mood')) errors.push('Pixi boss layer CSS states are missing');
if (errors.length) { console.error(`Pixi boss layer policy failed: ${errors.join('; ')}`); process.exit(1); }
console.log('Pixi boss layer policy passed for v1.0.26.');
