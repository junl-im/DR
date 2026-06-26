import { collection, doc, getDocs, limit, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import './styles.css';
import { db, firebaseMissingKeys, firebaseReady } from './firebase.js';
import {
  getDisplayName,
  loginAnonymously,
  loginWithEmail,
  loginWithGoogle,
  logout,
  observeAuth,
  signupWithEmail
} from './auth.js';
import { DIFFICULTIES, PRELOAD_ASSETS, TILE_SET } from './game/difficulty.js';
import { CHAPTERS, DEFAULT_STAGE_ID, STAGES, getChapterById, getChapterStages, getNextStage, getStageById } from './game/stages.js';
import { canConnect, countRemaining, createBoard, findHint, isCleared, removePair, shuffleRemaining } from './game/shisen.js';
import { initBrowserGuard } from './platform/browserGuard.js';
import { initFullscreenControls, requestGameFullscreen } from './platform/fullscreen.js';
import { initInstallPrompt, registerServiceWorker } from './platform/pwa.js';

const elements = {
  app: document.querySelector('#app'),
  backButton: document.querySelector('#back-button'),
  screens: [...document.querySelectorAll('.screen')],
  loginStatus: document.querySelector('#login-status'),
  board: document.querySelector('#board'),
  difficultyRow: document.querySelector('#difficulty-row'),
  difficultyTitle: document.querySelector('#difficulty-title'),
  lobbyGreeting: document.querySelector('#lobby-greeting'),
  settingsAccountText: document.querySelector('#settings-account-text'),
  bestScoreLabel: document.querySelector('#best-score-label'),
  clearCountLabel: document.querySelector('#clear-count-label'),
  timeLabel: document.querySelector('#time-label'),
  scoreLabel: document.querySelector('#score-label'),
  movesLabel: document.querySelector('#moves-label'),
  comboLabel: document.querySelector('#combo-label'),
  statusLabel: document.querySelector('#status-label'),
  newGameButton: document.querySelector('#new-game-button'),
  startSelectedButton: document.querySelector('#start-selected-button'),
  worldMap: document.querySelector('#world-map'),
  stageProgressLabel: document.querySelector('#stage-progress-label'),
  selectedChapterName: document.querySelector('#selected-chapter-name'),
  chapterStoryText: document.querySelector('#chapter-story-text'),
  selectedStageTitle: document.querySelector('#selected-stage-title'),
  selectedStageSubtitle: document.querySelector('#selected-stage-subtitle'),
  selectedStageMeta: document.querySelector('#selected-stage-meta'),
  selectedStageReward: document.querySelector('#selected-stage-reward'),
  starCountLabel: document.querySelector('#star-count-label'),
  rewardModal: document.querySelector('#reward-modal'),
  rewardTitle: document.querySelector('#reward-title'),
  rewardMessage: document.querySelector('#reward-message'),
  rewardItems: document.querySelector('#reward-items'),
  nextStageButton: document.querySelector('#next-stage-button'),
  replayStageButton: document.querySelector('#replay-stage-button'),
  hintButton: document.querySelector('#hint-button'),
  shuffleButton: document.querySelector('#shuffle-button'),
  exitToLobbyButton: document.querySelector('#exit-to-lobby-button'),
  anonymousButton: document.querySelector('#anonymous-button'),
  googleButton: document.querySelector('#google-button'),
  signoutButton: document.querySelector('#signout-button'),
  showEmailButton: document.querySelector('#show-email-button'),
  emailForm: document.querySelector('#email-form'),
  emailInput: document.querySelector('#email-input'),
  passwordInput: document.querySelector('#password-input'),
  emailSignupButton: document.querySelector('#email-signup-button'),
  enterLobbyButton: document.querySelector('#enter-lobby-button'),
  openSettingsButton: document.querySelector('#open-settings-button'),
  settingsLoginButton: document.querySelector('#settings-login-button'),
  settingsLobbyButton: document.querySelector('#settings-lobby-button'),
  settingsFullscreenButton: document.querySelector('#settings-fullscreen-button'),
  resetProgressButton: document.querySelector('#reset-progress-button'),
  authName: document.querySelector('#auth-name'),
  authProvider: document.querySelector('#auth-provider'),
  leaderboardList: document.querySelector('#leaderboard-list'),
  refreshLeaderboardButton: document.querySelector('#refresh-leaderboard-button'),
  assetGallery: document.querySelector('#asset-gallery'),
  assetProgress: document.querySelector('#asset-progress'),
  assetProgressGame: document.querySelector('#asset-progress-game'),
  soundToggle: document.querySelector('#sound-toggle'),
  fullscreenButton: document.querySelector('#fullscreen-button'),
  installButton: document.querySelector('#install-button')
};

const state = {
  screen: 'login',
  previousScreen: 'login',
  user: null,
  localGuest: readJsonPreference('dream-library-local-guest', null),
  difficultyKey: 'easy',
  board: [],
  selected: null,
  moves: 0,
  combo: 0,
  comboMax: 0,
  score: 0,
  remainingSeconds: 0,
  startedAt: 0,
  timerId: null,
  hints: 0,
  shuffles: 0,
  locked: true,
  discoveredTiles: new Set(readJsonPreference('dream-library-discovered-tiles', [])),
  soundEnabled: readPreference('dream-library-sound') !== 'off',
  localStats: readJsonPreference('dream-library-local-stats', { bestScore: 0, clearCount: 0 }),
  selectedStageId: readPreference('dream-library-selected-stage') || DEFAULT_STAGE_ID,
  campaignProgress: normalizeCampaignProgress(readJsonPreference('dream-library-campaign-progress', null)),
  lastReward: null
};

init();

function init() {
  const browserGuard = initBrowserGuard();
  if (browserGuard.blocked) {
    elements.app?.setAttribute('aria-hidden', 'true');
    return;
  }

  registerServiceWorker();
  applyAssetBackgrounds();
  preloadAssets(PRELOAD_ASSETS);
  initFullscreenControls(elements.fullscreenButton, setGlobalStatus);
  initInstallPrompt(elements.installButton, setGlobalStatus);
  restorePreferences();
  bindEvents();
  renderDifficultyButtons();
  renderWorldMap();
  renderSelectedStage();
  renderAssetGallery();
  renderLocalStats();
  resetBoardPlaceholder();
  updateScreen('login');
  observeAuth((user) => {
    state.user = user;
    if (user) state.localGuest = null;
    renderAuth();
    renderLobby();
    loadLeaderboard();
  });
  loadLeaderboard();

  if (!firebaseReady) {
    setLoginStatus(`Firebase 환경변수 설정 전입니다. 누락: ${firebaseMissingKeys.join(', ') || '없음'}. 게스트 플레이는 가능합니다.`);
  }
}

function bindEvents() {
  elements.backButton.addEventListener('click', () => {
    if (state.screen === 'settings') updateScreen(state.previousScreen || 'login');
    else if (state.screen === 'game') updateScreen('lobby');
    else updateScreen('login');
  });

  elements.openSettingsButton.addEventListener('click', () => updateScreen('settings'));
  elements.settingsLoginButton.addEventListener('click', () => updateScreen('login'));
  elements.settingsLobbyButton.addEventListener('click', () => {
    if (hasPlayableSession()) updateScreen('lobby');
    else updateScreen('login');
  });

  elements.showEmailButton.addEventListener('click', () => {
    elements.emailForm.classList.toggle('collapsed');
    elements.emailInput.focus({ preventScroll: true });
  });

  elements.anonymousButton.addEventListener('click', () => runAuthAction(async () => {
    if (firebaseReady) {
      await loginAnonymously();
    } else {
      state.localGuest = makeLocalGuest();
      writeJsonPreference('dream-library-local-guest', state.localGuest);
      renderAuth();
      renderLobby();
    }
    updateScreen('lobby');
  }, '게스트 입장 완료. 게임 시작 화면으로 이동합니다.'));

  elements.googleButton.addEventListener('click', () => runAuthAction(async () => {
    await loginWithGoogle();
    updateScreen('lobby');
  }, 'Google 로그인 완료. 게임 시작 화면으로 이동합니다.'));

  elements.signoutButton.addEventListener('click', () => runAuthAction(async () => {
    if (firebaseReady && state.user) await logout();
    state.localGuest = null;
    writeJsonPreference('dream-library-local-guest', null);
    renderAuth();
    updateScreen('login');
  }, '로그아웃 완료.'));

  elements.emailForm.addEventListener('submit', (event) => {
    event.preventDefault();
    runAuthAction(async () => {
      await loginWithEmail(elements.emailInput.value, elements.passwordInput.value);
      updateScreen('lobby');
    }, '이메일 로그인 완료. 게임 시작 화면으로 이동합니다.');
  });

  elements.emailSignupButton.addEventListener('click', () => {
    runAuthAction(async () => {
      await signupWithEmail(elements.emailInput.value, elements.passwordInput.value);
      updateScreen('lobby');
    }, '새 계정을 만들었습니다. 게임 시작 화면으로 이동합니다.');
  });

  elements.enterLobbyButton.addEventListener('click', () => updateScreen('lobby'));
  elements.startSelectedButton.addEventListener('click', () => startGameFromLobby());
  elements.newGameButton.addEventListener('click', () => startGameFromLobby());
  elements.exitToLobbyButton.addEventListener('click', () => {
    state.locked = true;
    clearInterval(state.timerId);
    updateScreen('lobby');
  });
  elements.hintButton.addEventListener('click', showHint);
  elements.shuffleButton.addEventListener('click', shuffleBoard);
  elements.refreshLeaderboardButton.addEventListener('click', loadLeaderboard);

  elements.worldMap.addEventListener('click', (event) => {
    const button = event.target.closest('[data-stage-id]');
    if (!button) return;
    selectStage(button.dataset.stageId);
  });

  elements.nextStageButton.addEventListener('click', () => {
    closeRewardModal();
    const nextStage = getNextStage(state.selectedStageId);
    if (nextStage && isStageUnlocked(nextStage.id)) {
      selectStage(nextStage.id);
      startGameFromLobby();
    } else {
      updateScreen('lobby');
    }
  });

  elements.replayStageButton.addEventListener('click', () => {
    closeRewardModal();
    updateScreen('lobby');
  });

  elements.settingsFullscreenButton.addEventListener('click', async () => {
    const active = await requestGameFullscreen();
    setLoginStatus(active ? '전체화면 모드가 적용되었습니다.' : '브라우저 정책상 전체화면이 거부되었습니다. 홈 화면 추가 실행을 권장합니다.');
  });

  elements.soundToggle.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    writePreference('dream-library-sound', state.soundEnabled ? 'on' : 'off');
    renderSoundToggle();
    playPop();
  });

  elements.resetProgressButton.addEventListener('click', () => {
    state.discoveredTiles = new Set();
    state.localStats = { bestScore: 0, clearCount: 0 };
    state.selectedStageId = DEFAULT_STAGE_ID;
    state.difficultyKey = getStageById(DEFAULT_STAGE_ID).difficultyKey;
    state.campaignProgress = normalizeCampaignProgress(null);
    writeJsonPreference('dream-library-discovered-tiles', []);
    writeJsonPreference('dream-library-local-stats', state.localStats);
    writePreference('dream-library-selected-stage', state.selectedStageId);
    writePreference('dream-library-difficulty', state.difficultyKey);
    writeJsonPreference('dream-library-campaign-progress', state.campaignProgress);
    renderWorldMap();
    renderSelectedStage();
    renderAssetGallery();
    renderLocalStats();
    setLoginStatus('로컬 진행 기록을 초기화했습니다.');
  });

  elements.difficultyRow.addEventListener('click', (event) => {
    const button = event.target.closest('[data-difficulty]');
    if (!button) return;
    state.difficultyKey = button.dataset.difficulty;
    writePreference('dream-library-difficulty', state.difficultyKey);
    renderDifficultyButtons();
    renderSelectedStage();
    renderLobby();
  });
}

function updateScreen(nextScreen) {
  if (!['login', 'settings', 'lobby', 'game'].includes(nextScreen)) return;
  if (nextScreen === 'lobby' && !hasPlayableSession()) {
    setLoginStatus('먼저 게스트, 이메일, Google 중 하나로 입장하세요.');
    nextScreen = 'login';
  }
  if (nextScreen === 'game' && !hasPlayableSession()) {
    setLoginStatus('게임을 시작하려면 먼저 로그인 또는 게스트 입장이 필요합니다.');
    nextScreen = 'login';
  }

  state.previousScreen = state.screen;
  state.screen = nextScreen;
  elements.app.dataset.screen = nextScreen;
  document.body.dataset.screen = nextScreen;
  elements.screens.forEach((screen) => screen.classList.toggle('active', screen.id === `screen-${nextScreen}`));
  elements.backButton.classList.toggle('hidden', nextScreen === 'login');
  window.scrollTo({ top: 0, behavior: 'auto' });
  renderAuth();
  renderLobby();
}

function hasPlayableSession() {
  return Boolean(state.user || state.localGuest || !firebaseReady);
}

function makeLocalGuest() {
  const saved = state.localGuest;
  if (saved?.uid) return saved;
  return {
    uid: `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    displayName: '게스트 사서',
    isLocalGuest: true
  };
}

async function runAuthAction(action, successMessage) {
  setLoginStatus('처리 중입니다...');
  try {
    await action();
    setLoginStatus(successMessage || '처리 완료.');
    vibrate(16);
  } catch (error) {
    setLoginStatus(formatError(error));
    vibrate([18, 24, 18]);
  }
}

function startGameFromLobby() {
  requestGameFullscreen();
  updateScreen('game');
  startGame();
}

function startGame() {
  const stage = getStageById(state.selectedStageId);
  const difficulty = DIFFICULTIES[state.difficultyKey] || DIFFICULTIES[stage.difficultyKey];
  state.board = createBoard(difficulty);
  let guard = 0;
  while (!findHint(state.board) && guard < 30) {
    state.board = shuffleRemaining(state.board);
    guard += 1;
  }

  state.selected = null;
  state.moves = 0;
  state.combo = 0;
  state.comboMax = 0;
  state.score = 0;
  state.remainingSeconds = difficulty.timeLimitSeconds;
  state.hints = difficulty.hints;
  state.shuffles = difficulty.shuffles;
  state.startedAt = Date.now();
  state.locked = false;

  clearInterval(state.timerId);
  state.timerId = setInterval(tickTimer, 1000);
  elements.board.style.setProperty('--rows', difficulty.rows);
  elements.board.style.setProperty('--cols', difficulty.cols);
  elements.difficultyTitle.textContent = `${stage.number}. ${stage.title}`;
  const chapter = getChapterById(stage.chapterId);
  document.querySelector('#stage-label').textContent = `Chapter ${String(chapter.number).padStart(2, '0')} · ${difficulty.label}`;
  renderBoard();
  renderStats();
  setGameStatus(`${stage.title} 시작! 같은 기억 조각을 최대 두 번 꺾어 연결하세요.`);
  vibrate(20);
}

function tickTimer() {
  if (state.locked) return;
  state.remainingSeconds = Math.max(0, state.remainingSeconds - 1);
  renderStats();
  if (state.remainingSeconds === 0) {
    endGame(false);
  }
}

function renderBoard(highlight = []) {
  const highlightKeys = new Set(highlight.map((item) => `${item.row}:${item.col}`));
  elements.board.innerHTML = state.board
    .map((row, rowIndex) =>
      row
        .map((tile, colIndex) => {
          if (!tile) return '<div class="tile empty" aria-hidden="true"></div>';
          const isSelected = state.selected?.row === rowIndex && state.selected?.col === colIndex;
          const isHinted = highlightKeys.has(`${rowIndex}:${colIndex}`);
          return `
            <button
              class="tile ${isSelected ? 'selected' : ''} ${isHinted ? 'hinted' : ''}"
              data-row="${rowIndex}"
              data-col="${colIndex}"
              type="button"
              aria-label="${escapeHtml(tile.label)}"
            >
              <img src="${tile.asset}" alt="" draggable="false" loading="eager" />
              <span class="tile-fallback" aria-hidden="true">${tile.icon}</span>
            </button>
          `;
        })
        .join('')
    )
    .join('');

  elements.board.querySelectorAll('button.tile').forEach((button) => {
    button.addEventListener('click', onTileClick);
  });
}

function onTileClick(event) {
  if (state.locked) return;
  const button = event.currentTarget;
  const current = {
    row: Number(button.dataset.row),
    col: Number(button.dataset.col)
  };

  if (!state.selected) {
    state.selected = current;
    renderBoard();
    return;
  }

  if (state.selected.row === current.row && state.selected.col === current.col) {
    state.selected = null;
    renderBoard();
    return;
  }

  const firstTile = state.board[state.selected.row][state.selected.col];
  const secondTile = state.board[current.row][current.col];

  if (firstTile?.type === secondTile?.type && canConnect(state.board, state.selected, current)) {
    state.board = removePair(state.board, state.selected, current);
    rememberTile(firstTile.type);
    rememberTile(secondTile.type);
    state.selected = null;
    state.moves += 1;
    state.combo += 1;
    state.comboMax = Math.max(state.comboMax, state.combo);
    state.score += calculateMatchScore();
    playPop();
    vibrate(12);
    renderStats();
    renderAssetGallery();
    renderBoard();

    if (isCleared(state.board)) {
      endGame(true);
    } else if (!findHint(state.board)) {
      setGameStatus('연결 가능한 조각이 없습니다. 섞기를 사용하세요.');
    } else {
      setGameStatus(`${countRemaining(state.board)}개 남았습니다. 콤보 ${state.combo}!`);
    }
    return;
  }

  state.combo = 0;
  state.selected = current;
  renderStats();
  renderBoard();
  setGameStatus('연결할 수 없는 조각입니다. 같은 종류를 두 번 이하로 꺾어 연결하세요.');
  vibrate([18, 20, 18]);
}

function calculateMatchScore() {
  const difficulty = DIFFICULTIES[state.difficultyKey];
  const speedBonus = Math.max(0, Math.floor(state.remainingSeconds / 10));
  return Math.round((100 + state.combo * 25 + speedBonus) * difficulty.scoreMultiplier);
}

function showHint() {
  if (state.locked) return;
  if (state.hints <= 0) {
    setGameStatus('힌트를 모두 사용했습니다.');
    return;
  }

  const hint = findHint(state.board);
  if (!hint) {
    setGameStatus('현재 연결 가능한 조각이 없습니다. 섞기를 사용하세요.');
    return;
  }

  state.hints -= 1;
  state.combo = 0;
  renderStats();
  renderBoard(hint);
  setGameStatus(`힌트 사용. 남은 힌트 ${state.hints}개.`);
}

function shuffleBoard() {
  if (state.locked) return;
  if (state.shuffles <= 0) {
    setGameStatus('섞기를 모두 사용했습니다.');
    return;
  }

  state.board = shuffleRemaining(state.board);
  let guard = 0;
  while (!findHint(state.board) && guard < 30) {
    state.board = shuffleRemaining(state.board);
    guard += 1;
  }
  state.shuffles -= 1;
  state.combo = 0;
  state.score = Math.max(0, state.score - 100);
  state.selected = null;
  renderStats();
  renderBoard();
  setGameStatus(`보드를 섞었습니다. 남은 섞기 ${state.shuffles}개.`);
}

async function endGame(cleared) {
  state.locked = true;
  clearInterval(state.timerId);

  if (cleared) {
    const finalBonus = state.remainingSeconds * 10;
    state.score += finalBonus;
    state.localStats.bestScore = Math.max(state.localStats.bestScore || 0, state.score);
    state.localStats.clearCount = (state.localStats.clearCount || 0) + 1;
    const reward = completeSelectedStage();
    writeJsonPreference('dream-library-local-stats', state.localStats);
    renderLocalStats();
    renderWorldMap();
    renderSelectedStage();
    renderStats();
    setGameStatus(`복원 성공! 시간 보너스 ${finalBonus}점이 추가되었습니다.`);
    await saveScore(true);
    await loadLeaderboard();
    showRewardModal(reward, finalBonus);
  } else {
    setGameStatus('시간 종료. 새 게임으로 다시 도전하세요.');
    await saveScore(false);
  }
}

async function saveScore(cleared) {
  const stage = getStageById(state.selectedStageId);
  if (!firebaseReady || !db) {
    setGameStatus('게스트 플레이 기록은 기기에 저장됩니다. Firebase 설정 후 랭킹 저장이 활성화됩니다.');
    return;
  }

  if (!state.user) {
    setGameStatus('Firebase 로그인 계정으로 입장하면 리더보드에 기록을 저장할 수 있습니다.');
    return;
  }

  const timeSeconds = Math.round((Date.now() - state.startedAt) / 1000);
  try {
    await setDoc(
      doc(db, 'leaderboards', 'global', 'scores', state.user.uid),
      {
        uid: state.user.uid,
        displayName: getDisplayName(state.user),
        difficulty: state.difficultyKey,
        stageId: stage.id,
        stageNumber: stage.number,
        stars: state.campaignProgress.starsByStage?.[stage.id] || 0,
        score: Math.max(0, Math.round(state.score)),
        timeSeconds,
        moves: state.moves,
        comboMax: state.comboMax,
        cleared,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  } catch (error) {
    setGameStatus(`점수 저장 실패: ${formatError(error)}`);
  }
}

async function loadLeaderboard() {
  if (!firebaseReady || !db) {
    elements.leaderboardList.innerHTML = '<li class="empty-rank">Firebase Secrets 설정 후 온라인 랭킹이 활성화됩니다.</li>';
    return;
  }

  try {
    const scoresQuery = query(collection(db, 'leaderboards', 'global', 'scores'), orderBy('score', 'desc'), limit(10));
    const snapshot = await getDocs(scoresQuery);
    if (snapshot.empty) {
      elements.leaderboardList.innerHTML = '<li class="empty-rank">아직 기록이 없습니다.</li>';
      return;
    }

    elements.leaderboardList.innerHTML = snapshot.docs
      .map((scoreDoc, index) => {
        const data = scoreDoc.data();
        return `
          <li>
            <span class="rank">#${index + 1}</span>
            <strong>${escapeHtml(data.displayName ?? 'Guest')}</strong>
            <span>${data.stageNumber ? `Stage ${data.stageNumber} · ` : ''}${difficultyLabel(data.difficulty)} · ★ ${data.stars ?? 0} · ${data.moves ?? 0}수 · ${Number(data.score ?? 0).toLocaleString('ko-KR')}점</span>
          </li>
        `;
      })
      .join('');
  } catch {
    elements.leaderboardList.innerHTML = '<li class="empty-rank">리더보드를 불러오지 못했습니다.</li>';
  }
}


function selectStage(stageId) {
  const stage = getStageById(stageId);
  if (!isStageUnlocked(stage.id)) {
    const required = stage.unlockAfter ? getStageById(stage.unlockAfter) : null;
    setLoginStatus(required ? `${required.number}. ${required.title} 클리어 후 열립니다.` : '아직 잠긴 스테이지입니다.');
    vibrate([12, 18, 12]);
    return;
  }

  state.selectedStageId = stage.id;
  state.difficultyKey = stage.difficultyKey;
  writePreference('dream-library-selected-stage', state.selectedStageId);
  writePreference('dream-library-difficulty', state.difficultyKey);
  renderDifficultyButtons();
  renderWorldMap();
  renderSelectedStage();
}

function renderWorldMap() {
  const completed = new Set(state.campaignProgress.completedStageIds);
  const totalStars = getTotalStars();
  elements.stageProgressLabel.textContent = `${completed.size}/${STAGES.length} 클리어 · ★ ${totalStars}`;

  elements.worldMap.innerHTML = CHAPTERS.map((chapter) => {
    const stages = getChapterStages(chapter.id);
    const clearedInChapter = stages.filter((stage) => completed.has(stage.id)).length;
    return `
      <section class="chapter-map" style="--chapter-accent: ${chapter.accent}">
        <div class="chapter-map-head">
          <div>
            <p class="eyebrow">Chapter ${String(chapter.number).padStart(2, '0')}</p>
            <h4>${escapeHtml(chapter.shortTitle)}</h4>
          </div>
          <span>${clearedInChapter}/${stages.length}</span>
        </div>
        <div class="stage-path">
          ${stages.map((stage) => renderStageNode(stage)).join('')}
        </div>
      </section>
    `;
  }).join('');
}

function renderStageNode(stage) {
  const unlocked = isStageUnlocked(stage.id);
  const cleared = state.campaignProgress.completedStageIds.includes(stage.id);
  const active = state.selectedStageId === stage.id;
  const stars = state.campaignProgress.starsByStage[stage.id] || 0;
  const difficulty = DIFFICULTIES[stage.difficultyKey];
  return `
    <button
      class="stage-node ${active ? 'active' : ''} ${cleared ? 'cleared' : ''} ${unlocked ? 'unlocked' : 'locked'}"
      data-stage-id="${stage.id}"
      type="button"
      aria-label="${escapeHtml(stage.title)} ${unlocked ? '선택 가능' : '잠김'}"
      ${unlocked ? '' : 'aria-disabled="true"'}
    >
      <span class="stage-number">${stage.number}</span>
      <span class="stage-copy">
        <strong>${escapeHtml(stage.title)}</strong>
        <small>${difficulty.label} · ${difficulty.rows}×${difficulty.cols}</small>
      </span>
      <span class="stage-stars" aria-label="별 ${stars}개">${cleared ? '★'.repeat(Math.max(1, stars)) : unlocked ? '●' : '🔒'}</span>
    </button>
  `;
}

function renderSelectedStage() {
  const stage = getStageById(state.selectedStageId);
  const chapter = getChapterById(stage.chapterId);
  const difficulty = DIFFICULTIES[state.difficultyKey] || DIFFICULTIES[stage.difficultyKey];
  elements.selectedChapterName.textContent = chapter.title;
  elements.chapterStoryText.textContent = chapter.story;
  elements.selectedStageTitle.textContent = `${stage.number}. ${stage.title}`;
  elements.selectedStageSubtitle.textContent = stage.subtitle;
  elements.selectedStageMeta.textContent = `${difficulty.label} · ${difficulty.rows}×${difficulty.cols} · ${formatTime(difficulty.timeLimitSeconds)}`;
  elements.selectedStageReward.textContent = `${stage.reward.label} ×${stage.reward.amount}`;
  elements.startSelectedButton.disabled = !isStageUnlocked(stage.id);
  elements.startSelectedButton.textContent = isStageUnlocked(stage.id) ? '선택한 스테이지 시작' : '이전 스테이지 클리어 필요';
}

function isStageUnlocked(stageId) {
  return state.campaignProgress.unlockedStageIds.includes(stageId);
}

function completeSelectedStage() {
  const stage = getStageById(state.selectedStageId);
  const nextStage = getNextStage(stage.id);
  const stars = calculateStars();
  const progress = state.campaignProgress;
  const wasFirstClear = !progress.completedStageIds.includes(stage.id);

  if (wasFirstClear) progress.completedStageIds.push(stage.id);
  progress.starsByStage[stage.id] = Math.max(progress.starsByStage[stage.id] || 0, stars);
  progress.bestScoresByStage[stage.id] = Math.max(progress.bestScoresByStage[stage.id] || 0, state.score);

  if (nextStage && !progress.unlockedStageIds.includes(nextStage.id)) {
    progress.unlockedStageIds.push(nextStage.id);
  }

  if (stage.reward?.type) rememberTile(stage.reward.type);
  writeJsonPreference('dream-library-campaign-progress', progress);
  writeJsonPreference('dream-library-discovered-tiles', [...state.discoveredTiles]);

  return {
    stage,
    nextStage,
    stars,
    wasFirstClear,
    reward: stage.reward,
    totalStars: getTotalStars()
  };
}

function calculateStars() {
  const difficulty = DIFFICULTIES[state.difficultyKey];
  const timeRatio = difficulty.timeLimitSeconds > 0 ? state.remainingSeconds / difficulty.timeLimitSeconds : 0;
  if (timeRatio >= 0.42 && state.comboMax >= 5) return 3;
  if (timeRatio >= 0.22 || state.comboMax >= 3) return 2;
  return 1;
}

function getTotalStars() {
  return Object.values(state.campaignProgress.starsByStage || {}).reduce((sum, value) => sum + Number(value || 0), 0);
}

function showRewardModal(result, finalBonus) {
  if (!result) return;
  state.lastReward = result;
  elements.rewardTitle.textContent = `${result.stage.number}. ${result.stage.title} 복원 성공!`;
  elements.rewardMessage.textContent = result.nextStage
    ? `${result.nextStage.number}. ${result.nextStage.title} 스테이지가 열렸습니다.`
    : '현재 캠페인 끝까지 복원했습니다. 다음 챕터 업데이트를 준비하세요.';
  elements.rewardItems.innerHTML = `
    <span>★ ${result.stars} 획득</span>
    <span>${escapeHtml(result.reward.label)} ×${result.reward.amount}</span>
    <span>시간 보너스 ${Number(finalBonus).toLocaleString('ko-KR')}점</span>
  `;
  elements.nextStageButton.textContent = result.nextStage ? '다음 스테이지' : '로비로 이동';
  elements.rewardModal.classList.remove('hidden');
}

function closeRewardModal() {
  elements.rewardModal.classList.add('hidden');
}

function normalizeCampaignProgress(raw) {
  const firstId = DEFAULT_STAGE_ID;
  const progress = raw && typeof raw === 'object' ? raw : {};
  const unlocked = Array.isArray(progress.unlockedStageIds) ? progress.unlockedStageIds.filter((id) => STAGES.some((stage) => stage.id === id)) : [];
  if (!unlocked.includes(firstId)) unlocked.unshift(firstId);
  return {
    unlockedStageIds: [...new Set(unlocked)],
    completedStageIds: Array.isArray(progress.completedStageIds) ? [...new Set(progress.completedStageIds.filter((id) => STAGES.some((stage) => stage.id === id)))] : [],
    starsByStage: progress.starsByStage && typeof progress.starsByStage === 'object' ? progress.starsByStage : {},
    bestScoresByStage: progress.bestScoresByStage && typeof progress.bestScoresByStage === 'object' ? progress.bestScoresByStage : {}
  };
}

function renderDifficultyButtons() {
  elements.difficultyRow.innerHTML = Object.values(DIFFICULTIES)
    .map((difficulty) => {
      const active = difficulty.key === state.difficultyKey;
      return `
        <button class="difficulty-button ${active ? 'active' : ''}" data-difficulty="${difficulty.key}" type="button">
          <strong>${difficulty.label}</strong>
          <span>${difficulty.rows}×${difficulty.cols}</span>
          <small>${formatTime(difficulty.timeLimitSeconds)} · 힌트 ${difficulty.hints}</small>
        </button>
      `;
    })
    .join('');
}

function renderStats() {
  elements.timeLabel.textContent = formatTime(state.remainingSeconds);
  elements.scoreLabel.textContent = state.score.toLocaleString('ko-KR');
  elements.movesLabel.textContent = String(state.moves);
  elements.comboLabel.textContent = String(state.combo);
  elements.hintButton.textContent = `힌트 ${state.hints}`;
  elements.shuffleButton.textContent = `섞기 ${state.shuffles}`;
}

function renderAuth() {
  const profileName = getSessionName();
  const hasSession = hasPlayableSession();

  if (!firebaseReady && !state.localGuest) {
    elements.authName.textContent = 'Firebase 설정 필요';
    elements.authProvider.textContent = `누락: ${firebaseMissingKeys.join(', ')}`;
  } else if (!hasSession) {
    elements.authName.textContent = '로그인 전';
    elements.authProvider.textContent = '게스트, 이메일, Google 로그인을 지원합니다.';
  } else {
    elements.authName.textContent = profileName;
    elements.authProvider.textContent = state.user ? (state.user.isAnonymous ? '익명 Firebase 계정' : 'Firebase Auth 계정') : '로컬 게스트 계정';
  }

  elements.enterLobbyButton.classList.toggle('hidden', !hasSession);
  elements.signoutButton.classList.toggle('hidden', !hasSession || (!state.user && !state.localGuest));
  elements.settingsAccountText.textContent = hasSession
    ? `${profileName} 계정으로 입장 준비 완료.`
    : '아직 로그인하지 않았습니다. 게스트로 바로 시작하거나 Firebase 로그인을 사용하세요.';
}

function renderLobby() {
  const stage = getStageById(state.selectedStageId);
  const difficulty = DIFFICULTIES[state.difficultyKey] || DIFFICULTIES[stage.difficultyKey];
  elements.lobbyGreeting.textContent = `${getSessionName()}님, ${stage.number}. ${stage.title} 복원을 시작할 수 있습니다.`;
  elements.difficultyTitle.textContent = difficulty.label;
  renderWorldMap();
  renderSelectedStage();
  renderLocalStats();
}

function renderLocalStats() {
  elements.bestScoreLabel.textContent = Number(state.localStats.bestScore || 0).toLocaleString('ko-KR');
  elements.clearCountLabel.textContent = Number(state.localStats.clearCount || 0).toLocaleString('ko-KR');
  if (elements.starCountLabel) elements.starCountLabel.textContent = Number(getTotalStars()).toLocaleString('ko-KR');
}


function renderAssetGallery() {
  const unlockedCount = state.discoveredTiles.size;
  const text = `${unlockedCount}/${TILE_SET.length} 해금`;
  elements.assetProgress.textContent = text;
  elements.assetProgressGame.textContent = text;
  elements.assetGallery.innerHTML = TILE_SET.map((tile) => {
    const unlocked = state.discoveredTiles.has(tile.type);
    return `
      <figure class="asset-chip ${unlocked ? 'unlocked' : 'locked'}" title="${escapeHtml(tile.label)}">
        <img src="${tile.asset}" alt="${escapeHtml(tile.label)}" loading="lazy" draggable="false" />
        <figcaption>${unlocked ? escapeHtml(tile.label) : '미확인'}</figcaption>
      </figure>
    `;
  }).join('');
}

function renderSoundToggle() {
  elements.soundToggle.textContent = state.soundEnabled ? '효과음 켜짐' : '효과음 꺼짐';
  elements.soundToggle.classList.toggle('muted', !state.soundEnabled);
  elements.soundToggle.setAttribute('aria-pressed', String(state.soundEnabled));
}

function rememberTile(type) {
  if (!type || state.discoveredTiles.has(type)) return;
  state.discoveredTiles.add(type);
  writeJsonPreference('dream-library-discovered-tiles', [...state.discoveredTiles]);
}

function resetBoardPlaceholder() {
  const difficulty = DIFFICULTIES[state.difficultyKey];
  elements.board.style.setProperty('--rows', difficulty.rows);
  elements.board.style.setProperty('--cols', difficulty.cols);
  elements.board.innerHTML = Array.from({ length: difficulty.rows * difficulty.cols }, () => '<div class="tile placeholder"></div>').join('');
  renderStats();
}

function restorePreferences() {
  const savedStage = readPreference('dream-library-selected-stage');
  if (savedStage && STAGES.some((stage) => stage.id === savedStage) && isStageUnlocked(savedStage)) {
    state.selectedStageId = savedStage;
  }
  const selectedStage = getStageById(state.selectedStageId);
  const savedDifficulty = readPreference('dream-library-difficulty');
  state.difficultyKey = savedDifficulty && DIFFICULTIES[savedDifficulty] ? savedDifficulty : selectedStage.difficultyKey;
  renderSoundToggle();
}

function getSessionName() {
  if (state.user) return getDisplayName(state.user);
  if (state.localGuest?.displayName) return state.localGuest.displayName;
  if (!firebaseReady) return '게스트 사서';
  return '게스트 사서';
}

function difficultyLabel(key) {
  return DIFFICULTIES[key]?.label ?? key ?? '-';
}

function setLoginStatus(message) {
  elements.loginStatus.textContent = message;
}

function setGameStatus(message) {
  elements.statusLabel.textContent = message;
}

function setGlobalStatus(message) {
  if (state.screen === 'game') setGameStatus(message);
  else setLoginStatus(message);
}

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

function formatError(error) {
  if (error?.code === 'firebase/missing-config') {
    return 'Firebase 환경변수 설정이 필요합니다. 게스트 플레이는 가능합니다.';
  }
  const code = error?.code?.replace('auth/', '').replaceAll('-', ' ');
  return code ? `오류: ${code}` : '처리 중 오류가 발생했습니다.';
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => {
    const replacements = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    };
    return replacements[char];
  });
}

function vibrate(pattern) {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

function playPop() {
  if (!state.soundEnabled) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = 720 + state.combo * 20;
  gain.gain.setValueAtTime(0.035, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.08);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.08);
}

function applyAssetBackgrounds() {
  const base = import.meta.env.BASE_URL;
  document.documentElement.style.setProperty('--dream-bg-login', `url('${base}assets/backgrounds/storybook-login.svg') center/cover fixed`);
  document.documentElement.style.setProperty('--dream-bg-lobby', `url('${base}assets/backgrounds/world-map.svg') center/cover fixed, url('${base}assets/backgrounds/lobby-garden.svg') center/cover fixed`);
  document.documentElement.style.setProperty('--dream-bg-game', `url('${base}assets/backgrounds/library-hall.svg') center/cover fixed`);
  document.documentElement.style.setProperty('--dream-bg-mist', `url('${base}assets/backgrounds/memory-mist.svg') center/cover fixed`);
}

function preloadAssets(urls) {
  urls.forEach((url) => {
    const image = new Image();
    image.decoding = 'async';
    image.src = url;
  });
}

function readPreference(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writePreference(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Preferences are optional.
  }
}

function readJsonPreference(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJsonPreference(key, value) {
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Preferences are optional.
  }
}
