const GRID_SIZE = 4;
const TILE_COUNT = GRID_SIZE * GRID_SIZE;

export class NumPuz {
  constructor(container, callbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.board = [];
    this.moves = 0;
    this.firstMoveMade = false;
    this.solved = false;
    this.tileElements = {};
    this.boardEl = null;
  }

  init() {
    this.board = this.generateSolvableBoard();
    this.moves = 0;
    this.firstMoveMade = false;
    this.solved = false;
    this.renderInitial();
  }

  countInversions(board) {
    let inversions = 0;
    const values = board.filter(v => v !== 0);
    for (let i = 0; i < values.length; i++) {
      for (let j = i + 1; j < values.length; j++) {
        if (values[i] > values[j]) inversions++;
      }
    }
    return inversions;
  }

  isSolvable(board) {
    const inversions = this.countInversions(board);
    const emptyIndex = board.indexOf(0);
    const emptyRowFromBottom = GRID_SIZE - Math.floor(emptyIndex / GRID_SIZE);
    return (inversions + emptyRowFromBottom) % 2 === 0;
  }

  generateSolvableBoard() {
    let board;
    do {
      board = this.shuffle([...Array(TILE_COUNT).keys()]);
    } while (!this.isSolvable(board) || this.isSolved(board));
    return board;
  }

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  isSolved(board) {
    for (let i = 0; i < TILE_COUNT - 1; i++) {
      if (board[i] !== i + 1) return false;
    }
    return board[TILE_COUNT - 1] === 0;
  }

  getEmptyIndex() {
    return this.board.indexOf(0);
  }

  canMove(tileIndex) {
    const emptyIndex = this.getEmptyIndex();
    const tileRow = Math.floor(tileIndex / GRID_SIZE);
    const tileCol = tileIndex % GRID_SIZE;
    const emptyRow = Math.floor(emptyIndex / GRID_SIZE);
    const emptyCol = emptyIndex % GRID_SIZE;

    const rowDiff = Math.abs(tileRow - emptyRow);
    const colDiff = Math.abs(tileCol - emptyCol);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  }

  moveTile(value) {
    if (this.solved) return;
    const tileIndex = this.board.indexOf(value);
    if (tileIndex === -1) return;
    if (!this.canMove(tileIndex)) return;

    const emptyIndex = this.getEmptyIndex();
    [this.board[tileIndex], this.board[emptyIndex]] =
      [this.board[emptyIndex], this.board[tileIndex]];

    this.moves++;

    if (!this.firstMoveMade) {
      this.firstMoveMade = true;
      this.callbacks.onFirstMove();
    }

    this.callbacks.onMove(this.moves);
    this.updatePositions();

    if (this.isSolved(this.board)) {
      this.solved = true;
      setTimeout(() => {
        this.playSolvedAnimation();
        this.callbacks.onSolve(this.moves);
      }, 180);
    }
  }

  getTilePosition(index) {
    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;
    // gap between tiles and from edge to tile should be equal
    const gap = 6;
    // Total gaps: edge + (GRID_SIZE - 1) inner gaps + edge = GRID_SIZE + 1 gaps
    // But we use percentages, so express edge as px offset and tile size subtracts its share
    const totalGaps = GRID_SIZE + 1; // 5 gaps for 4 tiles
    const tileSize = `calc((100% - ${totalGaps * gap}px) / ${GRID_SIZE})`;
    const top = `calc(${gap}px + ${row} * (${tileSize} + ${gap}px))`;
    const left = `calc(${gap}px + ${col} * (${tileSize} + ${gap}px))`;
    return { top, left, width: tileSize, height: tileSize };
  }

  // Swipe: determine direction and move the tile that would slide into the empty space
  moveByDirection(dx, dy) {
    if (this.solved) return;
    const emptyIndex = this.getEmptyIndex();
    const emptyRow = Math.floor(emptyIndex / GRID_SIZE);
    const emptyCol = emptyIndex % GRID_SIZE;

    // The tile to move is opposite the swipe direction relative to empty
    const sourceRow = emptyRow - dy;
    const sourceCol = emptyCol - dx;

    if (sourceRow < 0 || sourceRow >= GRID_SIZE || sourceCol < 0 || sourceCol >= GRID_SIZE) return;

    const sourceIndex = sourceRow * GRID_SIZE + sourceCol;
    const value = this.board[sourceIndex];
    if (value !== 0) {
      this.moveTile(value);
    }
  }

  setupSwipe(boardEl) {
    let startX = 0;
    let startY = 0;
    let tracking = false;

    boardEl.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      tracking = true;
    }, { passive: true });

    boardEl.addEventListener('touchmove', (e) => {
      if (!tracking) return;
      // Prevent scrolling while swiping on the board
      e.preventDefault();
    }, { passive: false });

    boardEl.addEventListener('touchend', (e) => {
      if (!tracking) return;
      tracking = false;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = endX - startX;
      const diffY = endY - startY;
      const absDiffX = Math.abs(diffX);
      const absDiffY = Math.abs(diffY);

      // Minimum 20px swipe to distinguish from a tap
      const MIN_SWIPE = 20;
      if (absDiffX < MIN_SWIPE && absDiffY < MIN_SWIPE) return;

      if (absDiffX > absDiffY) {
        // Horizontal swipe
        this.moveByDirection(diffX > 0 ? 1 : -1, 0);
      } else {
        // Vertical swipe
        this.moveByDirection(0, diffY > 0 ? 1 : -1);
      }
    }, { passive: true });
  }

  renderInitial() {
    this.container.innerHTML = '';
    this.tileElements = {};

    const boardEl = document.createElement('div');
    boardEl.className = 'numpuz-board';

    this.boardEl = boardEl;
    this.container.appendChild(boardEl);
    this.setupSwipe(boardEl);

    // Wait a frame for the board to get its size
    requestAnimationFrame(() => {
      for (let value = 1; value < TILE_COUNT; value++) {
        const tile = document.createElement('div');
        tile.className = 'numpuz-tile';
        tile.textContent = value;
        tile.addEventListener('click', () => this.moveTile(value));
        this.tileElements[value] = tile;
        boardEl.appendChild(tile);
      }
      this.updatePositions();
    });
  }

  updatePositions() {
    this.board.forEach((value, index) => {
      if (value === 0) return;
      const tile = this.tileElements[value];
      const pos = this.getTilePosition(index);
      tile.style.top = pos.top;
      tile.style.left = pos.left;
      tile.style.width = pos.width;
      tile.style.height = pos.height;
      tile.classList.toggle('correct', value === index + 1);
    });
  }

  playSolvedAnimation() {
    Object.values(this.tileElements).forEach((tile, i) => {
      tile.classList.add('solved-pop');
      tile.style.animationDelay = `${i * 30}ms`;
    });
  }
}
