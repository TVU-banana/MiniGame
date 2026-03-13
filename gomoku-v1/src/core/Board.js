import { BOARD_SIZE, EMPTY } from "../constants/game.js";

function createGrid() {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(EMPTY));
}

export default class Board {
  constructor(grid = createGrid(), moveHistory = []) {
    this.grid = grid;
    this.moveHistory = moveHistory;
  }

  static create() {
    return new Board();
  }

  clone() {
    return new Board(
      this.grid.map((row) => [...row]),
      this.moveHistory.map((move) => ({ ...move })),
    );
  }

  isInside(x, y) {
    return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;
  }

  getCell(x, y) {
    if (!this.isInside(x, y)) {
      return null;
    }
    return this.grid[y][x];
  }

  isEmpty(x, y) {
    return this.getCell(x, y) === EMPTY;
  }

  placeStone(x, y, player) {
    if (!this.isInside(x, y) || !this.isEmpty(x, y)) {
      return null;
    }

    const nextGrid = this.grid.map((row) => [...row]);
    nextGrid[y][x] = player;

    const moveHistory = [
      ...this.moveHistory,
      {
        x,
        y,
        player,
        timestamp: Date.now(),
      },
    ];

    return new Board(nextGrid, moveHistory);
  }

  getOccupiedCells() {
    const cells = [];

    for (let y = 0; y < BOARD_SIZE; y += 1) {
      for (let x = 0; x < BOARD_SIZE; x += 1) {
        const player = this.grid[y][x];
        if (player !== EMPTY) {
          cells.push({ x, y, player });
        }
      }
    }

    return cells;
  }

  getLastMove() {
    return this.moveHistory.at(-1) ?? null;
  }

  isFull() {
    return this.moveHistory.length >= BOARD_SIZE * BOARD_SIZE;
  }
}
