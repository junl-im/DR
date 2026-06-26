import { collection, doc, getDocs, limit, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import './styles.css';
import { db } from './firebase.js';
import {
  getDisplayName,
  loginAnonymously,
  loginWithEmail,
  loginWithGoogle,
  logout,
  observeAuth,
  signupWithEmail
} from './auth.js';
import { DIFFICULTIES } from './game/difficulty.js';
import { canConnect, countRemaining, createBoard, findHint, isCleared, removePair, shuffleRemaining } from './game/shisen.js';

const elements = {
  board: document.querySelector('#board'),
  difficultyRow: document.querySelector('#difficulty-row'),
  timeLabel: document.querySelector('#time-label'),
  scoreLabel: document.querySelector('#score-label'),
  movesLabel: document.querySelector('#moves-label'),
  comboLabel: document.querySelector('#combo-label'),
  statusLabel: document.querySelector('#status-label'),
  newGameButton: document.querySelector('#new-game-button'),
  hintButton: document.querySelector('#hint-button'),
  shuffleButton: document.querySelector('#shuffle-button'),
  anonymousButton: document.querySelector('#anonymous-button'),
  googleButton: document.querySelector('#google-button'),
  signoutButton: document.querySelector('#signout-button'),
  emailForm: document.querySelector('#email-form'),
  emailInput: document.querySelector('#email-input'),
  passwordInput: document.querySelector('#password-input'),
  emailSignupButton: document.querySelector('#email-signup-button'),
  authName: document.querySelector('#auth-name'),
  authProvider: document.querySelector('#auth-provider'),
  leaderboardList: document.querySelector('#leaderboard-list'),
  refreshLeaderboardButton: document.querySelector('#refresh-leaderboard-button'),
  soundToggle: document.querySelector('#sound-toggle')
};

const state = {
  user: null,
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
  soundEnabled: true
};

init();

function init() {
  renderDifficultyButtons();
  bindEvents();
  observeAuth((user) => {
    state.user = user;
    renderAuth();
    loadLeaderboard();
  });
  resetBoardPlaceholder();
  loadLeaderboard();
}

function renderDifficultyButtons() {
  elements.difficultyRow.innerHTML = Object.values(DIFFICULTIES)
    .map(
      (difficulty) => `
        <button class="difficulty-button ${difficulty.key === state.difficultyKey ? 'active' : ''}" data-difficulty="${difficulty.key}" type="button">
          <strong>${difficulty.label}</strong>
          <span>${difficulty.rows}×${difficulty.cols}</span>
        </button>
      `
    )
    .join('');
}

function bindEvents() {
  elements.difficultyRow.addEventListener('click', (event) => {
    const button = event.target.closest('[data-difficulty]');
    if (!button) return;
    state.difficultyKey = button.dataset.difficulty;
    renderDifficultyButtons();
    startGame();
  });

  elements.newGameButton.addEventListener('click', startGame);
  elements.hintButton.addEventListener('click', showHint);
  elements.shuffleButton.addEventListener('click', shuffleBoard);
  elements.refreshLeaderboardButton.addEventListener('click', loadLeaderboard);
  elements.soundToggle.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    elements.soundToggle.classList.toggle('muted', !state.soundEnabled);
  });

  elements.anonymousButton.addEventListener('click', () => runAuthAction(loginAnonymously));
  elements.googleButton.addEventListener('click', () => runAuthAction(loginWithGoogle));
  elements.signoutButton.addEventListener('click', () => runAuthAction(logout));

  elements.emailForm.addEventListener('submit', (event) => {
    event.preventDefault();
    runAuthAction(() => loginWithEmail(elements.emailInput.value, elements.passwordInput.value));
  });

  elements.emailSignupButton.addEventListener('click', () => {
    runAuthAction(() => signupWithEmail(elements.emailInput.value, elements.passwordInput.value));
  });
}

async function runAuthAction(action) {
  try {
    await action();
    setStatus('인증 완료. 기록 저장이 가능합니다.');
  } catch (error) {
    setStatus(formatError(error));
  }
}

function startGame() {
  const difficulty = DIFFICULTIES[state.difficultyKey];
  state.board = createBoard(difficulty);
  let guard = 0;
  while (!findHint(state.board) && guard < 20) {
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
  renderBoard();
  renderStats();
  setStatus(`${difficulty.label} 난이도 시작! 같은 기억 조각을 3개 이하 직선으로 연결하세요.`);
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
              aria-label="${tile.label}"
            >
              <span>${tile.icon}</span>
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
    state.selected = null;
    state.moves += 1;
    state.combo += 1;
    state.comboMax = Math.max(state.comboMax, state.combo);
    state.score += calculateMatchScore();
    playPop();
    renderStats();
    renderBoard();

    if (isCleared(state.board)) {
      endGame(true);
    } else if (!findHint(state.board)) {
      setStatus('연결 가능한 조각이 없습니다. 섞기를 사용하세요.');
    } else {
      setStatus(`${countRemaining(state.board)}개 남았습니다. 콤보 ${state.combo}!`);
    }
    return;
  }

  state.combo = 0;
  state.selected = current;
  renderStats();
  renderBoard();
  setStatus('연결할 수 없는 조각입니다. 같은 종류를 두 번 이하로 꺾어 연결하세요.');
}

function calculateMatchScore() {
  const difficulty = DIFFICULTIES[state.difficultyKey];
  const speedBonus = Math.max(0, Math.floor(state.remainingSeconds / 10));
  return Math.round((100 + state.combo * 25 + speedBonus) * difficulty.scoreMultiplier);
}

function showHint() {
  if (state.locked) return;
  if (state.hints <= 0) {
    setStatus('힌트를 모두 사용했습니다.');
    return;
  }

  const hint = findHint(state.board);
  if (!hint) {
    setStatus('현재 연결 가능한 조각이 없습니다. 섞기를 사용하세요.');
    return;
  }

  state.hints -= 1;
  state.combo = 0;
  renderStats();
  renderBoard(hint);
  setStatus(`힌트 사용. 남은 힌트 ${state.hints}개.`);
}

function shuffleBoard() {
  if (state.locked) return;
  if (state.shuffles <= 0) {
    setStatus('섞기를 모두 사용했습니다.');
    return;
  }

  state.board = shuffleRemaining(state.board);
  let guard = 0;
  while (!findHint(state.board) && guard < 20) {
    state.board = shuffleRemaining(state.board);
    guard += 1;
  }
  state.shuffles -= 1;
  state.combo = 0;
  state.score = Math.max(0, state.score - 100);
  state.selected = null;
  renderStats();
  renderBoard();
  setStatus(`보드를 섞었습니다. 남은 섞기 ${state.shuffles}개.`);
}

async function endGame(cleared) {
  state.locked = true;
  clearInterval(state.timerId);

  if (cleared) {
    const finalBonus = state.remainingSeconds * 10;
    state.score += finalBonus;
    renderStats();
    setStatus(`복원 성공! 시간 보너스 ${finalBonus}점이 추가되었습니다.`);
    await saveScore(true);
    await loadLeaderboard();
  } else {
    setStatus('시간 종료. 새 게임으로 다시 도전하세요.');
    await saveScore(false);
  }
}

async function saveScore(cleared) {
  if (!state.user) {
    setStatus('로그인하면 리더보드에 기록을 저장할 수 있습니다.');
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
    setStatus(`점수 저장 실패: ${formatError(error)}`);
  }
}

async function loadLeaderboard() {
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
            <span>${data.difficulty ?? '-'} · ${data.moves ?? 0}수 · ${data.score ?? 0}점</span>
          </li>
        `;
      })
      .join('');
  } catch (error) {
    elements.leaderboardList.innerHTML = '<li class="empty-rank">리더보드를 불러오지 못했습니다.</li>';
  }
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
  if (!state.user) {
    elements.authName.textContent = '로그인 전';
    elements.authProvider.textContent = '익명, 이메일, Google 로그인을 지원합니다.';
    elements.signoutButton.classList.add('hidden');
    elements.anonymousButton.classList.remove('hidden');
    elements.googleButton.classList.remove('hidden');
    elements.emailForm.classList.remove('hidden');
    return;
  }

  elements.authName.textContent = getDisplayName(state.user);
  elements.authProvider.textContent = state.user.isAnonymous ? '익명 계정' : 'Firebase Auth 계정';
  elements.signoutButton.classList.remove('hidden');
  elements.anonymousButton.classList.add('hidden');
  elements.googleButton.classList.add('hidden');
  elements.emailForm.classList.add('hidden');
}

function resetBoardPlaceholder() {
  const difficulty = DIFFICULTIES[state.difficultyKey];
  elements.board.style.setProperty('--rows', difficulty.rows);
  elements.board.style.setProperty('--cols', difficulty.cols);
  elements.board.innerHTML = Array.from({ length: difficulty.rows * difficulty.cols }, () => '<div class="tile placeholder"></div>').join('');
  renderStats();
}

function setStatus(message) {
  elements.statusLabel.textContent = message;
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

function formatError(error) {
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

function playPop() {
  if (!state.soundEnabled || !window.AudioContext) return;
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = 720 + state.combo * 20;
  gain.gain.setValueAtTime(0.03, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.08);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.08);
}
