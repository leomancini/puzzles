import { getUsername, setUsername } from './storage.js';
import { createTimer } from './timer.js';
import { NumPuz } from './games/numpuz.js';
import { MemMatch } from './games/memory.js';

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
const timerEl = document.getElementById('timer');
const moveCounterEl = document.getElementById('move-counter');
const winOverlay = document.getElementById('win-overlay');
const winTime = document.getElementById('win-time');
const winMoves = document.getElementById('win-moves');
const winRank = document.getElementById('win-rank');
const leaderboardSpinner = document.getElementById('leaderboard-spinner');
const leaderboardList = document.getElementById('leaderboard-list');
const leaderboardEmpty = document.getElementById('leaderboard-empty');

let currentGame = null;
let currentGameId = null;
const timer = createTimer(timerEl);

// --- Screen Navigation ---
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

// --- Enable :active states on iOS ---
document.addEventListener('touchstart', () => {}, { passive: true });

// --- Prevent iOS visual viewport panning ---
if (window.visualViewport) {
  window.visualViewport.addEventListener('scroll', () => {
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
  });
}

// --- Username Screen ---
function showUsernameScreen(canGoBack) {
  usernameLoader.style.display = 'none';
  usernameHeader.style.display = '';
  usernameForm.style.display = '';
  btnBackUsername.style.visibility = canGoBack ? 'visible' : 'hidden';
  usernameInput.value = canGoBack ? (getUsername() || '') : '';
  usernameSubmit.disabled = usernameInput.value.trim().length === 0;
  showScreen('username');
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
  showScreen('select');
}

// --- Game Selection ---
document.querySelectorAll('.game-card').forEach(card => {
  card.addEventListener('click', () => {
    const gameId = card.dataset.game;
    startGame(gameId);
  });
});

// --- Game Lifecycle ---
function startGame(gameId) {
  currentGameId = gameId;
  const gameNames = { numpuz: 'NumPuz', memory: 'MemMatch' };
  document.getElementById('game-title').textContent = gameNames[gameId] || gameId;
  showScreen('game');

  const callbacks = {
    onMove: (moveCount) => {
      moveCounterEl.textContent = `Moves: ${moveCount}`;
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
  } else if (gameId === 'memory') {
    currentGame = new MemMatch(gameContainer, callbacks);
  }

  if (currentGame) {
    currentGame.init();
    moveCounterEl.textContent = 'Moves: 0';
    timer.reset();
  }
}

async function showWin(time, timeMs, moves) {
  winTime.textContent = `Time: ${time}`;
  winMoves.textContent = `Moves: ${moves}`;
  winRank.textContent = '';
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
    moveCounterEl.textContent = 'Moves: 0';
    timer.reset();
  }
});

document.getElementById('btn-back-to-menu').addEventListener('click', () => {
  winOverlay.classList.add('hidden');
  timer.reset();
  showScreen('select');
});

// --- Leaderboard ---
document.getElementById('btn-leaderboard').addEventListener('click', () => {
  showScreen('leaderboard');
  loadLeaderboard(currentGameId || 'numpuz');
});

document.getElementById('btn-back-leaderboard').addEventListener('click', () => {
  showScreen('select');
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
  showScreen('select');
});

document.getElementById('btn-new-game').addEventListener('click', () => {
  if (currentGame) {
    currentGame.init();
    moveCounterEl.textContent = 'Moves: 0';
    timer.reset();
  }
});

document.getElementById('change-name').addEventListener('click', () => {
  showUsernameScreen(true);
});

btnBackUsername.addEventListener('click', () => {
  showScreen('select');
});

// --- Init ---
(function init() {
  const saved = getUsername();
  if (saved) {
    displayName.textContent = saved;
    showScreen('select');
  } else {
    showUsernameScreen(false);
  }
})();
