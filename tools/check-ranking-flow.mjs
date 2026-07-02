import { readFileSync } from 'node:fs';
const errors = [];
const main = readFileSync('src/main.ts', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
if (!main.includes('recentScoreKey') || !main.includes('makeRankIdentity')) errors.push('ranking flow must track the latest local score identity');
if (!main.includes('refreshRankingPanelsAfterScore') || !(main.includes('Promise.allSettled([loadLeaderboard(), loadDailyLeaderboard()]') || main.includes('score completion refreshes the relevant board first'))) errors.push('ranking panels must refresh after score save with a budget-safe path');
if (!main.includes('data-rank-fresh') || !main.includes('fresh: rankKey === state.recentScoreKey')) errors.push('rank rows must mark newly recorded local entries');
if (!css.includes('[data-rank-fresh="true"]') || !css.includes('NEW')) errors.push('fresh ranking row styling is missing');
if (errors.length) { console.error(`Ranking flow policy failed: ${errors.join('; ')}`); process.exit(1); }
console.log('Ranking flow policy passed with budget-safe refresh compatibility through v1.0.82.');
