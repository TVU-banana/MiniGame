export class Board {
  constructor(size = 15) {
    this.size = size;
    this.cells = Board.createEmpty(size);
    this.moveHistory = [];
  }

  static createEmpty(size) {
    return Array.from({ length: size }, () => Array(size).fill(0));
  }

  cloneCells() {
    return this.cells.map((row) => [...row]);
  }

  reset() {
    this.cells = Board.createEmpty(this.size);
    this.moveHistory = [];
  }

  isInside(x, y) {
    return x >= 0 && x < this.size && y >= 0 && y < this.size;
  }

  isEmpty(x, y) {
    return this.isInside(x, y) && this.cells[y][x] === 0;
  }

  getCell(x, y) {
    if (!this.isInside(x, y)) {
      return null;
    }
    return this.cells[y][x];
  }

  placeStone(x, y, player) {
    if (!this.isEmpty(x, y)) {
      return false;
    }
    this.cells[y][x] = player;
    this.moveHistory.push({ x, y, player });
    return true;
  }

  getAvailableMoves() {
    const moves = [];
    for (let y = 0; y < this.size; y += 1) {
      for (let x = 0; x < this.size; x += 1) {
        if (this.cells[y][x] === 0) {
          moves.push({ x, y });
        }
      }
    }
    return moves;
  }

  isFull() {
    return this.moveHistory.length >= this.size * this.size;
  }
}
