import { collection, doc, getDocs, limit, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import './styles.css';
import { db, firebaseReady } from './firebase.js';
import { getDisplayName, loginAnonymously, loginWithEmail, loginWithGoogle, logout, observeAuth, signupWithEmail } from './auth.js';
import { DIFFICULTIES } from './game/difficulty.js';
import { CHAPTERS, DEFAULT_STAGE_ID, STAGES, getChapterById, getNextStage, getStageById } from './game/stages.js';
import { canConnect, countRemaining, createBoard, findHint, isCleared, removePair, shuffleRemaining } from './game/shisen.js';
import { initBrowserGuard } from './platform/browserGuard.js';
import { initFullscreenControls, requestGameFullscreen } from './platform/fullscreen.js';
import { initInstallPrompt, registerServiceWorker } from './platform/pwa.js';
import { DreamAudio } from './audio/DreamAudio';
import { GAME_TITLE } from './config/design';
import { DreamPixiRenderer, BoardPoint } from './rendering/DreamPixiRenderer';
import { prepareSpineRuntime } from './engine/SpineBridge';

document.documentElement.style.setProperty('--library-background-url', `url(${import.meta.env.BASE_URL}assets/backgrounds/storybook-login.png)`);

const $ = <T extends HTMLElement>(selector: string) => document.querySelector(selector) as T;
const $$ = <T extends HTMLElement>(selector: string) => Array.from(document.querySelectorAll(selector)) as T[];

const el = {
  app: $('#app'),
  pixiStage: $('#pixi-stage'),
  boardHost: $('#pixi-board-host'),
  screens: $$('.screen'),
  backButton: $('#back-button'),
  loginStatus: $('#login-status'),
  authName: $('#auth-name'),
  authProvider: $('#auth-provider'),
  anonymousButton: $('#anonymous-button'),
  googleButton: $('#google-button'),
  showEmailButton: $('#show-email-button'),
  emailForm: $('#email-form') as HTMLFormElement,
  emailInput: $('#email-input') as HTMLInputElement,
  passwordInput: $('#password-input') as HTMLInputElement,
  emailSignupButton: $('#email-signup-button'),
  enterLobbyButton: $('#enter-lobby-button'),
  openSettingsButton: $('#open-settings-button'),
  closeOptionsButton: $('#close-options-button'),
  optionsModal: $('#options-modal'),
  signoutButton: $('#signout-button'),
  settingsAccountText: $('#settings-account-text'),
  settingsLoginButton: $('#settings-login-button'),
  settingsLobbyButton: $('#settings-lobby-button'),
  settingsFullscreenButton: $('#settings-fullscreen-button'),
  soundToggle: $('#sound-toggle'),
  resetProgressButton: $('#reset-progress-button'),
  fullscreenButton: $('#settings-fullscreen-button'),
  installButton: $('#install-button'),
  lobbyGreeting: $('#lobby-greeting'),
  worldMap: $('#world-map'),
  selectedChapterName: $('#selected-chapter-name'),
  chapterStoryText: $('#chapter-story-text'),
  selectedStageTitle: $('#selected-stage-title'),
  selectedStageSubtitle: $('#selected-stage-subtitle'),
  selectedStageMeta: $('#selected-stage-meta'),
  selectedStageReward: $('#selected-stage-reward'),
  stageProgressLabel: $('#stage-progress-label'),
  startSelectedButton: $('#start-selected-button'),
  bestScoreLabel: $('#best-score-label'),
  clearCountLabel: $('#clear-count-label'),
  starCountLabel: $('#star-count-label'),
  leaderboardList: $('#leaderboard-list'),
  refreshLeaderboardButton: $('#refresh-leaderboard-button'),
  stageLabel: $('#stage-label'),
  difficultyTitle: $('#difficulty-title'),
  timeLabel: $('#time-label'),
  scoreLabel: $('#score-label'),
  comboLabel: $('#combo-label'),
  movesLabel: $('#moves-label'),
  statusLabel: $('#status-label'),
  bossHpLabel: $('#boss-hp-label'),
  hintButton: $('#hint-button'),
  shuffleButton: $('#shuffle-button'),
  newGameButton: $('#new-game-button'),
  exitToLobbyButton: $('#exit-to-lobby-button'),
  rewardModal: $('#reward-modal'),
  rewardTitle: $('#reward-title'),
  rewardMessage: $('#reward-message'),
  rewardItems: $('#reward-items'),
  nextStageButton: $('#next-stage-button'),
  replayStageButton: $('#replay-stage-button')
};

type ScreenName = 'login' | 'settings' | 'lobby' | 'game';
type CampaignProgress = { unlocked: string[]; cleared: Record<string, { stars: number; bestScore: number }> };

const renderer = new DreamPixiRenderer();
const audio = new DreamAudio();

const state = {
  screen: 'login' as ScreenName,
  previousScreen: 'login' as ScreenName,
  user: null as any,
  localGuest: readJson('dream-library-local-guest', null),
  selectedStageId: readText('dream-library-selected-stage') || DEFAULT_STAGE_ID,
  board: [] as any[][],
  selected: null as BoardPoint | null,
  locked: true,
  moves: 0,
  combo: 0,
  comboMax: 0,
  score: 0,
  startedAt: 0,
  remainingSeconds: 0,
  timerId: 0,
  hints: 0,
  shuffles: 0,
  soundEnabled: readText('dream-library-sound') !== 'off',
  localStats: readJson('dream-library-local-stats', { bestScore: 0, clearCount: 0 }),
  campaignProgress: normalizeCampaignProgress(readJson('dream-library-campaign-progress', null)),
  lastClearedStageId: ''
};

init();

async function init() {
  document.title = GAME_TITLE;
  const browserGuard = initBrowserGuard();
  if (browserGuard.blocked) {
    el.app.setAttribute('aria-hidden', 'true');
    return;
  }

  registerServiceWorker();
  audio.setEnabled(state.soundEnabled);
  initFullscreenControls(el.fullscreenButton, setStatus);
  initInstallPrompt(el.installButton, setStatus);
  bindEvents();
  renderAuth();
  renderLobby();
  renderStats();
  updateScreen('login');

  await renderer.initAmbient(el.pixiStage);
  await prepareSpineRuntime();

  observeAuth((user: any) => {
    state.user = user;
    if (user) state.localGuest = null;
    renderAuth();
    renderLobby();
    loadLeaderboard();
  });
  loadLeaderboard();
}

function bindEvents() {
  el.backButton.addEventListener('click', () => {
    if (state.screen === 'settings') updateScreen(state.previousScreen || 'login');
    else if (state.screen === 'game') exitToLobby();
    else updateScreen('login');
  });
  el.openSettingsButton.addEventListener('click', openOptions);
  el.closeOptionsButton.addEventListener('click', closeOptionsPanel);
  el.optionsModal.addEventListener('click', (event) => { if (event.target === el.optionsModal) closeOptionsPanel(); });
  el.settingsLoginButton.addEventListener('click', () => { closeOptionsPanel(); updateScreen('login'); });
  el.settingsLobbyButton.addEventListener('click', () => { closeOptionsPanel(); hasSession() ? updateScreen('lobby') : updateScreen('login'); });
  el.soundToggle.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    writeText('dream-library-sound', state.soundEnabled ? 'on' : 'off');
    audio.setEnabled(state.soundEnabled);
    renderSoundButton();
  });
  el.resetProgressButton.addEventListener('click', () => {
    state.campaignProgress = normalizeCampaignProgress(null);
    state.localStats = { bestScore: 0, clearCount: 0 };
    writeJson('dream-library-campaign-progress', state.campaignProgress);
    writeJson('dream-library-local-stats', state.localStats);
    renderLobby();
    renderStats();
    setStatus('로컬 진행을 초기화했습니다.');
  });

  el.showEmailButton.addEventListener('click', () => {
    el.emailForm.classList.toggle('collapsed');
    if (!el.emailForm.classList.contains('collapsed')) el.emailInput.focus({ preventScroll: true });
  });
  el.anonymousButton.addEventListener('click', () => runAuth(async () => {
    audio.play('tap');
    if (firebaseReady) await loginAnonymously();
    else {
      state.localGuest = makeLocalGuest();
      writeJson('dream-library-local-guest', state.localGuest);
      renderAuth();
    }
    await startSelectedStage();
  }, '게임을 시작합니다.'));
  el.googleButton.addEventListener('click', () => runAuth(async () => {
    audio.play('tap');
    if (!firebaseReady) throw new Error('login-disabled');
    await loginWithGoogle();
    await startSelectedStage();
  }, 'Google 로그인 후 게임을 시작합니다.'));
  el.emailForm.addEventListener('submit', (event) => {
    event.preventDefault();
    runAuth(async () => {
      if (!firebaseReady) throw new Error('login-disabled');
      await loginWithEmail(el.emailInput.value, el.passwordInput.value);
      await startSelectedStage();
    }, '이메일 로그인 후 게임을 시작합니다.');
  });
  el.emailSignupButton.addEventListener('click', () => runAuth(async () => {
    if (!firebaseReady) throw new Error('login-disabled');
    await signupWithEmail(el.emailInput.value, el.passwordInput.value);
    await startSelectedStage();
  }, '새 계정을 만들고 게임을 시작합니다.'));
  el.signoutButton.addEventListener('click', () => runAuth(async () => {
    if (firebaseReady && state.user) await logout();
    state.localGuest = null;
    writeJson('dream-library-local-guest', null);
    renderAuth();
    closeOptionsPanel();
    updateScreen('login');
  }, '로그아웃했습니다.'));
  el.enterLobbyButton.addEventListener('click', () => updateScreen('lobby'));

  el.worldMap.addEventListener('click', (event) => {
    const node = (event.target as HTMLElement).closest<HTMLElement>('[data-stage-id]');
    if (!node) return;
    const stageId = node.dataset.stageId || DEFAULT_STAGE_ID;
    if (!isStageUnlocked(stageId)) {
      setStatus('이전 기억을 먼저 복원해야 합니다.');
      return;
    }
    state.selectedStageId = stageId;
    writeText('dream-library-selected-stage', stageId);
    audio.play('select');
    renderLobby();
  });
  el.startSelectedButton.addEventListener('click', startSelectedStage);
  el.newGameButton.addEventListener('click', startSelectedStage);
  el.exitToLobbyButton.addEventListener('click', exitToLobby);
  el.hintButton.addEventListener('click', showHint);
  el.shuffleButton.addEventListener('click', shuffleBoard);
  el.refreshLeaderboardButton.addEventListener('click', loadLeaderboard);
  el.nextStageButton.addEventListener('click', () => {
    closeReward();
    const next = getNextStage(state.lastClearedStageId || state.selectedStageId);
    if (next) {
      state.selectedStageId = next.id;
      writeText('dream-library-selected-stage', next.id);
      startSelectedStage();
    } else updateScreen('lobby');
  });
  el.replayStageButton.addEventListener('click', () => {
    closeReward();
    startSelectedStage();
  });

  window.addEventListener('resize', () => {
    if (state.screen === 'game' && state.board.length) renderer.renderBoard(state.board);
  });
}

async function startSelectedStage() {
  const stage = getStageById(state.selectedStageId);
  const difficulty = DIFFICULTIES[stage.difficultyKey];
  audio.unlock();
  audio.play('tap');
  requestGameFullscreen();
  state.board = createBoard(difficulty);
  state.selected = null;
  state.locked = false;
  state.moves = 0;
  state.combo = 0;
  state.comboMax = 0;
  state.score = 0;
  state.remainingSeconds = difficulty.timeLimitSeconds;
  state.hints = difficulty.hints;
  state.shuffles = difficulty.shuffles;
  state.startedAt = Date.now();
  clearInterval(state.timerId);
  state.timerId = window.setInterval(tickTimer, 1000);
  updateScreen('game');
  if (!renderer.boardApp) await renderer.initBoard(el.boardHost, handleTileTap);
  await renderer.renderBoard(state.board);
  renderer.setBossHp(100);
  renderGameHud();
  setStatus('같은 마법 오브젝트를 연결하세요.');
}

function handleTileTap(point: BoardPoint) {
  if (state.locked) return;
  const tile = state.board[point.row]?.[point.col];
  if (!tile) return;
  audio.play('tap');
  if (!state.selected) {
    state.selected = point;
    renderer.setSelected(point);
    audio.play('select');
    return;
  }
  const first = state.selected;
  if (first.row === point.row && first.col === point.col) {
    state.selected = null;
    renderer.setSelected(null);
    return;
  }
  if (canConnect(state.board, first, point)) {
    state.locked = true;
    state.moves += 1;
    state.combo += 1;
    state.comboMax = Math.max(state.comboMax, state.combo);
    state.score += 100 * state.combo;
    renderer.setSelected(null);
    audio.play('match');
    window.setTimeout(() => audio.play('beam'), 90);
    window.setTimeout(() => audio.play('burst'), 220);
    if (state.combo > 1) audio.play('combo');
    renderer.playMatchSequence(first, point, state.combo, () => {
      state.board = removePair(state.board, first, point);
      state.selected = null;
      state.locked = false;
      renderGameHud();
      const hp = (countRemaining(state.board) / Math.max(1, state.board.length * state.board[0].length)) * 100;
      renderer.setBossHp(hp);
      if (isCleared(state.board)) clearStage();
    });
  } else {
    state.moves += 1;
    state.combo = 0;
    renderer.playMismatch(point);
    renderer.setSelected(point);
    state.selected = point;
    setStatus('연결 경로는 최대 두 번까지만 꺾을 수 있습니다.');
    renderGameHud();
  }
}

function tickTimer() {
  if (state.screen !== 'game' || state.locked) return;
  state.remainingSeconds = Math.max(0, state.remainingSeconds - 1);
  renderGameHud();
  if (state.remainingSeconds <= 0) {
    state.locked = true;
    clearInterval(state.timerId);
    setStatus('시간이 끝났습니다. 같은 스테이지를 다시 도전하세요.');
  }
}

function showHint() {
  if (state.locked || state.hints <= 0) return;
  const hint = findHint(state.board);
  if (!hint) {
    setStatus('현재 연결 가능한 쌍이 없어 섞기를 사용하세요.');
    return;
  }
  state.hints -= 1;
  renderer.hint(hint.map((item: any) => ({ row: item.row, col: item.col })));
  audio.play('select');
  setStatus('빛이 약하게 숨쉬는 오브젝트를 보세요.');
}

async function shuffleBoard() {
  if (state.locked || state.shuffles <= 0) return;
  state.shuffles -= 1;
  state.board = shuffleRemaining(state.board);
  state.selected = null;
  await renderer.renderBoard(state.board);
  audio.play('select');
  setStatus('마법진이 흔들리며 남은 오브젝트를 섞었습니다.');
}

async function clearStage() {
  state.locked = true;
  clearInterval(state.timerId);
  const stage = getStageById(state.selectedStageId);
  const difficulty = DIFFICULTIES[stage.difficultyKey];
  const timeBonus = state.remainingSeconds * 5;
  const comboBonus = state.comboMax * 80;
  const score = Math.round((state.score + timeBonus + comboBonus) * difficulty.scoreMultiplier);
  state.score = score;
  const stars = state.remainingSeconds > difficulty.timeLimitSeconds * 0.5 ? 3 : state.remainingSeconds > difficulty.timeLimitSeconds * 0.25 ? 2 : 1;
  state.lastClearedStageId = stage.id;
  unlockStage(stage.id, stars, score);
  state.localStats.bestScore = Math.max(state.localStats.bestScore, score);
  state.localStats.clearCount += 1;
  writeJson('dream-library-local-stats', state.localStats);
  renderStats();
  renderLobby();
  renderGameHud();
  audio.play('clear');
  await saveScore(score, stars);
  openReward(stars, score);
}

function updateScreen(screen: ScreenName) {
  if (screen !== state.screen) state.previousScreen = state.screen;
  state.screen = screen;
  el.app.dataset.screen = screen;
  document.body.dataset.screen = screen;
  const bg = screen === 'login' ? 'storybook-login' : screen === 'lobby' ? 'world-map' : 'library-hall';
  document.documentElement.style.setProperty('--library-background-url', `url(${import.meta.env.BASE_URL}assets/backgrounds/${bg}.png)`);
  el.screens.forEach((screenEl) => screenEl.classList.toggle('active', screenEl.id === `screen-${screen}`));
  el.backButton.classList.toggle('hidden', screen === 'login');
  if (screen === 'lobby') renderLobby();
  if (screen === 'settings') renderAuth();
}


function openOptions() {
  renderAuth();
  el.optionsModal.classList.remove('hidden');
}

function closeOptionsPanel() {
  el.optionsModal.classList.add('hidden');
}

function exitToLobby() {
  state.locked = true;
  clearInterval(state.timerId);
  updateScreen('lobby');
}

function renderAuth() {
  const name = state.user ? getDisplayName(state.user) : state.localGuest ? state.localGuest.name : '새로운 사서님';
  const provider = state.user ? (state.user.email ? '이메일/Google 계정으로 저장 중' : '익명 계정으로 저장 중') : state.localGuest ? '게스트 플레이 중' : '로그인하면 진행과 랭킹을 저장합니다.';
  el.authName.textContent = name;
  el.authProvider.textContent = provider;
  el.settingsAccountText.textContent = `${name} · ${provider}`;
  el.enterLobbyButton.classList.toggle('hidden', !hasSession());
  el.signoutButton.classList.toggle('hidden', !hasSession());
  renderSoundButton();
}

function renderSoundButton() {
  el.soundToggle.textContent = state.soundEnabled ? '효과음 켜짐' : '효과음 꺼짐';
  el.soundToggle.setAttribute('aria-pressed', String(state.soundEnabled));
}

function renderLobby() {
  const stage = getStageById(state.selectedStageId);
  const chapter = getChapterById(stage.chapterId);
  const difficulty = DIFFICULTIES[stage.difficultyKey];
  const name = state.user ? getDisplayName(state.user) : state.localGuest ? state.localGuest.name : '사서님';
  el.lobbyGreeting.textContent = `${name}, 서고의 마법진이 준비되었습니다.`;
  el.selectedChapterName.textContent = chapter.title;
  el.chapterStoryText.textContent = chapter.story;
  el.selectedStageTitle.textContent = `${stage.number}. ${stage.title}`;
  el.selectedStageSubtitle.textContent = stage.subtitle;
  el.selectedStageMeta.textContent = `${difficulty.label} · ${difficulty.rows}×${difficulty.cols}`;
  el.selectedStageReward.textContent = `${stage.reward.label} ×${stage.reward.amount}`;
  const clearCount = Object.keys(state.campaignProgress.cleared).length;
  el.stageProgressLabel.textContent = `${clearCount}/${STAGES.length} 클리어`;
  el.worldMap.innerHTML = STAGES.map((item: any) => {
    const unlocked = isStageUnlocked(item.id);
    const cleared = Boolean(state.campaignProgress.cleared[item.id]);
    const selected = item.id === state.selectedStageId;
    const stars = state.campaignProgress.cleared[item.id]?.stars ?? 0;
    return `<button type="button" class="stage-node ${unlocked ? 'unlocked' : 'locked'} ${cleared ? 'cleared' : ''} ${selected ? 'selected' : ''}" data-stage-id="${item.id}" aria-label="${item.number} 스테이지 ${item.title}"><strong>${item.number}</strong><span>${cleared ? '★'.repeat(stars) : unlocked ? 'Open' : 'Lock'}</span></button>`;
  }).join('');
  renderStats();
}

function renderStats() {
  el.bestScoreLabel.textContent = formatNumber(state.localStats.bestScore || 0);
  el.clearCountLabel.textContent = formatNumber(state.localStats.clearCount || 0);
  const stars = Object.values(state.campaignProgress.cleared).reduce((sum: number, clear: any) => sum + (clear.stars || 0), 0);
  el.starCountLabel.textContent = formatNumber(stars);
}

function renderGameHud() {
  const stage = getStageById(state.selectedStageId);
  const chapter = getChapterById(stage.chapterId);
  const difficulty = DIFFICULTIES[stage.difficultyKey];
  el.stageLabel.textContent = `${chapter.shortTitle} · Stage ${stage.number}`;
  el.difficultyTitle.textContent = difficulty.label;
  el.timeLabel.textContent = formatTime(state.remainingSeconds);
  el.scoreLabel.textContent = formatNumber(state.score);
  el.comboLabel.textContent = `${state.combo}`;
  el.movesLabel.textContent = `${state.moves}`;
}

function openReward(stars: number, score: number) {
  const stage = getStageById(state.selectedStageId);
  el.rewardTitle.textContent = `${stage.title} 복원 완료`;
  el.rewardMessage.textContent = `별 ${stars}개와 ${formatNumber(score)}점을 획득했습니다.`;
  el.rewardItems.innerHTML = `<span>★ ${stars}</span><span>${stage.reward.label} ×${stage.reward.amount}</span>`;
  const next = getNextStage(stage.id);
  el.nextStageButton.classList.toggle('hidden', !next);
  el.rewardModal.classList.remove('hidden');
}

function closeReward() {
  el.rewardModal.classList.add('hidden');
}

async function loadLeaderboard() {
  if (!db) {
    el.leaderboardList.innerHTML = '<li>로컬 플레이 준비 완료</li>';
    return;
  }
  try {
    const snapshot = await getDocs(query(collection(db, 'leaderboards/global/scores'), orderBy('score', 'desc'), limit(5)));
    const rows = snapshot.docs.map((docSnap, index) => {
      const data = docSnap.data() as any;
      return `<li>${index + 1}. ${escapeHtml(data.displayName || '사서')} · ${formatNumber(data.score || 0)}</li>`;
    });
    el.leaderboardList.innerHTML = rows.length ? rows.join('') : '<li>첫 복원 기록을 남겨보세요.</li>';
  } catch {
    el.leaderboardList.innerHTML = '<li>랭킹을 불러오지 못했습니다.</li>';
  }
}

async function saveScore(score: number, stars: number) {
  if (!db || !state.user) return;
  const stage = getStageById(state.selectedStageId);
  const payload = {
    uid: state.user.uid,
    displayName: getDisplayName(state.user),
    score,
    comboMax: state.comboMax,
    moves: state.moves,
    remainingSeconds: state.remainingSeconds,
    stageId: stage.id,
    stageNumber: stage.number,
    stars,
    updatedAt: serverTimestamp()
  };
  await setDoc(doc(db, 'leaderboards/global/scores', state.user.uid), payload, { merge: true }).catch(() => null);
}

function unlockStage(stageId: string, stars: number, score: number) {
  const previous = state.campaignProgress.cleared[stageId];
  state.campaignProgress.cleared[stageId] = { stars: Math.max(stars, previous?.stars || 0), bestScore: Math.max(score, previous?.bestScore || 0) };
  const next = getNextStage(stageId);
  if (next && !state.campaignProgress.unlocked.includes(next.id)) state.campaignProgress.unlocked.push(next.id);
  writeJson('dream-library-campaign-progress', state.campaignProgress);
}

function isStageUnlocked(stageId: string) {
  return state.campaignProgress.unlocked.includes(stageId);
}

function normalizeCampaignProgress(progress: CampaignProgress | null): CampaignProgress {
  const unlocked = new Set([DEFAULT_STAGE_ID, ...(progress?.unlocked || [])]);
  const cleared = progress?.cleared || {};
  STAGES.forEach((stage: any) => {
    if (stage.unlockAfter && cleared[stage.unlockAfter]) unlocked.add(stage.id);
  });
  return { unlocked: [...unlocked], cleared };
}

async function runAuth(action: () => Promise<void>, successMessage: string) {
  try {
    await action();
    setStatus(successMessage);
  } catch (error: any) {
    if (error?.message === 'login-disabled' || error?.code === 'firebase/missing-config') setStatus('현재는 게스트 시작을 사용할 수 있습니다.');
    else setStatus('로그인을 완료하지 못했습니다. 잠시 후 다시 시도하세요.');
  }
}

function hasSession() {
  return Boolean(state.user || state.localGuest);
}

function makeLocalGuest() {
  return { uid: `local-${crypto.randomUUID()}`, name: `게스트 사서 ${Math.floor(Math.random() * 900 + 100)}` };
}

function setStatus(message: string) {
  el.loginStatus.textContent = message;
  el.statusLabel.textContent = message;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const rest = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${rest}`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('ko-KR').format(value || 0);
}

function readText(key: string) {
  return localStorage.getItem(key) || '';
}

function writeText(key: string, value: string) {
  localStorage.setItem(key, value);
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (value === null) localStorage.removeItem(key);
  else localStorage.setItem(key, JSON.stringify(value));
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\'': '&#39;', '"': '&quot;' }[char] || char));
}
