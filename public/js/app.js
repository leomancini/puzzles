import { getUsername, setUsername } from './storage.js';
import { createTimer } from './timer.js';
import { NumPuz } from './games/numpuz.js';
import { MemMatch } from './games/memory.js';
import { LightsOut } from './games/lights.js';

// DOM references
const screens = {
  username: document.getElementById('screen-username'),
  select: document.getElementById('screen-select'),
  game: document.getElementById('screen-game'),
  leaderboard: document.getElementById('screen-leaderboard'),
};

const usernameLoader = document.getElementById('username-loader');
const usernameHeader = document.getElementById('username-header');
const usernameForm = document.getElementById('username-form');
const usernameInput = document.getElementById('username-input');
const usernameSubmit = document.getElementById('username-submit');
const btnBackUsername = document.getElementById('btn-back-username');
const displayName = document.getElementById('display-name');
const gameContainer = document.getElementById('game-container');
const gameStatsEl = document.getElementById('game-stats');
const winOverlay = document.getElementById('win-overlay');
const winTime = document.getElementById('win-time');
const winMoves = document.getElementById('win-moves');
const winRank = document.getElementById('win-rank');
const leaderboardSpinner = document.getElementById('leaderboard-spinner');
const leaderboardList = document.getElementById('leaderboard-list');
const leaderboardEmpty = document.getElementById('leaderboard-empty');

let currentGame = null;
let currentGameId = null;
let currentMoves = 0;

function updateStats(time) {
  const label = currentMoves === 1 ? 'move' : 'moves';
  gameStatsEl.textContent = `${currentMoves} ${label} · ${time}`;
}

const timer = createTimer((time) => updateStats(time));

// --- Screen Navigation ---
const screenPaths = {
  username: '/profile',
  select: '/',
  game: '/play',
  leaderboard: '/leaderboard',
};

function showScreen(name, { push = true, back = false } = {}) {
  const current = document.querySelector('.screen.active');
  const target = screens[name];

  if (current && current !== target) {
    const hasTransitions = !document.body.classList.contains('no-transition');
    if (!back && hasTransitions) {
      current.classList.add('exit-left');
      current.addEventListener('transitionend', function cleanup(e) {
        if (e.propertyName !== 'opacity') return;
        current.removeEventListener('transitionend', cleanup);
        current.classList.remove('exit-left');
      });
    }
  }

  Object.values(screens).forEach(s => {
    if (s !== target) s.classList.remove('active');
  });

  if (back) {
    target.style.transition = 'none';
    target.style.transform = 'translateX(-30px)';
    target.classList.add('active');
    void target.offsetWidth;
    target.style.removeProperty('transition');
    target.style.removeProperty('transform');
  } else {
    const hasTransitions = !document.body.classList.contains('no-transition');
    if (hasTransitions) {
      target.classList.add('enter-right');
      target.classList.add('active');
      requestAnimationFrame(() => {
        target.classList.remove('enter-right');
      });
    } else {
      target.classList.add('active');
    }
  }

  document.body.classList.toggle('lock-scroll', name !== 'select');
  window.scrollTo(0, 0);

  if (push) {
    const path = screenPaths[name] || '/';
    history.pushState({ screen: name, gameId: currentGameId }, '', path);
  }
  requestAnimationFrame(() => {
    document.body.classList.remove('no-transition');
  });
}

window.addEventListener('popstate', (e) => {
  const state = e.state;
  if (!state) {
    showScreen('select', { push: false, back: true });
    return;
  }
  if (state.screen === 'game' && state.gameId) {
    startGame(state.gameId, { push: false, back: true });
  } else if (state.screen === 'username') {
    showUsernameScreen(state.canGoBack !== false, { push: false, back: true });
  } else if (state.screen === 'leaderboard') {
    showScreen('leaderboard', { push: false, back: true });
    loadLeaderboard(currentGameId || 'numpuz');
  } else {
    showScreen(state.screen, { push: false, back: true });
  }
});

// --- Enable :active states on iOS ---
document.addEventListener('touchstart', () => {}, { passive: true });


// --- Username Screen ---
const usernameTitle = document.getElementById('username-title');

function showUsernameScreen(canGoBack, { push = true, back = false } = {}) {
  usernameLoader.style.display = 'none';
  usernameHeader.style.display = '';
  usernameForm.style.display = '';
  btnBackUsername.style.visibility = canGoBack ? 'visible' : 'hidden';
  usernameTitle.textContent = canGoBack ? 'Profile' : 'Create profile';
  usernameSubmit.textContent = canGoBack ? 'Save' : 'Start';
  usernameInput.value = canGoBack ? (getUsername() || '') : '';
  usernameSubmit.disabled = usernameInput.value.trim().length === 0;

  const path = canGoBack ? '/profile' : '/create-profile';
  showScreen('username', { push: false, back });
  if (push) {
    history.pushState({ screen: 'username', canGoBack }, '', path);
  }
}

usernameInput.addEventListener('input', () => {
  usernameSubmit.disabled = usernameInput.value.trim().length === 0;
});

usernameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && usernameInput.value.trim()) {
    submitUsername();
  }
});

usernameSubmit.addEventListener('click', submitUsername);

function submitUsername() {
  const name = usernameInput.value.trim();
  if (!name) return;
  setUsername(name);
  displayName.textContent = name;

  const isNewProfile = !btnBackUsername.style.visibility || btnBackUsername.style.visibility === 'hidden';
  if (isNewProfile) {
    fadeToScreen('select');
  } else {
    showScreen('select', { back: true });
  }
}

function fadeToScreen(name) {
  const current = document.querySelector('.screen.active');
  const target = screens[name];

  current.classList.add('fade-only');
  target.classList.add('fade-only');

  // Fade out current screen
  current.classList.remove('active');

  current.addEventListener('transitionend', function onFadeOut(e) {
    if (e.propertyName !== 'opacity') return;
    current.removeEventListener('transitionend', onFadeOut);

    // Fade in target screen
    target.classList.add('active');
    const path = screenPaths[name] || '/';
    history.pushState({ screen: name, gameId: currentGameId }, '', path);

    target.addEventListener('transitionend', function onFadeIn(e) {
      if (e.propertyName !== 'opacity') return;
      target.removeEventListener('transitionend', onFadeIn);
      current.classList.remove('fade-only');
      target.classList.remove('fade-only');
    });
  });
}

// --- Game Selection ---
document.querySelectorAll('.game-card').forEach(card => {
  card.addEventListener('click', () => {
    const gameId = card.dataset.game;
    startGame(gameId);
  });
});

// --- Game Lifecycle ---
function startGame(gameId, { push = true, back = false } = {}) {
  currentGameId = gameId;
  const gameNames = { numpuz: 'Sliding Numbers', lights: 'Lights Out', memory: 'Memory Cards' };
  document.getElementById('game-title').textContent = gameNames[gameId] || gameId;
  showScreen('game', { push: false, back });
  if (push) {
    history.pushState({ screen: 'game', gameId }, '', `/play/${gameId}`);
  }

  const callbacks = {
    onMove: (moveCount) => {
      currentMoves = moveCount;
      updateStats(timer.getFormatted());
    },
    onFirstMove: () => {
      timer.start();
    },
    onSolve: (moveCount) => {
      timer.stop();
      showWin(timer.getFormatted(), timer.getElapsed(), moveCount);
    },
  };

  if (gameId === 'numpuz') {
    currentGame = new NumPuz(gameContainer, callbacks);
  } else if (gameId === 'lights') {
    currentGame = new LightsOut(gameContainer, callbacks);
  } else if (gameId === 'memory') {
    currentGame = new MemMatch(gameContainer, callbacks);
  }

  if (currentGame) {
    currentGame.init();
    currentMoves = 0;
    timer.reset();
  }
}

async function showWin(time, timeMs, moves) {
  winTime.textContent = `Time: ${time}`;
  winMoves.textContent = `Moves: ${moves}`;
  winRank.textContent = 'Loading rank...';
  winOverlay.classList.remove('hidden');

  // Submit score to server
  try {
    const res = await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: getUsername(),
        game: currentGameId,
        moves,
        timeMs,
        time,
      }),
    });
    const data = await res.json();
    if (data.rank) {
      winRank.textContent = `Rank #${data.rank} of ${data.total}`;
    }
  } catch {
    // Silently fail if offline
  }
}

// --- Win Overlay ---
document.getElementById('btn-play-again').addEventListener('click', () => {
  winOverlay.classList.add('hidden');
  if (currentGame) {
    currentGame.init();
    currentMoves = 0;
    updateStats('0:00');
    timer.reset();
  }
});

document.getElementById('btn-back-to-menu').addEventListener('click', () => {
  winOverlay.classList.add('hidden');
  timer.reset();
  showScreen('select', { back: true });
});

// --- Leaderboard ---
document.getElementById('btn-leaderboard').addEventListener('click', () => {
  showScreen('leaderboard');
  loadLeaderboard(currentGameId || 'numpuz');
});

document.getElementById('btn-back-leaderboard').addEventListener('click', () => {
  showScreen('select', { back: true });
});

async function loadLeaderboard(game) {
  leaderboardList.innerHTML = '';
  leaderboardEmpty.style.display = 'none';
  leaderboardSpinner.style.display = '';

  try {
    const res = await fetch(`/api/scores/${game}`);
    const scores = await res.json();
    leaderboardSpinner.style.display = 'none';

    if (scores.length === 0) {
      leaderboardEmpty.style.display = '';
      return;
    }

    const currentUser = getUsername();

    // Header row
    const header = document.createElement('div');
    header.className = 'lb-header';
    header.innerHTML = '<span>#</span><span>Name</span><span class="lb-moves">Moves</span><span class="lb-time">Time</span>';
    leaderboardList.appendChild(header);

    scores.forEach((score, i) => {
      const row = document.createElement('div');
      row.className = 'lb-row' + (score.username === currentUser ? ' lb-me' : '');
      row.innerHTML =
        `<span class="lb-rank">${i + 1}</span>` +
        `<span class="lb-name">${escapeHtml(score.username)}</span>` +
        `<span class="lb-moves">${score.moves}</span>` +
        `<span class="lb-time">${score.time}</span>`;
      leaderboardList.appendChild(row);
    });
  } catch {
    leaderboardSpinner.style.display = 'none';
    leaderboardEmpty.textContent = 'Could not load scores';
    leaderboardEmpty.style.display = '';
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// --- Navigation ---
document.getElementById('btn-back').addEventListener('click', () => {
  timer.stop();
  timer.reset();
  showScreen('select', { back: true });
});

document.getElementById('btn-new-game').addEventListener('click', () => {
  if (currentGame) {
    currentGame.init();
    currentMoves = 0;
    updateStats('0:00');
    timer.reset();
  }
});

document.getElementById('change-name').addEventListener('click', () => {
  showUsernameScreen(true);
});

btnBackUsername.addEventListener('click', () => {
  showScreen('select', { back: true });
});

// --- Init ---
(function init() {
  const saved = getUsername();
  if (!saved) {
    showUsernameScreen(false, { push: false });
    history.replaceState({ screen: 'username', canGoBack: false }, '', '/create-profile');
    return;
  }

  displayName.textContent = saved;
  const path = window.location.pathname;

  if (path.startsWith('/play/')) {
    const gameId = path.split('/')[2];
    startGame(gameId, { push: false });
    history.replaceState({ screen: 'game', gameId }, '', path);
  } else if (path === '/leaderboard') {
    showScreen('leaderboard', { push: false });
    loadLeaderboard(currentGameId || 'numpuz');
    history.replaceState({ screen: 'leaderboard' }, '', path);
  } else if (path === '/profile') {
    showUsernameScreen(true, { push: false });
    history.replaceState({ screen: 'username', canGoBack: true }, '', path);
  } else if (path === '/create-profile') {
    showUsernameScreen(false, { push: false });
    history.replaceState({ screen: 'username', canGoBack: false }, '', path);
  } else {
    showScreen('select', { push: false });
    history.replaceState({ screen: 'select' }, '', '/');
  }
})();
