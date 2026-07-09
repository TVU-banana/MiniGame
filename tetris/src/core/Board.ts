import { BOARD_HEIGHT, BOARD_WIDTH } from "../app/GameConfig";
import type { Cell, TetrominoType } from "../app/GameConfig";

export type BoardCell = TetrominoType | null;

export class Board {
  private cells: BoardCell[][] = [];

  constructor() {
    this.reset();
  }

  reset(): void {
    this.cells = Array.from({ length: BOARD_HEIGHT }, () =>
      Array.from({ length: BOARD_WIDTH }, () => null)
    );
  }

  getCell(x: number, y: number): BoardCell {
    if (!this.isInsideBoard(x, y)) {
      return null;
    }
    return this.cells[y][x];
  }

  getRows(): ReadonlyArray<ReadonlyArray<BoardCell>> {
    return this.cells;
  }

  isInsideBoard(x: number, y: number): boolean {
    return x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT;
  }

  canPlace(cells: Cell[]): boolean {
    for (const cell of cells) {
      if (cell.x < 0 || cell.x >= BOARD_WIDTH || cell.y >= BOARD_HEIGHT) {
        return false;
      }
      if (cell.y >= 0 && this.cells[cell.y][cell.x] !== null) {
        return false;
      }
    }
    return true;
  }

  lockPiece(cells: Cell[], type: TetrominoType): { lockedCells: number; overflow: boolean } {
    let overflow = false;
    let lockedCells = 0;
    for (const cell of cells) {
      if (cell.y < 0) {
        overflow = true;
        continue;
      }
      if (this.isInsideBoard(cell.x, cell.y)) {
        this.cells[cell.y][cell.x] = type;
        lockedCells += 1;
      }
    }
    return { lockedCells, overflow };
  }

  clearFullLines(): number {
    const remainingRows: BoardCell[][] = [];
    let cleared = 0;

    for (let y = BOARD_HEIGHT - 1; y >= 0; y -= 1) {
      const row = this.cells[y];
      const isFull = row.every((cell) => cell !== null);
      if (isFull) {
        cleared += 1;
      } else {
        remainingRows.unshift([...row]);
      }
    }

    while (remainingRows.length < BOARD_HEIGHT) {
      remainingRows.unshift(Array.from({ length: BOARD_WIDTH }, () => null));
    }

    this.cells = remainingRows;
    return cleared;
  }
}
