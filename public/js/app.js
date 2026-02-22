import { getUsername, setUsername } from './storage.js';
import { createTimer } from './timer.js';
import { NumPuz } from './games/numpuz.js';

// DOM references
const screens = {
  username: document.getElementById('screen-username'),
  select: document.getElementById('screen-select'),
  game: document.getElementById('screen-game'),
};

const usernameLoader = document.getElementById('username-loader');
const usernameForm = document.getElementById('username-form');
const usernameInput = document.getElementById('username-input');
const usernameSubmit = document.getElementById('username-submit');
const displayName = document.getElementById('display-name');
const gameContainer = document.getElementById('game-container');
const timerEl = document.getElementById('timer');
const moveCounterEl = document.getElementById('move-counter');
const winOverlay = document.getElementById('win-overlay');
const winTime = document.getElementById('win-time');
const winMoves = document.getElementById('win-moves');

let currentGame = null;
const timer = createTimer(timerEl);

// --- Screen Navigation ---
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

// --- Username Screen ---
// Prevent iOS from panning the viewport when focusing the input
usernameInput.addEventListener('focus', () => {
  setTimeout(() => window.scrollTo(0, 0), 50);
});

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
  document.getElementById('game-title').textContent =
    gameId === 'numpuz' ? 'NumPuz' : gameId;
  showScreen('game');

  if (gameId === 'numpuz') {
    currentGame = new NumPuz(gameContainer, {
      onMove: (moveCount) => {
        moveCounterEl.textContent = `Moves: ${moveCount}`;
      },
      onFirstMove: () => {
        timer.start();
      },
      onSolve: (moveCount) => {
        timer.stop();
        showWin(timer.getFormatted(), moveCount);
      },
    });
    currentGame.init();
    moveCounterEl.textContent = 'Moves: 0';
    timer.reset();
  }
}

function showWin(time, moves) {
  winTime.textContent = `Time: ${time}`;
  winMoves.textContent = `Moves: ${moves}`;
  winOverlay.classList.remove('hidden');
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
  usernameLoader.style.display = 'none';
  usernameForm.style.display = '';
  usernameInput.value = getUsername() || '';
  showScreen('username');
  usernameInput.focus();
});

// --- Init ---
(function init() {
  const saved = getUsername();
  if (saved) {
    displayName.textContent = saved;
    showScreen('select');
  } else {
    usernameLoader.style.display = 'none';
    usernameForm.style.display = '';
    showScreen('username');
  }
})();
