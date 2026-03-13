import { BOARD_SIZE } from "../app/constants";
import type { CellData, CellState } from "../app/gameState";

function createCell(x: number, y: number): CellData {
  return {
    x,
    y,
    state: "empty",
  };
}

export function createBoard(): CellData[][] {
  return Array.from({ length: BOARD_SIZE }, (_, y) =>
    Array.from({ length: BOARD_SIZE }, (_, x) => createCell(x, y)),
  );
}

export function cloneBoard(board: CellData[][]): CellData[][] {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

export function isInsideBoard(x: number, y: number) {
  return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;
}

export function getCell(board: CellData[][], x: number, y: number) {
  return board[y]?.[x] ?? null;
}

export function setCellState(
  board: CellData[][],
  x: number,
  y: number,
  state: CellState,
  shipId?: string,
) {
  if (!isInsideBoard(x, y)) {
    return;
  }

  board[y][x] = {
    ...board[y][x],
    state,
    shipId,
  };
}
