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
    // Each cell is 25% of the board (100% / 4)
    // Small gap via calc to leave space between tiles
    const cellPct = 100 / GRID_SIZE;
    const gapPx = 4;
    return {
      top: `calc(${row * cellPct}% + ${gapPx}px)`,
      left: `calc(${col * cellPct}% + ${gapPx}px)`,
      width: `calc(${cellPct}% - ${gapPx * 2}px)`,
      height: `calc(${cellPct}% - ${gapPx * 2}px)`,
    };
  }

  renderInitial() {
    this.container.innerHTML = '';
    this.tileElements = {};

    const boardEl = document.createElement('div');
    boardEl.className = 'numpuz-board';

    this.boardEl = boardEl;
    this.container.appendChild(boardEl);

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
