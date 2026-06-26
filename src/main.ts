import { collection, doc, getDocs, limit, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import './styles.css';
import { db, firebaseReady } from './firebase.js';
import { getDisplayName, loginAnonymously, loginWithEmail, loginWithGoogle, logout, observeAuth, signupWithEmail } from './auth.js';
import { ATLAS_ASSETS, DIFFICULTIES, PRELOAD_ASSETS, TILE_SET } from './game/difficulty.js';
import { CHAPTERS, DEFAULT_STAGE_ID, STAGES, getChapterById, getChapterStages, getDailyChallenge, getNextStage, getStageById } from './game/stages.js';
import { countRemaining, createBoard, findConnectionPath, findHint, isCleared, revealPairSpecials, removePair, shuffleRemaining } from './game/shisen.js';
import { getBossForStage, getBossPhase, getBossStageTags } from './game/bosses.js';
import { initBrowserGuard } from './platform/browserGuard.js';
import { initFullscreenControls, requestGameFullscreen } from './platform/fullscreen.js';
import { initInstallPrompt, registerServiceWorker } from './platform/pwa.js';
import { DreamAudio } from './audio/DreamAudio';
import { GAME_TITLE } from './config/design';
import { DreamPixiRenderer, BoardPoint } from './rendering/DreamPixiRenderer';
import { prepareSpineRuntime } from './engine/SpineBridge';
import { detectDeviceProfile, nextQualityTier, saveQualityTier } from './systems/performance';
import { HAPTIC } from './systems/haptics';

document.documentElement.style.setProperty('--library-background-url', `url(${import.meta.env.BASE_URL}assets/backgrounds/storybook-login.png)`);
document.documentElement.style.setProperty('--start-button-art-url', `url(${import.meta.env.BASE_URL}assets/ui/start-button-art.png)`);

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
  qualityToggle: $('#quality-toggle'),
  qualityLabel: $('#quality-label'),
  resetProgressButton: $('#reset-progress-button'),
  fullscreenButton: $('#settings-fullscreen-button'),
  installButton: $('#install-button'),
  lobbyGreeting: $('#lobby-greeting'),
  chapterTabs: $('#chapter-tabs'),
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
  dailyStageButton: $('#daily-stage-button'),
  restorationFocusButton: $('#restoration-focus-button'),
  restorationSummary: $('#restoration-summary'),
  restorationList: $('#restoration-list'),
  collectionSummary: $('#collection-summary'),
  collectionList: $('#collection-list'),
  dailyTitle: $('#daily-title'),
  dailyDesc: $('#daily-desc'),
  dailyLeaderboardList: $('#daily-leaderboard-list'),
  dailyStartButton: $('#daily-start-button'),
  stageLabel: $('#stage-label'),
  difficultyTitle: $('#difficulty-title'),
  timeLabel: $('#time-label'),
  scoreLabel: $('#score-label'),
  comboLabel: $('#combo-label'),
  movesLabel: $('#moves-label'),
  statusLabel: $('#status-label'),
  bossImage: $('#boss-image') as HTMLImageElement,
  bossName: $('#boss-name'),
  bossPattern: $('#boss-pattern'),
  bossCore: $('#boss-core'),
  bossHpLabel: $('#boss-hp-label'),
  missionLabel: $('#mission-label'),
  modifierStrip: $('#modifier-strip'),
  comboCutin: $('#combo-cutin'),
  hintButton: $('#hint-button'),
  shuffleButton: $('#shuffle-button'),
  newGameButton: $('#new-game-button'),
  exitToLobbyButton: $('#exit-to-lobby-button'),
  rewardModal: $('#reward-modal'),
  rewardTitle: $('#reward-title'),
  rewardMessage: $('#reward-message'),
  rewardItems: $('#reward-items'),
  nextStageButton: $('#next-stage-button'),
  replayStageButton: $('#replay-stage-button'),
  restorationDetailModal: $('#restoration-detail-modal'),
  restorationDetailTitle: $('#restoration-detail-title'),
  restorationDetailMessage: $('#restoration-detail-message'),
  restorationDetailItems: $('#restoration-detail-items'),
  restorationDetailCloseButton: $('#restoration-detail-close-button'),
  restorationDetailFocusButton: $('#restoration-detail-focus-button'),
  exitConfirmModal: $('#exit-confirm-modal'),
  exitConfirmCancelButton: $('#exit-confirm-cancel-button'),
  exitConfirmHomeButton: $('#exit-confirm-home-button'),
  exitConfirmCloseButton: $('#exit-confirm-close-button'),
  exitConfirmMessage: $('#exit-confirm-message')
};

type ScreenName = 'login' | 'settings' | 'lobby' | 'game';
type CampaignProgress = { unlocked: string[]; cleared: Record<string, { stars: number; bestScore: number }> };
type RestorationInventory = Record<string, number>;
type BrowserRecovery = ReturnType<typeof initBrowserGuard>;

const renderer = new DreamPixiRenderer();
const audio = new DreamAudio();
let browserRecovery: BrowserRecovery | null = null;

const RESTORATION_PROJECTS = [
  {
    id: 'shelf',
    label: '달빛 책장',
    need: 6,
    types: ['magic-book', 'scroll', 'ink'],
    reward: '달빛 서가 배경 장식 강화',
    description: '마법서와 기록 재료를 모아 첫 책장을 되살립니다.'
  },
  {
    id: 'garden',
    label: '구름 정원',
    need: 8,
    types: ['flower', 'music-box', 'feather'],
    reward: '로비 정원 파티클 개방',
    description: '구름꽃과 추억의 노래를 모아 정원 기억을 복원합니다.'
  },
  {
    id: 'tower',
    label: '별빛 탑',
    need: 10,
    types: ['comet', 'rune', 'crown', 'map'],
    reward: '별빛 탑 챕터 연출 강화',
    description: '봉인과 지도의 조각을 모아 마지막 탑의 문양을 밝힙니다.'
  }
];

const state = {
  screen: 'login' as ScreenName,
  previousScreen: 'login' as ScreenName,
  user: null as any,
  localGuest: readJson('dream-library-local-guest', null),
  selectedStageId: readText('dream-library-selected-stage') || DEFAULT_STAGE_ID,
  selectedChapterId: readText('dream-library-selected-chapter') || getStageById(readText('dream-library-selected-stage') || DEFAULT_STAGE_ID).chapterId,
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
  inventory: readJson<RestorationInventory>('dream-library-inventory', {}),
  restorationFocus: readText('dream-library-restoration-focus') || 'shelf',
  dailyChallenge: getDailyChallenge(new Date()),
  currentBoardId: 'global' as 'global' | 'daily',
  activeBoss: getBossForStage(getStageById(readText('dream-library-selected-stage') || DEFAULT_STAGE_ID)) as any,
  activeModifiers: [] as string[],
  pendingRestorationProjectId: '',
  qualityProfile: detectDeviceProfile(),
  warnedLowTime: false,
  lastClearedStageId: '',
  exitConfirmOpen: false,
  lastBackIntentAt: 0
};

init();

async function init() {
  document.title = GAME_TITLE;
  browserRecovery = initBrowserGuard();
  if (browserRecovery.inApp) {
    setStatus('카카오톡에서는 시작 버튼을 누르면 외부 브라우저로 이어서 여는 대책을 사용합니다.');
  }

  registerServiceWorker();
  audio.setEnabled(state.soundEnabled);
  renderer.setQuality(state.qualityProfile);
  renderQualityButton();
  initFullscreenControls(el.fullscreenButton, setStatus);
  initInstallPrompt(el.installButton, setStatus);
  bindEvents();
  initBackNavigation();
  renderAuth();
  renderLobby();
  renderStats();
  updateScreen('login');

  await renderer.initAmbient(el.pixiStage);
  await renderer.preloadAssets(ATLAS_ASSETS);
  renderer.preloadAssets(PRELOAD_ASSETS);
  await prepareSpineRuntime();

  observeAuth((user: any) => {
    state.user = user;
    if (user) state.localGuest = null;
    renderAuth();
    renderLobby();
    loadLeaderboard();
    loadDailyLeaderboard();
  });
  loadLeaderboard();
  loadDailyLeaderboard();
}

function bindEvents() {
  el.backButton.addEventListener('click', () => handleBackIntent('button'));
  el.openSettingsButton.addEventListener('click', openOptions);
  el.closeOptionsButton.addEventListener('click', closeOptionsPanel);
  el.optionsModal.addEventListener('click', (event) => { if (event.target === el.optionsModal) closeOptionsPanel(); });
  el.settingsLoginButton.addEventListener('click', () => { closeOptionsPanel(); updateScreen('login'); });
  el.settingsLobbyButton.addEventListener('click', () => { closeOptionsPanel(); hasSession() ? updateScreen('lobby') : updateScreen('login'); });
  el.soundToggle.addEventListener('click', () => {
    HAPTIC.tap();
    state.soundEnabled = !state.soundEnabled;
    writeText('dream-library-sound', state.soundEnabled ? 'on' : 'off');
    audio.setEnabled(state.soundEnabled);
    renderSoundButton();
  });
  el.qualityToggle.addEventListener('click', () => {
    const nextTier = nextQualityTier(state.qualityProfile.tier);
    saveQualityTier(nextTier);
    state.qualityProfile = detectDeviceProfile();
    renderer.setQuality(state.qualityProfile);
    renderQualityButton();
    if (state.screen === 'game' && state.board.length) renderer.renderBoard(state.board);
    setStatus(`렌더링 품질을 ${qualityText(state.qualityProfile.tier)}로 변경했습니다.`);
  });

  el.resetProgressButton.addEventListener('click', () => {
    state.campaignProgress = normalizeCampaignProgress(null);
    state.localStats = { bestScore: 0, clearCount: 0 };
    state.inventory = {};
    writeJson('dream-library-campaign-progress', state.campaignProgress);
    writeJson('dream-library-local-stats', state.localStats);
    writeJson('dream-library-inventory', state.inventory);
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
    HAPTIC.tap();
    if (await handoffIfNeeded()) return;
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
    HAPTIC.tap();
    if (!firebaseReady) throw new Error('login-disabled');
    if (await handoffIfNeeded()) return;
    await loginWithGoogle();
    await startSelectedStage();
  }, 'Google 로그인 후 게임을 시작합니다.'));
  el.emailForm.addEventListener('submit', (event) => {
    event.preventDefault();
    runAuth(async () => {
      if (!firebaseReady) throw new Error('login-disabled');
      if (await handoffIfNeeded()) return;
      await loginWithEmail(el.emailInput.value, el.passwordInput.value);
      await startSelectedStage();
    }, '이메일 로그인 후 게임을 시작합니다.');
  });
  el.emailSignupButton.addEventListener('click', () => runAuth(async () => {
    if (!firebaseReady) throw new Error('login-disabled');
    if (await handoffIfNeeded()) return;
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

  el.chapterTabs.addEventListener('click', (event) => {
    const node = (event.target as HTMLElement).closest<HTMLElement>('[data-chapter-id]');
    if (!node) return;
    selectChapter(node.dataset.chapterId || CHAPTERS[0].id);
  });

  el.worldMap.addEventListener('click', (event) => {
    const node = (event.target as HTMLElement).closest<HTMLElement>('[data-stage-id]');
    if (!node) return;
    const stageId = node.dataset.stageId || DEFAULT_STAGE_ID;
    const stage = getStageById(stageId);
    state.selectedChapterId = stage.chapterId;
    writeText('dream-library-selected-chapter', state.selectedChapterId);
    if (!isStageUnlocked(stageId)) {
      state.selectedStageId = stageId;
      writeText('dream-library-selected-stage', stageId);
      setStatus('이전 기억을 먼저 복원해야 합니다.');
      renderLobby();
      return;
    }
    state.selectedStageId = stageId;
    writeText('dream-library-selected-stage', stageId);
    audio.play('select');
    renderLobby();
  });
  el.startSelectedButton.addEventListener('click', () => startSelectedStage());
  el.dailyStageButton.addEventListener('click', startDailyStage);
  el.dailyStartButton.addEventListener('click', startDailyStage);
  el.restorationFocusButton.addEventListener('click', () => {
    document.querySelector('.restoration-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setStatus('복원 작업대를 확인하세요.');
  });
  el.newGameButton.addEventListener('click', () => startSelectedStage());
  el.exitToLobbyButton.addEventListener('click', exitToLobby);
  el.hintButton.addEventListener('click', showHint);
  el.shuffleButton.addEventListener('click', shuffleBoard);
  el.refreshLeaderboardButton.addEventListener('click', () => { loadLeaderboard(); loadDailyLeaderboard(); });
  el.nextStageButton.addEventListener('click', () => {
    closeReward();
    const next = getNextStage(state.lastClearedStageId || state.selectedStageId);
    if (next) {
      state.selectedStageId = next.id;
      state.selectedChapterId = next.chapterId;
      writeText('dream-library-selected-stage', next.id);
      writeText('dream-library-selected-chapter', next.chapterId);
      startSelectedStage();
    } else updateScreen('lobby');
  });
  el.replayStageButton.addEventListener('click', () => {
    closeReward();
    startSelectedStage();
  });
  el.restorationList.addEventListener('click', (event) => {
    const node = (event.target as HTMLElement).closest<HTMLElement>('[data-restore-id]');
    if (node) openRestorationDetail(node.dataset.restoreId || 'shelf');
  });
  el.restorationDetailCloseButton.addEventListener('click', closeRestorationDetail);
  el.restorationDetailModal.addEventListener('click', (event) => { if (event.target === el.restorationDetailModal) closeRestorationDetail(); });
  el.restorationDetailFocusButton.addEventListener('click', () => {
    if (!state.pendingRestorationProjectId) return;
    state.restorationFocus = state.pendingRestorationProjectId;
    writeText('dream-library-restoration-focus', state.restorationFocus);
    closeRestorationDetail();
    renderRestoration();
    setStatus('집중 복원 프로젝트를 변경했습니다.');
  });
  el.exitConfirmCancelButton.addEventListener('click', closeExitConfirm);
  el.exitConfirmHomeButton.addEventListener('click', () => {
    closeExitConfirm();
    returnToFirstScreen();
  });
  el.exitConfirmCloseButton.addEventListener('click', confirmExitGame);
  el.exitConfirmModal.addEventListener('click', (event) => {
    if (event.target === el.exitConfirmModal) closeExitConfirm();
  });

  window.addEventListener('resize', () => {
    if (state.screen === 'game' && state.board.length) renderer.renderBoard(state.board);
  });
}


function initBackNavigation() {
  pushAppHistoryState(true);
  window.addEventListener('popstate', () => {
    handleBackIntent('hardware');
    pushAppHistoryState();
  });
}

function pushAppHistoryState(replace = false) {
  try {
    const payload = { dreamLibrary: true, screen: state.screen, t: Date.now() };
    if (replace) history.replaceState(payload, '', location.href);
    history.pushState(payload, '', location.href);
  } catch {
    // History can fail in restricted in-app browsers; the visible back button still works.
  }
}

function handleBackIntent(source: 'button' | 'hardware') {
  const now = Date.now();
  if (state.exitConfirmOpen) {
    if (source === 'hardware' && now - state.lastBackIntentAt < 1800) confirmExitGame();
    else closeExitConfirm();
    state.lastBackIntentAt = now;
    return;
  }
  state.lastBackIntentAt = now;
  if (!el.restorationDetailModal.classList.contains('hidden')) {
    closeRestorationDetail();
    return;
  }
  if (!el.rewardModal.classList.contains('hidden')) {
    closeReward();
    returnToFirstScreen();
    return;
  }
  if (!el.optionsModal.classList.contains('hidden')) {
    closeOptionsPanel();
    return;
  }
  if (state.screen === 'game') {
    exitToLobby();
    window.setTimeout(() => returnToFirstScreen(), 80);
    setStatus('뒤로가기로 첫 화면으로 돌아왔습니다. 다시 뒤로가면 종료 확인이 열립니다.');
    return;
  }
  if (state.screen === 'lobby' || state.screen === 'settings') {
    returnToFirstScreen();
    setStatus('첫 화면입니다. 한 번 더 뒤로가면 종료 확인이 열립니다.');
    return;
  }
  openExitConfirm();
}

function returnToFirstScreen() {
  state.locked = true;
  clearInterval(state.timerId);
  state.selected = null;
  updateScreen('login');
}

function openExitConfirm() {
  state.exitConfirmOpen = true;
  el.exitConfirmMessage.textContent = '브라우저 정책상 탭을 강제로 닫지 못할 수 있습니다. 종료하기를 누르면 가능한 경우 창을 닫고, 막히면 첫 화면으로 정리합니다.';
  el.exitConfirmModal.classList.remove('hidden');
  HAPTIC.warning();
}

function closeExitConfirm() {
  state.exitConfirmOpen = false;
  el.exitConfirmModal.classList.add('hidden');
}

function confirmExitGame() {
  closeExitConfirm();
  state.locked = true;
  clearInterval(state.timerId);
  writeText('dream-library-last-exit', new Date().toISOString());
  try { window.close(); } catch { /* Browser may block close. */ }
  window.setTimeout(() => {
    if (!document.hidden) {
      returnToFirstScreen();
      setStatus('브라우저에서 자동 종료가 막혔습니다. 탭을 닫거나 홈 화면으로 이동하세요.');
    }
  }, 160);
}


async function handoffIfNeeded() {
  if (!browserRecovery?.shouldUseHandoff()) return false;
  audio.play('tap');
  HAPTIC.tap();
  await browserRecovery.startHandoff();
  setStatus('외부 브라우저 전환을 시도했습니다. 전환이 막히면 임시 플레이를 선택하세요.');
  return true;
}

async function startDailyStage() {
  const daily = state.dailyChallenge;
  state.selectedStageId = daily.stageId;
  state.selectedChapterId = getStageById(daily.stageId).chapterId;
  writeText('dream-library-selected-stage', daily.stageId);
  writeText('dream-library-selected-chapter', state.selectedChapterId);
  renderLobby();
  await startSelectedStage({ daily: true });
}

async function startSelectedStage(options: { daily?: boolean } = {}) {
  if (await handoffIfNeeded()) return;
  state.currentBoardId = options.daily ? 'daily' : 'global';
  const baseStage = getStageById(state.selectedStageId);
  if (!options.daily && !isStageUnlocked(baseStage.id)) {
    setStatus('잠긴 스테이지입니다. 이전 기억을 먼저 복원하세요.');
    renderLobby();
    return;
  }
  const stage = options.daily ? { ...baseStage, modifiers: state.dailyChallenge.modifiers, dailySeed: state.dailyChallenge.seed } : baseStage;
  const difficulty = DIFFICULTIES[stage.difficultyKey];
  state.activeModifiers = stage.modifiers || [];
  state.activeBoss = getBossForStage(stage);
  renderBossPanel();
  audio.unlock();
  audio.play('tap');
  requestGameFullscreen();
  state.board = createBoard(difficulty, stage.modifiers || []);
  state.selected = null;
  state.locked = false;
  state.moves = 0;
  state.combo = 0;
  state.comboMax = 0;
  state.score = 0;
  state.remainingSeconds = difficulty.timeLimitSeconds;
  state.hints = difficulty.hints;
  state.shuffles = difficulty.shuffles;
  state.warnedLowTime = false;
  state.startedAt = Date.now();
  clearInterval(state.timerId);
  state.timerId = window.setInterval(tickTimer, 1000);
  updateScreen('game');
  if (!renderer.boardApp) await renderer.initBoard(el.boardHost, handleTileTap);
  await renderer.renderBoard(state.board);
  renderer.setBossHp(100, getBossPhase(100));
  renderGameHud();
  setStatus('같은 마법 오브젝트를 연결하세요.');
  updateMissionLabel();
  renderModifierStrip(stage.modifiers || []);
}



function getSpecialPairEffect(firstTile: any, secondTile: any) {
  const specials = [firstTile?.special, secondTile?.special].filter(Boolean);
  return {
    hasFog: specials.includes('fog'),
    hasLocked: specials.includes('locked'),
    hasTimeSeal: specials.includes('timeSeal'),
    bonusScore: (specials.includes('fog') ? 70 : 0) + (specials.includes('locked') ? 120 : 0) + (specials.includes('timeSeal') ? 90 : 0)
  };
}

function canUseLockedPair(firstTile: any, secondTile: any) {
  const effect = getSpecialPairEffect(firstTile, secondTile);
  return !effect.hasLocked || state.combo >= 1;
}

function handleTileTap(point: BoardPoint) {
  if (state.locked) return;
  const tile = state.board[point.row]?.[point.col];
  if (!tile) return;
  const activeStage = getStageById(state.selectedStageId);
  const difficulty = DIFFICULTIES[activeStage.difficultyKey];
  audio.play('tap');
  HAPTIC.tap();
  if (!state.selected) {
    state.selected = point;
    renderer.setSelected(point);
    audio.play('select');
    HAPTIC.select();
    return;
  }
  const first = state.selected;
  if (first.row === point.row && first.col === point.col) {
    state.selected = null;
    renderer.setSelected(null);
    return;
  }
  const firstTile = state.board[first.row]?.[first.col];
  const secondTile = state.board[point.row]?.[point.col];
  if (!canUseLockedPair(firstTile, secondTile)) {
    state.moves += 1;
    state.combo = 0;
    renderer.playMismatch(point);
    HAPTIC.warning();
    renderer.setSelected(point);
    state.selected = point;
    setStatus('잠긴 오브젝트는 직전 연결을 성공시킨 뒤 2연속 콤보로 해제됩니다.');
    renderGameHud();
    return;
  }
  const connectionPath = findConnectionPath(state.board, first, point);
  if (connectionPath) {
    state.locked = true;
    state.moves += 1;
    state.combo += 1;
    state.comboMax = Math.max(state.comboMax, state.combo);
    const specialEffect = getSpecialPairEffect(firstTile, secondTile);
    state.score += 100 * state.combo + specialEffect.bonusScore;
    if (specialEffect.hasTimeSeal) state.remainingSeconds = Math.min(difficulty.timeLimitSeconds + 30, state.remainingSeconds + 10);
    if (specialEffect.hasFog) setStatus('안개 오브젝트 정화 보너스가 더해졌습니다.');
    if (specialEffect.hasLocked) setStatus('잠긴 오브젝트 봉인을 해제했습니다.');
    if (specialEffect.hasTimeSeal) setStatus('시간 봉인을 풀어 10초를 되찾았습니다.');
    renderer.setSelected(null);
    state.board = revealPairSpecials(state.board, first, point);
    audio.play('match');
    window.setTimeout(() => audio.play('beam'), 90);
    window.setTimeout(() => audio.play('burst'), 220);
    if (state.combo > 1) {
      audio.play('combo');
      HAPTIC.combo();
      showComboCutin(state.combo);
    } else HAPTIC.match();
    renderer.playMatchSequence(first, point, state.combo, () => {
      state.board = removePair(state.board, first, point);
      state.selected = null;
      state.locked = false;
      renderGameHud();
      const hp = (countRemaining(state.board) / Math.max(1, state.board.length * state.board[0].length)) * 100;
      renderer.setBossHp(hp, getBossPhase(hp));
      const warningEvery = state.activeBoss?.comboWarningEvery || 6;
      if (state.combo > 0 && state.combo % warningEvery === 0) renderer.playBossWarning(state.activeBoss?.shakePower || 7);
      if (isCleared(state.board)) clearStage();
    }, connectionPath);
  } else {
    state.moves += 1;
    state.combo = 0;
    renderer.playMismatch(point);
    HAPTIC.warning();
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
  const warningSeconds = state.activeBoss?.warningSeconds || 15;
  if (state.activeModifiers.includes('bossPressure') && state.remainingSeconds > warningSeconds && state.remainingSeconds % 20 === 0) {
    renderer.playBossWarning(Math.max(4, (state.activeBoss?.shakePower || 7) - 2));
    setStatus('보스 압박으로 마법진 가장자리가 흔들립니다. 콤보를 끊지 마세요.');
  }
  if (!state.warnedLowTime && state.remainingSeconds <= warningSeconds && state.remainingSeconds > 0) {
    state.warnedLowTime = true;
    renderer.playBossWarning(state.activeBoss?.shakePower || 7);
    setStatus(state.activeBoss?.attackLine || '보스가 반격을 준비합니다. 빠르게 연결하세요.');
  }
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
  addReward(stage.reward.type, stage.reward.amount);
  if (state.currentBoardId === 'daily') addReward('spark', state.dailyChallenge.rewardBoost);
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

function renderQualityButton() {
  const text = qualityText(state.qualityProfile.tier);
  el.qualityToggle.textContent = `렌더링 ${text}`;
  el.qualityLabel.textContent = `${text} · ${state.qualityProfile.reason}`;
}

function qualityText(tier: string) {
  return tier === 'high' ? '고품질' : tier === 'medium' ? '균형' : '절전';
}

function renderLobby() {
  let stage = getStageById(state.selectedStageId);
  if (!CHAPTERS.some((chapter: any) => chapter.id === state.selectedChapterId)) state.selectedChapterId = stage.chapterId;
  if (stage.chapterId !== state.selectedChapterId) {
    const fallback = getChapterStages(state.selectedChapterId).find((item: any) => isStageUnlocked(item.id)) || getChapterStages(state.selectedChapterId)[0] || getStageById(DEFAULT_STAGE_ID);
    stage = fallback;
    state.selectedStageId = stage.id;
    writeText('dream-library-selected-stage', stage.id);
  }
  const chapter = getChapterById(state.selectedChapterId);
  const difficulty = DIFFICULTIES[stage.difficultyKey];
  const boss = getBossForStage(stage);
  const name = state.user ? getDisplayName(state.user) : state.localGuest ? state.localGuest.name : '사서님';
  el.lobbyGreeting.textContent = `${name}, 서고의 마법진이 준비되었습니다.`;
  el.selectedChapterName.textContent = chapter.title;
  el.chapterStoryText.textContent = chapter.story;
  el.selectedStageTitle.textContent = `${stage.number}. ${stage.title}`;
  el.selectedStageSubtitle.textContent = stage.subtitle;
  el.selectedStageMeta.textContent = `${difficulty.label} · ${difficulty.rows}×${difficulty.cols} · ${boss.name}`;
  el.selectedStageReward.textContent = `${stage.reward.label} ×${stage.reward.amount}`;
  const clearCount = Object.keys(state.campaignProgress.cleared).length;
  el.stageProgressLabel.textContent = `${clearCount}/${STAGES.length} 클리어`;
  renderChapterTabs();
  const chapterStages = getChapterStages(state.selectedChapterId);
  el.worldMap.innerHTML = chapterStages.map((item: any) => {
    const unlocked = isStageUnlocked(item.id);
    const cleared = Boolean(state.campaignProgress.cleared[item.id]);
    const selected = item.id === state.selectedStageId;
    const stars = state.campaignProgress.cleared[item.id]?.stars ?? 0;
    const stageBoss = getBossForStage(item);
    return `<button type="button" class="stage-node ${unlocked ? 'unlocked' : 'locked'} ${cleared ? 'cleared' : ''} ${selected ? 'selected' : ''}" data-stage-id="${item.id}" aria-label="${item.number} 스테이지 ${escapeHtml(item.title)}"><strong>${item.number}</strong><span>${cleared ? '★'.repeat(stars) : unlocked ? stageBoss.name.replace('의 ', ' ') : 'Lock'}</span></button>`;
  }).join('');
  renderStats();
  renderRestoration();
  renderCollection();
  renderDailyPanel();
}


function selectChapter(chapterId: string) {
  const stages = getChapterStages(chapterId);
  if (!stages.length) return;
  state.selectedChapterId = chapterId;
  writeText('dream-library-selected-chapter', chapterId);
  const current = getStageById(state.selectedStageId);
  if (current.chapterId !== chapterId) {
    const firstUnlocked = stages.find((stage: any) => isStageUnlocked(stage.id));
    state.selectedStageId = (firstUnlocked || stages[0]).id;
    writeText('dream-library-selected-stage', state.selectedStageId);
  }
  renderLobby();
}

function renderChapterTabs() {
  el.chapterTabs.innerHTML = CHAPTERS.map((chapter: any) => {
    const stages = getChapterStages(chapter.id);
    const cleared = stages.filter((stage: any) => state.campaignProgress.cleared[stage.id]).length;
    const hasUnlocked = stages.some((stage: any) => isStageUnlocked(stage.id));
    return `<button type="button" class="chapter-tab ${chapter.id === state.selectedChapterId ? 'selected' : ''} ${hasUnlocked ? 'unlocked' : 'locked'}" data-chapter-id="${chapter.id}"><strong>${chapter.shortTitle}</strong><span>${cleared}/${stages.length}</span></button>`;
  }).join('');
}

function renderBossPanel() {
  const boss = state.activeBoss || getBossForStage(getStageById(state.selectedStageId));
  el.bossImage.src = boss.asset;
  el.bossImage.alt = boss.name;
  el.bossName.textContent = boss.name;
  el.bossPattern.textContent = boss.patternLabel;
  el.bossCore.dataset.bossId = boss.id;
  el.bossCore.dataset.phase = 'stable';
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
  updateMissionLabel();
}

function updateMissionLabel() {
  const stage = getStageById(state.selectedStageId);
  const difficulty = DIFFICULTIES[stage.difficultyKey];
  const remaining = state.board.length ? countRemaining(state.board) : difficulty.rows * difficulty.cols;
  const targetCombo = difficulty.key === 'easy' ? 3 : difficulty.key === 'normal' ? 4 : difficulty.key === 'hard' ? 5 : 6;
  const bossTags = getBossStageTags(stage);
  const ruleTag = state.activeModifiers.includes('bossPressure') ? '보스 압박 활성' : state.activeModifiers.length ? `${state.activeModifiers.length}개 특수 규칙` : '기본 규칙';
  el.missionLabel.textContent = `남은 오브젝트 ${remaining}개 · ${targetCombo}콤보 · ${ruleTag} · ${bossTags[0] || '보스전'}`;
}


function renderModifierStrip(modifiers: string[]) {
  const labels: Record<string, string> = {
    fog: '안개 타일',
    locked: '잠긴 타일',
    timeSeal: '시간 봉인',
    bossPressure: '보스 압박'
  };
  if (!modifiers.length) {
    el.modifierStrip.innerHTML = '<span>기본 규칙</span>';
    return;
  }
  el.modifierStrip.innerHTML = modifiers.map((modifier) => `<span>${labels[modifier] || modifier}</span>`).join('');
}

function addReward(type: string, amount: number) {
  state.inventory[type] = (state.inventory[type] || 0) + amount;
  writeJson('dream-library-inventory', state.inventory);
}

function renderRestoration() {
  const totalItems = Object.values(state.inventory).reduce((sum: number, value: any) => sum + Number(value || 0), 0);
  el.restorationSummary.textContent = `보유 복원 재료 ${formatNumber(totalItems)}개 · 집중 프로젝트를 눌러 상세 재료를 확인하세요.`;
  el.restorationList.innerHTML = RESTORATION_PROJECTS.map((project) => {
    const current = project.types.reduce((sum, type) => sum + Number(state.inventory[type] || 0), 0);
    const ratio = Math.min(100, Math.round((current / project.need) * 100));
    const focused = project.id === state.restorationFocus;
    return `<button type="button" class="restore-node ${ratio >= 100 ? 'complete' : ''} ${focused ? 'selected' : ''}" data-restore-id="${project.id}"><strong>${focused ? '✦ ' : ''}${project.label}</strong><span>${current}/${project.need}</span><i style="--restore-progress:${ratio}%"></i></button>`;
  }).join('');
}


function renderCollection() {
  const collected = TILE_SET.filter((tile: any) => Number(state.inventory[tile.type] || 0) > 0);
  el.collectionSummary.textContent = `${collected.length}/${TILE_SET.length} 수집 · 스테이지 보상과 오늘의 복원으로 도감을 채웁니다.`;
  el.collectionList.innerHTML = TILE_SET.map((tile: any) => {
    const count = Number(state.inventory[tile.type] || 0);
    return `<article class="collection-tile ${count > 0 ? 'owned' : 'locked'}"><img src="${tile.asset}" alt="" draggable="false" /><strong>${escapeHtml(tile.label)}</strong><span>${count > 0 ? `${count}개 · ${escapeHtml(tile.theme)}` : '미수집'}</span></article>`;
  }).join('');
}

function openRestorationDetail(projectId: string) {
  const project = RESTORATION_PROJECTS.find((item) => item.id === projectId) || RESTORATION_PROJECTS[0];
  state.pendingRestorationProjectId = project.id;
  const current = project.types.reduce((sum, type) => sum + Number(state.inventory[type] || 0), 0);
  const ratio = Math.min(100, Math.round((current / project.need) * 100));
  el.restorationDetailTitle.textContent = project.label;
  el.restorationDetailMessage.textContent = `${project.description} · 보상: ${project.reward} · 진행률 ${ratio}%`;
  el.restorationDetailItems.innerHTML = project.types.map((type) => {
    const tile = TILE_SET.find((item: any) => item.type === type);
    const count = Number(state.inventory[type] || 0);
    return `<span class="detail-item"><img src="${tile?.asset || ''}" alt="" draggable="false" />${escapeHtml(tile?.label || type)} ${count}개</span>`;
  }).join('');
  el.restorationDetailFocusButton.textContent = project.id === state.restorationFocus ? '집중 중' : '집중 프로젝트';
  el.restorationDetailModal.classList.remove('hidden');
}

function closeRestorationDetail() {
  el.restorationDetailModal.classList.add('hidden');
}

function renderDailyPanel() {
  const daily = state.dailyChallenge;
  const stage = getStageById(daily.stageId);
  el.dailyTitle.textContent = `오늘의 복원 · ${stage.title}`;
  el.dailyDesc.textContent = `${daily.label} · ${daily.rewardLabel}`;
}

function showComboCutin(combo: number) {
  if (combo < 2) return;
  el.comboCutin.textContent = `${combo} COMBO`;
  el.comboCutin.classList.remove('hidden');
  el.comboCutin.classList.remove('combo-pop');
  void el.comboCutin.offsetWidth;
  el.comboCutin.classList.add('combo-pop');
  window.setTimeout(() => el.comboCutin.classList.add('hidden'), 760);
}

function openReward(stars: number, score: number) {
  const stage = getStageById(state.selectedStageId);
  el.rewardTitle.textContent = `${stage.title} 복원 완료`;
  el.rewardMessage.textContent = `별 ${stars}개와 ${formatNumber(score)}점을 획득했습니다.`;
  const dailyBonus = state.currentBoardId === 'daily' ? `<span>오늘의 별가루 ×${state.dailyChallenge.rewardBoost}</span>` : '';
  el.rewardItems.innerHTML = `<span>★ ${stars}</span><span>${stage.reward.label} ×${stage.reward.amount}</span>${dailyBonus}`;
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


async function loadDailyLeaderboard() {
  if (!db) {
    el.dailyLeaderboardList.innerHTML = '<li>로컬 일일 기록 준비 완료</li>';
    return;
  }
  try {
    const daily = state.dailyChallenge;
    const snapshot = await getDocs(query(collection(db, 'leaderboards', 'daily', 'days', daily.dateKey, 'scores'), orderBy('score', 'desc'), limit(3)));
    const rows = snapshot.docs.map((docSnap, index) => {
      const data = docSnap.data() as any;
      return `<li>${index + 1}. ${escapeHtml(data.displayName || '사서')} · ${formatNumber(data.score || 0)}</li>`;
    });
    el.dailyLeaderboardList.innerHTML = rows.length ? rows.join('') : '<li>오늘 첫 기록을 노려보세요.</li>';
  } catch {
    el.dailyLeaderboardList.innerHTML = '<li>오늘 랭킹을 불러오지 못했습니다.</li>';
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
    difficulty: stage.difficultyKey,
    timeSeconds: state.remainingSeconds,
    cleared: true,
    stageId: stage.id,
    stageNumber: stage.number,
    stars,
    updatedAt: serverTimestamp()
  };
  await setDoc(doc(db, 'leaderboards/global/scores', state.user.uid), payload, { merge: true }).catch(() => null);
  if (state.currentBoardId === 'daily') {
    const dailyPayload = { ...payload, dailyKey: state.dailyChallenge.dateKey };
    await setDoc(doc(db, 'leaderboards/daily/scores', state.user.uid), dailyPayload, { merge: true }).catch(() => null);
    await setDoc(doc(db, 'leaderboards', 'daily', 'days', state.dailyChallenge.dateKey, 'scores', state.user.uid), dailyPayload, { merge: true }).catch(() => null);
    loadDailyLeaderboard();
  }
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
