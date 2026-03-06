const GRID_SIZE = 4;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;
const MIN_SCRAMBLE_MOVES = 6;
const MAX_SCRAMBLE_MOVES = 10;

export class LightsOut {
  constructor(container, callbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.grid = [];
    this.moves = 0;
    this.firstMoveMade = false;
    this.solved = false;
    this.cellElements = [];
  }

  init() {
    this.grid = this.generatePuzzle();
    this.moves = 0;
    this.firstMoveMade = false;
    this.solved = false;
    this.render();
  }

  generatePuzzle() {
    // Start from all-off and apply random toggles to guarantee solvability
    const grid = new Array(TOTAL_CELLS).fill(false);
    const numMoves = MIN_SCRAMBLE_MOVES + Math.floor(Math.random() * (MAX_SCRAMBLE_MOVES - MIN_SCRAMBLE_MOVES + 1));
    const usedCells = new Set();

    // Apply random unique toggles so the puzzle isn't trivially short
    while (usedCells.size < numMoves) {
      const cell = Math.floor(Math.random() * TOTAL_CELLS);
      if (usedCells.has(cell)) continue;
      usedCells.add(cell);
      this.applyToggle(grid, cell);
    }

    // Ensure at least some lights are on
    if (grid.every(v => !v)) {
      return this.generatePuzzle();
    }

    return grid;
  }

  applyToggle(grid, index) {
    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;

    grid[index] = !grid[index];
    if (row > 0) grid[index - GRID_SIZE] = !grid[index - GRID_SIZE];
    if (row < GRID_SIZE - 1) grid[index + GRID_SIZE] = !grid[index + GRID_SIZE];
    if (col > 0) grid[index - 1] = !grid[index - 1];
    if (col < GRID_SIZE - 1) grid[index + 1] = !grid[index + 1];
  }

  toggle(index) {
    if (this.solved) return;

    if (!this.firstMoveMade) {
      this.firstMoveMade = true;
      this.callbacks.onFirstMove();
    }

    this.applyToggle(this.grid, index);
    this.moves++;
    this.callbacks.onMove(this.moves);
    this.updateCells();

    if (this.grid.every(v => !v)) {
      this.solved = true;
      setTimeout(() => {
        this.playSolvedAnimation();
        this.callbacks.onSolve(this.moves);
      }, 200);
    }
  }

  updateCells() {
    this.grid.forEach((on, i) => {
      this.cellElements[i].classList.toggle('lit', on);
    });
  }

  render() {
    this.container.innerHTML = '';
    this.cellElements = [];

    const boardEl = document.createElement('div');
    boardEl.className = 'lights-board';

    for (let i = 0; i < TOTAL_CELLS; i++) {
      const cell = document.createElement('button');
      cell.className = 'lights-cell' + (this.grid[i] ? ' lit' : '');
      cell.setAttribute('aria-label', `Cell ${Math.floor(i / GRID_SIZE) + 1},${(i % GRID_SIZE) + 1}`);
      cell.addEventListener('click', () => this.toggle(i));
      this.cellElements.push(cell);
      boardEl.appendChild(cell);
    }

    this.container.appendChild(boardEl);
  }

  playSolvedAnimation() {
    this.cellElements.forEach((cell, i) => {
      cell.classList.add('solved-pop');
      cell.style.animationDelay = `${i * 25}ms`;
    });
  }
}
