import { collection, doc, getDocs, limit, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import './styles.css';
import { db, firebaseReady } from './firebase.js';
import { getDisplayName, loginAnonymously, loginWithEmail, loginWithGoogle, logout, observeAuth, signupWithEmail } from './auth.js';
import { ATLAS_ASSETS, BOSS_FRAME_ATLAS_ASSETS, DIFFICULTIES, PRELOAD_ASSETS, TILE_SET } from './game/difficulty.js';
import { CHAPTERS, DEFAULT_STAGE_ID, STAGES, getChapterById, getChapterStages, getDailyChallenge, getNextStage, getStageById } from './game/stages.js';
import { countRemaining, countSpecialTiles, createBoard, findConnectionPath, findHint, getTileAt, isCleared, isSpecialTileBlocked, revealAllSpecial, revealPairSpecials, revealSpecialTile, removePair, shuffleRemaining } from './game/shisen.js';
import { getBossForStage, getBossPhase, getBossStageTags } from './game/bosses.js';
import { BOSS_ATLAS_SHEET, getBossAtlasFrame } from './game/bossAtlas.js';
import { initBrowserGuard } from './platform/browserGuard.js';
import { initFullscreenControls, requestGameFullscreen, syncGameViewport } from './platform/fullscreen.js';
import { initPortraitRuntimeGuard } from './platform/portraitLock.js';
import { initInstallPrompt, registerServiceWorker } from './platform/pwa.js';
import { GAME_TITLE } from './config/design';
import { DreamPixiRenderer, BoardPoint } from './rendering/DreamPixiRenderer';
import { detectDeviceProfile, nextQualityTier, saveQualityTier } from './systems/performance';
import { HAPTIC } from './systems/haptics';

const backgroundImageSet = (name: string) => `image-set(url(${import.meta.env.BASE_URL}assets/backgrounds/${name}.webp) type("image/webp"), url(${import.meta.env.BASE_URL}assets/backgrounds/${name}.png) type("image/png"))`;

document.documentElement.style.setProperty('--library-background-url', backgroundImageSet('moon-library-v2'));
document.documentElement.style.setProperty('--title-logo-v2-url', `url(${import.meta.env.BASE_URL}assets/ui/logo-dream-library-v2.png)`);
document.documentElement.style.setProperty('--start-button-v2-url', `url(${import.meta.env.BASE_URL}assets/ui/button-start-v2.png)`);
document.documentElement.style.setProperty('--google-button-v2-url', `url(${import.meta.env.BASE_URL}assets/ui/button-google-v2.png)`);
document.documentElement.style.setProperty('--email-button-v2-url', `url(${import.meta.env.BASE_URL}assets/ui/button-email-v2.png)`);
document.documentElement.style.setProperty('--frame-v2-url', `url(${import.meta.env.BASE_URL}assets/ui/frames-v2/frame-04.png)`);
document.documentElement.style.setProperty('--boss-atlas-image-url', `url(${BOSS_ATLAS_SHEET.image})`);
document.documentElement.style.setProperty('--boss-atlas-webp-url', `url(${BOSS_ATLAS_SHEET.webp})`);
document.documentElement.style.setProperty('--boss-atlas-sheet-w', `${BOSS_ATLAS_SHEET.width}px`);
document.documentElement.style.setProperty('--boss-atlas-sheet-h', `${BOSS_ATLAS_SHEET.height}px`);
const BOSS_IMAGE_FALLBACK_SRC = `${import.meta.env.BASE_URL}assets/characters/forgotten-spirit.png`;
const BOSS_VISUAL_STACK_PATCH = 'stable-atlas-v1040';
const CLEAR_REWARD_FLOW_PATCH = 'v1040-clear-to-restoration';
const AUTH_ENTRY_SIMPLIFICATION_PATCH = 'v1041-auth-entry-simplified';
let bossAtlasImageReady = false;
function preloadBossAtlasImage() {
  const image = new Image();
  image.onload = () => { bossAtlasImageReady = true; document.body.dataset.bossAtlasReady = 'true'; };
  image.onerror = () => { bossAtlasImageReady = false; document.body.dataset.bossAtlasReady = 'fallback'; };
  image.src = BOSS_ATLAS_SHEET.webp || BOSS_ATLAS_SHEET.image;
}
preloadBossAtlasImage();
const UI_STATE_ICONS = ['back', 'settings', 'hint', 'refresh', 'fullscreen', 'logout', 'home', 'play', 'collection', 'restore', 'ranking', 'close', 'confirm', 'gift', 'book', 'map', 'warning'] as const;
for (const iconName of UI_STATE_ICONS) {
  for (const stateName of ['normal', 'hover', 'pressed', 'disabled'] as const) {
    document.documentElement.style.setProperty(`--ui-${iconName}-${stateName}-url`, `url(${import.meta.env.BASE_URL}assets/ui/keys-v2/${iconName}-${stateName}.png)`);
  }
  document.documentElement.style.setProperty(`--ui-${iconName}-url`, `var(--ui-${iconName}-normal-url)`);
}

const $ = <T extends HTMLElement>(selector: string) => document.querySelector(selector) as T;
const $$ = <T extends HTMLElement>(selector: string) => Array.from(document.querySelectorAll(selector)) as T[];

const el = {
  app: $('#app'),
  pixiStage: $('#pixi-stage'),
  boardHost: $('#pixi-board-host'),
  boardCameraGuide: $('#board-camera-guide'),
  boardCameraControls: $('#board-camera-controls'),
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
  lobbyHeroImage: document.querySelector('.lobby-hero img') as HTMLImageElement | null,
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
  lobbyMissionDeck: $('#lobby-mission-deck'),
  lobbyDeckRefreshButton: $('#lobby-deck-refresh-button'),
  restorationFocusButton: $('#restoration-focus-button'),
  restorationSummary: $('#restoration-summary'),
  restorationList: $('#restoration-list'),
  collectionSummary: $('#collection-summary'),
  collectionList: $('#collection-list'),
  collectionFilter: $('#collection-filter'),
  dailyTitle: $('#daily-title'),
  dailyDesc: $('#daily-desc'),
  dailyLeaderboardList: $('#daily-leaderboard-list'),
  dailyRankTabs: $('#daily-rank-tabs'),
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
  bossTelegraph: $('#boss-telegraph'),
  bossCore: $('#boss-core'),
  bossAtlasSprite: $('#boss-atlas-sprite'),
  bossHpLabel: $('#boss-hp-label'),
  missionLabel: $('#mission-label'),
  modifierStrip: $('#modifier-strip'),
  comboCutin: $('#combo-cutin'),
  bossHitCutin: $('#boss-hit-cutin'),
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
  exitConfirmMessage: $('#exit-confirm-message'),
  exitCancelButton: $('#exit-cancel-button'),
  exitConfirmButton: $('#exit-confirm-button'),
  exitOptionsButton: $('#exit-options-button'),
  exitSleepModal: $('#exit-sleep-modal'),
  exitSleepMessage: $('#exit-sleep-message'),
  exitWakeButton: $('#exit-wake-button')
};


function forceLoginBootScreen() {
  el.app.dataset.screen = 'login';
  el.app.dataset.authEntry = AUTH_ENTRY_SIMPLIFICATION_PATCH;
  document.body.dataset.screen = 'login';
  document.body.dataset.authEntry = AUTH_ENTRY_SIMPLIFICATION_PATCH;
  el.screens.forEach((screenEl) => screenEl.classList.toggle('active', screenEl.id === 'screen-login'));
  el.backButton.classList.add('hidden');
  [el.optionsModal, el.rewardModal, el.exitConfirmModal, el.exitSleepModal, el.restorationDetailModal].forEach((modal) => modal.classList.add('hidden'));
  el.boardCameraGuide?.classList.add('hidden');
  el.boardCameraGuide?.setAttribute('aria-hidden', 'true');
  el.boardCameraControls?.classList.add('hidden');
  el.boardCameraControls?.setAttribute('aria-hidden', 'true');
}

forceLoginBootScreen();

type ScreenName = 'login' | 'settings' | 'lobby' | 'game';
type CampaignProgress = { unlocked: string[]; cleared: Record<string, { stars: number; bestScore: number }> };
type RestorationInventory = Record<string, number>;
type RestorationCompleted = Record<string, string>;
type LocalRankEntry = { displayName: string; score: number; stageId: string; stars: number; dailyKey?: string; updatedAt: string };
type BrowserRecovery = ReturnType<typeof initBrowserGuard>;

const renderer = new DreamPixiRenderer();
type AudioRuntime = { setEnabled(enabled: boolean): void; unlock(): void; play(id: string): void };
const silentAudio: AudioRuntime = { setEnabled: () => undefined, unlock: () => undefined, play: () => undefined };
let audio: AudioRuntime = silentAudio;
let audioReady: Promise<void> | null = null;
let spineReady: Promise<void> | null = null;
let browserRecovery: BrowserRecovery | null = null;
let portraitRuntime: ReturnType<typeof initPortraitRuntimeGuard> | null = null;

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
  },
  {
    id: 'arcane-stage',
    label: '아케인 무대',
    need: 12,
    types: ['v2-tile-01', 'v2-tile-05', 'v2-tile-12', 'v2-tile-18'],
    reward: 'v2 전투 컷인과 로비 장식 강화',
    description: '새로 발견된 v2 오브젝트를 모아 보스전 무대를 더 화려하게 복원합니다.'
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
  localRanking: readJson<LocalRankEntry[]>('dream-library-local-ranking-global', []),
  localDailyRanking: readJson<LocalRankEntry[]>('dream-library-local-ranking-daily', []),
  campaignProgress: normalizeCampaignProgress(readJson('dream-library-campaign-progress', null)),
  inventory: readJson<RestorationInventory>('dream-library-inventory', {}),
  restorationCompleted: readJson<RestorationCompleted>('dream-library-restoration-completed', {}),
  collectionFilter: readText('dream-library-collection-filter') || 'all',
  dailyRankScope: readText('dream-library-daily-rank-scope') || 'today',
  restorationFocus: readText('dream-library-restoration-focus') || 'shelf',
  collapsedPanels: readJson<Record<string, boolean>>('dream-library-lobby-collapsed-panels', {}),
  dailyChallenge: getDailyChallenge(new Date()),
  currentBoardId: 'global' as 'global' | 'daily',
  activeBoss: getBossForStage(getStageById(readText('dream-library-selected-stage') || DEFAULT_STAGE_ID)) as any,
  pendingRestorationProjectId: '',
  qualityProfile: detectDeviceProfile(),
  warnedLowTime: false,
  lastClearedStageId: '',
  stageModifiers: [] as string[],
  pressureTick: 0,
  timeSealBonusCount: 0,
  suppressHistorySync: false,
  browserBackReady: false,
  recentScoreKey: '',
  hudDensity: 'normal' as 'normal' | 'compact' | 'micro'
};

init();

async function init() {
  document.title = GAME_TITLE;
  browserRecovery = initBrowserGuard();
  portraitRuntime = initPortraitRuntimeGuard({ onStatus: setStatus });
  document.addEventListener('dream-library:portrait-lock-requested', () => {
    portraitRuntime?.syncViewport();
  });
  document.addEventListener('dream-library:viewport-frame-requested', () => {
    syncGameViewport({ reason: 'custom-event' });
    portraitRuntime?.syncViewport();
  });
  if (browserRecovery.inApp) {
    browserRecovery.maybeShowSoftTip();
    syncGameViewport({ reason: 'init-inapp' });
    setStatus('로그인 선택을 준비했습니다.');
  }

  registerServiceWorker();
  void loadAudioRuntime();
  renderer.setQuality(state.qualityProfile);
  renderQualityButton();
  initFullscreenControls(el.fullscreenButton, setStatus);
  initInstallPrompt(el.installButton, setStatus);
  bindEvents();
  initButtonStateFeedback();
  initLobbyScrollGuard();
  initBackNavigation();
  renderAuth();
  renderLobby();
  renderStats();
  updateScreen('login');
  window.addEventListener('pageshow', (event) => {
    if ((event as PageTransitionEvent).persisted && state.screen !== 'game') forceLoginBootScreen();
  });

  await renderer.initAmbient(el.pixiStage);
  await renderer.preloadAssets(ATLAS_ASSETS);
  void renderer.preloadAssets(BOSS_FRAME_ATLAS_ASSETS);
  void renderer.preloadBossFrameAtlas();
  renderer.preloadAssets(PRELOAD_ASSETS);
  void loadSpineRuntime();

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


async function loadAudioRuntime() {
  if (audioReady) return audioReady;
  audioReady = import('./audio/DreamAudio').then(({ DreamAudio }) => {
    audio = new DreamAudio();
    audio.setEnabled(state.soundEnabled);
  }).catch(() => {
    audio = silentAudio;
  });
  return audioReady;
}

async function loadSpineRuntime() {
  if (spineReady) return spineReady;
  spineReady = import('./engine/SpineBridge').then(({ prepareSpineRuntime }) => prepareSpineRuntime()).catch(() => undefined);
  return spineReady;
}

function bindEvents() {
  el.backButton.addEventListener('click', () => {
    if (state.screen === 'settings') updateScreen(state.previousScreen || 'login');
    else if (state.screen === 'game') exitToLobby();
    else updateScreen('login');
  });
  // v1.0.37: the visible top option line was removed. Options now open from the back/exit sheet gear.
  el.openSettingsButton?.addEventListener('click', openOptions);
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
    if (state.screen === 'game' && state.board.length) {
      renderer.renderBoard(state.board);
      renderBoardCameraGuide();
    }
    setStatus(`렌더링 품질을 ${qualityText(state.qualityProfile.tier)}로 변경했습니다.`);
  });

  el.resetProgressButton.addEventListener('click', () => {
    state.campaignProgress = normalizeCampaignProgress(null);
    state.localStats = { bestScore: 0, clearCount: 0 };
    state.inventory = {};
    state.restorationCompleted = {};
    state.localRanking = [];
    state.localDailyRanking = [];
    writeJson('dream-library-campaign-progress', state.campaignProgress);
    writeJson('dream-library-local-stats', state.localStats);
    writeJson('dream-library-local-ranking-global', state.localRanking);
    writeJson('dream-library-local-ranking-daily', state.localDailyRanking);
    writeJson('dream-library-inventory', state.inventory);
    writeJson('dream-library-restoration-completed', state.restorationCompleted);
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
    suggestKakaoAssist('');
    if (firebaseReady) await loginAnonymously();
    else {
      state.localGuest = makeLocalGuest();
      writeJson('dream-library-local-guest', state.localGuest);
      renderAuth();
    }
    enterLobbyFromAuth('guest');
  }, '게스트 로그인으로 로비를 열었습니다.'));
  el.googleButton.addEventListener('click', () => runAuth(async () => {
    audio.play('tap');
    HAPTIC.tap();
    if (!firebaseReady) throw new Error('login-disabled');
    await handoffIfNeeded('auth');
    await loginWithGoogle();
    enterLobbyFromAuth('google');
  }, '구글 로그인으로 저장 플레이를 시작했습니다.'));
  el.emailForm.addEventListener('submit', (event) => {
    event.preventDefault();
    runAuth(async () => {
      if (!firebaseReady) throw new Error('login-disabled');
      await handoffIfNeeded('auth');
      await loginWithEmail(el.emailInput.value, el.passwordInput.value);
      enterLobbyFromAuth('email');
    }, '이메일 로그인으로 저장 플레이를 시작했습니다.');
  });
  el.emailSignupButton.addEventListener('click', () => runAuth(async () => {
    if (!firebaseReady) throw new Error('login-disabled');
    await handoffIfNeeded('auth');
    await signupWithEmail(el.emailInput.value, el.passwordInput.value);
    enterLobbyFromAuth('email-signup');
  }, '이메일 계정을 만들고 저장 플레이를 시작했습니다.'));
  el.signoutButton.addEventListener('click', () => runAuth(async () => {
    if (firebaseReady && state.user) await logout();
    state.localGuest = null;
    writeJson('dream-library-local-guest', null);
    renderAuth();
    closeOptionsPanel();
    updateScreen('login');
  }, '로그아웃했습니다.'));
  el.enterLobbyButton.addEventListener('click', () => enterLobbyFromAuth('resume')); // retired direct lobby button kept hidden for DOM compatibility
  el.exitCancelButton.addEventListener('click', closeExitConfirm);
  el.exitConfirmButton.addEventListener('click', confirmExitApp);
  el.exitOptionsButton.addEventListener('click', openOptionsFromExitSheet);
  el.exitWakeButton.addEventListener('click', wakeFromExitSleep);
  el.exitConfirmModal.addEventListener('click', (event) => { if (event.target === el.exitConfirmModal) closeExitConfirm(); });

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
  el.lobbyDeckRefreshButton.addEventListener('click', () => {
    renderLobbyMissionDeck(true);
    setStatus('로비 추천 미션을 현재 진행 상황 기준으로 다시 배치했습니다.');
  });
  el.lobbyMissionDeck.addEventListener('click', handleLobbyMissionClick);
  el.dailyRankTabs.addEventListener('click', (event) => {
    const node = (event.target as HTMLElement).closest<HTMLElement>('[data-daily-rank]');
    if (!node) return;
    state.dailyRankScope = node.dataset.dailyRank || 'today';
    writeText('dream-library-daily-rank-scope', state.dailyRankScope);
    renderDailyPanel();
    loadDailyLeaderboard();
  });
  el.collectionFilter.addEventListener('click', (event) => {
    const node = (event.target as HTMLElement).closest<HTMLElement>('[data-collection-filter]');
    if (!node) return;
    state.collectionFilter = node.dataset.collectionFilter || 'all';
    writeText('dream-library-collection-filter', state.collectionFilter);
    renderCollection();
  });
  el.restorationFocusButton.addEventListener('click', () => {
    scrollLobbyTarget('.restoration-panel');
    setStatus('복원 작업대를 확인하세요.');
  });
  el.newGameButton.addEventListener('click', () => startSelectedStage());
  el.exitToLobbyButton.addEventListener('click', () => exitToLobby());
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
  document.addEventListener('click', (event) => {
    const node = (event.target as HTMLElement).closest<HTMLElement>('[data-collapse-target]');
    if (!node) return;
    toggleLobbyPanel(node.dataset.collapseTarget || '');
  });

  el.restorationDetailFocusButton.addEventListener('click', () => {
    if (!state.pendingRestorationProjectId) return;
    const project = RESTORATION_PROJECTS.find((item) => item.id === state.pendingRestorationProjectId);
    if (project && canCompleteRestoration(project) && !state.restorationCompleted[project.id]) {
      completeRestorationProject(project.id);
      return;
    }
    state.restorationFocus = state.pendingRestorationProjectId;
    writeText('dream-library-restoration-focus', state.restorationFocus);
    closeRestorationDetail();
    renderRestoration();
    setStatus('집중 복원 프로젝트를 변경했습니다.');
  });

  window.addEventListener('resize', () => {
    portraitRuntime?.syncViewport();
    if (state.screen === 'game' && state.board.length) {
      renderer.renderBoard(state.board);
      renderBoardCameraGuide();
    }
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') handleSoftBack();
  });
}

function initBackNavigation() {
  if (state.browserBackReady) return;
  state.browserBackReady = true;
  try {
    window.history.replaceState({ dreamLibrary: true, screen: state.screen }, '', window.location.href);
    window.history.pushState({ dreamLibrary: true, screen: state.screen }, '', window.location.href);
  } catch {}
  window.addEventListener('popstate', () => {
    handleSoftBack();
    try { window.history.pushState({ dreamLibrary: true, screen: state.screen }, '', window.location.href); } catch {}
  });
}

function handleSoftBack() {
  if (!el.rewardModal.classList.contains('hidden')) { closeReward(); return; }
  if (!el.restorationDetailModal.classList.contains('hidden')) { closeRestorationDetail(); return; }
  if (!el.optionsModal.classList.contains('hidden')) { closeOptionsPanel(); return; }
  if (!el.exitConfirmModal.classList.contains('hidden')) { closeExitConfirm(); return; }
  if (!el.exitSleepModal.classList.contains('hidden')) { wakeFromExitSleep(); return; }
  if (state.screen === 'game') {
    exitToFirstScreen();
    setStatus('진행 중인 판을 정리하고 첫 화면으로 돌아왔습니다.');
    return;
  }
  if (state.screen === 'lobby' || state.screen === 'settings') {
    updateScreen('login');
    setStatus('첫 화면으로 돌아왔습니다.');
    return;
  }
  openExitConfirm();
}


function suggestKakaoAssist(_message: string) {
  syncGameViewport({ reason: 'assist-soft-fit' });
  portraitRuntime?.syncViewport();
}

async function requestKakaoPortraitLock(source = 'game') {
  syncGameViewport({ reason: source });
  if (browserRecovery?.inApp) {
    portraitRuntime?.syncViewport();
    return true;
  }
  await portraitRuntime?.requestLock(source);
  return true;
}

async function handoffIfNeeded(mode: 'assist' | 'auth' = 'assist') {
  if (!browserRecovery?.inApp) return false;
  audio.play('tap');
  if (mode === 'auth') setStatus('계정 저장을 시도합니다.');
  await requestKakaoPortraitLock(mode);
  return false;
}



function initButtonStateFeedback() {
  const selector = 'button, .mission-card, .stage-node, .collection-tile, .restore-node';
  document.addEventListener('pointerdown', (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>(selector);
    if (!target || target.hasAttribute('disabled')) return;
    target.dataset.pointerState = 'pressed';
  }, { passive: true });
  document.addEventListener('pointerup', (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>(selector);
    if (target) target.dataset.pointerState = 'released';
    window.setTimeout(() => target?.removeAttribute('data-pointer-state'), 90);
  }, { passive: true });
  document.addEventListener('pointercancel', () => {
    document.querySelectorAll<HTMLElement>('[data-pointer-state]').forEach((item) => item.removeAttribute('data-pointer-state'));
  }, { passive: true });
}

function initLobbyScrollGuard() {
  const shell = el.app?.closest<HTMLElement>('.app-shell') || document.querySelector<HTMLElement>('.app-shell');
  if (!shell) return;
  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let dragging = false;
  let dragLocked = false;

  shell.addEventListener('pointerdown', (event) => {
    if (state.screen !== 'lobby') return;
    startX = event.clientX;
    startY = event.clientY;
    startTime = performance.now();
    dragging = false;
    dragLocked = false;
    document.body.classList.remove('is-lobby-dragging');
  }, { passive: true });

  shell.addEventListener('pointermove', (event) => {
    if (state.screen !== 'lobby') return;
    const dx = Math.abs(event.clientX - startX);
    const dy = Math.abs(event.clientY - startY);
    if (dy > 5 && dy > dx * 0.72) {
      dragging = true;
      dragLocked = dy > 10;
      document.body.classList.add('is-lobby-dragging');
    }
  }, { passive: true });

  shell.addEventListener('click', (event) => {
    if (state.screen !== 'lobby') return;
    const elapsed = performance.now() - startTime;
    if ((dragging || dragLocked) && elapsed < 900) {
      event.preventDefault();
      event.stopPropagation();
    }
    dragging = false;
    window.setTimeout(() => document.body.classList.remove('is-lobby-dragging'), 60);
  }, true);
}

function enterLobbyFromAuth(mode: 'guest' | 'google' | 'email' | 'email-signup' | 'resume' = 'guest') {
  if (!hasSession()) {
    state.localGuest = makeLocalGuest();
    writeJson('dream-library-local-guest', state.localGuest);
    renderAuth();
  }
  syncGameViewport({ reason: `auth-entry-${mode}` });
  portraitRuntime?.syncViewport();
  renderLobby();
  updateScreen('lobby');
  const message: Record<string, string> = {
    guest: '게스트 로그인 완료. 스테이지를 고르고 진짜 게임을 시작하세요.',
    google: '구글 로그인 저장이 연결되었습니다. 스테이지를 고르세요.',
    email: '이메일 로그인 저장이 연결되었습니다. 스테이지를 고르세요.',
    'email-signup': '이메일 저장 계정을 만들었습니다. 스테이지를 고르세요.',
    resume: '저장된 세션으로 로비를 열었습니다.'
  };
  setStatus(message[mode] || message.guest);
}

function enterLobbyFromStart() {
  syncGameViewport({ reason: 'enter-lobby' });
  enterLobbyFromAuth('resume');
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
  await handoffIfNeeded('assist');
  state.currentBoardId = options.daily ? 'daily' : 'global';
  const baseStage = getStageById(state.selectedStageId);
  if (!options.daily && !isStageUnlocked(baseStage.id)) {
    setStatus('잠긴 스테이지입니다. 이전 기억을 먼저 복원하세요.');
    renderLobby();
    return;
  }
  const stage = options.daily ? { ...baseStage, modifiers: state.dailyChallenge.modifiers, dailySeed: state.dailyChallenge.seed } : baseStage;
  const difficulty = DIFFICULTIES[stage.difficultyKey];
  state.stageModifiers = [...(stage.modifiers || [])];
  state.pressureTick = 0;
  state.timeSealBonusCount = 0;
  state.activeBoss = getBossForStage(stage);
  renderBossPanel();
  audio.unlock();
  audio.play('tap');
  syncGameViewport({ reason: 'stage-start' });
  portraitRuntime?.syncViewport();
  state.board = createBoard(difficulty, stage.modifiers || []);
  renderBoardCameraGuide(difficulty);
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
  renderBoardCameraGuide(difficulty);
  setBossFrame('idle');
  renderer.setBossHp(100, getBossPhase(100));
  renderGameHud();
  setStatus('같은 마법 오브젝트를 연결하세요.');
  updateMissionLabel();
  renderModifierStrip(stage.modifiers || []);
}





function handleSpecialTileGate(point: BoardPoint, tile: any) {
  if (!isSpecialTileBlocked(tile)) return false;
  state.selected = null;
  renderer.setSelected(null);
  if (tile.special === 'fog') {
    state.board = revealSpecialTile(state.board, point);
    renderer.renderBoard(state.board);
    setStatus('안개 타일을 걷었습니다. 드러난 오브젝트를 다시 선택하세요.');
    HAPTIC.select();
    return true;
  }
  if (tile.special === 'locked') {
    if (state.combo >= 1) {
      state.board = revealAllSpecial(state.board, 'locked');
      renderer.renderBoard(state.board);
      setStatus('잠긴 타일의 금속 장식이 열렸습니다. 이제 연결할 수 있습니다.');
      HAPTIC.select();
    } else {
      renderer.playMismatch(point);
      setStatus('잠긴 타일은 먼저 다른 한 쌍을 연결하면 열립니다.');
      HAPTIC.warning();
    }
    return true;
  }
  if (tile.special === 'timeSeal') {
    state.board = revealSpecialTile(state.board, point);
    state.remainingSeconds = Math.max(0, state.remainingSeconds - 3);
    renderer.renderBoard(state.board);
    renderGameHud();
    setStatus('시간 봉인을 해제했습니다. 3초가 줄었지만 연결하면 시간을 되찾습니다.');
    HAPTIC.warning();
    return true;
  }
  return false;
}

function applySpecialMatchRewards(firstTile: any, secondTile: any) {
  const specials = [firstTile?.special, secondTile?.special].filter(Boolean);
  if (specials.includes('timeSeal')) {
    const bonus = 8;
    state.remainingSeconds += bonus;
    state.timeSealBonusCount += 1;
    setStatus(`시간 봉인을 복원해 ${bonus}초를 되찾았습니다.`);
  }
  if (specials.includes('fog')) {
    state.score += 40;
  }
  if (specials.includes('locked')) {
    state.score += 70;
  }
}

function advanceSpecialRulesAfterMatch() {
  if (countSpecialTiles(state.board, 'locked', true) > 0 && state.combo >= 1) {
    state.board = revealAllSpecial(state.board, 'locked');
    renderer.renderBoard(state.board);
    setStatus('연결 성공으로 잠긴 타일이 열렸습니다.');
  }
}

function triggerBossTelegraph(reason: 'combo' | 'time' | 'pressure' | 'mismatch') {
  setBossFrame('warn');
  const boss = state.activeBoss || {};
  const reasonText: Record<string, string> = {
    combo: '콤보 반격',
    time: '시간 압박',
    pressure: '보스 압박',
    mismatch: '실패 반격'
  };
  el.bossTelegraph.textContent = `${boss.telegraphTitle || reasonText[reason]} · ${boss.telegraphLine || boss.attackLine || '연결을 이어가세요.'}`;
  el.bossTelegraph.dataset.reason = reason;
  el.bossTelegraph.dataset.pattern = getBossWarningPattern(reason);
  el.bossTelegraph.dataset.bossId = boss.id || 'forgotten-spirit';
  el.bossCore.dataset.warningPattern = getBossWarningPattern(reason);
  el.bossCore.dataset.bossWarningDepth = boss.id || 'forgotten-spirit';
  el.bossTelegraph.classList.remove('hidden', 'telegraph-pop');
  void el.bossTelegraph.offsetWidth;
  el.bossTelegraph.classList.add('telegraph-pop');
  renderer.playBossWarning(boss.shakePower || 7, getBossWarningPattern(reason), boss.id || 'forgotten-spirit');
  window.setTimeout(hideBossTelegraph, 1500);
}

function getBossWarningPattern(reason: 'combo' | 'time' | 'pressure' | 'mismatch'): 'column' | 'row' | 'cross' | 'diagonal' {
  if (reason === 'combo') return 'cross';
  if (reason === 'time') return 'row';
  if (reason === 'mismatch') return 'diagonal';
  return 'column';
}

function hideBossTelegraph() {
  el.bossTelegraph.classList.add('hidden');
}

function handleTileTap(point: BoardPoint) {
  if (state.locked) return;
  const tile = state.board[point.row]?.[point.col];
  if (!tile) return;
  audio.play('tap');
  HAPTIC.tap();
  if (handleSpecialTileGate(point, tile)) return;
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
  const connectionPath = findConnectionPath(state.board, first, point);
  const firstTile = getTileAt(state.board, first);
  const secondTile = getTileAt(state.board, point);
  if (connectionPath) {
    state.locked = true;
    state.moves += 1;
    state.combo += 1;
    state.comboMax = Math.max(state.comboMax, state.combo);
    state.score += 100 * state.combo;
    renderer.setSelected(null);
    state.board = revealPairSpecials(state.board, first, point);
    audio.play('match');
    window.setTimeout(() => audio.play('beam'), 90);
    window.setTimeout(() => audio.play('burst'), 220);
    if (state.combo > 1) {
      audio.play('combo');
      HAPTIC.combo();
      showComboCutin(state.combo);
      if (state.combo >= 3) showBossHitCutin(state.combo);
    } else HAPTIC.match();
    renderer.playMatchSequence(first, point, state.combo, () => {
      state.board = removePair(state.board, first, point);
      applySpecialMatchRewards(firstTile, secondTile);
      advanceSpecialRulesAfterMatch();
      state.selected = null;
      state.locked = false;
      renderGameHud();
      const hp = (countRemaining(state.board) / Math.max(1, state.board.length * state.board[0].length)) * 100;
      renderer.setBossHp(hp, getBossPhase(hp));
      const warningEvery = state.activeBoss?.comboWarningEvery || 6;
      if (state.combo > 0 && state.combo % warningEvery === 0) triggerBossTelegraph('combo');
      if (isCleared(state.board)) clearStage();
    }, connectionPath);
  } else {
    state.moves += 1;
    state.combo = 0;
    renderer.playMismatch(point);
    HAPTIC.warning();
    renderer.setSelected(point);
    state.selected = point;
    if (state.stageModifiers.includes('bossPressure')) {
      state.remainingSeconds = Math.max(0, state.remainingSeconds - 4);
      triggerBossTelegraph('mismatch');
    }
    setStatus(state.stageModifiers.includes('bossPressure') ? '보스 압박 중 실패하여 시간이 4초 줄었습니다.' : '연결 경로는 최대 두 번까지만 꺾을 수 있습니다.');
    renderGameHud();
  }
}

function tickTimer() {
  if (state.screen !== 'game' || state.locked) return;
  state.remainingSeconds = Math.max(0, state.remainingSeconds - 1);
  renderGameHud();
  const warningSeconds = state.activeBoss?.warningSeconds || 15;
  if (!state.warnedLowTime && state.remainingSeconds <= warningSeconds && state.remainingSeconds > 0) {
    state.warnedLowTime = true;
    triggerBossTelegraph('time');
    setStatus(state.activeBoss?.attackLine || '보스가 반격을 준비합니다. 빠르게 연결하세요.');
  }
  if (state.stageModifiers.includes('bossPressure') && state.remainingSeconds > 0 && state.remainingSeconds % 30 === 0) {
    state.pressureTick += 1;
    state.score = Math.max(0, state.score - Number(state.activeBoss?.pressurePenalty || 25));
    triggerBossTelegraph('pressure');
    renderGameHud();
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
  const points = hint.map((item: any) => ({ row: item.row, col: item.col }));
  const routePath = points.length >= 2 ? findConnectionPath(state.board, points[0], points[1]) : null;
  renderer.hint(points, routePath);
  audio.play('select');
  setStatus('빛길이 이어지는 오브젝트를 보세요.');
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
  saveLocalScore(score, stars);
  renderStats();
  renderLobby();
  renderGameHud();
  audio.play('clear');
  renderer.playClearRewardFlow(stars, score);
  document.querySelector<HTMLElement>('.battle-stage')?.setAttribute('data-clear-flow-stage', 'v1040-reward-bridge');
  await saveScore(score, stars);
  await refreshRankingPanelsAfterScore();
  openReward(stars, score);
}

function updateScreen(screen: ScreenName) {
  if (screen !== state.screen) state.previousScreen = state.screen;
  state.screen = screen;
  el.app.dataset.screen = screen;
  document.body.dataset.screen = screen;
  const bg = screen === 'login' ? 'moon-library-v2' : screen === 'lobby' ? 'gothic-window-v2' : 'library-hall';
  if (screen === 'lobby' || screen === 'game') {
    syncGameViewport({ reason: `screen-${screen}` });
    portraitRuntime?.syncViewport();
  }
  document.documentElement.style.setProperty('--library-background-url', bg.endsWith('-v2') ? backgroundImageSet(bg) : `url(${import.meta.env.BASE_URL}assets/backgrounds/${bg}.png)`);
  el.screens.forEach((screenEl) => screenEl.classList.toggle('active', screenEl.id === `screen-${screen}`));
  // v1.0.37: no persistent top navigation line; browser back and in-screen actions handle flow.
  el.backButton.classList.add('hidden');
  if (screen === 'lobby') renderLobby();
  if (screen === 'settings') renderAuth();
  if (state.browserBackReady) {
    try { window.history.replaceState({ dreamLibrary: true, screen }, '', window.location.href); } catch {}
  }
}


function openOptions() {
  renderAuth();
  el.optionsModal.classList.remove('hidden');
}

function openOptionsFromExitSheet() {
  closeExitConfirm();
  openOptions();
}

function closeOptionsPanel() {
  el.optionsModal.classList.add('hidden');
}

function exitToLobby(reason: 'button' | 'back' = 'button') {
  stopCurrentBoard();
  updateScreen('lobby');
  if (reason === 'button') setStatus('로비로 돌아왔습니다.');
}

function exitToFirstScreen() {
  stopCurrentBoard();
  updateScreen('login');
}

function stopCurrentBoard() {
  state.locked = true;
  clearInterval(state.timerId);
  state.selected = null;
  renderer.setSelected(null);
  hideBossTelegraph();
}

function openExitConfirm() {
  el.exitConfirmMessage.textContent = state.screen === 'login'
    ? '첫 화면입니다. 종료를 누르면 현재 판과 타이머를 정리하고 종료 상태 화면으로 전환합니다.'
    : '진행 화면을 정리하고 첫 화면 상태로 저장한 뒤 종료 상태 화면으로 전환합니다.';
  el.exitConfirmModal.classList.remove('hidden');
  HAPTIC.warning();
}

function closeExitConfirm() {
  el.exitConfirmModal.classList.add('hidden');
}

function confirmExitApp() {
  closeExitConfirm();
  writeText('dream-library-last-exit-at', new Date().toISOString());
  stopCurrentBoard();
  updateScreen('login');
  showExitSleep('게임 상태를 정리했습니다. 홈 버튼이나 앱 전환으로 나가면 됩니다.');
  try { window.close(); } catch {}
  window.setTimeout(() => {
    if (!document.hidden) {
      showExitSleep('홈 버튼이나 앱 전환으로 나가면 되고, 다시 플레이하려면 아래 버튼을 누르세요.');
    }
  }, 260);
}

function showExitSleep(message: string) {
  el.exitSleepMessage.textContent = message;
  document.body.dataset.appState = 'sleep';
  el.exitSleepModal.classList.remove('hidden');
  setStatus('꿈의 서고를 종료 상태로 전환했습니다.');
}

function wakeFromExitSleep() {
  document.body.dataset.appState = 'active';
  el.exitSleepModal.classList.add('hidden');
  updateScreen('login');
  setStatus('다시 열었습니다. 게스트/구글/이메일 로그인 중 선택하세요.');
}

function getAuthProviderLabel(user: any) {
  if (!user) return '';
  const providerId = user.providerData?.[0]?.providerId || '';
  if (providerId === 'google.com') return '구글 로그인 · 진행 저장 중';
  if (user.email) return '이메일 로그인 · 진행 저장 중';
  if (user.isAnonymous) return '게스트 로그인 · 익명 저장 중';
  return '저장 세션 연결 중';
}

function renderAuth() {
  const name = state.user ? getDisplayName(state.user) : state.localGuest ? state.localGuest.name : '새로운 사서님';
  const provider = state.user ? getAuthProviderLabel(state.user) : state.localGuest ? '게스트 로그인 · 로컬 진행 중' : '게스트/구글/이메일 로그인 중 선택하세요.';
  el.authName.textContent = name;
  el.authProvider.textContent = provider;
  el.settingsAccountText.textContent = `${name} · ${provider}`;
  el.enterLobbyButton.classList.add('hidden');
  el.enterLobbyButton.setAttribute('aria-hidden', 'true');
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
  const clearCount = Object.keys(state.campaignProgress.cleared).length;
  const name = state.user ? getDisplayName(state.user) : state.localGuest ? state.localGuest.name : '사서님';
  el.lobbyGreeting.textContent = `${name}, 서고의 마법진이 준비되었습니다.`;
  syncLobbyMotion(clearCount, stage.id);
  el.selectedChapterName.textContent = chapter.title;
  el.chapterStoryText.textContent = chapter.story;
  el.selectedStageTitle.textContent = `${stage.number}. ${stage.title}`;
  el.selectedStageSubtitle.textContent = stage.subtitle;
  el.selectedStageMeta.textContent = `${difficulty.label} · ${difficulty.rows}×${difficulty.cols} · ${boss.name}`;
  el.selectedStageReward.textContent = `${stage.reward.label} ×${stage.reward.amount}`;
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
  renderLobbyMissionDeck();
  renderRestoration();
  renderCollection();
  renderDailyPanel();
  renderLobbyPanelState();
}


function syncLobbyMotion(clearCount: number, stageId: string) {
  const mood = clearCount >= 8 ? 'radiant' : clearCount >= 3 ? 'active' : 'welcome';
  document.body.dataset.lobbyMood = mood;
  if (el.lobbyHeroImage) {
    const useCompanion = mood !== 'welcome' || stageId.includes('cloud') || stageId.includes('star');
    el.lobbyHeroImage.src = `${import.meta.env.BASE_URL}assets/characters/${useCompanion ? 'mascot-companions-v2' : 'mascot-scholar-v2'}.png`;
    el.lobbyHeroImage.dataset.mood = mood;
  }
}


function renderLobbyMissionDeck(forcePulse = false) {
  const cards = getLobbyMissionCards();
  el.lobbyMissionDeck.innerHTML = cards.map((card) => `
    <button type="button" class="mission-card ${card.accent}${forcePulse ? ' deck-pulse' : ''}" data-mission-type="${card.type}" data-stage-id="${card.stageId || ''}" data-restore-id="${card.restoreId || ''}" data-filter="${card.filter || ''}" data-ready="${card.ready ? 'true' : 'false'}">
      <span class="mission-card-badge">${card.badge}</span>
      <strong>${escapeHtml(card.title)}</strong>
      <small>${escapeHtml(card.desc)}</small>
      <em>${escapeHtml(card.cta)}</em>
    </button>`).join('');
}

function getLobbyMissionCards() {
  const nextStage = STAGES.find((stage: any) => isStageUnlocked(stage.id) && !state.campaignProgress.cleared[stage.id]) || getStageById(state.selectedStageId);
  const dailyStage = getStageById(state.dailyChallenge.stageId);
  const readyProject = RESTORATION_PROJECTS.find((project) => canCompleteRestoration(project) && !state.restorationCompleted[project.id]);
  const focusProject = RESTORATION_PROJECTS.find((project) => project.id === state.restorationFocus) || RESTORATION_PROJECTS[0];
  const targetProject = readyProject || focusProject;
  const missingPremium = TILE_SET.find((tile: any) => tile.theme === '프리미엄' && Number(state.inventory[tile.type] || 0) <= 0);
  const ownedCount = TILE_SET.filter((tile: any) => Number(state.inventory[tile.type] || 0) > 0).length;
  const cards = [
    {
      type: 'campaign',
      stageId: nextStage.id,
      accent: 'gold',
      badge: '추천 스테이지',
      title: `${nextStage.number}. ${nextStage.title}`,
      desc: `${DIFFICULTIES[nextStage.difficultyKey].label} · ${getBossForStage(nextStage).name}`,
      cta: `${nextStage.reward.label} ×${nextStage.reward.amount}`,
      ready: true
    },
    {
      type: 'daily',
      stageId: dailyStage.id,
      accent: 'emerald',
      badge: '오늘의 복원',
      title: dailyStage.title,
      desc: `${state.dailyChallenge.label} · ${state.dailyChallenge.rewardLabel}`,
      cta: state.dailyChallenge.rewardLabel,
      ready: true
    },
    {
      type: 'restoration',
      restoreId: targetProject.id,
      accent: readyProject ? 'sky' : 'violet',
      badge: readyProject ? '복원 가능' : '집중 복원',
      title: targetProject.label,
      desc: `${getRestorationCurrent(targetProject)}/${targetProject.need} · ${targetProject.reward}`,
      cta: readyProject ? '완료 보상 수령' : `${getRestorationCurrent(targetProject)}/${targetProject.need} 필요`,
      ready: Boolean(readyProject)
    },
    {
      type: 'collection',
      filter: missingPremium ? 'premium' : 'missing',
      accent: 'violet',
      badge: '컬렉션 목표',
      title: missingPremium ? missingPremium.label : '미수집 오브젝트',
      desc: `${ownedCount}/${TILE_SET.length} 수집 · 도감 정리`,
      cta: missingPremium ? '프리미엄 수집' : '미수집 확인',
      ready: !missingPremium
    }
  ];
  return cards;
}

function handleLobbyMissionClick(event: Event) {
  const card = (event.target as HTMLElement).closest<HTMLElement>('[data-mission-type]');
  if (!card) return;
  const type = card.dataset.missionType || '';
  audio.play('select');
  HAPTIC.select();
  if (type === 'campaign') {
    const stageId = card.dataset.stageId || DEFAULT_STAGE_ID;
    const stage = getStageById(stageId);
    state.selectedStageId = stage.id;
    state.selectedChapterId = stage.chapterId;
    writeText('dream-library-selected-stage', stage.id);
    writeText('dream-library-selected-chapter', stage.chapterId);
    renderLobby();
    scrollLobbyTarget('.selected-stage-card');
    setStatus('추천 스테이지를 선택했습니다. 진짜 게임 시작을 누르면 전투가 시작됩니다.');
    return;
  }
  if (type === 'daily') {
    startDailyStage();
    return;
  }
  if (type === 'restoration') {
    openRestorationDetail(card.dataset.restoreId || state.restorationFocus || 'shelf');
    return;
  }
  if (type === 'collection') {
    state.collectionFilter = card.dataset.filter || 'missing';
    writeText('dream-library-collection-filter', state.collectionFilter);
    renderCollection();
    scrollLobbyTarget('.collection-panel');
    setStatus('컬렉션 도감 목표를 열었습니다. 미수집/프리미엄 오브젝트를 확인하세요.');
  }
}

function scrollLobbyTarget(selector: string) {
  const target = document.querySelector<HTMLElement>(selector);
  const shell = el.app?.closest<HTMLElement>('.app-shell') || document.querySelector<HTMLElement>('.app-shell');
  if (!target || !shell) return;
  const shellRect = shell.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const current = shell.scrollTop;
  const next = current + targetRect.top - shellRect.top - 12;
  shell.scrollTo({ top: Math.max(0, next), behavior: 'auto' });
}

function toggleLobbyPanel(panelKey: string) {
  if (!panelKey) return;
  state.collapsedPanels[panelKey] = !state.collapsedPanels[panelKey];
  writeJson('dream-library-lobby-collapsed-panels', state.collapsedPanels);
  renderLobbyPanelState();
}

function renderLobbyPanelState() {
  document.querySelectorAll<HTMLElement>('[data-lobby-panel]').forEach((panel) => {
    const key = panel.dataset.lobbyPanel || '';
    const collapsed = Boolean(state.collapsedPanels[key]);
    panel.classList.toggle('collapsed', collapsed);
    panel.querySelectorAll<HTMLElement>('[data-collapse-target]').forEach((button) => {
      if (button.dataset.collapseTarget === key) button.textContent = collapsed ? '펼치기' : '접기';
    });
  });
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
  setBossStableImage(boss.asset, boss.name);
  el.bossCore.dataset.bossAssetGuard = 'stable-fallback';
  el.bossCore.dataset.bossVisualStack = BOSS_VISUAL_STACK_PATCH;
  el.bossName.textContent = boss.name;
  el.bossPattern.textContent = boss.patternLabel;
  el.bossTelegraph.textContent = `${boss.telegraphTitle || '반격 예고'} · ${boss.telegraphLine || boss.attackLine || '연결을 이어가세요.'}`;
  el.bossTelegraph.classList.add('hidden');
  el.bossCore.dataset.bossId = boss.id;
  el.bossCore.dataset.phase = 'stable';
  el.bossCore.dataset.bossFrame = 'idle';
  el.bossCore.dataset.bossAtlasFrame = boss.atlasFrames?.idle || '';
  applyBossAtlasFrame(boss.atlasFrames?.idle || '');
  renderer.syncPixiBossLayer(boss.atlasFrames?.idle || '', 'idle');
}


function setBossStableImage(src = BOSS_IMAGE_FALLBACK_SRC, alt = '망각의 서고령') {
  el.bossImage.alt = alt;
  el.bossImage.dataset.bossImgGuard = 'stable';
  el.bossImage.dataset.bossAssetPolish = 'v1040-stable-visible';
  el.bossImage.onerror = () => {
    el.bossImage.onerror = null;
    el.bossImage.src = BOSS_IMAGE_FALLBACK_SRC;
    el.bossCore.classList.remove('boss-atlas-ready');
    el.bossCore.dataset.bossAtlasReady = 'fallback';
    el.bossCore.dataset.bossAssetGuard = 'fallback-image-visible';
  };
  if (!el.bossImage.src.endsWith(src)) el.bossImage.src = src;
  el.bossCore.dataset.bossImageSrc = src;
}

function applyBossAtlasFrame(frameKey = '') {
  const frame = getBossAtlasFrame(frameKey);
  if (!frame || !bossAtlasImageReady) {
    el.bossCore.classList.remove('boss-atlas-ready');
    el.bossAtlasSprite?.removeAttribute('style');
    el.bossCore.dataset.bossAtlasReady = bossAtlasImageReady ? 'missing-frame' : 'fallback';
    return;
  }
  const coreSize = Math.max(44, el.bossCore.clientWidth || 64);
  const scale = Math.min(0.38, Math.max(0.2, (coreSize * 1.48) / Math.max(frame.w, frame.h))); // v1.0.40: keep atlas overlay behind stable monster art
  el.bossCore.classList.add('boss-atlas-ready');
  el.bossCore.dataset.bossVisualStack = BOSS_VISUAL_STACK_PATCH;
  el.bossCore.style.setProperty('--boss-frame-w', `${frame.w}px`);
  el.bossCore.style.setProperty('--boss-frame-h', `${frame.h}px`);
  el.bossCore.style.setProperty('--boss-frame-x', `-${frame.x}px`);
  el.bossCore.style.setProperty('--boss-frame-y', `-${frame.y}px`);
  el.bossCore.style.setProperty('--boss-frame-scale', `${scale}`);
  el.bossCore.dataset.bossAtlasReady = 'true';
}

function setBossFrame(stateName: 'idle' | 'warn' | 'hit' | 'break' = 'idle') {
  const boss = state.activeBoss || getBossForStage(getStageById(state.selectedStageId));
  const src = boss.asset || BOSS_IMAGE_FALLBACK_SRC;
  const atlasFrame = boss.atlasFrames?.[stateName] || boss.atlasFrames?.idle || '';
  el.bossCore.dataset.bossFrame = stateName;
  el.bossCore.dataset.bossAtlasFrame = atlasFrame;
  applyBossAtlasFrame(atlasFrame);
  renderer.syncPixiBossLayer(atlasFrame, stateName);
  setBossStableImage(src, boss.name);
  if (stateName !== 'idle') {
    window.setTimeout(() => {
      const idle = boss.asset || BOSS_IMAGE_FALLBACK_SRC;
      const idleAtlasFrame = boss.atlasFrames?.idle || '';
      el.bossCore.dataset.bossFrame = 'idle';
      el.bossCore.dataset.bossAtlasFrame = idleAtlasFrame;
      applyBossAtlasFrame(idleAtlasFrame);
      renderer.syncPixiBossLayer(idleAtlasFrame, 'idle');
      setBossStableImage(idle, boss.name);
    }, stateName === 'break' ? 680 : 420);
  }
}

function renderStats() {
  el.bestScoreLabel.textContent = formatNumber(state.localStats.bestScore || 0);
  el.clearCountLabel.textContent = formatNumber(state.localStats.clearCount || 0);
  const stars = Object.values(state.campaignProgress.cleared).reduce((sum: number, clear: any) => sum + (clear.stars || 0), 0);
  el.starCountLabel.textContent = formatNumber(stars);
}

function getHudDensity(): 'normal' | 'compact' | 'micro' {
  const width = window.innerWidth || document.documentElement.clientWidth || 390;
  const height = window.innerHeight || document.documentElement.clientHeight || 740;
  if (height <= 660 || width <= 360) return 'micro';
  if (height <= 760 || width <= 390) return 'compact';
  return 'normal';
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
  state.hudDensity = getHudDensity();
  el.app.dataset.hudDensity = state.hudDensity;
  document.querySelector<HTMLElement>('.battle-stage')?.setAttribute('data-real-device-qa', 'touch-precision-readability');
  document.querySelector<HTMLElement>('.screen-game')?.setAttribute('data-hud-density', state.hudDensity);
  document.querySelector<HTMLElement>('.game-hud')?.setAttribute('data-hud-density', state.hudDensity);
  document.querySelector<HTMLElement>('.battle-stage')?.setAttribute('data-hud-density', state.hudDensity);
  renderBoardCameraGuide(difficulty);
}

function renderBoardCameraGuide(difficultyOverride?: any) {
  const difficulty = difficultyOverride || DIFFICULTIES[getStageById(state.selectedStageId).difficultyKey];
  const panZoom = difficulty?.cameraMode === 'panZoom' || Number(difficulty?.rows || 0) * Number(difficulty?.cols || 0) > 72;
  document.querySelector<HTMLElement>('.battle-stage')?.setAttribute('data-board-camera', panZoom ? 'pan-zoom' : 'fit');
  document.querySelector<HTMLElement>('.battle-stage')?.setAttribute('data-camera-ui', 'space-reclaimed');
  document.querySelector<HTMLElement>('.battle-stage')?.setAttribute('data-space-polish', 'v1037');
  if (el.boardCameraGuide) {
    el.boardCameraGuide.textContent = '';
    el.boardCameraGuide.classList.add('hidden');
    el.boardCameraGuide.classList.remove('camera-tutorial');
    el.boardCameraGuide.setAttribute('aria-hidden', 'true');
  }
  if (el.boardCameraControls) {
    el.boardCameraControls.innerHTML = '';
    el.boardCameraControls.classList.add('hidden');
    el.boardCameraControls.setAttribute('aria-hidden', 'true');
  }
}


function updateMissionLabel() {
  const stage = getStageById(state.selectedStageId);
  const difficulty = DIFFICULTIES[stage.difficultyKey];
  const remaining = state.board.length ? countRemaining(state.board) : difficulty.rows * difficulty.cols;
  const targetCombo = difficulty.key === 'easy' ? 3 : difficulty.key === 'normal' ? 4 : difficulty.key === 'hard' ? 5 : 6;
  const bossTags = getBossStageTags(stage);
  el.missionLabel.textContent = `남은 오브젝트 ${remaining}개 · ${targetCombo}콤보 · ${bossTags[0] || '보스전'}`;
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
  const completedCount = Object.keys(state.restorationCompleted).length;
  el.restorationSummary.textContent = `보유 복원 재료 ${formatNumber(totalItems)}개 · 완료 ${completedCount}/${RESTORATION_PROJECTS.length} · 프로젝트를 눌러 보상 상태를 확인하세요.`;
  el.restorationList.innerHTML = RESTORATION_PROJECTS.map((project) => {
    const current = getRestorationCurrent(project);
    const ratio = Math.min(100, Math.round((current / project.need) * 100));
    const focused = project.id === state.restorationFocus;
    const completed = Boolean(state.restorationCompleted[project.id]);
    const label = completed ? '완료' : ratio >= 100 ? '복원 가능' : `${current}/${project.need}`;
    return `<button type="button" class="restore-node ${ratio >= 100 ? 'complete' : ''} ${completed ? 'restored' : ''} ${focused ? 'selected' : ''}" data-restore-id="${project.id}"><strong>${focused ? '✦ ' : ''}${project.label}</strong><span>${label}</span><i style="--restore-progress:${ratio}%"></i></button>`;
  }).join('');
}

function getRestorationCurrent(project: any) {
  return project.types.reduce((sum: number, type: string) => sum + Number(state.inventory[type] || 0), 0);
}

function canCompleteRestoration(project: any) {
  return getRestorationCurrent(project) >= project.need;
}

function completeRestorationProject(projectId: string) {
  const project = RESTORATION_PROJECTS.find((item) => item.id === projectId);
  if (!project || state.restorationCompleted[project.id] || !canCompleteRestoration(project)) return;
  state.restorationCompleted[project.id] = new Date().toISOString();
  addReward('spark', 2);
  addReward('star', 1);
  writeJson('dream-library-restoration-completed', state.restorationCompleted);
  closeRestorationDetail();
  renderLobby();
  setStatus(`${project.label} 복원이 완료되어 별가루와 기억 파편을 획득했습니다.`);
  HAPTIC.combo();
}


function renderCollection() {
  const collected = TILE_SET.filter((tile: any) => Number(state.inventory[tile.type] || 0) > 0);
  const premiumTotal = TILE_SET.filter((tile: any) => tile.theme === '프리미엄').length;
  const premiumOwned = collected.filter((tile: any) => tile.theme === '프리미엄').length;
  const v2Owned = collected.filter((tile: any) => tile.theme === 'v2 에셋').length;
  const v2Total = TILE_SET.filter((tile: any) => tile.theme === 'v2 에셋').length;
  el.collectionSummary.textContent = `${collected.length}/${TILE_SET.length} 수집 · 프리미엄 ${premiumOwned}/${premiumTotal} · v2 오브젝트 ${v2Owned}/${v2Total}`;
  el.collectionFilter.querySelectorAll('[data-collection-filter]').forEach((button: Element) => {
    button.classList.toggle('selected', (button as HTMLElement).dataset.collectionFilter === state.collectionFilter);
  });
  const filtered = TILE_SET
    .filter((tile: any) => {
      const count = Number(state.inventory[tile.type] || 0);
      if (state.collectionFilter === 'owned') return count > 0;
      if (state.collectionFilter === 'missing') return count <= 0;
      if (state.collectionFilter === 'premium') return tile.theme === '프리미엄';
      return true;
    })
    .sort((a: any, b: any) => Number(state.inventory[b.type] || 0) - Number(state.inventory[a.type] || 0));
  el.collectionList.innerHTML = filtered.map((tile: any) => {
    const count = Number(state.inventory[tile.type] || 0);
    return `<article class="collection-tile ${count > 0 ? 'owned' : 'locked'} ${tile.theme === '프리미엄' ? 'premium' : ''} ${tile.theme === 'v2 에셋' ? 'v2-asset' : ''}" data-theme="${escapeHtml(tile.theme || '')}"><img src="${tile.asset}" alt="" draggable="false" /><strong>${escapeHtml(tile.label)}</strong><span>${count > 0 ? `${count}개 · ${escapeHtml(tile.theme)}` : '미수집'}</span></article>`;
  }).join('') || '<p class="empty-list">조건에 맞는 오브젝트가 없습니다.</p>';
}

function openRestorationDetail(projectId: string) {
  const project = RESTORATION_PROJECTS.find((item) => item.id === projectId) || RESTORATION_PROJECTS[0];
  state.pendingRestorationProjectId = project.id;
  const current = getRestorationCurrent(project);
  const ratio = Math.min(100, Math.round((current / project.need) * 100));
  const completed = Boolean(state.restorationCompleted[project.id]);
  el.restorationDetailTitle.textContent = completed ? `${project.label} 완료` : project.label;
  el.restorationDetailMessage.textContent = `${project.description} · 보상: ${project.reward} · 진행률 ${ratio}%${completed ? ' · 복원 완료' : ''}`;
  el.restorationDetailItems.innerHTML = project.types.map((type) => {
    const tile = TILE_SET.find((item: any) => item.type === type);
    const count = Number(state.inventory[type] || 0);
    return `<span class="detail-item"><img src="${tile?.asset || ''}" alt="" draggable="false" />${escapeHtml(tile?.label || type)} ${count}개</span>`;
  }).join('');
  (el.restorationDetailFocusButton as HTMLButtonElement).disabled = completed;
  el.restorationDetailFocusButton.textContent = completed ? '완료됨' : canCompleteRestoration(project) ? '복원 완료' : project.id === state.restorationFocus ? '집중 중' : '집중 프로젝트';
  el.restorationDetailModal.classList.remove('hidden');
}

function closeRestorationDetail() {
  el.restorationDetailModal.classList.add('hidden');
}

function renderDailyPanel() {
  const daily = state.dailyChallenge;
  const stage = getStageById(daily.stageId);
  const modifierText = daily.modifiers.length ? daily.modifiers.map((item: string) => ({ fog: '안개', locked: '잠금', timeSeal: '시간 봉인', bossPressure: '보스 압박' } as Record<string, string>)[item] || item).join(' · ') : '기본 규칙';
  el.dailyTitle.textContent = `오늘의 복원 · ${stage.title}`;
  el.dailyDesc.textContent = `${daily.label} · ${modifierText} · ${daily.rewardLabel}`;
  el.dailyRankTabs.querySelectorAll('[data-daily-rank]').forEach((button: Element) => {
    button.classList.toggle('selected', (button as HTMLElement).dataset.dailyRank === state.dailyRankScope);
  });
}

function showComboCutin(combo: number) {
  if (combo < 2) return;
  const finisher = combo >= 5 || combo % 4 === 0;
  el.comboCutin.textContent = finisher ? `${combo} COMBO · 서고 공명` : `${combo} COMBO`;
  el.comboCutin.classList.remove('hidden', 'combo-pop', 'combo-finisher');
  if (finisher) el.comboCutin.classList.add('combo-finisher');
  void el.comboCutin.offsetWidth;
  el.comboCutin.classList.add('combo-pop');
  if (finisher) {
    document.querySelector('#boss-core')?.classList.add('cutin-hit');
    window.setTimeout(() => document.querySelector('#boss-core')?.classList.remove('cutin-hit'), 540);
  }
  window.setTimeout(() => el.comboCutin.classList.add('hidden'), finisher ? 980 : 760);
}


function showBossHitCutin(combo: number) {
  const boss = state.activeBoss || getBossForStage(getStageById(state.selectedStageId));
  const broken = combo >= 5;
  const finisher = combo >= 7;
  setBossFrame(broken ? 'break' : 'hit');
  el.bossHitCutin.dataset.bossId = boss.id || 'boss';
  el.bossHitCutin.dataset.comboTier = finisher ? 'finisher' : broken ? 'break' : 'hit';
  el.bossHitCutin.dataset.visualPriority = finisher ? 'finisher-front' : broken ? 'boss-break' : 'compact-hit';
  document.querySelector<HTMLElement>('.battle-stage')?.setAttribute('data-boss-cutin-priority', finisher ? 'front' : 'compact');
  el.bossHitCutin.textContent = finisher ? `${boss.name} 균열 · ${combo} COMBO` : broken ? `BOSS BREAK · ${combo} COMBO` : `BOSS HIT · ${combo} COMBO`;
  el.bossHitCutin.classList.remove('hidden', 'boss-hit-pop', 'boss-break-pop', 'boss-finisher-pop');
  if (broken) el.bossHitCutin.classList.add('boss-break-pop');
  if (finisher) el.bossHitCutin.classList.add('boss-finisher-pop');
  void el.bossHitCutin.offsetWidth;
  el.bossHitCutin.classList.add('boss-hit-pop');
  window.setTimeout(() => el.bossHitCutin.classList.add('hidden'), finisher ? 1120 : broken ? 920 : 720);
}

function openReward(stars: number, score: number) {
  const stage = getStageById(state.selectedStageId);
  const focusProject = RESTORATION_PROJECTS.find((project) => project.types.includes(stage.reward.type)) || RESTORATION_PROJECTS.find((project) => !state.restorationCompleted[project.id]) || RESTORATION_PROJECTS[0];
  const current = focusProject ? getRestorationCurrent(focusProject) : 0;
  const need = focusProject?.need || 0;
  const progressText = focusProject ? `${focusProject.label} ${Math.min(current, need)}/${need}` : '복원 재료 보관';
  el.rewardTitle.textContent = `${stage.title} 복원 완료`;
  el.rewardMessage.textContent = `별 ${stars}개 · ${formatNumber(score)}점 · 획득 재료가 ${progressText}에 반영되었습니다.`;
  const dailyBonus = state.currentBoardId === 'daily' ? `<span class="reward-chip reward-chip-daily">오늘의 별가루 ×${state.dailyChallenge.rewardBoost}</span>` : '';
  const restoreChip = focusProject ? `<span class="reward-chip reward-chip-restore">복원 연결 · ${escapeHtml(focusProject.label)}</span>` : '';
  el.rewardItems.dataset.rewardFlow = 'materials-linked-v1040';
  el.rewardItems.innerHTML = `<span class="reward-chip reward-chip-stars">★ ${stars}</span><span class="reward-chip reward-chip-material">${escapeHtml(stage.reward.label)} ×${stage.reward.amount}</span>${restoreChip}${dailyBonus}`;
  el.rewardModal.dataset.rewardFlow = CLEAR_REWARD_FLOW_PATCH;
  const next = getNextStage(stage.id);
  el.nextStageButton.classList.toggle('hidden', !next);
  el.rewardModal.classList.remove('hidden');
}

function closeReward() {
  el.rewardModal.classList.add('hidden');
}

async function loadLeaderboard() {
  const localRows = getLocalRankRows(state.localRanking, 'global');
  if (!db) {
    el.leaderboardList.innerHTML = renderRankRows(localRows, '로컬 복원 기록 준비 완료', 'local');
    return;
  }
  try {
    const snapshot = await getDocs(query(collection(db, 'leaderboards/global/scores'), orderBy('score', 'desc'), limit(5)));
    const cloudRows = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as any;
      return {
        displayName: data.displayName || '사서',
        score: Number(data.score || 0),
        stageId: String(data.stageId || ''),
        source: 'cloud' as const,
        tag: '저장'
      };
    });
    el.leaderboardList.innerHTML = renderRankRows(mergeRankRows(cloudRows, localRows), '첫 복원 기록을 남겨보세요.', cloudRows.length ? 'mixed' : 'local');
  } catch {
    el.leaderboardList.innerHTML = renderRankRows(localRows, 'Firebase 랭킹 실패 · 로컬 기록 표시', 'local');
  }
}

function getLocalRankRows(list: LocalRankEntry[], scope: 'global' | 'daily') {
  return [...list]
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((entry) => {
      const rankKey = makeRankIdentity(entry);
      return {
        displayName: entry.displayName,
        score: entry.score,
        stageId: entry.stageId,
        dailyKey: entry.dailyKey,
        source: 'local' as const,
        tag: scope === 'daily' ? '로컬 daily' : '로컬',
        rankKey,
        fresh: rankKey === state.recentScoreKey
      };
    });
}

function mergeRankRows(cloudRows: any[], localRows: any[]) {
  const seen = new Set<string>();
  const merged = [...cloudRows, ...localRows]
    .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
    .filter((entry) => {
      const key = `${entry.source}:${entry.displayName}:${entry.stageId || ''}:${entry.dailyKey || ''}:${entry.score}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 5);
  return merged;
}

function renderRankRows(rows: any[], emptyLabel = '로컬 플레이 준비 완료', mode: 'cloud' | 'local' | 'mixed' = 'mixed') {
  if (!rows.length) return `<li class="rank-empty">${escapeHtml(emptyLabel)}</li>`;
  const sourceSummary = mode === 'mixed' ? '<li class="rank-source-note"><strong>Cloud</strong>와 <strong>Local</strong> 기록을 점수순으로 함께 표시합니다.</li>' : mode === 'local' ? '<li class="rank-source-note"><strong>Local</strong> 기기 기록 기준으로 표시합니다.</li>' : '';
  return sourceSummary + rows.map((entry, index) => {
    const rankClass = index === 0 ? 'rank-gold' : index === 1 ? 'rank-silver' : index === 2 ? 'rank-bronze' : '';
    const sourceClass = entry.source === 'cloud' ? 'rank-cloud' : 'rank-local';
    const sourceLabel = entry.source === 'cloud' ? 'Cloud' : 'Local';
    const dailyTag = entry.dailyKey ? `<small>${escapeHtml(String(entry.dailyKey).slice(5))}</small>` : '';
    return `<li class="rank-row ${rankClass} ${sourceClass}" data-rank-source="${entry.source}" data-rank-mode="${mode}" data-rank-fresh="${entry.fresh ? 'true' : 'false'}"><b>${index + 1}</b><span>${escapeHtml(entry.displayName || '사서')}</span><strong>${formatNumber(entry.score || 0)}</strong>${dailyTag}<em>${sourceLabel}</em></li>`;
  }).join('');
}

async function loadDailyLeaderboard() {
  const scopeLabel = state.dailyRankScope === 'all' ? '전체 일일' : '오늘';
  const localRows = getLocalRankRows(
    state.localDailyRanking.filter((entry) => state.dailyRankScope === 'all' || entry.dailyKey === state.dailyChallenge.dateKey),
    'daily'
  );
  if (!db) {
    el.dailyLeaderboardList.innerHTML = renderRankRows(localRows, `로컬 ${scopeLabel} 기록 준비 완료`, 'local');
    return;
  }
  try {
    const daily = state.dailyChallenge;
    const ref = state.dailyRankScope === 'all'
      ? collection(db, 'leaderboards/daily/scores')
      : collection(db, 'leaderboards', 'daily', 'days', daily.dateKey, 'scores');
    const snapshot = await getDocs(query(ref, orderBy('score', 'desc'), limit(5)));
    const cloudRows = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as any;
      return {
        displayName: data.displayName || '사서',
        score: Number(data.score || 0),
        stageId: String(data.stageId || ''),
        dailyKey: data.dailyKey || daily.dateKey,
        source: 'cloud' as const,
        tag: '저장'
      };
    });
    el.dailyLeaderboardList.innerHTML = renderRankRows(mergeRankRows(cloudRows, localRows), `${scopeLabel} 첫 기록을 노려보세요.`, cloudRows.length ? 'mixed' : 'local');
  } catch {
    el.dailyLeaderboardList.innerHTML = renderRankRows(localRows, `${scopeLabel} Firebase 실패 · 로컬 기록 표시`, 'local');
  }
}

function renderLocalLeaderboard(emptyLabel = '로컬 플레이 준비 완료', returnOnly = false) {
  const markup = renderRankRows(getLocalRankRows(state.localRanking, 'global'), emptyLabel, 'local');
  if (!returnOnly) el.leaderboardList.innerHTML = markup;
  return markup;
}

function renderLocalDailyLeaderboard(emptyLabel = '로컬 일일 기록 준비 완료', returnOnly = false) {
  const dailyKey = state.dailyChallenge.dateKey;
  const rows = getLocalRankRows(
    state.localDailyRanking.filter((entry) => state.dailyRankScope === 'all' || entry.dailyKey === dailyKey),
    'daily'
  );
  const markup = renderRankRows(rows, emptyLabel, 'local');
  if (!returnOnly) el.dailyLeaderboardList.innerHTML = markup;
  return markup;
}

function saveLocalScore(score: number, stars: number) {
  const stage = getStageById(state.selectedStageId);
  const baseEntry: LocalRankEntry = {
    displayName: state.user ? getDisplayName(state.user) : state.localGuest?.name || '로컬 사서',
    score,
    stageId: stage.id,
    stars,
    updatedAt: new Date().toISOString()
  };
  state.recentScoreKey = makeRankIdentity(baseEntry);
  state.localRanking = upsertLocalRank(state.localRanking, baseEntry);
  writeJson('dream-library-local-ranking-global', state.localRanking);
  if (state.currentBoardId === 'daily') {
    const dailyEntry = { ...baseEntry, dailyKey: state.dailyChallenge.dateKey };
    state.recentScoreKey = makeRankIdentity(dailyEntry);
    state.localDailyRanking = upsertLocalRank(state.localDailyRanking, dailyEntry);
    writeJson('dream-library-local-ranking-daily', state.localDailyRanking);
  }
}

function makeRankIdentity(entry: Pick<LocalRankEntry, 'displayName' | 'stageId' | 'dailyKey'>) {
  return `${entry.displayName}:${entry.stageId}:${entry.dailyKey || 'global'}`;
}

function upsertLocalRank(list: LocalRankEntry[], entry: LocalRankEntry) {
  const identity = makeRankIdentity(entry);
  const merged = list.filter((item) => makeRankIdentity(item) !== identity);
  merged.push(entry);
  return merged.sort((a, b) => b.score - a.score).slice(0, 20);
}

async function refreshRankingPanelsAfterScore() {
  await Promise.allSettled([loadLeaderboard(), loadDailyLeaderboard()]);
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
    if (error?.message === 'login-disabled' || error?.code === 'firebase/missing-config') setStatus('현재는 게스트 로그인을 사용할 수 있습니다.');
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
