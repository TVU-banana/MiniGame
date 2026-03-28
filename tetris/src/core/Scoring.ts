import { LINE_CLEAR_SCORE_PER_LINE, LOCK_SCORE_PER_CELL } from "../app/GameConfig";

export const getLockScore = (lockedCells: number): number => lockedCells * LOCK_SCORE_PER_CELL;

export const getLineClearScore = (linesCleared: number): number =>
  linesCleared * LINE_CLEAR_SCORE_PER_LINE;
