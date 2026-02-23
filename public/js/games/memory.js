const GRID_SIZE = 4;
const TOTAL_CARDS = GRID_SIZE * GRID_SIZE;
const PAIR_COUNT = TOTAL_CARDS / 2;

const EMOJI_SETS = [
  ['🐶', '🐱', '🐸', '🦊', '🐻', '🐼', '🐨', '🐯'],
  ['🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '🍑', '🥝'],
  ['⚽', '🏀', '🎾', '🏐', '🎱', '🏓', '🥊', '🎯'],
  ['🚀', '✈️', '🚁', '⛵', '🚂', '🏎️', '🚲', '🛸'],
  ['🌸', '🌻', '🌺', '🌷', '🌹', '🍀', '🌵', '🌴'],
  ['🎸', '🎹', '🥁', '🎺', '🎻', '🪗', '🎤', '🎧'],
  ['🦋', '🐝', '🐞', '🐢', '🐙', '🦀', '🐠', '🦜'],
  ['🍕', '🍔', '🌮', '🍣', '🍩', '🧁', '🍦', '🥐'],
];

export class MemMatch {
  constructor(container, callbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.cards = [];
    this.flipped = [];
    this.matched = new Set();
    this.moves = 0;
    this.firstMoveMade = false;
    this.locked = false;
    this.solved = false;
    this.cardElements = [];
  }

  init() {
    this.symbols = EMOJI_SETS[Math.floor(Math.random() * EMOJI_SETS.length)];
    this.cards = this.generateBoard();
    this.flipped = [];
    this.matched = new Set();
    this.moves = 0;
    this.firstMoveMade = false;
    this.locked = false;
    this.solved = false;
    this.render();
  }

  generateBoard() {
    const pairs = [];
    for (let i = 0; i < PAIR_COUNT; i++) {
      pairs.push(i, i);
    }
    return this.shuffle(pairs);
  }

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  flipCard(index) {
    if (this.locked || this.solved) return;
    if (this.flipped.includes(index)) return;
    if (this.matched.has(index)) return;

    if (!this.firstMoveMade) {
      this.firstMoveMade = true;
      this.callbacks.onFirstMove();
    }

    this.flipped.push(index);
    this.cardElements[index].classList.add('flipped');

    if (this.flipped.length === 2) {
      this.moves++;
      this.callbacks.onMove(this.moves);
      this.checkMatch();
    }
  }

  checkMatch() {
    const [a, b] = this.flipped;

    if (this.cards[a] === this.cards[b]) {
      this.matched.add(a);
      this.matched.add(b);
      this.cardElements[a].classList.add('matched');
      this.cardElements[b].classList.add('matched');
      this.flipped = [];

      if (this.matched.size === TOTAL_CARDS) {
        this.solved = true;
        setTimeout(() => {
          this.playSolvedAnimation();
          this.callbacks.onSolve(this.moves);
        }, 300);
      }
    } else {
      this.locked = true;
      setTimeout(() => {
        this.cardElements[a].classList.remove('flipped');
        this.cardElements[b].classList.remove('flipped');
        this.flipped = [];
        this.locked = false;
      }, 700);
    }
  }

  render() {
    this.container.innerHTML = '';
    this.cardElements = [];

    const boardEl = document.createElement('div');
    boardEl.className = 'memory-board';

    for (let i = 0; i < TOTAL_CARDS; i++) {
      const card = document.createElement('button');
      card.className = 'memory-card';
      card.setAttribute('aria-label', 'Card');

      const inner = document.createElement('div');
      inner.className = 'memory-card-inner';

      const front = document.createElement('div');
      front.className = 'memory-card-front';
      front.textContent = '?';

      const back = document.createElement('div');
      back.className = 'memory-card-back';
      back.textContent = this.symbols[this.cards[i]];

      inner.appendChild(front);
      inner.appendChild(back);
      card.appendChild(inner);

      card.addEventListener('click', () => this.flipCard(i));
      this.cardElements.push(card);
      boardEl.appendChild(card);
    }

    this.container.appendChild(boardEl);
  }

  playSolvedAnimation() {
    this.cardElements.forEach((card, i) => {
      card.classList.add('solved-pop');
      card.style.animationDelay = `${i * 30}ms`;
    });
  }
}
